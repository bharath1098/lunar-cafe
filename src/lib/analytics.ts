import { billableOrders, calculateBill } from "./bill";
import { getStore, isDineInSession } from "./store";
import type { CafeStore, OrderChannel, TableSession } from "./types";

export type StatsRange = "today" | "7d" | "30d" | "all" | "custom";

export const STATS_RANGES: StatsRange[] = ["today", "7d", "30d", "all", "custom"];

const MAX_ALL_DAYS = 365;
const MAX_CUSTOM_DAYS = 365;
const MIN_DINING_MINS = 3;
const MAX_DINING_MINS = 600;

export interface PeriodTotals {
  revenue: number;
  bills: number;
  items: number;
  avgBill: number;
  avgItemsPerBill: number;
  avgDiningMins: number | null;
  subtotal: number;
  discounts: number;
  serviceCharge: number;
  tax: number;
  roundOff: number;
}

export interface AnalyticsResult {
  range: StatsRange;
  from: string;
  to: string;
  days: number;
  allTimeBills: number;
  totals: PeriodTotals;
  previous: PeriodTotals | null;
  daily: { date: string; revenue: number; bills: number; items: number }[];
  hourly: { hour: number; revenue: number; bills: number }[];
  /** heat[weekday 0=Sun][hour 0-23] = revenue */
  heat: number[][];
  weekdays: { day: number; revenue: number; bills: number }[];
  payments: { method: string; revenue: number; bills: number }[];
  categories: { category: string; revenue: number; qty: number }[];
  items: { id: string; name: string; category: string; qty: number; revenue: number }[];
  tables: {
    tableId: string;
    label: string;
    section: string;
    revenue: number;
    bills: number;
  }[];
  sections: { section: string; revenue: number; bills: number }[];
  /** Dine-in, takeaway, Swiggy, and Zomato sales in this period. */
  channels: { channel: OrderChannel; label: string; revenue: number; bills: number; items: number }[];
}

