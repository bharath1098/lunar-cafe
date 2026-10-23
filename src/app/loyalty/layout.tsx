import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lunar Rewards",
  description:
    "Join Lunar Rewards with your phone number. 100 welcome points, then 1 point per ₹100. 100 points is ₹50 off.",
  alternates: { canonical: "/loyalty" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
