"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { categories, dayLabels, periods } from "@/lib/demo-data";
import type { CourseCategory, OpenMode } from "@/lib/types";
import { useClassroom } from "@/components/classroom-store";

export default function TeacherCreateCoursePage() {
  const classroom = useClassroom();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    category: "資訊" as CourseCategory,
    brief: "",
    syllabus: "",
    day: 1,
    periodIndex: 0,
    location: "",
    capacity: 30,
    openMode: "now" as OpenMode
  });

  return (
    <section style={{ maxWidth: 640 }}>
      <button className="btn" onClick={() => router.push("/teacher/courses")} style={{ background: "transparent", color: "#6B7280", fontWeight: 800, marginBottom: 16 }}>
        ← 回到我的課程
      </button>
      <div className="section-title" style={{ marginBottom: 20 }}>建立課程</div>

      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="課程名稱" style ={{ color: "var(--subtitle)" }}>
          <input className="input" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="例如：資料結構與演算法" />
        </Field>

        <Field label="課程簡介">
          <textarea className="textarea" rows={3} value={form.brief} onChange={(event) => setForm((current) => ({ ...current, brief: event.target.value }))} placeholder="一段簡短的課程介紹" />
        </Field>

        <Field label="課程大綱（每行一項）">
          <textarea className="textarea" rows={4} value={form.syllabus} onChange={(event) => setForm((current) => ({ ...current, syllabus: event.target.value }))} placeholder="第一週：課程介紹\n第二週：…" />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="分類">
            <select className="select" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as CourseCategory }))}>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="上課地點">
            <input className="input" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="例如：管理學院 302" />
          </Field>
          <Field label="上課星期">
            <select className="select" value={form.day} onChange={(event) => setForm((current) => ({ ...current, day: Number(event.target.value) }))}>
              {dayLabels.map((label, index) => (
                <option key={label} value={index + 1}>週{label}</option>
              ))}
            </select>
          </Field>
          <Field label="上課節次">
            <select className="select" value={form.periodIndex} onChange={(event) => setForm((current) => ({ ...current, periodIndex: Number(event.target.value) }))}>
              {periods.map((period, index) => (
                <option key={period.label} value={index}>{period.label}（{period.time}）</option>
              ))}
            </select>
          </Field>
          <Field label="名額">
            <input className="input" type="number" min={1} value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: Number(event.target.value) || 1 }))} />
          </Field>
          <Field label="搶課開放時間">
            <select className="select" value={form.openMode} onChange={(event) => setForm((current) => ({ ...current, openMode: event.target.value as OpenMode }))}>
              <option value="now">立即開放</option>
              <option value="soon">30 秒後開放（示範倒數）</option>
              <option value="tomorrow">明日開放</option>
            </select>
          </Field>
        </div>

        <button
          className="btn btn-brand"
          style={{ padding: 13, fontWeight: 900, marginTop: 6 }}
          onClick={() => {
            if (!form.title.trim()) {
              return;
            }

            const now = Date.now();
            const openAt = form.openMode === "now" ? now - 1000 : form.openMode === "soon" ? now + 30000 : now + 24 * 3600 * 1000;

            classroom.createTeacherCourse({
              title: form.title.trim(),
              teacher: classroom.userName,
              category: form.category,
              day: form.day,
              periodIndex: form.periodIndex,
              location: form.location.trim() || "教室未定",
              description: form.brief.trim() || "課程簡介尚未提供。",
              syllabus: form.syllabus.split("\n").map((line) => line.trim()).filter(Boolean),
              capacity: form.capacity,
              openAt,
              hot: false
            });
            router.push("/teacher/courses");
          }}
        >
          建立課程
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 900, color: "#374151", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}