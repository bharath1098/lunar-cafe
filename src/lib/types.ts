export type StaffRole = "owner" | "reception" | "waiter" | "kitchen";

export type TableSection = "indoor" | "outdoor";

export type SessionStatus = "active" | "billing" | "closed";

export type OrderChannel = "dine_in" | "takeaway" | "swiggy" | "zomato";

export type OrderItemStatus =
  | "pending_approval"
  | "rejected"
  | "queued"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "cancelled"
  | "no_show";

export type FeedbackCategory = "food" | "service" | "ambience" | "other";
export type FeedbackStatus = "pending" | "published" | "removed";

export interface CafeTable {
  id: string; // lunar-I1, lunar-O1
  label: string;
  section: TableSection;
  number: number;
  assignedWaiterId: string | null;
}

export interface MenuVariant {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  variants?: MenuVariant[];
  choices?: { id: string; label: string; options: string[] }[];
  isVeg?: boolean;
  isNew?: boolean;
  isHighlighted?: boolean;
  discountPercent?: number;
  discountPrice?: number;
  available: boolean;
  image?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  active: boolean;
}

export interface SessionMember {
  id: string;
  displayName: string;
  phone?: string;
  joinedAt: string;
  isHost: boolean;
}

export interface CartLine {
  id: string;
  menuItemId: string;
  name: string;
  variantLabel?: string;
  choices?: Record<string, string>;
  notes?: string;
  unitPrice: number;
  qty: number;
  addedByMemberId: string;
}

export interface OrderLine {
  id: string;
  menuItemId: string;
  name: string;
  variantLabel?: string;
  choices?: Record<string, string>;
  notes?: string;
  unitPrice: number;
  qty: number;
  status: OrderItemStatus;
  rejectReason?: string;
  tokenNumber?: number;
  orderedByMemberId: string;
  /** Table where this ticket was placed (stays set after a table switch). */
  tableId?: string;
  /** Staff member who sent this ticket to the kitchen (waiter / reception / owner). */
  takenByStaffId?: string;
  takenByStaffName?: string;
  /** Table’s assigned waiter at the moment this ticket was sent. */
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  /** True when someone other than the assigned waiter sent the ticket. */
  isCoverOrder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableSwitchRecord {
  fromTableId: string;
  toTableId: string;
  reason: string;
  requestedBy?: string;
  approvedBy: string;
  at: string;
}

export interface OrderBatch {
  id: string;
  sessionId: string;
  tokenNumber: number;
  createdAt: string;
  itemIds: string[];
}

export interface TableSession {
  id: string;
  tableId: string;
  /** Dine-in is the floor. Swiggy, Zomato, and takeaway have no table. */
  channel?: OrderChannel;
  /** Swiggy or Zomato order number, when reception copies one in. */
  externalOrderId?: string;
  /** Rider or packing note for an online order. */
  orderNote?: string;
  groupCode: string;
  status: SessionStatus;
  hostMemberId: string;
  members: SessionMember[];
  cart: CartLine[];
  orders: OrderLine[];
  batches: OrderBatch[];
  serviceChargeEnabled: boolean;
  discountPercent: number;
  discountAmount: number;
  loyaltyPhone?: string;
  loyaltyPointsRedeemed: number;
  reservationId?: string;
  billNumber?: number;
  paidAt?: string;
  paymentMethod?: "cash" | "upi" | "card";
  billRequestedAt?: string;
  billRequestedByMemberId?: string;
  billRequestedByName?: string;
  billGeneratedAt?: string;
  paymentSubmittedAt?: string;
  paymentAwaitingApproval?: boolean;
  forceClosedAt?: string;
  forceCloseReason?: string;
  forceClosedBy?: string;
  /** Desk cancel for Swiggy, Zomato, or takeaway. */
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  /** Set when the table was closed automatically after the post-close grace period. */
  autoClosedAt?: string;
  /** Bill still needs a payment update after an automatic close. */
  settlementPending?: boolean;
  tableSwitchRequestedAt?: string;
  tableSwitchRequestedByMemberId?: string;
  tableSwitchRequestedByName?: string;
  tableSwitchReason?: string;
  tableSwitches?: TableSwitchRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  sectionPreference: "any" | TableSection;
  note?: string;
  status: ReservationStatus;
  assignedTableId?: string;
  createdAt: string;
}

export interface LoyaltyMember {
  phone: string;
  name: string;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface VisitItem {
  menuItemId: string;
  name: string;
  variantLabel?: string;
  choices?: Record<string, string>;
  notes?: string;
  unitPrice: number;
  qty: number;
}

export interface GuestVisit {
  sessionId: string;
  date: string;
  visitedAt: string;
  tableId: string;
  tableLabel: string;
  itemCount: number;
  items: VisitItem[];
}

export interface Feedback {
  id: string;
  category: FeedbackCategory;
  type: "compliment" | "complaint";
  message: string;
  rating?: number;
  tableId?: string;
  sessionId?: string;
  status: FeedbackStatus;
  createdAt: string;
}

export interface AppSettings {
  cgstPercent: number;
  sgstPercent: number;
  serviceChargePercent: number;
  loyaltyEarnPerRupees: number;
  loyaltyPointsPerEarn: number;
  loyaltyRedeemPoints: number;
  loyaltyRedeemValue: number;
  welcomeBonusPoints: number;
  nextBillNumber: number;
  nextTokenNumber: number;
  businessDayStartHour: number;
  /** Manual switch — owner / reception can close ordering anytime. */
  ordersOpen: boolean;
  /** If true, owner / reception allow orders outside hoursStart–hoursEnd. */
  allowAfterHours: boolean;
  /** Local cafe hours as HH:mm (Asia/Kolkata). */
  hoursStart: string;
  hoursEnd: string;
  /** Same-night close override. Service date is YYYY-MM-DD in Asia/Kolkata. */
  hoursEndOverrideDate?: string;
  /** HH:mm close time used only on hoursEndOverrideDate. */
  hoursEndOverride?: string;
}

export interface StaffAlert {
  id: string;
  type: "waiter_reassigned" | "cover_order" | "table_switch_request" | "online_order";
  tableId: string;
  tableLabel: string;
  message: string;
  createdAt: string;
  actorStaffId: string;
  actorName: string;
  recipientStaffIds: string[];
  readByStaffIds: string[];
}

export interface CafeStore {
  cafeId: string;
  settings: AppSettings;
  tables: CafeTable[];
  staff: StaffUser[];
  menu: MenuItem[];
  sessions: TableSession[];
  reservations: Reservation[];
  loyalty: LoyaltyMember[];
  feedback: Feedback[];
  staffAlerts: StaffAlert[];
  auditLog: { id: string; at: string; actor: string; action: string; detail?: string }[];
}
