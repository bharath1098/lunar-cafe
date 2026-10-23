import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Send a compliment or a complaint to the owner of Lunar Cafe, Jubilee Hills.",
  alternates: { canonical: "/feedback" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
