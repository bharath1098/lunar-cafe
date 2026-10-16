import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { CAFE } from "./cafe";
import { billableOrders, generateGroupCode } from "./bill";
import { readStore, writeStore } from "./db";
import { imageForMenuItem } from "./media";
import { SEED_MENU } from "./menu-data";
import { assertAcceptingOrders, getOrderingStatus } from "./ordering-hours";
import type {
  AppSettings,
  CafeStore,
  CafeTable,
  CartLine,
  Feedback,
  GuestVisit,
  LoyaltyMember,
  OrderLine,
  Reservation,
  StaffAlert,
  StaffRole,
  StaffUser,
  TableSection,
  TableSession,
  VisitItem,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const LEGACY_STORE_PATH = path.join(DATA_DIR, "store.json");
const LEGACY_IMPORTED_PATH = path.join(DATA_DIR, "store.json.imported");

const DEFAULT_SETTINGS: AppSettings = {
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  serviceChargePercent: 5,
  loyaltyEarnPerRupees: 100,
  loyaltyPointsPerEarn: 1,
  loyaltyRedeemPoints: 100,
  loyaltyRedeemValue: 50,
  welcomeBonusPoints: 100,
  nextBillNumber: 1,
  nextTokenNumber: 1,
  businessDayStartHour: 11,
  ordersOpen: true,
  allowAfterHours: false,
  hoursStart: CAFE.hoursStart,
  hoursEnd: CAFE.hoursEnd,
};

function buildTables(): CafeTable[] {
  const indoor = Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    return {
      id: `lunar-I${n}`,
      label: `Lunar I${n}`,
      section: "indoor" as const,
      number: n,
      assignedWaiterId: null,
    };
  });
  const outdoor = Array.from({ length: 15 }, (_, i) => {
    const n = i + 1;
    return {
      id: `lunar-O${n}`,
      label: `Lunar O${n}`,
      section: "outdoor" as const,
      number: n,
      assignedWaiterId: null,
    };
  });
  return [...indoor, ...outdoor];
}

function buildStaff(): StaffUser[] {
  return [
    {
      id: "staff-owner",
      name: "Owner",
      email: "owner@lunar.cafe",
      password: "owner123",
      role: "owner",
      active: true,
    },
    {
      id: "staff-reception",
      name: "Reception",
      email: "reception@lunar.cafe",
      password: "reception123",
      role: "reception",
      active: true,
    },
    {
      id: "staff-waiter-1",
      name: "Waiter Asha",
      email: "waiter1@lunar.cafe",
      password: "waiter123",
      role: "waiter",
      active: true,
    },
    {
      id: "staff-waiter-2",
      name: "Waiter Rohan",
      email: "waiter2@lunar.cafe",
      password: "waiter123",
      role: "waiter",
      active: true,
    },
    {
      id: "staff-kitchen",
      name: "Kitchen",
      email: "kitchen@lunar.cafe",
      password: "kitchen123",
      role: "kitchen",
      active: true,
    },
  ];
}

/** Recompute dummy images on every load so new photos apply without resetting the store. */
function withImages(menu: CafeStore["menu"]) {
  return menu.map((m) => ({
    ...m,
    image:
      m.image && !m.image.startsWith("/media/menu/") && !m.image.startsWith("/media/cafe/")
        ? m.image // owner-uploaded custom image
        : imageForMenuItem(m.name, m.category),
  }));
}

