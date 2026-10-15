import { NextResponse } from "next/server";
import { CAFE } from "@/lib/cafe";
import { getOrderingStatus } from "@/lib/ordering-hours";
import { getPublicMenu, getStore } from "@/lib/store";
import { withSlugs } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({
    cafe: CAFE,
    menu: withSlugs(await getPublicMenu()),
    feedback: store.feedback.filter((f) => f.status === "published").slice(0, 20),
    tables: store.tables.map((t) => ({ id: t.id, label: t.label, section: t.section })),
    ordering: getOrderingStatus(store.settings),
  });
}
