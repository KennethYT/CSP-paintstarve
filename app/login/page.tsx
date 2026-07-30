"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHero } from "@/components/auth-hero";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/types";

function landingPath(role: Role) {
  return role === "teacher" ? "/teacher/courses" : "/student/browse";
}

/** 從網址參數推導出要顯示的訊息，不用 state 保存。 */
function readUrlMessage(params: URLSearchParams) {
  const discord = params.get("discord");

  if (discord === "error") {
    return { error: "Discord OAuth 發生錯誤，請重試或檢查回呼網址設定。", notice: "" };
  }

  if (discord === "unauthenticated") {
    return { error: "尚未完成 Discord 登入，請再試一次。", notice: "" };
  }

  if (discord === "failed") {
    return {
      error: params.get("reason") || "Discord 驗證失敗，請聯絡管理員檢查機器人與身份組設定。",
      notice: ""
    };
  }

  if (params.get("registered") === "1") {
    return { error: "", notice: "註冊成功，請用剛才的帳號密碼登入。" };
  }

  return { error: "", notice: "" };
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const urlMessage = readUrlMessage(searchParams);
  const error = formError || urlMessage.error;

  const handleDiscordLogin = async () => {
    setFormError("");
    setIsPending(true);

    try {
      await authClient.signIn.social({
        provider: "discord",
        // 身份組解析在 /discord/complete 這個 server component 內完成
        callbackURL: "/discord/complete",
        errorCallbackURL: "/login?discord=error"
      });
    } catch {
      setFormError("無法啟動 Discord OAuth，請檢查 DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET。");
      setIsPending(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setIsPending(true);

    const { error: signInError } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password
    });

    if (signInError) {
      setFormError(signInError.message ?? "登入失敗，請確認 Email 與密碼。");
      setIsPending(false);
      return;
    }

    const session = await authClient.getSession();
    const role = (session.data?.user as { role?: Role } | undefined)?.role;

    if (!role) {
      setFormError("此帳號尚未指派身分，請聯絡管理員或改用 Discord 驗證登入。");
      setIsPending(false);
      return;
    }

    router.replace(landingPath(role));
    router.refresh();
    setIsPending(false);
  };

  return (
    <AuthHero
      title="SIGN IN"
      subtitle="登入"
      sidebarText="請以校園帳號登入，或透過 Discord 伺服器身份組自動辨識身分。"
    >
      <button
        type="button"
        className="login-role-card"
        onClick={() => void handleDiscordLogin()}
        disabled={isPending}
      >
        <span className="login-role-card__icon" aria-hidden="true">
          🤖
        </span>
        <span>
          <strong className="login-role-card__title">Discord 驗證登入</strong>
          <span className="login-role-card__text">由機器人檢查伺服器與身份組後自動分流</span>
        </span>
      </button>

      <div className="auth-divider">
        <span>或使用 Email 登入</span>
      </div>

      <form className="login-form-block" onSubmit={handleSubmit}>
        <label className="login-form-block__label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="input login-form-block__input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="student@example.edu"
        />

        <label className="login-form-block__label" htmlFor="login-password">
          密碼
        </label>
        <input
          id="login-password"
          className="input login-form-block__input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />

        {error ? (
          <p className="auth-message auth-message--error" role="alert">
            {error}
          </p>
        ) : null}
        {urlMessage.notice && !error ? (
          <p className="auth-message auth-message--notice">{urlMessage.notice}</p>
        ) : null}

        <button className="btn btn-brand login-form-block__button" type="submit" disabled={isPending}>
          {isPending ? "登入中…" : "登入"}
        </button>
      </form>

      <p className="auth-switch">
        還沒有帳號？<Link href="/register">立即註冊</Link>
      </p>

      <div className="login-sidebar__links">
        <span>Forgot your password?</span>
        <span>Change password</span>
        <span>Helpdesk</span>
      </div>
    </AuthHero>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