function createSeedStore(): CafeStore {
  return {
    cafeId: CAFE.id,
    settings: DEFAULT_SETTINGS,
    tables: buildTables(),
    staff: buildStaff(),
    menu: withImages(SEED_MENU),
    sessions: [],
    reservations: [],
    loyalty: [],
    feedback: [],
    staffAlerts: [],
    auditLog: [],
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __lunarStore: CafeStore | undefined;
}

function importLegacyJson(): CafeStore | null {
  if (!fs.existsSync(LEGACY_STORE_PATH)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(LEGACY_STORE_PATH, "utf8")) as CafeStore;
    if (!parsed?.settings || !Array.isArray(parsed.menu)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function archiveLegacyJson() {
  try {
    if (!fs.existsSync(LEGACY_STORE_PATH)) return;
    if (fs.existsSync(LEGACY_IMPORTED_PATH)) fs.unlinkSync(LEGACY_IMPORTED_PATH);
    fs.renameSync(LEGACY_STORE_PATH, LEGACY_IMPORTED_PATH);
  } catch {
    // SQLite is already the source of truth if the rename fails.
  }
}

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    ordersOpen: settings.ordersOpen !== false,
    allowAfterHours: Boolean(settings.allowAfterHours),
    hoursStart: settings.hoursStart || CAFE.hoursStart,
    hoursEnd: settings.hoursEnd || CAFE.hoursEnd,
  };
}

async function loadStore(): Promise<CafeStore> {
  if (global.__lunarStore) {
    global.__lunarStore.settings = normalizeSettings(global.__lunarStore.settings);
    global.__lunarStore.menu = withImages(global.__lunarStore.menu);
    global.__lunarStore.staffAlerts = global.__lunarStore.staffAlerts || [];
    return global.__lunarStore;
  }

  const existing = await readStore();
  if (existing) {
    existing.settings = normalizeSettings(existing.settings);
    existing.menu = withImages(existing.menu);
    existing.staffAlerts = existing.staffAlerts || [];
    global.__lunarStore = existing;
    return existing;
  }

  const imported = importLegacyJson();
  const seed = imported ?? createSeedStore();
  seed.settings = normalizeSettings(seed.settings);
  seed.menu = withImages(seed.menu);
  seed.staffAlerts = seed.staffAlerts || [];
  await writeStore(seed);
  if (imported) archiveLegacyJson();
  global.__lunarStore = seed;
  return seed;
}

async function persist() {
  if (!global.__lunarStore) return;
  await writeStore(global.__lunarStore);
}

async function audit(actor: string, action: string, detail?: string) {
  const store = await loadStore();
  store.auditLog.unshift({
    id: randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
    detail,
  });
  store.auditLog = store.auditLog.slice(0, 500);
}

function staffByEmail(store: CafeStore, email: string) {
  return store.staff.find((s) => s.email === email);
}

function waiterLabel(store: CafeStore, waiterId: string | null | undefined) {
  if (!waiterId) return "Unassigned";
  return store.staff.find((s) => s.id === waiterId)?.name || "Waiter";
}

function tableShortLabel(table: CafeTable) {
  return table.label || table.id.replace(/^lunar-/, "");
}

function higherRoleIds(store: CafeStore, exceptStaffId?: string) {
  return store.staff
    .filter(
      (s) =>
        s.active &&
        (s.role === "owner" || s.role === "reception") &&
        s.id !== exceptStaffId,
    )
    .map((s) => s.id);
}

function pushStaffAlert(
  store: CafeStore,
  alert: Omit<StaffAlert, "id" | "createdAt" | "readByStaffIds">,
) {
  const recipients = [...new Set(alert.recipientStaffIds)].filter(Boolean);
  if (!recipients.length) return;
  store.staffAlerts = store.staffAlerts || [];
  store.staffAlerts.unshift({
    ...alert,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    recipientStaffIds: recipients,
    readByStaffIds: [],
  });
  store.staffAlerts = store.staffAlerts.slice(0, 200);
}

export async function getStore(): Promise<CafeStore> {
  return await loadStore();
}

export async function resetStore() {
  global.__lunarStore = createSeedStore();
  await persist();
  return global.__lunarStore;
}

export async function getPublicMenu() {
  const store = await loadStore();
  return store.menu
    .filter((m) => m.available)
    .map(({ price: _p, variants, discountPercent, discountPrice, ...rest }) => ({
      ...rest,
      image: rest.image || imageForMenuItem(rest.name, rest.category),
      variants: variants?.map(({ price: _vp, ...v }) => v),
      hasDiscount: Boolean(discountPercent || discountPrice),
    }));
}

export async function getFullMenu() {
  return (await loadStore()).menu;
}

export async function getTables() {
  return (await loadStore()).tables;
}

export async function getActiveSessionForTable(tableId: string) {
  return (await loadStore()).sessions.find(
    (s) => s.tableId === tableId && s.status === "active",
  );
}

export async function getSession(sessionId: string) {
  return (await loadStore()).sessions.find((s) => s.id === sessionId);
}

/** India-only: digits only, drop +91 / 91 / leading 0, keep 10-digit mobile. */
export function normalizePhone(phone: string): string {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

export function requirePhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!/^[6-9]\d{9}$/.test(normalized)) {
    throw new Error("Enter a valid 10-digit mobile number");
  }
  return normalized;
}

export async function joinOrCreateSession(input: {
  tableId: string;
  displayName: string;
  phone: string;
  groupCode?: string;
}) {
  const store = await loadStore();
  const table = store.tables.find((t) => t.id === input.tableId);
  if (!table) throw new Error("Table not found");

  const phone = requirePhone(input.phone);
  const displayName = input.displayName.trim() || "Guest";
  await ensureLoyalty(phone, displayName);

  let session = store.sessions.find(
    (s) => s.tableId === input.tableId && s.status === "active",
  );

  if (!session) {
    assertAcceptingOrders(store.settings);
    const memberId = randomUUID();
    const now = new Date().toISOString();
    session = {
      id: randomUUID(),
      tableId: input.tableId,
      groupCode: generateGroupCode(),
      status: "active",
      hostMemberId: memberId,
      members: [
        {
          id: memberId,
          displayName,
          phone,
          joinedAt: now,
          isHost: true,
        },
      ],
      cart: [],
      orders: [],
      batches: [],
      serviceChargeEnabled: true,
      discountPercent: 0,
      discountAmount: 0,
      loyaltyPhone: phone,
      loyaltyPointsRedeemed: 0,
      createdAt: now,
      updatedAt: now,
    };
    store.sessions.unshift(session);
    await audit("system", "session_created", `${table.id} code ${session.groupCode}`);
    await persist();
    return { session, memberId, created: true as const };
  }

  // Same phone already at this open table — resume without group code.
  const returning = session.members.find(
    (m) => m.phone && normalizePhone(m.phone) === phone,
  );
  if (returning) {
    returning.displayName = displayName;
    returning.phone = phone;
    session.updatedAt = new Date().toISOString();
    await persist();
    return { session, memberId: returning.id, created: false as const };
  }

  if (!input.groupCode || input.groupCode !== session.groupCode) {
    throw new Error("GROUP_CODE_REQUIRED");
  }

  const memberId = randomUUID();
  session.members.push({
    id: memberId,
    displayName,
    phone,
    joinedAt: new Date().toISOString(),
    isHost: false,
  });
  session.updatedAt = new Date().toISOString();
  await persist();
  return { session, memberId, created: false as const };
}

export async function regenerateGroupCode(sessionId: string, actor: string) {
  const session = await mustSession(sessionId);
  session.groupCode = generateGroupCode();
  session.updatedAt = new Date().toISOString();
  await audit(actor, "code_regenerated", session.tableId);
  await persist();
  return session;
}

export async function transferHost(sessionId: string, newHostId: string, actor: string) {
  const session = await mustSession(sessionId);
  const member = session.members.find((m) => m.id === newHostId);
  if (!member) throw new Error("Member not found");
  session.members = session.members.map((m) => ({
    ...m,
    isHost: m.id === newHostId,
  }));
  session.hostMemberId = newHostId;
  session.updatedAt = new Date().toISOString();
  await audit(actor, "host_transfer", newHostId);
  await persist();
  return session;
}

function promoteHostIfNeeded(session: TableSession, leavingId: string) {
  if (session.hostMemberId !== leavingId) return;
  const remaining = session.members
    .filter((m) => m.id !== leavingId)
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  if (remaining[0]) {
    session.hostMemberId = remaining[0].id;
    session.members = session.members.map((m) => ({
      ...m,
      isHost: m.id === remaining[0].id,
    }));
  }
}

