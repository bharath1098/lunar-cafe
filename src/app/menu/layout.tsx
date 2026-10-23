import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Menu",
    template: "%s · Lunar Cafe",
  },
  description:
    "Coffee, mocktails, pizzas, pastas and plates at Lunar Cafe, Jubilee Hills. Browse the menu before you visit.",
  alternates: { canonical: "/menu" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
