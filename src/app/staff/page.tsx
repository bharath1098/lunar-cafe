"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import clsx from "clsx";
import {
  Armchair,
  ArrowLeftRight,
  Banknote,
  Bell,
  BarChart3,
  CalendarDays,
  CheckCheck,
  ChefHat,
  Clock,
  CreditCard,
  DoorClosed,
  DoorOpen,
  Flame,
  Globe,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  MessageSquareHeart,
  Pencil,
  Phone,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  KeyRound,
  Download,
  ShoppingBag,
  Store,
} from "lucide-react";
import { NeoButton, NeoInput, NeoSelect, NeoTextarea } from "@/components/Neo";
import { PasswordInput } from "@/components/PasswordInput";
import { addMinutesToHm, type OrderingStatus } from "@/lib/ordering-hours";
import { TakeOrderSheet } from "@/components/TakeOrderSheet";
import { DeskOrders, deskKitchenStatus, type DeskSession } from "@/components/DeskOrders";
import { PetpoojaGuide } from "@/components/PetpoojaGuide";
import { billableOrders } from "@/lib/bill";
import { CAFE_MEDIA } from "@/lib/media";
import { formatMoney } from "@/lib/cafe";
import { clearStaffSession, readStaffSession } from "@/lib/staff-session";
import type { ReservationStatus, StaffRole, TableSection } from "@/lib/types";

const StatsDashboard = dynamic(() => import("@/components/StatsDashboard"), {
  ssr: false,
  loading: () => <p className="muted">Loading analytics…</p>,
});

type StaffUser = { id: string; name: string; email: string; role: StaffRole; active?: boolean };

const FORCE_CLOSE_REASONS = [
  "Guest left without paying",
  "No order / unused table",
  "Duplicate session",
  "Complimentary / owner",
];

const DESK_CANCEL_REASONS = [
  "Guest cancelled on the app",
  "Wrong items / wrong order",
  "Item unavailable",
  "Rider delayed or cancelled",
  "Duplicate order",
];

