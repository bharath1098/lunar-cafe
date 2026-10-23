import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Patio nights, latte art and the dishes guests come back for at Lunar Cafe, Jubilee Hills.",
  alternates: { canonical: "/gallery" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
