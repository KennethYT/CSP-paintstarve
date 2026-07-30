import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next.js 16 的 proxy（取代舊的 middleware 檔案慣例）。
 *
 * 這裡只做便宜的 edge 檢查：看 session cookie 在不在，把未登入的人擋在應用頁面外。
 * 這**不是**授權依據 —— 真正的把關在 lib/session.ts 的 requireRole（server component）
 * 與各個 API route 自己的 session 驗證。
 */
export default function proxy(request: NextRequest) {
  const hasSession = getSessionCookie(request) !== null;

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*"]
};
