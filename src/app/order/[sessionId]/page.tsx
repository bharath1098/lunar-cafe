"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Compass,
  Copy,
  History,
  LayoutGrid,
  List,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { ClosingSoonBanner } from "@/components/ClosingSoonBanner";
import { NeoButton, NeoSelect, NeoTextarea } from "@/components/Neo";
import { usePrefs } from "@/components/Providers";
import { CategoryBar } from "@/components/CategoryBar";
import { PreferenceMenu } from "@/components/PreferenceMenu";
import { formatMoney } from "@/lib/cafe";
import { clearActiveGuest, saveGuestSession } from "@/lib/guest-session";
import { imageForMenuItem } from "@/lib/media";
import type {
  CartLine,
  GuestVisit,
  MenuItem,
  OrderLine,
  TableSession,
  VisitItem,
} from "@/lib/types";
import type { BillBreakdown } from "@/lib/bill";

type Payload = {
  session: TableSession;
  bill: BillBreakdown;
  menu: MenuItem[];
  table?: { id: string; label: string };
  hostVisits?: GuestVisit[];
  loyalty?: { phone: string; name: string; points: number } | null;
  cafe?: { name: string; upiId: string };
  ordering?: {
    acceptingOrders: boolean;
    hoursLabel: string;
    localTimeLabel: string;
    closingSoon?: boolean;
    minutesUntilClose?: number | null;
    reason?: string;
  };
};

const STAGES = ["pending_approval", "queued", "preparing", "ready", "served"];
const STAGE_LABEL: Record<string, string> = {
  pending_approval: "Waiting for waiter",
  queued: "Sent to kitchen",
  preparing: "Being prepared",
  ready: "Ready to serve",
  served: "Served",
  rejected: "Not available",
  cancelled: "Cancelled",
};

