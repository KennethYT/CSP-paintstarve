import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/types";

type DiscordMember = {
  nick: string | null;
  roles: string[];
  user?: {
    username?: string;
    global_name?: string | null;
  };
};

const DISCORD_API_BASE = "https://discord.com/api/v10";

function parseRoleIds(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((roleId) => roleId.replaceAll('"', "").trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const teacherRoleIds = parseRoleIds(process.env.DISCORD_TEACHER_ROLE_ID);
  const studentRoleIds = parseRoleIds(process.env.DISCORD_STUDENT_ROLE_ID);

  if (!botToken || !guildId || teacherRoleIds.length === 0 || studentRoleIds.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "缺少 Discord 驗證設定，請檢查 DISCORD_BOT_TOKEN / DISCORD_GUILD_ID / DISCORD_TEACHER_ROLE_ID / DISCORD_STUDENT_ROLE_ID"
      },
      { status: 500 }
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "尚未登入，請先完成 Discord OAuth。" }, { status: 401 });
  }

  let discordUserId = "";

  try {
    const row = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "discord"
      },
      select: {
        accountId: true
      }
    });

    if (!row?.accountId) {
      return NextResponse.json({ ok: false, message: "目前帳號未綁定 Discord provider。" }, { status: 400 });
    }

    discordUserId = row.accountId;
  } catch {
    return NextResponse.json({ ok: false, message: "讀取本地帳號資料失敗。" }, { status: 500 });
  }

  const memberResponse = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${discordUserId}`, {
    headers: {
      Authorization: `Bot ${botToken}`
    },
    cache: "no-store"
  });

  if (memberResponse.status === 404) {
    return NextResponse.json(
      {
        ok: false,
        message: "此使用者不在指定 Discord 伺服器內。"
      },
      { status: 403 }
    );
  }

  if (!memberResponse.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: `Discord 伺服器驗證失敗（HTTP ${memberResponse.status}）。`
      },
      { status: 502 }
    );
  }

  const member = (await memberResponse.json()) as DiscordMember;
  const roleIds = member.roles ?? [];

  let role: Role | null = null;
  let matchedRoleId = "";

  const matchedTeacherRoleId = teacherRoleIds.find((roleId) => roleIds.includes(roleId));
  const matchedStudentRoleId = studentRoleIds.find((roleId) => roleIds.includes(roleId));

  if (matchedTeacherRoleId) {
    role = "teacher";
    matchedRoleId = matchedTeacherRoleId;
  } else if (matchedStudentRoleId) {
    role = "student";
    matchedRoleId = matchedStudentRoleId;
  }

  if (!role) {
    return NextResponse.json(
      {
        ok: false,
        message: "已在伺服器內，但未匹配教職員或學生身份組。"
      },
      { status: 403 }
    );
  }

  const guildResponse = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
    headers: {
      Authorization: `Bot ${botToken}`
    },
    cache: "no-store"
  });

  const guildName = guildResponse.ok
    ? ((await guildResponse.json()) as { name?: string }).name ?? guildId
    : guildId;

  const displayName =
    member.nick ?? member.user?.global_name ?? member.user?.username ?? session.user.name ?? "Discord 使用者";

  return NextResponse.json({
    ok: true,
    role,
    guildId,
    guildName,
    matchedRoleId,
    displayName
  });
}