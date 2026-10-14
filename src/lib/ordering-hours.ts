import { CAFE } from "./cafe";
import type { AppSettings } from "./types";

const TZ = "Asia/Kolkata";

export type OrderingStatus = {
  acceptingOrders: boolean;
  withinHours: boolean;
  ordersOpen: boolean;
  allowAfterHours: boolean;
  hoursStart: string;
  hoursEnd: string;
  hoursLabel: string;
  localTimeLabel: string;
  reason?: string;
};

function parseHm(value: string): number | null {
  const m = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function formatHm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Current minutes since midnight in cafe timezone. */
export function localMinutesNow(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function localTimeLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
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
  // Overnight window (e.g. 22:00–02:00)
  return cur >= start || cur < end;
}

export function hoursLabel(settings: Pick<AppSettings, "hoursStart" | "hoursEnd">): string {
  const start = parseHm(settings.hoursStart || CAFE.hoursStart) ?? parseHm(CAFE.hoursStart)!;
  const end = parseHm(settings.hoursEnd || CAFE.hoursEnd) ?? parseHm(CAFE.hoursEnd)!;
  return `${formatHm(start)} – ${formatHm(end)}`;
}

export function getOrderingStatus(
  settings: AppSettings,
  now = new Date(),
): OrderingStatus {
  const withinHours = isWithinWorkingHours(settings, now);
  const ordersOpen = settings.ordersOpen !== false;
  const allowAfterHours = Boolean(settings.allowAfterHours);
  const start = settings.hoursStart || CAFE.hoursStart;
  const end = settings.hoursEnd || CAFE.hoursEnd;
  const label = hoursLabel(settings);
  const local = localTimeLabel(now);

  if (!ordersOpen) {
    return {
      acceptingOrders: false,
      withinHours,
      ordersOpen,
      allowAfterHours,
      hoursStart: start,
      hoursEnd: end,
      hoursLabel: label,
      localTimeLabel: local,
      reason: "Cafe is closed for orders. Ask reception or the owner to open ordering.",
    };
  }

  if (!withinHours && !allowAfterHours) {
    return {
      acceptingOrders: false,
      withinHours,
      ordersOpen,
      allowAfterHours,
      hoursStart: start,
      hoursEnd: end,
      hoursLabel: label,
      localTimeLabel: local,
      reason: `We're closed for the night. Ordering hours are ${label} (now ${local}).`,
    };
  }

  return {
    acceptingOrders: true,
    withinHours,
    ordersOpen,
    allowAfterHours,
    hoursStart: start,
    hoursEnd: end,
    hoursLabel: label,
    localTimeLabel: local,
  };
}

export function assertAcceptingOrders(settings: AppSettings) {
  const status = getOrderingStatus(settings);
  if (!status.acceptingOrders) {
    throw new Error(status.reason || "Cafe is not accepting orders right now");
  }
  return status;
}