export async function leaveSession(sessionId: string, memberId: string) {
  const session = await mustSession(sessionId);
  promoteHostIfNeeded(session, memberId);
  session.members = session.members.filter((m) => m.id !== memberId);
  session.updatedAt = new Date().toISOString();
  if (session.members.length === 0 && session.orders.length === 0) {
    session.status = "closed";
  }
  await persist();
  return session;
}

export async function updateCart(
  sessionId: string,
  memberId: string,
  cart: CartLine[],
) {
  const session = await mustSession(sessionId);
  if (session.status === "billing" || session.billGeneratedAt) {
    throw new Error("Bill already generated — cart is closed");
  }
  if (!session.members.some((m) => m.id === memberId)) {
    throw new Error("Not a session member");
  }
  session.cart = cart;
  session.updatedAt = new Date().toISOString();
  await persist();
  return session;
}

export type StaffOrderDraft = {
  menuItemId: string;
  variantId?: string;
  choices?: Record<string, string>;
  notes?: string;
  qty: number;
};

/** Waiter (or floor staff) writes the order at the table. It skips guest approval and goes straight to the kitchen. */
export async function staffTakeOrder(
  tableId: string,
  drafts: StaffOrderDraft[],
  actor: string,
  guest: { name: string; phone: string },
) {
  if (!drafts.length) throw new Error("Add at least one item");
  const store = await loadStore();
  assertAcceptingOrders(store.settings);
  const table = store.tables.find((t) => t.id === tableId);
  if (!table) throw new Error("Table not found");

  const phone = requirePhone(guest.phone);
  const guestName = guest.name.trim() || "Guest";
  await ensureLoyalty(phone, guestName);

  const staffUser = staffByEmail(store, actor);
  const assignedWaiterId = table.assignedWaiterId;
  const assignedWaiterName = assignedWaiterId ? waiterLabel(store, assignedWaiterId) : undefined;
  const isCoverOrder = Boolean(staffUser && assignedWaiterId && staffUser.id !== assignedWaiterId);
  const now = new Date().toISOString();

  const prepared = drafts.map((draft) => {
    const menu = store.menu.find((m) => m.id === draft.menuItemId);
    if (!menu || !menu.available) throw new Error("That item is not available");
    const qty = Math.min(99, Math.max(1, Math.floor(Number(draft.qty) || 1)));
    const variant = draft.variantId
      ? menu.variants?.find((v) => v.id === draft.variantId)
      : undefined;
    if (menu.variants?.length && !variant) {
      throw new Error(`Choose a type for ${menu.name}`);
    }
    const choices: Record<string, string> = {};
    for (const choice of menu.choices || []) {
      const picked = draft.choices?.[choice.id];
      choices[choice.id] =
        picked && choice.options.includes(picked) ? picked : choice.options[0];
    }
    return {
      menuItemId: menu.id,
      name: menu.name,
      variantLabel: variant?.label,
      choices: Object.keys(choices).length ? choices : undefined,
      notes: draft.notes?.trim() || undefined,
      unitPrice: variant?.price ?? menu.price,
      qty,
    };
  });

  let session = store.sessions.find(
    (s) => s.tableId === tableId && s.status === "active",
  );
  let memberId: string;

  if (!session) {
    memberId = randomUUID();
    session = {
      id: randomUUID(),
      tableId,
      groupCode: generateGroupCode(),
      status: "active",
      hostMemberId: memberId,
      members: [
        {
          id: memberId,
          displayName: guestName,
          phone,
          joinedAt: now,
          isHost: true,
        },
      ],
      cart: [],
      orders: [],
      batches: [],
      serviceChargeEnabled: true,
      discountPercent: 0,
      discountAmount: 0,
      loyaltyPhone: phone,
      loyaltyPointsRedeemed: 0,
      createdAt: now,
      updatedAt: now,
    };
    store.sessions.unshift(session);
    await audit(
      actor,
      "session_created",
      `${table.id} opened for ${guestName} by ${staffUser?.name || actor}`,
    );
  } else {
    const existing =
      session.members.find((m) => m.phone && normalizePhone(m.phone) === phone) ||
      session.members.find((m) => m.displayName === guestName);
    if (existing) {
      memberId = existing.id;
      existing.phone = phone;
      existing.displayName = guestName;
    } else {
      memberId = randomUUID();
      session.members.push({
        id: memberId,
        displayName: guestName,
        phone,
        joinedAt: now,
        isHost: false,
      });
    }
    if (!session.loyaltyPhone) session.loyaltyPhone = phone;
  }

  if (staffUser?.role === "waiter" && !table.assignedWaiterId) {
    table.assignedWaiterId = staffUser.id;
  }

  const tokenNumber = store.settings.nextTokenNumber++;
  const newItems: OrderLine[] = prepared.map((line) => ({
    id: randomUUID(),
    ...line,
    status: "queued" as const,
    tokenNumber,
    orderedByMemberId: memberId,
    takenByStaffId: staffUser?.id,
    takenByStaffName: staffUser?.name || actor,
    assignedWaiterId: assignedWaiterId || undefined,
    assignedWaiterName,
    isCoverOrder: isCoverOrder || undefined,
    createdAt: now,
    updatedAt: now,
  }));

  session.orders.push(...newItems);
  session.batches.push({
    id: randomUUID(),
    sessionId: session.id,
    tokenNumber,
    createdAt: now,
    itemIds: newItems.map((i) => i.id),
  });
  session.updatedAt = now;
  await audit(
    actor,
    isCoverOrder ? "cover_order" : "waiter_order",
    `${tableId} token ${tokenNumber}${isCoverOrder ? ` covering ${assignedWaiterName}` : ""}`,
  );

  if (isCoverOrder && assignedWaiterId && staffUser) {
    const label = tableShortLabel(table);
    const recipients = new Set(higherRoleIds(store, staffUser.id));
    recipients.add(assignedWaiterId);
    recipients.delete(staffUser.id);
    pushStaffAlert(store, {
      type: "cover_order",
      tableId: table.id,
      tableLabel: label,
      actorStaffId: staffUser.id,
      actorName: staffUser.name,
      recipientStaffIds: [...recipients],
      message: `${staffUser.name} sent token #${tokenNumber} on Table ${label} (assigned to ${assignedWaiterName}). Customisations on that ticket are under ${staffUser.name}.`,
    });
  }

  await persist();
  return { session, tokenNumber, items: newItems };
}

