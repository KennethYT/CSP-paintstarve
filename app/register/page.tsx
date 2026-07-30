"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHero } from "@/components/auth-hero";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("密碼至少需要 8 個字元。");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role })
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? "註冊失敗，請稍後再試。");
        return;
      }

      // 註冊 API 已回傳 session cookie，直接進入對應入口
      router.replace(role === "teacher" ? "/teacher/courses" : "/student/browse");
      router.refresh();
    } catch {
      setError("註冊失敗，請檢查網路後再試。");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AuthHero title="SIGN UP" subtitle="註冊" sidebarText="建立校園帳號，並選擇你的使用身分。">
      <div className="login-role-list">
        <button
          type="button"
          className="login-role-card"
          data-active={role === "student"}
          aria-pressed={role === "student"}
          onClick={() => setRole("student")}
        >
          <span className="login-role-card__icon" aria-hidden="true">
            🎓
          </span>
          <span>
            <strong className="login-role-card__title">學生</strong>
            <span className="login-role-card__text">瀏覽課程、搶課、查看課表</span>
          </span>
        </button>

        <button
          type="button"
          className="login-role-card"
          data-active={role === "teacher"}
          aria-pressed={role === "teacher"}
          onClick={() => setRole("teacher")}
        >
          <span className="login-role-card__icon" aria-hidden="true">
            🧑‍🏫
          </span>
          <span>
            <strong className="login-role-card__title">教師</strong>
            <span className="login-role-card__text">建立課程、管理名單、查看儀表板</span>
          </span>
        </button>
      </div>

      <form className="login-form-block" onSubmit={handleSubmit}>
        <label className="login-form-block__label" htmlFor="register-name">
          姓名
        </label>
        <input
          id="register-name"
          className="input login-form-block__input"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={role === "teacher" ? "例如：王小明老師" : "例如：王小明"}
        />

        <label className="login-form-block__label" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          className="input login-form-block__input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="student@example.edu"
        />

        <label className="login-form-block__label" htmlFor="register-password">
          密碼（至少 8 個字元）
        </label>
        <input
          id="register-password"
          className="input login-form-block__input"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />

        {error ? (
          <p className="auth-message auth-message--error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="btn btn-brand login-form-block__button" type="submit" disabled={isPending}>
          {isPending ? "註冊中…" : `以${role === "teacher" ? "教師" : "學生"}身分註冊`}
        </button>
      </form>

      <p className="auth-switch">
        已經有帳號了？<Link href="/login">回到登入</Link>
      </p>
    </AuthHero>
  );
}
