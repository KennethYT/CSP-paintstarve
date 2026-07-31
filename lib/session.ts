import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, shouldSkipAuthDuringBuild } from "@/lib/auth";
import type { Role, SessionUser } from "@/lib/types";

function toRole(value: unknown): Role | null {
  return value === "student" || value === "teacher" ? value : null;
}

/**
 * 讀取目前的 session。這是伺服器端的權威來源 —
 * 不能把 client 端導頁或 proxy 檢查當作授權依據。
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (shouldSkipAuthDuringBuild) {
    return null;
  }

  const session = await getAuth().api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return null;
  }

  const role = toRole((session.user as { role?: unknown }).role);

  if (!role) {
    return null;
  }

  return { id: session.user.id, name: session.user.name, role };
}

/** 在 route handler 內使用，headers 直接由 request 帶入。 */
export async function getSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
  if (shouldSkipAuthDuringBuild) {
    return null;
  }

  const session = await getAuth().api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return null;
  }

  const role = toRole((session.user as { role?: unknown }).role);

  if (!role) {
    return null;
  }

  return { id: session.user.id, name: session.user.name, role };
}

/**
 * Server component 專用：角色不符就轉走。
 * 已登入但角色不對時導向自己該去的頁面，而不是把人踢回登入頁。
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== role) {
    redirect(user.role === "teacher" ? "/teacher/courses" : "/student/browse");
  }

  return user;
}
