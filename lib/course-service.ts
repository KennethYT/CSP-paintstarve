import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  Course,
  CourseCategory,
  CourseRoster,
  CreateCoursePayload,
  EnrollmentState
} from "@/lib/types";

export type CoursesSnapshot = {
  courses: Course[];
  enrollments: Record<string, EnrollmentState>;
};

/** 領域錯誤，由 route handler 轉成對應的 HTTP 狀態碼。 */
export class CourseError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "CourseError";
  }
}

type CourseRow = {
  id: string;
  title: string;
  teacherId: string;
  category: string;
  day: number;
  periodIndex: number;
  location: string;
  description: string;
  syllabus: string[];
  capacity: number;
  openAt: Date;
  hot: boolean;
  teacher: { name: string };
};

function toCourse(row: CourseRow, enrolled: number, waitlistCount: number): Course {
  return {
    id: row.id,
    title: row.title,
    teacher: row.teacher.name,
    teacherId: row.teacherId,
    category: row.category as CourseCategory,
    day: row.day,
    periodIndex: row.periodIndex,
    location: row.location,
    description: row.description,
    syllabus: row.syllabus,
    capacity: row.capacity,
    enrolled,
    waitlistCount,
    openAt: row.openAt.getTime(),
    hot: row.hot
  };
}

/**
 * 取得所有課程 + 即時人數 + 這位使用者自己的選課狀態。
 * 人數用 groupBy 一次算完，不把全部選課紀錄拉回應用層。
 */
export async function getCoursesSnapshot(userId: string): Promise<CoursesSnapshot> {
  const [rows, counts, mine] = await Promise.all([
    prisma.course.findMany({
      include: { teacher: { select: { name: true } } },
      orderBy: [{ day: "asc" }, { periodIndex: "asc" }, { title: "asc" }]
    }),
    prisma.enrollment.groupBy({
      by: ["courseId", "status"],
      _count: { _all: true }
    }),
    prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true, status: true, position: true }
    })
  ]);

  const enrolledCounts = new Map<string, number>();
  const waitlistCounts = new Map<string, number>();

  for (const row of counts) {
    const target = row.status === "enrolled" ? enrolledCounts : waitlistCounts;
    target.set(row.courseId, row._count._all);
  }

  const enrollments: Record<string, EnrollmentState> = {};

  for (const row of mine) {
    enrollments[row.courseId] =
      row.status === "enrolled"
        ? { status: "enrolled" }
        : { status: "waitlist", position: row.position ?? 0 };
  }

  return {
    courses: rows.map((row) =>
      toCourse(row, enrolledCounts.get(row.id) ?? 0, waitlistCounts.get(row.id) ?? 0)
    ),
    enrollments
  };
}

export async function getCourse(courseId: string, userId: string) {
  const row = await prisma.course.findUnique({
    where: { id: courseId },
    include: { teacher: { select: { name: true } } }
  });

  if (!row) {
    throw new CourseError("找不到這門課程。", 404);
  }

  const [enrolled, waitlistCount, mine] = await Promise.all([
    prisma.enrollment.count({ where: { courseId, status: "enrolled" } }),
    prisma.enrollment.count({ where: { courseId, status: "waitlist" } }),
    prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: { status: true, position: true }
    })
  ]);

  const enrollment: EnrollmentState | null = mine
    ? mine.status === "enrolled"
      ? { status: "enrolled" }
      : { status: "waitlist", position: mine.position ?? 0 }
    : null;

  return { course: toCourse(row, enrolled, waitlistCount), enrollment };
}

/** 名單只有授課教師拿得到。 */
export async function getRoster(courseId: string, teacherId: string): Promise<CourseRoster> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true }
  });

  if (!course) {
    throw new CourseError("找不到這門課程。", 404);
  }

  if (course.teacherId !== teacherId) {
    throw new CourseError("只有授課教師可以查看選課名單。", 403);
  }

  const rows = await prisma.enrollment.findMany({
    where: { courseId },
    select: {
      status: true,
      position: true,
      createdAt: true,
      user: { select: { id: true, name: true } }
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });

  return {
    courseId,
    enrolledStudents: rows
      .filter((row) => row.status === "enrolled")
      .map((row) => ({ id: row.user.id, name: row.user.name })),
    waitlist: rows
      .filter((row) => row.status === "waitlist")
      .map((row) => ({ id: row.user.id, name: row.user.name, position: row.position ?? 0 }))
  };
}

export async function createCourse(teacherId: string, payload: CreateCoursePayload) {
  return prisma.course.create({
    data: {
      teacherId,
      title: payload.title,
      category: payload.category,
      day: payload.day,
      periodIndex: payload.periodIndex,
      location: payload.location,
      description: payload.description,
      syllabus: payload.syllabus,
      capacity: payload.capacity,
      openAt: new Date(payload.openAt)
    }
  });
}

