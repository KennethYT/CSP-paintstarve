import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const placeholderBetterAuthSecret = "請換成隨機的長字串";
const betterAuthSecret = process.env.BETTER_AUTH_SECRET?.trim();
const betterAuthBaseURL = process.env.BETTER_AUTH_URL?.trim();

export const isBetterAuthConfigured =
  typeof betterAuthSecret === "string" &&
  betterAuthSecret.length > 0 &&
  betterAuthSecret !== placeholderBetterAuthSecret;

export const shouldSkipAuthDuringBuild =
  process.env.NEXT_PHASE === "phase-production-build" && !isBetterAuthConfigured;

/**
 * Discord 是唯一的登入方式。其他 OAuth 供應商不註冊 —— 它們無法解析校內身份組，
 * 登入後只會產生沒有 role、進不了任何頁面的帳號。
 */
const socialProviders =
  process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
    ? {
        discord: {
          clientId: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET
        }
      }
    : {};

function createAuth() {
  return betterAuth({
    database: prismaAdapter(prisma, {
      // 必須與 prisma/schema.prisma 的 datasource provider 一致
      provider: "postgresql"
    }),
    ...(isBetterAuthConfigured ? { secret: betterAuthSecret } : {}),
    ...(betterAuthBaseURL ? { baseURL: betterAuthBaseURL } : {}),
    // 身分一律由 Discord 伺服器的身份組決定，不開放 Email/密碼註冊登入
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          // 角色只能由 Discord 身份組解析寫入（見 lib/discord.ts）。
          // 設為 false 可阻止使用者透過 update-user 端點自行把自己改成 teacher。
          input: false
        }
      }
    },
    ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
    // 讓 server action / route handler 能正確寫入 session cookie
    plugins: [nextCookies()]
  });
}

export type AppAuth = ReturnType<typeof createAuth>;

let authInstance: AppAuth | null = null;

export function getAuth(): AppAuth {
  if (authInstance) {
    return authInstance;
  }

  const auth = createAuth();

  authInstance = auth;
  return auth;
}

export type AppSession = ReturnType<typeof getAuth>["$Infer"]["Session"];
