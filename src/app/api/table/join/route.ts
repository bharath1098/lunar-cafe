import { NextRequest, NextResponse } from "next/server";
import { joinOrCreateSession } from "@/lib/store";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`join:${ip}`, 30, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a moment and try again." },
      { status: 429 },
    );
  }
  try {
    const body = await req.json();
    if (!String(body.phone || "").trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!String(body.displayName || "").trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const result = await joinOrCreateSession({
      tableId: body.tableId,
      displayName: body.displayName,
      phone: body.phone,
      groupCode: body.groupCode,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    const status = message === "GROUP_CODE_REQUIRED" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