export async function placeOrder(sessionId: string, memberId: string) {
  const session = await mustSession(sessionId);
  if (session.status === "billing" || session.billGeneratedAt) {
    throw new Error("Bill already generated — new orders are closed");
  }
  if (!session.members.some((m) => m.id === memberId)) {
    throw new Error("Not a session member");
  }
  if (session.cart.length === 0) throw new Error("Cart is empty");

  const store = await loadStore();
  assertAcceptingOrders(store.settings);
  const tokenNumber = store.settings.nextTokenNumber++;
  const now = new Date().toISOString();
  const newItems: OrderLine[] = session.cart.map((c) => ({
    id: randomUUID(),
    menuItemId: c.menuItemId,
    name: c.name,
    variantLabel: c.variantLabel,
    choices: c.choices,
    notes: c.notes,
    unitPrice: c.unitPrice,
    qty: c.qty,
    status: "pending_approval",
    tokenNumber,
    orderedByMemberId: memberId,
    createdAt: now,
    updatedAt: now,
  }));

  session.orders.push(...newItems);
  session.batches.push({
    id: randomUUID(),
    sessionId,
    tokenNumber,
    createdAt: now,
    itemIds: newItems.map((i) => i.id),
  });
  session.cart = [];
  session.updatedAt = now;
  await audit(memberId, "order_placed", `token ${tokenNumber}`);
  await persist();
  return { session, tokenNumber, items: newItems };
}

export async function requestBill(sessionId: string, memberId: string) {
  const session = await mustSession(sessionId);
  const member = session.members.find((m) => m.id === memberId);
  if (!member) throw new Error("Not a session member");
  if (session.billRequestedAt) {
    return {
      session,
      cancelledPending: 0,
      billedCount: session.orders.filter(
        (o) => !["pending_approval", "rejected", "cancelled"].includes(o.status),
      ).length,
    };
  }

  const now = new Date().toISOString();
  // Unaccepted items stay off the bill. Accepted kitchen orders stay on it,
  // even if they are not served yet.
  let cancelledPending = 0;
  session.orders = session.orders.map((o) => {
    if (o.status !== "pending_approval") return o;
    cancelledPending += 1;
    return {
      ...o,
      status: "cancelled" as const,
      rejectReason: "Left off the bill — not accepted before bill request",
      updatedAt: now,
    };
  });

  const billedCount = session.orders.filter(
    (o) => !["pending_approval", "rejected", "cancelled"].includes(o.status),
  ).length;

  session.billRequestedAt = now;
  session.billRequestedByMemberId = member.id;
  session.billRequestedByName = member.displayName;
  session.updatedAt = now;
  await audit(
    member.displayName,
    "bill_requested",
    `${session.tableId}; billed ${billedCount}; left ${cancelledPending} unaccepted`,
  );
  await persist();
  return { session, cancelledPending, billedCount };
}

export async function approveOrderItems(
  sessionId: string,
  itemIds: string[],
  actor: string,
) {
  const session = await mustSession(sessionId);
  if (session.billRequestedAt) {
    throw new Error("Bill already requested — unaccepted items cannot be added");
  }
  const now = new Date().toISOString();
  session.orders = session.orders.map((o) =>
    itemIds.includes(o.id) && o.status === "pending_approval"
      ? { ...o, status: "queued" as const, updatedAt: now }
      : o,
  );
  session.updatedAt = now;
  await audit(actor, "order_approved", itemIds.join(","));
  await persist();
  return session;
}

export async function rejectOrderItem(
  sessionId: string,
  itemId: string,
  reason: string,
  actor: string,
) {
  const session = await mustSession(sessionId);
  const now = new Date().toISOString();
  session.orders = session.orders.map((o) =>
    o.id === itemId
      ? {
          ...o,
          status: "rejected" as const,
          rejectReason: reason,
          updatedAt: now,
        }
      : o,
  );
  session.updatedAt = now;
  await audit(actor, "order_rejected", reason);
  await persist();
  return session;
}

export async function setKitchenStatus(
  sessionId: string,
  itemIds: string[],
  status: "preparing" | "ready" | "served",
  actor: string,
) {
  const session = await mustSession(sessionId);
  const now = new Date().toISOString();
  session.orders = session.orders.map((o) =>
    itemIds.includes(o.id) ? { ...o, status, updatedAt: now } : o,
  );
  session.updatedAt = now;
  await audit(actor, `kitchen_${status}`, itemIds.join(","));
  await persist();
  return session;
}

export async function getCafeOrderingStatus() {
  const store = await loadStore();
  return getOrderingStatus(store.settings);
}

