"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { QrCode, Search } from "lucide-react";
import clsx from "clsx";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { usePrefs } from "@/components/Providers";
import { CAFE_MEDIA, imageForMenuItem } from "@/lib/media";

type PublicItem = {
  id: string;
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
  const { tr } = usePrefs();
  const [items, setItems] = useState<PublicItem[]>([]);
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    fetch("/api/public")
      .then((r) => r.json())
      .then((d) => setItems(d.menu || []));
  }, []);

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
    const map = new Map<string, PublicItem[]>();
    for (const item of visible) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <PublicShell>
      <PageHero
        eyebrow="Our menu"
        title="Brewed with passion"
        subtitle="From barista classics to chef-special bowls. Prices and ordering unlock when you scan your table QR."
        image={CAFE_MEDIA.logoMug}
      />

      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="wrap">
          <div className="menu-toolbar">
            <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
              <label className="search-box" style={{ flex: "1 1 260px" }}>
                <Search size={18} />
                <input
                  placeholder="Search dishes, drinks, ingredients…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button
                className={clsx("chip", vegOnly && "chip-on")}
                onClick={() => setVegOnly((v) => !v)}
              >
                <span className="veg-dot" style={{ marginRight: 8 }} /> Veg only
              </button>
            </div>
            <div className="chip-row">
              {categories.map((c) => (
                <button
                  key={c}
                  className={clsx("chip", active === c && "chip-on")}
                  onClick={() => setActive(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="scan-banner" style={{ margin: "1rem 0 0" }}>
            <QrCode size={26} color="#bdeadd" />
            <div>
              <strong>{tr.scanHint}</strong>
              <div style={{ fontSize: "0.82rem", opacity: 0.75 }}>
                Find the QR on your table at Lunar Cafe.
              </div>
            </div>
          </div>

          {grouped.map(([cat, list]) => (
            <section key={cat}>
              <h2 className="menu-cat">{cat}</h2>
              <div className="dish-grid">
                {list.map((item, idx) => {
                  const src =
                    item.image || imageForMenuItem(item.name, item.category);
                  return (
                    <Reveal key={item.id} delay={(idx % 4) * 0.05} y={18}>
                      <article className="dish-card">
                        <div className="dish-photo">
                          <Image
                            src={src}
                            alt={item.name}
                            fill
                            className="cover"
                            sizes="(max-width: 600px) 90vw, 300px"
                          />
                          <div className="dish-tags">
                            {item.isNew && (
                              <span className="neo-badge neo-badge-gold">New</span>
                            )}
                            {item.isHighlighted && (
                              <span className="neo-badge neo-badge-ink">
                                Signature
                              </span>
                            )}
                            {item.hasDiscount && (
                              <span className="neo-badge neo-badge-rose">Offer</span>
                            )}
                          </div>
                        </div>
                        <div className="dish-body">
                          <h4>
                            <span className={clsx("veg-dot", !item.isVeg && "non")} />
                            {item.name}
                          </h4>
                          {item.description && <p>{item.description}</p>}
                        </div>
                      </article>
                    </Reveal>
                  );
                })}
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
