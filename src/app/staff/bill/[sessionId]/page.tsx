"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { NeoButton, NeoCard } from "@/components/Neo";
import { CAFE, formatMoney } from "@/lib/cafe";
import type { BillBreakdown } from "@/lib/bill";
import type { TableSession } from "@/lib/types";

export default function BillPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<TableSession | null>(null);
  const [bill, setBill] = useState<BillBreakdown | null>(null);

  useEffect(() => {
    fetch(`/api/session/${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        setSession(d.session);
        setBill(d.bill);
      });
  }, [sessionId]);

  if (!session || !bill) return <main style={{ padding: "2rem" }}>Loading bill…</main>;

  function sharePdf() {
    window.print();
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <Link href="/staff" className="btn neo-btn-ghost">
          ← Back
        </Link>
        <NeoButton onClick={() => window.print()}>Print / PDF</NeoButton>
        <NeoButton variant="ghost" onClick={sharePdf}>
          Thermal layout
        </NeoButton>
      </div>

      <NeoCard className="thermal">
        <div style={{ textAlign: "center" }}>
          <strong>LUNAR CAFE</strong>
          <div>{CAFE.addressLines[0]}</div>
          <div>{CAFE.addressLines[1]}</div>
          <div>GSTIN :- {CAFE.gstin}</div>
        </div>
        <hr />
        <div>Dine In: {session.tableId}</div>
        <div>
          Date: {new Date(session.updatedAt).toLocaleString()}
        </div>
        {session.billNumber && <div>Bill No.: {session.billNumber}</div>}
        <div>
          Token No.:{" "}
          {[...new Set(session.batches.map((b) => b.tokenNumber))].join(", ")}
        </div>
        <hr />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto auto",
            gap: "0.25rem",
            fontSize: "0.85rem",
          }}
        >
          <strong>Item</strong>
          <strong>Qty</strong>
          <strong>Price</strong>
          <strong>Amt</strong>
          {session.orders
            .filter(
              (o) =>
                !["pending_approval", "rejected", "cancelled"].includes(
                  o.status,
                ),
            )
            .map((o) => (
              <div key={o.id} style={{ display: "contents" }}>
                <span>
                  {o.name}
                  {o.variantLabel ? ` (${o.variantLabel})` : ""}
                </span>
                <span>{o.qty}</span>
                <span>{o.unitPrice.toFixed(2)}</span>
                <span>{(o.unitPrice * o.qty).toFixed(2)}</span>
              </div>
            ))}
        </div>
        <hr />
        <Row label="Total Qty" value={String(bill.totalQty)} />
        <Row label="Sub Total" value={bill.subtotal.toFixed(2)} />
        {bill.discountValue > 0 && (
          <Row
            label="Discount"
            value={`(${bill.discountValue.toFixed(2)})`}
          />
        )}
        {session.serviceChargeEnabled && (
          <Row
            label="Service Charge OP"
            value={bill.serviceCharge.toFixed(2)}
          />
        )}
        <Row label="CGST @ 2.5%" value={bill.cgst.toFixed(2)} />
        <Row label="SGST @ 2.5%" value={bill.sgst.toFixed(2)} />
        <Row label="Round off" value={bill.roundOff.toFixed(2)} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 800,
            marginTop: "0.5rem",
          }}
        >
          <span>Grand Total</span>
          <span>{formatMoney(bill.grandTotal)}</span>
        </div>
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          Thank You & Visit Again..!
        </p>
      </NeoCard>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
