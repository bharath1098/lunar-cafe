import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your order",
  description: "Order from your table at Lunar Cafe, Jubilee Hills.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
