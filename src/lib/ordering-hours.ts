import { CAFE } from "./cafe";
import type { AppSettings } from "./types";

const TZ = "Asia/Kolkata";
const DAY = 24 * 60;

/** Last stretch of the service, when the close countdown and extend control appear. */
export const CLOSE_WARNING_MINUTES = 30;
/** How long owner / reception have to settle tables after the cafe closes. */
export const TABLE_GRACE_MINUTES = 30;

export type OrderingStatus = {
  acceptingOrders: boolean;
  withinHours: boolean;
  ordersOpen: boolean;
  allowAfterHours: boolean;
  hoursStart: string;
  hoursEnd: string;
  /** Close time in force tonight (standing hours, or a same-day extension). */
  effectiveHoursEnd: string;
  hoursExtended: boolean;
  serviceDate: string;
  hoursLabel: string;
  localTimeLabel: string;
  /** Minutes until the effective close, while the cafe is still open. */
  minutesUntilClose: number | null;
  closingSoon: boolean;
  /** After close, before tables are closed automatically. */
  inGrace: boolean;
  graceMinutesLeft: number | null;
  /** Grace has ended and open tables should be closed automatically. */
  pastGrace: boolean;
  reason?: string;
};

type HoursSettings = Pick<
  AppSettings,
  "hoursStart" | "hoursEnd" | "hoursEndOverride" | "hoursEndOverrideDate"
>;

export type EffectiveClose = {
  start: string;
  end: string;
  standingEnd: string;
  startMinutes: number;
  endMinutes: number;
  extended: boolean;
  serviceDate: string;
};

