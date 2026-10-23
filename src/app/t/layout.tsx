import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join your table",
  description: "Join the table at Lunar Cafe with your name and phone.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
