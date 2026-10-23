"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, serif", background: "#061c1b", color: "#f7f3eb", margin: 0 }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
          <div style={{ maxWidth: 520 }}>
            <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 12 }}>Lunar Cafe</p>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 500 }}>Something went wrong</h1>
            <p style={{ opacity: 0.75 }}>{error.message || "The page could not be shown."}</p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: "1rem",
                background: "#c4a35a",
                color: "#1c2421",
                border: 0,
                borderRadius: 999,
                padding: "0.7rem 1.1rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
