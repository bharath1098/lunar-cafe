"use client";

import { FormEvent, useState } from "react";
import { Gift, Sparkles, Ticket } from "lucide-react";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { NeoButton, NeoInput } from "@/components/Neo";
import { CAFE_MEDIA } from "@/lib/media";

export default function LoyaltyPage() {
  const [member, setMember] = useState<{
    phone: string;
    name: string;
    points: number;
  } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "loyalty_join",
        phone: String(fd.get("phone")),
        name: String(fd.get("name")),
      }),
    });
    const data = await res.json();
    setMember(data.member);
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
                <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }}>
                  <NeoInput name="name" label="Name" required />
                  <NeoInput name="phone" label="Phone" required inputMode="tel" />
                  <NeoButton type="submit">Continue</NeoButton>
                </form>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="loyalty-card">
                <span className="eyebrow" style={{ color: "var(--gold-300)" }}>
                  Lunar Rewards
                </span>
                <div className="h-display" style={{ fontSize: "4rem", marginTop: "1.2rem" }}>
                  {member?.points ?? 0}
                  <span style={{ fontSize: "1rem", marginLeft: 8, opacity: 0.7 }}>
                    points
                  </span>
                </div>
                <p style={{ marginTop: "1.4rem", opacity: 0.85 }}>
                  {member ? `${member.name} · ${member.phone}` : "Your card appears here"}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
