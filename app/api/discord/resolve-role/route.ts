import { NextResponse } from "next/server";
import { getAuth, isBetterAuthConfigured } from "@/lib/auth";
import { resolveDiscordRoleForUser } from "@/lib/discord";

export async function POST(request: Request) {
  if (!isBetterAuthConfigured) {
    return NextResponse.json({ ok: false, message: "登入系統尚未完成設定。" }, { status: 503 });
  }

  const session = await getAuth().api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "尚未登入，請先完成 Discord OAuth。" }, { status: 401 });
  }

  const result = await resolveDiscordRoleForUser(session.user.id, session.user.name ?? null);

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: result.status });
  }

  return NextResponse.json(result);
}
