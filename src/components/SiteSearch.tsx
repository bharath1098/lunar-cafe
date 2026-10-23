"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { loadPublicData, type PublicMenuItem } from "@/lib/public-data";

const PAGES = [
  { href: "/", title: "Home", hint: "The cafe" },
  { href: "/menu", title: "Menu", hint: "Food and drinks" },
  { href: "/about", title: "About", hint: "Our story" },
  { href: "/gallery", title: "Gallery", hint: "Photos" },
  { href: "/reserve", title: "Reserve a table", hint: "Bookings" },
  { href: "/loyalty", title: "Lunar Rewards", hint: "Points" },
  { href: "/feedback", title: "Feedback", hint: "Compliments and complaints" },
  { href: "/contact", title: "Contact", hint: "Address, phone, email" },
  { href: "/faq", title: "FAQ", hint: "Hours, reservations, ordering" },
  { href: "/privacy", title: "Privacy policy", hint: "Your data" },
  { href: "/terms", title: "Terms", hint: "House rules" },
];

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<PublicMenuItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    loadPublicData()
      .then((d) => setMenu(d.menu || []))
      .catch(() => setMenu([]));
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const q = query.trim().toLowerCase();
  const pages = useMemo(
    () =>
      PAGES.filter(
        (p) => !q || p.title.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q),
      ),
    [q],
  );
  const dishes = useMemo(() => {
    if (!q) return [];
    return menu
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [menu, q]);

  return (
    <>
      <button
        type="button"
        className="header-icon"
        aria-label="Search the site"
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
      >
        <Search size={18} />
      </button>
      {open && (
        <div className="search-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search Lunar Cafe"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="search-panel-field">
              <Search size={18} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes and pages"
                aria-label="Search dishes and pages"
              />
              <button type="button" className="header-icon" aria-label="Close search" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </label>
            <div className="search-results">
              {pages.length > 0 && <p className="search-label">Pages</p>}
              {pages.map((p) => (
                <Link key={p.href} href={p.href} onClick={() => setOpen(false)}>
                  <strong>{p.title}</strong>
                  <small>{p.hint}</small>
                </Link>
              ))}
              {dishes.length > 0 && <p className="search-label">Menu</p>}
              {dishes.map((item) => (
                <Link key={item.id} href={`/menu/${item.slug}`} onClick={() => setOpen(false)}>
                  <strong>{item.name}</strong>
                  <small>{item.category}</small>
                </Link>
              ))}
              {q && pages.length === 0 && dishes.length === 0 && (
                <p className="search-empty">Nothing matches that. Try a dish name, or “reserve”.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
