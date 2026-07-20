"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedCourses } from "@/lib/demo-data";
import { getStatus } from "@/lib/course-utils";
import type { Course, EnrollmentState, ModalState, Role, ToastState } from "@/lib/types";

type ClassroomState = {
  now: number;
  role: Role | null;
  userName: string;
  courses: Course[];
  studentEnrollments: Record<string, EnrollmentState>;
  confirmModal: ModalState;
  toast: ToastState;
};

type ClassroomContextValue = ClassroomState & {
  login: (role: Role, name: string) => void;
  logout: () => void;
  grabCourse: (courseId: string) => void;
  createTeacherCourse: (course: Omit<Course, "id" | "enrolled" | "enrolledStudents" | "waitlist">) => void;
  dismissConfirmModal: () => void;
};

const ClassroomContext = createContext<ClassroomContextValue | null>(null);

const namesPool = [
  "陳品妤",
  "林彥廷",
  "張宜蓁",
  "黃冠傑",
  "吳佳穎",
  "蔡宗翰",
  "李欣妍",
  "許家瑋",
  "謝雨柔",
  "鄭博文"
];

function createInitialState(): ClassroomState {
  const now = Date.now();

  return {
    now,
    role: null,
    userName: "",
    courses: seedCourses(now),
    studentEnrollments: {},
    confirmModal: null,
    toast: null
  };
}

export function ClassroomProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<ClassroomState>(createInitialState);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setState((current) => ({ ...current, now: Date.now() }));
    }, 1000);

    const drain = window.setInterval(() => {
      setState((current) => {
        let nextCourses = current.courses;

        for (const course of current.courses) {
          const status = getStatus(course, current.now, current.studentEnrollments[course.id]);

          if (course.hot && status.phase === "open" && Math.random() < 0.35 && course.enrolled < course.capacity) {
            const studentIndex = course.enrolled % namesPool.length;
            nextCourses = nextCourses.map((candidate) =>
              candidate.id === course.id
                ? {
                    ...candidate,
                    enrolled: candidate.enrolled + 1,
                    enrolledStudents: candidate.enrolledStudents.concat([
                      {
                        name: namesPool[studentIndex],
                        id: `SX${1000 + candidate.enrolled}`
                      }
                    ])
                  }
                : candidate
            );
          }
        }

        return { ...current, courses: nextCourses };
      });
    }, 2500);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(drain);
    };
  }, []);

  const value = useMemo<ClassroomContextValue>(() => {
    const showToast = (message: string) => {
      setState((current) => ({ ...current, toast: { message } }));
      window.setTimeout(() => {
        setState((current) => ({ ...current, toast: null }));
      }, 2600);
    };

    const login = (role: Role, name: string) => {
      setState((current) => {
        let nextCourses = current.courses;

        if (role === "teacher" && !current.courses.some((course) => course.teacher === name)) {
          const now = Date.now();

          nextCourses = current.courses.concat([
            {
              id: `seed-${name}`,
              title: "示範課程：專題研究方法",
              teacher: name,
              category: "資訊",
              day: 3,
              periodIndex: 0,
              location: "研究大樓 401",
              description: "帶領學生完成一份完整的專題研究提案，涵蓋文獻回顧與研究設計。",
              syllabus: ["第1週：主題選定", "第2週：文獻回顧", "第3週：研究方法設計", "第4週：提案報告"],
              capacity: 20,
              enrolled: 18,
              openAt: now - 999999,
              hot: false,
              enrolledStudents: namesPool.map((student, index) => ({ name: student, id: `D10${100 + index}` })),
              waitlist: [
                { name: "洪韋辰", position: 1 },
                { name: "邱思瑀", position: 2 }
              ]
            }
          ]);
        }

        return {
          ...current,
          role,
          userName: name,
          courses: nextCourses
        };
      });
    };

    const logout = () => {
      setState((current) => ({
        ...current,
        role: null,
        userName: ""
      }));
    };

    const grabCourse = (courseId: string) => {
      setState((current) => {
        if (!current.role || current.studentEnrollments[courseId]) {
          return current;
        }

        const course = current.courses.find((candidate) => candidate.id === courseId);

        if (!course || current.now < course.openAt) {
          return current;
        }

        if (course.enrolled < course.capacity) {
          const studentId = `S99${Math.floor(Math.random() * 900 + 100)}`;

          return {
            ...current,
            courses: current.courses.map((candidate) =>
              candidate.id === courseId
                ? {
                    ...candidate,
                    enrolled: candidate.enrolled + 1,
                    enrolledStudents: candidate.enrolledStudents.concat([{ name: current.userName, id: studentId }])
                  }
                : candidate
            ),
            studentEnrollments: { ...current.studentEnrollments, [courseId]: { status: "enrolled" } },
            confirmModal: {
              icon: "🎉",
              title: "搶課成功",
              body: `已為你保留「${course.title}」的座位，可至「我的課表」查看。`
            }
          };
        }

        const position = course.waitlist.length + 1;

        return {
          ...current,
          courses: current.courses.map((candidate) =>
            candidate.id === courseId
              ? {
                  ...candidate,
                  waitlist: candidate.waitlist.concat([{ name: current.userName, position }])
                }
              : candidate
          ),
          studentEnrollments: { ...current.studentEnrollments, [courseId]: { status: "waitlist", position } },
          confirmModal: {
            icon: "⏳",
            title: "已加入候補",
            body: `「${course.title}」目前候補排序第 ${position} 位，額滿後將依序遞補。`
          }
        };
      });
    };

    const createTeacherCourse = (course: Omit<Course, "id" | "enrolled" | "enrolledStudents" | "waitlist">) => {
      setState((current) => ({
        ...current,
        courses: current.courses.concat([
          {
            ...course,
            id: `c${Date.now()}`,
            enrolled: 0,
            enrolledStudents: [],
            waitlist: []
          }
        ])
      }));
      showToast("課程建立成功");
    };

    const dismissConfirmModal = () => {
      setState((current) => ({ ...current, confirmModal: null }));
    };

    return {
      ...state,
      login,
      logout,
      grabCourse,
      createTeacherCourse,
      dismissConfirmModal
    };
  }, [state]);

  return <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>;
}

export function useClassroom() {
  const context = useContext(ClassroomContext);

  if (!context) {
    throw new Error("useClassroom must be used within ClassroomProvider");
  }

  return context;
}