type PaidEntry = {
  session: TableSession;
  at: Date;
  bill: ReturnType<typeof calculateBill>;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function dayDiff(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function summarise(entries: PaidEntry[]): PeriodTotals {
  let revenue = 0;
  let items = 0;
  let subtotal = 0;
  let discounts = 0;
  let serviceCharge = 0;
  let tax = 0;
  let roundOff = 0;
  let diningTotal = 0;
  let diningCount = 0;

  for (const { session, bill } of entries) {
    revenue += bill.grandTotal;
    items += bill.totalQty;
    subtotal += bill.subtotal;
    discounts += bill.discountValue;
    serviceCharge += bill.serviceCharge;
    tax += bill.taxTotal;
    roundOff += bill.roundOff;

    if (!isDineInSession(session)) continue;
    const mins =
      (new Date(session.paidAt as string).getTime() -
        new Date(session.createdAt).getTime()) /
      60_000;
    if (mins >= MIN_DINING_MINS && mins <= MAX_DINING_MINS) {
      diningTotal += mins;
      diningCount += 1;
    }
  }

  const bills = entries.length;
  return {
    revenue: money(revenue),
    bills,
    items,
    avgBill: bills ? money(revenue / bills) : 0,
    avgItemsPerBill: bills ? Math.round((items / bills) * 10) / 10 : 0,
    avgDiningMins: diningCount ? Math.round(diningTotal / diningCount) : null,
    subtotal: money(subtotal),
    discounts: money(discounts),
    serviceCharge: money(serviceCharge),
    tax: money(tax),
    roundOff: money(roundOff),
  };
}

export function parseRange(value: string | null): StatsRange {
  return STATS_RANGES.includes(value as StatsRange) ? (value as StatsRange) : "7d";
}

/** Accept YYYY-MM-DD (local calendar day). Returns null if invalid. */
export function parseDayParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return startOfDay(date);
}

export type AnalyticsQuery = {
  range: StatsRange;
  from?: string | null;
  to?: string | null;
};

export async function getAnalytics(
  query: AnalyticsQuery | StatsRange,
): Promise<AnalyticsResult> {
  const q: AnalyticsQuery =
    typeof query === "string" ? { range: query } : query;
  return computeAnalytics(await getStore(), q);
}

export function computeAnalytics(
  store: CafeStore,
  query: AnalyticsQuery | StatsRange,
): AnalyticsResult {
  const q: AnalyticsQuery =
    typeof query === "string" ? { range: query } : query;
  let range = q.range;
  const now = new Date();
  const today = startOfDay(now);

  // Real sales: paid dine-in / takeaway bills, plus handed-over Swiggy and Zomato orders.
  const paid: PaidEntry[] = store.sessions
    .filter(
      (s) =>
        Boolean(s.paidAt) &&
        (Boolean(s.billNumber) || (s.channel != null && s.channel !== "dine_in")),
    )
    .map((session) => ({
      session,
      at: new Date(session.paidAt as string),
      bill: calculateBill(session, store.settings),
    }))
    .filter((p) => p.bill.grandTotal > 0);

  let from: Date;
  let toDay: Date;
  let days: number;

  if (range === "custom") {
    let customFrom = parseDayParam(q.from ?? null);
    let customTo = parseDayParam(q.to ?? null);
    if (!customFrom || !customTo) {
      // Incomplete custom range → fall back to last 7 days
      range = "7d";
      days = 7;
      from = addDays(today, -(days - 1));
      toDay = today;
    } else {
      if (customFrom > customTo) {
        const swap = customFrom;
        customFrom = customTo;
        customTo = swap;
      }
      if (customTo > today) customTo = today;
      days = Math.min(MAX_CUSTOM_DAYS, dayDiff(customFrom, customTo) + 1);
      if (days < 1) days = 1;
      toDay = customTo;
      from = addDays(customTo, -(days - 1));
    }
  } else if (range === "today") {
    days = 1;
    from = today;
    toDay = today;
  } else if (range === "7d") {
    days = 7;
    from = addDays(today, -(days - 1));
    toDay = today;
  } else if (range === "30d") {
    days = 30;
    from = addDays(today, -(days - 1));
    toDay = today;
  } else {
    const first = paid.reduce<Date | null>(
      (min, p) => (!min || p.at < min ? p.at : min),
      null,
    );
    days = first ? Math.min(MAX_ALL_DAYS, dayDiff(first, today) + 1) : 1;
    from = addDays(today, -(days - 1));
    toDay = today;
  }

  const end = addDays(toDay, 1);
  const prevFrom = addDays(from, -days);

  const inRange = paid.filter((p) => p.at >= from && p.at < end);
  const inPrev =
    range === "all" ? [] : paid.filter((p) => p.at >= prevFrom && p.at < from);

  // Daily series, zero-filled
  const dailyMap = new Map<string, { revenue: number; bills: number; items: number }>();
  for (let i = 0; i < days; i++) {
    dailyMap.set(dayKey(addDays(from, i)), { revenue: 0, bills: 0, items: 0 });
  }

  const hourMap = new Map<number, { revenue: number; bills: number }>();
  const heat: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const weekdayMap: { revenue: number; bills: number }[] = Array.from(
    { length: 7 },
    () => ({ revenue: 0, bills: 0 }),
  );
  const paymentMap = new Map<string, { revenue: number; bills: number }>();
  const categoryMap = new Map<string, { revenue: number; qty: number }>();
  const itemMap = new Map<
    string,
    { id: string; name: string; category: string; qty: number; revenue: number }
  >();
  const tableMap = new Map<string, { revenue: number; bills: number }>();
  const sectionMap = new Map<string, { revenue: number; bills: number }>();
  const channelMap = new Map<
    OrderChannel,
    { revenue: number; bills: number; items: number }
  >();

  const menuById = new Map(store.menu.map((m) => [m.id, m]));
  const tableById = new Map(store.tables.map((t) => [t.id, t]));
  const channelOf = (session: TableSession): OrderChannel =>
    session.channel === "takeaway" ||
    session.channel === "swiggy" ||
    session.channel === "zomato"
      ? session.channel
      : "dine_in";

  for (const { session, at, bill } of inRange) {
    const total = bill.grandTotal;
    const channel = channelOf(session);

    const day = dailyMap.get(dayKey(at));
    if (day) {
      day.revenue += total;
      day.bills += 1;
      day.items += bill.totalQty;
    }

    const hour = at.getHours();
    const h = hourMap.get(hour) ?? { revenue: 0, bills: 0 };
    h.revenue += total;
    h.bills += 1;
    hourMap.set(hour, h);

    heat[at.getDay()][hour] += total;
    weekdayMap[at.getDay()].revenue += total;
    weekdayMap[at.getDay()].bills += 1;

    const ch = channelMap.get(channel) ?? { revenue: 0, bills: 0, items: 0 };
    ch.revenue += total;
    ch.bills += 1;
    ch.items += bill.totalQty;
    channelMap.set(channel, ch);

    // Counter payment mix only — Swiggy and Zomato are prepaid on the platform.
    if (channel === "dine_in" || channel === "takeaway") {
      const method = session.paymentMethod || "cash";
      const p = paymentMap.get(method) ?? { revenue: 0, bills: 0 };
      p.revenue += total;
      p.bills += 1;
      paymentMap.set(method, p);
    }

    if (isDineInSession(session)) {
      const table = tableById.get(session.tableId);
      const t = tableMap.get(session.tableId) ?? { revenue: 0, bills: 0 };
      t.revenue += total;
      t.bills += 1;
      tableMap.set(session.tableId, t);

      const section = table?.section ?? "unknown";
      const sec = sectionMap.get(section) ?? { revenue: 0, bills: 0 };
      sec.revenue += total;
      sec.bills += 1;
      sectionMap.set(section, sec);
    }

    for (const line of billableOrders(session.orders)) {
      const menu = menuById.get(line.menuItemId);
      const category = menu?.category || "Other";
      const lineRevenue = line.unitPrice * line.qty;

      const c = categoryMap.get(category) ?? { revenue: 0, qty: 0 };
      c.revenue += lineRevenue;
      c.qty += line.qty;
      categoryMap.set(category, c);

      const item = itemMap.get(line.menuItemId) ?? {
        id: line.menuItemId,
        name: line.name,
        category,
        qty: 0,
        revenue: 0,
      };
      item.qty += line.qty;
      item.revenue += lineRevenue;
      itemMap.set(line.menuItemId, item);
    }
  }

  // Hour axis: always cover opening hours, extend if sales fall outside
  const dataHours = [...hourMap.keys()];
  const firstHour = Math.min(11, ...dataHours);
  const lastHour = Math.max(23, ...dataHours);
  const hourly = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => {
    const hour = firstHour + i;
    const v = hourMap.get(hour);
    return { hour, revenue: money(v?.revenue ?? 0), bills: v?.bills ?? 0 };
  });

  return {
    range,
    from: dayKey(from),
    to: dayKey(toDay),
    days,
    allTimeBills: paid.length,
    totals: summarise(inRange),
    previous: range === "all" ? null : summarise(inPrev),
    daily: [...dailyMap.entries()].map(([date, v]) => ({
      date,
      revenue: money(v.revenue),
      bills: v.bills,
      items: v.items,
    })),
    hourly,
    heat: heat.map((row) => row.map(money)),
    weekdays: weekdayMap.map((v, day) => ({
      day,
      revenue: money(v.revenue),
      bills: v.bills,
    })),
    payments: [...paymentMap.entries()]
      .map(([method, v]) => ({ method, revenue: money(v.revenue), bills: v.bills }))
      .sort((a, b) => b.revenue - a.revenue),
    categories: [...categoryMap.entries()]
      .map(([category, v]) => ({ category, revenue: money(v.revenue), qty: v.qty }))
      .sort((a, b) => b.revenue - a.revenue),
    items: [...itemMap.values()]
      .map((i) => ({ ...i, revenue: money(i.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 40),
    tables: [...tableMap.entries()]
      .map(([tableId, v]) => {
        const table = tableById.get(tableId);
        return {
          tableId,
          label: table?.label ?? tableId.replace("lunar-", ""),
          section: table?.section ?? "unknown",
          revenue: money(v.revenue),
          bills: v.bills,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    sections: [...sectionMap.entries()].map(([section, v]) => ({
      section,
      revenue: money(v.revenue),
      bills: v.bills,
    })),
    channels: (
      [
        ["dine_in", "Dine-in"],
        ["takeaway", "Takeaway"],
        ["swiggy", "Swiggy"],
        ["zomato", "Zomato"],
      ] as const
    )
      .map(([channel, label]) => {
        const v = channelMap.get(channel) ?? { revenue: 0, bills: 0, items: 0 };
        return {
          channel,
          label,
          revenue: money(v.revenue),
          bills: v.bills,
          items: v.items,
        };
      })
      .filter((c) => c.bills > 0),
  };
}
