"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import {
  NeoButton,
  NeoInput,
  NeoSelect,
  NeoTextarea,
} from "@/components/Neo";
import { DateField, TimeField } from "@/components/DateTimePickers";
import { CAFE } from "@/lib/cafe";
import { CAFE_MEDIA } from "@/lib/media";

export default function ReservePage() {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const date = String(fd.get("date") || "");
    const time = String(fd.get("time") || "");
    if (!date || !time) {
      setError("Please enter a valid date and time.");
      return;
    }
    const data = {
      name: String(fd.get("name")),
      phone: String(fd.get("phone")),
      partySize: Number(fd.get("partySize")),
      date,
      time,
      sectionPreference: String(fd.get("section")),
      note: String(fd.get("note") || ""),
    };
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reservation_create", data }),
    });
    if (!res.ok) {
      setError("Could not book. Please try again.");
      return;
    }
    setOk(true);
    form.reset();
  }

  return (
    <PublicShell>
      <PageHero
        eyebrow="Reservations"
        title="Save your table"
        subtitle={`Free booking, open ${CAFE.hours}. A table is assigned when you arrive.`}
        image={CAFE_MEDIA.patio}
      />
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="wrap split">
          <Reveal>
            <div className="neo-card" style={{ padding: "2rem" }}>
              {ok ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <CheckCircle2 size={54} color="#2e8b57" />
                  <h2 className="h-display h-md" style={{ margin: "1rem 0 0.4rem" }}>
                    Request received
                  </h2>
                  <p className="muted">
                    Reception will confirm shortly. See you at Lunar!
                  </p>
                  <div style={{ marginTop: "1.2rem" }}>
                    <NeoButton variant="ghost" onClick={() => setOk(false)}>
                      Book another
                    </NeoButton>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={onSubmit}
                  style={{ display: "grid", gap: "1rem" }}
                >
                  <div className="form-2">
                    <NeoInput name="name" label="Your name" required />
                    <NeoInput name="phone" label="Phone" required inputMode="tel" />
                  </div>
                  <div className="form-2">
                    <DateField name="date" label="Date" required />
                    <TimeField
                      name="time"
                      label="Time"
                      min={CAFE.hoursStart}
                      max={CAFE.hoursEnd}
                      required
                    />
                  </div>
                  <div className="form-2">
                    <NeoInput
                      name="partySize"
                      label="Guests"
                      type="number"
                      min={1}
                      max={20}
                      defaultValue={2}
                      required
                    />
                    <NeoSelect name="section" label="Seating" defaultValue="any">
                      <option value="any">No preference</option>
                      <option value="indoor">Indoor</option>
                      <option value="outdoor">Outdoor patio</option>
                    </NeoSelect>
                  </div>
                  <NeoTextarea name="note" label="Special note" rows={3} />
                  {error && <p style={{ color: "#86302a" }}>{error}</p>}
                  <NeoButton type="submit">Request reservation</NeoButton>
                </form>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="arch-photo" style={{ height: "100%" }}>
              <Image
                src={CAFE_MEDIA.interior}
                alt="Lunar Cafe dining room"
                fill
                className="cover"
                sizes="(max-width: 960px) 100vw, 45vw"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </PublicShell>
  );
}
