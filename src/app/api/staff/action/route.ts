import { NextRequest, NextResponse } from "next/server";
import { calculateBill } from "@/lib/bill";
import {
  acknowledgeAllStaffAlerts,
  acknowledgeStaffAlert,
  approveGuestPayment,
  approveOrderItems,
  approveTableSwitch,
  assignWaiter,
  closeAndPay,
  createReservation,
  createStaffUser,
  createTable,
  deleteMenuItem,
  deleteStaffUser,
  deleteTable,
  ensureLoyalty,
  extendCafeHours,
  forceCloseSession,
  generateBill,
  getSession,
  getStore,
  moderateFeedback,
  regenerateGroupCode,
  clearTransactionalData,
  setCafeOrderingControls,
  changeOwnPassword,
  leaveLoyalty,
  rejectOrderItem,
  rejectTableSwitch,
  setKitchenStatus,
  setStaffActive,
  staffTakeOrder,
  createOnlineOrder,
  cancelOnlineOrder,
  handOverOnlineOrder,
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
import { recordCampaign } from "@/lib/campaign-log";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isPublicAction, readStaffRequest, roleAllows } from "@/lib/staff-gate";
import { campaignLabel, type Utm } from "@/lib/utm";

function withCampaign(note: unknown, utm: Utm | null | undefined) {
  const label = campaignLabel(utm);
  const text = String(note || "").trim();
  if (!label) return text || undefined;
  return [text, `Campaign: ${label}`].filter(Boolean).join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const session = readStaffRequest(req);

    if (isPublicAction(action)) {
      const ip = clientIp(req);
      if (!rateLimit(`public:${ip}:${action}`, 20, 10 * 60_000)) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          { status: 429 },
        );
      }
    } else if (!session) {
      return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
    } else if (!roleAllows(action, session.role)) {
      return NextResponse.json(
        { error: "You don't have permission for that" },
        { status: 403 },
      );
    }

    const actor = session?.email || "guest";
    await getStore();

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
      case "create_online_order":
        return NextResponse.json(
          await createOnlineOrder(body.channel, body.lines || [], actor, {
            name: body.guestName,
            phone: body.guestPhone,
            externalOrderId: body.externalOrderId,
            note: body.note,
          }),
        );
      case "cancel_online_order":
        return NextResponse.json({
          session: await cancelOnlineOrder(
            body.sessionId,
            actor,
            String(body.reason || ""),
          ),
        });
      case "hand_over_online":
        return NextResponse.json({
          session: await handOverOnlineOrder(body.sessionId, actor),
        });
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
      case "ack_alert":
        return NextResponse.json(await acknowledgeStaffAlert(body.alertId, actor));
      case "ack_all_alerts":
        return NextResponse.json(await acknowledgeAllStaffAlerts(actor));
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
          session: await forceCloseSession(
            body.sessionId,
            actor,
            String(body.reason || ""),
          ),
        });
      case "approve_table_switch":
        return NextResponse.json({
          session: await approveTableSwitch(
            body.sessionId,
            body.toTableId,
            actor,
            body.reason ? String(body.reason) : undefined,
          ),
        });
      case "reject_table_switch":
        return NextResponse.json({
          session: await rejectTableSwitch(body.sessionId, actor),
        });
      case "staff_table_switch":
        return NextResponse.json({
          session: await approveTableSwitch(
            body.sessionId,
            body.toTableId,
            actor,
            String(body.reason || ""),
          ),
        });
      case "menu_upsert": {
        const item = body.item as MenuItem;
        if (!item.id) item.id = randomUUID();
        return NextResponse.json({ item: await upsertMenuItem(item, actor) });
      }
      case "menu_delete":
        await deleteMenuItem(body.id, actor);
        return NextResponse.json({ ok: true });
      case "reservation_create": {
        recordCampaign("reservation_create", body.utm);
        return NextResponse.json({
          reservation: await createReservation({
            ...body.data,
            note: withCampaign(body.data?.note, body.utm),
          }),
        });
      }
      case "reservation_update":
        return NextResponse.json({
          reservation: await updateReservation(body.id, body.patch, actor),
        });
      case "loyalty_join":
        recordCampaign("loyalty_join", body.utm);
        return NextResponse.json({
          member: await ensureLoyalty(body.phone, body.name || "Guest"),
        });
      case "loyalty_leave":
        return NextResponse.json({ member: await leaveLoyalty(body.phone) });
      case "feedback_submit": {
        const message = String(body.data?.message || "").trim();
        if (message.length < 4) {
          return NextResponse.json({ error: "Please write a short message." }, { status: 400 });
        }
        recordCampaign("feedback_submit", body.utm);
        return NextResponse.json({
          feedback: await submitFeedback({ ...body.data, message }),
        });
      }
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
      case "extend_hours":
        return NextResponse.json({
          ordering: await extendCafeHours(String(body.hoursEnd || ""), actor),
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
      case "staff_change_password":
        await changeOwnPassword(actor, body.currentPassword, body.password);
        return NextResponse.json({ ok: true });
      case "export_backup": {
        const store = await getStore();
        const { staff, ...rest } = store;
        return NextResponse.json({
          exportedAt: new Date().toISOString(),
          ...rest,
          staff: staff.map(({ password: _password, ...member }) => member),
        });
      }
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
