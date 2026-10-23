"use client";

import clsx from "clsx";
import { NeoButton } from "@/components/Neo";
import { formatMoney } from "@/lib/cafe";

export type DeskSession = {
  id: string;
  channel?: string;
  status: string;
  externalOrderId?: string;
  orderNote?: string;
  billGeneratedAt?: string;
  paidAt?: string;
  billNumber?: number;
  members?: { id: string; displayName: string; phone?: string; isHost: boolean }[];
  orders?: {
    id: string;
    name: string;
    variantLabel?: string;
    qty: number;
    status: string;
    tokenNumber?: number;
    notes?: string;
  }[];
  bill?: { grandTotal: number; totalQty: number };
};

const SOURCE: Record<string, string> = {
  swiggy: "Swiggy",
  zomato: "Zomato",
  takeaway: "Takeaway",
};

const STATUS_LABEL: Record<string, string> = {
  pending_approval: "Waiting",
  queued: "New in kitchen",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function guestOf(session: DeskSession) {
  return session.members?.find((member) => member.isHost) || session.members?.[0];
}

function cooking(session: DeskSession) {
  return (session.orders || []).some((line) =>
    ["pending_approval", "queued", "preparing"].includes(line.status),
  );
}

export function deskKitchenStatus(session: DeskSession) {
  const lines = (session.orders || []).filter(
    (line) => line.status !== "cancelled" && line.status !== "rejected",
  );
  if (!lines.length) return "No kitchen tickets";
  if (lines.some((line) => line.status === "preparing")) return "Preparing";
  if (lines.some((line) => line.status === "queued" || line.status === "pending_approval")) {
    return "New in kitchen";
  }
  if (lines.every((line) => line.status === "served")) return "Served";
  if (lines.some((line) => line.status === "ready")) return "Ready";
  return STATUS_LABEL[lines[0].status] || lines[0].status;
}

export function DeskOrders({
  kind,
  sessions,
  accepting,
  busyId,
  onNew,
  onHandover,
  onCancel,
  onBill,
  onPay,
}: {
  kind: "online" | "takeaway";
  sessions: DeskSession[];
  accepting: boolean;
  busyId: string | null;
  onNew: (channel: "swiggy" | "zomato" | "takeaway") => void;
  onHandover: (sessionId: string) => void;
  onCancel: (session: DeskSession) => void;
  onBill: (session: DeskSession) => void;
  onPay: (session: DeskSession) => void;
}) {
  return (
    <div className="desk-orders">
      <div className="tables-board-bar">
        {kind === "online" ? (
          <>
            <NeoButton className="btn-sm" disabled={!accepting} onClick={() => onNew("swiggy")}>
              New Swiggy order
            </NeoButton>
            <NeoButton className="btn-sm" disabled={!accepting} onClick={() => onNew("zomato")}>
              New Zomato order
            </NeoButton>
          </>
        ) : (
          <NeoButton className="btn-sm" disabled={!accepting} onClick={() => onNew("takeaway")}>
            New takeaway
          </NeoButton>
        )}
        {!accepting && <span className="muted">Ordering is closed.</span>}
      </div>
      {sessions.length === 0 && (
        <p className="muted">
          {kind === "online"
            ? "No Swiggy or Zomato orders yet. When the partner app rings, enter the order here and mark the source."
            : "No takeaway orders yet."}
        </p>
      )}
      <div className="bill-board">
        {sessions.map((session) => {
          const guest = guestOf(session);
          const lines = (session.orders || []).filter(
            (line) => line.status !== "cancelled" && line.status !== "rejected",
          );
          const token = lines.find((line) => line.tokenNumber)?.tokenNumber;
          const source = SOURCE[session.channel || ""] || "Online";
          const busy = busyId === session.id;
          const kitchen = deskKitchenStatus(session);
          const canCancel = !session.paidAt && !(kind === "takeaway" && session.billGeneratedAt);
          return (
            <article key={session.id} className="bill-card">
              <header className="bill-card-head">
                <div className="bill-card-meta">
                  <div className="bill-card-table">
                    <span className="bill-card-id">{source}</span>
                    {token ? <span className="neo-badge neo-badge-ink">#{token}</span> : null}
                    <span className={clsx("neo-badge", cooking(session) ? "neo-badge-gold" : "neo-badge-mint")}>
                      {kitchen}
                    </span>
                    {session.billGeneratedAt && !session.paidAt && (
                      <span className="neo-badge neo-badge-rose">
                        Bill #{session.billNumber} unpaid
                      </span>
                    )}
                  </div>
                  <div className="bill-card-chips">
                    <span>{guest?.displayName || "Guest"}</span>
                    {guest?.phone ? <span>{guest.phone}</span> : null}
                    {session.externalOrderId ? <span>Order {session.externalOrderId}</span> : null}
                  </div>
                </div>
                <strong>{formatMoney(session.bill?.grandTotal || 0)}</strong>
              </header>
              <ul className="desk-order-lines">
                {lines.map((line) => (
                  <li key={line.id}>
                    <span>
                      {line.qty}× {line.name}
                      {line.variantLabel ? ` · ${line.variantLabel}` : ""}
                    </span>
                    <span className="muted">{STATUS_LABEL[line.status] || line.status.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
              {session.orderNote && <p className="kitchen-ticket-note">“{session.orderNote}”</p>}
              <div className="bill-card-actions">
                {kind === "online" && (
                  <NeoButton
                    className="btn-sm"
                    disabled={busy || cooking(session)}
                    onClick={() => onHandover(session.id)}
                  >
                    Handed over
                  </NeoButton>
                )}
                {kind === "takeaway" && !session.billGeneratedAt && (
                  <NeoButton className="btn-sm" disabled={busy} onClick={() => onBill(session)}>
                    Generate bill
                  </NeoButton>
                )}
                {kind === "takeaway" && session.billGeneratedAt && !session.paidAt && (
                  <NeoButton className="btn-sm" disabled={busy} onClick={() => onPay(session)}>
                    Take payment
                  </NeoButton>
                )}
                {canCancel && (
                  <NeoButton
                    variant="ghost"
                    className="btn-sm"
                    disabled={busy}
                    onClick={() => onCancel(session)}
                  >
                    Cancel
                  </NeoButton>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
