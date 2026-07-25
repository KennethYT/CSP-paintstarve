"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND_LOGO_SRC, BRAND_NAME, BrandLogo } from "@/components/brand";
import { useClassroom } from "@/components/classroom-store";
import { authClient } from "@/lib/auth-client";

type DiscordResolveResult = {
  ok: boolean;
  role?: "student" | "teacher";
  guildName?: string;
  displayName?: string;
  message?: string;
};

export default function LoginPage() {
  const classroom = useClassroom();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [choice, setChoice] = useState<"student" | "teacher" | null>(null);
  const [name, setName] = useState("");
  const [discordMessage, setDiscordMessage] = useState("");
  const [isDiscordPending, setIsDiscordPending] = useState(false);

  useEffect(() => {
    if (classroom.role === "student") {
      router.replace("/student/browse");
    }

    if (classroom.role === "teacher") {
      router.replace("/teacher/courses");
    }
  }, [classroom.role, router]);

  const resolveDiscordRole = async () => {
    setIsDiscordPending(true);
    setDiscordMessage("正在驗證 Discord 伺服器與身份組...");

    try {
      const session = await authClient.getSession();

      if (!session.data?.user) {
        setDiscordMessage("尚未登入 Discord，請重新點擊 Discord 登入。");
        return;
      }

      const response = await fetch("/api/discord/resolve-role", {
        method: "POST"
      });
      const payload = (await response.json()) as DiscordResolveResult;

      if (!response.ok || !payload.ok || !payload.role) {
        setDiscordMessage(payload.message ?? "Discord 驗證失敗，請聯絡管理員檢查機械人與身份組設定。");
        return;
      }

      const resolvedName = payload.displayName?.trim() || session.data.user.name || "Discord 使用者";
      classroom.login(payload.role, resolvedName);
      setDiscordMessage(`已通過 ${payload.guildName ?? "指定伺服器"} 驗證，身份為${payload.role === "teacher" ? "教職員" : "學生"}。`);
      router.replace(payload.role === "teacher" ? "/teacher/courses" : "/student/browse");
    } catch {
      setDiscordMessage("Discord 驗證發生錯誤，請稍後再試。");
    } finally {
      setIsDiscordPending(false);
    }
  };

  useEffect(() => {
    const fromDiscord = searchParams.get("discord");

    if (fromDiscord === "1") {
      void resolveDiscordRole();
    }
  }, [searchParams]);

  const handleDiscordLogin = async () => {
    setDiscordMessage("");
    setIsDiscordPending(true);

    try {
      await authClient.signIn.social({
        provider: "discord",
        callbackURL: "/login?discord=1",
        errorCallbackURL: "/login?discord=error"
      });
    } catch {
      setDiscordMessage("無法啟動 Discord OAuth，請檢查 DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET。");
      setIsDiscordPending(false);
    }
  };

  useEffect(() => {
    const hasError = searchParams.get("discord") === "error";

    if (hasError) {
      setDiscordMessage("Discord OAuth 發生錯誤，請重試或檢查回呼網址設定。");
      setIsDiscordPending(false);
    }
  }, [searchParams]);

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
            <button className="login-role-card" onClick={() => void handleDiscordLogin()} disabled={isDiscordPending}>
              <span className="login-role-card__icon">🤖</span>
              <span>
                <strong className="login-role-card__title">Discord 驗證登入</strong>
                <span className="login-role-card__text">用機械人檢查伺服器與身份組後自動分流</span>
              </span>
            </button>

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

          {discordMessage ? <div className="login-automation-note__text">{discordMessage}</div> : null}

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