import { periods } from "@/lib/demo-data";
import type { Course, EnrollmentState } from "@/lib/types";

const dayLabels = ["一", "二", "三", "四", "五"];

export function formatCountdown(ms: number) {
  if (ms <= 0) return "已開放";

  const totalSec = Math.floor(ms / 1000);

  if (totalSec > 86400) {
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    return `${days}天${hours}時後開放`;
  }

  if (totalSec > 3600) {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    return `${hours}時${minutes}分後開放`;
  }

  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} 後開搶`;
}

export function getStatus(course: Course, now: number, enrollment?: EnrollmentState) {
  if (enrollment) {
    if (enrollment.status === "enrolled") {
      return { phase: "my-enrolled", label: "✓ 已搶到", color: "#15803D" };
    }

    return { phase: "my-waitlist", label: `候補中 第${enrollment.position}位`, color: "#B45309" };
  }

  if (now < course.openAt) {
    return { phase: "upcoming", label: formatCountdown(course.openAt - now), color: "#6B7280" };
  }

  if (course.enrolled < course.capacity) {
    return { phase: "open", label: "搶課中", color: "#1D4ED8" };
  }

  return { phase: "full", label: "已額滿", color: "#B91C1C" };
}

export function getButtonStyle(phase: string) {
  const base = "padding: 9px 16px;border-radius: 10px;font-weight: 800;font-size: 13px;white-space: nowrap;";

  if (phase === "upcoming") return `${base}background:#F3F4F6;color:#9CA3AF;cursor:not-allowed;`;
  if (phase === "open") return `${base}background:#1D4ED8;color:#fff;cursor:pointer;`;
  if (phase === "full") return `${base}background:#FEF3C7;color:#B45309;cursor:pointer;`;
  if (phase === "my-enrolled") return `${base}background:#2b1c1c;color:#FCA5A5;cursor:pointer;border:1px solid #7F1D1D;`;
  if (phase === "my-waitlist") return `${base}background:#29211a;color:#FDBA74;cursor:pointer;border:1px solid #9A3412;`;
  return `${base}background:#1f1f1f;color:#d4d4d4;cursor:default;`;
}

export function getButtonLabel(phase: string) {
  if (phase === "upcoming") return "尚未開放";
  if (phase === "open") return "搶課";
  if (phase === "full") return "加入候補";
  if (phase === "my-enrolled") return "取消選課";
  if (phase === "my-waitlist") return "取消候補";
  return "候補中";
}

export function dayLabel(day: number) {
  return `週${dayLabels[day - 1] ?? day}`;
}

export function buildPeriodLabel(index: number) {
  return periods[index]?.time ?? "";
}

export function getFillPct(enrolled: number, capacity: number) {
  return Math.round((enrolled / Math.max(capacity, 1)) * 100);
}

export function getBarColor(enrolled: number, capacity: number) {
  return enrolled >= capacity ? "#B91C1C" : "#1D4ED8";
}

export function buildTeacherSeedCourseId(name: string) {
  // Use the raw name directly in the ID. URL encoding is handled at the Link/href
  // level so we avoid double-encoding when the ID passes through encodeURIComponent.
  return `seed-${name.trim()}`;
}

export function resolveRouteCourseId(rawCourseId: string) {
  // Next.js useParams already decodes the dynamic segment, so return as-is.
  // We keep a try/catch for safety in case of malformed percent sequences.
  try {
    return decodeURIComponent(rawCourseId);
  } catch {
    return rawCourseId;
  }
}

export function getDayCells(courses: Course[], enrollments: Record<string, EnrollmentState>) {
  return periods.map((period, periodIndex) => ({
    label: period.label,
    time: period.time,
    cells: [1, 2, 3, 4, 5].map((day) => {
      const course = courses.find(
        (candidate) => candidate.day === day && candidate.periodIndex === periodIndex && enrollments[candidate.id]
      );

      if (!course) return { hasCourse: false };

      const enrollment = enrollments[course.id];
      const enrolled = enrollment.status === "enrolled";

      return {
        hasCourse: true,
        title: course.title,
        statusLabel: enrolled ? "已確認" : "候補中",
        style: `background:${enrolled ? "#EFF6FF" : "#FFFBEB"};color:${enrolled ? "#1D4ED8" : "#B45309"};border-radius:10px;padding:8px;height:100%;`
      };
    })
  }));
}