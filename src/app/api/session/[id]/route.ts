import { NextRequest, NextResponse } from "next/server";
import { calculateBill } from "@/lib/bill";
import {
  buildReorderCartLines,
  getFullMenu,
  getSession,
  getStore,
  getVisitsByPhone,
  leaveSession,
  placeOrder,
  requestBill,
  requestTableSwitch,
  submitGuestPayment,
  updateCart,
} from "@/lib/store";
import { CAFE } from "@/lib/cafe";
import { getOrderingStatus } from "@/lib/ordering-hours";
import type { VisitItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const store = await getStore();
  const bill = calculateBill(session, store.settings);
  const host = session.members.find((m) => m.id === session.hostMemberId);
  const hostPhone = session.loyaltyPhone || host?.phone;
  const hostVisits = hostPhone ? await getVisitsByPhone(hostPhone, session.id) : [];
  const loyalty = hostPhone
    ? (() => {
        const member = store.loyalty.find(
          (l) => l.phone.replace(/\D/g, "") === String(hostPhone).replace(/\D/g, ""),
        );
        return member
          ? { phone: member.phone, name: member.name, points: member.points }
          : hostPhone
            ? { phone: hostPhone, name: host?.displayName || "Guest", points: 0 }
            : null;
      })()
    : null;
  return NextResponse.json({
    session,
    bill,
    menu: (await getFullMenu()).filter((m) => m.available),
    settings: store.settings,
    ordering: getOrderingStatus(store.settings),
    table: store.tables.find((t) => t.id === session.tableId),
    hostVisits,
    loyalty,
    cafe: {
      name: CAFE.name,
      upiId: CAFE.upiId,
    },
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "update_cart") {
      const session = await updateCart(id, body.memberId, body.cart);
      return NextResponse.json({ session });
    }
    if (action === "place_order") {
      const result = await placeOrder(id, body.memberId);
      return NextResponse.json(result);
    }
    if (action === "request_bill") {
      const result = await requestBill(id, body.memberId);
      return NextResponse.json(result);
    }
    if (action === "request_table_switch") {
      const session = await requestTableSwitch(
        id,
        body.memberId,
        String(body.reason || ""),
      );
      return NextResponse.json({ session });
    }
    if (action === "submit_payment") {
      const session = await submitGuestPayment(id, body.memberId);
      return NextResponse.json({ session });
    }
    if (action === "leave") {
      const session = await leaveSession(id, body.memberId);
      return NextResponse.json({ session });
    }
    if (action === "reorder_visit") {
      const session = await getSession(id);
      if (!session) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (session.hostMemberId !== body.memberId) {
        return NextResponse.json(
          { error: "Only the host can order again from past visits" },
          { status: 403 },
        );
      }
      const items = (body.items || []) as VisitItem[];
      if (!items.length) {
        return NextResponse.json({ error: "No items to add" }, { status: 400 });
      }
      const { lines, skipped } = await buildReorderCartLines(items, body.memberId);
      if (!lines.length) {
        return NextResponse.json(
          {
            error: skipped.length
              ? `Those dishes are no longer available: ${skipped.join(", ")}`
              : "No items to add",
          },
          { status: 400 },
        );
      }
      const next = await updateCart(id, body.memberId, [...session.cart, ...lines]);
      return NextResponse.json({ session: next, added: lines.length, skipped });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
