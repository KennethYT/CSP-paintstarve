"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { useClassroom } from "@/components/classroom-store";

type ShellTab = {
  label: string;
  href: string;
};

export function RoleShell({ role, tabs, children }: Readonly<{ role: "student" | "teacher"; tabs: ShellTab[]; children: ReactNode }>) {
  const classroom = useClassroom();
  const router = useRouter();

  useEffect(() => {
    if (classroom.role !== role) {
      router.replace("/login");
    }
  }, [classroom.role, role, router]);

  if (classroom.role !== role) {
    return null;
  }

  return (
    <div>
      <AppHeader
        role={role}
        tabs={tabs}
        userName={classroom.userName}
        onLogout={() => {
          classroom.logout();
          router.push("/login");
        }}
      />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 80px" }}>
        {children}
      </main>
    </div>
  );
}