import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, parseRange } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const range = parseRange(req.nextUrl.searchParams.get("range"));
  return NextResponse.json(
    await getAnalytics({
      range,
      from: req.nextUrl.searchParams.get("from"),
      to: req.nextUrl.searchParams.get("to"),
    }),
  );
}