export default function OrderPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { currency } = usePrefs();
  const money = (n: number) => formatMoney(n, currency);

  const [data, setData] = useState<Payload | null>(null);
  const [memberId, setMemberId] = useState("");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [variantId, setVariantId] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [openVisitId, setOpenVisitId] = useState<string | null>(null);
  const [reorderingKey, setReorderingKey] = useState<string | null>(null);
  const [requestingBill, setRequestingBill] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchReason, setSwitchReason] = useState("");
  const [switchBusy, setSwitchBusy] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [menuView, setMenuView] = useState<"card" | "present">("present");
  const [moreCatsOpen, setMoreCatsOpen] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payQr, setPayQr] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lunar-menu-view");
    if (saved === "card" || saved === "present") setMenuView(saved);
  }, []);

  function chooseMenuView(next: "card" | "present") {
    setMenuView(next);
    localStorage.setItem("lunar-menu-view", next);
  }

  useEffect(() => {
    const raw = localStorage.getItem(`lunar-session-${sessionId}`);
    if (raw) {
      try {
        setMemberId(JSON.parse(raw).memberId);
      } catch {
        /* ignore */
      }
    }
  }, [sessionId]);

  const load = useCallback(async (quiet = false) => {
    const res = await fetch(`/api/session/${sessionId}`, {
      cache: "no-store",
      headers: quiet ? { "X-Lunar-Quiet": "1" } : undefined,
    });
    if (res.ok) setData(await res.json());
  }, [sessionId]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      void load(true);
    }, 2500);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    if (!data || !memberId) return;
    if (data.session.status === "closed") {
      clearActiveGuest(sessionId);
      return;
    }
    saveGuestSession({
      sessionId,
      memberId,
      tableId: data.session.tableId,
      isHost: data.session.hostMemberId === memberId,
    });
  }, [data, memberId, sessionId]);

  const categories = useMemo(
    () => (data ? ["All", ...new Set(data.menu.map((m) => m.category))] : []),
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.menu.filter(
      (m) =>
        (category === "All" || m.category === category) &&
        (!vegOnly || m.isVeg) &&
        (!q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)),
    );
  }, [data, category, query, vegOnly]);

  const isHost = data?.session.hostMemberId === memberId;
  const cartCount = data?.session.cart.reduce((s, c) => s + c.qty, 0) ?? 0;
  const cartTotal =
    data?.session.cart.reduce((s, c) => s + c.unitPrice * c.qty, 0) ?? 0;

  async function syncCart(cart: CartLine[]) {
    await fetch(`/api/session/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_cart", memberId, cart }),
    });
    load();
  }

  function openItem(item: MenuItem) {
    setSelected(item);
    setVariantId(item.variants?.[0]?.id || "");
    const init: Record<string, string> = {};
    item.choices?.forEach((c) => {
      init[c.id] = c.options[0];
    });
    setChoices(init);
    setNotes("");
    setQty(1);
  }

  const selectedPrice = selected
    ? (selected.variants?.find((v) => v.id === variantId)?.price ?? selected.price)
    : 0;

  function addToCart() {
    if (!selected || !data || !memberId) return;
    const variant = selected.variants?.find((v) => v.id === variantId);
    const line: CartLine = {
      id: crypto.randomUUID(),
      menuItemId: selected.id,
      name: selected.name,
      variantLabel: variant?.label,
      choices: { ...choices },
      notes: notes || undefined,
      unitPrice: variant?.price ?? selected.price,
      qty,
      addedByMemberId: memberId,
    };
    syncCart([...data.session.cart, line]);
    setSelected(null);
    setMsg(`${selected.name} added to the shared cart`);
  }

  function changeLineQty(id: string, delta: number) {
    if (!data) return;
    const next = data.session.cart
      .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
      .filter((c) => c.qty > 0);
    syncCart(next);
  }

  async function placeOrder() {
    const res = await fetch(`/api/session/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "place_order", memberId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || "Failed");
      return;
    }
    setMsg(`Order sent · Token #${json.tokenNumber}. Your waiter will confirm.`);
    setCartOpen(false);
    load();
  }

  async function requestBill() {
    if (!memberId || requestingBill || data?.session.billRequestedAt) return;
    setRequestingBill(true);
    try {
      const res = await fetch(`/api/session/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_bill", memberId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || "Could not request the bill");
        return;
      }
      const left = Number(json.cancelledPending || 0);
      const billed = Number(json.billedCount || 0);
      setMsg(
        left > 0
          ? `Bill requested · ${billed} accepted item${billed === 1 ? "" : "s"} on the bill. ${left} unaccepted left off.`
          : `Bill requested · ${billed} accepted item${billed === 1 ? "" : "s"} on the bill. Staff notified.`,
      );
      setCartOpen(false);
      load();
    } finally {
      setRequestingBill(false);
    }
  }

  async function submitTableSwitch() {
    if (!memberId || switchBusy) return;
    const reason = switchReason.trim();
    if (reason.length < 3) {
      setSwitchError("Please mention why this table is uncomfortable (at least 3 characters).");
      return;
    }
    setSwitchBusy(true);
    setSwitchError("");
    try {
      const res = await fetch(`/api/session/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_table_switch",
          memberId,
          reason,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSwitchError(json.error || "Could not request a table switch");
        return;
      }
      setSwitchOpen(false);
      setSwitchReason("");
      setMsg("Table switch requested — staff will move you to another table.");
      load();
    } finally {
      setSwitchBusy(false);
    }
  }

  async function openPayment() {
    if (!data?.session.billGeneratedAt || !data.cafe?.upiId) return;
    const amount = data.bill.grandTotal.toFixed(2);
    const note = data.session.billNumber
      ? `Lunar Cafe Bill ${data.session.billNumber}`
      : "Lunar Cafe Bill";
    const upi = `upi://pay?pa=${encodeURIComponent(data.cafe.upiId)}&pn=${encodeURIComponent(data.cafe.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    const QRCode = (await import("qrcode")).default;
    const url = await QRCode.toDataURL(upi, {
      width: 280,
      margin: 2,
      color: { dark: "#0c2f2b", light: "#ffffff" },
    });
    setPayQr(url);
    setPayOpen(true);
  }

  async function confirmPaid() {
    if (!memberId || submittingPay) return;
    setSubmittingPay(true);
    try {
      const res = await fetch(`/api/session/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_payment", memberId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || "Could not submit payment");
        return;
      }
      setPayOpen(false);
      setMsg("Payment sent. Waiting for reception or owner to approve.");
      load();
    } finally {
      setSubmittingPay(false);
    }
  }

  async function orderAgainItem(item: VisitItem, key: string) {
    if (!memberId || reorderingKey) return;
    setReorderingKey(key);
    const res = await fetch(`/api/session/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reorder_visit",
        memberId,
        items: [item],
      }),
    });
    const json = await res.json();
    setReorderingKey(null);
    if (!res.ok) {
      setMsg(json.error || "Could not add that item");
      return;
    }
    setMsg(`${item.name} added to the shared cart`);
    load();
  }

  if (!data) {
    return (
      <main style={{ minHeight: "calc(100 * var(--svh))", display: "grid", placeItems: "center" }}>
        <p className="muted">Loading your table…</p>
      </main>
    );
  }

  if (data.session.status === "closed") {
    return (
      <main style={{ minHeight: "calc(100 * var(--svh))", display: "grid", placeItems: "center", padding: "1rem" }}>
        <div className="neo-card" style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 className="h-display h-md">This table is closed</h1>
          <p className="muted">Thank you for dining with us! Scan the QR again when seated.</p>
          <p style={{ marginTop: "1.25rem" }}>
            <Link href="/" className="order-closed-home">
              Visit Lunar Cafe
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // Local const so nested render helpers keep a narrowed Payload (useState can change).
  const live = data;
  const showHistory = isHost && (live.hostVisits?.length ?? 0) > 0;

  function renderHistoryPanel() {
    if (!showHistory) return null;
    return (
      <div className="neo-card order-again-card">
        <h3 className="h-display h-md" style={{ marginBottom: "0.35rem" }}>
          <History size={18} style={{ display: "inline", marginRight: 6 }} />
          Order again
        </h3>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
          Past visits — tap + on any dish to add it to the shared cart.
        </p>
        <div className="visit-list">
          {live.hostVisits!.map((visit) => {
            const open = openVisitId === visit.sessionId;
            return (
              <div key={visit.sessionId} className={clsx("visit-row", open && "visit-row-open")}>
                <button
                  type="button"
                  className="visit-row-toggle"
                  onClick={() => setOpenVisitId(open ? null : visit.sessionId)}
                  aria-expanded={open}
                >
                  <span>
                    <strong>{formatVisitDate(visit.visitedAt)}</strong>
                    <small className="muted">
                      {visit.tableLabel} · {visit.itemCount} item
                      {visit.itemCount === 1 ? "" : "s"}
                    </small>
                  </span>
                  <ChevronDown size={18} className={clsx("visit-chevron", open && "on")} />
                </button>
                {open && (
                  <div className="visit-detail">
                    {visit.items.map((item, i) => {
                      const key = `${visit.sessionId}-${i}`;
                      const menuItem = live.menu.find((m) => m.id === item.menuItemId);
                      const available = Boolean(menuItem?.available);
                      const src =
                        menuItem?.image ||
                        imageForMenuItem(item.name, menuItem?.category || "");
                      const busy = reorderingKey === key;
                      return (
                        <div
                          key={key}
                          className={clsx("visit-item", !available && "is-unavailable")}
                        >
                          <span className="visit-item-thumb">
                            <Image src={src} alt="" fill className="cover" sizes="52px" />
                          </span>
                          <span className="visit-item-meta">
                            <strong>
                              {item.name}
                              {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                            </strong>
                            <small className="muted">
                              {item.qty}× · {money(item.unitPrice)}
                              {!available ? " · unavailable" : ""}
                            </small>
                          </span>
                          <button
                            type="button"
                            className="visit-item-add"
                            disabled={!available || Boolean(reorderingKey)}
                            aria-label={`Add ${item.name} to cart`}
                            onClick={() => orderAgainItem(item, key)}
                          >
                            {busy ? (
                              <span className="visit-item-busy" aria-hidden />
                            ) : (
                              <Plus size={16} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderCartPanels() {
    return (
      <>
        <div className="neo-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="h-display h-md">Shared cart</h3>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              {cartCount} item{cartCount === 1 ? "" : "s"}
            </span>
          </div>
          {live.session.cart.length === 0 && (
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Nothing here yet. Everyone at the table can add dishes.
            </p>
          )}
          {live.session.cart.map((c) => {
            const who = live.session.members.find((m) => m.id === c.addedByMemberId);
            return (
              <div key={c.id} className="list-row">
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: "0.92rem" }}>
                    {c.name}
                    {c.variantLabel ? ` · ${c.variantLabel}` : ""}
                  </strong>
                  <div className="muted" style={{ fontSize: "0.75rem" }}>
                    {who?.displayName || "Guest"}
                    {c.notes ? ` · ${c.notes}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="qty-stepper" style={{ gap: 6, padding: 2 }}>
                    <button onClick={() => changeLineQty(c.id, -1)} aria-label="Less">
                      {c.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                    </button>
                    <b>{c.qty}</b>
                    <button onClick={() => changeLineQty(c.id, 1)} aria-label="More">
                      <Plus size={14} />
                    </button>
                  </div>
                  <b style={{ minWidth: 64, textAlign: "right" }}>{money(c.unitPrice * c.qty)}</b>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: "1rem" }}>
            {live.ordering && !live.ordering.acceptingOrders && (
              <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.7rem" }}>
                {live.ordering.reason || "Cafe is not accepting new orders right now."}
              </p>
            )}
            <NeoButton
              className="w-full"
              disabled={
                !live.session.cart.length ||
                !memberId ||
                Boolean(live.ordering && !live.ordering.acceptingOrders)
              }
              onClick={placeOrder}
            >
              <ShoppingBag size={16} /> Place order · {money(cartTotal)}
            </NeoButton>
          </div>
        </div>

        <div className="neo-card">
          <h3 className="h-display h-md" style={{ marginBottom: "0.6rem" }}>
            <Receipt size={18} style={{ display: "inline", marginRight: 6 }} />
            Running bill
          </h3>
          <div className="bill-row"><span>Subtotal</span><span>{money(live.bill.subtotal)}</span></div>
          {live.bill.discountValue > 0 && (
            <div className="bill-row"><span>Discount</span><span>- {money(live.bill.discountValue)}</span></div>
          )}
          {live.session.serviceChargeEnabled && (
            <div className="bill-row"><span>Service charge (5%)</span><span>{money(live.bill.serviceCharge)}</span></div>
          )}
          <div className="bill-row"><span>CGST 2.5%</span><span>{money(live.bill.cgst)}</span></div>
          <div className="bill-row"><span>SGST 2.5%</span><span>{money(live.bill.sgst)}</span></div>
          <div className="bill-row"><span>Round off</span><span>{money(live.bill.roundOff)}</span></div>
        <div className="bill-total"><span>Total</span><span>{money(live.bill.grandTotal)}</span></div>
        {live.session.billNumber && (
          <p className="muted" style={{ margin: "0.45rem 0 0", fontSize: "0.8rem" }}>
            Bill No. {live.session.billNumber}
          </p>
        )}
        <p className="muted" style={{ margin: "0.55rem 0 0", fontSize: "0.78rem" }}>
          Only accepted orders are billed. Items still waiting for the waiter stay off the bill.
        </p>
        {live.session.paymentAwaitingApproval ? (
          <p className="bill-requested-note">
            Payment submitted. Reception or the owner will confirm and close your table.
          </p>
        ) : live.session.billGeneratedAt ? (
          <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.55rem" }}>
            <p className="bill-requested-note" style={{ margin: 0 }}>
              Your bill is ready. Pay by UPI QR, then wait for staff approval.
            </p>
            <NeoButton className="w-full" onClick={openPayment}>
              <Smartphone size={16} /> Make payment
            </NeoButton>
          </div>
        ) : live.session.billRequestedAt ? (
          <p className="bill-requested-note">
            Bill requested
            {live.session.billRequestedByName
              ? ` by ${live.session.billRequestedByName}`
              : ""}
            . Reception will apply any discount or loyalty, then generate the bill.
          </p>
        ) : (
          <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.55rem" }}>
            <NeoButton
              className="w-full"
              disabled={!memberId || requestingBill}
              onClick={requestBill}
            >
              <Receipt size={16} />
              {requestingBill ? "Requesting…" : "Request bill"}
            </NeoButton>
            {live.session.tableSwitchRequestedAt ? (
              <p className="bill-requested-note" style={{ margin: 0 }}>
                Switch requested
                {live.session.tableSwitchRequestedByName
                  ? ` by ${live.session.tableSwitchRequestedByName}`
                  : ""}
                . Waiting for staff to move your table.
              </p>
            ) : (
              <NeoButton
                variant="ghost"
                className="w-full"
                disabled={!memberId || Boolean(live.session.billGeneratedAt)}
                onClick={() => {
                  setSwitchError("");
                  setSwitchOpen(true);
                }}
              >
                <ArrowLeftRight size={16} />
                Switch table
              </NeoButton>
            )}
          </div>
        )}
        {live.session.billRequestedAt &&
          !live.session.billGeneratedAt &&
          (live.session.tableSwitchRequestedAt ? (
            <p className="bill-requested-note" style={{ marginTop: "0.75rem" }}>
              Switch requested
              {live.session.tableSwitchRequestedByName
                ? ` by ${live.session.tableSwitchRequestedByName}`
                : ""}
              . Waiting for staff to move your table.
            </p>
          ) : (
            <div style={{ marginTop: "0.75rem" }}>
              <NeoButton
                variant="ghost"
                className="w-full"
                disabled={!memberId}
                onClick={() => {
                  setSwitchError("");
                  setSwitchOpen(true);
                }}
              >
                <ArrowLeftRight size={16} />
                Switch table
              </NeoButton>
            </div>
          ))}
        {live.session.tableSwitches && live.session.tableSwitches.length > 0 && (
          <p className="muted" style={{ margin: "0.65rem 0 0", fontSize: "0.78rem" }}>
            Moved from{" "}
            {live.session.tableSwitches
              .map(
                (sw) =>
                  `${sw.fromTableId.replace("lunar-", "").toUpperCase()} → ${sw.toTableId.replace("lunar-", "").toUpperCase()}`,
              )
              .join(", ")}
          </p>
        )}
      </div>

        <div className="neo-card">
          <h3 className="h-display h-md" style={{ marginBottom: "0.4rem" }}>Your orders</h3>
          {live.session.orders.length === 0 && (
            <p className="muted" style={{ fontSize: "0.9rem" }}>No orders placed yet.</p>
          )}
          <OrdersByTable
            orders={live.session.orders}
            currentTableId={live.session.tableId}
          />
        </div>
      </>
    );
  }

  return (
    <div className="order-page">
      <ClosingSoonBanner ordering={live.ordering} />
      <header className="order-top">
        <div className="order-top-inner">
          <div className="order-top-identity">
            <span className="table-pill">
              {data.session.tableId.replace("lunar-", "").toUpperCase()}
            </span>
            <div className="order-top-guests">
              <Users size={13} aria-hidden />
              <span>{data.session.members.map((m) => m.displayName).join(", ")}</span>
            </div>
          </div>
          {isHost ? (
            <GroupCodeChip code={data.session.groupCode} />
          ) : (
            <span className="neo-badge neo-badge-mint order-top-joined">Joined</span>
          )}
          <div className="order-top-actions">
            <Link href="/" className="order-explore-btn" aria-label="Explore Lunar Cafe">
              <Compass size={15} aria-hidden />
              <span>Explore cafe</span>
            </Link>
            <PreferenceMenu />
          </div>
        </div>
      </header>

      <div className={clsx("order-layout", showHistory ? "has-history" : "is-two-col")}>
        <div className="order-main">
          <div className="order-toolbar">
            <label className="search-box">
              <Search size={18} />
              <input
                placeholder="Search the menu…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={clsx("chip veg-toggle", vegOnly && "chip-on")}
              aria-pressed={vegOnly}
              onClick={() => setVegOnly((v) => !v)}
            >
              <span className="veg-dot" aria-hidden />
              Veg
            </button>
            <div className="view-switch" role="group" aria-label="Menu layout">
              <button
                type="button"
                className={clsx(menuView === "card" && "on")}
                aria-pressed={menuView === "card"}
                onClick={() => chooseMenuView("card")}
              >
                <LayoutGrid size={15} /> Card
              </button>
              <button
                type="button"
                className={clsx(menuView === "present" && "on")}
                aria-pressed={menuView === "present"}
                onClick={() => chooseMenuView("present")}
              >
                <List size={15} /> Present
              </button>
            </div>
          </div>
          <CategoryBar
            categories={categories}
            value={category}
            moreOpen={moreCatsOpen}
            onMoreOpenChange={setMoreCatsOpen}
            onChange={(next) => {
              setCategory(next);
              setMoreCatsOpen(false);
            }}
          />

          <ScrollHint
            wrapClassName="order-menu-wrap"
            className={clsx("order-menu-list", menuView === "card" && "is-cards")}
          >
            {filtered.map((item) => {
              const src = item.image || imageForMenuItem(item.name, item.category);
              const priceLabel = item.variants
                ? `from ${money(Math.min(...item.variants.map((v) => v.price)))}`
                : money(item.price);
              if (menuView === "card") {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="order-menu-card"
                    onClick={() => openItem(item)}
                  >
                    <span className="order-menu-card-photo">
                      <Image src={src} alt="" fill className="cover" sizes="240px" />
                      {(item.isNew || item.isHighlighted) && (
                        <span className="order-menu-card-tags">
                          {item.isNew && <span className="neo-badge neo-badge-gold">New</span>}
                          {item.isHighlighted && <span className="neo-badge neo-badge-ink">Signature</span>}
                        </span>
                      )}
                    </span>
                    <span className="order-menu-card-body">
                      <strong>
                        <span className={clsx("veg-dot", !item.isVeg && "non")} />
                        <span className="order-menu-card-title">{item.name}</span>
                      </strong>
                      <small>{item.description || " "}</small>
                      <span className="order-menu-card-foot">
                        <span className="order-menu-price">{priceLabel}</span>
                        <span className="add-circle" aria-hidden>
                          <Plus size={16} />
                        </span>
                      </span>
                    </span>
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  className="order-menu-row"
                  onClick={() => openItem(item)}
                >
                  <span className="order-menu-thumb">
                    <Image src={src} alt="" fill className="cover" sizes="84px" />
                  </span>
                  <span className="order-menu-meta">
                    <strong>
                      <span className={clsx("veg-dot", !item.isVeg && "non")} style={{ marginRight: 6 }} />
                      {item.name}
                    </strong>
                    <span>
                      {item.isNew && <span className="neo-badge neo-badge-gold">New</span>}{" "}
                      {item.isHighlighted && <span className="neo-badge neo-badge-ink">Signature</span>}
                    </span>
                    {item.description && <small>{item.description}</small>}
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <span className="order-menu-price">{priceLabel}</span>
                    <span className="add-circle">
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
                Nothing found.
              </p>
            )}
          </ScrollHint>
        </div>

        {showHistory && (
          <ScrollHint
            wrapClassName="order-history-wrap order-side-wrap"
            className="order-side order-history order-side-desktop"
          >
            {renderHistoryPanel()}
          </ScrollHint>
        )}

        <ScrollHint
          wrapClassName="order-side-wrap"
          className="order-side order-cart order-side-desktop"
        >
          {renderCartPanels()}
        </ScrollHint>
      </div>

      {/* Mobile bill / cart fab */}
      <button
        type="button"
        className="cart-fab"
        onClick={() => setCartOpen(true)}
        aria-label={cartCount > 0 ? `View cart, ${cartCount} items` : "Bill and orders"}
      >
        {cartCount > 0 ? <ShoppingBag size={22} /> : <Receipt size={22} />}
        {cartCount > 0 && (
          <em className="cart-fab-badge">{cartCount > 99 ? "99+" : cartCount}</em>
        )}
      </button>

      {/* Toast */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "fixed",
              top: 80,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 90,
              background: "var(--forest-900)",
              color: "var(--on-dark)",
              padding: "0.8rem 1.2rem",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: "0.88rem",
              boxShadow: "var(--sh-lift)",
              maxWidth: "calc(92 * var(--vw))",
            }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPI payment sheet */}
      <AnimatePresence>
        {payOpen && (
          <>
            <motion.div
              className="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPayOpen(false)}
            />
            <motion.div
              className="sheet pay-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <div className="sheet-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <h3 className="h-display h-md">Pay with UPI</h3>
                    <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.88rem" }}>
                      Scan this QR in any UPI app. Amount {money(data.bill.grandTotal)}
                      {data.session.billNumber ? ` · Bill #${data.session.billNumber}` : ""}.
                    </p>
                  </div>
                  <button
                    className="burger"
                    style={{ display: "grid" }}
                    onClick={() => setPayOpen(false)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="pay-qr-wrap">
                  {payQr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={payQr} alt="UPI payment QR" width={240} height={240} />
                  ) : (
                    <p className="muted">Preparing QR…</p>
                  )}
                </div>
                <p className="muted" style={{ textAlign: "center", fontSize: "0.82rem", margin: 0 }}>
                  {data.cafe?.upiId}
                </p>
                <NeoButton className="w-full" disabled={submittingPay} onClick={confirmPaid}>
                  {submittingPay ? "Sending…" : "I've paid — notify staff"}
                </NeoButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Item sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <div className="sheet-photo">
                <Image
                  src={selected.image || imageForMenuItem(selected.name, selected.category)}
                  alt={selected.name}
                  fill
                  className="cover"
                  sizes="560px"
                />
                <button
                  className="burger"
                  style={{ display: "grid", position: "absolute", top: 14, right: 14 }}
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="sheet-body">
                <div>
                  <h3 className="h-display h-md">{selected.name}</h3>
                  {selected.description && (
                    <p className="muted" style={{ margin: "0.4rem 0 0", lineHeight: 1.5 }}>
                      {selected.description}
                    </p>
                  )}
                </div>
                {selected.variants && (
                  <NeoSelect
                    label="Choose option"
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value)}
                  >
                    {selected.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label} — {money(v.price)}
                      </option>
                    ))}
                  </NeoSelect>
                )}
                {selected.choices?.map((c) => (
                  <NeoSelect
                    key={c.id}
                    label={c.label}
                    value={choices[c.id]}
                    onChange={(e) =>
                      setChoices((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                  >
                    {c.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </NeoSelect>
                ))}
                <NeoTextarea
                  label="Customise (spice level, no onion…)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div className="qty-stepper">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less">
                      <Minus size={16} />
                    </button>
                    <b>{qty}</b>
                    <button onClick={() => setQty((q) => q + 1)} aria-label="More">
                      <Plus size={16} />
                    </button>
                  </div>
                  <NeoButton onClick={addToCart} className="flex-1">
                    Add · {money(selectedPrice * qty)}
                  </NeoButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile cart sheet */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              className="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              className="sheet"
              style={{ background: "var(--cream-100)", padding: "1rem" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <button className="burger" style={{ display: "grid" }} onClick={() => setCartOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: "grid", gap: "1rem" }}>
                {renderHistoryPanel()}
                {renderCartPanels()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {switchOpen && (
          <>
            <motion.div
              className="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !switchBusy && setSwitchOpen(false)}
            />
            <motion.div
              className="sheet"
              role="dialog"
              aria-label="Request table switch"
              style={{ background: "var(--cream-100)", padding: "1.1rem 1rem 1.25rem" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <strong className="h-display" style={{ fontSize: "1.15rem" }}>
                  Switch table
                </strong>
                <button
                  className="burger"
                  style={{ display: "grid" }}
                  aria-label="Close"
                  disabled={switchBusy}
                  onClick={() => setSwitchOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="muted" style={{ margin: "0 0 0.85rem", fontSize: "0.88rem" }}>
                Tell us what feels uncomfortable. Staff will pick a free table and move your order.
              </p>
              <NeoTextarea
                label="Reason for discomfort"
                value={switchReason}
                onChange={(e) => {
                  setSwitchReason(e.target.value);
                  if (switchError) setSwitchError("");
                }}
                rows={3}
                maxLength={280}
              />
              {switchError && (
                <p style={{ color: "#c45a6a", fontSize: "0.84rem", margin: "0.45rem 0 0" }}>
                  {switchError}
                </p>
              )}
              <div style={{ display: "flex", gap: "0.55rem", marginTop: "0.95rem" }}>
                <NeoButton
                  variant="ghost"
                  className="flex-1"
                  disabled={switchBusy}
                  onClick={() => setSwitchOpen(false)}
                >
                  Cancel
                </NeoButton>
                <NeoButton
                  className="flex-1"
                  disabled={switchBusy || switchReason.trim().length < 3}
                  onClick={() => void submitTableSwitch()}
                >
                  {switchBusy ? "Sending…" : "Request switch"}
                </NeoButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScrollHint({
  children,
  className,
  wrapClassName,
}: {
  children: ReactNode;
  className: string;
  wrapClassName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 16);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
      mo.disconnect();
    };
  }, [measure]);

  return (
    <div className={wrapClassName}>
      <div ref={ref} className={className}>
        {children}
      </div>
      {moreBelow && <div className="scroll-more" aria-hidden="true" />}
    </div>
  );
}

function GroupCodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* ignore — still show feedback if write fails in some browsers */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const display = code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  return (
    <button
      type="button"
      className={clsx("code-chip", copied && "is-copied")}
      onClick={copyCode}
      aria-label={copied ? "Group code copied" : `Copy group code ${code}`}
      title="Tap to copy — friends need this to join your table"
    >
      <span className="code-chip-meta">
        <span className="code-chip-label">{copied ? "Copied" : "Table code"}</span>
        <span className="code-chip-digits">{display}</span>
      </span>
      <span className="code-chip-icon" aria-hidden>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </span>
    </button>
  );
}

function formatVisitDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function shortTable(tableId: string) {
  return tableId.replace(/^lunar-/i, "").toUpperCase();
}

function OrdersByTable({
  orders,
  currentTableId,
}: {
  orders: OrderLine[];
  currentTableId: string;
}) {
  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let lastTable = "";
  const showSplits = sorted.some((o) => (o.tableId || currentTableId) !== currentTableId)
    || new Set(sorted.map((o) => o.tableId || currentTableId)).size > 1;

  return (
    <>
      {sorted.map((o) => {
        const tableId = o.tableId || currentTableId;
        const showHead = showSplits && tableId !== lastTable;
        lastTable = tableId;
        return (
          <div key={o.id}>
            {showHead && (
              <p className="order-table-split">
                Placed at table {shortTable(tableId)}
                {tableId === currentTableId ? " (current)" : ""}
              </p>
            )}
            <OrderRow order={o} />
          </div>
        );
      })}
    </>
  );
}

function OrderRow({ order }: { order: OrderLine }) {
  const stage = STAGES.indexOf(order.status);
  const bad = order.status === "rejected" || order.status === "cancelled";
  return (
    <div className="list-row" style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontSize: "0.92rem" }}>
          {order.qty}× {order.name}
          {order.variantLabel ? ` · ${order.variantLabel}` : ""}
        </strong>
        <span
          className={clsx(
            "neo-badge",
            bad ? "neo-badge-rose" : order.status === "ready" ? "neo-badge-gold" : "neo-badge-mint",
          )}
        >
          {STAGE_LABEL[order.status] || order.status}
        </span>
      </div>
      {!bad && (
        <div className="status-track">
          {STAGES.map((_, i) => (
            <i key={i} className={i <= stage ? "on" : ""} />
          ))}
        </div>
      )}
      {order.tokenNumber && (
        <small className="muted">Token #{order.tokenNumber}</small>
      )}
      {order.rejectReason && (
        <div style={{ color: "#86302a", fontSize: "0.82rem", marginTop: 4 }}>
          {order.rejectReason}
        </div>
      )}
    </div>
  );
}
