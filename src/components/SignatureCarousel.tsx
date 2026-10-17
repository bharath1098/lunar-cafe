"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CAFE_MEDIA, imageForMenuItem } from "@/lib/media";
import { slugify } from "@/lib/slug";

/** How far (radians) a plate travels along the rim between items. */
const ARC = 1.05;

const SIGNATURES = [
  {
    name: "Chipotle Chicken Tikka",
    d: "Fresh, smoky, signature fusion tikka on river stones.",
    note: "Charred over the evening service and finished with mint. Best shared once the patio lights come on.",
    category: "Starters",
    isVeg: false,
    price: 480,
    pairs: "Lunar Sky Latte",
    facts: [
      { k: "Heat", v: "Smoky chipotle" },
      { k: "Served", v: "River stones" },
      { k: "Finish", v: "Mint chutney" },
    ],
    img: CAFE_MEDIA.signature,
  },
  {
    name: "Lunar Black Beauty",
    d: "Milk, espresso, choco charcoal and honey — our house latte.",
    note: "A dark cocoa pour with a honey finish. The cup on the counter most nights in Jubilee Hills.",
    category: "Hot Coffees",
    isVeg: true,
    price: 260,
    pairs: "Burrata pizza",
    facts: [
      { k: "Base", v: "Espresso" },
      { k: "Milk", v: "Steamed" },
      { k: "Finish", v: "Honey" },
    ],
    img: imageForMenuItem("Lunar Black Beauty", "Hot Coffees"),
  },
  {
    name: "Creamy Burrata Bliss",
    d: "Creamy burrata with tomato and basil, from the wood oven.",
    note: "Torn burrata, slow tomato, and basil oil. A wood-oven plate meant to stay at the centre of the table.",
    category: "Pizzas",
    isVeg: true,
    price: 650,
    pairs: "Black Beauty",
    facts: [
      { k: "Oven", v: "Wood fired" },
      { k: "Cheese", v: "Burrata" },
      { k: "Finish", v: "Basil oil" },
    ],
    img: imageForMenuItem("Creamy Burrata Bliss", "Pizzas"),
  },
  {
    name: "Walking On The Moon",
    d: "Cranberry, grape, citrus, lychee, red apple, sparkling.",
    note: "A tall sparkling pour — cranberry, lychee, and citrus. The last round before the bill.",
    category: "Mocktails",
    isVeg: true,
    price: 290,
    pairs: "Chicken tikka",
    facts: [
      { k: "Base", v: "Cranberry" },
      { k: "Lift", v: "Sparkling" },
      { k: "Finish", v: "Lychee" },
    ],
    img: imageForMenuItem("Walking On The Moon", "Mocktails"),
  },
].map((s) => ({ ...s, href: `/menu/${slugify(s.name)}` }));

const STARS = [
  [6, 8, 2.2, 0.2, 3.1, 1],
  [14, 18, 1.2, 1.4, 4.2, 0],
  [22, 6, 1.6, 0.6, 3.6, 0],
  [31, 22, 2.4, 2.1, 4.8, 1],
  [9, 36, 1.1, 0.9, 3.4, 0],
  [18, 44, 1.8, 1.8, 5.1, 0],
  [27, 58, 1.3, 2.6, 3.8, 0],
  [4, 62, 2.1, 0.4, 4.4, 1],
  [36, 12, 1.4, 1.1, 3.2, 0],
  [42, 28, 1.1, 2.2, 4.6, 0],
  [48, 8, 1.7, 0.8, 3.9, 0],
  [12, 74, 1.5, 1.6, 4.1, 0],
  [24, 82, 2.3, 0.3, 5.4, 1],
  [38, 70, 1.2, 2.8, 3.5, 0],
  [52, 48, 1.6, 1.2, 4.7, 0],
  [58, 16, 1.1, 0.7, 3.3, 0],
  [64, 34, 2.0, 1.9, 4.9, 1],
  [71, 8, 1.3, 2.4, 3.7, 0],
  [78, 22, 1.5, 0.5, 4.3, 0],
  [84, 42, 1.2, 1.7, 5.2, 0],
  [90, 14, 2.2, 0.9, 3.6, 1],
  [68, 62, 1.4, 2.3, 4.0, 0],
  [81, 74, 1.1, 1.3, 3.8, 0],
  [93, 58, 1.8, 0.2, 4.5, 0],
  [46, 86, 1.3, 2.0, 5.0, 0],
  [16, 90, 1.6, 1.5, 3.4, 0],
] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function platePose(offset: number) {
  const abs = Math.abs(offset);
  const angle = Math.PI - offset * ARC;
  const focus = Math.max(0, 1 - abs);
  return {
    x: 50 + 50 * Math.cos(angle),
    y: 50 + 50 * Math.sin(angle),
    opacity: Math.max(0, 1 - abs * 1.08),
    scale: 0.62 + 0.38 * focus,
    z: Math.round(20 - abs * 8),
  };
}

