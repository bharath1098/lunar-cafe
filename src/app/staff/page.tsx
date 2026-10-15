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
} from "lucide-react";
import { NeoButton, NeoInput, NeoSelect } from "@/components/Neo";
import { TakeOrderSheet } from "@/components/TakeOrderSheet";
import { CAFE_MEDIA } from "@/lib/media";
import { formatMoney } from "@/lib/cafe";
import { clearStaffSession, readStaffSession } from "@/lib/staff-session";
import type { ReservationStatus, StaffRole, TableSection } from "@/lib/types";

const StatsDashboard = dynamic(() => import("@/components/StatsDashboard"), {
  ssr: false,
  loading: () => <p className="muted">Loading analytics…</p>,
});

type StaffUser = { id: string; name: string; email: string; role: StaffRole; active?: boolean };

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
  });
  const [menuNotice, setMenuNotice] = useState("");
  const [menuBusy, setMenuBusy] = useState(false);
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const menuFormRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const u = readStaffSession<StaffUser>();
    if (!u) {
      router.replace("/staff/login");
      return;
    }
    setUser(u);
    setTab(u.role === "kitchen" ? "kitchen" : u.role === "waiter" ? "tables" : "overview");
  }, [router]);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/dashboard", { cache: "no-store" });
    if (res.ok) setDash(await res.json());
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [user, load]);

  async function action(body: Record<string, unknown>) {
    await fetch("/api/staff/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, actor: user?.email }),
    });
    load();
  }

  const tabs = useMemo(() => {
    if (!user) return [];
    const all = [
      { id: "overview", label: "Overview", icon: LayoutDashboard, roles: ["owner", "reception", "waiter", "kitchen"] },
      { id: "tables", label: "Tables", icon: Armchair, roles: ["owner", "reception", "waiter"], count: dash?.billRequests?.length },
      { id: "approvals", label: "Approvals", icon: CheckCheck, roles: ["owner", "reception", "waiter"], count: dash?.pendingApprovals?.length },
      { id: "kitchen", label: "Kitchen", icon: ChefHat, roles: ["owner", "kitchen", "reception"] },
      {
        id: "bills",
        label: "Bills",
        icon: Receipt,
        roles: ["owner", "reception", "waiter"],
        count:
          (dash?.billRequests?.length || 0) +
          (user.role === "waiter" ? 0 : dash?.paymentApprovals?.length || 0),
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
    });
  }

  function openMenuForm() {
    setMenuFormOpen(true);
    requestAnimationFrame(() => {
      menuFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function beginAddMenu() {
    setMenuForm({
      id: "",
      name: "",
      category: "",
      description: "",
      price: "",
      isVeg: true,
      available: true,
    });
    setMenuNotice("");
    openMenuForm();
  }

  function beginEditMenu(m: any) {
    if (menuFormOpen && menuForm.id === m.id) {
      resetMenuForm();
      return;
    }
    setMenuForm({
      id: m.id,
      name: m.name || "",
      category: m.category || "",
      description: m.description || "",
      price: String(m.price ?? ""),
      isVeg: Boolean(m.isVeg),
      available: Boolean(m.available),
    });
    setMenuNotice("");
    openMenuForm();
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
  const title = tabs.find((t) => t.id === tab)?.label || "Overview";
  const canTakeOrder =
    user.role === "waiter" || user.role === "reception" || user.role === "owner";
  const ordering = dash?.ordering as
    | {
        acceptingOrders: boolean;
        withinHours: boolean;
        ordersOpen: boolean;
        allowAfterHours: boolean;
        hoursLabel: string;
        localTimeLabel: string;
        reason?: string;
      }
    | undefined;
  const cafeAcceptingOrders = ordering ? ordering.acceptingOrders : true;
  const billRequests: {
    sessionId: string;
    tableId: string;
    guestName: string;
    requestedAt: string;
    assignedWaiterId: string | null;
    total: number;
  }[] = canTakeOrder ? dash.billRequests || [] : [];
  const canSettleBill = user.role === "owner" || user.role === "reception";
  const canControlOrdering = user.role === "owner" || user.role === "reception";

  async function setOrdering(patch: Record<string, unknown>) {
    await action({ action: "set_ordering", ...patch });
  }
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

  function signOut() {
    clearStaffSession();
    router.push("/staff/login");
  }

  return (
    <div className="staff-shell">
      <header className="staff-mobile-top no-print">
        <div className="staff-mobile-brand">
          <span className="brand-mark">
            <Image src={CAFE_MEDIA.goldSign} alt="" fill sizes="36px" className="cover" />
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
        </div>
        <div className="staff-mobile-actions">
          <button type="button" onClick={load} aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
          <Link href="/" aria-label="Public site">
            <Globe size={18} />
          </Link>
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
            <Image src={CAFE_MEDIA.goldSign} alt="" fill sizes="42px" className="cover" />
          </span>
          <span className="brand-text">
            <strong style={{ fontSize: "1.1rem" }}>LUNAR</strong>
            <small>STAFF</small>
          </span>
        </div>
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
        <div className="staff-foot" style={{ marginTop: "auto", display: "grid", gap: 8 }}>
          <div style={{ padding: "0.6rem 0.8rem", borderRadius: 14, background: "rgba(255,255,255,0.06)", fontSize: "0.82rem" }}>
            <strong>{user.name}</strong>
            <div style={{ opacity: 0.6, textTransform: "capitalize" }}>{user.role}</div>
          </div>
          <Link href="/" className="staff-nav-btn">Public site</Link>
          <button className="staff-nav-btn" onClick={signOut}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className={clsx("staff-main", tab === "kitchen" && "staff-main-kitchen")}>
        <div className="staff-title">
          <div>
            <span className="eyebrow">Lunar Cafe · live</span>
            <h1 className="h-display h-lg" style={{ marginTop: 6 }}>{title}</h1>
          </div>
          <NeoButton variant="ghost" onClick={load} className="staff-refresh-desktop">
            <RefreshCw size={15} /> Refresh
          </NeoButton>
        </div>

        {ordering && (
          <div
            className={clsx(
              "cafe-order-status",
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
                  Hours {ordering.hoursLabel} · now {ordering.localTimeLabel}
                  {!ordering.withinHours ? " · outside hours" : ""}
                  {ordering.allowAfterHours ? " · after-hours allowed" : ""}
                </span>
              </div>
            </div>
            {canControlOrdering && (
              <div className="cafe-order-status-actions">
                <NeoButton
                  className="btn-sm"
                  variant={ordering.ordersOpen ? "ghost" : undefined}
                  onClick={() => setOrdering({ ordersOpen: !ordering.ordersOpen })}
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
              </div>
            )}
          </div>
        )}

        {orderNotice && <p className="order-notice">{orderNotice}</p>}

        {billRequests.length > 0 && (
          <section className="bill-request-board" aria-label="Guests requesting the bill">
            {billRequests.map((request) => {
              const waiter = waiters.find((w: StaffUser) => w.id === request.assignedWaiterId);
              const tableLabel = request.tableId.replace("lunar-", "");
              return (
                <article key={request.sessionId} className="bill-request-card">
                  <div>
                    <strong>
                      <Bell size={16} /> {tableLabel} · {request.guestName} is requesting the bill
                    </strong>
                    <p>
                      {formatMoney(request.total)} · {waitLabel(request.requestedAt)}
                      {waiter ? ` · Assigned to ${waiter.name}` : ""}
                    </p>
                  </div>
                  {canSettleBill ? (
                    <NeoButton
                      className="btn-sm"
                      onClick={() => {
                        setTab("bills");
                      }}
                    >
                      Open bills
                    </NeoButton>
                  ) : (
                    <span className="neo-badge neo-badge-rose">Bill requested</span>
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
              <Kpi label="Pending approvals" value={dash.stats.pendingApprovals} icon={<CheckCheck size={18} />} hot={dash.stats.pendingApprovals > 0} />
              <Kpi label="In kitchen" value={dash.kitchenItems.length} icon={<Flame size={18} />} />
              <Kpi label="Paid bills" value={dash.stats.paidBills} icon={<Wallet size={18} />} />
            </div>
            <h2 className="h-display h-md" style={{ margin: "2rem 0 1rem" }}>Tables right now</h2>
            <div className="table-map">
              {dash.tables.map((t: any) => {
                const s = dash.activeSessions.find((x: any) => x.tableId === t.id);
                return (
                  <div key={t.id} className={clsx("table-tile table-tile-compact", s ? "busy" : "free", canTakeOrder && s?.billRequestedAt && "wants-bill")}>
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
                    {canTakeOrder && s?.billRequestedAt && (
                      <span className="neo-badge neo-badge-rose">
                        {s.billRequestedByName || "Guest"} wants the bill
                      </span>
                    )}
                    {canTakeOrder && cafeAcceptingOrders && (
                      <NeoButton className="btn-sm w-full" onClick={() => openOrder(t.id)}>
                        Take order
                      </NeoButton>
                    )}
                    {canTakeOrder && !cafeAcceptingOrders && (
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
              const session = dash.activeSessions.find((s: any) => s.tableId === t.id);
              const waiter = waiters.find((w: StaffUser) => w.id === t.assignedWaiterId);
              return (
                <div key={t.id} className={clsx("table-tile", session ? "busy" : "free", session?.billRequestedAt && "wants-bill", editingTableId === t.id && "is-editing")}>
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
                      {session?.billRequestedAt && (
                        <span className="neo-badge neo-badge-rose">
                          {session.billRequestedByName || "Guest"} wants the bill
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
                    {canTakeOrder && cafeAcceptingOrders && (
                      <NeoButton className="btn-sm w-full" onClick={() => openOrder(t.id)}>
                        Take order
                      </NeoButton>
                    )}
                    {canTakeOrder && !cafeAcceptingOrders && (
                      <span className="muted" style={{ fontSize: "0.78rem" }}>
                        Ordering closed
                      </span>
                    )}
                    <NeoSelect
                      label={waiter ? `Handled by ${waiter.name}` : "Waiter"}
                      value={t.assignedWaiterId || ""}
                      onChange={(e) =>
                        action({
                          action: "assign_waiter",
                          tableId: t.id,
                          waiterId: e.target.value || null,
                        })
                      }
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
                    <strong>{o.tableId.replace("lunar-", "")} · Token #{o.tokenNumber}</strong>
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
                          <span className="kitchen-ticket-table">{o.tableId.replace("lunar-", "")}</span>
                          <span className="kitchen-ticket-token">#{o.tokenNumber}</span>
                        </div>
                        <p className="kitchen-ticket-item">
                          <span className="kitchen-ticket-qty">{o.qty}×</span>{" "}
                          {o.name}
                          {o.variantLabel ? ` · ${o.variantLabel}` : ""}
                        </p>
                        {o.notes && <p className="kitchen-ticket-note">“{o.notes}”</p>}
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

        {tab === "bills" && (
          <div className="bill-board">
            {dash.activeSessions.map((s: any) => {
              const tableLabel = s.tableId.replace("lunar-", "");
              const guests = s.members?.length || 0;
              const items = s.bill.totalQty || 0;
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
                            {s.billRequestedByName || "Guest"} wants the bill
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
                    ) : canSettleBill && !s.billGeneratedAt ? (
                      <div className="bill-pay-group" role="group" aria-label="Generate bill">
                        <button
                          type="button"
                          className="bill-pay-btn"
                          disabled={!s.billRequestedAt}
                          onClick={() =>
                            action({ action: "generate_bill", sessionId: s.id })
                          }
                        >
                          <Receipt size={16} /> Generate bill
                        </button>
                      </div>
                    ) : canSettleBill ? (
                      <div className="bill-pay-group" role="group" aria-label="Mark as paid">
                        <button
                          type="button"
                          className="bill-pay-btn"
                          onClick={() =>
                            action({ action: "close_pay", sessionId: s.id, paymentMethod: "cash" })
                          }
                        >
                          <Banknote size={16} /> Cash
                        </button>
                        <button
                          type="button"
                          className="bill-pay-btn"
                          onClick={() =>
                            action({ action: "close_pay", sessionId: s.id, paymentMethod: "upi" })
                          }
                        >
                          <Smartphone size={16} /> UPI
                        </button>
                        <button
                          type="button"
                          className="bill-pay-btn"
                          onClick={() =>
                            action({ action: "close_pay", sessionId: s.id, paymentMethod: "card" })
                          }
                        >
                          <CreditCard size={16} /> Card
                        </button>
                      </div>
                    ) : (
                      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                        {s.billGeneratedAt
                          ? `Generated bill #${s.billNumber} · ${formatMoney(s.bill.grandTotal)}`
                          : s.billRequestedAt
                            ? "Waiting for reception or owner to generate the bill"
                            : "No bill request yet"}
                      </p>
                    )}
                    <div className="bill-secondary">
                      {s.billGeneratedAt && (
                        <Link href={`/staff/bill/${s.id}`} className="bill-print-btn">
                          <Printer size={15} /> Print bill
                        </Link>
                      )}
                      {canSettleBill && (
                        <NeoButton
                          variant="danger"
                          className="btn-sm"
                          onClick={() => action({ action: "force_close", sessionId: s.id })}
                        >
                          Force close
                        </NeoButton>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}
            {dash.activeSessions.length === 0 && <Empty text="No open bills." />}
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
                  <NeoInput
                    label="Category"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="Soups"
                  />
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
                <NeoInput
                  label={editingStaffId ? "New password (optional)" : "Password"}
                  type="password"
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
      {orderTable && canTakeOrder && cafeAcceptingOrders && (
        <TakeOrderSheet
          tableId={orderTable.id}
          tableLabel={orderTable.label}
          menu={dash.menu}
          actor={user.email}
          actorName={user.name}
          onClose={() => setOrderTable(null)}
          onSent={(tokenNumber) => {
            setOrderNotice(`Table ${orderTable.label} · token #${tokenNumber} sent to the kitchen.`);
            setOrderTable(null);
            load();
          }}
        />
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
    <div className="card-flat muted" style={{ textAlign: "center", padding: "2.5rem" }}>
      {text}
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
