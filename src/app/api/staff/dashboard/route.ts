import { NextRequest, NextResponse } from "next/server";
import { calculateBill } from "@/lib/bill";
import { getOrderingStatus } from "@/lib/ordering-hours";
import { getStats, getStore, isDineInSession } from "@/lib/store";
import { readStaffRequest } from "@/lib/staff-gate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!readStaffRequest(req)) {
    return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
  }
  const store = await getStore();
  const ordering = getOrderingStatus(store.settings);
  const openSessions = store.sessions.filter((s) =>
    s.status === "active" || s.status === "billing",
  );
  const floorSessions = openSessions.filter(isDineInSession);

  const activeSessions = openSessions.map((s) => ({
    ...s,
    bill: calculateBill(s, store.settings),
    loyaltyPoints: s.loyaltyPhone
      ? store.loyalty.find(
          (l) => l.phone.replace(/\D/g, "") === String(s.loyaltyPhone).replace(/\D/g, ""),
        )?.points ?? 0
      : 0,
  }));

  const kitchenItems = openSessions
    .filter((s) => s.status === "active")
    .flatMap((s) =>
      s.orders
        .filter((o) => ["queued", "preparing", "ready"].includes(o.status))
        .map((o) => ({
          ...o,
          sessionId: s.id,
          tableId: o.tableId || s.tableId,
          sessionTableId: s.tableId,
          channel: s.channel || "dine_in",
          guestName: s.members.find((m) => m.isHost)?.displayName || s.members[0]?.displayName,
          externalOrderId: s.externalOrderId,
          orderNote: s.orderNote,
          groupCode: s.groupCode,
          tableSwitched: Boolean(s.tableSwitches?.length),
        })),
    );

  const occupiedTableIds = new Set(floorSessions.map((s) => s.tableId));
  const freeTables = store.tables
    .filter((t) => !occupiedTableIds.has(t.id))
    .map((t) => ({ id: t.id, label: t.label || t.id.replace(/^lunar-/, "") }));

  const tableSwitchRequests = floorSessions
    .filter((s) => s.tableSwitchRequestedAt && !s.billGeneratedAt)
    .map((s) => {
      const table = store.tables.find((t) => t.id === s.tableId);
      return {
        sessionId: s.id,
        tableId: s.tableId,
        guestName: s.tableSwitchRequestedByName || "Guest",
        reason: s.tableSwitchReason || "",
        requestedAt: s.tableSwitchRequestedAt as string,
        assignedWaiterId: table?.assignedWaiterId ?? null,
      };
    })
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  const billRequests = floorSessions
    .filter((s) => s.billRequestedAt && !s.billGeneratedAt)
    .map((s) => {
      const table = store.tables.find((t) => t.id === s.tableId);
      return {
        sessionId: s.id,
        tableId: s.tableId,
        guestName: s.billRequestedByName || "Guest",
        requestedAt: s.billRequestedAt as string,
        assignedWaiterId: table?.assignedWaiterId ?? null,
        total: calculateBill(s, store.settings).grandTotal,
      };
    })
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  const paymentApprovals = floorSessions
    .filter((s) => s.paymentAwaitingApproval && s.paymentSubmittedAt && !s.paidAt)
    .map((s) => ({
      sessionId: s.id,
      tableId: s.tableId,
      billNumber: s.billNumber,
      guestName: s.billRequestedByName || "Guest",
      submittedAt: s.paymentSubmittedAt as string,
      paymentMethod: s.paymentMethod || "upi",
      total: calculateBill(s, store.settings).grandTotal,
    }))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const pendingApprovals = floorSessions
    .filter((s) => s.status === "active")
    .flatMap((s) =>
      s.orders
        .filter((o) => o.status === "pending_approval")
        .map((o) => ({
          ...o,
          sessionId: s.id,
          tableId: o.tableId || s.tableId,
          sessionTableId: s.tableId,
          groupCode: s.groupCode,
        })),
    );

  return NextResponse.json({
    tables: store.tables,
    staff: store.staff.map(({ password: _p, ...s }) => s),
    menu: store.menu,
    activeSessions,
    freeTables,
    tableSwitchRequests,
    billRequests,
    paymentApprovals,
    kitchenItems,
    pendingApprovals,
    reservations: store.reservations,
    loyalty: store.loyalty,
    feedback: store.feedback,
    staffAlerts: store.staffAlerts || [],
    settings: store.settings,
    ordering,
    stats: await getStats(),
    closedBills: store.sessions
      .filter((s) => s.status === "closed" && s.billNumber)
      .slice(0, 30)
      .map((s) => ({
        ...s,
        bill: calculateBill(s, store.settings),
      })),
    unsettledBills: store.sessions
      .filter((s) => s.settlementPending && !s.paidAt && isDineInSession(s))
      .map((s) => ({
        ...s,
        bill: calculateBill(s, store.settings),
        paymentStatus: s.paymentAwaitingApproval ? "submitted" : "unpaid",
        loyaltyPoints: s.loyaltyPhone
          ? store.loyalty.find(
              (l) => l.phone.replace(/\D/g, "") === String(s.loyaltyPhone).replace(/\D/g, ""),
            )?.points ?? 0
          : 0,
      })),
  });
}
