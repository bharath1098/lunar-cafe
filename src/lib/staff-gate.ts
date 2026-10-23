import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { StaffRole } from "./types";

const COOKIE = "lunar_staff";
const SECRET = process.env.STAFF_SECRET || "lunar-cafe-staff-session-v1";
const MAX_AGE = 14 * 60 * 60;

export type StaffToken = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  exp: number;
};

const OWNER = new Set<StaffRole>(["owner"]);
const DESK = new Set<StaffRole>(["owner", "reception"]);
const FLOOR = new Set<StaffRole>(["owner", "reception", "waiter"]);
const KITCHEN = new Set<StaffRole>(["owner", "reception", "kitchen"]);
const ANY = new Set<StaffRole>(["owner", "reception", "waiter", "kitchen"]);

const PUBLIC_ACTIONS = new Set([
  "reservation_create",
  "feedback_submit",
  "loyalty_join",
  "loyalty_leave",
]);

const ACTION_ROLES: Record<string, Set<StaffRole>> = {
  staff_create: OWNER,
  staff_update: OWNER,
  staff_delete: OWNER,
  staff_set_active: OWNER,
  menu_upsert: OWNER,
  menu_delete: OWNER,
  table_create: OWNER,
  table_update: OWNER,
  table_delete: OWNER,
  feedback_moderate: OWNER,
  export_backup: OWNER,
  clear_transactions: OWNER,
  set_ordering: DESK,
  extend_hours: DESK,
  reservation_update: DESK,
  update_billing: DESK,
  approve_payment: DESK,
  force_close: DESK,
  approve: FLOOR,
  reject: FLOOR,
  take_order: FLOOR,
  create_online_order: DESK,
  cancel_online_order: DESK,
  hand_over_online: DESK,
  generate_bill: FLOOR,
  close_pay: FLOOR,
  assign_waiter: FLOOR,
  regenerate_code: FLOOR,
  transfer_host: FLOOR,
  approve_table_switch: FLOOR,
  reject_table_switch: FLOOR,
  staff_table_switch: FLOOR,
  kitchen_status: KITCHEN,
  ack_alert: ANY,
  ack_all_alerts: ANY,
  staff_change_password: ANY,
};

export function isPublicAction(action: string) {
  return PUBLIC_ACTIONS.has(action);
}

export function roleAllows(action: string, role: StaffRole) {
  return ACTION_ROLES[action]?.has(role) ?? false;
}

export function signStaffToken(user: Omit<StaffToken, "exp">) {
  const payload: StaffToken = { ...user, exp: Date.now() + MAX_AGE * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyStaffToken(token: string | undefined | null): StaffToken | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as StaffToken;
    if (!data?.email || !data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function readStaffRequest(req: NextRequest) {
  return verifyStaffToken(req.cookies.get(COOKIE)?.value);
}

export function staffCookieHeader(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearStaffCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
