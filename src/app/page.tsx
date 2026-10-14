"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { LunarSky } from "@/components/LunarSky";
import { HeroCarousel } from "@/components/HeroCarousel";
import { usePrefs } from "@/components/Providers";
import { CAFE } from "@/lib/cafe";
import { CAFE_MEDIA, GALLERY } from "@/lib/media";

const MARQUEE = [
  "Artisanal Coffee",
  "Fusion Plates",
  "Garden Patio",
  "Lunar Lattes",
  "Mocktails & Mojitos",
  "Bubble Tea",
  "Wood-fired Tikka",
  "Slow Evenings",
];

const CATEGORIES = [
  { name: "Hot Coffees", img: "/media/menu/coffee.jpg" },
  { name: "Mocktails", img: "/media/menu/mocktail.jpg" },
  { name: "Pizzas", img: "/media/menu/pizza.jpg" },
  { name: "Pastas", img: "/media/menu/pasta.jpg" },
  { name: "Burgers", img: "/media/menu/burger.jpg" },
  { name: "Desserts", img: "/media/menu/dessert.jpg" },
];

const REVIEWS = [
  {
    text: "The garden patio at night is unreal. Lunar Sky Latte and Chipotle Tikka — instantly our go-to.",
    who: "Ananya R.",
  },
  {
    text: "Ordering from the table QR with friends was seamless. Everyone added to one bill.",
    who: "Karthik M.",
  },
  {
    text: "Mint interiors, great coffee, and calm vibes in the middle of Jubilee Hills.",
    who: "Sana K.",
  },
];

