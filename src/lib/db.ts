import fs from "fs";
import path from "path";
import { createClient, type Client, type InStatement } from "@libsql/client";
import { CAFE } from "./cafe";
import type {
  AppSettings,
  CafeStore,
  CafeTable,
  CartLine,
  Feedback,
  LoyaltyMember,
  MenuItem,
  OrderBatch,
  OrderLine,
  Reservation,
  SessionMember,
  StaffAlert,
  StaffUser,
  TableSession,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "lunar.db");

type SqlValue = string | number | bigint | null;

declare global {
  // eslint-disable-next-line no-var
  var __lunarDb: Client | undefined;
  // eslint-disable-next-line no-var
  var __lunarDbReady: Promise<Client> | undefined;
  // eslint-disable-next-line no-var
  var __lunarSchemaVersion: number | undefined;
}

const SCHEMA_VERSION = 2;

/** True when TURSO_DATABASE_URL points at a remote Turso DB (Vercel / prod). */
export function isRemoteTurso() {
  return Boolean(process.env.TURSO_DATABASE_URL?.startsWith("libsql://") ||
    process.env.TURSO_DATABASE_URL?.startsWith("https://"));
}

function databaseUrl() {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  return `file:${DB_PATH.replace(/\\/g, "/")}`;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cafe_id TEXT NOT NULL,
  cgst_percent REAL NOT NULL,
  sgst_percent REAL NOT NULL,
  service_charge_percent REAL NOT NULL,
  loyalty_earn_per_rupees INTEGER NOT NULL,
  loyalty_points_per_earn INTEGER NOT NULL,
  loyalty_redeem_points INTEGER NOT NULL,
  loyalty_redeem_value REAL NOT NULL,
  welcome_bonus_points INTEGER NOT NULL,
  next_bill_number INTEGER NOT NULL,
  next_token_number INTEGER NOT NULL,
  business_day_start_hour INTEGER NOT NULL,
  orders_open INTEGER NOT NULL DEFAULT 1,
  allow_after_hours INTEGER NOT NULL DEFAULT 0,
  hours_start TEXT NOT NULL DEFAULT '11:00',
  hours_end TEXT NOT NULL DEFAULT '23:30'
);

CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  section TEXT NOT NULL,
  number INTEGER NOT NULL,
  assigned_waiter_id TEXT,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  variants_json TEXT,
  choices_json TEXT,
  is_veg INTEGER,
  is_new INTEGER,
  is_highlighted INTEGER,
  discount_percent REAL,
  discount_price REAL,
  available INTEGER NOT NULL,
  image TEXT,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL,
  group_code TEXT NOT NULL,
  status TEXT NOT NULL,
  host_member_id TEXT NOT NULL,
  service_charge_enabled INTEGER NOT NULL,
  discount_percent REAL NOT NULL,
  discount_amount REAL NOT NULL,
  loyalty_phone TEXT,
  loyalty_points_redeemed INTEGER NOT NULL,
  reservation_id TEXT,
  bill_number INTEGER,
  paid_at TEXT,
  payment_method TEXT,
  bill_requested_at TEXT,
  bill_requested_by_member_id TEXT,
  bill_requested_by_name TEXT,
  bill_generated_at TEXT,
  payment_submitted_at TEXT,
  payment_awaiting_approval INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session_members (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT,
  joined_at TEXT NOT NULL,
  is_host INTEGER NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_lines (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  variant_label TEXT,
  choices_json TEXT,
  notes TEXT,
  unit_price REAL NOT NULL,
  qty INTEGER NOT NULL,
  added_by_member_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_lines (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  variant_label TEXT,
  choices_json TEXT,
  notes TEXT,
  unit_price REAL NOT NULL,
  qty INTEGER NOT NULL,
  status TEXT NOT NULL,
  reject_reason TEXT,
  token_number INTEGER,
  ordered_by_member_id TEXT NOT NULL,
  taken_by_staff_id TEXT,
  taken_by_staff_name TEXT,
  assigned_waiter_id TEXT,
  assigned_waiter_name TEXT,
  is_cover_order INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_batches (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  token_number INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  item_ids_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  section_preference TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL,
  assigned_table_id TEXT,
  created_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty (
  phone TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER,
  table_id TEXT,
  session_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  table_id TEXT NOT NULL,
  table_label TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  actor_staff_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  recipient_staff_ids_json TEXT NOT NULL,
  read_by_staff_ids_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_table_status ON sessions(table_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_members_session ON session_members(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_lines(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON order_lines(session_id);
CREATE INDEX IF NOT EXISTS idx_batches_session ON order_batches(session_id);
`;

const COLUMN_MIGRATIONS = [
  "ALTER TABLE settings ADD COLUMN orders_open INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE settings ADD COLUMN allow_after_hours INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE settings ADD COLUMN hours_start TEXT NOT NULL DEFAULT '11:00'",
  "ALTER TABLE settings ADD COLUMN hours_end TEXT NOT NULL DEFAULT '23:30'",
  "ALTER TABLE order_lines ADD COLUMN taken_by_staff_id TEXT",
  "ALTER TABLE order_lines ADD COLUMN taken_by_staff_name TEXT",
  "ALTER TABLE order_lines ADD COLUMN assigned_waiter_id TEXT",
  "ALTER TABLE order_lines ADD COLUMN assigned_waiter_name TEXT",
  "ALTER TABLE order_lines ADD COLUMN is_cover_order INTEGER",
];

async function applySchema(client: Client) {
  if (global.__lunarSchemaVersion === SCHEMA_VERSION) return;
  await client.executeMultiple(SCHEMA);
  for (const sql of COLUMN_MIGRATIONS) {
    try {
      await client.execute(sql);
    } catch {
      /* column already exists */
    }
  }
  global.__lunarSchemaVersion = SCHEMA_VERSION;
}

async function getDb(): Promise<Client> {
  if (global.__lunarDb) {
    await applySchema(global.__lunarDb);
    return global.__lunarDb;
  }
  if (!global.__lunarDbReady) {
    global.__lunarDbReady = (async () => {
      const client = createClient({
        url: databaseUrl(),
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      if (!isRemoteTurso()) {
        try {
          await client.executeMultiple(
            "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;",
          );
        } catch {
          /* local file quirks */
        }
      }
      await applySchema(client);
      global.__lunarDb = client;
      return client;
    })();
  }
  const client = await global.__lunarDbReady;
  await applySchema(client);
  return client;
}

function nullable(value: string | number | null | undefined): SqlValue {
  if (value == null) return null;
  return value;
}

function bit(value: boolean | undefined | null): SqlValue {
  if (value == null) return null;
  return value ? 1 : 0;
}

function flag(value: unknown): boolean | undefined {
  if (value == null) return undefined;
  return Number(value) === 1;
}

function text(value: unknown): string {
  return value == null ? "" : String(value);
}

function textOpt(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  return String(value);
}

function num(value: unknown): number {
  return Number(value ?? 0);
}

function numOpt(value: unknown): number | undefined {
  if (value == null) return undefined;
  return Number(value);
}

function jsonText(value: unknown): SqlValue {
  if (value == null) return null;
  return JSON.stringify(value);
}

function parseJson<T>(value: unknown): T | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return JSON.parse(value) as T;
}

type Row = Record<string, unknown>;

async function rowsOf(db: Client, sql: string): Promise<Row[]> {
  const result = await db.execute(sql);
  return result.rows as unknown as Row[];
}

function groupBy(rows: Row[], key: string): Map<string, Row[]> {
  const map = new Map<string, Row[]>();
  for (const row of rows) {
    const id = String(row[key]);
    const list = map.get(id);
    if (list) list.push(row);
    else map.set(id, [row]);
  }
  return map;
}

function readMember(row: Row): SessionMember {
  return {
    id: text(row.id),
    displayName: text(row.display_name),
    phone: textOpt(row.phone),
    joinedAt: text(row.joined_at),
    isHost: Number(row.is_host) === 1,
  };
}

function readCartLine(row: Row): CartLine {
  return {
    id: text(row.id),
    menuItemId: text(row.menu_item_id),
    name: text(row.name),
    variantLabel: textOpt(row.variant_label),
    choices: parseJson<Record<string, string>>(row.choices_json),
    notes: textOpt(row.notes),
    unitPrice: num(row.unit_price),
    qty: num(row.qty),
    addedByMemberId: text(row.added_by_member_id),
  };
}

function readOrderLine(row: Row): OrderLine {
  return {
    id: text(row.id),
    menuItemId: text(row.menu_item_id),
    name: text(row.name),
    variantLabel: textOpt(row.variant_label),
    choices: parseJson<Record<string, string>>(row.choices_json),
    notes: textOpt(row.notes),
    unitPrice: num(row.unit_price),
    qty: num(row.qty),
    status: text(row.status) as OrderLine["status"],
    rejectReason: textOpt(row.reject_reason),
    tokenNumber: numOpt(row.token_number),
    orderedByMemberId: text(row.ordered_by_member_id),
    takenByStaffId: textOpt(row.taken_by_staff_id),
    takenByStaffName: textOpt(row.taken_by_staff_name),
    assignedWaiterId: textOpt(row.assigned_waiter_id),
    assignedWaiterName: textOpt(row.assigned_waiter_name),
    isCoverOrder: flag(row.is_cover_order),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function readBatch(row: Row): OrderBatch {
  return {
    id: text(row.id),
    sessionId: text(row.session_id),
    tokenNumber: num(row.token_number),
    createdAt: text(row.created_at),
    itemIds: parseJson<string[]>(row.item_ids_json) ?? [],
  };
}

function readSession(row: Row, children: {
  members: Map<string, Row[]>;
  cart: Map<string, Row[]>;
  orders: Map<string, Row[]>;
  batches: Map<string, Row[]>;
}): TableSession {
  const id = text(row.id);
  const paymentMethod = textOpt(row.payment_method) as TableSession["paymentMethod"];
  return {
    id,
    tableId: text(row.table_id),
    groupCode: text(row.group_code),
    status: text(row.status) as TableSession["status"],
    hostMemberId: text(row.host_member_id),
    members: (children.members.get(id) ?? []).map(readMember),
    cart: (children.cart.get(id) ?? []).map(readCartLine),
    orders: (children.orders.get(id) ?? []).map(readOrderLine),
    batches: (children.batches.get(id) ?? []).map(readBatch),
    serviceChargeEnabled: Number(row.service_charge_enabled) === 1,
    discountPercent: num(row.discount_percent),
    discountAmount: num(row.discount_amount),
    loyaltyPhone: textOpt(row.loyalty_phone),
    loyaltyPointsRedeemed: num(row.loyalty_points_redeemed),
    reservationId: textOpt(row.reservation_id),
    billNumber: numOpt(row.bill_number),
    paidAt: textOpt(row.paid_at),
    paymentMethod,
    billRequestedAt: textOpt(row.bill_requested_at),
    billRequestedByMemberId: textOpt(row.bill_requested_by_member_id),
    billRequestedByName: textOpt(row.bill_requested_by_name),
    billGeneratedAt: textOpt(row.bill_generated_at),
    paymentSubmittedAt: textOpt(row.payment_submitted_at),
    paymentAwaitingApproval: flag(row.payment_awaiting_approval),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

export function databasePath() {
  return process.env.TURSO_DATABASE_URL || DB_PATH;
}

export async function hasPersistedStore(): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute("SELECT id FROM settings WHERE id = 1");
  return result.rows.length > 0;
}

export async function readStore(): Promise<CafeStore | null> {
  const db = await getDb();
  const settingsResult = await db.execute("SELECT * FROM settings WHERE id = 1");
  const settings = settingsResult.rows[0] as Row | undefined;
  if (!settings) return null;

  const [memberRows, cartRows, orderRows, batchRows, tableRows, staffRows, menuRows, sessionRows, reservationRows, loyaltyRows, feedbackRows, alertRows, auditRows] =
    await Promise.all([
      rowsOf(db, "SELECT * FROM session_members ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM cart_lines ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM order_lines ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM order_batches ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM tables ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM staff ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM menu_items ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM sessions ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM reservations ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM loyalty ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM feedback ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM staff_alerts ORDER BY sort_order"),
      rowsOf(db, "SELECT * FROM audit_log ORDER BY sort_order"),
    ]);

  const members = groupBy(memberRows, "session_id");
  const cart = groupBy(cartRows, "session_id");
  const orders = groupBy(orderRows, "session_id");
  const batches = groupBy(batchRows, "session_id");

  const appSettings: AppSettings = {
    cgstPercent: num(settings.cgst_percent),
    sgstPercent: num(settings.sgst_percent),
    serviceChargePercent: num(settings.service_charge_percent),
    loyaltyEarnPerRupees: num(settings.loyalty_earn_per_rupees),
    loyaltyPointsPerEarn: num(settings.loyalty_points_per_earn),
    loyaltyRedeemPoints: num(settings.loyalty_redeem_points),
    loyaltyRedeemValue: num(settings.loyalty_redeem_value),
    welcomeBonusPoints: num(settings.welcome_bonus_points),
    nextBillNumber: num(settings.next_bill_number),
    nextTokenNumber: num(settings.next_token_number),
    businessDayStartHour: num(settings.business_day_start_hour),
    ordersOpen: settings.orders_open == null ? true : Number(settings.orders_open) === 1,
    allowAfterHours: Number(settings.allow_after_hours) === 1,
    hoursStart: textOpt(settings.hours_start) || CAFE.hoursStart,
    hoursEnd: textOpt(settings.hours_end) || CAFE.hoursEnd,
  };

  return {
    cafeId: text(settings.cafe_id),
    settings: appSettings,
    tables: tableRows.map(
      (row): CafeTable => ({
        id: text(row.id),
        label: text(row.label),
        section: text(row.section) as CafeTable["section"],
        number: num(row.number),
        assignedWaiterId: textOpt(row.assigned_waiter_id) ?? null,
      }),
    ),
    staff: staffRows.map(
      (row): StaffUser => ({
        id: text(row.id),
        name: text(row.name),
        email: text(row.email),
        password: text(row.password),
        role: text(row.role) as StaffUser["role"],
        active: Number(row.active) === 1,
      }),
    ),
    menu: menuRows.map(
      (row): MenuItem => ({
        id: text(row.id),
        category: text(row.category),
        name: text(row.name),
        description: text(row.description),
        price: num(row.price),
        variants: parseJson<MenuItem["variants"]>(row.variants_json),
        choices: parseJson<MenuItem["choices"]>(row.choices_json),
        isVeg: flag(row.is_veg),
        isNew: flag(row.is_new),
        isHighlighted: flag(row.is_highlighted),
        discountPercent: numOpt(row.discount_percent),
        discountPrice: numOpt(row.discount_price),
        available: Number(row.available) === 1,
        image: textOpt(row.image),
      }),
    ),
    sessions: sessionRows.map((row) =>
      readSession(row, { members, cart, orders, batches }),
    ),
    reservations: reservationRows.map(
      (row): Reservation => ({
        id: text(row.id),
        name: text(row.name),
        phone: text(row.phone),
        partySize: num(row.party_size),
        date: text(row.date),
        time: text(row.time),
        sectionPreference: text(row.section_preference) as Reservation["sectionPreference"],
        note: textOpt(row.note),
        status: text(row.status) as Reservation["status"],
        assignedTableId: textOpt(row.assigned_table_id),
        createdAt: text(row.created_at),
      }),
    ),
    loyalty: loyaltyRows.map(
      (row): LoyaltyMember => ({
        phone: text(row.phone),
        name: text(row.name),
        points: num(row.points),
        createdAt: text(row.created_at),
        updatedAt: text(row.updated_at),
      }),
    ),
    feedback: feedbackRows.map(
      (row): Feedback => ({
        id: text(row.id),
        category: text(row.category) as Feedback["category"],
        type: text(row.type) as Feedback["type"],
        message: text(row.message),
        rating: numOpt(row.rating),
        tableId: textOpt(row.table_id),
        sessionId: textOpt(row.session_id),
        status: text(row.status) as Feedback["status"],
        createdAt: text(row.created_at),
      }),
    ),
    staffAlerts: alertRows.map(
      (row): StaffAlert => ({
        id: text(row.id),
        type: text(row.type) as StaffAlert["type"],
        tableId: text(row.table_id),
        tableLabel: text(row.table_label),
        message: text(row.message),
        createdAt: text(row.created_at),
        actorStaffId: text(row.actor_staff_id),
        actorName: text(row.actor_name),
        recipientStaffIds: parseJson<string[]>(row.recipient_staff_ids_json) ?? [],
        readByStaffIds: parseJson<string[]>(row.read_by_staff_ids_json) ?? [],
      }),
    ),
    auditLog: auditRows.map((row) => ({
      id: text(row.id),
      at: text(row.at),
      actor: text(row.actor),
      action: text(row.action),
      detail: textOpt(row.detail),
    })),
  };
}

export async function writeStore(store: CafeStore) {
  const db = await getDb();
  const settings = store.settings;
  const statements: InStatement[] = [
    "DELETE FROM cart_lines",
    "DELETE FROM order_lines",
    "DELETE FROM order_batches",
    "DELETE FROM session_members",
    "DELETE FROM sessions",
    "DELETE FROM reservations",
    "DELETE FROM feedback",
    "DELETE FROM staff_alerts",
    "DELETE FROM audit_log",
    "DELETE FROM loyalty",
    "DELETE FROM menu_items",
    "DELETE FROM staff",
    "DELETE FROM tables",
    "DELETE FROM settings",
    {
      sql: `INSERT INTO settings (
      id, cafe_id, cgst_percent, sgst_percent, service_charge_percent,
      loyalty_earn_per_rupees, loyalty_points_per_earn, loyalty_redeem_points,
      loyalty_redeem_value, welcome_bonus_points, next_bill_number,
      next_token_number, business_day_start_hour,
      orders_open, allow_after_hours, hours_start, hours_end
    ) VALUES (
      1, :cafe_id, :cgst_percent, :sgst_percent, :service_charge_percent,
      :loyalty_earn_per_rupees, :loyalty_points_per_earn, :loyalty_redeem_points,
      :loyalty_redeem_value, :welcome_bonus_points, :next_bill_number,
      :next_token_number, :business_day_start_hour,
      :orders_open, :allow_after_hours, :hours_start, :hours_end
    )`,
      args: {
        cafe_id: store.cafeId,
        cgst_percent: settings.cgstPercent,
        sgst_percent: settings.sgstPercent,
        service_charge_percent: settings.serviceChargePercent,
        loyalty_earn_per_rupees: settings.loyaltyEarnPerRupees,
        loyalty_points_per_earn: settings.loyaltyPointsPerEarn,
        loyalty_redeem_points: settings.loyaltyRedeemPoints,
        loyalty_redeem_value: settings.loyaltyRedeemValue,
        welcome_bonus_points: settings.welcomeBonusPoints,
        next_bill_number: settings.nextBillNumber,
        next_token_number: settings.nextTokenNumber,
        business_day_start_hour: settings.businessDayStartHour,
        orders_open: settings.ordersOpen === false ? 0 : 1,
        allow_after_hours: settings.allowAfterHours ? 1 : 0,
        hours_start: settings.hoursStart || CAFE.hoursStart,
        hours_end: settings.hoursEnd || CAFE.hoursEnd,
      },
    },
  ];

  store.tables.forEach((table, sort_order) => {
    statements.push({
      sql: "INSERT INTO tables (id, label, section, number, assigned_waiter_id, sort_order) VALUES (:id, :label, :section, :number, :assigned_waiter_id, :sort_order)",
      args: {
        id: table.id,
        label: table.label,
        section: table.section,
        number: table.number,
        assigned_waiter_id: nullable(table.assignedWaiterId),
        sort_order,
      },
    });
  });

  store.staff.forEach((user, sort_order) => {
    statements.push({
      sql: "INSERT INTO staff (id, name, email, password, role, active, sort_order) VALUES (:id, :name, :email, :password, :role, :active, :sort_order)",
      args: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        active: user.active ? 1 : 0,
        sort_order,
      },
    });
  });

  store.menu.forEach((item, sort_order) => {
    statements.push({
      sql: `INSERT INTO menu_items (
      id, category, name, description, price, variants_json, choices_json,
      is_veg, is_new, is_highlighted, discount_percent, discount_price,
      available, image, sort_order
    ) VALUES (
      :id, :category, :name, :description, :price, :variants_json, :choices_json,
      :is_veg, :is_new, :is_highlighted, :discount_percent, :discount_price,
      :available, :image, :sort_order
    )`,
      args: {
        id: item.id,
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        variants_json: jsonText(item.variants),
        choices_json: jsonText(item.choices),
        is_veg: bit(item.isVeg),
        is_new: bit(item.isNew),
        is_highlighted: bit(item.isHighlighted),
        discount_percent: nullable(item.discountPercent),
        discount_price: nullable(item.discountPrice),
        available: item.available ? 1 : 0,
        image: nullable(item.image),
        sort_order,
      },
    });
  });

  (store.sessions ?? []).forEach((session, sort_order) => {
    statements.push({
      sql: `INSERT INTO sessions (
      id, table_id, group_code, status, host_member_id, service_charge_enabled,
      discount_percent, discount_amount, loyalty_phone, loyalty_points_redeemed,
      reservation_id, bill_number, paid_at, payment_method, bill_requested_at,
      bill_requested_by_member_id, bill_requested_by_name, bill_generated_at,
      payment_submitted_at, payment_awaiting_approval, created_at, updated_at, sort_order
    ) VALUES (
      :id, :table_id, :group_code, :status, :host_member_id, :service_charge_enabled,
      :discount_percent, :discount_amount, :loyalty_phone, :loyalty_points_redeemed,
      :reservation_id, :bill_number, :paid_at, :payment_method, :bill_requested_at,
      :bill_requested_by_member_id, :bill_requested_by_name, :bill_generated_at,
      :payment_submitted_at, :payment_awaiting_approval, :created_at, :updated_at, :sort_order
    )`,
      args: {
        id: session.id,
        table_id: session.tableId,
        group_code: session.groupCode,
        status: session.status,
        host_member_id: session.hostMemberId,
        service_charge_enabled: session.serviceChargeEnabled ? 1 : 0,
        discount_percent: session.discountPercent ?? 0,
        discount_amount: session.discountAmount ?? 0,
        loyalty_phone: nullable(session.loyaltyPhone),
        loyalty_points_redeemed: session.loyaltyPointsRedeemed ?? 0,
        reservation_id: nullable(session.reservationId),
        bill_number: nullable(session.billNumber),
        paid_at: nullable(session.paidAt),
        payment_method: nullable(session.paymentMethod),
        bill_requested_at: nullable(session.billRequestedAt),
        bill_requested_by_member_id: nullable(session.billRequestedByMemberId),
        bill_requested_by_name: nullable(session.billRequestedByName),
        bill_generated_at: nullable(session.billGeneratedAt),
        payment_submitted_at: nullable(session.paymentSubmittedAt),
        payment_awaiting_approval: bit(session.paymentAwaitingApproval),
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        sort_order,
      },
    });

    (session.members ?? []).forEach((member, memberOrder) => {
      statements.push({
        sql: "INSERT INTO session_members (id, session_id, display_name, phone, joined_at, is_host, sort_order) VALUES (:id, :session_id, :display_name, :phone, :joined_at, :is_host, :sort_order)",
        args: {
          id: member.id,
          session_id: session.id,
          display_name: member.displayName,
          phone: nullable(member.phone),
          joined_at: member.joinedAt,
          is_host: member.isHost ? 1 : 0,
          sort_order: memberOrder,
        },
      });
    });

    (session.cart ?? []).forEach((line, lineOrder) => {
      statements.push({
        sql: `INSERT INTO cart_lines (
      id, session_id, menu_item_id, name, variant_label, choices_json, notes,
      unit_price, qty, added_by_member_id, sort_order
    ) VALUES (
      :id, :session_id, :menu_item_id, :name, :variant_label, :choices_json, :notes,
      :unit_price, :qty, :added_by_member_id, :sort_order
    )`,
        args: {
          id: line.id,
          session_id: session.id,
          menu_item_id: line.menuItemId,
          name: line.name,
          variant_label: nullable(line.variantLabel),
          choices_json: jsonText(line.choices),
          notes: nullable(line.notes),
          unit_price: line.unitPrice,
          qty: line.qty,
          added_by_member_id: line.addedByMemberId,
          sort_order: lineOrder,
        },
      });
    });

    (session.orders ?? []).forEach((line, lineOrder) => {
      statements.push({
        sql: `INSERT INTO order_lines (
      id, session_id, menu_item_id, name, variant_label, choices_json, notes,
      unit_price, qty, status, reject_reason, token_number, ordered_by_member_id,
      taken_by_staff_id, taken_by_staff_name, assigned_waiter_id, assigned_waiter_name,
      is_cover_order, created_at, updated_at, sort_order
    ) VALUES (
      :id, :session_id, :menu_item_id, :name, :variant_label, :choices_json, :notes,
      :unit_price, :qty, :status, :reject_reason, :token_number, :ordered_by_member_id,
      :taken_by_staff_id, :taken_by_staff_name, :assigned_waiter_id, :assigned_waiter_name,
      :is_cover_order, :created_at, :updated_at, :sort_order
    )`,
        args: {
          id: line.id,
          session_id: session.id,
          menu_item_id: line.menuItemId,
          name: line.name,
          variant_label: nullable(line.variantLabel),
          choices_json: jsonText(line.choices),
          notes: nullable(line.notes),
          unit_price: line.unitPrice,
          qty: line.qty,
          status: line.status,
          reject_reason: nullable(line.rejectReason),
          token_number: nullable(line.tokenNumber),
          ordered_by_member_id: line.orderedByMemberId,
          taken_by_staff_id: nullable(line.takenByStaffId),
          taken_by_staff_name: nullable(line.takenByStaffName),
          assigned_waiter_id: nullable(line.assignedWaiterId),
          assigned_waiter_name: nullable(line.assignedWaiterName),
          is_cover_order: bit(line.isCoverOrder),
          created_at: line.createdAt,
          updated_at: line.updatedAt,
          sort_order: lineOrder,
        },
      });
    });

    (session.batches ?? []).forEach((batch, batchOrder) => {
      statements.push({
        sql: "INSERT INTO order_batches (id, session_id, token_number, created_at, item_ids_json, sort_order) VALUES (:id, :session_id, :token_number, :created_at, :item_ids_json, :sort_order)",
        args: {
          id: batch.id,
          session_id: session.id,
          token_number: batch.tokenNumber,
          created_at: batch.createdAt,
          item_ids_json: JSON.stringify(batch.itemIds ?? []),
          sort_order: batchOrder,
        },
      });
    });
  });

  (store.reservations ?? []).forEach((reservation, sort_order) => {
    statements.push({
      sql: `INSERT INTO reservations (
      id, name, phone, party_size, date, time, section_preference, note, status,
      assigned_table_id, created_at, sort_order
    ) VALUES (
      :id, :name, :phone, :party_size, :date, :time, :section_preference, :note, :status,
      :assigned_table_id, :created_at, :sort_order
    )`,
      args: {
        id: reservation.id,
        name: reservation.name,
        phone: reservation.phone,
        party_size: reservation.partySize,
        date: reservation.date,
        time: reservation.time,
        section_preference: reservation.sectionPreference,
        note: nullable(reservation.note),
        status: reservation.status,
        assigned_table_id: nullable(reservation.assignedTableId),
        created_at: reservation.createdAt,
        sort_order,
      },
    });
  });

  (store.loyalty ?? []).forEach((member, sort_order) => {
    statements.push({
      sql: "INSERT INTO loyalty (phone, name, points, created_at, updated_at, sort_order) VALUES (:phone, :name, :points, :created_at, :updated_at, :sort_order)",
      args: {
        phone: member.phone,
        name: member.name,
        points: member.points,
        created_at: member.createdAt,
        updated_at: member.updatedAt,
        sort_order,
      },
    });
  });

  (store.feedback ?? []).forEach((entry, sort_order) => {
    statements.push({
      sql: `INSERT INTO feedback (
      id, category, type, message, rating, table_id, session_id, status, created_at, sort_order
    ) VALUES (
      :id, :category, :type, :message, :rating, :table_id, :session_id, :status, :created_at, :sort_order
    )`,
      args: {
        id: entry.id,
        category: entry.category,
        type: entry.type,
        message: entry.message,
        rating: nullable(entry.rating),
        table_id: nullable(entry.tableId),
        session_id: nullable(entry.sessionId),
        status: entry.status,
        created_at: entry.createdAt,
        sort_order,
      },
    });
  });

  (store.staffAlerts ?? []).slice(0, 200).forEach((entry, sort_order) => {
    statements.push({
      sql: `INSERT INTO staff_alerts (
      id, type, table_id, table_label, message, created_at, actor_staff_id, actor_name,
      recipient_staff_ids_json, read_by_staff_ids_json, sort_order
    ) VALUES (
      :id, :type, :table_id, :table_label, :message, :created_at, :actor_staff_id, :actor_name,
      :recipient_staff_ids_json, :read_by_staff_ids_json, :sort_order
    )`,
      args: {
        id: entry.id,
        type: entry.type,
        table_id: entry.tableId,
        table_label: entry.tableLabel,
        message: entry.message,
        created_at: entry.createdAt,
        actor_staff_id: entry.actorStaffId,
        actor_name: entry.actorName,
        recipient_staff_ids_json: JSON.stringify(entry.recipientStaffIds ?? []),
        read_by_staff_ids_json: JSON.stringify(entry.readByStaffIds ?? []),
        sort_order,
      },
    });
  });

  (store.auditLog ?? []).slice(0, 500).forEach((entry, sort_order) => {
    statements.push({
      sql: "INSERT INTO audit_log (id, at, actor, action, detail, sort_order) VALUES (:id, :at, :actor, :action, :detail, :sort_order)",
      args: {
        id: entry.id,
        at: entry.at,
        actor: entry.actor,
        action: entry.action,
        detail: nullable(entry.detail),
        sort_order,
      },
    });
  });

  await db.batch(statements, "write");
}
