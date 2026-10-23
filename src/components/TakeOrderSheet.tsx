"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { LayoutGrid, List, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { CategoryBar } from "@/components/CategoryBar";
import { NeoButton, NeoInput } from "@/components/Neo";
import { formatMoney } from "@/lib/cafe";
import { imageForMenuItem } from "@/lib/media";
import type { MenuItem } from "@/lib/types";

type DraftLine = {
  key: string;
  menuItemId: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  choices?: Record<string, string>;
  notes?: string;
  unitPrice: number;
  qty: number;
};

type Picker = {
  item: MenuItem;
  variantId: string;
  choices: Record<string, string>;
  notes: string;
  qty: number;
};

export type TakeOrderSession = {
  id: string;
  status: string;
  members: {
    id: string;
    displayName: string;
    phone?: string;
    isHost: boolean;
  }[];
  orders: {
    id: string;
    name: string;
    variantLabel?: string;
    choices?: Record<string, string>;
    notes?: string;
    unitPrice: number;
    qty: number;
    status: string;
    tokenNumber?: number;
    orderedByMemberId: string;
    takenByStaffName?: string;
    assignedWaiterName?: string;
    isCoverOrder?: boolean;
    createdAt: string;
    rejectReason?: string;
  }[];
  cart: {
    id: string;
    name: string;
    variantLabel?: string;
    qty: number;
    unitPrice: number;
    notes?: string;
  }[];
  batches: {
    id: string;
    tokenNumber: number;
    createdAt: string;
    itemIds: string[];
  }[];
  bill?: {
    subtotal: number;
    taxTotal: number;
    serviceCharge: number;
    discountValue: number;
    grandTotal: number;
    totalQty: number;
  };
  billGeneratedAt?: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending_approval: "Waiting for waiter",
  queued: "In kitchen",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function lineKey(line: {
  menuItemId: string;
  variantId?: string;
  choices?: Record<string, string>;
  notes?: string;
}) {
  const choices = Object.entries(line.choices || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(",");
  return `${line.menuItemId}|${line.variantId || ""}|${choices}|${line.notes || ""}`;
}

function priceLabel(item: MenuItem) {
  if (!item.variants?.length) return formatMoney(item.price);
  const prices = item.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min) : `${formatMoney(min)}–${formatMoney(max)}`;
}

function statusClass(status: string) {
  if (status === "rejected" || status === "cancelled") return "is-bad";
  if (status === "ready") return "is-ready";
  if (status === "served") return "is-done";
  return "is-live";
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function whoOrdered(
  session: TakeOrderSession | null | undefined,
  memberId: string,
) {
  return session?.members.find((m) => m.id === memberId)?.displayName || "Guest";
}

export function TakeOrderSheet({
  tableId,
  tableLabel,
  menu,
  actor,
  actorName,
  actorId,
  assignedWaiterId,
  assignedWaiterName,
  session,
  deskChannel,
  onClose,
  onSent,
}: {
  tableId: string;
  tableLabel: string;
  menu: MenuItem[];
  actor: string;
  actorName: string;
  actorId?: string;
  assignedWaiterId?: string | null;
  assignedWaiterName?: string | null;
  session?: TakeOrderSession | null;
  /** When set, this sheet logs a Swiggy, Zomato, or takeaway order instead of a table. */
  deskChannel?: "swiggy" | "zomato" | "takeaway";
  onClose: () => void;
  onSent: (tokenNumber: number) => void;
}) {
  const available = useMemo(() => menu.filter((m) => m.available), [menu]);
  const categories = useMemo(
    () => ["All", ...new Set(available.map((m) => m.category))],
    [available],
  );
  const host = session?.members.find((m) => m.isHost) || session?.members[0];
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [menuView, setMenuView] = useState<"card" | "present">("card");
  const [moreCatsOpen, setMoreCatsOpen] = useState(false);
  const [guestId, setGuestId] = useState(host?.id || "");
  const [guestName, setGuestName] = useState(host?.displayName || "");
  const [guestPhone, setGuestPhone] = useState(host?.phone || "");
  const [externalOrderId, setExternalOrderId] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [customGuest, setCustomGuest] = useState(false);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pane, setPane] = useState<"menu" | "ticket">("menu");
  const [showLive, setShowLive] = useState(true);

  useEffect(() => {
    if (customGuest || !session?.members?.length) return;
    const member =
      session.members.find((m) => m.id === guestId) ||
      session.members.find((m) => m.isHost) ||
      session.members[0];
    if (!member) return;
    setGuestId(member.id);
    setGuestName(member.displayName || "");
    setGuestPhone(member.phone || "");
  }, [session, guestId, customGuest]);

  useEffect(() => {
    const saved = localStorage.getItem("lunar-menu-view");
    if (saved === "card" || saved === "present") setMenuView(saved);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function chooseMenuView(next: "card" | "present") {
    setMenuView(next);
    localStorage.setItem("lunar-menu-view", next);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter(
      (m) =>
        (category === "All" || m.category === category) &&
        (!vegOnly || m.isVeg) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)),
    );
  }, [available, category, query, vegOnly]);

  const grouped = useMemo(() => {
    const order = categories.filter((c) => c !== "All");
    const map = new Map<string, MenuItem[]>();
    for (const cat of order) map.set(cat, []);
    for (const item of filtered) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].filter(([, list]) => list.length > 0);
  }, [filtered, categories]);

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const billClosed = Boolean(session?.billGeneratedAt || session?.status === "billing");
  const fromQr = Boolean(host);
  const batches = useMemo(() => {
    if (!session) return [];
    const known = new Set(session.batches.flatMap((b) => b.itemIds));
    const grouped = session.batches
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((batch) => ({
        id: batch.id,
        tokenNumber: batch.tokenNumber,
        createdAt: batch.createdAt,
        items: session.orders.filter((o) => batch.itemIds.includes(o.id)),
      }))
      .filter((b) => b.items.length);
    const leftover = session.orders.filter((o) => !known.has(o.id));
    if (leftover.length) {
      grouped.push({
        id: "other",
        tokenNumber: leftover[0].tokenNumber || 0,
        createdAt: leftover[0].createdAt,
        items: leftover,
      });
    }
    return grouped;
  }, [session]);

  function goTicketIfMobile() {
    if (window.matchMedia("(max-width: 800px)").matches) setPane("ticket");
  }

  function addLine(next: Omit<DraftLine, "key">) {
    const key = lineKey(next);
    setLines((current) => {
      const found = current.find((line) => line.key === key);
      if (found) {
        return current.map((line) =>
          line.key === key ? { ...line, qty: Math.min(99, line.qty + next.qty) } : line,
        );
      }
      return [...current, { ...next, key }];
    });
    setPicker(null);
    setShowLive(false);
    goTicketIfMobile();
  }

  function openItem(item: MenuItem) {
    if (!item.variants?.length && !item.choices?.length) {
      addLine({
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        qty: 1,
      });
      return;
    }
    const choices: Record<string, string> = {};
    item.choices?.forEach((choice) => {
      choices[choice.id] = choice.options[0];
    });
    setPicker({
      item,
      variantId: item.variants?.[0]?.id || "",
      choices,
      notes: "",
      qty: 1,
    });
  }

  function changeQty(key: string, delta: number) {
    setLines((current) =>
      current
        .map((line) => (line.key === key ? { ...line, qty: line.qty + delta } : line))
        .filter((line) => line.qty > 0),
    );
  }

  function setNotes(key: string, notes: string) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, notes } : line)),
    );
  }

  function pickGuest(id: string) {
    setCustomGuest(false);
    setGuestId(id);
    const member = session?.members.find((m) => m.id === id);
    if (member) {
      setGuestName(member.displayName || "");
      setGuestPhone(member.phone || "");
    }
  }

  function pickNewGuest() {
    setCustomGuest(true);
    setGuestId("");
    setGuestName("");
    setGuestPhone("");
  }

  async function send() {
    const name = guestName.trim();
    const phone = guestPhone.trim();
    const phoneRequired = !deskChannel || deskChannel === "takeaway";
    const orderNo = externalOrderId.trim();
    if (!name || (phoneRequired && !phone)) {
      setError(
        phoneRequired
          ? "Ask the guest for their name and phone number."
          : "Enter the guest name.",
      );
      setPane("ticket");
      return;
    }
    if ((deskChannel === "swiggy" || deskChannel === "zomato") && !orderNo) {
      setError("Enter the order number from the Swiggy or Zomato app.");
      setPane("ticket");
      return;
    }
    if (billClosed) {
      setError("This table’s bill is already generated.");
      return;
    }
    setSending(true);
    setError("");
    const linesPayload = lines.map((line) => ({
      menuItemId: line.menuItemId,
      variantId: line.variantId,
      choices: line.choices,
      notes: line.notes,
      qty: line.qty,
    }));
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        deskChannel
          ? {
              action: "create_online_order",
              channel: deskChannel,
              actor,
              actorName,
              guestName: name,
              guestPhone: phone,
              externalOrderId: orderNo,
              note: orderNote.trim(),
              lines: linesPayload,
            }
          : {
              action: "take_order",
              tableId,
              actor,
              actorName,
              guestName: name,
              guestPhone: phone,
              lines: linesPayload,
            },
      ),
    });
    const json = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(json.error || "Could not send the order");
      return;
    }
    onSent(json.tokenNumber);
  }

  const pickerPrice = picker
    ? (picker.item.variants?.find((v) => v.id === picker.variantId)?.price ?? picker.item.price)
    : 0;
  const isCover = Boolean(assignedWaiterId && actorId && assignedWaiterId !== actorId);

  return (
    <div className="take-order-sheet" role="presentation" onClick={onClose}>
      <div
        className="take-order-panel"
        data-pane={pane}
        role="dialog"
        aria-modal="true"
        aria-label={`Take order for ${tableLabel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="take-order-head take-order-top">
          <div>
            <span className="eyebrow">{deskChannel ? tableLabel : `Table ${tableLabel}`}</span>
            <h2 className="h-display h-md" style={{ margin: "0.15rem 0 0" }}>
              Take order
            </h2>
            {fromQr && (
              <p className="take-order-qr-note">
                Guest already scanned — details filled from the table.
              </p>
            )}
            {isCover && (
              <p className="take-order-cover-note">
                {assignedWaiterName || "Another waiter"} handles this table. This kitchen
                ticket will be under your name ({actorName}) so customisations can be traced.
              </p>
            )}
          </div>
          <button type="button" className="take-order-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="take-order-switch" role="tablist" aria-label="Take order sections">
          <button
            type="button"
            role="tab"
            aria-selected={pane === "menu"}
            className={pane === "menu" ? "is-on" : ""}
            onClick={() => setPane("menu")}
          >
            Menu
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pane === "ticket"}
            className={pane === "ticket" ? "is-on" : ""}
            onClick={() => setPane("ticket")}
          >
            Ticket{count ? ` · ${count}` : ""}
          </button>
        </div>

        <div className="take-order-body">
          <section className="take-order-menu">
            <div className="order-toolbar">
              <label className="search-box">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the menu…"
                  autoFocus
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
            <div className="take-order-list">
              {grouped.map(([cat, list]) => (
                <section key={cat} className="take-order-menu-group">
                  <h3 className="menu-cat">{cat}</h3>
                  <div className={clsx("order-menu-list", menuView === "card" && "is-cards")}>
                    {list.map((item) => {
                      const src = item.image || imageForMenuItem(item.name, item.category);
                      const price = priceLabel(item);
                      const hasOffer = Boolean(item.discountPercent || item.discountPrice);
                      if (menuView === "card") {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="order-menu-card"
                            onClick={() => openItem(item)}
                            aria-label={`Add ${item.name}`}
                          >
                            <span className="order-menu-card-photo">
                              <Image src={src} alt="" fill className="cover" sizes="200px" />
                              {(item.isNew || item.isHighlighted || hasOffer) && (
                                <span className="order-menu-card-tags">
                                  {item.isNew && <span className="neo-badge neo-badge-gold">New</span>}
                                  {item.isHighlighted && (
                                    <span className="neo-badge neo-badge-ink">Signature</span>
                                  )}
                                  {hasOffer && <span className="neo-badge neo-badge-rose">Offer</span>}
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
                                <span className="order-menu-price">{price}</span>
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
                          aria-label={`Add ${item.name}`}
                        >
                          <span className="order-menu-thumb">
                            <Image src={src} alt="" fill className="cover" sizes="84px" />
                          </span>
                          <span className="order-menu-meta">
                            <strong>
                              <span
                                className={clsx("veg-dot", !item.isVeg && "non")}
                                style={{ marginRight: 6 }}
                              />
                              {item.name}
                            </strong>
                            <span>
                              {item.isNew && <span className="neo-badge neo-badge-gold">New</span>}{" "}
                              {item.isHighlighted && (
                                <span className="neo-badge neo-badge-ink">Signature</span>
                              )}
                            </span>
                            {item.description && <small>{item.description}</small>}
                          </span>
                          <span style={{ textAlign: "right" }}>
                            <span className="order-menu-price">{price}</span>
                            <span className="add-circle">
                              <Plus size={16} />
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
              {grouped.length === 0 && <p className="muted">No dishes match that search.</p>}
            </div>
            {count > 0 && (
              <button type="button" className="take-order-jump" onClick={() => setPane("ticket")}>
                Review ticket · {count} item{count === 1 ? "" : "s"} · {formatMoney(total)}
              </button>
            )}
          </section>

          <aside className="take-order-ticket">
            <div className="take-order-ticket-scroll">
              <div className="take-order-ticket-head">
                <h3 className="h-display h-md" style={{ margin: 0 }}>
                  Ticket
                </h3>
                <span className="muted">
                  {count} new item{count === 1 ? "" : "s"}
                </span>
              </div>

              {session?.members?.length && !deskChannel ? (
                <div className="take-order-people">
                  {session.members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className={guestId === member.id ? "chip chip-on" : "chip"}
                      onClick={() => pickGuest(member.id)}
                    >
                      {member.displayName}
                      {member.isHost ? " · host" : ""}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={!guestId ? "chip chip-on" : "chip"}
                    onClick={pickNewGuest}
                  >
                    Someone else
                  </button>
                </div>
              ) : null}

              <div className="take-order-guest">
                {(deskChannel === "swiggy" || deskChannel === "zomato") && (
                  <NeoInput
                    label="Order number"
                    value={externalOrderId}
                    onChange={(e) => setExternalOrderId(e.target.value)}
                    placeholder="From the Swiggy or Zomato app"
                    required
                  />
                )}
                <NeoInput
                  label="Guest name"
                  value={guestName}
                  onChange={(e) => {
                    setCustomGuest(true);
                    setGuestId("");
                    setGuestName(e.target.value);
                  }}
                  placeholder="Who is ordering?"
                  autoComplete="name"
                  required
                />
                <NeoInput
                  label={deskChannel && deskChannel !== "takeaway" ? "Guest phone (optional)" : "Guest phone"}
                  value={guestPhone}
                  onChange={(e) => {
                    setCustomGuest(true);
                    setGuestId("");
                    setGuestPhone(e.target.value);
                  }}
                  placeholder={deskChannel && deskChannel !== "takeaway" ? "Leave blank if the app hides it" : "10-digit mobile"}
                  inputMode="tel"
                  autoComplete="tel"
                  required={!deskChannel || deskChannel === "takeaway"}
                />
                {deskChannel && (
                  <NeoInput
                    label="Note (optional)"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Rider, packing, or pickup"
                  />
                )}
              </div>

              <div className="take-order-lines">
                {lines.length === 0 && batches.length === 0 && (
                  <p className="muted" style={{ marginTop: 0 }}>
                    Tap a dish to add it. This order goes straight to the kitchen.
                  </p>
                )}
                {lines.map((line) => (
                  <div key={line.key} className="take-order-line">
                    <div>
                      <strong>
                        {line.name}
                        {line.variantLabel ? ` · ${line.variantLabel}` : ""}
                      </strong>
                      {line.choices && (
                        <div className="muted" style={{ fontSize: "0.75rem" }}>
                          {Object.values(line.choices).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div className="take-order-line-controls">
                      <div className="qty-stepper">
                        <button type="button" onClick={() => changeQty(line.key, -1)} aria-label="Less">
                          <Minus size={14} />
                        </button>
                        <b>{line.qty}</b>
                        <button type="button" onClick={() => changeQty(line.key, 1)} aria-label="More">
                          <Plus size={14} />
                        </button>
                      </div>
                      <b>{formatMoney(line.unitPrice * line.qty)}</b>
                    </div>
                    <input
                      className="take-order-note"
                      value={line.notes || ""}
                      placeholder="Note for the kitchen"
                      onChange={(e) => setNotes(line.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {session && (batches.length > 0 || session.cart.length > 0 || session.bill) && (
                <details
                  className="take-order-live"
                  open={showLive}
                  onToggle={(e) => setShowLive(e.currentTarget.open)}
                >
                  <summary className="take-order-live-head">
                    <strong>Already on this table</strong>
                    {session.bill && session.bill.totalQty > 0 && (
                      <span>{formatMoney(session.bill.grandTotal)} running</span>
                    )}
                  </summary>
                  {session.cart.length > 0 && (
                    <div className="take-order-batch">
                      <div className="take-order-batch-meta">On guest phone · not sent</div>
                      {session.cart.map((item) => (
                        <div key={item.id} className="take-order-prior">
                          <span>
                            {item.qty}× {item.name}
                            {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                          </span>
                          <b>{formatMoney(item.unitPrice * item.qty)}</b>
                        </div>
                      ))}
                    </div>
                  )}
                  {batches.map((batch) => (
                    <div key={batch.id} className="take-order-batch">
                      <div className="take-order-batch-meta">
                        {batch.tokenNumber ? `Token #${batch.tokenNumber}` : "Earlier order"}
                        {batch.createdAt ? ` · ${formatTime(batch.createdAt)}` : ""}
                      </div>
                      {batch.items.map((item) => (
                        <div key={item.id} className="take-order-prior">
                          <span>
                            {item.qty}× {item.name}
                            {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                            <small>
                              {whoOrdered(session, item.orderedByMemberId)}
                              {item.takenByStaffName
                                ? item.isCoverOrder && item.assignedWaiterName
                                  ? ` · taken by ${item.takenByStaffName} (covering ${item.assignedWaiterName})`
                                  : ` · taken by ${item.takenByStaffName}`
                                : ""}
                              {item.notes ? ` · ${item.notes}` : ""}
                            </small>
                          </span>
                          <span className={`take-order-status ${statusClass(item.status)}`}>
                            {STATUS_LABEL[item.status] || item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {session.bill && session.bill.totalQty > 0 && (
                    <div className="take-order-bill">
                      <div>
                        <span>Items</span>
                        <span>{session.bill.totalQty}</span>
                      </div>
                      <div>
                        <span>Subtotal</span>
                        <span>{formatMoney(session.bill.subtotal)}</span>
                      </div>
                      {session.bill.discountValue > 0 && (
                        <div>
                          <span>Discount</span>
                          <span>−{formatMoney(session.bill.discountValue)}</span>
                        </div>
                      )}
                      {session.bill.serviceCharge > 0 && (
                        <div>
                          <span>Service</span>
                          <span>{formatMoney(session.bill.serviceCharge)}</span>
                        </div>
                      )}
                      <div>
                        <span>GST</span>
                        <span>{formatMoney(session.bill.taxTotal)}</span>
                      </div>
                      <div className="is-total">
                        <span>Running bill</span>
                        <span>{formatMoney(session.bill.grandTotal)}</span>
                      </div>
                    </div>
                  )}
                </details>
              )}
            </div>
            {error && <p className="take-order-error">{error}</p>}
            {billClosed && (
              <p className="take-order-error">Bill already generated — new kitchen tickets are closed.</p>
            )}
            <NeoButton
              className="w-full"
              disabled={
                !lines.length ||
                sending ||
                billClosed ||
                !guestName.trim() ||
                ((!deskChannel || deskChannel === "takeaway") && !guestPhone.trim()) ||
                ((deskChannel === "swiggy" || deskChannel === "zomato") && !externalOrderId.trim())
              }
              onClick={send}
            >
              <ShoppingBag size={16} /> {sending ? "Sending…" : `Send to kitchen · ${formatMoney(total)}`}
            </NeoButton>
          </aside>
        </div>

        {picker && (
          <div className="take-order-picker" role="dialog" aria-label={picker.item.name}>
            <div className="take-order-picker-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h3 className="h-display h-md" style={{ margin: 0 }}>
                    {picker.item.name}
                  </h3>
                  <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                    {picker.item.description}
                  </p>
                </div>
                <button type="button" className="take-order-close" onClick={() => setPicker(null)} aria-label="Back">
                  <X size={18} />
                </button>
              </div>
              {!!picker.item.variants?.length && (
                <div className="take-order-options">
                  {picker.item.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      className={picker.variantId === variant.id ? "chip chip-on" : "chip"}
                      onClick={() => setPicker({ ...picker, variantId: variant.id })}
                    >
                      {variant.label} · {formatMoney(variant.price)}
                    </button>
                  ))}
                </div>
              )}
              {picker.item.choices?.map((choice) => (
                <label key={choice.id} className="neo-field">
                  <span>{choice.label}</span>
                  <span className="neo-select-wrap">
                    <select
                      className="neo-select"
                      value={picker.choices[choice.id]}
                      onChange={(e) =>
                        setPicker({
                          ...picker,
                          choices: { ...picker.choices, [choice.id]: e.target.value },
                        })
                      }
                    >
                      {choice.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              ))}
              <NeoInput
                label="Note"
                value={picker.notes}
                placeholder="Optional"
                onChange={(e) => setPicker({ ...picker, notes: e.target.value })}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div className="qty-stepper">
                  <button
                    type="button"
                    onClick={() => setPicker({ ...picker, qty: Math.max(1, picker.qty - 1) })}
                    aria-label="Less"
                  >
                    <Minus size={14} />
                  </button>
                  <b>{picker.qty}</b>
                  <button
                    type="button"
                    onClick={() => setPicker({ ...picker, qty: Math.min(99, picker.qty + 1) })}
                    aria-label="More"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <NeoButton
                  onClick={() => {
                    const variant = picker.item.variants?.find((v) => v.id === picker.variantId);
                    addLine({
                      menuItemId: picker.item.id,
                      name: picker.item.name,
                      variantId: variant?.id,
                      variantLabel: variant?.label,
                      choices: { ...picker.choices },
                      notes: picker.notes,
                      unitPrice: variant?.price ?? picker.item.price,
                      qty: picker.qty,
                    });
                  }}
                >
                  Add · {formatMoney(pickerPrice * picker.qty)}
                </NeoButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