/** Owner / reception: open or close ordering, and optionally stay open after hours. */
export async function setCafeOrderingControls(
  patch: {
    ordersOpen?: boolean;
    allowAfterHours?: boolean;
    hoursStart?: string;
    hoursEnd?: string;
  },
  actor: string,
) {
  const store = await loadStore();
  const staff = store.staff.find(
    (s) => s.email.toLowerCase() === String(actor || "").toLowerCase() && s.active,
  );
  if (!staff || (staff.role !== "owner" && staff.role !== "reception")) {
    throw new Error("Only owner or reception can open or close ordering");
  }
  if (patch.ordersOpen !== undefined) store.settings.ordersOpen = Boolean(patch.ordersOpen);
  if (patch.allowAfterHours !== undefined) {
    store.settings.allowAfterHours = Boolean(patch.allowAfterHours);
  }
  if (patch.hoursStart) {
    if (!/^\d{1,2}:\d{2}$/.test(patch.hoursStart)) throw new Error("Invalid open time");
    store.settings.hoursStart = patch.hoursStart;
    store.settings.businessDayStartHour = Number(patch.hoursStart.split(":")[0]) || 11;
  }
  if (patch.hoursEnd) {
    if (!/^\d{1,2}:\d{2}$/.test(patch.hoursEnd)) throw new Error("Invalid close time");
    store.settings.hoursEnd = patch.hoursEnd;
  }
  await audit(
    actor,
    "ordering_controls",
    JSON.stringify({
      ordersOpen: store.settings.ordersOpen,
      allowAfterHours: store.settings.allowAfterHours,
      hoursStart: store.settings.hoursStart,
      hoursEnd: store.settings.hoursEnd,
    }),
  );
  await persist();
  return getOrderingStatus(store.settings);
}

export async function updateBilling(
  sessionId: string,
  patch: Partial<
    Pick<
      TableSession,
      | "serviceChargeEnabled"
      | "discountPercent"
      | "discountAmount"
      | "loyaltyPhone"
      | "loyaltyPointsRedeemed"
    >
  >,
  actor: string,
) {
  const session = await mustSession(sessionId);
  if (session.billGeneratedAt) {
    throw new Error("Bill already generated — adjustments are locked");
  }
  if (patch.loyaltyPointsRedeemed != null) {
    const points = Math.max(0, Math.floor(Number(patch.loyaltyPointsRedeemed) || 0));
    const phone = patch.loyaltyPhone ?? session.loyaltyPhone;
    if (points > 0 && phone) {
      const member = await ensureLoyalty(phone, "Guest");
      if (points > member.points) {
        throw new Error(`Only ${member.points} loyalty points available`);
      }
    }
    patch.loyaltyPointsRedeemed = points;
  }
  Object.assign(session, patch);
  session.updatedAt = new Date().toISOString();
  await audit(actor, "billing_updated", JSON.stringify(patch));
  await persist();
  return session;
}

export async function generateBill(sessionId: string, actor: string) {
  const store = await loadStore();
  const session = await mustSession(sessionId);
  if (session.billGeneratedAt && session.billNumber) {
    return session;
  }
  if (billableOrders(session.orders).length === 0) {
    throw new Error("No items to bill yet");
  }
  const now = new Date().toISOString();
  const staffUser = staffByEmail(store, actor);
  if (!session.billRequestedAt) {
    session.billRequestedAt = now;
    session.billRequestedByName = staffUser?.name || actor;
  }
  session.status = "billing";
  session.billGeneratedAt = now;
  session.billNumber = store.settings.nextBillNumber++;
  session.cart = [];
  session.updatedAt = now;
  await audit(actor, "bill_generated", `bill #${session.billNumber}`);
  await persist();
  return session;
}

export async function submitGuestPayment(sessionId: string, memberId: string) {
  const session = await mustSession(sessionId);
  if (!session.members.some((m) => m.id === memberId)) {
    throw new Error("Not a session member");
  }
  if (!session.billGeneratedAt || !session.billNumber) {
    throw new Error("Bill has not been generated yet");
  }
  if (session.paidAt) throw new Error("Bill already paid");
  if (session.paymentAwaitingApproval) return session;

  const now = new Date().toISOString();
  session.paymentMethod = "upi";
  session.paymentSubmittedAt = now;
  session.paymentAwaitingApproval = true;
  session.updatedAt = now;
  const who = session.members.find((m) => m.id === memberId)?.displayName || "Guest";
  await audit(who, "payment_submitted", `bill #${session.billNumber}`);
  await persist();
  return session;
}

export async function approveGuestPayment(sessionId: string, actor: string, grandTotal: number) {
  const session = await mustSession(sessionId);
  if (!session.paymentAwaitingApproval || !session.paymentSubmittedAt) {
    throw new Error("No guest payment waiting for approval");
  }
  return await finalizePaidSession(session, session.paymentMethod || "upi", actor, grandTotal);
}

export async function closeAndPay(
  sessionId: string,
  paymentMethod: "cash" | "upi" | "card",
  actor: string,
  grandTotal: number,
) {
  const session = await mustSession(sessionId);
  if (!session.billGeneratedAt) {
    // Staff can still settle without guest flow by generating first
    const store = await loadStore();
    session.billGeneratedAt = new Date().toISOString();
    if (!session.billNumber) session.billNumber = store.settings.nextBillNumber++;
    session.status = "billing";
  }
  return await finalizePaidSession(session, paymentMethod, actor, grandTotal);
}

async function finalizePaidSession(
  session: TableSession,
  paymentMethod: "cash" | "upi" | "card",
  actor: string,
  grandTotal: number,
) {
  const store = await loadStore();
  const now = new Date().toISOString();
  session.status = "closed";
  session.paidAt = now;
  session.paymentMethod = paymentMethod;
  session.paymentAwaitingApproval = false;
  if (!session.billNumber) session.billNumber = store.settings.nextBillNumber++;
  if (!session.billGeneratedAt) session.billGeneratedAt = now;
  session.updatedAt = now;

  if (session.loyaltyPhone) {
    const member = await ensureLoyalty(session.loyaltyPhone, "Guest");
    const earnUnits = Math.floor(
      grandTotal / store.settings.loyaltyEarnPerRupees,
    );
    member.points += earnUnits * store.settings.loyaltyPointsPerEarn;
    if (session.loyaltyPointsRedeemed > 0) {
      member.points = Math.max(
        0,
        member.points - session.loyaltyPointsRedeemed,
      );
    }
    member.updatedAt = now;
  }

  await audit(actor, "bill_paid", `bill #${session.billNumber}`);
  await persist();
  return session;
}

