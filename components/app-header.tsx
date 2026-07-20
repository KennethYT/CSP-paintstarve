"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_NAME, BrandLogo } from "@/components/brand";

type HeaderTab = {
  label: string;
  href: string;
};

export function AppHeader({
  role,
  tabs,
  userName,
  onLogout,
}: Readonly<{
  role: "student" | "teacher";
  tabs: HeaderTab[];
  userName: string;
  onLogout: () => void;
}>) {
  const pathname = usePathname();
  const roleLabel = role === "teacher" ? "教師" : "學生";

  return (
    <header className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 20, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandLogo size={34} priority />
          <div style={{ fontSize: 18, fontWeight: 900 }}>{BRAND_NAME}</div>
        </div>

        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

            return (
              <Link key={tab.href} href={tab.href as any} className="btn tab" data-active={active}>
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="badge" style={{ background: role === "teacher" ? "#262626" : "#1f1f1f", color: "#d4d4d4", border: "1px solid #3a3a3a" }}>
              {roleLabel}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800 }}>{userName}</span>
          </div>
          <button className="btn" onClick={onLogout} style={{ border: "1px solid #3a3a3a", background: "#171717", padding: "8px 12px", color: "#d4d4d4", fontWeight: 800 }}>
            登出
          </button>
        </div>
      </div>
    </header>
  );
}
