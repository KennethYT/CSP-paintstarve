"use client";

import Link from "next/link";
import { buildPeriodLabel, dayLabel, getBarColor, getFillPct, getStatus } from "@/lib/course-utils";
import { useClassroom } from "@/components/classroom-store";

export default function TeacherCoursesPage() {
  const classroom = useClassroom();
  const teacherCourses = classroom.courses.filter((course) => course.teacher === classroom.userName);

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="section-title">我的課程</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 14 }}>管理你開設的課程與搶課狀態</div>
        </div>
        <Link className="btn btn-brand" href="/teacher/courses/new" style={{ padding: "11px 18px", fontWeight: 900 }}>
          + 建立新課程
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {teacherCourses.map((course) => {
          const status = getStatus(course, classroom.now);

          return (
            <div key={course.id} className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ minWidth: 220 }}>
                <div style={{ fontWeight: 900, fontSize: 15.5 }}>{course.title}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{dayLabel(course.day)} {buildPeriodLabel(course.periodIndex)} · 📍 {course.location}</div>
              </div>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>已選 {course.enrolled} / {course.capacity}（候補 {course.waitlist.length}）</div>
                <div style={{ height: 6, background: "#F3F4F6", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${getFillPct(course.enrolled, course.capacity)}%`, background: getBarColor(course.enrolled, course.capacity) }} />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: status.color }}>{status.label}</span>
              <Link className="btn" href={`/teacher/courses/${course.id}/roster`} style={{ border: "1.5px solid var(--brand)", color: "var(--brand)", background: "#fff", fontWeight: 900, padding: "8px 14px" }}>
                查看名單
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}