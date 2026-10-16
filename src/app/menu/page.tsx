"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import clsx from "clsx";
import { CategoryBar } from "@/components/CategoryBar";
import { PublicShell } from "@/components/PublicShell";
import { imageForMenuItem } from "@/lib/media";
import { loadPublicData } from "@/lib/public-data";

type PublicItem = {
  id: string;
  slug: string;
  category: string;
  name: string;
  description: string;
  image?: string;
  isVeg?: boolean;
  isNew?: boolean;
  isHighlighted?: boolean;
  hasDiscount?: boolean;
};

export default function MenuPage() {
  const [items, setItems] = useState<PublicItem[]>([]);
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [menuView, setMenuView] = useState<"card" | "present">("card");
  const [moreCatsOpen, setMoreCatsOpen] = useState(false);

  useEffect(() => {
    loadPublicData()
      .then((d) => setItems(d.menu || []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("lunar-menu-view");
    if (saved === "card" || saved === "present") setMenuView(saved);
  }, []);

  function chooseMenuView(next: "card" | "present") {
    setMenuView(next);
    localStorage.setItem("lunar-menu-view", next);
  }

  const categories = useMemo(
    () => ["All", ...new Set(items.map((i) => i.category))],
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (active === "All" || i.category === active) &&
        (!vegOnly || i.isVeg) &&
        (!q ||
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)),
    );
  }, [items, active, query, vegOnly]);

  const grouped = useMemo(() => {
    const order = categories.filter((c) => c !== "All");
    const map = new Map<string, PublicItem[]>();
    for (const cat of order) map.set(cat, []);
    for (const item of visible) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].filter(([, list]) => list.length > 0);
  }, [visible, categories]);

  function renderItem(item: PublicItem) {
    const src = item.image || imageForMenuItem(item.name, item.category);
    if (menuView === "card") {
      return (
        <Link
          key={item.id}
          href={`/menu/${item.slug}`}
          className="order-menu-card"
          aria-label={item.name}
        >
          <span className="order-menu-card-photo">
            <Image src={src} alt="" fill className="cover" sizes="240px" />
            {(item.isNew || item.isHighlighted || item.hasDiscount) && (
              <span className="order-menu-card-tags">
                {item.isNew && <span className="neo-badge neo-badge-gold">New</span>}
                {item.isHighlighted && (
                  <span className="neo-badge neo-badge-ink">Signature</span>
                )}
                {item.hasDiscount && <span className="neo-badge neo-badge-rose">Offer</span>}
              </span>
            )}
          </span>
          <span className="order-menu-card-body">
            <strong>
              <span className={clsx("veg-dot", !item.isVeg && "non")} />
              <span className="order-menu-card-title">{item.name}</span>
            </strong>
            <small>{item.description || " "}</small>
          </span>
        </Link>
      );
    }
    return (
      <Link
        key={item.id}
        href={`/menu/${item.slug}`}
        className="order-menu-row"
        aria-label={item.name}
      >
        <span className="order-menu-thumb">
          <Image src={src} alt="" fill className="cover" sizes="84px" />
        </span>
        <span className="order-menu-meta">
          <strong>
            <span className={clsx("veg-dot", !item.isVeg && "non")} style={{ marginRight: 6 }} />
            {item.name}
          </strong>
          <span>
            {item.isNew && <span className="neo-badge neo-badge-gold">New</span>}{" "}
            {item.isHighlighted && <span className="neo-badge neo-badge-ink">Signature</span>}
          </span>
          {item.description && <small>{item.description}</small>}
        </span>
      </Link>
    );
  }

  return (
    <PublicShell>
      <section className="section public-menu">
        <div className="wrap">
          <div className="public-menu-tools">
            <div className="order-toolbar">
              <label className="search-box">
                <Search size={18} />
                <input
                  placeholder="Search the menu…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button
                type="button"
                className={clsx("chip veg-toggle", vegOnly && "chip-on")}
                aria-pressed={vegOnly}
                onClick={() => setVegOnly((v) => !v)}
              >
                <span className="veg-dot" aria-hidden />
                Veg
              </button>
              <div className="view-switch" role="group" aria-label="Menu layout">
                <button
                  type="button"
                  className={clsx(menuView === "card" && "on")}
                  aria-pressed={menuView === "card"}
                  onClick={() => chooseMenuView("card")}
                >
                  <LayoutGrid size={15} /> Card
                </button>
                <button
                  type="button"
                  className={clsx(menuView === "present" && "on")}
                  aria-pressed={menuView === "present"}
                  onClick={() => chooseMenuView("present")}
                >
                  <List size={15} /> Present
                </button>
              </div>
            </div>
            <CategoryBar
              categories={categories}
              value={active}
              moreOpen={moreCatsOpen}
              onMoreOpenChange={setMoreCatsOpen}
              onChange={(next) => {
                setActive(next);
                setMoreCatsOpen(false);
              }}
            />
          </div>

          {grouped.map(([cat, list]) => (
            <section key={cat} className="public-menu-group">
              <h2 className="menu-cat">{cat}</h2>
              <div className={clsx("order-menu-list public-menu-list", menuView === "card" && "is-cards")}>
                {list.map(renderItem)}
              </div>
            </section>
          ))}

          {grouped.length === 0 && (
            <p className="muted" style={{ textAlign: "center", padding: "4rem 0" }}>
              Nothing matches your search. Try another word.
            </p>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
