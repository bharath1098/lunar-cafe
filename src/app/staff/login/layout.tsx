import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Staff sign in · Lunar Cafe" },
  description: "Sign in to the Lunar Cafe floor tools.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
