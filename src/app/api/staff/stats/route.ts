import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, parseRange } from "@/lib/analytics";
import { readStaffRequest } from "@/lib/staff-gate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = readStaffRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
  }
  if (session.role !== "owner") {
    return NextResponse.json({ error: "You don't have permission for that" }, { status: 403 });
  }
  const range = parseRange(req.nextUrl.searchParams.get("range"));
  return NextResponse.json(
    await getAnalytics({
      range,
      from: req.nextUrl.searchParams.get("from"),
      to: req.nextUrl.searchParams.get("to"),
    }),
  );
}
