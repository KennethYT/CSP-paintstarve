import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const socialProviders = {
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET
        }
      }
    : {}),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
      }
    : {}),
  ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
    ? {
        discord: {
          clientId: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET
        }
      }
    : {})
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    // 必須與 prisma/schema.prisma 的 datasource provider 一致
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    // 這是課程選課系統的示範專案，不接寄信服務，故不強制驗證信箱
    requireEmailVerification: false,
    minPasswordLength: 8
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        // 角色只能由伺服器決定：註冊 API 或 Discord 身份組解析。
        // 設為 false 可阻止使用者透過 update-user 端點自行把自己改成 teacher。
        input: false
      }
    }
  },
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
  // 讓 server action / route handler 能正確寫入 session cookie
  plugins: [nextCookies()]
});

export type AppSession = typeof auth.$Infer.Session;
