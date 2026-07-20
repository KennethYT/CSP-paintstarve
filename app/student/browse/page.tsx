"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categories } from "@/lib/demo-data";
import { buildPeriodLabel, dayLabel, getBarColor, getButtonLabel, getButtonStyle, getFillPct, getStatus } from "@/lib/course-utils";
import { useClassroom } from "@/components/classroom-store";

export default function StudentBrowsePage() {
  const classroom = useClassroom();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");

  const courses = useMemo(() => {
    return classroom.courses.filter((course) => {
      const matchCategory = categoryFilter === "全部" || course.category === categoryFilter;
      const matchSearch = course.title.includes(search) || course.teacher.includes(search);
      return matchCategory && matchSearch;
    });
  }, [categoryFilter, classroom.courses, search]);

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div className="section-title">課程列表</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 14 }}>開搶瞬間名額即時變動，把握時機搶課</div>
        </div>
        <input className="input" style={{ maxWidth: 280 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋課程名稱或教師…" />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {["全部", ...categories].map((category) => (
          <button
            key={category}
            className="btn"
            onClick={() => setCategoryFilter(category)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: categoryFilter === category ? "var(--brand)" : "#fff",
              color: categoryFilter === category ? "#fff" : "#4B5563",
              border: `1.5px solid ${categoryFilter === category ? "var(--brand)" : "#E5E7EB"}`,
              fontSize: 13,
              fontWeight: 800
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid-auto">
        {courses.map((course) => {
          const status = getStatus(course, classroom.now, classroom.studentEnrollments[course.id]);
          const actionable = status.phase === "open" || status.phase === "full";

          return (
            <article key={course.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <Link href={`/student/browse/${course.id}`} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.35 }}>{course.title}</div>
                  <span className="badge" style={{ background: "#F3F4F6", color: "#4B5563" }}>{course.category}</span>
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{course.teacher} 老師 · {dayLabel(course.day)} {buildPeriodLabel(course.periodIndex)}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>📍 {course.location}</div>
              </Link>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                  <span>名額</span>
                  <span>已選 <b className="pulse" style={{ color: "var(--text)" }}>{course.enrolled}</b> / {course.capacity}</span>
                </div>
                <div style={{ height: 6, background: "#F3F4F6", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${getFillPct(course.enrolled, course.capacity)}%`, background: getBarColor(course.enrolled, course.capacity), transition: "width .4s ease" }} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: status.color }}>{status.label}</span>
                <button className="btn" style={{ ...styleFromText(getButtonStyle(status.phase)) }} disabled={!actionable} onClick={() => actionable ? classroom.grabCourse(course.id) : undefined}>
                  {getButtonLabel(status.phase)}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function styleFromText(styleText: string) {
  return styleText.split(";").filter(Boolean).reduce<Record<string, string>>((style, chunk) => {
    const [key, value] = chunk.split(":");
    if (key && value) {
      const cssKey = key.trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      style[cssKey] = value.trim();
    }
    return style;
  }, {});
}