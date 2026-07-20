"use client";

import { useMemo } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { buildPeriodLabel, dayLabel, getButtonLabel, getButtonStyle, getFillPct, getStatus } from "@/lib/course-utils";
import { useClassroom } from "@/components/classroom-store";

export default function StudentCourseDetailPage() {
  const classroom = useClassroom();
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const course = classroom.courses.find((item) => item.id === params.courseId);

  const detail = useMemo(() => {
    if (!course) {
      return null;
    }

    return {
      course,
      status: getStatus(course, classroom.now, classroom.studentEnrollments[course.id])
    };
  }, [classroom.now, classroom.studentEnrollments, course]);

  if (!detail) {
    notFound();
  }

  const actionable = detail.status.phase === "open" || detail.status.phase === "full" || detail.status.phase === "my-enrolled" || detail.status.phase === "my-waitlist";
  const isCancelAction = detail.status.phase === "my-enrolled" || detail.status.phase === "my-waitlist";

  return (
    <section>
      <button className="btn" onClick={() => router.push("/student/browse")} style={{ background: "transparent", color: "#6B7280", fontWeight: 800, marginBottom: 16 }}>
        ← 回到課程列表
      </button>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <span className="badge" style={{ background: "#F3F4F6", color: "#4B5563" }}>{detail.course.category}</span>
            <div style={{ fontSize: 28, fontWeight: 900, marginTop: 10, letterSpacing: "-0.04em" }}>{detail.course.title}</div>
            <div className="muted" style={{ fontSize: 14, marginTop: 8 }}>{detail.course.teacher} 老師 · {dayLabel(detail.course.day)} {buildPeriodLabel(detail.course.periodIndex)} · 📍 {detail.course.location}</div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>課程簡介</div>
          <div style={{ color: "#374151", fontSize: 14, lineHeight: 1.75 }}>{detail.course.description}</div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>課程大綱</div>
          <div style={{ display: "grid", gap: 6 }}>
            {detail.course.syllabus.map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, color: "#374151", fontSize: 14, lineHeight: 1.8 }}>
                <span style={{ color: "var(--brand)" }}>▸</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 26, background: "#F9FAFB", borderRadius: 16, padding: 18, border: "1px solid #EEF2F7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
            <span>剩餘名額</span>
            <span>已選 <b className="pulse" style={{ color: "var(--text)" }}>{detail.course.enrolled}</b> / {detail.course.capacity}</span>
          </div>
          <div style={{ height: 8, background: "#EDEBE6", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ height: "100%", background: getStatus(detail.course, classroom.now, classroom.studentEnrollments[detail.course.id]).color, width: `${getFillPct(detail.course.enrolled, detail.course.capacity)}%`, transition: "width .4s ease" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: detail.status.color }}>{detail.status.label}</span>
            <button
              className="btn"
              style={{ ...styleFromText(getButtonStyle(detail.status.phase)) }}
              disabled={!actionable}
              onClick={() => {
                if (!actionable) {
                  return;
                }

                if (isCancelAction) {
                  classroom.cancelEnrollment(detail.course.id);
                  return;
                }

                classroom.grabCourse(detail.course.id);
              }}
            >
              {getButtonLabel(detail.status.phase)}
            </button>
          </div>
        </div>
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