"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { NeoButton, NeoInput, NeoTextarea } from "@/components/Neo";
import { indianMobile } from "@/lib/phone";
import { readUtm } from "@/lib/utm";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const phone = indianMobile(String(fd.get("phone") || ""));
    const message = String(fd.get("message") || "").trim();
    if (name.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!phone) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (message.length < 8) {
      setError("Write a short message so we know how to help.");
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
            category: "other",
            type: "compliment",
            rating: 5,
            message: `Contact from ${name} (${phone}): ${message}`,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send that. Please call us instead.");
        return;
      }
      setOk(true);
      form.reset();
    } catch {
      setError("Could not send that. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (ok) {
    return (
      <div className="form-success" role="status">
        <CheckCircle2 size={42} />
        <h2 className="h-display h-md">Message received</h2>
        <p className="muted">We’ll get back to you at the number you shared.</p>
        <NeoButton variant="ghost" onClick={() => setOk(false)}>
          Send another
        </NeoButton>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }} noValidate>
      <div className="form-2">
        <NeoInput name="name" label="Your name" required autoComplete="name" />
        <NeoInput name="phone" label="Phone" required inputMode="tel" autoComplete="tel" />
      </div>
      <NeoTextarea name="message" label="Message" rows={4} required />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <NeoButton type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send message"}
      </NeoButton>
    </form>
  );
}
