import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api";
import type { Role } from "@/lib/types";

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
};

function parseRole(value: unknown): Role | null {
  return value === "student" || value === "teacher" ? value : null;
}

/**
 * 註冊。角色在 lib/auth.ts 設為 input: false，使用者無法透過 better-auth 的
 * update-user 端點自行改成 teacher；只有這裡（註冊當下）與 Discord 身份組解析
 * 能寫入 role。
 */
export async function POST(request: Request) {
  const body = await readJson<RegisterBody>(request);

  if (!body) {
    return jsonError("請求格式錯誤。", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = parseRole(body.role);

  if (!name) {
    return jsonError("請輸入姓名。", 400);
  }

  if (!email.includes("@")) {
    return jsonError("請輸入有效的 Email。", 400);
  }

  if (password.length < 8) {
    return jsonError("密碼至少需要 8 個字元。", 400);
  }

  if (!role) {
    return jsonError("請選擇學生或教師身分。", 400);
  }

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: request.headers,
      // 回傳 Response 才能把 better-auth 設定的 session cookie 一併帶給瀏覽器
      asResponse: true
    });

    if (!result.ok) {
      const detail = (await result.json().catch(() => null)) as { message?: string } | null;
      return jsonError(detail?.message ?? "註冊失敗，請稍後再試。", result.status);
    }

    // signUpEmail 不接受 role（input: false），註冊成功後由伺服器指派
    await prisma.user.update({ where: { email }, data: { role } });

    // 沿用 better-auth 的回應（含 Set-Cookie），使用者註冊完即為登入狀態
    const payload = (await result.json().catch(() => ({}))) as Record<string, unknown>;
    const response = Response.json({ ok: true, role, user: payload.user ?? null }, { status: 200 });

    for (const cookie of result.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch (error) {
    if (error instanceof APIError) {
      const status = typeof error.status === "number" ? error.status : 400;
      return jsonError(error.message || "註冊失敗。", status);
    }

    console.error("register failed", error);
    return jsonError("註冊失敗，請稍後再試。", 500);
  }
}
