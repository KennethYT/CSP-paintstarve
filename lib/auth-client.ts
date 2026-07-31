import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { AppAuth } from "@/lib/auth";

export const authClient = createAuthClient({
  // 讓 client 端的 session.user 帶有 role 型別
  plugins: [inferAdditionalFields<AppAuth>()]
});

export const { signIn, signOut, useSession } = authClient;
