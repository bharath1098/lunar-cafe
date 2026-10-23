import { NextResponse } from "next/server";
import { clearStaffCookieHeader } from "@/lib/staff-gate";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearStaffCookieHeader());
  return res;
}
