"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, MessageSquareHeart } from "lucide-react";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { NeoButton, NeoInput, NeoSelect, NeoTextarea } from "@/components/Neo";
import { CAFE_MEDIA } from "@/lib/media";
import { loadPublicData } from "@/lib/public-data";
import { readUtm } from "@/lib/utm";

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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const message = String(fd.get("message") || "").trim();
    const rating = Number(fd.get("rating") || 5);
    if (message.length < 4) {
      setError("Please write a short message.");
      return;
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setError("Rating should be a number from 1 to 5.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "feedback_submit",
          utm: readUtm(),
          data: {
            category: String(fd.get("category")),
            type: String(fd.get("type")),
            message,
            rating,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send that. Please try again.");
        return;
      }
      setDone(true);
      form.reset();
      load();
    } catch {
      setError("Could not send that. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
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
              {done ? (
                <div className="form-success" role="status">
                  <CheckCircle2 size={42} />
                  <h2 className="h-display h-md">Thank you</h2>
                  <p className="muted">The owner will review it before anything is shown.</p>
                  <NeoButton variant="ghost" onClick={() => setDone(false)}>
                    Send another
                  </NeoButton>
                </div>
              ) : (
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
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <NeoButton type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Send feedback"}
                </NeoButton>
              </form>
              )}
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