export function SignatureCarousel() {
  const trackRef = useRef<HTMLElement>(null);
  const [indexFloat, setIndexFloat] = useState(0);
  const total = SIGNATURES.length;
  const index = Math.min(total - 1, Math.max(0, Math.round(indexFloat)));
  const dish = SIGNATURES[index];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(range, 0));
      setIndexFloat(range <= 1 ? 0 : (scrolled / range) * (total - 1));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [total]);

  const scrollToStep = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const range = Math.max(rect.height - window.innerHeight, 0);
    const top = window.scrollY + rect.top + (i / Math.max(total - 1, 1)) * range;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section
      ref={trackRef}
      className="hm-sig"
      style={{ ["--sig-steps" as string]: total }}
      aria-roledescription="carousel"
      aria-label="House signatures"
    >
      <div className="hm-sig-sticky">
        <div className="sky-stars hm-sig-stars" aria-hidden="true">
          {STARS.map(([x, y, s, d, t, bright], i) => (
            <i
              key={i}
              className={bright ? "star-bright" : undefined}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: s,
                height: s,
                animationDelay: `${d}s`,
                animationDuration: `${t}s`,
              }}
            />
          ))}
          <b className="shooting-star" />
          <b className="shooting-star s2" />
          <b className="shooting-star s3" />
          <b className="shooting-star s4" />
        </div>
        <div className="hm-sig-stage">
        <div className="hm-sig-dial" aria-hidden="true">
          <div className="hm-sig-arc" />
          <div className="hm-sig-arc-ring" />
          <div className="hm-sig-rim" />
          {SIGNATURES.map((s, i) => {
            const pose = platePose(i - indexFloat);
            return (
              <div
                key={s.name}
                className="hm-sig-plate"
                style={{
                  left: `${pose.x}%`,
                  top: `${pose.y}%`,
                  opacity: pose.opacity,
                  zIndex: pose.z,
                  transform: `translate(-50%, -50%) scale(${pose.scale})`,
                }}
              >
                <Image
                  src={s.img}
                  alt=""
                  fill
                  className="cover"
                  sizes="(max-width: 960px) 70vw, 420px"
                  draggable={false}
                  priority={i === 0}
                />
              </div>
            );
          })}
        </div>
        </div>

        <div className="wrap hm-sig-copy">
          <div className="hm-sig-heading">
            <span className="eyebrow">
              <Sparkles size={14} /> House signatures
            </span>
            <h2 className="h-display h-lg hm-title">
              A taste of <em>Lunar</em>
            </h2>
            <p className="hm-sig-intro">
              Four plates we pour and fire after dark. Scroll the moon — the next signature rolls onto its rim.
            </p>
          </div>

          <div className="hm-sig-detail">
            <div key={dish.name} className="hm-sig-detail-inner">
              <p className="hm-sig-idx" aria-live="polite">
                <span>{pad(index + 1)}</span>
                <i>/</i>
                {pad(total)}
              </p>
              <div className="hm-sig-tags">
                <span className={dish.isVeg ? "is-veg" : "is-nonveg"}>
                  {dish.isVeg ? "Veg" : "Non-veg"}
                </span>
                <span className="hm-sig-cat">{dish.category}</span>
              </div>
              <h3 className="hm-sig-name">{dish.name}</h3>
              <p className="hm-lede hm-sig-desc">{dish.d}</p>
              <p className="hm-sig-note">{dish.note}</p>
              <ul className="hm-sig-facts">
                {dish.facts.map((f) => (
                  <li key={f.k}>
                    <small>{f.k}</small>
                    <b>{f.v}</b>
                  </li>
                ))}
              </ul>
              <p className="hm-sig-pair">
                Pairs with <b>{dish.pairs}</b>
              </p>
              <div className="hm-sig-buy">
                <span className="hm-sig-price">₹{dish.price}</span>
                <Link href={dish.href} className="btn btn-gold hm-sig-cta">
                  View dish <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <div className="hm-sig-foot">
            <div className="hm-sig-thumbs" role="tablist" aria-label="Signature dishes">
              {SIGNATURES.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={s.name}
                  className={i === index ? "on" : undefined}
                  onClick={() => scrollToStep(i)}
                >
                  <span className="hm-sig-thumb">
                    <Image src={s.img} alt="" fill className="cover" sizes="56px" />
                  </span>
                  {i === index && <span className="hm-sig-thumb-bar" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Link href="/menu" className="hm-sig-menu">
          View full menu <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