function parseHm(value: string): number | null {
  const m = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function canonicalHm(value: string): string | null {
  const minutes = parseHm(value);
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutesToHm(value: string, add: number): string {
  const base = parseHm(value) ?? 0;
  const total = (base + add) % DAY;
  const normalized = total < 0 ? total + DAY : total;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatHm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function localParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  let hour = Number(pick("hour"));
  if (hour === 24) hour = 0;
  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    minutes: hour * 60 + Number(pick("minute")),
  };
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function previousDate(year: number, month: number, day: number) {
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return dateKey(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

/** Minutes after opening, wrapping past midnight. Opening itself is 0. */
function serviceOffset(minutes: number, startMinutes: number) {
  return (minutes - startMinutes + DAY) % DAY;
}

function forwardMinutes(from: number, to: number) {
  return (to - from + DAY) % DAY;
}

/** Current minutes since midnight in cafe timezone. */
export function localMinutesNow(now = new Date()): number {
  return localParts(now).minutes;
}

export function localTimeLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
}

/** UTC timestamp of the opening that the current clock belongs to (Asia/Kolkata, no daylight saving). */
export function currentOpeningMs(hoursStart: string, now = new Date()): number {
  const parts = localParts(now);
  const start = parseHm(hoursStart) ?? parseHm(CAFE.hoursStart)!;
  let year = parts.year;
  let month = parts.month;
  let day = parts.day;
  if (parts.minutes < start) {
    const prev = previousDate(year, month, day).split("-").map(Number);
    year = prev[0];
    month = prev[1];
    day = prev[2];
  }
  const utc = Date.UTC(year, month - 1, day, Math.floor(start / 60), start % 60);
  return utc - (5 * 60 + 30) * 60 * 1000;
}

/** Service date is yesterday when the clock is still before opening (after-midnight extension). */
export function serviceDateKey(hoursStart: string, now = new Date()): string {
  const parts = localParts(now);
  const start = parseHm(hoursStart) ?? parseHm(CAFE.hoursStart)!;
  const key = dateKey(parts.year, parts.month, parts.day);
  if (parts.minutes < start) return previousDate(parts.year, parts.month, parts.day);
  return key;
}

export function effectiveClose(settings: HoursSettings, now = new Date()): EffectiveClose {
  const start = canonicalHm(settings.hoursStart || CAFE.hoursStart) || CAFE.hoursStart;
  const standingEnd = canonicalHm(settings.hoursEnd || CAFE.hoursEnd) || CAFE.hoursEnd;
  const startMinutes = parseHm(start)!;
  const serviceDate = serviceDateKey(start, now);
  const override = canonicalHm(settings.hoursEndOverride || "");
  const extended = Boolean(override && settings.hoursEndOverrideDate === serviceDate);
  const end = extended && override ? override : standingEnd;
  return {
    start,
    end,
    standingEnd,
    startMinutes,
    endMinutes: parseHm(end)!,
    extended,
    serviceDate,
  };
}

export function isWithinWorkingHours(
  settings: Pick<AppSettings, "hoursStart" | "hoursEnd">,
  now = new Date(),
): boolean {
  const start = parseHm(settings.hoursStart || CAFE.hoursStart) ?? parseHm(CAFE.hoursStart)!;
  const end = parseHm(settings.hoursEnd || CAFE.hoursEnd) ?? parseHm(CAFE.hoursEnd)!;
  const cur = localMinutesNow(now);
  if (start === end) return true;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end;
}

export function hoursLabel(settings: HoursSettings, now = new Date()): string {
  const eff = effectiveClose(settings, now);
  return `${formatHm(eff.startMinutes)} – ${formatHm(eff.endMinutes)}`;
}

export function validateHoursExtension(
  settings: HoursSettings,
  nextHm: string,
  now = new Date(),
): { ok: true; serviceDate: string; end: string } | { ok: false; reason: string } {
  const next = canonicalHm(nextHm);
  if (!next) return { ok: false, reason: "Enter a close time" };
  const eff = effectiveClose(settings, now);
  const nextMinutes = parseHm(next)!;
  if (nextMinutes === eff.startMinutes) {
    return { ok: false, reason: "Close time has to be before the next opening" };
  }
  const nextOffset = serviceOffset(nextMinutes, eff.startMinutes);
  const endOffset = serviceOffset(eff.endMinutes, eff.startMinutes);
  if (nextOffset <= endOffset) {
    return {
      ok: false,
      reason: `Enter a time later than ${formatHm(eff.endMinutes)}. This applies tonight only.`,
    };
  }
  return { ok: true, serviceDate: eff.serviceDate, end: next };
}

export function getOrderingStatus(
  settings: AppSettings,
  now = new Date(),
): OrderingStatus {
  const eff = effectiveClose(settings, now);
  const withinHours = isWithinWorkingHours(
    { hoursStart: eff.start, hoursEnd: eff.end },
    now,
  );
  const ordersOpen = settings.ordersOpen !== false;
  const allowAfterHours = Boolean(settings.allowAfterHours);
  const label = hoursLabel(settings, now);
  const local = localTimeLabel(now);
  const cur = localMinutesNow(now);

  let minutesUntilClose: number | null = null;
  let closingSoon = false;
  let inGrace = false;
  let graceMinutesLeft: number | null = null;
  let pastGrace = false;

  if (eff.startMinutes !== eff.endMinutes) {
    if (withinHours) {
      const until = forwardMinutes(cur, eff.endMinutes);
      minutesUntilClose = until === 0 ? null : until;
      closingSoon = minutesUntilClose != null && minutesUntilClose <= CLOSE_WARNING_MINUTES;
    } else {
      const since = forwardMinutes(eff.endMinutes, cur);
      const closedGap = forwardMinutes(eff.endMinutes, eff.startMinutes);
      if (since < closedGap) {
        if (since < TABLE_GRACE_MINUTES) {
          inGrace = true;
          graceMinutesLeft = TABLE_GRACE_MINUTES - since;
        } else {
          pastGrace = true;
        }
      }
    }
  }

  const base = {
    withinHours,
    ordersOpen,
    allowAfterHours,
    hoursStart: eff.start,
    hoursEnd: eff.standingEnd,
    effectiveHoursEnd: eff.end,
    hoursExtended: eff.extended,
    serviceDate: eff.serviceDate,
    hoursLabel: label,
    localTimeLabel: local,
    minutesUntilClose,
    closingSoon,
    inGrace,
    graceMinutesLeft,
    pastGrace,
  };

  if (!ordersOpen) {
    return {
      ...base,
      acceptingOrders: false,
      reason: "Cafe is closed for orders. Ask reception or the owner to open ordering.",
    };
  }

  if (!withinHours && !allowAfterHours) {
    return {
      ...base,
      acceptingOrders: false,
      reason: `We're closed for the night. Ordering hours are ${label} (now ${local}).`,
    };
  }

  return {
    ...base,
    acceptingOrders: true,
  };
}

export function assertAcceptingOrders(settings: AppSettings) {
  const status = getOrderingStatus(settings);
  if (!status.acceptingOrders) {
    throw new Error(status.reason || "Cafe is not accepting orders right now");
  }
  return status;
}
