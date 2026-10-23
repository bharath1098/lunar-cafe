"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        path: window.location.pathname,
        stack: error.stack,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <main className="section not-found">
      <div className="wrap">
        <span className="eyebrow">Error</span>
        <h1 className="h-display h-xl">Something went wrong</h1>
        <p className="lead">
          We’ve noted the problem on this page. You can try again, or head back to the menu.
        </p>
        <div className="not-found-actions">
          <button type="button" className="neo-btn neo-btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="neo-btn neo-btn-ghost">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
