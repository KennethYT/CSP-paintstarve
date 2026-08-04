import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma CLI（db push / studio / migrate）的設定。
 *
 * 執行期的資料庫連線不走這裡 —— 那是 lib/prisma.ts 的 driver adapter 負責的，
 * 因為 Cloudflare Workers 上沒有 TCP socket，必須透過 Neon 的 WebSocket driver。
 * 這個檔案只在本機／CI 用 Node 跑 CLI 指令時生效。
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL")
  },
  migrations: {
    seed: "tsx prisma/seed.ts"
  }
});
