"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarHeart,
  Gift,
  MapPin,
  QrCode,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { ScrollHint } from "@/components/ScrollHint";
import { LunarSky } from "@/components/LunarSky";
import { HeroCarousel } from "@/components/HeroCarousel";
import { usePrefs } from "@/components/Providers";
import { CAFE } from "@/lib/cafe";
import { CAFE_MEDIA, imageForMenuItem } from "@/lib/media";
import { EXPLORE } from "@/lib/explore";
import { slugify } from "@/lib/slug";

const TASTES = EXPLORE;

const CATEGORIES = [
  { name: "Hot Coffees", note: "Slow pour", img: "/media/menu/coffee.jpg", href: "/menu/lunar-lattes" },
  { name: "Mocktails", note: "Garden ice", img: "/media/menu/mocktail-3.jpg", href: "/menu/mocktails" },
  { name: "Pizzas", note: "Wood fire", img: "/media/menu/pizza-2.jpg", href: "/menu/wood-fired-pizza" },
  { name: "Pastas", note: "Silk sauce", img: "/media/menu/pasta.jpg", href: "/menu/creamy-pasta" },
  { name: "Burgers", note: "Stacked", img: "/media/menu/burger-2.jpg", href: "/menu/burgers" },
  { name: "Desserts", note: "Last bite", img: "/media/menu/dessert.jpg", href: "/menu/desserts" },
];

const ROOMS = [
  {
    n: "01",
    name: "Mint dining room",
    d: "Cherry blossoms, terrazzo floors, and the barista bar.",
    img: CAFE_MEDIA.interior,
  },
  {
    n: "02",
    name: "Floral arch",
    d: "Golden-hour glow after dark.",
    img: CAFE_MEDIA.arch,
  },
  {
    n: "03",
    name: "Garden patio",
    d: "A hideaway that lights up once the sun drops.",
    img: CAFE_MEDIA.patio,
  },
];

const SIGNATURES = [
  {
    name: "Chipotle Chicken Tikka",
    em: "Tikka",
    d: "Fresh. Smoky. Served on river stones with mint chutney.",
    facts: [
      { k: "Heat", v: "Smoky chipotle" },
      { k: "Served", v: "River stones" },
      { k: "Finish", v: "Mint chutney" },
    ],
    img: CAFE_MEDIA.signature,
  },
  {
    name: "Lunar Black Beauty",
    em: "Beauty",
    d: "Milk, espresso, choco charcoal and honey — our house latte.",
    facts: [
      { k: "Base", v: "Espresso" },
      { k: "Milk", v: "Steamed" },
      { k: "Finish", v: "Honey" },
    ],
    img: imageForMenuItem("Lunar Black Beauty", "Hot Coffees"),
  },
  {
    name: "Creamy Burrata Bliss",
    em: "Bliss",
    d: "Creamy burrata with tomato and basil, from the wood oven.",
    facts: [
      { k: "Base", v: "Wood-fired" },
      { k: "Cheese", v: "Burrata" },
      { k: "Finish", v: "Basil" },
    ],
    img: imageForMenuItem("Creamy Burrata Bliss", "Pizzas"),
  },
].map((s) => ({ ...s, href: `/menu/${slugify(s.name)}` }));

const SIG_MS = 5200;
const ROOM_MS = 5200;

const REVIEWS = [
  {
    text: "The garden patio at night is unreal. Lunar Sky Latte and Chipotle Tikka — instantly our go-to.",
    who: "Ananya R.",
    initials: "AR",
  },
  {
    text: "Ordering from the table QR with friends was seamless. Everyone added to one bill.",
    who: "Karthik M.",
    initials: "KM",
  },
  {
    text: "Mint interiors, great coffee, and calm vibes in the middle of Jubilee Hills.",
    who: "Sana K.",
    initials: "SK",
  },
];

