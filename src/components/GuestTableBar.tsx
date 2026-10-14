"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Armchair, ArrowRight, UtensilsCrossed } from "lucide-react";
import {
  clearActiveGuest,
  orderPath,
  readActiveGuest,
  type ActiveGuestVisit,
} from "@/lib/guest-session";

const HIDE_KEY = "lunar-guest-bar-hidden";

/** Sticky return strip on public pages while a table session is open. */
export function GuestTableBar() {
  const pathname = usePathname();
  const [visit, setVisit] = useState<ActiveGuestVisit | null>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const active = readActiveGuest();
    if (!active) {
      setVisit(null);
      setMinimized(false);
      return;
    }
    setVisit(active);
    try {
      setMinimized(sessionStorage.getItem(HIDE_KEY) === active.sessionId);
    } catch {
      setMinimized(false);
    }
  }, [pathname]);

  // Hide on order / join / staff flows
  if (
    !visit ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/t/") ||
    pathname.startsWith("/staff")
  ) {
    return null;
  }

  const href = orderPath(visit.sessionId);

  if (minimized) {
    return (
      <Link
        href={href}
        className="guest-order-fab"
        aria-label={`Back to table ${visit.tableLabel} order`}
        title={`Table ${visit.tableLabel} · Back to order`}
      >
        <UtensilsCrossed size={22} aria-hidden />
        <span className="guest-order-fab-label">{visit.tableLabel}</span>
      </Link>
    );
  }

  return (
    <div className="guest-table-bar" role="status">
      <div className="guest-table-bar-inner">
        <span className="guest-table-bar-copy">
          <Armchair size={16} aria-hidden />
          You&apos;re at table <strong>{visit.tableLabel}</strong>
        </span>
        <div className="guest-table-bar-actions">
          <Link href={href} className="guest-table-bar-cta">
            Back to order <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            className="guest-table-bar-dismiss"
            aria-label="Minimize to order button"
            onClick={() => {
              try {
                sessionStorage.setItem(HIDE_KEY, visit.sessionId);
              } catch {
                /* ignore */
              }
              setMinimized(true);
            }}
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}

/** Call from order closed state so the public bar does not linger. */
export function clearGuestVisitIfClosed(sessionId: string) {
  clearActiveGuest(sessionId);
  try {
    if (sessionStorage.getItem(HIDE_KEY) === sessionId) {
      sessionStorage.removeItem(HIDE_KEY);
    }
  } catch {
    /* ignore */
  }
}
