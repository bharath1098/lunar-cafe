import { NextResponse } from "next/server";
import { calculateBill } from "@/lib/bill";
import { getOrderingStatus } from "@/lib/ordering-hours";
import { getStats, getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getStore();
  const ordering = getOrderingStatus(store.settings);
  const openSessions = store.sessions.filter((s) =>
    s.status === "active" || s.status === "billing",
  );

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
          tableId: s.tableId,
          groupCode: s.groupCode,
        })),
    );

  const billRequests = openSessions
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

  const paymentApprovals = openSessions
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

  const pendingApprovals = openSessions
    .filter((s) => s.status === "active")
    .flatMap((s) =>
      s.orders
        .filter((o) => o.status === "pending_approval")
        .map((o) => ({
          ...o,
          sessionId: s.id,
          tableId: s.tableId,
          groupCode: s.groupCode,
        })),
    );

  return NextResponse.json({
    tables: store.tables,
    staff: store.staff.map(({ password: _p, ...s }) => s),
    menu: store.menu,
    activeSessions,
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
  });
}
