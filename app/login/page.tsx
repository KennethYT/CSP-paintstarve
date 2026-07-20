"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_LOGO_SRC, BRAND_NAME, BrandLogo } from "@/components/brand";
import { useClassroom } from "@/components/classroom-store";

export default function LoginPage() {
  const classroom = useClassroom();
  const router = useRouter();
  const [choice, setChoice] = useState<"student" | "teacher" | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (classroom.role === "student") {
      router.replace("/student/browse");
    }

    if (classroom.role === "teacher") {
      router.replace("/teacher/courses");
    }
  }, [classroom.role, router]);

  const handleLogin = () => {
    if (!choice) {
      return;
    }

    const resolvedName = name.trim() || (choice === "teacher" ? "示範老師" : "示範學生");
    classroom.login(choice, resolvedName);
    router.push(choice === "teacher" ? "/teacher/courses" : "/student/browse");
  };

  return (
    <div className="login-page">
      <section className="login-hero fade-up">
        <div className="login-hero__glow login-hero__glow--pink" />
        <div className="login-hero__glow login-hero__glow--gold" />
        <div className="login-hero__glow login-hero__glow--green" />
        <div className="login-hero__ribbon login-hero__ribbon--top" />
        <div className="login-hero__ribbon login-hero__ribbon--middle" />
        <div className="login-hero__ribbon login-hero__ribbon--bottom" />

        <div className="login-hero__content">
          <div className="login-hero__eyebrow">Course Selection Platform</div>
          <div className="login-hero__title">SIGN IN</div>
          <div className="login-hero__subtitle">登入</div>
        </div>

        <div className="login-hero__artboard">
          <div className="login-hero__panel login-hero__panel--primary">
            <div className="login-hero__panel-grid" />
            <div className="login-hero__panel-orb" />
          </div>
          <div className="login-hero__panel login-hero__panel--secondary">
            <div className="login-hero__crest-wrap">
              <Image
                src={BRAND_LOGO_SRC}
                alt="校徽"
                fill
                className="login-hero__crest"
                sizes="(max-width: 960px) 45vw, 420px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <aside className="login-sidebar">
        <div className="login-sidebar__inner">
          <div className="login-sidebar__brand">
            <div className="login-sidebar__logo-wrap">
              <BrandLogo size={96} className="login-sidebar__logo" priority />
            </div>
            <div>
              <div className="login-sidebar__brand-title">{BRAND_NAME}</div>
              <div className="login-sidebar__brand-text">Please choose your role and enter your display name.</div>
              <div className="login-sidebar__brand-text">請選擇身分，並輸入登入名稱。</div>
            </div>
          </div>

          <div className="login-role-list">
            <button className="login-role-card" data-active={choice === "student"} onClick={() => setChoice("student")}>
              <span className="login-role-card__icon">🎓</span>
              <span>
                <strong className="login-role-card__title">學生登入</strong>
                <span className="login-role-card__text">瀏覽課程、搶課、查看課表</span>
              </span>
            </button>

            <button className="login-role-card" data-active={choice === "teacher"} onClick={() => setChoice("teacher")}>
              <span className="login-role-card__icon">🧑‍🏫</span>
              <span>
                <strong className="login-role-card__title">教師登入</strong>
                <span className="login-role-card__text">管理課程、建立課程、查看名單</span>
              </span>
            </button>
          </div>

          {choice ? (
            <div className="login-form-block">
              <label className="login-form-block__label">姓名</label>
              <input
                className="input login-form-block__input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={choice === "teacher" ? "例如：王小明老師" : "例如：王小明同學"}
              />
              <button className="btn btn-brand login-form-block__button" onClick={handleLogin}>
                以{choice === "teacher" ? "教師" : "學生"}身份登入
              </button>
            </div>
          ) : null}

          <div className="login-automation-note">
            <div className="login-automation-note__title">後續流程註記</div>
            <div className="login-automation-note__text">
              本入口後續可接入 DC 機器人代為登入，並依登入身分與使用情境自動分類到對應流程。
            </div>
          </div>

          <div className="login-sidebar__links">
            <span>Forgot your password?</span>
            <span>Change password</span>
            <span>Helpdesk</span>
          </div>
        </div>
      </aside>
    </div>
  );
}