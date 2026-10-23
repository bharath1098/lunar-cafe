import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`error:${ip}`, 30, 60 * 60_000)) {
    return NextResponse.json({ ok: true });
  }
  let message = "";
  let page = "";
  let stack = "";
  try {
    const body = await req.json();
    message = String(body.message || "").slice(0, 500);
    page = String(body.path || "").slice(0, 200);
    stack = String(body.stack || "").slice(0, 1500);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!message) return NextResponse.json({ ok: true });
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(
    path.join(dir, "client-errors.ndjson"),
    `${JSON.stringify({ at: new Date().toISOString(), path: page, message, stack })}\n`,
  );
  return NextResponse.json({ ok: true });
}
