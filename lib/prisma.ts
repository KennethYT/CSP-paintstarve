import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Cloudflare Workers 沒有 TCP socket，所以連線走 Neon 的 serverless driver。
 *
 * 這裡刻意用 `Pool`（WebSocket 模式）而不是 `neon()`（HTTP 模式）：
 * HTTP 模式不支援 interactive transaction，而 lib/course-service.ts 的搶課邏輯
 * 依賴 `pg_advisory_xact_lock` 搭配 interactive transaction 來保證不超賣。
 * WebSocket 模式給的是完整的 pg 連線語意（session state、advisory lock、
 * BEGIN/COMMIT），是唯一能原封不動保留那套併發設計的選項。
 *
 * 連線字串請用 Neon 的 direct endpoint，不要用 `-pooler` 那條 —— pooler 是
 * transaction-mode 的 PgBouncer，會讓 advisory lock 的行為變得不可靠。
 */
if (process.env.NEON_WS_PROXY) {
  // 本機開發：讓 Neon driver 透過 WebSocket proxy 連到本機 Postgres，
  // 這樣本機跑的就是與正式環境同一條 driver 程式碼路徑。
  neonConfig.wsProxy = process.env.NEON_WS_PROXY;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
  neonConfig.pipelineTLS = false;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  // PrismaNeon（相對於 PrismaNeonHttp）內部建立的是 WebSocket 的 Pool，
  // 這正是 interactive transaction 與 advisory lock 需要的那一種。
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
