import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo Scholarship Application — AccessAble AI Test Target",
  description: "Controlled test page containing deliberate accessibility barriers for axe-core verification.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
