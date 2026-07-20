"use client";

import { useMemo } from "react";
import { useClassroom } from "@/components/classroom-store";
import { getFillPct } from "@/lib/course-utils";

export default function TeacherDashboardPage() {
  const classroom = useClassroom();
  const dashboard = useMemo(() => {
    const teacherCourses = classroom.courses.filter((course) => course.teacher === classroom.userName);
    const totalCourses = teacherCourses.length;
    const totalEnrollments = teacherCourses.reduce((sum, course) => sum + course.enrolled, 0);
    const totalWaitlist = teacherCourses.reduce((sum, course) => sum + course.waitlist.length, 0);
    const totalCapacity = teacherCourses.reduce((sum, course) => sum + course.capacity, 0) || 1;
    const avgFillRate = Math.round((totalEnrollments / totalCapacity) * 100);
    const topCourses = [...teacherCourses]
      .sort((left, right) => right.enrolled / right.capacity - left.enrolled / left.capacity)
      .slice(0, 3)
      .map((course, index) => ({
        rank: index + 1,
        title: course.title,
        enrolled: course.enrolled,
        capacity: course.capacity,
        fillPct: getFillPct(course.enrolled, course.capacity)
      }));

    return { totalCourses, totalEnrollments, totalWaitlist, avgFillRate, topCourses };
  }, [classroom.courses, classroom.userName]);

  return (
    <section>
      <div className="section-title" style={{ marginBottom: 20 }}>課程總覽儀表板</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="總課程數" value={dashboard.totalCourses} />
        <StatCard label="總選課人次" value={dashboard.totalEnrollments} />
        <StatCard label="總候補人數" value={dashboard.totalWaitlist} />
        <StatCard label="平均額滿率" value={`${dashboard.avgFillRate}%`} />
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 14 }}>熱門課程排行</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {dashboard.topCourses.map((course) => (
            <div key={course.title}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
                <span style={{ fontWeight: 800 }}>#{course.rank} {course.title}</span>
                <span className="muted">{course.enrolled}/{course.capacity}（{course.fillPct}%）</span>
              </div>
              <div style={{ height: 7, background: "#F3F4F6", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${course.fillPct}%`, background: "var(--brand)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6, letterSpacing: "-0.04em" }}>{value}</div>
    </div>
  );
}