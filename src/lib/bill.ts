import type { AppSettings, OrderLine, TableSession } from "./types";

export interface BillBreakdown {
  subtotal: number;
  discountValue: number;
  afterDiscount: number;
  serviceCharge: number;
  taxable: number;
  cgst: number;
  sgst: number;
  taxTotal: number;
  beforeRound: number;
  roundOff: number;
  grandTotal: number;
  totalQty: number;
  loyaltyDiscount: number;
}

/** Billable lines: accepted kitchen flow, not pending/rejected/cancelled */
export function billableOrders(orders: OrderLine[]): OrderLine[] {
  return orders.filter(
    (o) =>
      !["pending_approval", "rejected", "cancelled"].includes(o.status),
  );
}

/**
 * Formula (locked):
 * 1. Subtotal
 * 2. Discount (% and/or ₹) on subtotal
 * 3. Service = 5% × original subtotal (if enabled)
 * 4. GST on (subtotal − discount + service)
 * 5. Loyalty redeem subtracts from total before round (as ₹ discount)
 * 6. Round off to whole rupee
 */
export function calculateBill(
  session: Pick<
    TableSession,
    | "orders"
    | "serviceChargeEnabled"
    | "discountPercent"
    | "discountAmount"
    | "loyaltyPointsRedeemed"
  >,
  settings: AppSettings,
): BillBreakdown {
  const lines = billableOrders(session.orders);
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);

  const percentOff = (subtotal * (session.discountPercent || 0)) / 100;
  const flatOff = session.discountAmount || 0;
  let discountValue = Math.min(subtotal, percentOff + flatOff);

  const loyaltyDiscount =
    (session.loyaltyPointsRedeemed / settings.loyaltyRedeemPoints) *
    settings.loyaltyRedeemValue;
  // Loyalty redeem is applied as extra ₹ discount at close (Owner/Reception)
  discountValue = Math.min(subtotal, discountValue + loyaltyDiscount);

  const afterDiscount = Math.max(0, subtotal - discountValue);
  const serviceCharge = session.serviceChargeEnabled
    ? (subtotal * settings.serviceChargePercent) / 100
    : 0;

  const taxable = afterDiscount + serviceCharge;
  const cgst = (taxable * settings.cgstPercent) / 100;
  const sgst = (taxable * settings.sgstPercent) / 100;
  const taxTotal = cgst + sgst;
  const beforeRound = taxable + taxTotal;
  const grandTotal = Math.round(beforeRound);
  const roundOff = grandTotal - beforeRound;

  return {
    subtotal: round2(subtotal),
    discountValue: round2(discountValue),
    afterDiscount: round2(afterDiscount),
    serviceCharge: round2(serviceCharge),
    taxable: round2(taxable),
    cgst: round2(cgst),
    sgst: round2(sgst),
    taxTotal: round2(taxTotal),
    beforeRound: round2(beforeRound),
    roundOff: round2(roundOff),
    grandTotal,
    totalQty,
    loyaltyDiscount: round2(loyaltyDiscount),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function generateGroupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
