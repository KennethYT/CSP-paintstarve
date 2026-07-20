import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { ClassroomProvider } from "@/components/classroom-store";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: "選課搶課系統",
  description: "Next.js 16 版的選課搶課模擬網站"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-Hant" className={manrope.variable}>
      <body>
        <ClassroomProvider>{children}</ClassroomProvider>
      </body>
    </html>
  );
}