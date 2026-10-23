import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page isn’t on the Lunar Cafe site.",
};

export default function NotFound() {
  return (
    <PublicShell>
      <section className="section not-found">
        <div className="wrap">
          <span className="eyebrow">404</span>
          <h1 className="h-display h-xl">This page isn’t on the menu</h1>
          <p className="lead">The link may be old, or the address was typed wrong.</p>
          <div className="not-found-actions">
            <Link href="/" className="neo-btn neo-btn-primary">
              Back home
            </Link>
            <Link href="/menu" className="neo-btn neo-btn-ghost">
              See the menu
            </Link>
            <Link href="/contact" className="neo-btn neo-btn-ghost">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
