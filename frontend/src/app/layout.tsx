import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/ui/AppShell";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AccessAble AI — Autonomous Accessibility Remediation Pipeline",
  description: "Next-generation accessibility scanner, visual journey recorder, and verified remediation engine powered by Playwright and axe-core.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans antialiased bg-[#EBECEF] text-[#0A0A0A] selection:bg-neutral-900 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