export async function forceCloseSession(sessionId: string, actor: string, reason: string) {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    throw new Error("Enter a reason (at least 3 characters) before force closing");
  }
  const session = await mustSession(sessionId);
  const now = new Date().toISOString();
  session.status = "closed";
  session.forceClosedAt = now;
  session.forceCloseReason = trimmed;
  session.forceClosedBy = actor;
  session.updatedAt = now;
  await audit(actor, "force_close", `${session.tableId}: ${trimmed}`);
  await persist();
  return session;
}

export async function assignWaiter(tableId: string, waiterId: string | null, actor: string) {
  const store = await loadStore();
  const table = store.tables.find((t) => t.id === tableId);
  if (!table) throw new Error("Table not found");
  const previousId = table.assignedWaiterId;
  if (previousId === waiterId) return table;

  const actorUser = staffByEmail(store, actor);
  const actorName = actorUser?.name || actor;
  const fromName = waiterLabel(store, previousId);
  const toName = waiterLabel(store, waiterId);
  const label = tableShortLabel(table);

  table.assignedWaiterId = waiterId;
  await audit(actor, "assign_waiter", `${tableId}: ${fromName} -> ${toName}`);

  const recipients = new Set(higherRoleIds(store, actorUser?.id));
  if (previousId && previousId !== actorUser?.id) recipients.add(previousId);
  if (waiterId && waiterId !== actorUser?.id) recipients.add(waiterId);
  pushStaffAlert(store, {
    type: "waiter_reassigned",
    tableId: table.id,
    tableLabel: label,
    actorStaffId: actorUser?.id || "",
    actorName,
    recipientStaffIds: [...recipients],
    message: `Table ${label} waiter changed: ${fromName} → ${toName} (by ${actorName}).`,
  });

  await persist();
  return table;
}

export async function acknowledgeStaffAlert(alertId: string, actor: string) {
  const store = await loadStore();
  const user = staffByEmail(store, actor);
  if (!user) throw new Error("Staff not found");
  const alert = (store.staffAlerts || []).find((a) => a.id === alertId);
  if (!alert) return { ok: true as const };
  if (!alert.readByStaffIds.includes(user.id)) alert.readByStaffIds.push(user.id);
  await persist();
  return { ok: true as const };
}

export async function acknowledgeAllStaffAlerts(actor: string) {
  const store = await loadStore();
  const user = staffByEmail(store, actor);
  if (!user) throw new Error("Staff not found");
  for (const alert of store.staffAlerts || []) {
    if (
      alert.recipientStaffIds.includes(user.id) &&
      !alert.readByStaffIds.includes(user.id)
    ) {
      alert.readByStaffIds.push(user.id);
    }
  }
  await persist();
  return { ok: true as const };
}

export async function upsertMenuItem(item: CafeStore["menu"][number], actor: string) {
  const store = await loadStore();
  const idx = store.menu.findIndex((m) => m.id === item.id);
  if (idx >= 0) store.menu[idx] = item;
  else store.menu.push(item);
  await audit(actor, "menu_upsert", item.name);
  await persist();
  return item;
}

export async function deleteMenuItem(id: string, actor: string) {
  const store = await loadStore();
  store.menu = store.menu.filter((m) => m.id !== id);
  await audit(actor, "menu_delete", id);
  await persist();
}

export async function createReservation(
  data: Omit<Reservation, "id" | "status" | "createdAt">,
) {
  const store = await loadStore();
  const reservation: Reservation = {
    ...data,
    phone: requirePhone(data.phone),
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.reservations.unshift(reservation);
  await persist();
  return reservation;
}

export async function updateReservation(
  id: string,
  patch: Partial<Reservation>,
  actor: string,
) {
  const store = await loadStore();
  const r = store.reservations.find((x) => x.id === id);
  if (!r) throw new Error("Reservation not found");
  Object.assign(r, patch);
  await audit(actor, "reservation_update", id);
  await persist();
  return r;
}

export async function ensureLoyalty(phone: string, name: string): Promise<LoyaltyMember> {
  const store = await loadStore();
  const normalized = normalizePhone(phone);
  let member = store.loyalty.find((l) => normalizePhone(l.phone) === normalized);
  if (!member) {
    const now = new Date().toISOString();
    member = {
      phone: normalized,
      name: name.trim() || "Guest",
      points: store.settings.welcomeBonusPoints,
      createdAt: now,
      updatedAt: now,
    };
    store.loyalty.push(member);
    await persist();
  } else if (name.trim() && member.name !== name.trim()) {
    member.name = name.trim();
    member.updatedAt = new Date().toISOString();
    await persist();
  }
  return member;
}

export type { GuestVisit, VisitItem };

function sessionMatchesPhone(session: TableSession, phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  if (session.loyaltyPhone && normalizePhone(session.loyaltyPhone) === normalized) {
    return true;
  }
  const host = session.members.find((m) => m.id === session.hostMemberId);
  return !!(host?.phone && normalizePhone(host.phone) === normalized);
}

/** Past visits for a guest phone (closed / billed sessions), newest first. */
export async function getVisitsByPhone(
  phone: string,
  excludeSessionId?: string,
): Promise<GuestVisit[]> {
  const store = await loadStore();
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) return [];

  const visits: GuestVisit[] = [];
  for (const session of store.sessions) {
    if (excludeSessionId && session.id === excludeSessionId) continue;
    if (session.status === "active") continue;
    if (!sessionMatchesPhone(session, normalized)) continue;

    const items: VisitItem[] = session.orders
      .filter((o) => !["pending_approval", "rejected", "cancelled"].includes(o.status))
      .map((o) => ({
        menuItemId: o.menuItemId,
        name: o.name,
        variantLabel: o.variantLabel,
        choices: o.choices,
        notes: o.notes,
        unitPrice: o.unitPrice,
        qty: o.qty,
      }));
    if (!items.length) continue;

    const visitedAt = session.paidAt || session.updatedAt || session.createdAt;
    const table = store.tables.find((t) => t.id === session.tableId);
    visits.push({
      sessionId: session.id,
      date: visitedAt.slice(0, 10),
      visitedAt,
      tableId: session.tableId,
      tableLabel: table?.label || session.tableId,
      itemCount: items.reduce((sum, i) => sum + i.qty, 0),
      items,
    });
  }

  return visits.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
}

