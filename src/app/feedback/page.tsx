"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { NeoButton, NeoInput, NeoSelect, NeoTextarea } from "@/components/Neo";
import { CAFE_MEDIA } from "@/lib/media";
import { loadPublicData } from "@/lib/public-data";

type Fb = {
  id: string;
  category: string;
  type: string;
  message: string;
  rating?: number;
};

export default function FeedbackPage() {
  const [list, setList] = useState<Fb[]>([]);
  const [done, setDone] = useState(false);

  function load() {
    loadPublicData()
      .then((d) => setList(d.feedback || []))
      .catch(() => setList([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "feedback_submit",
        data: {
          category: String(fd.get("category")),
          type: String(fd.get("type")),
          message: String(fd.get("message")),
          rating: Number(fd.get("rating") || 5),
        },
      }),
    });
    setDone(true);
    form.reset();
    load();
  }

  return (
    <PublicShell>
      <PageHero
        eyebrow="Feedback"
        title="Tell us everything"
        subtitle="Compliments and complaints reach the owner first. Approved notes are shown below."
        image={CAFE_MEDIA.logoMug}
      />
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="wrap split" style={{ alignItems: "start" }}>
          <Reveal>
            <div className="neo-card" style={{ padding: "2rem" }}>
              {done && (
                <p style={{ fontWeight: 700, color: "#2e8b57" }}>
                  Thank you — the owner will review it.
                </p>
              )}
              <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }}>
                <div className="form-2">
                  <NeoSelect name="type" label="Type" defaultValue="compliment">
                    <option value="compliment">Compliment</option>
                    <option value="complaint">Complaint</option>
                  </NeoSelect>
                  <NeoSelect name="category" label="About" defaultValue="food">
                    <option value="food">Food</option>
                    <option value="service">Service</option>
                    <option value="ambience">Ambience</option>
                    <option value="other">Other</option>
                  </NeoSelect>
                </div>
                <NeoInput
                  name="rating"
                  label="Rating (1–5)"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={5}
                />
                <NeoTextarea name="message" label="Your message" rows={4} required />
                <NeoButton type="submit">Send feedback</NeoButton>
              </form>
            </div>
          </Reveal>
          <div style={{ display: "grid", gap: "1rem" }}>
            <h2 className="h-display h-md">What guests say</h2>
            {list.map((f) => (
              <Reveal key={f.id}>
                <div className="info-card">
                  <div style={{ color: "#f2a93b" }}>
                    {"★".repeat(f.rating || 5)}
                  </div>
                  <p style={{ margin: "0.5rem 0 0", lineHeight: 1.6 }}>{f.message}</p>
                  <span className="neo-badge neo-badge-mint" style={{ marginTop: "0.8rem" }}>
                    {f.type} · {f.category}
                  </span>
                </div>
              </Reveal>
            ))}
            {list.length === 0 && (
              <div className="info-card" style={{ textAlign: "center" }}>
                <MessageSquareHeart size={34} color="#7fa390" />
                <p className="muted">Be the first to share a kind word.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