export default function HomePage() {
  const { tr } = usePrefs();
  const [room, setRoom] = useState(0);
  const [roomPaused, setRoomPaused] = useState(false);
  const [sig, setSig] = useState(0);
  const [sigPaused, setSigPaused] = useState(false);
  const dish = SIGNATURES[sig];

  useEffect(() => {
    if (roomPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(
      () => setRoom((n) => (n + 1) % ROOMS.length),
      ROOM_MS,
    );
    return () => window.clearTimeout(t);
  }, [room, roomPaused]);

  useEffect(() => {
    if (sigPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(
      () => setSig((n) => (n + 1) % SIGNATURES.length),
      SIG_MS,
    );
    return () => window.clearTimeout(t);
  }, [sig, sigPaused]);

  return (
    <PublicShell>
      <div className="home-canvas">
      <LunarSky variant="thin" />
      {/* HERO */}
      <section className="hero">
        <LunarSky />
        <div className="wrap hero-grid">
          <div>
            <motion.span
              className="eyebrow"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Jubilee Hills · Hyderabad
            </motion.span>
            <motion.h1
              className="h-display h-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              A space to <em>pause.</em>
              <br />A place to <em>connect.</em>
            </motion.h1>
            <motion.p
              className="lead"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
            >
              Artisanal coffee and gourmet fusion plates in a mint-and-sky garden
              hideaway. Scan your table QR to order with friends — one table,
              one shared bill.
            </motion.p>
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/menu" className="btn btn-gold btn-lg">
                {tr.viewMenu} <ArrowRight size={18} />
              </Link>
              <Link href="/reserve" className="btn btn-outline-light btn-lg">
                {tr.bookTable}
              </Link>
            </motion.div>
            <motion.div
              className="hero-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div>
                <strong>4.5★</strong>
                <span>332+ REVIEWS</span>
              </div>
              <div>
                <strong>150+</strong>
                <span>DISHES &amp; DRINKS</span>
              </div>
              <div>
                <strong>11 – 11:30</strong>
                <span>OPEN DAILY</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            <HeroCarousel />
          </motion.div>
        </div>
      </section>

      <ScrollHint className="taste-strip" loop autoScroll>
        <div className="taste-track" id="favourites" aria-label="Our favourites">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="taste-set"
              aria-hidden={copy === 1 ? true : undefined}
            >
              {TASTES.map((t, i) => (
                <Link
                  href={`/menu/${t.slug}`}
                  key={`${copy}-${t.slug}`}
                  className="taste-item"
                  style={{ "--c": t.accent } as CSSProperties}
                  tabIndex={copy === 1 ? -1 : undefined}
                >
                  <Image src={t.img} alt={t.name} fill className="cover" sizes="240px" />
                  <span className="taste-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="taste-glass">
                    <span className="taste-text">
                      <span className="taste-note">{t.note}</span>
                      <span className="taste-name">{t.name}</span>
                    </span>
                    <span className="taste-arrow" aria-hidden>
                      <ArrowRight size={16} />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </ScrollHint>

      {/* ROOMS — expanding strip */}
      <section
        className="hm-rooms"
        onMouseEnter={() => setRoomPaused(true)}
        onMouseLeave={() => setRoomPaused(false)}
      >
        <div className="wrap">
          <div className="hm-kicker">
            <span className="eyebrow">The Lunar world</span>
            <Link href="/gallery" className="hm-text-link">
              Full gallery <ArrowRight size={14} />
            </Link>
          </div>
          <h2 className="h-display h-lg hm-title">
            Made for <em>slow evenings</em>
          </h2>
          <p className="hm-lede">
            Walk one room at a time — dining, the arch, then the patio after dark.
          </p>

          <div className="hm-room-strip" role="tablist" aria-label="Cafe rooms">
            {ROOMS.map((r, i) => {
              const on = i === room;
              return (
                <button
                  key={r.n}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={`${r.n} ${r.name}`}
                  className={`hm-room-panel${on ? " on" : ""}`}
                  onClick={() => setRoom(i)}
                >
                  <span className="hm-room-frame">
                    <Image
                      src={r.img}
                      alt=""
                      fill
                      className="cover"
                      sizes="(max-width: 960px) 70vw, 50vw"
                      priority={i === 0}
                    />
                  </span>
                  <span className="hm-room-veil" aria-hidden />
                  <span className="hm-room-meta">
                    <span className="hm-room-n">{r.n}</span>
                    <span className="hm-room-name">{r.name}</span>
                    {on && <span className="hm-room-d">{r.d}</span>}
                  </span>
                  {on && (
                    <span
                      className="hm-room-bar"
                      style={{
                        animationDuration: `${ROOM_MS}ms`,
                        animationPlayState: roomPaused ? "paused" : "running",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SIGNATURE — several house dishes */}
      <section
        className="hm-sig"
        onMouseEnter={() => setSigPaused(true)}
        onMouseLeave={() => setSigPaused(false)}
      >
        <div className="wrap hm-sig-inner">
          <div className="hm-plate">
            <AnimatePresence mode="wait">
              <motion.div
                key={dish.img + dish.name}
                className="hm-plate-frame"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <Image
                  src={dish.img}
                  alt={dish.name}
                  fill
                  className="cover"
                  sizes="(max-width: 960px) 92vw, 380px"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="hm-sig-copy">
            <span className="eyebrow">
              <Sparkles size={14} /> House signatures
            </span>
            <h2 className="h-display h-lg hm-sig-title">
              {dish.name.replace(dish.em, "").trim()} <em>{dish.em}</em>
            </h2>
            <p className="hm-lede hm-sig-lede">{dish.d}</p>
            <ul className="hm-sig-pills">
              {dish.facts.map((f) => (
                <li key={f.k}>
                  <small>{f.k}</small>
                  <b>{f.v}</b>
                </li>
              ))}
            </ul>
            <div className="hm-sig-actions">
              <div className="hm-sig-rail" role="tablist" aria-label="House signatures">
                {SIGNATURES.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    role="tab"
                    aria-selected={i === sig}
                    aria-label={s.name}
                    className={i === sig ? "on" : undefined}
                    onClick={() => setSig(i)}
                  >
                    {String(i + 1).padStart(2, "0")}
                    {i === sig && (
                      <span
                        className="hm-sig-bar"
                        style={{ animationDuration: `${SIG_MS}ms`, animationPlayState: sigPaused ? "paused" : "running" }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <Link href={dish.href} className="btn btn-gold hm-sig-btn">
                View dish <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CRAVE */}
      <section className="hm-crave">
        <div className="wrap">
          <Reveal>
            <div className="hm-kicker">
              <span className="eyebrow">The menu</span>
              <Link href="/menu" className="hm-text-link">
                Full menu <ArrowRight size={14} />
              </Link>
            </div>
            <h2 className="h-display h-lg hm-title">
              What are you <em>craving?</em>
            </h2>
            <p className="hm-lede">{tr.scanHint}</p>
          </Reveal>
          <div className="hm-crave-mosaic">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.05} className={`hm-crave-tile is-${i + 1}`}>
                <Link href={c.href} className="hm-crave-card" style={{ position: "relative" }}>
                  <Image
                    src={c.img}
                    alt={c.name}
                    fill
                    className="cover"
                    sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 33vw"
                  />
                  <span className="hm-crave-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="hm-crave-cap">
                    <small>{c.note}</small>
                    <b>{c.name}</b>
                  </span>
                  <span className="hm-crave-go" aria-hidden>
                    <ArrowRight size={16} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RITUAL */}
      <section className="hm-ritual">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">Table ordering</span>
            <h2 className="h-display h-lg hm-title hm-ritual-title">
              One QR. One table. <em>One bill.</em>
            </h2>
          </Reveal>
          <ol className="hm-ritual-steps">
            {[
              {
                icon: <QrCode size={22} />,
                t: "Scan your table",
                mini: "Scan",
                note: "Start the table",
                d: "The first guest starts the table and receives a 6-digit group code.",
              },
              {
                icon: <Users size={22} />,
                t: "Friends join with code",
                mini: "Join",
                note: "Share one cart",
                d: "Everyone adds dishes to one live shared cart — nobody else can hijack it.",
              },
              {
                icon: <Star size={22} />,
                t: "Waiter confirms",
                mini: "Confirm",
                note: "Sent to kitchen",
                d: "Your order is approved, sent to the kitchen, and tracked live.",
              },
            ].map((s, i) => (
              <li key={s.t} className="hm-ritual-step">
                <Reveal delay={i * 0.1}>
                  <span className="hm-ritual-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="hm-ritual-icon">{s.icon}</span>
                  <h3>
                    <span className="hm-wide">{s.t}</span>
                    <span className="hm-mini">{s.mini}</span>
                  </h3>
                  <p>
                    <span className="hm-wide">{s.d}</span>
                    <span className="hm-mini">{s.note}</span>
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* VOICES */}
      <section className="hm-voices">
        <div className="wrap">
          <Reveal>
            <div className="hm-kicker">
              <div className="hm-voices-head">
                <span className="eyebrow">Loved by regulars</span>
                <span className="hm-voices-rating">
                  <span className="hm-voices-stars" aria-hidden>
                    ★★★★★
                  </span>
                  4.5 · 332+ on Google
                </span>
              </div>
              <Link href="/feedback" className="hm-text-link is-on-dark">
                Share yours <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
          <div className="hm-voices-grid" aria-label="Guest reviews">
            <Reveal className="hm-voices-lead">
              <p className="hm-voices-quote">“{REVIEWS[0].text}”</p>
              <div className="hm-voices-who">
                <span className="hm-voices-avatar" aria-hidden>
                  {REVIEWS[0].initials}
                </span>
                <div className="hm-voices-meta">
                  <span className="hm-voices-stars">★★★★★</span>
                  <b>{REVIEWS[0].who}</b>
                  <small>332+ reviews · 4.5 on Google</small>
                </div>
              </div>
            </Reveal>
            <div className="hm-voices-side">
              {REVIEWS.slice(1).map((r, i) => (
                <Reveal key={r.who} delay={0.1 + i * 0.08}>
                  <blockquote className="hm-voices-card">
                    <p>“{r.text}”</p>
                    <cite>
                      <span className="hm-voices-avatar" aria-hidden>
                        {r.initials}
                      </span>
                      {r.who}
                    </cite>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VISIT */}
      <section className="hm-visit">
        <div className="wrap hm-visit-grid">
          <Reveal>
            <Link href="/reserve" className="hm-visit-cell">
              <span className="hm-visit-icon">
                <CalendarHeart size={22} />
              </span>
              <h3>
                <span className="hm-wide">Reserve a table</span>
                <span className="hm-mini">Reserve</span>
              </h3>
              <p>
                <span className="hm-wide">Free booking. A table is assigned when you arrive.</span>
                <span className="hm-mini">Free to book</span>
              </p>
              <span className="hm-visit-go">
                <span className="hm-visit-go-label">Book now</span>
                <ArrowRight size={16} />
              </span>
            </Link>
          </Reveal>
          <Reveal delay={0.08}>
            <Link href="/loyalty" className="hm-visit-cell">
              <span className="hm-visit-icon">
                <Gift size={22} />
              </span>
              <h3>
                <span className="hm-wide">Lunar Rewards</span>
                <span className="hm-mini">Rewards</span>
              </h3>
              <p>
                <span className="hm-wide">100 welcome points. Earn on every paid bill.</span>
                <span className="hm-mini">100 welcome pts</span>
              </p>
              <span className="hm-visit-go">
                <span className="hm-visit-go-label">Join free</span>
                <ArrowRight size={16} />
              </span>
            </Link>
          </Reveal>
          <Reveal delay={0.16}>
            <Link href="/contact" className="hm-visit-cell">
              <span className="hm-visit-icon">
                <MapPin size={22} />
              </span>
              <h3>
                <span className="hm-wide">Find us</span>
                <span className="hm-mini">Find us</span>
              </h3>
              <p>
                <span className="hm-wide">{CAFE.addressLines.join(", ")}</span>
                <span className="hm-mini">Jubilee Hills</span>
              </p>
              <span className="hm-visit-go">
                <span className="hm-visit-go-label">Directions</span>
                <ArrowRight size={16} />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      </div>
    </PublicShell>
  );
}
