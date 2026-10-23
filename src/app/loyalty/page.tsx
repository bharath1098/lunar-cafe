"use client";

import { FormEvent, useState } from "react";
import { Gift, Sparkles, Ticket } from "lucide-react";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { NeoButton, NeoInput } from "@/components/Neo";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CAFE_MEDIA } from "@/lib/media";
import { indianMobile } from "@/lib/phone";
import { readUtm } from "@/lib/utm";

export default function LoyaltyPage() {
  const [member, setMember] = useState<{
    phone: string;
    name: string;
    points: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [left, setLeft] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLeft(false);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = indianMobile(String(fd.get("phone") || ""));
    if (name.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!phone) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loyalty_join",
          utm: readUtm(),
          phone,
          name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.member) {
        setError(data.error || "Could not look up that number.");
        return;
      }
      setMember(data.member);
    } catch {
      setError("Could not look up that number. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!member) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "loyalty_leave", phone: member.phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not delete that profile.");
        return;
      }
      setMember(null);
      setLeft(true);
      setConfirmLeave(false);
    } catch {
      setError("Could not delete that profile. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <PageHero
        eyebrow="Lunar Rewards"
        title="Sip. Earn. Repeat."
        subtitle="Join with just your phone number. No app, no cards to carry."
        image={CAFE_MEDIA.drinks}
      />
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="wrap">
          <div className="info-grid">
            {[
              { i: <Gift size={22} />, t: "100 welcome points", d: "Instantly credited when you join." },
              { i: <Sparkles size={22} />, t: "1 point / ₹100", d: "Earned on every paid bill." },
              { i: <Ticket size={22} />, t: "100 points = ₹50 off", d: "Redeem with reception at bill time." },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.08}>
                <div className="info-card">
                  <div className="icon-bubble">{f.i}</div>
                  <h3 className="h-display h-md">{f.t}</h3>
                  <p className="muted">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="split" style={{ marginTop: "2.5rem", alignItems: "start" }}>
            <Reveal>
              <div className="neo-card" style={{ padding: "2rem" }}>
                <h2 className="h-display h-md" style={{ marginBottom: "1.2rem" }}>
                  Join or check your points
                </h2>
                <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }} noValidate>
                  <NeoInput name="name" label="Name" required autoComplete="name" />
                  <NeoInput name="phone" label="Phone" required inputMode="tel" autoComplete="tel" />
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  {left && (
                    <p className="form-success-line" role="status">
                      Rewards profile deleted. Past bills stay in our accounts.
                    </p>
                  )}
                  <NeoButton type="submit" disabled={busy}>
                    {busy ? "Checking…" : "Continue"}
                  </NeoButton>
                </form>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="loyalty-card">
                <span className="eyebrow" style={{ color: "var(--gold-300)" }}>
                  Lunar Rewards
                </span>
                {member ? (
                  <>
                    <div className="h-display" style={{ fontSize: "4rem", marginTop: "1.2rem" }}>
                      {member.points}
                      <span style={{ fontSize: "1rem", marginLeft: 8, opacity: 0.7 }}>points</span>
                    </div>
                    <p style={{ marginTop: "1.4rem", opacity: 0.85 }}>
                      {member.name} · {member.phone}
                    </p>
                    <button
                      type="button"
                      className="neo-btn neo-btn-ghost"
                      style={{ marginTop: "1.2rem" }}
                      onClick={() => setConfirmLeave(true)}
                    >
                      Delete my rewards profile
                    </button>
                  </>
                ) : (
                  <div className="loyalty-empty">
                    <p className="h-display" style={{ fontSize: "1.6rem", margin: "1.2rem 0 0.4rem" }}>
                      No profile yet
                    </p>
                    <p style={{ opacity: 0.75, margin: 0 }}>
                      Join with your phone number and your points show up here.
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      <ConfirmDialog
        open={confirmLeave}
        title="Delete this rewards profile?"
        body="Points for this phone number are removed. Bills that were already paid stay in the cafe’s accounts."
        confirmLabel="Delete profile"
        danger
        busy={busy}
        onConfirm={() => void leave()}
        onClose={() => setConfirmLeave(false)}
      />
    </PublicShell>
  );
}
