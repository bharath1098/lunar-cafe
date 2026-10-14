"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { NeoButton, NeoInput } from "@/components/Neo";
import { formatMoney } from "@/lib/cafe";
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

export function TakeOrderSheet({
  tableId,
  tableLabel,
  menu,
  actor,
  actorName,
  onClose,
  onSent,
}: {
  tableId: string;
  tableLabel: string;
  menu: MenuItem[];
  actor: string;
  actorName: string;
  onClose: () => void;
  onSent: (tokenNumber: number) => void;
}) {
  const available = useMemo(() => menu.filter((m) => m.available), [menu]);
  const categories = useMemo(
    () => ["All", ...new Set(available.map((m) => m.category))],
    [available],
  );
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter(
      (m) =>
        (category === "All" || m.category === category) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)),
    );
  }, [available, category, query]);

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

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

  async function send() {
    const name = guestName.trim();
    const phone = guestPhone.trim();
    if (!name || !phone) {
      setError("Ask the guest for their name and phone number.");
      return;
    }
    setSending(true);
    setError("");
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "take_order",
        tableId,
        actor,
        actorName,
        guestName: name,
        guestPhone: phone,
        lines: lines.map((line) => ({
          menuItemId: line.menuItemId,
          variantId: line.variantId,
          choices: line.choices,
          notes: line.notes,
          qty: line.qty,
        })),
      }),
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

  return (
    <div className="take-order-sheet" role="presentation" onClick={onClose}>
      <div
        className="take-order-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Take order for ${tableLabel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <section className="take-order-menu">
          <header className="take-order-head">
            <div>
              <span className="eyebrow">Table {tableLabel}</span>
              <h2 className="h-display h-md" style={{ margin: "0.15rem 0 0" }}>
                Take order
              </h2>
            </div>
            <button type="button" className="take-order-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </header>
          <label className="take-order-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              autoFocus
            />
          </label>
          <div className="chip-row take-order-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={category === cat ? "chip chip-on" : "chip"}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="take-order-list">
            {filtered.map((item) => (
              <button key={item.id} type="button" className="take-order-row" onClick={() => openItem(item)}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.category}</small>
                </span>
                <b>{priceLabel(item)}</b>
                <span className="take-order-add" aria-hidden>
                  <Plus size={16} />
                </span>
              </button>
            ))}
            {filtered.length === 0 && <p className="muted">No dishes match that search.</p>}
          </div>
        </section>

        <aside className="take-order-ticket">
          <div className="take-order-ticket-head">
            <h3 className="h-display h-md" style={{ margin: 0 }}>
              Ticket
            </h3>
            <span className="muted">
              {count} item{count === 1 ? "" : "s"}
            </span>
          </div>
          <div className="take-order-guest">
            <NeoInput
              label="Guest name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Who is ordering?"
              autoComplete="name"
              required
            />
            <NeoInput
              label="Guest phone"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="10-digit mobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </div>
          <div className="take-order-lines">
            {lines.length === 0 && (
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
          {error && <p className="take-order-error">{error}</p>}
          <NeoButton
            className="w-full"
            disabled={!lines.length || sending || !guestName.trim() || !guestPhone.trim()}
            onClick={send}
          >
            <ShoppingBag size={16} /> {sending ? "Sending…" : `Send to kitchen · ${formatMoney(total)}`}
          </NeoButton>
        </aside>

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