const RESERVATION_STATUS_ACTIONS: { id: ReservationStatus; label: string }[] = [
  { id: "confirmed", label: "Confirmed" },
  { id: "seated", label: "Seated" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no_show", label: "No show" },
];

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [dash, setDash] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [rejectReason, setRejectReason] = useState("Item unavailable today");
  const [orderTable, setOrderTable] = useState<{ id: string; label: string } | null>(null);
  const [orderNotice, setOrderNotice] = useState("");
  const [deskOrder, setDeskOrder] = useState<null | "swiggy" | "zomato" | "takeaway">(null);
  const [deskBusy, setDeskBusy] = useState<string | null>(null);
  const [deskCancel, setDeskCancel] = useState<DeskSession | null>(null);
  const [deskCancelReason, setDeskCancelReason] = useState("");
  const [deskCancelError, setDeskCancelError] = useState("");
  const [deskCancelBusy, setDeskCancelBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const [menuCategory, setMenuCategory] = useState("All");
  const [menuFilter, setMenuFilter] = useState<"all" | "available" | "unavailable">("all");
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "waiter" as StaffRole,
  });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffFormOpen, setStaffFormOpen] = useState(false);
  const staffFormRef = useRef<HTMLElement>(null);
  const [staffNotice, setStaffNotice] = useState("");
  const [staffBusy, setStaffBusy] = useState(false);
  const [tableForm, setTableForm] = useState({
    section: "outdoor" as TableSection,
    number: "",
    label: "",
  });
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableFormOpen, setTableFormOpen] = useState(false);
  const tableFormRef = useRef<HTMLElement>(null);
  const [tableNotice, setTableNotice] = useState("");
  const [tableBusy, setTableBusy] = useState(false);
  const [menuForm, setMenuForm] = useState({
    id: "",
    name: "",
    category: "",
    description: "",
    price: "",
    isVeg: true,
    available: true,
    image: "",
  });
  const [menuCategoryMode, setMenuCategoryMode] = useState<"pick" | "new">("pick");
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState("");
  const [menuNotice, setMenuNotice] = useState("");
  const [menuBusy, setMenuBusy] = useState(false);
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const menuFormRef = useRef<HTMLElement>(null);
  const menuImageInputRef = useRef<HTMLInputElement>(null);
  const [forceClose, setForceClose] = useState<{ sessionId: string; tableLabel: string } | null>(null);
  const [forceCloseReason, setForceCloseReason] = useState("");
  const [forceCloseBusy, setForceCloseBusy] = useState(false);
  const [forceCloseError, setForceCloseError] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
  const [reassign, setReassign] = useState<{
    tableId: string;
    tableLabel: string;
    fromName: string;
    toName: string;
    waiterId: string | null;
  } | null>(null);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [genBill, setGenBill] = useState<{
    sessionId: string;
    tableLabel: string;
    total: number;
  } | null>(null);
  const [genBillBusy, setGenBillBusy] = useState(false);
  const [closeCafeOpen, setCloseCafeOpen] = useState(false);
  const [closeCafeBusy, setCloseCafeBusy] = useState(false);
  const [payBill, setPayBill] = useState<{
    sessionId: string;
    tableLabel: string;
    total: number;
    billNumber?: number;
  } | null>(null);
  const [payMethod, setPayMethod] = useState<"cash" | "upi" | "card">("cash");
  const [payBusy, setPayBusy] = useState(false);
  const [switchPick, setSwitchPick] = useState<Record<string, string>>({});
  const [switchBusyId, setSwitchBusyId] = useState<string | null>(null);
  const [staffSwitch, setStaffSwitch] = useState<{
    sessionId: string;
    fromTableId: string;
    tableLabel: string;
  } | null>(null);
  const [staffSwitchTo, setStaffSwitchTo] = useState("");
  const [staffSwitchReason, setStaffSwitchReason] = useState("");
  const [staffSwitchBusy, setStaffSwitchBusy] = useState(false);
  const [staffSwitchError, setStaffSwitchError] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [extendUntil, setExtendUntil] = useState("");
  const [extendBusy, setExtendBusy] = useState(false);
  const [extendError, setExtendError] = useState("");

  useEffect(() => {
    const u = readStaffSession<StaffUser>();
    if (!u) {
      router.replace("/staff/login");
      return;
    }
    setUser(u);
    setTab(u.role === "kitchen" ? "kitchen" : u.role === "waiter" ? "tables" : "overview");
  }, [router]);

  const load = useCallback(async (quiet?: boolean) => {
    const silent = quiet === true;
    const res = await fetch("/api/staff/dashboard", {
      cache: "no-store",
      headers: silent ? { "X-Lunar-Quiet": "1" } : undefined,
    });
    if (res.status === 401) {
      clearStaffSession();
      router.replace("/staff/login");
      return;
    }
    if (res.ok) setDash(await res.json());
  }, [router]);

  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(() => {
      void load(true);
    }, 3000);
    return () => clearInterval(t);
  }, [user, load]);

  const closingSoon = Boolean((dash?.ordering as OrderingStatus | undefined)?.closingSoon);
  const effectiveEnd = (dash?.ordering as OrderingStatus | undefined)?.effectiveHoursEnd;
  useEffect(() => {
    if (!closingSoon || !effectiveEnd) {
      setExtendUntil("");
      return;
    }
    setExtendUntil((prev) => prev || addMinutesToHm(effectiveEnd, 30));
  }, [closingSoon, effectiveEnd]);

  async function action(body: Record<string, unknown>) {
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, actor: user?.email }),
    });
    if (res.status === 401) {
      clearStaffSession();
      router.replace("/staff/login");
      return;
    }
    load();
  }

  async function deskAction(body: Record<string, unknown>, okMessage: string) {
    const sessionId = String(body.sessionId || "");
    setDeskBusy(sessionId || "new");
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, actor: user?.email }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        clearStaffSession();
        router.replace("/staff/login");
        return;
      }
      if (!res.ok) {
        setOrderNotice(json.error || "Could not update that order");
        return;
      }
      setOrderNotice(okMessage);
      load();
    } finally {
      setDeskBusy(null);
    }
  }

  function closeDeskCancel() {
    if (deskCancelBusy) return;
    setDeskCancel(null);
    setDeskCancelReason("");
    setDeskCancelError("");
  }

  async function confirmDeskCancel() {
    if (!deskCancel) return;
    const reason = deskCancelReason.trim();
    if (reason.length < 3) {
      setDeskCancelError("Enter a short reason before cancelling.");
      return;
    }
    setDeskCancelBusy(true);
    setDeskCancelError("");
    try {
      const source =
        deskCancel.channel === "swiggy"
          ? "Swiggy"
          : deskCancel.channel === "zomato"
            ? "Zomato"
            : "Takeaway";
      await deskAction(
        {
          action: "cancel_online_order",
          sessionId: deskCancel.id,
          reason,
        },
        `${source} order cancelled.`,
      );
      setDeskCancel(null);
      setDeskCancelReason("");
    } finally {
      setDeskCancelBusy(false);
    }
  }

  function cancelForceClose() {
    if (forceCloseBusy) return;
    setForceClose(null);
    setForceCloseReason("");
    setForceCloseError("");
  }

  async function confirmForceClose() {
    if (!forceClose) return;
    const reason = forceCloseReason.trim();
    if (reason.length < 3) {
      setForceCloseError("Enter a short reason before closing this table.");
      return;
    }
    setForceCloseBusy(true);
    setForceCloseError("");
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "force_close",
          sessionId: forceClose.sessionId,
          reason,
          actor: user?.email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForceCloseError(data.error || "Could not close the table.");
        return;
      }
      setForceClose(null);
      setForceCloseReason("");
      load();
    } finally {
      setForceCloseBusy(false);
    }
  }

  useEffect(() => {
    if (!forceClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelForceClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forceClose, forceCloseBusy]);

  useEffect(() => {
    if (!reassign) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !reassignBusy) setReassign(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reassign, reassignBusy]);

  useEffect(() => {
    if (!genBill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !genBillBusy) setGenBill(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [genBill, genBillBusy]);

  useEffect(() => {
    if (!closeCafeOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !closeCafeBusy) setCloseCafeOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCafeOpen, closeCafeBusy]);

  useEffect(() => {
    if (!payBill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !payBusy) setPayBill(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payBill, payBusy]);

  useEffect(() => {
    if (!alertsOpen) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (alertsRef.current?.contains(e.target as Node)) return;
      if (target?.closest(".staff-alert-btn")) return;
      setAlertsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAlertsOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [alertsOpen]);

  const tabs = useMemo(() => {
    if (!user) return [];
    const all = [
      { id: "overview", label: "Overview", icon: LayoutDashboard, roles: ["owner", "reception", "waiter", "kitchen"] },
      {
        id: "tables",
        label: user.role === "waiter" ? "Tables" : "Dine-in",
        icon: Armchair,
        roles: ["owner", "reception", "waiter"],
        count: (dash?.billRequests?.length || 0) + (dash?.tableSwitchRequests?.length || 0),
      },
      {
        id: "online",
        label: "Online",
        icon: Smartphone,
        roles: ["owner", "reception"],
        count: (dash?.activeSessions || []).filter(
          (s: { channel?: string }) => s.channel === "swiggy" || s.channel === "zomato",
        ).length,
      },
      {
        id: "takeaway",
        label: "Takeaway",
        icon: ShoppingBag,
        roles: ["owner", "reception"],
        count: (dash?.activeSessions || []).filter(
          (s: { channel?: string }) => s.channel === "takeaway",
        ).length,
      },
      { id: "approvals", label: "Approvals", icon: CheckCheck, roles: ["owner", "reception", "waiter"], count: dash?.pendingApprovals?.length },
      { id: "kitchen", label: "Kitchen", icon: ChefHat, roles: ["owner", "kitchen", "reception"] },
      {
        id: "bills",
        label: "Bills",
        icon: Receipt,
        roles: ["owner", "reception", "waiter"],
        count:
          (dash?.billRequests?.length || 0) +
          (dash?.tableSwitchRequests?.length || 0) +
          (user.role === "waiter" ? 0 : dash?.paymentApprovals?.length || 0),
      },
      {
        id: "unsettled",
        label: "Unsettled bills",
        icon: Receipt,
        roles: ["owner", "reception"],
        count: dash?.unsettledBills?.length || 0,
      },
      { id: "menu", label: "Menu", icon: UtensilsCrossed, roles: ["owner"] },
      { id: "team", label: "Team", icon: UserPlus, roles: ["owner"] },
      { id: "reservations", label: "Reservations", icon: CalendarDays, roles: ["owner", "reception"] },
      { id: "feedback", label: "Feedback", icon: MessageSquareHeart, roles: ["owner"], count: dash?.stats?.pendingFeedback },
      { id: "stats", label: "Stats", icon: BarChart3, roles: ["owner"] },
      { id: "qrs", label: "Table QRs", icon: QrCode, roles: ["owner", "reception"] },
    ];
    return all.filter((t) => t.roles.includes(user.role));
  }, [user, dash]);

  if (!user || !dash) {
    return (
      <main style={{ minHeight: "calc(100 * var(--svh))", display: "grid", placeItems: "center" }}>
        <p className="muted">Loading staff console…</p>
      </main>
    );
  }

  const waiters = dash.staff.filter((s: StaffUser) => s.role === "waiter" && s.active !== false);
  const myAlerts: {
    id: string;
    type: string;
    tableLabel: string;
    message: string;
    createdAt: string;
    actorName: string;
    recipientStaffIds: string[];
    readByStaffIds: string[];
  }[] = (dash.staffAlerts || []).filter(
    (a: { recipientStaffIds?: string[] }) => a.recipientStaffIds?.includes(user.id),
  );
  const unreadAlerts = myAlerts.filter((a) => !a.readByStaffIds?.includes(user.id));

  function requestReassign(
    table: { id: string; assignedWaiterId?: string | null },
    nextWaiterId: string | null,
  ) {
    if (!table.assignedWaiterId || table.assignedWaiterId === nextWaiterId) {
      action({ action: "assign_waiter", tableId: table.id, waiterId: nextWaiterId });
      return;
    }
    const current = waiters.find((w: StaffUser) => w.id === table.assignedWaiterId);
    const next = waiters.find((w: StaffUser) => w.id === nextWaiterId);
    setReassign({
      tableId: table.id,
      tableLabel: table.id.replace("lunar-", ""),
      fromName: current?.name || "another waiter",
      toName: next?.name || "Unassigned",
      waiterId: nextWaiterId,
    });
  }

  function cancelReassign() {
    if (reassignBusy) return;
    setReassign(null);
  }

  function requestGenerateBill(session?: {
    id: string;
    tableId: string;
    billGeneratedAt?: string;
    bill?: { totalQty?: number; grandTotal?: number };
  } | null) {
    if (!session || session.billGeneratedAt) return;
    if (!session.bill?.totalQty) {
      setOrderNotice(`Table ${session.tableId.replace("lunar-", "")} has no items to bill yet.`);
      return;
    }
    setGenBill({
      sessionId: session.id,
      tableLabel: session.tableId.replace("lunar-", ""),
      total: session.bill.grandTotal || 0,
    });
  }

  function cancelGenerateBill() {
    if (genBillBusy) return;
    setGenBill(null);
  }

  async function confirmGenerateBill() {
    if (!genBill) return;
    setGenBillBusy(true);
    try {
      await action({ action: "generate_bill", sessionId: genBill.sessionId });
      setOrderNotice(`Bill generated for table ${genBill.tableLabel}.`);
      setGenBill(null);
    } finally {
      setGenBillBusy(false);
    }
  }

  async function confirmReassign() {
    if (!reassign) return;
    setReassignBusy(true);
    try {
      await action({
        action: "assign_waiter",
        tableId: reassign.tableId,
        waiterId: reassign.waiterId,
      });
      setReassign(null);
    } finally {
      setReassignBusy(false);
    }
  }

  function resetStaffForm() {
    setEditingStaffId(null);
    setStaffFormOpen(false);
    setStaffForm({ name: "", email: "", password: "", role: "waiter" });
  }

  function openStaffForm() {
    setStaffFormOpen(true);
    requestAnimationFrame(() => {
      staffFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function beginAddStaff() {
    setEditingStaffId(null);
    setStaffForm({ name: "", email: "", password: "", role: "waiter" });
    setStaffNotice("");
    openStaffForm();
  }

  function beginEditStaff(s: StaffUser & { active?: boolean }) {
    if (staffFormOpen && editingStaffId === s.id) {
      resetStaffForm();
      return;
    }
    setEditingStaffId(s.id);
    setStaffForm({
      name: s.name,
      email: s.email,
      password: "",
      role: s.role === "owner" ? "waiter" : s.role,
    });
    setStaffNotice("");
    openStaffForm();
  }

  async function saveStaffMember() {
    if (!user) return;
    if (staffBusy) return;
    setStaffNotice("");
    setStaffBusy(true);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingStaffId
            ? {
                action: "staff_update",
                actor: user.email,
                staffId: editingStaffId,
                patch: {
                  name: staffForm.name,
                  email: staffForm.email,
                  role: staffForm.role,
                  ...(staffForm.password ? { password: staffForm.password } : {}),
                },
              }
            : {
                action: "staff_create",
                actor: user.email,
                name: staffForm.name,
                email: staffForm.email,
                password: staffForm.password,
                role: staffForm.role,
              },
        ),
      });
      const json = await res.json();
      if (!res.ok) {
        setStaffNotice(json.error || "Could not save staff");
        return;
      }
      setStaffNotice(
        editingStaffId
          ? `${json.staff.name} updated.`
          : `${json.staff.name} added as ${json.staff.role}. They can sign in at /staff/login.`,
      );
      resetStaffForm();
      load();
    } finally {
      setStaffBusy(false);
    }
  }

  async function removeStaffMember(staffId: string, name: string) {
    if (!user) return;
    if (!window.confirm(`Delete ${name}? They will no longer be able to sign in.`)) return;
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "staff_delete", staffId, actor: user.email }),
    });
    const json = await res.json();
    if (!res.ok) {
      setStaffNotice(json.error || "Could not delete staff");
      return;
    }
    if (editingStaffId === staffId) resetStaffForm();
    setStaffNotice(`${name} deleted.`);
    load();
  }

  function resetTableForm() {
    setEditingTableId(null);
    setTableFormOpen(false);
    setTableForm({ section: "outdoor", number: "", label: "" });
  }

  function openTableForm() {
    setTableFormOpen(true);
    requestAnimationFrame(() => {
      tableFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function beginAddTable() {
    setEditingTableId(null);
    setTableForm({ section: "outdoor", number: "", label: "" });
    setTableNotice("");
    openTableForm();
  }

  function beginEditTable(t: {
    id: string;
    section: TableSection;
    number: number;
    label: string;
  }) {
    if (editingTableId === t.id && tableFormOpen) {
      resetTableForm();
      return;
    }
    setEditingTableId(t.id);
    setTableForm({
      section: t.section,
      number: String(t.number),
      label: t.label,
    });
    setTableNotice("");
    openTableForm();
  }

  async function saveTable() {
    if (!user) return;
    if (tableBusy) return;
    setTableNotice("");
    setTableBusy(true);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingTableId
            ? {
                action: "table_update",
                actor: user.email,
                tableId: editingTableId,
                patch: {
                  section: tableForm.section,
                  number: tableForm.number ? Number(tableForm.number) : undefined,
                  label: tableForm.label || undefined,
                },
              }
            : {
                action: "table_create",
                actor: user.email,
                section: tableForm.section,
                number: tableForm.number ? Number(tableForm.number) : undefined,
                label: tableForm.label || undefined,
              },
        ),
      });
      const json = await res.json();
      if (!res.ok) {
        setTableNotice(json.error || "Could not save table");
        return;
      }
      setTableNotice(
        editingTableId ? `${json.table.label} updated.` : `${json.table.label} added.`,
      );
      resetTableForm();
      load();
    } finally {
      setTableBusy(false);
    }
  }

  async function removeTable(tableId: string, label: string) {
    if (!user) return;
    if (!window.confirm(`Delete ${label}? QR codes for this table will stop working.`)) return;
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "table_delete", tableId, actor: user.email }),
    });
    const json = await res.json();
    if (!res.ok) {
      setTableNotice(json.error || "Could not delete table");
      return;
    }
    if (editingTableId === tableId) resetTableForm();
    setTableNotice(`${label} deleted.`);
    load();
  }

  function resetMenuForm() {
    setMenuFormOpen(false);
    setMenuForm({
      id: "",
      name: "",
      category: "",
      description: "",
      price: "",
      isVeg: true,
      available: true,
      image: "",
    });
    setMenuCategoryMode("pick");
    setMenuImageFile(null);
    setMenuImagePreview("");
    if (menuImageInputRef.current) menuImageInputRef.current.value = "";
  }

  function openMenuForm() {
    setMenuFormOpen(true);
    requestAnimationFrame(() => {
      menuFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function beginAddMenu() {
    const known = Array.from(
      new Set((dash?.menu || []).map((m: { category?: string }) => String(m.category || "").trim()).filter(Boolean)),
    ) as string[];
    const preset =
      menuCategory !== "All" && known.includes(menuCategory) ? menuCategory : known[0] || "";
    setMenuForm({
      id: "",
      name: "",
      category: preset,
      description: "",
      price: "",
      isVeg: true,
      available: true,
      image: "",
    });
    setMenuCategoryMode(known.length ? "pick" : "new");
    setMenuImageFile(null);
    setMenuImagePreview("");
    if (menuImageInputRef.current) menuImageInputRef.current.value = "";
    setMenuNotice("");
    openMenuForm();
  }

  function beginEditMenu(m: any) {
    if (menuFormOpen && menuForm.id === m.id) {
      resetMenuForm();
      return;
    }
    const known = Array.from(
      new Set((dash?.menu || []).map((x: { category?: string }) => String(x.category || "").trim()).filter(Boolean)),
    ) as string[];
    const category = m.category || "";
    setMenuForm({
      id: m.id,
      name: m.name || "",
      category,
      description: m.description || "",
      price: String(m.price ?? ""),
      isVeg: Boolean(m.isVeg),
      available: Boolean(m.available),
      image: m.image || "",
    });
    setMenuCategoryMode(known.includes(category) ? "pick" : "new");
    setMenuImageFile(null);
    setMenuImagePreview(m.image || "");
    if (menuImageInputRef.current) menuImageInputRef.current.value = "";
    setMenuNotice("");
    openMenuForm();
  }

  function onMenuImagePick(file: File | null) {
    setMenuImageFile(file);
    if (!file) {
      setMenuImagePreview(menuForm.image || "");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMenuNotice("Use a JPG, PNG, or WebP photo");
      setMenuImageFile(null);
      if (menuImageInputRef.current) menuImageInputRef.current.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMenuNotice("Photo must be under 2 MB");
      setMenuImageFile(null);
      if (menuImageInputRef.current) menuImageInputRef.current.value = "";
      return;
    }
    setMenuNotice("");
    const url = URL.createObjectURL(file);
    setMenuImagePreview(url);
  }

  async function saveMenuItem() {
    if (!user) return;
    if (menuBusy) return;
    setMenuNotice("");
    setMenuBusy(true);
    try {
      const price = Number(menuForm.price);
      if (!menuForm.name.trim() || !menuForm.category.trim() || !Number.isFinite(price) || price < 0) {
        setMenuNotice("Name, category, and a valid price are required");
        return;
      }
      let image = menuForm.image.trim();
      if (menuImageFile) {
        const body = new FormData();
        body.append("file", menuImageFile);
        const upload = await fetch("/api/staff/menu-image", { method: "POST", body });
        const uploaded = await upload.json();
        if (!upload.ok) {
          setMenuNotice(uploaded.error || "Could not upload the photo");
          return;
        }
        image = String(uploaded.url || "");
      }
      const existing = menuForm.id
        ? dash.menu.find((m: any) => m.id === menuForm.id)
        : null;
      const item = {
        ...(existing || {}),
        id: menuForm.id || undefined,
        name: menuForm.name.trim(),
        category: menuForm.category.trim(),
        description: menuForm.description.trim(),
        price,
        isVeg: menuForm.isVeg,
        available: menuForm.available,
        image: image || undefined,
      };
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "menu_upsert", item, actor: user.email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMenuNotice(json.error || "Could not save menu item");
        return;
      }
      setMenuNotice(`${json.item.name} saved.`);
      resetMenuForm();
      load();
    } finally {
      setMenuBusy(false);
    }
  }

  async function removeMenuItem(id: string, name: string) {
    if (!user) return;
    if (!window.confirm(`Delete ${name} from the menu?`)) return;
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "menu_delete", id, actor: user.email }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMenuNotice(json.error || "Could not delete menu item");
      return;
    }
    if (menuForm.id === id) resetMenuForm();
    setMenuNotice(`${name} deleted.`);
    load();
  }
  const title =
    tab === "petpooja"
      ? "Petpooja"
      : tabs.find((t) => t.id === tab)?.label || "Overview";
  const canTakeOrder =
    user.role === "waiter" || user.role === "reception" || user.role === "owner";
  const ordering = dash?.ordering as OrderingStatus | undefined;
  const cafeAcceptingOrders = ordering ? ordering.acceptingOrders : true;
  const billRequests: {
    sessionId: string;
    tableId: string;
    guestName: string;
    requestedAt: string;
    assignedWaiterId: string | null;
    total: number;
  }[] = canTakeOrder ? dash.billRequests || [] : [];
  const tableSwitchRequests: {
    sessionId: string;
    tableId: string;
    guestName: string;
    reason: string;
    requestedAt: string;
    assignedWaiterId: string | null;
  }[] = canTakeOrder ? dash.tableSwitchRequests || [] : [];
  const freeTables: { id: string; label: string }[] = dash.freeTables || [];
  const canSettleBill = user.role === "owner" || user.role === "reception";
  const canGenerateBill =
    user.role === "waiter" || user.role === "reception" || user.role === "owner";
  const canMarkPaid =
    user.role === "waiter" || user.role === "reception" || user.role === "owner";
  const canControlOrdering = user.role === "owner" || user.role === "reception";
  const canSwitchTable =
    user.role === "waiter" || user.role === "reception" || user.role === "owner";

  async function approveGuestSwitch(sessionId: string) {
    if (!user) return;
    const toTableId = switchPick[sessionId] || freeTables[0]?.id;
    if (!toTableId) {
      setOrderNotice("No free tables available to switch to.");
      return;
    }
    setSwitchBusyId(sessionId);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_table_switch",
          sessionId,
          toTableId,
          actor: user.email,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrderNotice(json.error || "Could not switch the table.");
        return;
      }
      setOrderNotice(
        `Moved session to table ${String(toTableId).replace("lunar-", "").toUpperCase()}.`,
      );
      setSwitchPick((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
      load();
    } finally {
      setSwitchBusyId(null);
    }
  }

  async function rejectGuestSwitch(sessionId: string) {
    if (!user) return;
    setSwitchBusyId(sessionId);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject_table_switch",
          sessionId,
          actor: user.email,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrderNotice(json.error || "Could not reject the switch request.");
        return;
      }
      setOrderNotice("Table switch request declined.");
      load();
    } finally {
      setSwitchBusyId(null);
    }
  }

  function openStaffSwitch(session: { id: string; tableId: string }) {
    setStaffSwitch({
      sessionId: session.id,
      fromTableId: session.tableId,
      tableLabel: session.tableId.replace("lunar-", "").toUpperCase(),
    });
    setStaffSwitchTo(freeTables[0]?.id || "");
    setStaffSwitchReason("");
    setStaffSwitchError("");
  }

  function cancelStaffSwitch() {
    if (staffSwitchBusy) return;
    setStaffSwitch(null);
    setStaffSwitchTo("");
    setStaffSwitchReason("");
    setStaffSwitchError("");
  }

  async function confirmStaffSwitch() {
    if (!staffSwitch || !user) return;
    if (!staffSwitchTo) {
      setStaffSwitchError("Pick a free table.");
      return;
    }
    if (staffSwitchReason.trim().length < 3) {
      setStaffSwitchError("Enter a short reason for the switch.");
      return;
    }
    setStaffSwitchBusy(true);
    setStaffSwitchError("");
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "staff_table_switch",
          sessionId: staffSwitch.sessionId,
          toTableId: staffSwitchTo,
          reason: staffSwitchReason.trim(),
          actor: user.email,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStaffSwitchError(json.error || "Could not switch the table.");
        return;
      }
      setOrderNotice(
        `Switched ${staffSwitch.tableLabel} → ${staffSwitchTo.replace("lunar-", "").toUpperCase()}.`,
      );
      setStaffSwitch(null);
      setStaffSwitchTo("");
      setStaffSwitchReason("");
      load();
    } finally {
      setStaffSwitchBusy(false);
    }
  }

  async function setOrdering(patch: Record<string, unknown>) {
    await action({ action: "set_ordering", ...patch });
  }

  async function extendHours() {
    setExtendError("");
    if (!extendUntil) {
      setExtendError("Enter a close time");
      return;
    }
    setExtendBusy(true);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend_hours",
          hoursEnd: extendUntil,
          actor: user?.email,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExtendError(json.error || "Could not extend cafe hours");
        return;
      }
      setExtendUntil("");
      setOrderNotice(
        json.ordering?.hoursLabel
          ? `Tonight's hours are now ${json.ordering.hoursLabel}.`
          : "Cafe hours extended for tonight.",
      );
      load();
    } finally {
      setExtendBusy(false);
    }
  }

  function requestCloseCafe() {
    setCloseCafeOpen(true);
  }

  function cancelCloseCafe() {
    if (closeCafeBusy) return;
    setCloseCafeOpen(false);
  }

  async function confirmCloseCafe() {
    setCloseCafeBusy(true);
    try {
      await setOrdering({ ordersOpen: false });
      setCloseCafeOpen(false);
    } finally {
      setCloseCafeBusy(false);
    }
  }

  function requestMarkPaid(session: {
    id: string;
    tableId: string;
    billGeneratedAt?: string;
    paidAt?: string;
    billNumber?: number;
    bill?: { grandTotal?: number };
  }) {
    if (!session?.billGeneratedAt || session.paidAt) return;
    setPayMethod("cash");
    setPayBill({
      sessionId: session.id,
      tableLabel: session.tableId.replace("lunar-", ""),
      total: session.bill?.grandTotal || 0,
      billNumber: session.billNumber,
    });
  }

  function cancelMarkPaid() {
    if (payBusy) return;
    setPayBill(null);
  }

  async function confirmMarkPaid() {
    if (!payBill) return;
    setPayBusy(true);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close_pay",
          sessionId: payBill.sessionId,
          paymentMethod: payMethod,
          actor: user?.email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrderNotice(data.error || "Could not mark the bill as paid.");
        return;
      }
      setOrderNotice(
        `Table ${payBill.tableLabel} · bill #${payBill.billNumber || "—"} marked paid (${payMethod}).`,
      );
      setPayBill(null);
      load();
    } finally {
      setPayBusy(false);
    }
  }

  const activeSessions = dash.activeSessions || [];
  const floorSessions = activeSessions.filter(
    (s: { channel?: string }) => !s.channel || s.channel === "dine_in",
  );
  const onlineSessions = activeSessions.filter(
    (s: { channel?: string }) => s.channel === "swiggy" || s.channel === "zomato",
  );
  const takeawaySessions = activeSessions.filter(
    (s: { channel?: string }) => s.channel === "takeaway",
  );
  const closeCafePending = {
    openTables: floorSessions.length,
    billsNotGenerated: floorSessions.filter((s: any) => !s.billGeneratedAt).length,
    unpaidBills: floorSessions.filter((s: any) => s.billGeneratedAt && !s.paidAt).length,
    paymentApprovals: floorSessions.filter((s: any) => s.paymentAwaitingApproval).length,
    initiatedBills: floorSessions.filter(
      (s: any) => s.billRequestedAt && !s.billGeneratedAt,
    ).length,
    tables: floorSessions.map((s: any) => ({
      label: String(s.tableId || "").replace("lunar-", ""),
      status: s.paidAt
        ? "Paid"
        : s.paymentAwaitingApproval
          ? "Payment pending"
          : s.billGeneratedAt
            ? `Bill #${s.billNumber} unpaid`
            : s.billRequestedAt
              ? "Initiated bill"
              : "Open · no bill yet",
      total: s.bill?.grandTotal || 0,
    })),
  };
  const closeCafeHasPending =
    closeCafePending.openTables > 0 ||
    closeCafePending.unpaidBills > 0 ||
    closeCafePending.paymentApprovals > 0;

  const paymentApprovals: {
    sessionId: string;
    tableId: string;
    billNumber?: number;
    guestName: string;
    submittedAt: string;
    paymentMethod: string;
    total: number;
  }[] = canSettleBill ? dash.paymentApprovals || [] : [];

  function openOrder(tableId: string) {
    setOrderNotice("");
    setOrderTable({ id: tableId, label: tableId.replace("lunar-", "") });
  }

  // Mobile bottom bar: show up to 4 main tabs, put the rest under "More"
  const MOBILE_PRIMARY = 4;
  const fitsAll = tabs.length <= MOBILE_PRIMARY + 1;
  const primaryTabs = fitsAll ? tabs : tabs.slice(0, MOBILE_PRIMARY);
  const overflowTabs = fitsAll ? [] : tabs.slice(MOBILE_PRIMARY);
  const overflowCount = overflowTabs.reduce(
    (sum, t) => sum + (((t as any).count as number | undefined) || 0),
    0,
  );

  async function signOut() {
    await fetch("/api/staff/logout", { method: "POST" }).catch(() => {});
    clearStaffSession();
    router.push("/staff/login");
  }

  async function savePassword() {
    setPasswordBusy(true);
    setPasswordErr("");
    setPasswordMsg("");
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "staff_change_password",
          currentPassword,
          password: nextPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        clearStaffSession();
        router.replace("/staff/login");
        return;
      }
      if (!res.ok) {
        setPasswordErr(data.error || "Could not update password");
        return;
      }
      setCurrentPassword("");
      setNextPassword("");
      setPasswordMsg("Password updated.");
    } catch {
      setPasswordErr("Could not update password");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function downloadBackup() {
    const res = await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export_backup" }),
    });
    if (res.status === 401) {
      clearStaffSession();
      router.replace("/staff/login");
      return;
    }
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lunar-cafe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="staff-shell">
      <header className="staff-mobile-top no-print">
        <div className="staff-mobile-brand">
          <span className="brand-mark">
            <Image src={CAFE_MEDIA.logo} alt="" fill sizes="36px" className="cover" />
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
        </div>
        <div className="staff-mobile-actions">
          <button
            type="button"
            className={clsx("staff-alert-btn", unreadAlerts.length > 0 && "has-unread")}
            onClick={() => setAlertsOpen((v) => !v)}
            aria-label={
              unreadAlerts.length ? `${unreadAlerts.length} new alerts` : "Staff alerts"
            }
          >
            <Bell size={18} />
            {unreadAlerts.length > 0 && (
              <em>{unreadAlerts.length > 99 ? "99+" : unreadAlerts.length}</em>
            )}
          </button>
          <button type="button" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
          <Link href="/" aria-label="Public site">
            <Globe size={18} />
          </Link>
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            aria-label="Account and password"
          >
            <KeyRound size={18} />
          </button>
          <button type="button" onClick={signOut} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {moreOpen && (
        <div
          className="staff-more-backdrop no-print"
          role="presentation"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="staff-more-sheet"
            role="dialog"
            aria-label="More sections"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="staff-more-grip" aria-hidden />
            <div className="staff-more-grid">
              {overflowTabs.map((t) => {
                const Icon = t.icon;
                const count = (t as any).count as number | undefined;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={clsx("staff-more-item", tab === t.id && "on")}
                    onClick={() => {
                      setTab(t.id);
                      setMoreOpen(false);
                    }}
                  >
                    <span className="staff-mobile-tab-icon">
                      <Icon size={22} />
                      {!!count && <em>{count > 99 ? "99+" : count}</em>}
                    </span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="staff-mobile-nav no-print" aria-label="Staff sections">
        {primaryTabs.map((t) => {
          const Icon = t.icon;
          const count = (t as any).count as number | undefined;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setMoreOpen(false);
              }}
              className={clsx("staff-mobile-tab", tab === t.id && "on")}
              aria-current={tab === t.id ? "page" : undefined}
            >
              <span className="staff-mobile-tab-icon">
                <Icon size={20} />
                {!!count && <em>{count > 99 ? "99+" : count}</em>}
              </span>
              <span>{t.label}</span>
            </button>
          );
        })}
        {overflowTabs.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={clsx(
              "staff-mobile-tab",
              (moreOpen || overflowTabs.some((t) => t.id === tab)) && "on",
            )}
            aria-expanded={moreOpen}
            aria-label="Menu"
          >
            <span className="staff-mobile-tab-icon">
              <MenuIcon size={20} />
              {overflowCount > 0 && <em>{overflowCount > 99 ? "99+" : overflowCount}</em>}
            </span>
            <span>Menu</span>
          </button>
        )}
      </nav>

      <aside className="staff-side no-print">
        <div className="brand staff-brand" style={{ marginBottom: "1.4rem", padding: "0 0.4rem" }}>
          <span className="brand-mark">
            <Image src={CAFE_MEDIA.logo} alt="" fill sizes="42px" className="cover" />
          </span>
          <span className="brand-text">
            <strong style={{ fontSize: "1.1rem" }}>LUNAR</strong>
            <small>STAFF</small>
          </span>
        </div>
        <nav className="staff-nav" aria-label="Staff">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx("staff-nav-btn", tab === t.id && "on")}
              >
                <Icon size={18} />
                {t.label}
                {!!(t as any).count && <span className="staff-nav-count">{(t as any).count}</span>}
              </button>
            );
          })}
        </nav>
        <div className="staff-foot">
          <div className="staff-foot-user">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <div className="staff-foot-actions" role="group" aria-label="Account actions">
            <Link href="/" className="staff-foot-icon" title="Public site" aria-label="Public site">
              <Globe size={18} />
            </Link>
            <button
              type="button"
              className="staff-foot-icon"
              title="Password"
              aria-label="Password"
              onClick={() => setAccountOpen(true)}
            >
              <KeyRound size={18} />
            </button>
            {user.role === "owner" && (
              <button
                type="button"
                className={clsx("staff-foot-icon", tab === "petpooja" && "on")}
                title="Petpooja"
                aria-label="Petpooja"
                onClick={() => setTab("petpooja")}
              >
                <Store size={18} />
              </button>
            )}
            {user.role === "owner" && (
              <button
                type="button"
                className="staff-foot-icon"
                title="Backup"
                aria-label="Backup"
                onClick={() => void downloadBackup()}
              >
                <Download size={18} />
              </button>
            )}
            <button
              type="button"
              className="staff-foot-icon"
              title="Sign out"
              aria-label="Sign out"
              onClick={signOut}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className={clsx("staff-main", tab === "kitchen" && "staff-main-kitchen")}>
        <div className="staff-title">
          <div>
            <span className="eyebrow">Lunar Cafe · live</span>
            <h1 className="h-display h-lg" style={{ marginTop: 6 }}>{title}</h1>
          </div>
          <div className="staff-title-actions" ref={alertsRef}>
            <button
              type="button"
              className={clsx("staff-alert-btn staff-alert-btn-desktop", unreadAlerts.length > 0 && "has-unread")}
              onClick={() => setAlertsOpen((v) => !v)}
              aria-label={
                unreadAlerts.length ? `${unreadAlerts.length} new alerts` : "Staff alerts"
              }
            >
              <Bell size={16} />
              {unreadAlerts.length > 0 && (
                <em>{unreadAlerts.length > 99 ? "99+" : unreadAlerts.length}</em>
              )}
            </button>
            <NeoButton variant="ghost" onClick={() => void load()} className="staff-refresh-desktop">
              <RefreshCw size={15} /> Refresh
            </NeoButton>
            {alertsOpen && (
              <div className="staff-alert-panel" role="dialog" aria-label="Staff alerts">
                <div className="staff-alert-panel-head">
                  <strong>Alerts</strong>
                  {unreadAlerts.length > 0 && (
                    <button
                      type="button"
                      className="staff-alert-mark"
                      onClick={() => action({ action: "ack_all_alerts" })}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {myAlerts.length === 0 && <p className="muted">No table assignment alerts yet.</p>}
                <ul>
                  {myAlerts.slice(0, 20).map((alert) => {
                    const unread = !alert.readByStaffIds?.includes(user.id);
                    return (
                      <li key={alert.id} className={clsx(unread && "is-unread")}>
                        <button
                          type="button"
                          onClick={() => unread && action({ action: "ack_alert", alertId: alert.id })}
                        >
                          <span>{alert.message}</span>
                          <small>
                            {alert.tableLabel} · {waitLabel(alert.createdAt)}
                            {unread ? " · new" : ""}
                          </small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {ordering && (
          <div
            className={clsx(
              "cafe-order-status",
              ordering.closingSoon && "is-closing",
              ordering.acceptingOrders ? "is-open" : "is-closed",
            )}
          >
            <div className="cafe-order-status-copy">
              {ordering.acceptingOrders ? <DoorOpen size={18} /> : <DoorClosed size={18} />}
              <div>
                <strong>
                  {ordering.acceptingOrders ? "Accepting orders" : "Not accepting orders"}
                </strong>
                <span>
                  Hours {ordering.hoursLabel}
                  {ordering.hoursExtended ? " · extended tonight" : ""}
                  {" · now "}
                  {ordering.localTimeLabel}
                  {!ordering.withinHours ? " · outside hours" : ""}
                  {ordering.allowAfterHours ? " · after-hours allowed" : ""}
                </span>
                {ordering.closingSoon && ordering.minutesUntilClose != null && (
                  <strong className="cafe-close-countdown">
                    Cafe closes in {ordering.minutesUntilClose} min
                  </strong>
                )}
                {ordering.inGrace && !ordering.allowAfterHours && ordering.graceMinutesLeft != null && (
                  <strong className="cafe-close-countdown">
                    Cafe is closed. Close every open table in {ordering.graceMinutesLeft} min
                    or they close automatically.
                  </strong>
                )}
              </div>
            </div>
            {canControlOrdering && (
              <div className="cafe-order-status-actions">
                <NeoButton
                  className="btn-sm"
                  variant={ordering.ordersOpen ? "ghost" : undefined}
                  onClick={() =>
                    ordering.ordersOpen
                      ? requestCloseCafe()
                      : setOrdering({ ordersOpen: true })
                  }
                >
                  {ordering.ordersOpen ? "Close cafe" : "Open cafe"}
                </NeoButton>
                <NeoButton
                  className="btn-sm"
                  variant="ghost"
                  onClick={() =>
                    setOrdering({ allowAfterHours: !ordering.allowAfterHours })
                  }
                >
                  {ordering.allowAfterHours ? "Lock to hours" : "Allow after hours"}
                </NeoButton>
                {(dash.unsettledBills?.length || 0) > 0 && (
                  <NeoButton className="btn-sm" variant="ghost" onClick={() => setTab("unsettled")}>
                    Unsettled bills ({dash.unsettledBills?.length || 0})
                  </NeoButton>
                )}
              </div>
            )}
            {canControlOrdering && ordering.closingSoon && (
              <form
                className="cafe-extend"
                onSubmit={(e) => {
                  e.preventDefault();
                  void extendHours();
                }}
              >
                <label className="neo-field">
                  <span>Stay open until</span>
                  <input
                    className="neo-input"
                    type="time"
                    value={extendUntil}
                    onChange={(e) => setExtendUntil(e.target.value)}
                    required
                  />
                </label>
                <NeoButton type="submit" className="btn-sm" disabled={extendBusy}>
                  {extendBusy ? "Saving…" : "Extend cafe hours"}
                </NeoButton>
                <p className="cafe-extend-note">
                  Tonight only. The 30-minute warning shows again before the new close time.
                </p>
                {extendError && <p className="cafe-extend-error">{extendError}</p>}
              </form>
            )}
          </div>
        )}

        {orderNotice && <p className="order-notice">{orderNotice}</p>}

        {tableSwitchRequests.length > 0 && (
          <section className="bill-request-board" aria-label="Guests requesting a table switch">
            {tableSwitchRequests.map((request) => {
              const waiter = waiters.find((w: StaffUser) => w.id === request.assignedWaiterId);
              const tableLabel = request.tableId.replace("lunar-", "");
              const pick = switchPick[request.sessionId] || freeTables[0]?.id || "";
              return (
                <article key={request.sessionId} className="bill-request-card table-switch-card">
                  <div>
                    <strong>
                      <ArrowLeftRight size={16} /> {tableLabel} · Switch table
                      {request.guestName ? ` · ${request.guestName}` : ""}
                    </strong>
                    <p>
                      {request.reason || "No reason given"} · {waitLabel(request.requestedAt)}
                      {waiter ? ` · Assigned to ${waiter.name}` : ""}
                    </p>
                  </div>
                  {canSwitchTable ? (
                    <div className="table-switch-actions">
                      <label className="neo-field table-switch-pick">
                        <span>Move to</span>
                        <select
                          className="neo-input"
                          value={pick}
                          onChange={(e) =>
                            setSwitchPick((prev) => ({
                              ...prev,
                              [request.sessionId]: e.target.value,
                            }))
                          }
                          disabled={switchBusyId === request.sessionId || freeTables.length === 0}
                        >
                          {freeTables.length === 0 && <option value="">No free tables</option>}
                          {freeTables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <NeoButton
                        className="btn-sm"
                        disabled={
                          switchBusyId === request.sessionId || !pick || freeTables.length === 0
                        }
                        onClick={() => void approveGuestSwitch(request.sessionId)}
                      >
                        {switchBusyId === request.sessionId ? "Moving…" : "Approve"}
                      </NeoButton>
                      <NeoButton
                        variant="ghost"
                        className="btn-sm"
                        disabled={switchBusyId === request.sessionId}
                        onClick={() => void rejectGuestSwitch(request.sessionId)}
                      >
                        Reject
                      </NeoButton>
                    </div>
                  ) : (
                    <span className="neo-badge neo-badge-gold">Switch requested</span>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {billRequests.length > 0 && (
          <section className="bill-request-board" aria-label="Guests requesting the bill">
            {billRequests.map((request) => {
              const waiter = waiters.find((w: StaffUser) => w.id === request.assignedWaiterId);
              const tableLabel = request.tableId.replace("lunar-", "");
              return (
                <article key={request.sessionId} className="bill-request-card">
                  <div>
                    <strong>
                      <Bell size={16} /> {tableLabel} · Initiated bill
                      {request.guestName ? ` · ${request.guestName}` : ""}
                    </strong>
                    <p>
                      {formatMoney(request.total)} · {waitLabel(request.requestedAt)}
                      {waiter ? ` · Assigned to ${waiter.name}` : ""}
                    </p>
                  </div>
                  {canGenerateBill ? (
                    <NeoButton
                      className="btn-sm"
                      onClick={() =>
                        requestGenerateBill(
                          dash.activeSessions.find((s: { id: string }) => s.id === request.sessionId),
                        )
                      }
                    >
                      <Receipt size={15} /> Generate bill
                    </NeoButton>
                  ) : (
                    <span className="neo-badge neo-badge-rose">Initiated bill</span>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {paymentApprovals.length > 0 && (
          <section className="bill-request-board" aria-label="Payments waiting for approval">
            {paymentApprovals.map((pay) => {
              const tableLabel = pay.tableId.replace("lunar-", "");
              return (
                <article key={pay.sessionId} className="bill-request-card payment-approval-card">
                  <div>
                    <strong>
                      <Wallet size={16} /> {tableLabel} · {pay.guestName} paid via {String(pay.paymentMethod).toUpperCase()}
                    </strong>
                    <p>
                      {formatMoney(pay.total)}
                      {pay.billNumber ? ` · Bill #${pay.billNumber}` : ""} · {waitLabel(pay.submittedAt)}
                    </p>
                  </div>
                  <NeoButton
                    className="btn-sm"
                    onClick={() =>
                      action({ action: "approve_payment", sessionId: pay.sessionId })
                    }
                  >
                    Approve &amp; close
                  </NeoButton>
                </article>
              );
            })}
          </section>
        )}

        {tab === "overview" && (
          <>
            <div className="kpi-grid">
              <Kpi label="Open tables" value={dash.stats.openTables} icon={<Armchair size={18} />} />
              <Kpi label="Online open" value={dash.stats.openOnline || 0} icon={<Smartphone size={18} />} />
              <Kpi label="Takeaway open" value={dash.stats.openTakeaway || 0} icon={<ShoppingBag size={18} />} />
              <Kpi label="In kitchen" value={dash.kitchenItems.length} icon={<Flame size={18} />} />
            </div>
            <h2 className="h-display h-md" style={{ margin: "2rem 0 1rem" }}>Tables right now</h2>
            <div className="table-map">
              {dash.tables.map((t: any) => {
                const s = floorSessions.find((x: any) => x.tableId === t.id);
                return (
                  <div
                    key={t.id}
                    className={clsx(
                      "table-tile table-tile-compact",
                      s ? "busy" : "free",
                      canTakeOrder && s?.billRequestedAt && !s?.billGeneratedAt && "wants-bill",
                    )}
                  >
                    <div className="table-tile-head">
                      <strong className="table-tile-id">{t.id.replace("lunar-", "")}</strong>
                      <span className={clsx("neo-badge", s ? "neo-badge-gold" : "neo-badge-mint")}>
                        {s ? "Occupied" : "Free"}
                      </span>
                    </div>
                    {s ? (
                      <b className="table-tile-total">{formatMoney(s.bill.grandTotal)}</b>
                    ) : (
                      <span className="table-tile-status muted">Ready for guests</span>
                    )}
                    {canTakeOrder && s?.billRequestedAt && !s?.billGeneratedAt && (
                      <span className="neo-badge neo-badge-rose">
                        Initiated bill
                      </span>
                    )}
                    {canTakeOrder && s?.tableSwitchRequestedAt && (
                      <span className="neo-badge neo-badge-gold">Switch requested</span>
                    )}
                    {s?.tableSwitches?.length > 0 && (
                      <span className="muted" style={{ fontSize: "0.72rem" }}>
                        Switched from{" "}
                        {s.tableSwitches[s.tableSwitches.length - 1].fromTableId
                          .replace("lunar-", "")
                          .toUpperCase()}
                      </span>
                    )}
                    <div className="table-tile-cta-row">
                      {canTakeOrder && cafeAcceptingOrders && !s?.billGeneratedAt && (
                        <NeoButton className="btn-sm" onClick={() => openOrder(t.id)} aria-label="Take order">
                          <span className="table-tile-cta-ico" aria-hidden>
                            <UtensilsCrossed size={15} />
                          </span>
                          Order
                        </NeoButton>
                      )}
                      {s && canGenerateBill && !s.billGeneratedAt && s.bill?.totalQty > 0 && (
                        <NeoButton
                          className="btn-sm"
                          variant="ghost"
                          onClick={() => requestGenerateBill(s)}
                          aria-label="Generate bill"
                        >
                          <span className="table-tile-cta-ico" aria-hidden>
                            <Receipt size={15} />
                          </span>
                          Bill
                        </NeoButton>
                      )}
                      {s && canSwitchTable && !s.billGeneratedAt && (
                        <NeoButton
                          className="btn-sm"
                          variant="ghost"
                          onClick={() => openStaffSwitch(s)}
                          aria-label="Switch table"
                          disabled={freeTables.length === 0}
                        >
                          <span className="table-tile-cta-ico" aria-hidden>
                            <ArrowLeftRight size={15} />
                          </span>
                          Switch
                        </NeoButton>
                      )}
                      {s?.billGeneratedAt && !s.paidAt && (
                        <>
                          <Link href={`/staff/bill/${s.id}`} className="btn neo-btn-ghost btn-sm" aria-label="Print bill">
                            <span className="table-tile-cta-ico" aria-hidden>
                              <Printer size={15} />
                            </span>
                            Print
                          </Link>
                          {canMarkPaid && (
                            <NeoButton
                              className="btn-sm"
                              onClick={() => requestMarkPaid(s)}
                              aria-label="Mark bill paid"
                            >
                              <span className="table-tile-cta-ico" aria-hidden>
                                <Banknote size={15} />
                              </span>
                              Bill paid
                            </NeoButton>
                          )}
                        </>
                      )}
                    </div>
                    {canTakeOrder && !cafeAcceptingOrders && !s?.billGeneratedAt && (
                      <span className="muted" style={{ fontSize: "0.78rem" }}>
                        Ordering closed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "tables" && (
          <div className="tables-board">
            {user.role === "owner" && (
              <div className="tables-board-bar">
                <NeoButton variant="ghost" className="btn-sm" onClick={beginAddTable}>
                  Add table
                </NeoButton>
              </div>
            )}
            {user.role === "owner" && tableFormOpen && (
              <section className="team-form-card" ref={tableFormRef}>
                <h2 className="h-display h-md" style={{ margin: 0 }}>
                  {editingTableId ? "Edit table" : "Add table"}
                </h2>
                <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.88rem" }}>
                  Indoor tables use I numbers, outdoor use O. Leave number blank to auto-assign the next free one.
                </p>
                <div className="team-form-grid">
                  <NeoSelect
                    label="Section"
                    value={tableForm.section}
                    onChange={(e) =>
                      setTableForm((f) => ({
                        ...f,
                        section: e.target.value as TableSection,
                      }))
                    }
                  >
                    <option value="outdoor">Outdoor</option>
                    <option value="indoor">Indoor</option>
                  </NeoSelect>
                  <NeoInput
                    label="Number"
                    type="number"
                    min={1}
                    value={tableForm.number}
                    onChange={(e) => setTableForm((f) => ({ ...f, number: e.target.value }))}
                    placeholder="Auto"
                  />
                  <NeoInput
                    label="Label (optional)"
                    value={tableForm.label}
                    onChange={(e) => setTableForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Lunar O16"
                  />
                </div>
                {tableNotice && <p className="order-notice">{tableNotice}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <NeoButton disabled={tableBusy} onClick={saveTable}>
                    {tableBusy ? "Saving…" : editingTableId ? "Save table" : "Add table"}
                  </NeoButton>
                  <NeoButton variant="ghost" onClick={resetTableForm}>
                    Cancel
                  </NeoButton>
                </div>
              </section>
            )}
          <div className="table-map">
            {dash.tables.map((t: any) => {
              const session = floorSessions.find((s: any) => s.tableId === t.id);
              const waiter = waiters.find((w: StaffUser) => w.id === t.assignedWaiterId);
              return (
                <div
                  key={t.id}
                  className={clsx(
                    "table-tile",
                    session ? "busy" : "free",
                    session?.billRequestedAt && !session?.billGeneratedAt && "wants-bill",
                    editingTableId === t.id && "is-editing",
                  )}
                >
                  <div className="table-tile-head">
                    <strong className="table-tile-id">{t.id.replace("lunar-", "")}</strong>
                    <div className="table-tile-badges">
                      <span
                        className={clsx(
                          "neo-badge",
                          session ? "neo-badge-gold" : "neo-badge-mint",
                        )}
                      >
                        {session ? "Occupied" : "Available"}
                      </span>
                      <span className="neo-badge neo-badge-ink">{t.section}</span>
                      {session?.billRequestedAt && !session?.billGeneratedAt && (
                        <span className="neo-badge neo-badge-rose">
                          Initiated bill
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="table-tile-body">
                    {session ? (
                      <>
                        <div className="table-code-row">
                          <span className="muted">Code</span>
                          <b className="table-code">{session.groupCode}</b>
                          <button
                            type="button"
                            className="table-code-refresh"
                            title="Refresh code"
                            aria-label="Refresh code"
                            onClick={() => action({ action: "regenerate_code", sessionId: session.id })}
                          >
                            <RefreshCw size={15} />
                          </button>
                        </div>
                        <div className="table-guests">
                          {session.members.length}{" "}
                          {session.members.length === 1 ? "guest" : "guests"}
                        </div>
                        <b className="table-tile-total">{formatMoney(session.bill.grandTotal)}</b>
                      </>
                    ) : (
                      <>
                        <div className="table-code-row table-code-row-empty">
                          <span className="muted">Code</span>
                          <span className="table-code muted">—</span>
                        </div>
                        <div className="table-guests muted">No guests</div>
                        <b className="table-tile-total table-tile-total-empty muted">Available</b>
                      </>
                    )}
                  </div>
                  <div className="table-tile-actions">
                    <div className="table-tile-cta-row">
                      {canTakeOrder && cafeAcceptingOrders && !session?.billGeneratedAt && (
                        <NeoButton className="btn-sm" onClick={() => openOrder(t.id)} aria-label="Take order">
                          <span className="table-tile-cta-ico" aria-hidden>
                            <UtensilsCrossed size={15} />
                          </span>
                          Order
                        </NeoButton>
                      )}
                      {session && canGenerateBill && !session.billGeneratedAt && session.bill?.totalQty > 0 && (
                        <NeoButton
                          className="btn-sm"
                          variant="ghost"
                          onClick={() => requestGenerateBill(session)}
                          aria-label="Generate bill"
                        >
                          <span className="table-tile-cta-ico" aria-hidden>
                            <Receipt size={15} />
                          </span>
                          Bill
                        </NeoButton>
                      )}
                      {session && canSwitchTable && !session.billGeneratedAt && (
                        <NeoButton
                          className="btn-sm"
                          variant="ghost"
                          onClick={() => openStaffSwitch(session)}
                          aria-label="Switch table"
                          disabled={freeTables.length === 0}
                        >
                          <span className="table-tile-cta-ico" aria-hidden>
                            <ArrowLeftRight size={15} />
                          </span>
                          Switch
                        </NeoButton>
                      )}
                      {session?.billGeneratedAt && !session.paidAt && (
                        <>
                          <Link
                            href={`/staff/bill/${session.id}`}
                            className="btn neo-btn-ghost btn-sm"
                            aria-label="Print bill"
                          >
                            <span className="table-tile-cta-ico" aria-hidden>
                              <Printer size={15} />
                            </span>
                            Print
                          </Link>
                          {canMarkPaid && (
                            <NeoButton
                              className="btn-sm"
                              onClick={() => requestMarkPaid(session)}
                              aria-label="Mark bill paid"
                            >
                              <span className="table-tile-cta-ico" aria-hidden>
                                <Banknote size={15} />
                              </span>
                              Bill paid
                            </NeoButton>
                          )}
                        </>
                      )}
                    </div>
                    {session?.tableSwitchRequestedAt && (
                      <span className="neo-badge neo-badge-gold">Switch requested</span>
                    )}
                    {session?.tableSwitches?.length > 0 && (
                      <span className="muted" style={{ fontSize: "0.75rem" }}>
                        Switched from{" "}
                        {session.tableSwitches[session.tableSwitches.length - 1].fromTableId
                          .replace("lunar-", "")
                          .toUpperCase()}{" "}
                        → {session.tableId.replace("lunar-", "").toUpperCase()}
                      </span>
                    )}
                    {canTakeOrder && !cafeAcceptingOrders && !session?.billGeneratedAt && (
                      <span className="muted" style={{ fontSize: "0.78rem" }}>
                        Ordering closed
                      </span>
                    )}
                    <NeoSelect
                      label="Waiter"
                      value={t.assignedWaiterId || ""}
                      onChange={(e) => requestReassign(t, e.target.value || null)}
                    >
                      <option value="">Unassigned</option>
                      {waiters.map((w: StaffUser) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </NeoSelect>
                    {user.role === "owner" && (
                      <div className="table-tile-icons">
                        <button
                          type="button"
                          className={clsx("table-icon-btn", editingTableId === t.id && "is-on")}
                          aria-label={`Edit ${t.label}`}
                          title="Edit table"
                          onClick={() => beginEditTable(t)}
                        >
                          <Pencil size={15} />
                        </button>
                        {editingTableId === t.id && (
                          <button
                            type="button"
                            className="table-icon-btn danger"
                            aria-label={`Delete ${t.label}`}
                            title={session ? "Close this table before deleting" : "Delete table"}
                            disabled={Boolean(session)}
                            onClick={() => removeTable(t.id, t.label)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

        {tab === "approvals" && (
          <>
            <div style={{ maxWidth: 420, marginBottom: "1rem" }}>
              <NeoInput label="Reject reason (shown to guest)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div style={{ display: "grid", gap: "0.8rem", width: "100%" }}>
              {dash.pendingApprovals.map((o: any) => (
                <div key={o.id} className="ticket">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>
                      {(o.tableId || o.sessionTableId || "").replace("lunar-", "")}
                      {o.sessionTableId &&
                      o.tableId &&
                      o.sessionTableId !== o.tableId
                        ? ` → ${o.sessionTableId.replace("lunar-", "")}`
                        : ""}{" "}
                      · Token #{o.tokenNumber}
                    </strong>
                    <span className="neo-badge neo-badge-gold">Needs approval</span>
                  </div>
                  <p style={{ margin: "0.4rem 0" }}>
                    {o.qty}× <b>{o.name}</b> {o.variantLabel ? `(${o.variantLabel})` : ""}
                  </p>
                  {o.notes && <p className="muted" style={{ margin: 0 }}>Note: {o.notes}</p>}
                  <div className="ticket-actions">
                    <NeoButton className="btn-sm" onClick={() => action({ action: "approve", sessionId: o.sessionId, itemIds: [o.id] })}>
                      Approve → Kitchen
                    </NeoButton>
                    <NeoButton
                      variant="danger"
                      className="btn-sm"
                      onClick={() => action({ action: "reject", sessionId: o.sessionId, itemId: o.id, reason: rejectReason })}
                    >
                      Reject
                    </NeoButton>
                  </div>
                </div>
              ))}
              {dash.pendingApprovals.length === 0 && <Empty text="All caught up — no pending items." />}
            </div>
          </>
        )}

        {tab === "online" && (
          <DeskOrders
            kind="online"
            sessions={onlineSessions}
            accepting={cafeAcceptingOrders}
            busyId={deskBusy}
            onNew={setDeskOrder}
            onHandover={(sessionId) =>
              deskAction({ action: "hand_over_online", sessionId }, "Order handed over.")
            }
            onCancel={(session) => {
              setDeskCancel(session);
              setDeskCancelReason("");
              setDeskCancelError("");
            }}
            onBill={() => undefined}
            onPay={() => undefined}
          />
        )}

        {tab === "takeaway" && (
          <DeskOrders
            kind="takeaway"
            sessions={takeawaySessions}
            accepting={cafeAcceptingOrders}
            busyId={deskBusy}
            onNew={setDeskOrder}
            onHandover={() => undefined}
            onCancel={(session) => {
              setDeskCancel(session);
              setDeskCancelReason("");
              setDeskCancelError("");
            }}
            onBill={(session) =>
              requestGenerateBill({
                id: session.id,
                tableId: "takeaway",
                billGeneratedAt: session.billGeneratedAt,
                bill: session.bill,
              })
            }
            onPay={(session) => {
              setPayMethod("cash");
              setPayBill({
                sessionId: session.id,
                tableLabel: "Takeaway",
                total: session.bill?.grandTotal || 0,
                billNumber: session.billNumber,
              });
            }}
          />
        )}

        {tab === "petpooja" && user.role === "owner" && <PetpoojaGuide />}

        {tab === "kitchen" && (
          <div className="kitchen-board">
            {[
              { key: "queued", label: "New", hint: "Waiting to start", next: "preparing", cta: "Start preparing" },
              { key: "preparing", label: "Preparing", hint: "On the line", next: "ready", cta: "Mark ready" },
              { key: "ready", label: "Ready", hint: "Ready to serve", next: "served", cta: "Mark served" },
            ].map((col) => {
              const items = dash.kitchenItems.filter((o: any) => o.status === col.key);
              return (
                <section key={col.key} className={clsx("kitchen-col", col.key)}>
                  <header className="kitchen-col-head">
                    <div>
                      <h2>{col.label}</h2>
                      <p>{col.hint}</p>
                    </div>
                    <span className="kitchen-col-count">{items.length}</span>
                  </header>
                  <div className="kitchen-col-body">
                    {items.map((o: any) => (
                      <article key={o.id} className={clsx("kitchen-ticket", col.key)}>
                        <div className="kitchen-ticket-meta">
                          <span className="kitchen-ticket-table">
                            {o.channel === "swiggy"
                              ? "Swiggy"
                              : o.channel === "zomato"
                                ? "Zomato"
                                : o.channel === "takeaway"
                                  ? "Takeaway"
                                  : (o.tableId || o.sessionTableId || "").replace("lunar-", "")}
                            {o.channel === "dine_in" || !o.channel
                              ? o.sessionTableId &&
                                o.tableId &&
                                o.sessionTableId !== o.tableId
                                ? ` → ${String(o.sessionTableId).replace("lunar-", "")}`
                                : ""
                              : ""}
                          </span>
                          <span className="kitchen-ticket-token">#{o.tokenNumber}</span>
                        </div>
                        <p className="kitchen-ticket-item">
                          <span className="kitchen-ticket-qty">{o.qty}×</span>{" "}
                          {o.name}
                          {o.variantLabel ? ` · ${o.variantLabel}` : ""}
                        </p>
                        {(o.channel === "swiggy" || o.channel === "zomato" || o.channel === "takeaway") && (
                          <p className="kitchen-ticket-waiter">
                            {o.guestName || "Guest"}
                            {o.externalOrderId ? ` · ${o.externalOrderId}` : ""}
                          </p>
                        )}
                        {o.notes && <p className="kitchen-ticket-note">“{o.notes}”</p>}
                        {o.takenByStaffName && (
                          <p className="kitchen-ticket-waiter">
                            {o.isCoverOrder && o.assignedWaiterName
                              ? `Taken by ${o.takenByStaffName} · covering ${o.assignedWaiterName}`
                              : `Taken by ${o.takenByStaffName}`}
                          </p>
                        )}
                        <div className="kitchen-ticket-foot">
                          <span className="kitchen-ticket-time">
                            <Clock size={13} /> {waitLabel(o.createdAt)}
                          </span>
                          <NeoButton
                            className={clsx("btn-sm", col.key === "ready" && "kitchen-cta-ready")}
                            onClick={() =>
                              action({
                                action: "kitchen_status",
                                sessionId: o.sessionId,
                                itemIds: [o.id],
                                status: col.next,
                              })
                            }
                          >
                            {col.cta}
                          </NeoButton>
                        </div>
                      </article>
                    ))}
                    {items.length === 0 && <div className="kitchen-empty">No tickets</div>}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {(tab === "bills" || tab === "unsettled") && (
          <div className="bill-board">
            {(tab === "unsettled" ? dash.unsettledBills || [] : floorSessions).map((s: any) => {
              const tableLabel = s.tableId.replace("lunar-", "");
              const guests = s.members?.length || 0;
              const items = s.bill.totalQty || 0;
              const lines = billableOrders(s.orders || []);
              return (
                <article
                  key={s.id}
                  className={clsx(
                    "bill-card",
                    s.billRequestedAt && !s.billGeneratedAt && "wants-bill",
                    s.paymentAwaitingApproval && "payment-pending",
                  )}
                >
                  <header className="bill-card-head">
                    <div className="bill-card-meta">
                      <div className="bill-card-table">
                        <span className="bill-card-id">{tableLabel}</span>
                        <span className={clsx("neo-badge", s.billGeneratedAt ? "neo-badge-ink" : "neo-badge-mint")}>
                          {s.billGeneratedAt ? `Bill #${s.billNumber}` : "Open"}
                        </span>
                        {s.paymentAwaitingApproval && (
                          <span className="neo-badge neo-badge-rose">Payment to approve</span>
                        )}
                        {s.billRequestedAt && !s.billGeneratedAt && (
                          <span className="neo-badge neo-badge-rose">
                            Initiated bill
                          </span>
                        )}
                        {s.tableSwitchRequestedAt && (
                          <span className="neo-badge neo-badge-gold">Switch requested</span>
                        )}
                        {s.tableSwitches?.length > 0 && (
                          <span className="neo-badge neo-badge-mint">
                            Switched from{" "}
                            {s.tableSwitches[s.tableSwitches.length - 1].fromTableId
                              .replace("lunar-", "")
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="bill-card-chips">
                        <span>
                          <Users size={13} /> {guests} {guests === 1 ? "guest" : "guests"}
                        </span>
                        <span>
                          <Receipt size={13} /> {items} {items === 1 ? "item" : "items"}
                        </span>
                        <span className="bill-card-code">Code {s.groupCode}</span>
                      </div>
                    </div>
                    <div className="bill-card-total">
                      <small>Amount due</small>
                      <strong className="h-display">{formatMoney(s.bill.grandTotal)}</strong>
                    </div>
                  </header>

                  <div className="bill-items">
                    <div className="bill-items-head">
                      <span>Item</span>
                      <span>Qty</span>
                      <span>Price</span>
                      <span>Amt</span>
                    </div>
                    {lines.length === 0 && (
                      <p className="bill-items-empty muted">No billable items yet.</p>
                    )}
                    {lines.map((line) => (
                      <div key={line.id} className="bill-items-row">
                        <span className="bill-items-name">
                          {line.name}
                          {line.variantLabel ? ` · ${line.variantLabel}` : ""}
                          {(line.tableId || s.tableId) && (
                            <small className="bill-items-note">
                              Table {(line.tableId || s.tableId).replace("lunar-", "").toUpperCase()}
                              {line.tableId && line.tableId !== s.tableId
                                ? ` · now ${s.tableId.replace("lunar-", "").toUpperCase()}`
                                : ""}
                            </small>
                          )}
                          {line.notes ? (
                            <small className="bill-items-note">{line.notes}</small>
                          ) : null}
                        </span>
                        <span className="bill-items-qty">{line.qty}</span>
                        <span className="bill-items-price">{formatMoney(line.unitPrice)}</span>
                        <span className="bill-items-amt">
                          {formatMoney(line.unitPrice * line.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bill-card-grid">
                    <div className="bill-summary">
                      <div className="bill-summary-row">
                        <span>Subtotal</span>
                        <span>{formatMoney(s.bill.subtotal)}</span>
                      </div>
                      {s.bill.discountValue > 0 && (
                        <div className="bill-summary-row is-discount">
                          <span>Discount</span>
                          <span>- {formatMoney(s.bill.discountValue)}</span>
                        </div>
                      )}
                      <div className="bill-summary-row">
                        <span>Service</span>
                        <span>{formatMoney(s.bill.serviceCharge)}</span>
                      </div>
                      <div className="bill-summary-row">
                        <span>CGST + SGST</span>
                        <span>{formatMoney(s.bill.taxTotal)}</span>
                      </div>
                      {s.bill.roundOff !== 0 && (
                        <div className="bill-summary-row">
                          <span>Round off</span>
                          <span>{formatMoney(s.bill.roundOff)}</span>
                        </div>
                      )}
                      <div className="bill-summary-row is-total">
                        <span>Total</span>
                        <span>{formatMoney(s.bill.grandTotal)}</span>
                      </div>
                    </div>

                    {canSettleBill && (
                      <div className="bill-adjust">
                        <p className="bill-adjust-label">
                          {s.billGeneratedAt ? "Bill locked" : "Adjustments"}
                        </p>
                        <div className="bill-adjust-fields">
                          <NeoInput
                            label="Discount %"
                            type="number"
                            min={0}
                            defaultValue={s.discountPercent}
                            disabled={Boolean(s.billGeneratedAt)}
                            onBlur={(e) =>
                              action({
                                action: "update_billing",
                                sessionId: s.id,
                                patch: { discountPercent: Number(e.target.value) },
                              })
                            }
                          />
                          <NeoInput
                            label="Discount ₹"
                            type="number"
                            min={0}
                            defaultValue={s.discountAmount}
                            disabled={Boolean(s.billGeneratedAt)}
                            onBlur={(e) =>
                              action({
                                action: "update_billing",
                                sessionId: s.id,
                                patch: { discountAmount: Number(e.target.value) },
                              })
                            }
                          />
                          <NeoSelect
                            label="Service charge"
                            value={s.serviceChargeEnabled ? "on" : "off"}
                            disabled={Boolean(s.billGeneratedAt)}
                            onChange={(e) =>
                              action({
                                action: "update_billing",
                                sessionId: s.id,
                                patch: { serviceChargeEnabled: e.target.value === "on" },
                              })
                            }
                          >
                            <option value="on">On (5%)</option>
                            <option value="off">Removed</option>
                          </NeoSelect>
                          <NeoInput
                            label="Loyalty phone"
                            inputMode="tel"
                            placeholder="Optional"
                            defaultValue={s.loyaltyPhone || ""}
                            disabled={Boolean(s.billGeneratedAt)}
                            onBlur={(e) =>
                              action({
                                action: "update_billing",
                                sessionId: s.id,
                                patch: { loyaltyPhone: e.target.value },
                              })
                            }
                          />
                          <NeoInput
                            label={`Loyalty points (have ${s.loyaltyPoints || 0})`}
                            type="number"
                            min={0}
                            defaultValue={s.loyaltyPointsRedeemed || 0}
                            disabled={Boolean(s.billGeneratedAt)}
                            onBlur={(e) =>
                              action({
                                action: "update_billing",
                                sessionId: s.id,
                                patch: { loyaltyPointsRedeemed: Number(e.target.value) },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <footer className="bill-card-foot">
                    {canSettleBill && s.paymentAwaitingApproval ? (
                      <div className="bill-pay-group" role="group" aria-label="Approve guest payment">
                        <button
                          type="button"
                          className="bill-pay-btn"
                          onClick={() =>
                            action({ action: "approve_payment", sessionId: s.id })
                          }
                        >
                          <CheckCheck size={16} /> Approve payment &amp; close
                        </button>
                      </div>
                    ) : canGenerateBill && !s.billGeneratedAt ? (
                      <div className="bill-pay-group" role="group" aria-label="Generate bill">
                        <button
                          type="button"
                          className="bill-pay-btn"
                          onClick={() => requestGenerateBill(s)}
                        >
                          <Receipt size={16} /> Generate bill
                        </button>
                      </div>
                    ) : canMarkPaid && s.billGeneratedAt && !s.paidAt ? (
                      <div className="bill-pay-group" role="group" aria-label="Mark as paid">
                        <button
                          type="button"
                          className="bill-pay-btn"
                          onClick={() => requestMarkPaid(s)}
                        >
                          <Banknote size={16} /> Bill paid
                        </button>
                      </div>
                    ) : (
                      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                        {s.billGeneratedAt
                          ? `Generated bill #${s.billNumber} · ${formatMoney(s.bill.grandTotal)}`
                          : "No items to bill yet"}
                      </p>
                    )}
                    <div className="bill-secondary">
                      {s.billGeneratedAt && (
                        <Link href={`/staff/bill/${s.id}`} className="bill-print-btn">
                          <Printer size={15} /> Print bill
                        </Link>
                      )}
                      {canSettleBill && tab === "bills" && (
                        <NeoButton
                          variant="danger"
                          className="btn-sm"
                          onClick={() => {
                            setForceCloseError("");
                            setForceCloseReason("");
                            setForceClose({ sessionId: s.id, tableLabel });
                          }}
                        >
                          Force close
                        </NeoButton>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}
            {(tab === "unsettled" ? dash.unsettledBills || [] : floorSessions).length === 0 && (
              <Empty text={tab === "unsettled" ? "No bills waiting after automatic close." : "No open bills."} />
            )}
          </div>
        )}

        {tab === "menu" && (() => {
          const q = menuQuery.trim().toLowerCase();
          const categories: string[] = [
            "All",
            ...Array.from(new Set<string>(dash.menu.map((m: any) => String(m.category)))),
          ];
          const availableCount = dash.menu.filter((m: any) => m.available).length;
          const unavailableCount = dash.menu.length - availableCount;
          const filtered = dash.menu.filter((m: any) => {
            const catOk = menuCategory === "All" || m.category === menuCategory;
            const statusOk =
              menuFilter === "all" ||
              (menuFilter === "available" && m.available) ||
              (menuFilter === "unavailable" && !m.available);
            const qOk =
              !q ||
              m.name.toLowerCase().includes(q) ||
              m.category.toLowerCase().includes(q);
            return catOk && statusOk && qOk;
          });
          const grouped = categories
            .filter((c) => c !== "All")
            .map((c) => ({
              category: c,
              items: filtered.filter((m: any) => m.category === c),
            }))
            .filter((g) => g.items.length > 0);

          return (
            <div className="menu-board">
              <div className="tables-board-bar">
                <NeoButton variant="ghost" className="btn-sm" onClick={beginAddMenu}>
                  Add dish
                </NeoButton>
              </div>
              {menuFormOpen && (
              <section className="team-form-card" ref={menuFormRef}>
                <h2 className="h-display h-md" style={{ margin: 0 }}>
                  {menuForm.id ? "Edit dish" : "Add dish"}
                </h2>
                <div className="team-form-grid">
                  <NeoInput
                    label="Name"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <NeoSelect
                    label="Category"
                    value={menuCategoryMode === "new" ? "__new__" : menuForm.category || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "__new__") {
                        setMenuCategoryMode("new");
                        setMenuForm((f) => ({ ...f, category: "" }));
                        return;
                      }
                      setMenuCategoryMode("pick");
                      setMenuForm((f) => ({ ...f, category: value }));
                    }}
                  >
                    <option value="" disabled>
                      Choose category
                    </option>
                    {!categories
                      .filter((c) => c !== "All")
                      .includes(menuForm.category) &&
                      menuCategoryMode === "pick" &&
                      menuForm.category && (
                        <option value={menuForm.category}>{menuForm.category}</option>
                      )}
                    {categories
                      .filter((c) => c !== "All")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    <option value="__new__">Add new category…</option>
                  </NeoSelect>
                  {menuCategoryMode === "new" && (
                    <NeoInput
                      label="New category"
                      value={menuForm.category}
                      onChange={(e) => setMenuForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Soups"
                      autoFocus
                    />
                  )}
                  <NeoInput
                    label="Price ₹"
                    type="number"
                    min={0}
                    value={menuForm.price}
                    onChange={(e) => setMenuForm((f) => ({ ...f, price: e.target.value }))}
                  />
                  <NeoSelect
                    label="Type"
                    value={menuForm.isVeg ? "veg" : "non"}
                    onChange={(e) =>
                      setMenuForm((f) => ({ ...f, isVeg: e.target.value === "veg" }))
                    }
                  >
                    <option value="veg">Veg</option>
                    <option value="non">Non-veg</option>
                  </NeoSelect>
                  <NeoInput
                    label="Description"
                    value={menuForm.description}
                    onChange={(e) =>
                      setMenuForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                  <NeoSelect
                    label="Availability"
                    value={menuForm.available ? "on" : "off"}
                    onChange={(e) =>
                      setMenuForm((f) => ({ ...f, available: e.target.value === "on" }))
                    }
                  >
                    <option value="on">On menu</option>
                    <option value="off">Off menu</option>
                  </NeoSelect>
                </div>
                <div className="menu-image-field">
                  <span className="menu-image-label">Dish photo</span>
                  <div className="menu-image-row">
                    <div className="menu-image-preview">
                      {menuImagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={menuImagePreview} alt="" />
                      ) : (
                        <span className="muted">No photo yet</span>
                      )}
                    </div>
                    <div className="menu-image-actions">
                      <input
                        ref={menuImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="menu-image-input"
                        onChange={(e) => onMenuImagePick(e.target.files?.[0] || null)}
                      />
                      <NeoButton
                        type="button"
                        variant="ghost"
                        className="btn-sm"
                        onClick={() => menuImageInputRef.current?.click()}
                      >
                        {menuImagePreview ? "Change photo" : "Add photo"}
                      </NeoButton>
                      {menuImagePreview && (
                        <NeoButton
                          type="button"
                          variant="ghost"
                          className="btn-sm"
                          onClick={() => {
                            setMenuImageFile(null);
                            setMenuImagePreview("");
                            setMenuForm((f) => ({ ...f, image: "" }));
                            if (menuImageInputRef.current) menuImageInputRef.current.value = "";
                          }}
                        >
                          Remove
                        </NeoButton>
                      )}
                      <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
                        JPG, PNG, or WebP · under 2 MB
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <NeoButton disabled={menuBusy} onClick={saveMenuItem}>
                    {menuBusy ? "Saving…" : menuForm.id ? "Save dish" : "Add dish"}
                  </NeoButton>
                  <NeoButton variant="ghost" onClick={resetMenuForm}>
                    Cancel
                  </NeoButton>
                </div>
              </section>
              )}
              {menuNotice && <p className="order-notice">{menuNotice}</p>}

              <div className="menu-controls">
                <div className="menu-controls-left">
                  <div className="menu-status-switch" role="group" aria-label="Availability">
                    {(
                      [
                        ["all", "All", dash.menu.length],
                        ["available", "On menu", availableCount],
                        ["unavailable", "Off menu", unavailableCount],
                      ] as const
                    ).map(([id, label, count]) => (
                      <button
                        key={id}
                        type="button"
                        className={clsx(menuFilter === id && "is-on")}
                        onClick={() => setMenuFilter(id)}
                      >
                        {label}
                        <em>{count}</em>
                      </button>
                    ))}
                  </div>

                  <label className="menu-select-field">
                    <select
                      className="neo-select"
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      aria-label="Category"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c === "All" ? "All categories" : c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="menu-search">
                  <Search size={16} />
                  <input
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Search menu…"
                  />
                </label>
              </div>

              <p className="menu-result-meta muted">
                Showing {filtered.length} of {dash.menu.length} items
                {menuCategory !== "All" ? ` · ${menuCategory}` : ""}
              </p>

              {grouped.length === 0 && (
                <Empty text="No menu items match your filters." />
              )}

              {grouped.map((group) => (
                <section key={group.category} className="menu-section">
                  <header className="menu-section-head">
                    <h3 className="h-display h-md">{group.category}</h3>
                    <span className="muted">{group.items.length}</span>
                  </header>
                  <div className="menu-item-grid">
                    {group.items.map((m: any) => (
                      <article
                        key={m.id}
                        className={clsx(
                          "menu-item-card",
                          !m.available && "is-unavailable",
                          menuFormOpen && menuForm.id === m.id && "is-editing",
                        )}
                      >
                        <div className="menu-item-media">
                          <Image
                            src={m.image || "/media/menu/coffee.jpg"}
                            alt=""
                            fill
                            sizes="72px"
                            className="cover"
                          />
                        </div>
                        <div className="menu-item-body">
                          <div className="menu-item-top">
                            <strong>{m.name}</strong>
                            <b className="menu-item-price">{formatMoney(m.price)}</b>
                          </div>
                          {m.description && (
                            <p className="menu-item-desc muted">{m.description}</p>
                          )}
                          <div className="menu-item-foot">
                            <span
                              className={clsx(
                                "neo-badge",
                                m.available ? "neo-badge-mint" : "neo-badge-rose",
                              )}
                            >
                              {m.available ? "On menu" : "Off menu"}
                            </span>
                            <div className="table-tile-icons">
                              <button
                                type="button"
                                className={clsx(
                                  "table-icon-btn",
                                  menuFormOpen && menuForm.id === m.id && "is-on",
                                )}
                                aria-label={`Edit ${m.name}`}
                                title="Edit dish"
                                onClick={() => beginEditMenu(m)}
                              >
                                <Pencil size={15} />
                              </button>
                              {menuFormOpen && menuForm.id === m.id && (
                                <button
                                  type="button"
                                  className="table-icon-btn danger"
                                  aria-label={`Delete ${m.name}`}
                                  title="Delete dish"
                                  onClick={() => removeMenuItem(m.id, m.name)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                              <button
                                type="button"
                                className={clsx(
                                  "menu-toggle",
                                  m.available ? "is-available" : "is-unavailable",
                                )}
                                onClick={() =>
                                  action({
                                    action: "menu_upsert",
                                    item: { ...m, available: !m.available },
                                  })
                                }
                              >
                                {m.available ? "Off" : "On"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          );
        })()}

        {tab === "reservations" && (
          <div className="staff-list-board">
            {dash.reservations.map((r: any) => {
              const status = r.status as ReservationStatus;
              const statusBadge =
                status === "cancelled" || status === "no_show"
                  ? "neo-badge-rose"
                  : status === "pending"
                    ? "neo-badge-gold"
                    : status === "seated"
                      ? "neo-badge-ink"
                      : "neo-badge-mint";
              return (
                <article key={r.id} className="reservation-card">
                  <header className="reservation-card-head">
                    <div className="reservation-card-title">
                      <strong className="reservation-card-name">{r.name}</strong>
                      <span className="reservation-card-party">
                        <Users size={13} />
                        {r.partySize} {r.partySize === 1 ? "guest" : "guests"}
                      </span>
                    </div>
                    <span className={clsx("neo-badge", statusBadge)}>
                      {status.replace("_", " ")}
                    </span>
                  </header>

                  <div className="reservation-card-meta">
                    <span>
                      <CalendarDays size={13} />
                      {r.date}
                    </span>
                    <span>
                      <Clock size={13} />
                      {r.time}
                    </span>
                    <span>
                      <Phone size={13} />
                      {r.phone}
                    </span>
                    <span>
                      <MapPin size={13} />
                      {r.sectionPreference}
                    </span>
                  </div>

                  {r.note ? <p className="reservation-card-note">{r.note}</p> : null}

                  <div
                    className="reservation-status-group"
                    role="group"
                    aria-label={`Update status for ${r.name}`}
                  >
                    {RESERVATION_STATUS_ACTIONS.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        className={clsx(
                          "reservation-status-btn",
                          st.id === "cancelled" || st.id === "no_show"
                            ? "is-negative"
                            : "is-positive",
                          status === st.id && "is-active",
                        )}
                        disabled={status === st.id}
                        onClick={() =>
                          action({
                            action: "reservation_update",
                            id: r.id,
                            patch: { status: st.id },
                          })
                        }
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
            {dash.reservations.length === 0 && <Empty text="No reservations yet." />}
          </div>
        )}

        {tab === "team" && (
          <div className="team-board">
            <div className="tables-board-bar">
              <NeoButton variant="ghost" className="btn-sm" onClick={beginAddStaff}>
                Add staff
              </NeoButton>
            </div>
            {staffFormOpen && (
            <section className="team-form-card" ref={staffFormRef}>
              <h2 className="h-display h-md" style={{ margin: 0 }}>
                {editingStaffId ? "Edit staff" : "Add staff"}
              </h2>
              <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.88rem" }}>
                Waiters can sign in at /staff/login and appear in the table waiter list.
              </p>
              <div className="team-form-grid">
                <NeoInput
                  label="Name"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Waiter name"
                />
                <NeoInput
                  label="Email"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@lunar.cafe"
                />
                <PasswordInput
                  label={editingStaffId ? "New password (optional)" : "Password"}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editingStaffId ? "Leave blank to keep" : "At least 6 characters"}
                />
                <NeoSelect
                  label="Role"
                  value={staffForm.role}
                  onChange={(e) =>
                    setStaffForm((f) => ({ ...f, role: e.target.value as StaffRole }))
                  }
                >
                  <option value="waiter">Waiter</option>
                  <option value="reception">Reception</option>
                  <option value="kitchen">Kitchen</option>
                </NeoSelect>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <NeoButton disabled={staffBusy} onClick={saveStaffMember}>
                  <UserPlus size={16} />
                  {staffBusy ? "Saving…" : editingStaffId ? "Save changes" : "Add staff"}
                </NeoButton>
                <NeoButton variant="ghost" onClick={resetStaffForm}>
                  Cancel
                </NeoButton>
              </div>
            </section>
            )}
            {staffNotice && <p className="order-notice">{staffNotice}</p>}

            <section className="staff-list-board">
              {dash.staff.map((s: StaffUser & { active?: boolean }) => (
                <article
                  key={s.id}
                  className={clsx(
                    "team-member-card",
                    s.active === false && "is-inactive",
                    staffFormOpen && editingStaffId === s.id && "is-editing",
                  )}
                >
                  <div>
                    <strong>{s.name}</strong>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>{s.email}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <span className="neo-badge neo-badge-ink">{s.role}</span>
                      <span className={clsx("neo-badge", s.active === false ? "neo-badge-rose" : "neo-badge-mint")}>
                        {s.active === false ? "Inactive" : "Active"}
                      </span>
                    </div>
                  </div>
                  {s.role !== "owner" && (
                    <div className="team-member-actions">
                      <button
                        type="button"
                        className={clsx(
                          "table-icon-btn",
                          staffFormOpen && editingStaffId === s.id && "is-on",
                        )}
                        aria-label={`Edit ${s.name}`}
                        title="Edit staff"
                        onClick={() => beginEditStaff(s)}
                      >
                        <Pencil size={15} />
                      </button>
                      {staffFormOpen && editingStaffId === s.id && (
                        <button
                          type="button"
                          className="table-icon-btn danger"
                          aria-label={`Delete ${s.name}`}
                          title="Delete staff"
                          onClick={() => removeStaffMember(s.id, s.name)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <NeoButton
                        variant={s.active === false ? "primary" : "ghost"}
                        className="btn-sm"
                        onClick={() =>
                          action({
                            action: "staff_set_active",
                            staffId: s.id,
                            active: s.active === false,
                          })
                        }
                      >
                        {s.active === false ? "Activate" : "Deactivate"}
                      </NeoButton>
                    </div>
                  )}
                </article>
              ))}
            </section>
          </div>
        )}

        {tab === "feedback" && (
          <div className="staff-list-board">
            {dash.feedback.map((f: any) => (
              <div key={f.id} className="card-flat">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className="neo-badge neo-badge-ink">{f.status}</span>
                  <span className={clsx("neo-badge", f.type === "complaint" ? "neo-badge-rose" : "neo-badge-mint")}>
                    {f.type} · {f.category}
                  </span>
                </div>
                <p style={{ lineHeight: 1.6 }}>{f.message}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <NeoButton className="btn-sm" onClick={() => action({ action: "feedback_moderate", id: f.id, status: "published" })}>Publish</NeoButton>
                  <NeoButton variant="danger" className="btn-sm" onClick={() => action({ action: "feedback_moderate", id: f.id, status: "removed" })}>Veto / remove</NeoButton>
                </div>
              </div>
            ))}
            {dash.feedback.length === 0 && <Empty text="No feedback yet." />}
          </div>
        )}

        {tab === "stats" && <StatsDashboard />}

        {tab === "qrs" && (
          <>
            <p className="muted" style={{ maxWidth: 560 }}>
              Print once, stick forever. Each QR opens the table; the server decides whether a guest starts a new session or must enter the group code.
            </p>
            <div className="table-map" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))" }}>
              {dash.tables.map((t: any) => (
                <div key={t.id} className="table-tile" style={{ textAlign: "center", justifyItems: "center" }}>
                  <QrImage path={`/t/${t.id}`} />
                  <strong>{t.id}</strong>
                  <span className="neo-badge neo-badge-ink">{t.section}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.2rem" }} className="no-print">
              <NeoButton onClick={() => window.print()}><Printer size={15} /> Print all QRs</NeoButton>
            </div>
          </>
        )}
      </main>
      {closeCafeOpen && (
        <div className="staff-confirm-backdrop" onClick={cancelCloseCafe} role="presentation">
          <div
            className="staff-confirm staff-confirm-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-cafe-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="close-cafe-title">Close cafe?</h2>
            <p>
              Guests and staff will not be able to place new orders until you open the cafe
              again.
            </p>
            {closeCafeHasPending ? (
              <>
                <p className="staff-confirm-warn">
                  There {closeCafePending.openTables === 1 ? "is" : "are"} still{" "}
                  <strong>{closeCafePending.openTables}</strong> open{" "}
                  {closeCafePending.openTables === 1 ? "table" : "tables"} that{" "}
                  {closeCafePending.openTables === 1 ? "is" : "are"} not fully closed.
                </p>
                <ul className="staff-confirm-stats">
                  {closeCafePending.billsNotGenerated > 0 && (
                    <li>
                      <strong>{closeCafePending.billsNotGenerated}</strong> bill
                      {closeCafePending.billsNotGenerated === 1 ? "" : "s"} not generated yet
                    </li>
                  )}
                  {closeCafePending.initiatedBills > 0 && (
                    <li>
                      <strong>{closeCafePending.initiatedBills}</strong> initiated bill
                      {closeCafePending.initiatedBills === 1 ? "" : "s"} waiting
                    </li>
                  )}
                  {closeCafePending.unpaidBills > 0 && (
                    <li>
                      <strong>{closeCafePending.unpaidBills}</strong> unpaid bill
                      {closeCafePending.unpaidBills === 1 ? "" : "s"}
                    </li>
                  )}
                  {closeCafePending.paymentApprovals > 0 && (
                    <li>
                      <strong>{closeCafePending.paymentApprovals}</strong> payment
                      {closeCafePending.paymentApprovals === 1 ? "" : "s"} awaiting approval
                    </li>
                  )}
                </ul>
                <div className="staff-confirm-pending">
                  {closeCafePending.tables.map((t: { label: string; status: string; total: number }) => (
                    <div key={t.label} className="staff-confirm-pending-row">
                      <strong>{t.label}</strong>
                      <span>{t.status}</span>
                      <b>{formatMoney(t.total)}</b>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>All tables are clear — no open bills pending.</p>
            )}
            <div className="staff-confirm-actions">
              <NeoButton variant="ghost" onClick={cancelCloseCafe} disabled={closeCafeBusy}>
                Cancel
              </NeoButton>
              <NeoButton variant="danger" onClick={confirmCloseCafe} disabled={closeCafeBusy}>
                {closeCafeBusy ? "Closing…" : "Close cafe anyway"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}
      {genBill && (
        <div className="staff-confirm-backdrop" onClick={cancelGenerateBill} role="presentation">
          <div
            className="staff-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gen-bill-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="gen-bill-title">Generate bill?</h2>
            <p>
              Create the bill for <strong>{genBill.tableLabel}</strong> ·{" "}
              <strong>{formatMoney(genBill.total)}</strong>. New kitchen tickets on this table
              will close.
            </p>
            <div className="staff-confirm-actions">
              <NeoButton variant="ghost" onClick={cancelGenerateBill} disabled={genBillBusy}>
                Cancel
              </NeoButton>
              <NeoButton onClick={confirmGenerateBill} disabled={genBillBusy}>
                {genBillBusy ? "Generating…" : "Generate bill"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}
      {payBill && (
        <div className="staff-confirm-backdrop" onClick={cancelMarkPaid} role="presentation">
          <div
            className="staff-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-bill-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="pay-bill-title">Mark bill paid?</h2>
            <p>
              Table <strong>{payBill.tableLabel}</strong>
              {payBill.billNumber ? (
                <>
                  {" "}
                  · bill #<strong>{payBill.billNumber}</strong>
                </>
              ) : null}{" "}
              · <strong>{formatMoney(payBill.total)}</strong>
            </p>
            <p className="muted" style={{ marginTop: "-0.35rem" }}>
              How did the guest pay?
            </p>
            <div className="staff-confirm-chips" role="group" aria-label="Payment method">
              {(
                [
                  { id: "cash" as const, label: "Cash", icon: <Banknote size={15} /> },
                  { id: "upi" as const, label: "UPI", icon: <Smartphone size={15} /> },
                  { id: "card" as const, label: "Card", icon: <CreditCard size={15} /> },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={clsx("chip", payMethod === m.id && "chip-on")}
                  onClick={() => setPayMethod(m.id)}
                  disabled={payBusy}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            <div className="staff-confirm-actions">
              <NeoButton variant="ghost" onClick={cancelMarkPaid} disabled={payBusy}>
                Cancel
              </NeoButton>
              <NeoButton onClick={confirmMarkPaid} disabled={payBusy}>
                {payBusy ? "Saving…" : "Submit"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}
      {reassign && (
        <div className="staff-confirm-backdrop" onClick={cancelReassign} role="presentation">
          <div
            className="staff-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reassign-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reassign-title">Change waiter?</h2>
            <p>
              <strong>{reassign.tableLabel}</strong> is handled by{" "}
              <strong>{reassign.fromName}</strong>. Move it to{" "}
              <strong>{reassign.toName}</strong>?
            </p>
            <p>
              {reassign.fromName} and floor managers (owner / reception) will be notified of
              this change.
            </p>
            <div className="staff-confirm-actions">
              <NeoButton variant="ghost" onClick={cancelReassign} disabled={reassignBusy}>
                Cancel
              </NeoButton>
              <NeoButton onClick={confirmReassign} disabled={reassignBusy}>
                {reassignBusy ? "Saving…" : "Yes, reassign"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}
      {staffSwitch && (
        <div className="staff-confirm-backdrop" onClick={cancelStaffSwitch} role="presentation">
          <div
            className="staff-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-switch-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="staff-switch-title">Switch table?</h2>
            <p>
              Move the open session from <strong>{staffSwitch.tableLabel}</strong> to another free
              table. Past orders stay on one bill and keep their original table label.
            </p>
            <NeoSelect
              label="New table"
              value={staffSwitchTo}
              onChange={(e) => setStaffSwitchTo(e.target.value)}
            >
              {freeTables.length === 0 && <option value="">No free tables</option>}
              {freeTables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </NeoSelect>
            <NeoTextarea
              label="Reason"
              rows={3}
              required
              autoFocus
              placeholder="Why are you moving this party?"
              value={staffSwitchReason}
              onChange={(e) => {
                setStaffSwitchReason(e.target.value);
                if (staffSwitchError) setStaffSwitchError("");
              }}
            />
            {staffSwitchError && <p className="staff-confirm-error">{staffSwitchError}</p>}
            <div className="staff-confirm-actions">
              <NeoButton variant="ghost" onClick={cancelStaffSwitch} disabled={staffSwitchBusy}>
                Cancel
              </NeoButton>
              <NeoButton
                onClick={() => void confirmStaffSwitch()}
                disabled={
                  staffSwitchBusy ||
                  !staffSwitchTo ||
                  staffSwitchReason.trim().length < 3 ||
                  freeTables.length === 0
                }
              >
                {staffSwitchBusy ? "Moving…" : "Switch table"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}
      {deskCancel && (
        <div className="staff-confirm-backdrop" onClick={closeDeskCancel} role="presentation">
          <div
            className="staff-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="desk-cancel-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="desk-cancel-title">Cancel this order?</h2>
            <p>
              <strong>
                {deskCancel.channel === "swiggy"
                  ? "Swiggy"
                  : deskCancel.channel === "zomato"
                    ? "Zomato"
                    : "Takeaway"}
              </strong>
              {deskCancel.externalOrderId ? ` · ${deskCancel.externalOrderId}` : ""}
              {" · "}
              {deskCancel.members?.find((m) => m.isHost)?.displayName ||
                deskCancel.members?.[0]?.displayName ||
                "Guest"}
            </p>
            <p className="staff-confirm-warn" style={{ marginTop: 0 }}>
              Kitchen status: <strong>{deskKitchenStatus(deskCancel)}</strong>
              {(deskCancel.orders || []).some((line) =>
                ["queued", "preparing", "ready"].includes(line.status),
              )
                ? " · Kitchen already has this ticket. Cancelling will stop it."
                : ""}
            </p>
            <ul className="desk-cancel-lines">
              {(deskCancel.orders || [])
                .filter((line) => line.status !== "cancelled" && line.status !== "rejected")
                .map((line) => (
                  <li key={line.id}>
                    <span>
                      {line.qty}× {line.name}
                      {line.variantLabel ? ` · ${line.variantLabel}` : ""}
                    </span>
                    <span className="muted">{line.status.replace(/_/g, " ")}</span>
                  </li>
                ))}
            </ul>
            <div className="staff-confirm-chips">
              {DESK_CANCEL_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={clsx("chip", deskCancelReason === reason && "chip-on")}
                  onClick={() => {
                    setDeskCancelReason(reason);
                    setDeskCancelError("");
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <NeoTextarea
              label="Reason"
              rows={3}
              required
              autoFocus
              placeholder="Why are you cancelling this order?"
              value={deskCancelReason}
              onChange={(e) => {
                setDeskCancelReason(e.target.value);
                if (deskCancelError) setDeskCancelError("");
              }}
            />
            {deskCancelError && <p className="staff-confirm-error">{deskCancelError}</p>}
            <div className="staff-confirm-actions">
              <NeoButton variant="ghost" onClick={closeDeskCancel} disabled={deskCancelBusy}>
                Keep order
              </NeoButton>
              <NeoButton
                variant="danger"
                onClick={confirmDeskCancel}
                disabled={deskCancelBusy || deskCancelReason.trim().length < 3}
              >
                {deskCancelBusy ? "Cancelling…" : "Cancel order"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}
      {forceClose && (
        <div className="staff-confirm-backdrop" onClick={cancelForceClose} role="presentation">
          <div
            className="staff-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="force-close-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="force-close-title">Close this table?</h2>
            <p>
              Force close <strong>{forceClose.tableLabel}</strong> without taking payment. The
              table will be freed and this cannot be undone.
            </p>
            <div className="staff-confirm-chips">
              {FORCE_CLOSE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={clsx("chip", forceCloseReason === reason && "chip-on")}
                  onClick={() => {
                    setForceCloseReason(reason);
                    setForceCloseError("");
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <NeoTextarea
              label="Reason"
              rows={3}
              required
              autoFocus
              placeholder="Why are you force closing this table?"
              value={forceCloseReason}
              onChange={(e) => {
                setForceCloseReason(e.target.value);
                if (forceCloseError) setForceCloseError("");
              }}
            />
            {forceCloseError && <p className="staff-confirm-error">{forceCloseError}</p>}
            <div className="staff-confirm-actions">
              <NeoButton variant="ghost" onClick={cancelForceClose} disabled={forceCloseBusy}>
                Cancel
              </NeoButton>
              <NeoButton
                variant="danger"
                onClick={confirmForceClose}
                disabled={forceCloseBusy || forceCloseReason.trim().length < 3}
              >
                {forceCloseBusy ? "Closing…" : "Force close table"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}
      {orderTable && canTakeOrder && cafeAcceptingOrders && (
        <TakeOrderSheet
          tableId={orderTable.id}
          tableLabel={orderTable.label}
          menu={dash.menu}
          actor={user.email}
          actorName={user.name}
          actorId={user.id}
          assignedWaiterId={
            dash.tables.find((t: { id: string }) => t.id === orderTable.id)?.assignedWaiterId || null
          }
          assignedWaiterName={
            waiters.find(
              (w: StaffUser) =>
                w.id ===
                dash.tables.find((t: { id: string }) => t.id === orderTable.id)?.assignedWaiterId,
            )?.name || null
          }
          session={floorSessions.find((s: { tableId: string }) => s.tableId === orderTable.id)}
          onClose={() => setOrderTable(null)}
          onSent={(tokenNumber) => {
            setOrderNotice(`Table ${orderTable.label} · token #${tokenNumber} sent to the kitchen.`);
            setOrderTable(null);
            load();
          }}
        />
      )}
      {deskOrder && (user.role === "owner" || user.role === "reception") && cafeAcceptingOrders && (
        <TakeOrderSheet
          tableId="online"
          tableLabel={deskOrder === "takeaway" ? "Takeaway" : deskOrder === "swiggy" ? "Swiggy" : "Zomato"}
          deskChannel={deskOrder}
          menu={dash.menu}
          actor={user.email}
          actorName={user.name}
          actorId={user.id}
          onClose={() => setDeskOrder(null)}
          onSent={(tokenNumber) => {
            const label = deskOrder === "takeaway" ? "Takeaway" : deskOrder === "swiggy" ? "Swiggy" : "Zomato";
            setOrderNotice(`${label} · token #${tokenNumber} sent to the kitchen.`);
            setDeskOrder(null);
            load();
          }}
        />
      )}
      {accountOpen && (
        <div className="staff-confirm-backdrop" onClick={() => !passwordBusy && setAccountOpen(false)} role="presentation">
          <div
            className="staff-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="account-title">Your password</h2>
            <p>Use the password you sign in with today. The owner can also set a new one from Team.</p>
            <PasswordInput
              label="Current password"
              value={currentPassword}
              autoComplete="current-password"
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <PasswordInput
              label="New password"
              value={nextPassword}
              autoComplete="new-password"
              onChange={(e) => setNextPassword(e.target.value)}
            />
            {passwordErr && <p className="staff-confirm-error">{passwordErr}</p>}
            {passwordMsg && <p className="form-success-line">{passwordMsg}</p>}
            {user.role === "owner" && (
              <NeoButton variant="ghost" onClick={() => void downloadBackup()}>
                <Download size={15} /> Download backup
              </NeoButton>
            )}
            <div className="staff-confirm-actions">
              <NeoButton variant="ghost" onClick={() => setAccountOpen(false)} disabled={passwordBusy}>
                Close
              </NeoButton>
              <NeoButton
                onClick={() => void savePassword()}
                disabled={passwordBusy || currentPassword.length < 1 || nextPassword.length < 6}
              >
                {passwordBusy ? "Saving…" : "Update password"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, icon, hot }: { label: string; value: number; icon: React.ReactNode; hot?: boolean }) {
  return (
    <div className="kpi" style={hot ? { outline: "2px solid var(--gold-500)" } : undefined}>
      <div className="kpi-top"><span>{label}</span>{icon}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="staff-empty" role="status">
      <p>{text}</p>
    </div>
  );
}

function waitLabel(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just in";
  if (mins === 1) return "1 min";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function QrImage({ path }: { path: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}${path}`, {
      margin: 1,
      width: 220,
      color: { dark: "#11221c", light: "#fbf8f1" },
    }).then(setSrc);
  }, [path]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={`QR ${path}`} width={150} height={150} style={{ borderRadius: 12 }} /> : <div style={{ width: 150, height: 150 }} />;
}
