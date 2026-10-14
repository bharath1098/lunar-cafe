import { NextRequest, NextResponse } from "next/server";
import { getVisitsByPhone, normalizePhone } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const phone = normalizePhone(req.nextUrl.searchParams.get("phone") || "");
  const exclude = req.nextUrl.searchParams.get("exclude") || undefined;
  if (phone.length < 10) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  return NextResponse.json({ visits: await getVisitsByPhone(phone, exclude) });
}
