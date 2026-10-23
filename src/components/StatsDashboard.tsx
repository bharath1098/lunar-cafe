"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Clock,
  Crown,
  Flame,
  IndianRupee,
  Lightbulb,
  Receipt,
  ShoppingBag,
  Smartphone,
  Store,
  Timer,
  Wallet,
} from "lucide-react";
import type { AnalyticsResult, PeriodTotals, StatsRange } from "@/lib/analytics";
import { NeoButton } from "@/components/Neo";
import { ScrollHint } from "@/components/ScrollHint";

const RANGES: { id: StatsRange; label: string; prev: string }[] = [
  { id: "today", label: "Today", prev: "yesterday" },
  { id: "7d", label: "7 days", prev: "previous 7 days" },
  { id: "30d", label: "30 days", prev: "previous 30 days" },
  { id: "all", label: "All time", prev: "" },
  { id: "custom", label: "Custom", prev: "previous period" },
];

function toDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromDayKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const PRIMARY = "var(--sage-500)";
const AMBER = "#e5b45a";
const SKY = "#6fb5e8";
const AXIS = { fill: "var(--ink-soft)", fontSize: 11 };

const PAYMENT_META: Record<string, { label: string; color: string }> = {
  upi: { label: "UPI", color: PRIMARY },
  cash: { label: "Cash", color: AMBER },
  card: { label: "Card", color: SKY },
};

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  dine_in: { label: "Dine-in", color: PRIMARY },
  takeaway: { label: "Takeaway", color: AMBER },
  swiggy: { label: "Swiggy", color: "#fc8019" },
  zomato: { label: "Zomato", color: "#e23744" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_MON_FIRST = [1, 2, 3, 4, 5, 6, 0];
/** Cafe opening window used for hour charts / heatmap. */
const CAFE_HOURS = Array.from({ length: 13 }, (_, i) => 11 + i);

type Metric = "revenue" | "bills" | "avg";

function useNarrow(max = 720) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${max}px)`);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [max]);
  return narrow;
}

/* ---------- formatting helpers ---------- */

/** Rupees with Indian digit grouping; paise shown only when present. */
function inr(n: number) {
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function compact(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `₹${Math.round(n)}`;
}

function parseDay(date: string) {
  return new Date(`${date}T00:00:00`);
}

function dayShort(date: string) {
  return parseDay(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function dayLong(date: string) {
  return parseDay(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function hourShort(h: number) {
  return `${h % 12 || 12}${h >= 12 ? "p" : "a"}`;
}

function hourLong(h: number) {
  return `${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}`;
}

function pctChange(current: number, previous: number | undefined | null) {
  if (previous == null) return null;
  if (previous === 0) return current > 0 ? "new" : null;
  return ((current - previous) / previous) * 100;
}

function mins(n: number | null) {
  if (n == null) return "—";
  if (n < 60) return `${n} min`;
  return `${Math.floor(n / 60)}h ${n % 60}m`;
}

/* ---------- small building blocks ---------- */

type SeriesPoint = {
  label: string;
  full: string;
  revenue: number;
  bills: number;
  avg: number;
};
type HourPoint = AnalyticsResult["hourly"][number];
type PaymentPoint = AnalyticsResult["payments"][number];

function ChartTooltip<T>({
  active,
  payload,
  render,
}: {
  active?: boolean;
  payload?: { payload: T }[];
  render: (p: T) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return <div className="an-tip">{render(payload[0].payload)}</div>;
}

function Delta({ value, hint }: { value: number | "new" | null; hint: string }) {
  if (value == null) return <span className="an-delta is-flat">—</span>;
  if (value === "new") return <span className="an-delta is-up" title={hint}>New</span>;
  const up = value >= 0;
  return (
    <span className={clsx("an-delta", up ? "is-up" : "is-down")} title={hint}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(value).toFixed(Math.abs(value) >= 10 ? 0 : 1)}%
    </span>
  );
}

function Kpi({
  label,
  value,
  icon,
  delta,
  hint,
  spark,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta: number | "new" | null;
  hint: string;
  spark?: { v: number }[];
  sub?: string;
}) {
  const id = useMemo(() => `spark-${label.replace(/\W/g, "")}`, [label]);
  return (
    <div className="an-kpi">
      <div className="an-kpi-top">
        <span className="an-kpi-icon">{icon}</span>
        <span className="an-kpi-label">{label}</span>
        <Delta value={delta} hint={hint} />
      </div>
      <div className="an-kpi-value">{value}</div>
      {sub && <div className="an-kpi-sub">{sub}</div>}
      {spark && spark.length > 1 && (
        <div className="an-spark" aria-hidden>
          <ResponsiveContainer width="100%" height={42}>
            <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={PRIMARY}
                strokeWidth={2}
                fill={`url(#${id})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("an-card", className)}>
      <header className="an-card-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  small,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  small?: boolean;
}) {
  return (
    <div className={clsx("an-seg", small && "is-small")} role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={clsx(value === o.id && "is-on")}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RankList({
  rows,
  format,
  empty,
}: {
  rows: { key: string; name: string; meta?: string; value: number; share?: number; right?: string }[];
  format: (n: number) => string;
  empty: string;
}) {
  if (!rows.length) return <p className="an-empty-note">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="an-rank">
      {rows.map((r, i) => (
        <li key={r.key}>
          <span className={clsx("an-rank-n", i === 0 && "is-top")}>{i + 1}</span>
          <div className="an-rank-body">
            <div className="an-rank-row">
              <strong title={r.name}>{r.name}</strong>
              <b>{format(r.value)}</b>
            </div>
            <div className="an-rank-bar">
              <i style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <div className="an-rank-meta">
              <span>{r.meta}</span>
              <span>{r.right ?? (r.share != null ? `${r.share.toFixed(0)}%` : "")}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Heatmap({ data }: { data: AnalyticsResult }) {
  const hours = CAFE_HOURS;
  const max = Math.max(
    1,
    ...WEEKDAYS_MON_FIRST.flatMap((d) => hours.map((h) => data.heat[d][h])),
  );
  return (
    <div className="an-heat">
      <ScrollHint className="an-heat-scroll">
        <div
          className="an-heat-grid"
          style={{ gridTemplateColumns: `28px repeat(${hours.length}, minmax(18px, 1fr))` }}
        >
          <span />
          {hours.map((h) => (
            <span key={h} className="an-heat-col">
              {h % 2 === 0 ? hourShort(h) : ""}
            </span>
          ))}
          {WEEKDAYS_MON_FIRST.map((d) => (
            <div key={d} style={{ display: "contents" }}>
              <span className="an-heat-row">{WEEKDAYS[d]}</span>
              {hours.map((h) => {
                const v = data.heat[d][h];
                const pct = v / max;
                return (
                  <span
                    key={h}
                    className={clsx("an-heat-cell", v > 0 && "has")}
                    style={
                      v > 0
                        ? {
                            background: `color-mix(in srgb, var(--sage-500) ${Math.round(14 + pct * 82)}%, transparent)`,
                          }
                        : undefined
                    }
                    title={`${WEEKDAYS[d]} ${hourLong(h)} · ${v > 0 ? inr(v) : "no sales"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </ScrollHint>
      <div className="an-heat-legend">
        <span>Quiet</span>
        <i />
        <span>Busy</span>
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function StatsDashboard() {
  const [range, setRange] = useState<StatsRange>("7d");
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();
  const pickerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [metric, setMetric] = useState<Metric>("revenue");
  const [itemSort, setItemSort] = useState<"revenue" | "qty">("revenue");
  const [loading, setLoading] = useState(true);
  const narrow = useNarrow(720);
  const chartH = narrow ? 200 : 280;
  const barH = narrow ? 180 : 240;
  const donutH = narrow ? 160 : 190;
  const donutInner = narrow ? 46 : 58;
  const donutOuter = narrow ? 68 : 84;

  const customReady = Boolean(customFrom && customTo);
  const queryKey =
    range === "custom" && customReady
      ? `custom:${customFrom}:${customTo}`
      : range === "custom"
        ? "7d"
        : range;

  useEffect(() => {
    let alive = true;
    async function load(quiet = false) {
      try {
        const params = new URLSearchParams();
        if (range === "custom" && customFrom && customTo) {
          params.set("range", "custom");
          params.set("from", customFrom);
          params.set("to", customTo);
        } else {
          params.set("range", range === "custom" ? "7d" : range);
        }
        const res = await fetch(`/api/staff/stats?${params}`, {
          cache: "no-store",
          headers: quiet ? { "X-Lunar-Quiet": "1" } : undefined,
        });
        if (!res.ok) return;
        const json = (await res.json()) as AnalyticsResult;
        if (alive) setData(json);
      } finally {
        if (alive) setLoading(false);
      }
    }
    setLoading(true);
    load();
    const t = setInterval(() => {
      void load(true);
    }, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [queryKey, range, customFrom, customTo]);

  useEffect(() => {
    if (!pickerOpen) return;
    function dismiss() {
      setPickerOpen(false);
      if (!customReady) setRange("7d");
    }
    function onDoc(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        dismiss();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen, customReady]);

  function closePicker() {
    setPickerOpen(false);
    if (!customReady) setRange("7d");
  }

  function openCustomPicker() {
    setDraftRange(
      customFrom && customTo
        ? { from: fromDayKey(customFrom), to: fromDayKey(customTo) }
        : data
          ? { from: fromDayKey(data.from), to: fromDayKey(data.to) }
          : { from: startOfLocalDay(new Date()), to: startOfLocalDay(new Date()) },
    );
    setPickerOpen(true);
  }

  function selectPreset(next: StatsRange) {
    if (next === "custom") {
      setRange("custom");
      openCustomPicker();
      return;
    }
    setPickerOpen(false);
    setRange(next);
  }

  function applyCustomRange() {
    if (!draftRange?.from || !draftRange?.to) return;
    let from = startOfLocalDay(draftRange.from);
    let to = startOfLocalDay(draftRange.to);
    if (from > to) {
      const swap = from;
      from = to;
      to = swap;
    }
    const today = startOfLocalDay(new Date());
    if (to > today) to = today;
    setCustomFrom(toDayKey(from));
    setCustomTo(toDayKey(to));
    setRange("custom");
    setPickerOpen(false);
  }

  const rangeMeta = RANGES.find((r) => r.id === (range === "custom" && customReady ? "custom" : range === "custom" ? "7d" : range)) ?? RANGES[1];
  const activeSeg: StatsRange =
    range === "custom" || pickerOpen ? "custom" : range;

  const series = useMemo(() => {
    if (!data) return [];
    const withAvg = (revenue: number, bills: number) => (bills ? Math.round(revenue / bills) : 0);
    if (data.days > 1) {
      return data.daily.map((d) => ({
        label: dayShort(d.date),
        full: dayLong(d.date),
        revenue: d.revenue,
        bills: d.bills,
        avg: withAvg(d.revenue, d.bills),
      }));
    }
    const byHour = new Map(data.hourly.map((h) => [h.hour, h]));
    return CAFE_HOURS.map((hour) => {
      const h = byHour.get(hour);
      const revenue = h?.revenue ?? 0;
      const bills = h?.bills ?? 0;
      return {
        label: hourShort(hour),
        full: hourLong(hour),
        revenue,
        bills,
        avg: withAvg(revenue, bills),
      };
    });
  }, [data]);

  const hourlyBars = useMemo(() => {
    if (!data) return [];
    const byHour = new Map(data.hourly.map((h) => [h.hour, h]));
    return CAFE_HOURS.map((hour) => {
      const h = byHour.get(hour);
      return { hour, revenue: h?.revenue ?? 0, bills: h?.bills ?? 0 };
    });
  }, [data]);

  const insights = useMemo(() => {
    if (!data || data.totals.bills === 0) return [];
    const list: { icon: React.ReactNode; title: string; text: string }[] = [];
    const total = data.totals.revenue || 1;

    if (data.days > 1) {
      const best = [...data.daily].sort((a, b) => b.revenue - a.revenue)[0];
      if (best && best.revenue > 0) {
        list.push({
          icon: <CalendarDays size={16} />,
          title: "Best day",
          text: `${dayShort(best.date)} · ${inr(best.revenue)} · ${Math.round((best.revenue / total) * 100)}%`,
        });
      }
    }

    const peak = [...data.hourly].sort((a, b) => b.revenue - a.revenue)[0];
    if (peak && peak.revenue > 0) {
      list.push({
        icon: <Flame size={16} />,
        title: "Peak hour",
        text: `${hourLong(peak.hour)} · ${peak.bills} ${peak.bills === 1 ? "bill" : "bills"} · ${inr(peak.revenue)}`,
      });
    }

    const weekdaysWithSales = data.weekdays.filter((w) => w.bills > 0);
    if (weekdaysWithSales.length > 1) {
      const top = [...weekdaysWithSales].sort((a, b) => b.revenue - a.revenue)[0];
      list.push({
        icon: <Clock size={16} />,
        title: "Top weekday",
        text: `${WEEKDAYS[top.day]} · ${inr(top.revenue)} · ${top.bills} bills`,
      });
    }

    const topItem = [...data.items].sort((a, b) => b.qty - a.qty)[0];
    if (topItem) {
      list.push({
        icon: <Crown size={16} />,
        title: "Top seller",
        text: `${topItem.name} · ${topItem.qty} sold · ${inr(topItem.revenue)}`,
      });
    }

    const topPay = data.payments[0];
    if (topPay && data.payments.length > 1) {
      const meta = PAYMENT_META[topPay.method];
      list.push({
        icon: <Wallet size={16} />,
        title: "Payments",
        text: `${meta?.label ?? topPay.method} · ${Math.round((topPay.revenue / total) * 100)}%`,
      });
    }

    const topChannel = [...data.channels].sort((a, b) => b.revenue - a.revenue)[0];
    if (topChannel && data.channels.length > 1) {
      list.push({
        icon: topChannel.channel === "dine_in" ? <Store size={16} /> : <Smartphone size={16} />,
        title: "Top source",
        text: `${topChannel.label} · ${Math.round((topChannel.revenue / total) * 100)}% · ${topChannel.bills} orders`,
      });
    }

    return list.slice(0, 4);
  }, [data]);

  const topItems = useMemo(() => {
    if (!data) return [];
    const totalItems = data.items.reduce((s, i) => s + i.revenue, 0) || 1;
    return [...data.items]
      .sort((a, b) => (itemSort === "qty" ? b.qty - a.qty || b.revenue - a.revenue : b.revenue - a.revenue))
      .slice(0, narrow ? 5 : 8)
      .map((i) => ({
        key: i.id,
        name: i.name,
        meta: `${i.category} · ${i.qty} sold`,
        value: itemSort === "qty" ? i.qty : i.revenue,
        right: itemSort === "qty" ? inr(i.revenue) : `${Math.round((i.revenue / totalItems) * 100)}%`,
      }));
  }, [data, itemSort, narrow]);

  /* ----- states without data ----- */

  if (!data) {
    return (
      <div className="an-wrap">
        <div className="an-skeleton-row">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="an-skeleton" />
          ))}
        </div>
        <div className="an-skeleton an-skeleton-tall" />
      </div>
    );
  }

  if (data.allTimeBills === 0) {
    return (
      <div className="an-card an-empty">
        <BarChart3 size={40} color="var(--sage-500)" />
        <h2 className="h-display h-md">No sales yet</h2>
        <p className="muted">
          Analytics fill in as dine-in, takeaway, Swiggy, and Zomato orders are paid or handed over.
        </p>
      </div>
    );
  }

  const { totals, previous } = data;
  const hint = rangeMeta.prev ? `vs ${rangeMeta.prev}` : "";
  const delta = (cur: number, prev?: number | null) => (previous ? pctChange(cur, prev) : null);
  const sparkFor = (pick: (d: AnalyticsResult["daily"][number]) => number) =>
    data.days > 1 ? data.daily.map((d) => ({ v: pick(d) })) : undefined;

  const metricCfg = {
    revenue: { label: "Revenue", fmt: (n: number) => inr(n), axis: compact },
    bills: { label: "Bills", fmt: (n: number) => `${n}`, axis: (n: number) => `${n}` },
    avg: { label: "Avg bill", fmt: (n: number) => inr(n), axis: compact },
  }[metric];

  const refValue =
    metric === "revenue"
      ? totals.revenue / Math.max(1, series.length)
      : metric === "bills"
        ? totals.bills / Math.max(1, series.length)
        : totals.avgBill;

  const peakHour = [...hourlyBars].sort((a, b) => b.revenue - a.revenue)[0];
  const paymentTotal = data.payments.reduce((s, p) => s + p.revenue, 0) || 1;
  const categoryTotal = data.categories.reduce((s, c) => s + c.revenue, 0) || 1;
  const sectionTotal = data.sections.reduce((s, c) => s + c.revenue, 0) || 1;
  const channelTotal = data.channels.reduce((s, c) => s + c.revenue, 0) || 1;

  return (
    <div className={clsx("an-wrap", loading && "is-loading")}>
      {/* Toolbar */}
      <div className="an-toolbar">
        <div>
          <span className="an-period">
            {data.days === 1 ? dayLong(data.to) : `${dayShort(data.from)} – ${dayShort(data.to)}`}
          </span>
          <span className="an-live">
            <i /> <span className="an-live-full">Live · refreshes automatically</span>
            <span className="an-live-short">Live</span>
          </span>
        </div>
        <div className="an-range-tools" ref={pickerRef}>
          <div className="an-range-row">
            <Segmented
              value={(activeSeg === "custom" ? "" : activeSeg) as StatsRange}
              options={RANGES.filter((r) => r.id !== "custom").map((r) => ({
                id: r.id,
                label: r.label,
              }))}
              onChange={selectPreset}
            />
            <button
              type="button"
              className={clsx(
                "an-range-chip",
                (activeSeg === "custom" || pickerOpen) && "is-on",
              )}
              onClick={() => selectPreset("custom")}
              aria-label="Custom date range"
              title="Custom date range"
            >
              <CalendarDays size={15} />
              <span className="an-range-chip-label">
                {range === "custom" && customReady
                  ? `${dayShort(customFrom!)} – ${dayShort(customTo!)}`
                  : "Custom"}
              </span>
            </button>
          </div>
          {pickerOpen && (
            <div className="an-range-popover" role="dialog" aria-label="Choose date range">
              <DayPicker
                mode="range"
                selected={draftRange}
                onSelect={setDraftRange}
                numberOfMonths={1}
                disabled={{ after: startOfLocalDay(new Date()) }}
                defaultMonth={draftRange?.from || startOfLocalDay(new Date())}
                weekStartsOn={1}
                className="lunar-daypicker"
              />
              <div className="an-range-popover-foot">
                <span className="muted">
                  {draftRange?.from && draftRange?.to
                    ? `${dayLong(toDayKey(draftRange.from))} – ${dayLong(toDayKey(draftRange.to))}`
                    : draftRange?.from
                      ? `${dayLong(toDayKey(draftRange.from))} – pick end date`
                      : "Pick a start and end date"}
                </span>
                <div className="an-range-popover-actions">
                  <button type="button" onClick={closePicker}>
                    Cancel
                  </button>
                  <NeoButton
                    className="btn-sm"
                    disabled={!draftRange?.from || !draftRange?.to}
                    onClick={applyCustomRange}
                  >
                    Apply
                  </NeoButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {totals.bills === 0 ? (
        <div className="an-card an-empty">
          <Receipt size={36} color="var(--sage-500)" />
          <h2 className="h-display h-md">No paid bills in this period</h2>
          <p className="muted">
            {data.allTimeBills} {data.allTimeBills === 1 ? "bill was" : "bills were"} paid earlier. Try a wider range.
          </p>
          <NeoButton variant="ghost" onClick={() => setRange("all")}>
            Show all time
          </NeoButton>
        </div>
      ) : (
        <>
          {/* Insights */}
          {insights.length > 0 && (
            <div className="an-insights">
              {insights.map((i) => (
                <div key={i.title} className="an-insight">
                  <span className="an-insight-icon">{i.icon}</span>
                  <div>
                    <b>{i.title}</b>
                    <p>{i.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* KPIs */}
          <div className="an-kpis">
            <Kpi
              label="Revenue"
              value={inr(totals.revenue)}
              icon={<IndianRupee size={16} />}
              delta={delta(totals.revenue, previous?.revenue)}
              hint={hint}
              spark={sparkFor((d) => d.revenue)}
              sub={
                previous && previous.bills > 0
                  ? `${inr(previous.revenue)} ${rangeMeta.prev}`
                  : narrow
                    ? undefined
                    : "Collected incl. GST"
              }
            />
            <Kpi
              label="Paid bills"
              value={String(totals.bills)}
              icon={<Receipt size={16} />}
              delta={delta(totals.bills, previous?.bills)}
              hint={hint}
              spark={sparkFor((d) => d.bills)}
              sub={
                previous && previous.bills > 0
                  ? `${previous.bills} ${rangeMeta.prev}`
                  : `${totals.avgItemsPerBill} items / bill`
              }
            />
            <Kpi
              label="Avg bill value"
              value={inr(totals.avgBill)}
              icon={<ShoppingBag size={16} />}
              delta={delta(totals.avgBill, previous?.avgBill)}
              hint={hint}
              spark={sparkFor((d) => (d.bills ? d.revenue / d.bills : 0))}
              sub={`${totals.avgItemsPerBill} items per bill`}
            />
            <Kpi
              label="Avg dining time"
              value={mins(totals.avgDiningMins)}
              icon={<Timer size={16} />}
              delta={
                totals.avgDiningMins != null && previous?.avgDiningMins != null
                  ? pctChange(totals.avgDiningMins, previous.avgDiningMins)
                  : null
              }
              hint={hint}
              sub={peakHour && peakHour.revenue > 0 ? `Peak hour ${hourLong(peakHour.hour)}` : undefined}
            />
          </div>

          {/* Trend + payments */}
          <div className="an-grid an-grid-trend">
            <Card
              title={data.days > 1 ? "Sales trend" : "Sales through the day"}
              subtitle={data.days > 1 ? "Daily performance with the period average" : "Hour by hour for today"}
              action={
                <Segmented
                  small
                  value={metric}
                  options={[
                    { id: "revenue", label: "Revenue" },
                    { id: "bills", label: "Bills" },
                    { id: "avg", label: "Avg bill" },
                  ]}
                  onChange={setMetric}
                />
              }
            >
              <ResponsiveContainer width="100%" height={chartH}>
                <AreaChart data={series} margin={{ top: 10, right: narrow ? 4 : 12, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="an-trend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={AXIS}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={18}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={AXIS}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={metricCfg.axis}
                    width={52}
                    allowDecimals={false}
                  />
                  {series.length > 2 && (
                    <ReferenceLine
                      y={refValue}
                      stroke={AMBER}
                      strokeDasharray="4 4"
                      label={{
                        value: `avg ${metricCfg.axis(refValue)}`,
                        position: "insideTopRight",
                        fill: AMBER,
                        fontSize: 11,
                      }}
                    />
                  )}
                  <Tooltip
                    cursor={{ stroke: "var(--line)", strokeWidth: 1 }}
                    content={
                      <ChartTooltip
                        render={(p: SeriesPoint) => (
                          <>
                            <b>{p.full}</b>
                            <div>
                              <span>{metricCfg.label}</span>
                              <strong>{metricCfg.fmt(p[metric])}</strong>
                            </div>
                            {metric !== "bills" && (
                              <div>
                                <span>Bills</span>
                                <strong>{p.bills}</strong>
                              </div>
                            )}
                            {metric !== "revenue" && (
                              <div>
                                <span>Revenue</span>
                                <strong>{inr(p.revenue)}</strong>
                              </div>
                            )}
                          </>
                        )}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    stroke={PRIMARY}
                    strokeWidth={2.5}
                    fill="url(#an-trend)"
                    dot={series.length <= 14 ? { r: 3, fill: PRIMARY, strokeWidth: 0 } : false}
                    activeDot={{ r: 5 }}
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Payment mix" subtitle="Cash, UPI, and card from dine-in and takeaway">
              {data.payments.length > 0 ? (
                <div className="an-pay">
                  <div className="an-donut">
                    <ResponsiveContainer width="100%" height={donutH}>
                      <PieChart>
                        <Pie
                          data={data.payments}
                          dataKey="revenue"
                          nameKey="method"
                          innerRadius={donutInner}
                          outerRadius={donutOuter}
                          paddingAngle={3}
                          cornerRadius={5}
                          stroke="none"
                          animationDuration={500}
                        >
                          {data.payments.map((p) => (
                            <Cell key={p.method} fill={PAYMENT_META[p.method]?.color ?? PRIMARY} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <ChartTooltip
                              render={(p: PaymentPoint) => (
                                <>
                                  <b>{PAYMENT_META[p.method]?.label ?? p.method}</b>
                                  <div>
                                    <span>Revenue</span>
                                    <strong>{inr(p.revenue)}</strong>
                                  </div>
                                  <div>
                                    <span>Bills</span>
                                    <strong>{p.bills}</strong>
                                  </div>
                                </>
                              )}
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="an-donut-center">
                      <b>{data.payments.reduce((n, p) => n + p.bills, 0)}</b>
                      <span>bills</span>
                    </div>
                  </div>
                  <ul className="an-legend">
                    {data.payments.map((p) => (
                      <li key={p.method}>
                        <i style={{ background: PAYMENT_META[p.method]?.color ?? PRIMARY }} />
                        <span>{PAYMENT_META[p.method]?.label ?? p.method}</span>
                        <b>{inr(p.revenue)}</b>
                        <em>{Math.round((p.revenue / paymentTotal) * 100)}%</em>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No counter payments in this period. Swiggy and Zomato stay on their platforms.
                </p>
              )}
            </Card>
          </div>

          {/* Hourly + heatmap */}
          <div className="an-grid an-grid-2">
            <Card title="Sales by hour" subtitle="When guests pay — peak hour highlighted">
              <ResponsiveContainer width="100%" height={barH}>
                <BarChart data={hourlyBars} margin={{ top: 10, right: narrow ? 4 : 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={AXIS}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={hourShort}
                    interval={1}
                  />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={44} />
                  <Tooltip
                    cursor={{ fill: "var(--sage-100)", opacity: 0.5 }}
                    content={
                      <ChartTooltip
                        render={(p: HourPoint) => (
                          <>
                            <b>{hourLong(p.hour)}</b>
                            <div>
                              <span>Revenue</span>
                              <strong>{inr(p.revenue)}</strong>
                            </div>
                            <div>
                              <span>Bills</span>
                              <strong>{p.bills}</strong>
                            </div>
                          </>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 2, 2]} animationDuration={500}>
                    {hourlyBars.map((h) => (
                      <Cell
                        key={h.hour}
                        fill={peakHour && h.hour === peakHour.hour && h.revenue > 0 ? AMBER : PRIMARY}
                        fillOpacity={h.revenue > 0 ? 1 : 0.22}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Busiest times" subtitle="Weekday × hour — darker means more revenue">
              <Heatmap data={data} />
            </Card>
          </div>

          {/* Items + categories */}
          <div className="an-grid an-grid-2">
            <Card
              title="Most demanded items"
              subtitle="Best performers in this period"
              action={
                <Segmented
                  small
                  value={itemSort}
                  options={[
                    { id: "revenue", label: "By sales" },
                    { id: "qty", label: "By qty" },
                  ]}
                  onChange={setItemSort}
                />
              }
            >
              <RankList
                rows={topItems}
                format={(n) => (itemSort === "qty" ? `${n} sold` : inr(n))}
                empty="No items sold in this period."
              />
            </Card>

            <Card title="Category mix" subtitle="Item sales by menu category">
              <RankList
                rows={data.categories.slice(0, narrow ? 5 : 8).map((c) => ({
                  key: c.category,
                  name: c.category,
                  meta: `${c.qty} items`,
                  value: c.revenue,
                  share: (c.revenue / categoryTotal) * 100,
                }))}
                format={(n) => inr(n)}
                empty="No category data yet."
              />
            </Card>
          </div>

          {/* Order source */}
          <div className="an-grid an-grid-2">
            <Card title="Order source" subtitle="Dine-in, takeaway, Swiggy, and Zomato">
              {data.channels.length > 0 ? (
                <>
                  <div className="an-split">
                    <div className="an-split-bar">
                      {data.channels.map((c) => (
                        <i
                          key={c.channel}
                          style={{
                            width: `${(c.revenue / channelTotal) * 100}%`,
                            background: CHANNEL_META[c.channel]?.color ?? PRIMARY,
                          }}
                        />
                      ))}
                    </div>
                    <div className="an-split-legend">
                      {data.channels.map((c) => (
                        <span key={c.channel}>
                          <i style={{ background: CHANNEL_META[c.channel]?.color ?? PRIMARY }} />
                          <span>{c.label}</span>
                          <b>{Math.round((c.revenue / channelTotal) * 100)}%</b>
                          <em>
                            {c.bills} {c.bills === 1 ? "order" : "orders"}
                          </em>
                        </span>
                      ))}
                    </div>
                  </div>
                  <RankList
                    rows={data.channels.map((c) => ({
                      key: c.channel,
                      name: c.label,
                      meta: `${c.items} items · ${c.bills} ${c.bills === 1 ? "order" : "orders"}`,
                      value: c.revenue,
                      right: inr(c.revenue / Math.max(1, c.bills)) + " / order",
                    }))}
                    format={(n) => inr(n)}
                    empty="No source data yet."
                  />
                </>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No paid or handed-over orders in this period.
                </p>
              )}
            </Card>

            <Card title="Revenue breakdown" subtitle="From item sales to cash collected">
              <BreakdownTable totals={totals} previous={previous} />
            </Card>
          </div>

          {/* Tables */}
          <Card title="Where guests sit" subtitle="Dine-in only · indoor vs outdoor and top tables">
            {data.sections.length > 0 && (
              <div className="an-split">
                <div className="an-split-bar">
                  {data.sections.map((s) => (
                    <i
                      key={s.section}
                      className={s.section === "indoor" ? "is-indoor" : "is-outdoor"}
                      style={{ width: `${(s.revenue / sectionTotal) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="an-split-legend">
                  {data.sections.map((s) => (
                    <span key={s.section}>
                      <i className={s.section === "indoor" ? "is-indoor" : "is-outdoor"} />
                      <span style={{ textTransform: "capitalize" }}>{s.section}</span>
                      <b>{Math.round((s.revenue / sectionTotal) * 100)}%</b>
                      <em>{s.bills} bills</em>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <RankList
              rows={data.tables.slice(0, 5).map((t) => ({
                key: t.tableId,
                name: t.label,
                meta: `${cap(t.section)} · ${t.bills} ${t.bills === 1 ? "bill" : "bills"}`,
                value: t.revenue,
                right: inr(t.revenue / Math.max(1, t.bills)) + " / bill",
              }))}
              format={(n) => inr(n)}
              empty="No dine-in table data yet."
            />
          </Card>
        </>
      )}
    </div>
  );
}

function BreakdownTable({
  totals,
  previous,
}: {
  totals: PeriodTotals;
  previous: PeriodTotals | null;
}) {
  const rows: { label: string; value: number; sign: "" | "+" | "−"; strong?: boolean }[] = [
    { label: "Item sales", value: totals.subtotal, sign: "" },
    { label: "Discounts & loyalty", value: totals.discounts, sign: "−" },
    { label: "Service charge", value: totals.serviceCharge, sign: "+" },
    { label: "GST (CGST + SGST)", value: totals.tax, sign: "+" },
    { label: "Round off", value: Math.abs(totals.roundOff), sign: totals.roundOff < 0 ? "−" : "+" },
  ];
  const discountRate = totals.subtotal ? (totals.discounts / totals.subtotal) * 100 : 0;
  return (
    <div className="an-breakdown">
      {rows.map((r) => (
        <div key={r.label} className="an-break-row">
          <span>{r.label}</span>
          <b className={clsx(r.sign === "−" && "is-neg")}>
            {r.sign && r.value !== 0 ? `${r.sign} ` : ""}
            {inr(r.value)}
          </b>
        </div>
      ))}
      <div className="an-break-row is-total">
        <span>Collected</span>
        <b>{inr(totals.revenue)}</b>
      </div>
      <div className="an-break-notes">
        <div>
          <span>Discount rate</span>
          <b>{discountRate.toFixed(1)}%</b>
        </div>
        <div>
          <span>Items per bill</span>
          <b>{totals.avgItemsPerBill}</b>
        </div>
        <div>
          <span>Avg bill</span>
          <b>{inr(totals.avgBill)}</b>
        </div>
        {previous && previous.bills > 0 && (
          <div>
            <span>Prev. period</span>
            <b>{inr(previous.revenue)}</b>
          </div>
        )}
      </div>
        <p className="an-insight-foot">
        <Lightbulb size={14} /> Revenue includes dine-in and takeaway bills, plus Swiggy and Zomato orders handed over. GST and service charge apply where charged.
      </p>
    </div>
  );
}