/** Resolve prior visit lines against today's menu prices / availability for reorder. */
export async function buildReorderCartLines(
  items: VisitItem[],
  memberId: string,
): Promise<{ lines: CartLine[]; skipped: string[] }> {
  const store = await loadStore();
  const lines: CartLine[] = [];
  const skipped: string[] = [];

  for (const item of items) {
    const menu = store.menu.find((m) => m.id === item.menuItemId);
    if (!menu || !menu.available) {
      skipped.push(item.name);
      continue;
    }
    let unitPrice = menu.price;
    let variantLabel = item.variantLabel;
    if (menu.variants?.length) {
      const variant =
        menu.variants.find((v) => v.label === item.variantLabel) || menu.variants[0];
      unitPrice = variant.price;
      variantLabel = variant.label;
    }
    lines.push({
      id: randomUUID(),
      menuItemId: menu.id,
      name: menu.name,
      variantLabel,
      choices: item.choices,
      notes: item.notes,
      unitPrice,
      qty: item.qty,
      addedByMemberId: memberId,
    });
  }

  return { lines, skipped };
}

export async function submitFeedback(
  data: Omit<Feedback, "id" | "status" | "createdAt">,
) {
  const store = await loadStore();
  const fb: Feedback = {
    ...data,
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.feedback.unshift(fb);
  await persist();
  return fb;
}

export async function moderateFeedback(
  id: string,
  status: "published" | "removed" | "pending",
  actor: string,
) {
  const store = await loadStore();
  const fb = store.feedback.find((f) => f.id === id);
  if (!fb) throw new Error("Feedback not found");
  fb.status = status;
  await audit(actor, "feedback_moderate", `${id} ${status}`);
  await persist();
  return fb;
}

export async function loginStaff(email: string, password: string) {
  const store = await loadStore();
  const user = store.staff.find(
    (s) => s.email === email && s.password === password && s.active,
  );
  if (!user) throw new Error("Invalid credentials");
  const { password: _p, ...safe } = user;
  return safe;
}

export async function createStaffUser(
  input: {
    name: string;
    email: string;
    password: string;
    role: StaffRole;
  },
  actor: string,
) {
  const store = await loadStore();
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const role = input.role;

  if (!name) throw new Error("Name is required");
  if (!email || !email.includes("@")) throw new Error("Valid email is required");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  if (!["waiter", "reception", "kitchen"].includes(role)) {
    throw new Error("Role must be waiter, reception, or kitchen");
  }
  if (store.staff.some((s) => s.email.toLowerCase() === email)) {
    throw new Error("That email is already in use");
  }

  const user: StaffUser = {
    id: `staff-${role}-${randomUUID().slice(0, 8)}`,
    name,
    email,
    password,
    role,
    active: true,
  };
  store.staff.push(user);
  await audit(actor, "staff_created", `${role} ${email}`);
  await persist();
  const { password: _p, ...safe } = user;
  return safe;
}

export async function setStaffActive(staffId: string, active: boolean, actor: string) {
  const store = await loadStore();
  const user = store.staff.find((s) => s.id === staffId);
  if (!user) throw new Error("Staff not found");
  if (user.role === "owner") throw new Error("Owner account cannot be deactivated here");
  user.active = active;
  if (!active) {
    for (const table of store.tables) {
      if (table.assignedWaiterId === staffId) table.assignedWaiterId = null;
    }
  }
  await audit(actor, active ? "staff_activated" : "staff_deactivated", user.email);
  await persist();
  const { password: _p, ...safe } = user;
  return safe;
}

export async function updateStaffUser(
  staffId: string,
  patch: Partial<{
    name: string;
    email: string;
    password: string;
    role: StaffRole;
    active: boolean;
  }>,
  actor: string,
) {
  const store = await loadStore();
  const user = store.staff.find((s) => s.id === staffId);
  if (!user) throw new Error("Staff not found");
  if (user.role === "owner") throw new Error("Owner account cannot be edited here");

  if (patch.name != null) {
    const name = String(patch.name).trim();
    if (!name) throw new Error("Name is required");
    user.name = name;
  }
  if (patch.email != null) {
    const email = String(patch.email).trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("Valid email is required");
    if (store.staff.some((s) => s.id !== staffId && s.email.toLowerCase() === email)) {
      throw new Error("That email is already in use");
    }
    user.email = email;
  }
  if (patch.password != null && String(patch.password).length > 0) {
    if (String(patch.password).length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    user.password = String(patch.password);
  }
  if (patch.role != null) {
    if (!["waiter", "reception", "kitchen"].includes(patch.role)) {
      throw new Error("Role must be waiter, reception, or kitchen");
    }
    user.role = patch.role;
  }
  if (patch.active != null) {
    user.active = Boolean(patch.active);
    if (!user.active) {
      for (const table of store.tables) {
        if (table.assignedWaiterId === staffId) table.assignedWaiterId = null;
      }
    }
  }

  await audit(actor, "staff_updated", user.email);
  await persist();
  const { password: _p, ...safe } = user;
  return safe;
}

export async function deleteStaffUser(staffId: string, actor: string) {
  const store = await loadStore();
  const idx = store.staff.findIndex((s) => s.id === staffId);
  if (idx < 0) throw new Error("Staff not found");
  const user = store.staff[idx];
  if (user.role === "owner") throw new Error("Owner account cannot be deleted");
  for (const table of store.tables) {
    if (table.assignedWaiterId === staffId) table.assignedWaiterId = null;
  }
  store.staff.splice(idx, 1);
  await audit(actor, "staff_deleted", user.email);
  await persist();
  return { ok: true };
}

function tableIdFor(section: TableSection, number: number) {
  const prefix = section === "indoor" ? "I" : "O";
  return `lunar-${prefix}${number}`;
}

function tableLabelFor(section: TableSection, number: number) {
  const prefix = section === "indoor" ? "I" : "O";
  return `Lunar ${prefix}${number}`;
}

export async function createTable(
  input: { section: TableSection; number?: number; label?: string },
  actor: string,
) {
  const store = await loadStore();
  const section = input.section === "indoor" ? "indoor" : "outdoor";
  const used = new Set(
    store.tables.filter((t) => t.section === section).map((t) => t.number),
  );
  let number = input.number != null ? Math.floor(Number(input.number)) : 1;
  if (!Number.isFinite(number) || number < 1) number = 1;
  if (input.number == null) {
    while (used.has(number)) number += 1;
  } else if (used.has(number)) {
    throw new Error(`Table ${section === "indoor" ? "I" : "O"}${number} already exists`);
  }

  const id = tableIdFor(section, number);
  if (store.tables.some((t) => t.id === id)) {
    throw new Error("Table already exists");
  }
  const table: CafeTable = {
    id,
    label: String(input.label || "").trim() || tableLabelFor(section, number),
    section,
    number,
    assignedWaiterId: null,
  };
  store.tables.push(table);
  store.tables.sort((a, b) => {
    if (a.section !== b.section) return a.section === "indoor" ? -1 : 1;
    return a.number - b.number;
  });
  await audit(actor, "table_created", table.id);
  await persist();
  return table;
}

export async function updateTable(
  tableId: string,
  patch: Partial<{ label: string; section: TableSection; number: number; assignedWaiterId: string | null }>,
  actor: string,
) {
  const store = await loadStore();
  const table = store.tables.find((t) => t.id === tableId);
  if (!table) throw new Error("Table not found");

  const open = store.sessions.some(
    (s) => s.tableId === tableId && (s.status === "active" || s.status === "billing"),
  );

  if (patch.section != null || patch.number != null) {
    if (open) throw new Error("Cannot move a table with an open session");
    const section = patch.section ?? table.section;
    const number =
      patch.number != null ? Math.floor(Number(patch.number)) : table.number;
    if (!Number.isFinite(number) || number < 1) throw new Error("Invalid table number");
    const nextId = tableIdFor(section, number);
    if (nextId !== table.id && store.tables.some((t) => t.id === nextId)) {
      throw new Error("Another table already uses that section/number");
    }
    table.section = section;
    table.number = number;
    table.id = nextId;
    if (patch.label == null) table.label = tableLabelFor(section, number);
  }

  if (patch.label != null) {
    const label = String(patch.label).trim();
    if (!label) throw new Error("Label is required");
    table.label = label;
  }
  if (patch.assignedWaiterId !== undefined) {
    table.assignedWaiterId = patch.assignedWaiterId;
  }

  store.tables.sort((a, b) => {
    if (a.section !== b.section) return a.section === "indoor" ? -1 : 1;
    return a.number - b.number;
  });
  await audit(actor, "table_updated", table.id);
  await persist();
  return table;
}

export async function deleteTable(tableId: string, actor: string) {
  const store = await loadStore();
  const idx = store.tables.findIndex((t) => t.id === tableId);
  if (idx < 0) throw new Error("Table not found");
  const open = store.sessions.some(
    (s) => s.tableId === tableId && (s.status === "active" || s.status === "billing"),
  );
  if (open) throw new Error("Cannot delete a table with an open session");
  const [removed] = store.tables.splice(idx, 1);
  await audit(actor, "table_deleted", removed.id);
  await persist();
  return { ok: true };
}

/** Drop the in-process cache so the next loadStore() re-reads from SQLite/Turso. */
export function invalidateStoreCache() {
  global.__lunarStore = undefined;
}

/** Wipe sessions, bills, loyalty, feedback, reservations — keep menu / tables / staff. */
export async function clearTransactionalData(actor: string) {
  const store = await loadStore();
  store.sessions = [];
  store.reservations = [];
  store.loyalty = [];
  store.feedback = [];
  store.staffAlerts = [];
  store.auditLog = [];
  store.settings.nextBillNumber = 1;
  store.settings.nextTokenNumber = 1;
  for (const table of store.tables) table.assignedWaiterId = null;
  await audit(actor, "transactional_data_cleared", "sessions/loyalty/feedback wiped");
  await persist();
  return { ok: true as const };
}

export async function getStats() {
  const store = await loadStore();
  const paid = store.sessions.filter((s) => s.paidAt && s.billNumber);
  const byHour: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> =
    {};

  for (const s of paid) {
    const d = new Date(s.paidAt!);
    const day = d.toISOString().slice(0, 10);
    const hour = `${d.getHours()}:00`;
    const lines = s.orders.filter(
      (o) => !["pending_approval", "rejected", "cancelled"].includes(o.status),
    );
    const sub = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
    byDay[day] = (byDay[day] || 0) + sub;
    byHour[hour] = (byHour[hour] || 0) + sub;
    for (const l of lines) {
      if (!itemCounts[l.menuItemId]) {
        itemCounts[l.menuItemId] = { name: l.name, qty: 0, revenue: 0 };
      }
      itemCounts[l.menuItemId].qty += l.qty;
      itemCounts[l.menuItemId].revenue += l.unitPrice * l.qty;
    }
  }

  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const peakDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0] || null;
  const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0] || null;

  const openTables = store.sessions.filter(
    (s) => s.status === "active" || s.status === "billing",
  ).length;
  const pendingApprovals = store.sessions.reduce(
    (n, s) =>
      n + s.orders.filter((o) => o.status === "pending_approval").length,
    0,
  );

  return {
    openTables,
    pendingApprovals,
    paidBills: paid.length,
    byHour,
    byDay,
    topItems,
    peakDay,
    peakHour,
    publishedFeedback: store.feedback.filter((f) => f.status === "published")
      .length,
    pendingFeedback: store.feedback.filter((f) => f.status === "pending")
      .length,
  };
}

async function mustSession(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session || session.status === "closed") {
    throw new Error("Session not active");
  }
  return session;
}
