"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, dayLabels, periods, seedCourses } from "@/lib/demo-data";
import {
  buildTeacherSeedCourseId,
  buildPeriodLabel,
  dayLabel,
  getBarColor,
  getButtonLabel,
  getButtonStyle,
  getDayCells,
  getFillPct,
  getStatus
} from "@/lib/course-utils";
import type {
  Course,
  CreateCourseForm,
  EnrollmentState,
  LoginChoice,
  ModalState,
  OpenMode,
  Role,
  Screen,
  ToastState
} from "@/lib/types";

type AppState = {
  now: number;
  role: LoginChoice;
  userName: string;
  loginChoice: LoginChoice;
  loginNameDraft: string;
  screen: Screen;
  search: string;
  categoryFilter: string;
  selectedCourseId: string | null;
  confirmModal: ModalState;
  toast: ToastState;
  studentEnrollments: Record<string, EnrollmentState>;
  createForm: CreateCourseForm;
  courses: Course[];
};

const initialState = (): AppState => {
  const now = Date.now();

  return {
    now,
    role: null,
    userName: "",
    loginChoice: null,
    loginNameDraft: "",
    screen: "login",
    search: "",
    categoryFilter: "全部",
    selectedCourseId: null,
    confirmModal: null,
    toast: null,
    studentEnrollments: {},
    createForm: {
      title: "",
      category: "資訊",
      brief: "",
      syllabus: "",
      day: 1,
      periodIndex: 0,
      location: "",
      capacity: 30,
      openMode: "now"
    },
    courses: seedCourses(now)
  };
};

type CourseCardVM = {
  id: string;
  title: string;
  teacher: string;
  category: string;
  dayLabel: string;
  periodTime: string;
  location: string;
  description: string;
  syllabus: string[];
  enrolled: number;
  capacity: number;
  fillPct: number;
  barColor: string;
  enrolledKey: string;
  statusLabel: string;
  statusColor: string;
  buttonStyle: string;
  buttonLabel: string;
  actionable: boolean;
};

