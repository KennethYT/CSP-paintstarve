export type Role = "student" | "teacher";
export type Screen =
  | "login"
  | "browse"
  | "detail"
  | "schedule"
  | "courses"
  | "create"
  | "dashboard"
  | "roster";

export type CourseCategory =
  | "資訊"
  | "人文藝術"
  | "商管"
  | "自然科學"
  | "語言"
  | "社會科學";

export type OpenMode = "now" | "soon" | "tomorrow";

export type EnrollmentState =
  | { status: "enrolled" }
  | { status: "waitlist"; position: number };

export type Course = {
  id: string;
  title: string;
  teacher: string;
  category: CourseCategory;
  day: number;
  periodIndex: number;
  location: string;
  description: string;
  syllabus: string[];
  capacity: number;
  enrolled: number;
  openAt: number;
  hot: boolean;
  enrolledStudents: Array<{ name: string; id: string }>;
  waitlist: Array<{ name: string; position: number }>;
};

export type CreateCourseForm = {
  title: string;
  category: CourseCategory;
  brief: string;
  syllabus: string;
  day: number;
  periodIndex: number;
  location: string;
  capacity: number;
  openMode: OpenMode;
};

export type ToastState = { message: string } | null;
export type ModalState =
  | { icon: string; title: string; body: string }
  | null;

export type LoginChoice = Role | null;

export type Period = {
  label: string;
  time: string;
};