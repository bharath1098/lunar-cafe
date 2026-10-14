import { NextRequest, NextResponse } from "next/server";
import { calculateBill } from "@/lib/bill";
import {
  approveGuestPayment,
  approveOrderItems,
  assignWaiter,
  closeAndPay,
  createReservation,
  createStaffUser,
  createTable,
  deleteMenuItem,
  deleteStaffUser,
  deleteTable,
  ensureLoyalty,
  forceCloseSession,
  generateBill,
  getSession,
  getStore,
  moderateFeedback,
  regenerateGroupCode,
  clearTransactionalData,
  setCafeOrderingControls,
  rejectOrderItem,
  setKitchenStatus,
  setStaffActive,
  staffTakeOrder,
  submitFeedback,
  transferHost,
  updateBilling,
  updateReservation,
  updateStaffUser,
  updateTable,
  upsertMenuItem,
} from "@/lib/store";
import { randomUUID } from "crypto";
import type { MenuItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, actor = "staff" } = body;

    switch (action) {
      case "approve":
        return NextResponse.json({
          session: await approveOrderItems(body.sessionId, body.itemIds, actor),
        });
      case "reject":
        return NextResponse.json({
          session: await rejectOrderItem(
            body.sessionId,
            body.itemId,
            body.reason || "Unavailable",
            actor,
          ),
        });
      case "take_order":
        if (!String(body.guestName || "").trim() || !String(body.guestPhone || "").trim()) {
          return NextResponse.json(
            { error: "Guest name and phone are required" },
            { status: 400 },
          );
        }
        return NextResponse.json(
          await staffTakeOrder(body.tableId, body.lines || [], actor, {
            name: body.guestName,
            phone: body.guestPhone,
          }),
        );
      case "kitchen_status":
        return NextResponse.json({
          session: await setKitchenStatus(
            body.sessionId,
            body.itemIds,
            body.status,
            actor,
          ),
        });
      case "regenerate_code":
        return NextResponse.json({
          session: await regenerateGroupCode(body.sessionId, actor),
        });
      case "transfer_host":
        return NextResponse.json({
          session: await transferHost(body.sessionId, body.newHostId, actor),
        });
      case "assign_waiter":
        return NextResponse.json({
          table: await assignWaiter(body.tableId, body.waiterId, actor),
        });
      case "update_billing":
        return NextResponse.json({
          session: await updateBilling(body.sessionId, body.patch, actor),
        });
      case "generate_bill": {
        const session = await generateBill(body.sessionId, actor);
        return NextResponse.json({
          session,
          bill: calculateBill(session, (await getStore()).settings),
        });
      }
      case "approve_payment": {
        const session = await getSession(body.sessionId);
        if (!session) throw new Error("Session not found");
        const bill = calculateBill(session, (await getStore()).settings);
        return NextResponse.json({
          session: await approveGuestPayment(body.sessionId, actor, bill.grandTotal),
          bill,
        });
      }
      case "close_pay": {
        const session = await getSession(body.sessionId);
        if (!session) throw new Error("Session not found");
        const bill = calculateBill(session, (await getStore()).settings);
        return NextResponse.json({
          session: await closeAndPay(
            body.sessionId,
            body.paymentMethod,
            actor,
            bill.grandTotal,
          ),
          bill,
        });
      }
      case "force_close":
        return NextResponse.json({
          session: await forceCloseSession(body.sessionId, actor),
        });
      case "menu_upsert": {
        const item = body.item as MenuItem;
        if (!item.id) item.id = randomUUID();
        return NextResponse.json({ item: await upsertMenuItem(item, actor) });
      }
      case "menu_delete":
        await deleteMenuItem(body.id, actor);
        return NextResponse.json({ ok: true });
      case "reservation_create":
        return NextResponse.json({
          reservation: await createReservation(body.data),
        });
      case "reservation_update":
        return NextResponse.json({
          reservation: await updateReservation(body.id, body.patch, actor),
        });
      case "loyalty_join":
        return NextResponse.json({
          member: await ensureLoyalty(body.phone, body.name || "Guest"),
        });
      case "feedback_submit":
        return NextResponse.json({ feedback: await submitFeedback(body.data) });
      case "clear_transactions":
        return NextResponse.json(await clearTransactionalData(actor));
      case "set_ordering":
        return NextResponse.json({
          ordering: await setCafeOrderingControls(
            {
              ordersOpen: body.ordersOpen,
              allowAfterHours: body.allowAfterHours,
              hoursStart: body.hoursStart,
              hoursEnd: body.hoursEnd,
            },
            actor,
          ),
        });
      case "feedback_moderate":
        return NextResponse.json({
          feedback: await moderateFeedback(body.id, body.status, actor),
        });
      case "staff_create":
        return NextResponse.json({
          staff: await createStaffUser(
            {
              name: body.name,
              email: body.email,
              password: body.password,
              role: body.role || "waiter",
            },
            actor,
          ),
        });
      case "staff_update":
        return NextResponse.json({
          staff: await updateStaffUser(body.staffId, body.patch || {}, actor),
        });
      case "staff_delete":
        await deleteStaffUser(body.staffId, actor);
        return NextResponse.json({ ok: true });
      case "staff_set_active":
        return NextResponse.json({
          staff: await setStaffActive(body.staffId, Boolean(body.active), actor),
        });
      case "table_create":
        return NextResponse.json({
          table: await createTable(
            {
              section: body.section,
              number: body.number,
              label: body.label,
            },
            actor,
          ),
        });
      case "table_update":
        return NextResponse.json({
          table: await updateTable(body.tableId, body.patch || {}, actor),
        });
      case "table_delete":
        await deleteTable(body.tableId, actor);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
