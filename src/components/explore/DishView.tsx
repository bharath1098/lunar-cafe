"use client";

import "./explore.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Leaf, QrCode, Sparkles, Tag } from "lucide-react";
import clsx from "clsx";
import { PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { CoreScatter } from "@/components/explore/CoreScatter";
import { themeForCategory } from "@/lib/explore";
import { imageForMenuItem } from "@/lib/media";

export type DishData = {
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
  variants?: { id: string; label: string }[];
  choices?: { id: string; label: string; options: string[] }[];
};

function vars(t: ReturnType<typeof themeForCategory>["theme"]): CSSProperties {
  return {
    "--ex-deep": t.deep,
    "--ex-main": t.main,
    "--ex-light": t.light,
    "--ex-soft": t.soft,
    "--ex-on": t.onMain,
  } as CSSProperties;
}

/**
 * Menu descriptions are mostly ingredient lists ("Milk, espresso, blue pea") or
 * "Served with ..." lines. Split them into tidy items; if the text reads like
 * a sentence instead, return nothing and let the plain description speak.
 */
function parseDescription(desc: string): { label: string; ring: string; items: string[] } {
  const none = { label: "", ring: "", items: [] as string[] };
  let text = desc.trim().replace(/\.$/, "");
  if (!text) return none;

  let label = "What's inside";
  let ring = "INGREDIENTS";
  const served = text.match(/^served\s+with\s+/i);
  if (served) {
    label = "Served with";
    ring = "SERVED WITH";
    text = text.slice(served[0].length);
  }

  const items = text
    .split(/\s*(?:,|&|\+|\band\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  if (items.length === 0 || items.length > 9 || items.some((s) => s.length > 34)) return none;
  return { label, ring, items };
}

export function DishView({
  dish,
  related,
  prev,
  next,
}: {
  dish: DishData;
  related: DishData[];
  prev?: DishData;
  next?: DishData;
}) {
  const { flavour, theme, pattern } = themeForCategory(dish.category);
  const photo = dish.image || imageForMenuItem(dish.name, dish.category);
  const parts = parseDescription(dish.description || "");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [dish.slug]);

  const badges = [
    dish.isHighlighted && "Signature",
    dish.isNew && "New",
    dish.hasDiscount && "Offer",
  ].filter(Boolean) as string[];

  const meta = [
    { label: "Category", value: dish.category, Icon: Tag },
    { label: "Type", value: dish.isVeg ? "Vegetarian" : "Non-vegetarian", Icon: Leaf },
    {
      label: "Highlight",
      value: badges[0] || "Made fresh",
      Icon: Sparkles,
    },
  ];

  const detailLines = [
    ...(dish.variants?.length
      ? [{ title: "Sizes & options", text: dish.variants.map((v) => v.label).join(" · ") }]
      : []),
    ...(dish.choices || []).map((c) => ({
      title: c.label,
      text: c.options.join(" · "),
    })),
  ];

  return (
    <PublicShell>
      <div className="ex-page" style={vars(theme)} key={dish.slug}>
        {/* ---------- HERO ---------- */}
        <section className="ex-hero">
          <div className="ex-hero-bg">
            <motion.div
              className="ex-pattern"
              data-pattern={pattern}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="ex-tri"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            />
          </div>

          <CoreScatter slug={flavour?.slug} compact />

          <div className="ex-hero-inner">
            <motion.span
              className="ex-script"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              {dish.category}
            </motion.span>
            <motion.h1
              className="ex-title ex-title-dish"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.8 }}
            >
              {dish.name}
            </motion.h1>
            <div className="ex-rule" />
            {dish.description && (
              <motion.p
                className="ex-kind"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {dish.description}
              </motion.p>
            )}
            <motion.a
              href="#order"
              className="ex-pill"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              How to order
            </motion.a>
            <motion.dl
              className="ex-meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {meta.map(({ label, value, Icon }) => (
                <div key={label}>
                  <dt>
                    <Icon size={14} /> {label}
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {parts.items.length > 0 && (
            <motion.div
              className="ex-badge"
              initial={{ opacity: 0, scale: 0.6, rotate: -40 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              aria-label={`${parts.items.length} ${parts.label.toLowerCase()}`}
            >
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <defs>
                  <path id="ex-ring" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
                </defs>
                <text>
                  <textPath href="#ex-ring" textLength="293" lengthAdjust="spacing">
                    {`${parts.ring} · ${parts.ring} · ${parts.ring} ·`}
                  </textPath>
                </text>
              </svg>
              <strong>{parts.items.length}</strong>
            </motion.div>
          )}

          <motion.div
            className="ex-seal"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            aria-hidden="true"
          >
            <div className="ex-seal-coin">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path id="ex-seal-ring" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                </defs>
                <text>
                  <textPath href="#ex-seal-ring" textLength="274" lengthAdjust="spacing">LUNAR CAFE · JUBILEE HILLS · HYDERABAD ·</textPath>
                </text>
              </svg>
              <span>{dish.isVeg ? "✿" : "★"}</span>
            </div>
          </motion.div>

          <motion.div
            className="ex-plate"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ex-plate-photo">
              <Image src={photo} alt={dish.name} fill priority className="cover" sizes="300px" />
            </div>
          </motion.div>
        </section>

        {/* ---------- ABOUT + ORDER ---------- */}
        <section className="ex-story" id="order">
          <div className="ex-wrap ex-story-grid">
            <Reveal>
              <p className="ex-eyebrow">About this dish</p>
              <p className="ex-story-text">
                {dish.description
                  ? `${dish.description}.`
                  : `${dish.name} is made fresh to order from our ${dish.category} menu.`}{" "}
                {flavour && `Part of our ${flavour.name.toLowerCase()} family: ${flavour.kind.toLowerCase()}.`}
              </p>
              {parts.items.length > 0 && (
                <div className="ex-inside">
                  <p className="ex-eyebrow">{parts.label}</p>
                  <ul>
                    {parts.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              )}
              {badges.length > 0 && (
                <div className="ex-badges">
                  {badges.map((b) => (
                    <span key={b}>{b}</span>
                  ))}
                  <span className={clsx("ex-type", !dish.isVeg && "non")}>
                    <i className={clsx("ex-veg", !dish.isVeg && "non")} />
                    {dish.isVeg ? "Veg" : "Non-veg"}
                  </span>
                </div>
              )}
              {detailLines.length > 0 && (
                <dl className="ex-options">
                  {detailLines.map((d) => (
                    <div key={d.title}>
                      <dt>{d.title}</dt>
                      <dd>{d.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Reveal>

            <Reveal delay={0.1}>
              <div className="ex-order-card">
                <QrCode size={34} />
                <h3>Order it at your table</h3>
                <p>
                  Scan the QR on your table to see prices, customise and add{" "}
                  <strong>{dish.name}</strong> to your table&apos;s shared bill. Friends at the table
                  can add to the same order.
                </p>
                <div className="ex-cta-row" style={{ marginTop: "1.2rem", justifyContent: "flex-start" }}>
                  <Link href="/reserve" className="ex-pill ex-pill-solid">
                    Book a table
                  </Link>
                  <Link href="/menu" className="ex-pill ex-pill-ghost-light">
                    Full menu
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- MORE FROM THIS CATEGORY ---------- */}
        {related.length > 0 && (
          <section className="ex-section ex-menu-sec">
            <div className="ex-wrap">
              <Reveal>
                <p className="ex-eyebrow ex-center">More like this</p>
                <h2 className="ex-h2">
                  More from <em>{dish.category}</em>
                </h2>
              </Reveal>
              <div className="ex-dishes">
                {related.slice(0, 8).map((d, i) => (
                  <Reveal key={d.id} delay={(i % 4) * 0.06} y={18}>
                    <Link href={`/menu/${d.slug}`} className="ex-dish-link" aria-label={d.name}>
                      <article className="ex-dish">
                        <div className="ex-dish-photo">
                          <Image
                            src={d.image || imageForMenuItem(d.name, d.category)}
                            alt={d.name}
                            fill
                            className="cover"
                            sizes="(max-width: 600px) 45vw, 260px"
                          />
                          {d.isHighlighted && <span className="ex-dish-tag">Signature</span>}
                        </div>
                        <div className="ex-dish-body">
                          <h4>
                            <span className={clsx("ex-veg", !d.isVeg && "non")} />
                            {d.name}
                          </h4>
                          {d.description && <p>{d.description}</p>}
                        </div>
                      </article>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------- PAGER ---------- */}
        <section className="ex-section ex-more-sec" style={{ paddingTop: "3rem" }}>
          <div className="ex-wrap">
            <div className="ex-pager">
              {prev ? (
                <Link
                  href={`/menu/${prev.slug}`}
                  className="ex-pager-card"
                  style={{ "--m": theme.main, "--mo": theme.onMain } as CSSProperties}
                >
                  <ArrowLeft size={18} />
                  <span>
                    <small>Previous</small>
                    <b>{prev.name}</b>
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/menu/${next.slug}`}
                  className="ex-pager-card next"
                  style={{ "--m": theme.main, "--mo": theme.onMain } as CSSProperties}
                >
                  <span>
                    <small>Next dish</small>
                    <b>{next.name}</b>
                  </span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <span />
              )}
            </div>
            {flavour && (
              <div className="ex-cta-row" style={{ marginTop: "1.6rem" }}>
                <Link href={`/menu/${flavour.slug}`} className="ex-pill ex-pill-solid">
                  Explore all {flavour.name} <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
