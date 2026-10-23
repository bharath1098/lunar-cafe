"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { NeoButton, NeoInput } from "@/components/Neo";
import { PasswordInput } from "@/components/PasswordInput";
import { CAFE_MEDIA } from "@/lib/media";
import { saveStaffSession } from "@/lib/staff-session";

const DEMO = [
  { role: "Owner", email: "owner@lunar.cafe", pw: "owner123" },
  { role: "Reception", email: "reception@lunar.cafe", pw: "reception123" },
  { role: "Waiter", email: "waiter1@lunar.cafe", pw: "waiter123" },
  { role: "Kitchen", email: "kitchen@lunar.cafe", pw: "kitchen123" },
];

export default function StaffLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      saveStaffSession(data.user);
      router.push("/staff");
    } catch {
      setError("Could not sign in. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="join-page">
      <div className="join-hero">
        <Image src={CAFE_MEDIA.espresso} alt="" fill className="cover" priority sizes="55vw" />
        <div className="join-hero-shade" />
        <div className="join-hero-copy">
          <span className="eyebrow" style={{ color: "var(--gold-300)" }}>Staff portal</span>
          <div className="h-display h-xl" style={{ marginTop: "0.6rem" }}>Lunar Cafe</div>
        </div>
      </div>
      <div className="join-panel">
        <h1 className="h-display h-lg">Welcome back</h1>
        <p className="muted">Sign in to manage orders, tables and the kitchen.</p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", marginTop: "1.4rem" }}>
          <NeoInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <NeoButton type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </NeoButton>
        </form>
        <p className="muted" style={{ marginTop: "0.9rem", fontSize: "0.85rem" }}>
          Forgotten your password? Ask the owner to set a new one from the Team tab. Once you’re
          signed in, you can change it yourself.
        </p>
        <div style={{ marginTop: "1.6rem" }}>
          <span className="eyebrow">Demo accounts</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {DEMO.map((d) => (
              <button
                key={d.role}
                className="chip"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.pw);
                }}
              >
                {d.role}
              </button>
            ))}
          </div>
        </div>
        <Link href="/" className="muted" style={{ marginTop: "1.6rem", fontSize: "0.85rem" }}>
          ← Back to website
        </Link>
      </div>
    </main>
  );
}
