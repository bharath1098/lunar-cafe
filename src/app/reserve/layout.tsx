import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reserve a table",
  description:
    "Request a table at Lunar Cafe, Jubilee Hills. Open daily 11:00 AM – 11:30 PM. Reception confirms by phone.",
  alternates: { canonical: "/reserve" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