export default function HomePage() {
  const { tr } = usePrefs();

  return (
    <PublicShell>
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

      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i}>✦ {m}</span>
          ))}
        </div>
      </div>

      {/* BENTO */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">The Lunar world</span>
                <h2 className="h-display h-lg" style={{ marginTop: "0.8rem" }}>
                  Made for slow evenings
                </h2>
              </div>
              <Link href="/gallery" className="btn neo-btn-ghost btn-sm">
                Full gallery <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          <div className="bento">
            <Reveal className="bento-item" >
              <div style={{ position: "absolute", inset: 0 }}>
                <Image src={CAFE_MEDIA.interior} alt="Dining room" fill className="cover" sizes="50vw" />
              </div>
              <div className="bento-label">
                <h3>Mint dining room</h3>
                <p>Terrazzo floors, cherry blossoms, and a barista bar.</p>
              </div>
            </Reveal>
            <Reveal className="bento-item" delay={0.1}>
              <div style={{ position: "absolute", inset: 0 }}>
                <Image src={CAFE_MEDIA.arch} alt="Floral arch" fill className="cover" sizes="30vw" />
              </div>
              <div className="bento-label">
                <h3>Floral arch</h3>
                <p>Golden-hour glow after dark.</p>
              </div>
            </Reveal>
            <Reveal className="bento-item" delay={0.15}>
              <div style={{ position: "absolute", inset: 0 }}>
                <Image src={CAFE_MEDIA.drinks} alt="Layered cold brew" fill className="cover" sizes="30vw" />
              </div>
              <div className="bento-label">
                <h3>Cold brews</h3>
                <p>Passion fruit, caramel, classic.</p>
              </div>
            </Reveal>
            <Reveal className="bento-item" delay={0.2}>
              <div style={{ position: "absolute", inset: 0 }}>
                <Image src={CAFE_MEDIA.pastries} alt="Pastry counter" fill className="cover" sizes="30vw" />
              </div>
              <div className="bento-label">
                <h3>Pastry counter</h3>
                <p>Brownies, tiramisu jars &amp; more.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SIGNATURE */}
      <section className="section section-dark">
        <div className="wrap split" style={{ alignItems: "center" }}>
          <Reveal>
            <div className="arch-photo">
              <Image
                src={CAFE_MEDIA.signature}
                alt="Chipotle Chicken Tikka"
                fill
                className="cover"
                sizes="(max-width: 960px) 100vw, 45vw"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="eyebrow" style={{ color: "var(--gold-300)" }}>
              <Sparkles size={14} /> House signature
            </span>
            <h2 className="h-display h-lg" style={{ margin: "1rem 0" }}>
              Chipotle Chicken <em style={{ color: "var(--gold-300)" }}>Tikka</em>
            </h2>
            <p className="lead">
              Fresh. Smoky. Served on river stones with a mint chutney. The dish
              everyone photographs — and orders twice.
            </p>
            <div className="hero-actions">
              <Link href="/menu" className="btn btn-gold">
                See the full menu <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">Browse</span>
                <h2 className="h-display h-lg" style={{ marginTop: "0.8rem" }}>
                  What are you craving?
                </h2>
              </div>
              <p className="muted" style={{ maxWidth: 320 }}>
                {tr.scanHint}
              </p>
            </div>
          </Reveal>
          <div className="cat-grid">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.06}>
                <Link href="/menu" className="cat-tile">
                  <Image src={c.img} alt="" fill className="cover" sizes="200px" />
                  <span>{c.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <span className="eyebrow">Table ordering</span>
              <h2 className="h-display h-lg" style={{ marginTop: "0.8rem" }}>
                One QR. One table. One bill.
              </h2>
            </div>
          </Reveal>
          <div className="info-grid">
            {[
              {
                icon: <QrCode size={22} />,
                t: "Scan your table",
                d: "The first guest starts the table and receives a 6-digit group code.",
              },
              {
                icon: <Users size={22} />,
                t: "Friends join with code",
                d: "Everyone adds dishes to one live shared cart — nobody else can hijack it.",
              },
              {
                icon: <Star size={22} />,
                t: "Waiter confirms",
                d: "Your order is approved, sent to the kitchen, and tracked live.",
              },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 0.1}>
                <div className="info-card">
                  <div className="icon-bubble">{s.icon}</div>
                  <h3 className="h-display h-md">{s.t}</h3>
                  <p className="muted" style={{ lineHeight: 1.6 }}>
                    {s.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section section-dark">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow" style={{ color: "var(--gold-300)" }}>
              Loved by regulars
            </span>
            <h2 className="h-display h-lg" style={{ margin: "0.8rem 0 2rem" }}>
              Kind words
            </h2>
          </Reveal>
          <div className="info-grid">
            {REVIEWS.map((r, i) => (
              <Reveal key={r.who} delay={i * 0.1}>
                <div
                  className="info-card"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    boxShadow: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--on-dark)",
                    height: "100%",
                  }}
                >
                  <div style={{ color: "var(--gold-300)", marginBottom: "0.6rem" }}>
                    ★★★★★
                  </div>
                  <p style={{ lineHeight: 1.7, margin: 0 }}>“{r.text}”</p>
                  <p style={{ marginTop: "1rem", opacity: 0.6, fontSize: "0.85rem" }}>
                    — {r.who}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <div style={{ marginTop: "1.6rem" }}>
            <Link href="/feedback" className="btn btn-outline-light btn-sm">
              Read more &amp; share yours
            </Link>
          </div>
        </div>
      </section>

      {/* CTA TRIO */}
      <section className="section">
        <div className="wrap info-grid">
          <Reveal>
            <Link href="/reserve" className="info-card" style={{ display: "block" }}>
              <div className="icon-bubble">
                <CalendarHeart size={22} />
              </div>
              <h3 className="h-display h-md">Reserve a table</h3>
              <p className="muted">Free booking. A table is assigned when you arrive.</p>
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <Link href="/loyalty" className="info-card" style={{ display: "block" }}>
              <div className="icon-bubble">
                <Gift size={22} />
              </div>
              <h3 className="h-display h-md">Lunar Rewards</h3>
              <p className="muted">100 welcome points. Earn on every paid bill.</p>
            </Link>
          </Reveal>
          <Reveal delay={0.2}>
            <Link href="/contact" className="info-card" style={{ display: "block" }}>
              <div className="icon-bubble">
                <MapPin size={22} />
              </div>
              <h3 className="h-display h-md">Find us</h3>
              <p className="muted">{CAFE.addressLines.join(", ")}</p>
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head">
            <h2 className="h-display h-md">From our lens</h2>
            <Link href="/gallery" className="muted">
              View all →
            </Link>
          </div>
          <div className="cat-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))" }}>
            {GALLERY.slice(0, 6).map((g) => (
              <div key={g.src} className="cat-tile" style={{ aspectRatio: "1/1", borderRadius: 24 }}>
                <Image src={g.src} alt={g.title} fill className="cover" sizes="160px" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
