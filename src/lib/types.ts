export type StaffRole = "owner" | "reception" | "waiter" | "kitchen";

export type TableSection = "indoor" | "outdoor";

export type SessionStatus = "active" | "billing" | "closed";

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
  createdAt: string;
  updatedAt: string;
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
  auditLog: { id: string; at: string; actor: string; action: string; detail?: string }[];
}
