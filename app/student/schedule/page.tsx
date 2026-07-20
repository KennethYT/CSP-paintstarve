"use client";

import { useRouter } from "next/navigation";
import { dayLabels } from "@/lib/demo-data";
import { buildPeriodLabel, getDayCells } from "@/lib/course-utils";
import { useClassroom } from "@/components/classroom-store";

export default function StudentSchedulePage() {
  const classroom = useClassroom();
  const router = useRouter();
  const rows = getDayCells(classroom.courses, classroom.studentEnrollments);

  const enrollments = Object.entries(classroom.studentEnrollments).map(([courseId, enrollment]) => {
    const course = classroom.courses.find((item) => item.id === courseId);

    if (!course) {
      return null;
    }

    return {
      title: course.title,
      teacher: course.teacher,
      dayLabel: `週${dayLabels[course.day - 1]}`,
      periodTime: buildPeriodLabel(course.periodIndex),
      statusLabel: enrollment.status === "enrolled" ? "已確認" : `候補第 ${enrollment.position} 位`,
      badgeStyle: enrollment.status === "enrolled"
        ? "background:#DCFCE7;color:#15803D;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;"
        : "background:#FEF3C7;color:#B45309;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;"
    };
  }).filter(Boolean) as Array<{ title: string; teacher: string; dayLabel: string; periodTime: string; statusLabel: string; badgeStyle: string }>;

  return (
    <section>
      <div className="section-title">我的課表</div>
      <div className="muted" style={{ marginTop: 4, marginBottom: 22, fontSize: 14 }}>已搶到與候補中的課程一覽</div>

      {enrollments.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--muted)", borderStyle: "dashed" }}>
          尚未搶到任何課程，前往 <button className="btn" onClick={() => router.push("/student/browse")} style={{ background: "transparent", color: "var(--brand)", fontWeight: 900, padding: 0 }}>課程列表</button> 開始搶課吧！
        </div>
      ) : null}

      {enrollments.length > 0 ? (
        <>
          <div className="card" style={{ overflowX: "auto", marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "90px repeat(5,1fr)", minWidth: 640 }}>
              <div style={{ padding: 12, fontSize: 12, color: "#9CA3AF", fontWeight: 900, borderBottom: "1px solid #EDEBE6" }}>節次</div>
              {dayLabels.map((day) => (
                <div key={day} style={{ padding: 12, textAlign: "center", fontSize: 13, fontWeight: 900, borderBottom: "1px solid #EDEBE6", borderLeft: "1px solid #EDEBE6" }}>週{day}</div>
              ))}

              {rows.map((row) => (
                <div key={row.label} style={{ display: "contents" }}>
                  <div style={{ padding: 12, fontSize: 12, color: "var(--muted)", borderBottom: "1px solid #EDEBE6" }}>
                    <div style={{ fontWeight: 900 }}>{row.label}</div>
                    <div>{row.time}</div>
                  </div>
                  {row.cells.map((cell, index) => (
                    <div key={`${row.label}-${index}`} style={{ padding: 8, borderBottom: "1px solid #EDEBE6", borderLeft: "1px solid #EDEBE6", minHeight: 56 }}>
                      {cell.hasCourse ? (
                        <div style={styleFromText(cell.style ?? "")}>{cell.title}<div style={{ fontSize: 11, opacity: 0.85 }}>{cell.statusLabel}</div></div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {enrollments.map((item) => (
              <div key={`${item.title}-${item.dayLabel}`} className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14.5 }}>{item.title}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{item.teacher} 老師 · {item.dayLabel} {item.periodTime}</div>
                </div>
                <span style={styleFromText(item.badgeStyle)}>{item.statusLabel}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function styleFromText(styleText = "") {
  return styleText.split(";").filter(Boolean).reduce<Record<string, string>>((style, chunk) => {
    const [key, value] = chunk.split(":");
    if (key && value) {
      const cssKey = key.trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      style[cssKey] = value.trim();
    }
    return style;
  }, {});
}