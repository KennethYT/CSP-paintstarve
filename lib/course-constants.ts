import type { CourseCategory, Period } from "@/lib/types";

export const categories: CourseCategory[] = [
  "資訊",
  "人文藝術",
  "商管",
  "自然科學",
  "語言",
  "社會科學"
];

export const dayLabels = ["一", "二", "三", "四", "五"];

export const periods: Period[] = [
  { label: "第1節", time: "08:10-09:00" },
  { label: "第2節", time: "09:10-10:00" },
  { label: "第3節", time: "10:10-11:00" },
  { label: "第4節", time: "13:10-14:00" },
  { label: "第5節", time: "14:10-15:00" }
];

export function isCourseCategory(value: unknown): value is CourseCategory {
  return typeof value === "string" && categories.includes(value as CourseCategory);
}