/**
 * 對同一堂課取得交易層級的 advisory lock，讓針對這門課的搶課／退選請求排隊處理。
 *
 * 為什麼不用 Serializable 隔離等級：那個做法下，N 個人同時搶同一堂課會讓 Postgres
 * 中止其中大部分交易（P2034 寫入衝突），必須靠重試補救；實測 20 人搶 5 個名額時，
 * 重試 5 次仍有請求失敗。advisory lock 是「排隊」而不是「互相中止」，
 * 在開搶瞬間的高競爭下行為穩定得多，也不需要靠重試次數硬撐。
 *
 * 鎖會隨交易結束自動釋放（xact 版本），不需要手動解鎖。
 * 不同課程雜湊碰撞時只是多排一次隊，不影響正確性。
 */
async function lockCourse(tx: Prisma.TransactionClient, courseId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${courseId}, 0))`;
}

/** 交易設定：鎖住同一堂課後請求會排隊，等待時間要足以容納開搶瞬間的隊伍。 */
const TRANSACTION_OPTIONS = {
  maxWait: 15_000,
  timeout: 20_000
} as const;

/**
 * 保險機制：即使有 advisory lock，仍可能因為其他原因出現可重試的交易錯誤。
 */
async function withRetry<T>(run: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2028");

      if (!isRetryable) {
        throw error;
      }

      lastError = error;
      // 指數退避加抖動，避免重試又同時撞在一起
      const backoff = 2 ** attempt * 25 + Math.random() * 50;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw lastError;
}

export type GrabResult =
  | { status: "enrolled" }
  | { status: "waitlist"; position: number };

export async function grabCourse(courseId: string, userId: string): Promise<GrabResult> {
  return withRetry(() =>
    prisma.$transaction(
      async (tx) => {
        // 先排隊，之後的讀取與寫入就不會有其他人插進來
        await lockCourse(tx, courseId);

        const course = await tx.course.findUnique({
          where: { id: courseId },
          select: { capacity: true, openAt: true }
        });

        if (!course) {
          throw new CourseError("找不到這門課程。", 404);
        }

        if (Date.now() < course.openAt.getTime()) {
          throw new CourseError("這門課還沒開放搶課。", 409);
        }

        const existing = await tx.enrollment.findUnique({
          where: { courseId_userId: { courseId, userId } },
          select: { id: true }
        });

        if (existing) {
          throw new CourseError("你已經選過或候補這門課了。", 409);
        }

        const taken = await tx.enrollment.count({
          where: { courseId, status: "enrolled" }
        });

        if (taken < course.capacity) {
          await tx.enrollment.create({
            data: { courseId, userId, status: "enrolled" }
          });
          return { status: "enrolled" } as const;
        }

        const position =
          (await tx.enrollment.count({ where: { courseId, status: "waitlist" } })) + 1;

        await tx.enrollment.create({
          data: { courseId, userId, status: "waitlist", position }
        });

        return { status: "waitlist", position } as const;
      },
      TRANSACTION_OPTIONS
    )
  ).catch((error) => {
    // @@unique([courseId, userId]) 擋下併發的重複搶課
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new CourseError("你已經選過或候補這門課了。", 409);
    }

    throw error;
  });
}

export type CancelResult = {
  /** 被取消的是正取還是候補 */
  cancelled: "enrolled" | "waitlist";
  /** 因為這次退選而遞補上來的使用者 id（沒有就是 null） */
  promotedUserId: string | null;
};

export async function cancelEnrollment(courseId: string, userId: string): Promise<CancelResult> {
  return withRetry(() =>
    prisma.$transaction(
      async (tx) => {
        // 與搶課共用同一把鎖，遞補期間不會有人搶走剛空出來的位子
        await lockCourse(tx, courseId);

        const enrollment = await tx.enrollment.findUnique({
          where: { courseId_userId: { courseId, userId } },
          select: { id: true, status: true }
        });

        if (!enrollment) {
          throw new CourseError("你沒有選這門課。", 404);
        }

        await tx.enrollment.delete({ where: { id: enrollment.id } });

        if (enrollment.status === "waitlist") {
          // 取消候補後，把後面的人往前遞補號碼
          await resequenceWaitlist(tx, courseId);
          return { cancelled: "waitlist" as const, promotedUserId: null };
        }

        // 退掉正取名額後，候補第一位自動遞補
        const next = await tx.enrollment.findFirst({
          where: { courseId, status: "waitlist" },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: { id: true, userId: true }
        });

        if (!next) {
          return { cancelled: "enrolled" as const, promotedUserId: null };
        }

        await tx.enrollment.update({
          where: { id: next.id },
          data: { status: "enrolled", position: null }
        });

        await resequenceWaitlist(tx, courseId);

        return { cancelled: "enrolled" as const, promotedUserId: next.userId };
      },
      TRANSACTION_OPTIONS
    )
  );
}

/** 把候補名單的 position 重新排成連續的 1、2、3…… */
async function resequenceWaitlist(tx: Prisma.TransactionClient, courseId: string) {
  const remaining = await tx.enrollment.findMany({
    where: { courseId, status: "waitlist" },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, position: true }
  });

  // 交易共用一條連線，逐筆更新而非 Promise.all
  for (const [index, row] of remaining.entries()) {
    if (row.position !== index + 1) {
      await tx.enrollment.update({ where: { id: row.id }, data: { position: index + 1 } });
    }
  }
}
