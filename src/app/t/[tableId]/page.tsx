"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, ShieldCheck } from "lucide-react";
import { NeoButton, NeoInput } from "@/components/Neo";
import {
  orderPath,
  readActiveGuest,
  saveGuestSession,
  type ActiveGuestVisit,
} from "@/lib/guest-session";
import { CAFE_MEDIA } from "@/lib/media";

export default function TableJoinPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const router = useRouter();
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resume, setResume] = useState<ActiveGuestVisit | null>(null);
  const [closedMsg, setClosedMsg] = useState("");

  useEffect(() => {
    const active = readActiveGuest();
    if (!active || active.tableId !== tableId) return;
    setResume(active);
    router.replace(orderPath(active.sessionId));
  }, [tableId, router]);

  useEffect(() => {
    fetch("/api/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ordering && !data.ordering.acceptingOrders) {
          setClosedMsg(data.ordering.reason || "Cafe is closed for orders right now.");
        } else {
          setClosedMsg("");
        }
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    if (!name) {
      setBusy(false);
      setError("Please enter your name.");
      return;
    }
    if (!phone) {
      setBusy(false);
      setError("Please enter your phone number.");
      return;
    }
    const res = await fetch("/api/table/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId,
        displayName: name,
        phone,
        groupCode: String(fd.get("code") || "") || undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.status === 409) {
      setNeedsCode(true);
      setError("This table is already open. Ask your host for the 6-digit group code.");
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not join");
      return;
    }
    saveGuestSession({
      sessionId: data.session.id,
      memberId: data.memberId,
      tableId: data.session.tableId || tableId,
      isHost: data.created || data.session.hostMemberId === data.memberId,
    });
    router.push(`/order/${data.session.id}`);
  }

  return (
    <main className="join-page">
      <div className="join-hero">
        <Image
          src={CAFE_MEDIA.interior}
          alt=""
          fill
          className="cover"
          priority
          sizes="(max-width: 960px) 100vw, 55vw"
        />
        <div className="join-hero-shade" />
        <div className="join-hero-copy">
          <span className="eyebrow" style={{ color: "var(--gold-300)" }}>
            Welcome to
          </span>
          <div className="h-display h-xl" style={{ marginTop: "0.6rem" }}>
            Lunar Cafe
          </div>
        </div>
      </div>

      <motion.div
        className="join-panel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="table-pill">TABLE · {tableId.replace("lunar-", "").toUpperCase()}</span>
        {resume && (
          <p className="join-resume">
            You already have an open order here.{" "}
            <Link href={orderPath(resume.sessionId)}>Continue to your table</Link>
          </p>
        )}
        <h1 className="h-display h-lg" style={{ margin: "1.1rem 0 0.6rem" }}>
          {closedMsg && !needsCode
            ? "Cafe is closed"
            : needsCode
              ? "Enter your group code"
              : "Start your table"}
        </h1>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          {closedMsg && !needsCode
            ? closedMsg
            : needsCode
              ? "Someone at this table already started the order. Ask them for the code to join the same bill — or enter the same phone you used earlier to resume."
              : "Share your name and phone so we can pull up past visits and loyalty. The first guest becomes the host."}
        </p>

        {!(closedMsg && !needsCode) && (
        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gap: "1rem", marginTop: "1.6rem" }}
        >
          <NeoInput name="name" label="Your name" placeholder="e.g. Ananya" required autoComplete="name" />
          <NeoInput
            name="phone"
            label="Phone number"
            placeholder="10-digit mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
          />
          {needsCode && (
            <NeoInput
              name="code"
              label="Group code"
              placeholder="• • • • • •"
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              style={{ letterSpacing: "0.4em", fontSize: "1.3rem", textAlign: "center" }}
            />
          )}
          {error && (
            <p style={{ color: "#86302a", fontSize: "0.9rem", margin: 0 }}>{error}</p>
          )}
          <NeoButton type="submit" disabled={busy}>
            <KeyRound size={16} /> {needsCode ? "Join table" : "Start ordering"}
          </NeoButton>
        </form>
        )}

        <p
          className="muted"
          style={{ fontSize: "0.8rem", marginTop: "1.4rem", display: "flex", gap: 8 }}
        >
          <ShieldCheck size={16} /> Neighbouring tables can&apos;t join without your code.
        </p>
      </motion.div>
    </main>
  );
}