export function ClassroomApp() {
  const [state, setState] = useState<AppState>(initialState);

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
            const studentIndex = course.enrolled % 10;
            nextCourses = nextCourses.map((candidate) =>
              candidate.id === course.id
                ? {
                    ...candidate,
                    enrolled: candidate.enrolled + 1,
                    enrolledStudents: candidate.enrolledStudents.concat([
                      {
                        name: ["陳品妤", "林彥廷", "張宜蓁", "黃冠傑", "吳佳穎", "蔡宗翰", "李欣妍", "許家瑋", "謝雨柔", "鄭博文"][studentIndex],
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

  const roleLabel = state.role === "teacher" ? "教師" : "學生";

  const showToast = (message: string) => {
    setState((current) => ({ ...current, toast: { message } }));
    window.setTimeout(() => {
      setState((current) => ({ ...current, toast: null }));
    }, 2600);
  };

  const openCourse = (courseId: string) => {
    setState((current) => ({ ...current, screen: "detail", selectedCourseId: courseId }));
  };

  const grabCourse = (courseId: string) => {
    setState((current) => {
      if (current.studentEnrollments[courseId]) {
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

  const login = () => {
    const choice = state.loginChoice;

    if (!choice) {
      showToast("請先選擇學生或教師身分");
      return;
    }

    const name = state.loginNameDraft.trim() || (choice === "teacher" ? "示範老師" : "示範學生");

    setState((current) => {
      let nextCourses = current.courses;

      if (choice === "teacher" && !current.courses.some((course) => course.teacher === name)) {
        const now = Date.now();

        nextCourses = current.courses.concat([
          {
            id: buildTeacherSeedCourseId(name),
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
            enrolledStudents: ["陳品妤", "林彥廷", "張宜蓁", "黃冠傑", "吳佳穎", "蔡宗翰", "李欣妍", "許家瑋", "謝雨柔", "鄭博文"].map((student, index) => ({
              name: student,
              id: `D10${100 + index}`
            })),
            waitlist: [
              { name: "洪韋辰", position: 1 },
              { name: "邱思瑀", position: 2 }
            ]
          }
        ]);
      }

      return {
        ...current,
        role: choice,
        userName: name,
        screen: choice === "teacher" ? "courses" : "browse",
        courses: nextCourses,
        loginChoice: choice
      };
    });
  };

  const logout = () => {
    setState((current) => ({
      ...current,
      role: null,
      userName: "",
      screen: "login",
      loginChoice: null,
      loginNameDraft: ""
    }));
  };

  const filteredCourses = useMemo(() => {
    return state.courses.filter((course) => {
      const matchCategory = state.categoryFilter === "全部" || course.category === state.categoryFilter;
      const matchSearch = course.title.includes(state.search) || course.teacher.includes(state.search);
      return matchCategory && matchSearch;
    });
  }, [state.categoryFilter, state.courses, state.search]);

  const selectedCourse = state.courses.find((course) => course.id === state.selectedCourseId) ?? null;
  const detail = selectedCourse ? buildCourseCardVM(selectedCourse, state) : null;

  const navTabs = state.role === "teacher"
    ? [
        { id: "courses" as const, label: "我的課程" },
        { id: "create" as const, label: "建立課程" },
        { id: "dashboard" as const, label: "儀表板" }
      ]
    : [
        { id: "browse" as const, label: "瀏覽課程" },
        { id: "schedule" as const, label: "我的課表" }
      ];

  const courseCards = filteredCourses.map((course) => buildCourseCardVM(course, state));
  const teacherCourses = state.courses.filter((course) => course.teacher === state.userName);
  const teacherRows = teacherCourses.map((course) => {
    const status = getStatus(course, state.now);

    return {
      title: course.title,
      dayLabel: dayLabel(course.day),
      periodTime: buildPeriodLabel(course.periodIndex),
      location: course.location,
      enrolled: course.enrolled,
      capacity: course.capacity,
      waitlistCount: course.waitlist.length,
      fillPct: getFillPct(course.enrolled, course.capacity),
      barColor: getBarColor(course.enrolled, course.capacity),
      statusLabel: status.label,
      statusColor: status.color,
      onRoster: () => setState((current) => ({ ...current, screen: "roster", selectedCourseId: course.id }))
    };
  });

  const scheduleRows = getDayCells(state.courses, state.studentEnrollments);

  const enrollmentList = Object.entries(state.studentEnrollments).map(([courseId, enrollment]) => {
    const course = state.courses.find((candidate) => candidate.id === courseId);

    if (!course) {
      return null;
    }

    return {
      title: course.title,
      teacher: course.teacher,
      dayLabel: dayLabel(course.day),
      periodTime: buildPeriodLabel(course.periodIndex),
      statusLabel: enrollment.status === "enrolled" ? "已確認" : `候補第 ${enrollment.position} 位`,
      badgeStyle: enrollment.status === "enrolled"
        ? "background:#DCFCE7;color:#15803D;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;"
        : "background:#FEF3C7;color:#B45309;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;"
    };
  }).filter(Boolean) as Array<{ title: string; teacher: string; dayLabel: string; periodTime: string; statusLabel: string; badgeStyle: string }>;

  const dashboard = useMemo(() => {
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
  }, [teacherCourses]);

  const roster = useMemo(() => {
    const course = state.courses.find((candidate) => candidate.id === state.selectedCourseId);

    if (!course) {
      return null;
    }

    return {
      title: course.title,
      enrolled: course.enrolled,
      capacity: course.capacity,
      waitlistCount: course.waitlist.length,
      students: course.enrolledStudents,
      waitlist: course.waitlist
    };
  }, [state.courses, state.selectedCourseId]);

  const isStudent = state.role === "student";

  return (
    <div className="app-shell">
      {!state.role ? (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div className="glass-panel fade-up" style={{ width: "100%", maxWidth: 420, borderRadius: 22, padding: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 900 }}>課</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em" }}>選課搶課系統</div>
                <div className="muted" style={{ fontSize: 14 }}>Next.js 16 版模擬登入</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
              <button
                className="btn"
                style={{ padding: 16, borderRadius: 16, border: `2px solid ${state.loginChoice === "student" ? "var(--brand)" : "#E5E7EB"}`, background: state.loginChoice === "student" ? "#EFF6FF" : "#fff", textAlign: "left", justifyContent: "flex-start" }}
                onClick={() => setState((current) => ({ ...current, loginChoice: "student" }))}
              >
                <span style={{ fontSize: 22 }}>🎓</span>
                <span>
                  <strong style={{ display: "block", fontSize: 14 }}>學生登入</strong>
                  <span className="muted" style={{ fontSize: 12 }}>瀏覽課程、搶課、查看課表</span>
                </span>
              </button>

              <button
                className="btn"
                style={{ padding: 16, borderRadius: 16, border: `2px solid ${state.loginChoice === "teacher" ? "var(--brand)" : "#E5E7EB"}`, background: state.loginChoice === "teacher" ? "#EFF6FF" : "#fff", textAlign: "left", justifyContent: "flex-start" }}
                onClick={() => setState((current) => ({ ...current, loginChoice: "teacher" }))}
              >
                <span style={{ fontSize: 22 }}>🧑‍🏫</span>
                <span>
                  <strong style={{ display: "block", fontSize: 14 }}>教師登入</strong>
                  <span className="muted" style={{ fontSize: 12 }}>管理課程、建立課程、查看名單</span>
                </span>
              </button>
            </div>

            {state.loginChoice ? (
              <div style={{ marginTop: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>姓名</label>
                <input
                  className="input"
                  value={state.loginNameDraft}
                  onChange={(event) => setState((current) => ({ ...current, loginNameDraft: event.target.value }))}
                  placeholder="請輸入姓名"
                />
                <button className="btn btn-brand" style={{ width: "100%", marginTop: 16, padding: 12, fontWeight: 900 }} onClick={login}>
                  以{state.loginChoice === "teacher" ? "教師" : "學生"}身份登入
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div>
          <header className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 20, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 900 }}>課</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>選課搶課系統</div>
              </div>

              <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {navTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className="btn tab"
                    data-active={state.screen === tab.id}
                    onClick={() => setState((current) => ({ ...current, screen: tab.id }))}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={{ background: state.role === "teacher" ? "#DBEAFE" : "#F3F4F6", color: state.role === "teacher" ? "var(--brand)" : "#4B5563" }}>
                    {roleLabel}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{state.userName}</span>
                </div>
                <button className="btn" onClick={logout} style={{ border: "1px solid #E5E7EB", background: "#fff", padding: "8px 12px", color: "#6B7280", fontWeight: 800 }}>
                  登出
                </button>
              </div>
            </div>
          </header>

          <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 80px" }}>
            {state.screen === "browse" ? (
              <section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
                  <div>
                    <div className="section-title">課程列表</div>
                    <div className="muted" style={{ marginTop: 4, fontSize: 14 }}>開搶瞬間名額即時變動，把握時機搶課</div>
                  </div>
                  <input
                    className="input"
                    style={{ maxWidth: 280 }}
                    value={state.search}
                    onChange={(event) => setState((current) => ({ ...current, search: event.target.value }))}
                    placeholder="搜尋課程名稱或教師…"
                  />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
                  {["全部", ...categories].map((category) => (
                    <button
                      key={category}
                      className="btn"
                      onClick={() => setState((current) => ({ ...current, categoryFilter: category }))}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        background: state.categoryFilter === category ? "var(--brand)" : "#fff",
                        color: state.categoryFilter === category ? "#fff" : "#4B5563",
                        border: `1.5px solid ${state.categoryFilter === category ? "var(--brand)" : "#E5E7EB"}`,
                        fontSize: 13,
                        fontWeight: 800
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="grid-auto">
                  {courseCards.map((card) => (
                    <article key={card.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div onClick={() => openCourse(card.id)} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                          <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.35 }}>{card.title}</div>
                          <span className="badge" style={{ background: "#F3F4F6", color: "#4B5563" }}>{card.category}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{card.teacher} 老師 · {card.dayLabel} {card.periodTime}</div>
                        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>📍 {card.location}</div>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                          <span>名額</span>
                          <span>已選 <b className="pulse" style={{ color: "var(--text)" }}>{card.enrolled}</b> / {card.capacity}</span>
                        </div>
                        <div style={{ height: 6, background: "#F3F4F6", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${card.fillPct}%`, background: card.barColor, transition: "width .4s ease" }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: card.statusColor }}>{card.statusLabel}</span>
                        <button
                          className="btn"
                          style={buttonStyleFromText(card.buttonStyle)}
                          disabled={!card.actionable}
                          onClick={() => card.actionable ? grabCourse(card.id) : undefined}
                        >
                          {card.buttonLabel}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {state.screen === "detail" && detail ? (
              <section>
                <button className="btn" onClick={() => setState((current) => ({ ...current, screen: "browse" }))} style={{ background: "transparent", color: "#6B7280", fontWeight: 800, marginBottom: 16 }}>
                  ← 回到課程列表
                </button>
                <div className="card" style={{ padding: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div>
                      <span className="badge" style={{ background: "#F3F4F6", color: "#4B5563" }}>{detail.category}</span>
                      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 10, letterSpacing: "-0.04em" }}>{detail.title}</div>
                      <div className="muted" style={{ fontSize: 14, marginTop: 8 }}>{detail.teacher} 老師 · {detail.dayLabel} {detail.periodTime} · 📍 {detail.location}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>課程簡介</div>
                    <div style={{ color: "#374151", fontSize: 14, lineHeight: 1.75 }}>{detail.description}</div>
                  </div>

                  <div style={{ marginTop: 22 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>課程大綱</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {detail.syllabus.map((item) => (
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
                      <span>已選 <b className="pulse" style={{ color: "var(--text)" }}>{detail.enrolled}</b> / {detail.capacity}</span>
                    </div>
                    <div style={{ height: 8, background: "#EDEBE6", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
                      <div style={{ height: "100%", background: detail.barColor, width: `${detail.fillPct}%`, transition: "width .4s ease" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 900, fontSize: 14, color: detail.statusColor }}>{detail.statusLabel}</span>
                      <button className="btn" style={buttonStyleFromText(detail.buttonStyle)} disabled={!detail.actionable} onClick={() => detail.actionable ? grabCourse(detail.id) : undefined}>
                        {detail.buttonLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {state.screen === "schedule" ? (
              <section>
                <div className="section-title">我的課表</div>
                <div className="muted" style={{ marginTop: 4, marginBottom: 22, fontSize: 14 }}>已搶到與候補中的課程一覽</div>

                {enrollmentList.length === 0 ? (
                  <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--muted)", borderStyle: "dashed" }}>
                    尚未搶到任何課程，前往 <button className="btn" onClick={() => setState((current) => ({ ...current, screen: "browse" }))} style={{ background: "transparent", color: "var(--brand)", fontWeight: 900, padding: 0 }}>課程列表</button> 開始搶課吧！
                  </div>
                ) : null}

                {enrollmentList.length > 0 ? (
                  <>
                    <div className="card" style={{ overflowX: "auto", marginBottom: 24 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "90px repeat(5,1fr)", minWidth: 640 }}>
                        <div style={{ padding: 12, fontSize: 12, color: "#9CA3AF", fontWeight: 900, borderBottom: "1px solid #EDEBE6" }}>節次</div>
                        {dayLabels.map((day) => (
                          <div key={day} style={{ padding: 12, textAlign: "center", fontSize: 13, fontWeight: 900, borderBottom: "1px solid #EDEBE6", borderLeft: "1px solid #EDEBE6" }}>週{day}</div>
                        ))}

                        {scheduleRows.map((row) => (
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
                      {enrollmentList.map((item) => (
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
            ) : null}

            {state.screen === "courses" ? (
              <section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div className="section-title">我的課程</div>
                    <div className="muted" style={{ marginTop: 4, fontSize: 14 }}>管理你開設的課程與搶課狀態</div>
                  </div>
                  <button className="btn btn-brand" onClick={() => setState((current) => ({ ...current, screen: "create" }))} style={{ padding: "11px 18px", fontWeight: 900 }}>
                    + 建立新課程
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {teacherRows.map((row) => (
                    <div key={`${row.title}-${row.dayLabel}`} className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 220 }}>
                        <div style={{ fontWeight: 900, fontSize: 15.5 }}>{row.title}</div>
                        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{row.dayLabel} {row.periodTime} · 📍 {row.location}</div>
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>已選 {row.enrolled} / {row.capacity}（候補 {row.waitlistCount}）</div>
                        <div style={{ height: 6, background: "#F3F4F6", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${row.fillPct}%`, background: row.barColor }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 900, color: row.statusColor }}>{row.statusLabel}</span>
                      <button className="btn" onClick={row.onRoster} style={{ border: "1.5px solid var(--brand)", color: "var(--brand)", background: "#fff", fontWeight: 900, padding: "8px 14px" }}>
                        查看名單
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {state.screen === "create" ? (
              <section style={{ maxWidth: 640 }}>
                <button className="btn" onClick={() => setState((current) => ({ ...current, screen: "courses" }))} style={{ background: "transparent", color: "#6B7280", fontWeight: 800, marginBottom: 16 }}>
                  ← 回到我的課程
                </button>
                <div className="section-title" style={{ marginBottom: 20 }}>建立課程</div>

                <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
                  <Field label="課程名稱">
                    <input
                      className="input"
                      value={state.createForm.title}
                      onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, title: event.target.value } }))}
                      placeholder="例如：資料結構與演算法"
                    />
                  </Field>

                  <Field label="課程簡介">
                    <textarea
                      className="textarea"
                      rows={3}
                      value={state.createForm.brief}
                      onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, brief: event.target.value } }))}
                      placeholder="一段簡短的課程介紹"
                    />
                  </Field>

                  <Field label="課程大綱（每行一項）">
                    <textarea
                      className="textarea"
                      rows={4}
                      value={state.createForm.syllabus}
                      onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, syllabus: event.target.value } }))}
                      placeholder="第一週：課程介紹\n第二週：…"
                    />
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="分類">
                      <select className="select" value={state.createForm.category} onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, category: event.target.value as CreateCourseForm["category"] } }))}>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="上課地點">
                      <input className="input" value={state.createForm.location} onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, location: event.target.value } }))} placeholder="例如：管理學院 302" />
                    </Field>
                    <Field label="上課星期">
                      <select className="select" value={state.createForm.day} onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, day: Number(event.target.value) } }))}>
                        {dayLabels.map((label, index) => (
                          <option key={label} value={index + 1}>週{label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="上課節次">
                      <select className="select" value={state.createForm.periodIndex} onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, periodIndex: Number(event.target.value) } }))}>
                        {periods.map((period, index) => (
                          <option key={period.label} value={index}>{period.label}（{period.time}）</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="名額">
                      <input className="input" type="number" min={1} value={state.createForm.capacity} onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, capacity: Number(event.target.value) || 1 } }))} />
                    </Field>
                    <Field label="搶課開放時間">
                      <select className="select" value={state.createForm.openMode} onChange={(event) => setState((current) => ({ ...current, createForm: { ...current.createForm, openMode: event.target.value as OpenMode } }))}>
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
                      const form = state.createForm;

                      if (!form.title.trim()) {
                        showToast("請先輸入課程名稱");
                        return;
                      }

                      const now = Date.now();
                      const openAt = form.openMode === "now" ? now - 1000 : form.openMode === "soon" ? now + 30000 : now + 24 * 3600 * 1000;

                      const newCourse: Course = {
                        id: `c${now}`,
                        title: form.title.trim(),
                        teacher: state.userName,
                        category: form.category,
                        day: form.day,
                        periodIndex: form.periodIndex,
                        location: form.location.trim() || "教室未定",
                        description: form.brief.trim() || "課程簡介尚未提供。",
                        syllabus: form.syllabus.split("\n").map((line) => line.trim()).filter(Boolean),
                        capacity: form.capacity,
                        enrolled: 0,
                        openAt,
                        hot: false,
                        enrolledStudents: [],
                        waitlist: []
                      };

                      setState((current) => ({
                        ...current,
                        courses: current.courses.concat([newCourse]),
                        screen: "courses",
                        createForm: {
                          title: "",
                          category: "資訊",
                          brief: "",
                          syllabus: "",
                          day: 1,
                          periodIndex: 0,
                          location: "",
                          capacity: 30,
                          openMode: "now"
                        }
                      }));
                      showToast("課程建立成功");
                    }}
                  >
                    建立課程
                  </button>
                </div>
              </section>
            ) : null}

            {state.screen === "dashboard" ? (
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
            ) : null}

            {state.screen === "roster" && roster ? (
              <section>
                <button className="btn" onClick={() => setState((current) => ({ ...current, screen: "courses" }))} style={{ background: "transparent", color: "#6B7280", fontWeight: 800, marginBottom: 16 }}>
                  ← 回到我的課程
                </button>
                <div className="section-title">{roster.title}</div>
                <div className="muted" style={{ marginTop: 4, marginBottom: 20, fontSize: 14 }}>已選 {roster.enrolled} / {roster.capacity} · 候補 {roster.waitlistCount} 人</div>

                <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>已確認學生</div>
                <div className="card" style={{ overflow: "hidden", marginBottom: 22 }}>
                  {roster.students.map((student, index) => (
                    <div key={student.id} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", borderBottom: index === roster.students.length - 1 ? "none" : "1px solid #F3F4F6", fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>{student.name}</span>
                      <span className="muted">{student.id}</span>
                    </div>
                  ))}
                </div>

                {roster.waitlist.length > 0 ? (
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>候補名單</div>
                    <div className="card" style={{ overflow: "hidden" }}>
                      {roster.waitlist.map((student, index) => (
                        <div key={`${student.name}-${student.position}`} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", borderBottom: index === roster.waitlist.length - 1 ? "none" : "1px solid #F3F4F6", fontSize: 14 }}>
                          <span style={{ fontWeight: 700 }}>{student.name}</span>
                          <span style={{ color: "var(--warning)", fontWeight: 900 }}>候補第 {student.position} 位</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </main>
        </div>
      )}

      {state.confirmModal ? (
        <div className="overlay">
          <div className="card fade-up" style={{ maxWidth: 380, width: "100%", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{state.confirmModal.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>{state.confirmModal.title}</div>
            <div className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>{state.confirmModal.body}</div>
            <button className="btn btn-brand" style={{ width: "100%", padding: 12, fontWeight: 900 }} onClick={() => setState((current) => ({ ...current, confirmModal: null }))}>
              確認
            </button>
          </div>
        </div>
      ) : null}

      {state.toast ? <div className="toast">{state.toast.message}</div> : null}
    </div>
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

function StatCard({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6, letterSpacing: "-0.04em" }}>{value}</div>
    </div>
  );
}

function buildCourseCardVM(course: Course, state: AppState): CourseCardVM {
  const enrollment = state.studentEnrollments[course.id];
  const status = getStatus(course, state.now, enrollment);
  const actionable = status.phase === "open" || status.phase === "full";

  return {
    id: course.id,
    title: course.title,
    teacher: course.teacher,
    category: course.category,
    dayLabel: dayLabel(course.day),
    periodTime: buildPeriodLabel(course.periodIndex),
    location: course.location,
    description: course.description,
    syllabus: course.syllabus,
    enrolled: course.enrolled,
    capacity: course.capacity,
    fillPct: getFillPct(course.enrolled, course.capacity),
    barColor: getBarColor(course.enrolled, course.capacity),
    enrolledKey: `${course.id}-${course.enrolled}`,
    statusLabel: status.label,
    statusColor: status.color,
    buttonStyle: getButtonStyle(status.phase),
    buttonLabel: getButtonLabel(status.phase),
    actionable
  };
}

function buttonStyleFromText(styleText: string) {
  return styleText
    .split(";")
    .filter(Boolean)
    .reduce<Record<string, string>>((style, chunk) => {
      const [key, value] = chunk.split(":");

      if (key && value) {
        const cssKey = key.trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
        style[cssKey] = value.trim();
      }

      return style;
    }, {});
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