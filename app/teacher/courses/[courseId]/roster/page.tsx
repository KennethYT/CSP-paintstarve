"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useClassroom } from "@/components/classroom-store";
import { resolveRouteCourseId } from "@/lib/course-utils";

export default function TeacherRosterPage() {
  const classroom = useClassroom();
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const routeCourseId = resolveRouteCourseId(params.courseId);
  const course = classroom.courses.find((item) => item.id === routeCourseId && item.teacher === classroom.userName);

  if (!course) {
    notFound();
  }

  return (
    <section>
      <button className="btn" onClick={() => router.push("/teacher/courses")} style={{ background: "transparent", color: "#6B7280", fontWeight: 800, marginBottom: 16 }}>
        ← 回到我的課程
      </button>
      <div className="section-title">{course.title}</div>
      <div className="muted" style={{ marginTop: 4, marginBottom: 20, fontSize: 14 }}>已選 {course.enrolled} / {course.capacity} · 候補 {course.waitlist.length} 人</div>

      <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>已確認學生</div>
      <div className="card" style={{ overflow: "hidden", marginBottom: 22 }}>
        {course.enrolledStudents.map((student, index) => (
          <div key={student.id} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", borderBottom: index === course.enrolledStudents.length - 1 ? "none" : "1px solid #F3F4F6", fontSize: 14 }}>
            <span style={{ fontWeight: 700 }}>{student.name}</span>
            <span className="muted">{student.id}</span>
          </div>
        ))}
      </div>

      {course.waitlist.length > 0 ? (
        <div>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>候補名單</div>
          <div className="card" style={{ overflow: "hidden" }}>
            {course.waitlist.map((student, index) => (
              <div key={`${student.name}-${student.position}`} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", borderBottom: index === course.waitlist.length - 1 ? "none" : "1px solid #F3F4F6", fontSize: 14 }}>
                <span style={{ fontWeight: 700 }}>{student.name}</span>
                <span style={{ color: "var(--warning)", fontWeight: 900 }}>候補第 {student.position} 位</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}