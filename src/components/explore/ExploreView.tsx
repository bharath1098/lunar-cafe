"use client";

import "./explore.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, QrCode, Users, UtensilsCrossed } from "lucide-react";
import clsx from "clsx";
import { PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { ScrollHint } from "@/components/ScrollHint";
import { CoreScatter } from "@/components/explore/CoreScatter";
import { EXPLORE, getExplore, type Explore } from "@/lib/explore";
import { imageForMenuItem } from "@/lib/media";
import { getTasteProfile } from "@/lib/taste-profile";
import { TasteProfile } from "@/components/explore/TasteProfile";

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
};

const META_ICONS = [Users, Clock, UtensilsCrossed];

function themeVars(t: Explore["theme"]): CSSProperties {
  return {
    "--ex-deep": t.deep,
    "--ex-main": t.main,
    "--ex-light": t.light,
    "--ex-soft": t.soft,
    "--ex-on": t.onMain,
  } as CSSProperties;
}

export function ExploreView({ slug }: { slug: string }) {
  const item = getExplore(slug)!;
  const taste = getTasteProfile(item.slug);
  const index = EXPLORE.findIndex((e) => e.slug === slug);
  const next = EXPLORE[(index + 1) % EXPLORE.length];
  const prev = EXPLORE[(index - 1 + EXPLORE.length) % EXPLORE.length];

  const [menu, setMenu] = useState<PublicItem[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/public")
      .then((r) => r.json())
      .then((d) => alive && setMenu(d.menu || []))
      .catch(() => alive && setMenu([]));
    return () => {
      alive = false;
    };
  }, []);

  // start every flavour at the top, like opening a new page
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  const dishes = useMemo(
    () => (menu || []).filter((m) => item.categories.includes(m.category)),
    [menu, item.categories],
  );

  return (
    <PublicShell>
      <div className="ex-page" style={themeVars(item.theme)} key={slug}>
        {/* ---------- HERO ---------- */}
        <section className="ex-hero">
          <div className="ex-hero-bg">
            <motion.div
              className="ex-pattern"
              data-pattern={item.pattern}
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

          <CoreScatter slug={item.slug} />

          <div className="ex-hero-inner">
            <motion.span
              className="ex-script"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              {item.note}
            </motion.span>
            <motion.h1
              className="ex-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.8 }}
            >
              {item.name}
            </motion.h1>
            <div className="ex-rule" />
            <motion.p
              className="ex-kind"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {item.kind}
            </motion.p>
            <motion.a
              href="#on-our-menu"
              className="ex-pill"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              See on the menu
            </motion.a>
            <motion.dl
              className="ex-meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {item.meta.map((row, i) => {
                const Icon = META_ICONS[i] || Users;
                return (
                  <div key={row.label}>
                    <dt>
                      <Icon size={14} /> {row.label}
                    </dt>
                    <dd>{row.value}</dd>
                  </div>
                );
              })}
            </motion.dl>
          </div>

          <motion.div
            className="ex-badge"
            initial={{ opacity: 0, scale: 0.6, rotate: -40 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`Intensity ${item.intensity} out of 10`}
          >
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path id="ex-ring" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
              </defs>
              <text>
                <textPath href="#ex-ring" textLength="293" lengthAdjust="spacing">
                  INTENSITY · INTENSITY · INTENSITY ·
                </textPath>
              </text>
            </svg>
            <strong>{item.intensity}</strong>
          </motion.div>

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
              <span>★</span>
            </div>
          </motion.div>

          <motion.div
            className="ex-plate"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ex-plate-photo">
              <Image src={item.img} alt={item.name} fill priority className="cover" sizes="300px" />
            </div>
          </motion.div>
        </section>

        {/* ---------- STORY (left) + TASTE RINGS (right) ---------- */}
        <section className="ex-story">
          <div className="ex-wrap ex-story-grid">
            <Reveal>
              <p className="ex-eyebrow">The story</p>
              <p className="ex-story-text">{item.story}</p>
            </Reveal>
            {taste ? (
              <TasteProfile profile={taste} />
            ) : null}
          </div>
        </section>

        {/* ---------- GALLERY ---------- */}
        <section className="ex-section ex-gallery-sec">
          <div className="ex-wrap">
            <Reveal>
              <p className="ex-eyebrow ex-center">Moments</p>
              <h2 className="ex-h2">
                Made with <em>care</em>
              </h2>
            </Reveal>
            <div className="ex-gallery" data-count={item.gallery.length}>
              {item.gallery.map((src, i) => (
                <Reveal key={src} delay={i * 0.08} className="ex-shot">
                  <div className="ex-shot-media">
                    <Image
                      src={src}
                      alt={`${item.name} ${i + 1}`}
                      fill
                      className="cover"
                      sizes="(max-width: 720px) 50vw, (max-width: 1100px) 40vw, 360px"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- HOW IT'S MADE ---------- */}
        <section className="ex-section">
          <div className="ex-wrap">
            <Reveal>
              <p className="ex-eyebrow ex-center">Preparation</p>
              <h2 className="ex-h2">
                How we <em>make</em> it
              </h2>
            </Reveal>
            <div className="ex-steps">
              {item.steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08} className="ex-step">
                  <span className="ex-step-no">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- ON OUR MENU ---------- */}
        <section className="ex-section ex-menu-sec" id="on-our-menu">
          <div className="ex-wrap">
            <Reveal>
              <p className="ex-eyebrow ex-center">On our menu</p>
              <h2 className="ex-h2">
                Try it <em>today</em>
              </h2>
            </Reveal>

            {menu === null && <p className="ex-muted">Loading dishes…</p>}
            {menu !== null && dishes.length === 0 && (
              <p className="ex-muted">Ask your server for today&apos;s specials.</p>
            )}

            <div className="ex-dishes">
              {dishes.slice(0, 8).map((d, i) => (
                <Reveal key={d.id} delay={(i % 4) * 0.06} y={18}>
                  <Link href={`/menu/${d.slug}`} className="ex-dish-link" aria-label={d.name}>
                  <article className="ex-dish">
                    <div className="ex-dish-photo">
                      <Image
                        src={d.image || imageForMenuItem(d.name, d.category)}
                        alt={d.name}
                        fill
                        className="cover"
                        sizes="(max-width: 600px) 80vw, 260px"
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

            <div className="ex-cta-row">
              <Link href="/menu" className="ex-pill ex-pill-solid">
                Full menu <ArrowRight size={16} />
              </Link>
              <Link href="/reserve" className="ex-pill ex-pill-ghost">
                Book a table
              </Link>
            </div>

            <div className="ex-scan">
              <QrCode size={26} />
              <p>
                <strong>Scan the QR on your table</strong> to order this and add it to your table&apos;s
                shared bill.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- EXPLORE MORE ---------- */}
        <section className="ex-section ex-more-sec">
          <div className="ex-wrap">
            <Reveal>
              <p className="ex-eyebrow ex-center">Keep exploring</p>
              <h2 className="ex-h2">
                More <em>flavours</em>
              </h2>
            </Reveal>
            <ScrollHint className="ex-more">
              {EXPLORE.filter((e) => e.slug !== slug).map((e) => (
                <Link
                  key={e.slug}
                  href={`/menu/${e.slug}`}
                  className="ex-more-card"
                  style={{ "--m": e.theme.main, "--md": e.theme.deep, "--mo": e.theme.onMain } as CSSProperties}
                >
                  <Image src={e.img} alt={e.name} fill className="cover" sizes="220px" />
                  <span className="ex-more-bar">
                    <span>
                      <small>{e.note}</small>
                      <b>{e.name}</b>
                    </span>
                    <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
            </ScrollHint>

            <div className="ex-pager">
              <Link
                href={`/menu/${prev.slug}`}
                className="ex-pager-card"
                style={{ "--m": prev.theme.main, "--mo": prev.theme.onMain } as CSSProperties}
              >
                <ArrowLeft size={18} />
                <span>
                  <small>Previous</small>
                  <b>{prev.name}</b>
                </span>
              </Link>
              <Link
                href={`/menu/${next.slug}`}
                className="ex-pager-card next"
                style={{ "--m": next.theme.main, "--mo": next.theme.onMain } as CSSProperties}
              >
                <span>
                  <small>Next flavour</small>
                  <b>{next.name}</b>
                </span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
