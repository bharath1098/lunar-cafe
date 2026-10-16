"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Star } from "lucide-react";
import { CAFE_MEDIA } from "@/lib/media";

const SLIDES = [
  {
    src: CAFE_MEDIA.logoMug,
    tag: "Coffee",
    title: "Lunar Latte",
    sub: "Artisanal coffee, poured slow",
  },
  {
    src: CAFE_MEDIA.patio,
    tag: "Ambience",
    title: "The Garden Patio",
    sub: "Open-air evenings under the lights",
  },
  {
    src: CAFE_MEDIA.signature,
    tag: "Signature",
    title: "Chipotle Chicken Tikka",
    sub: "Smoky, fresh, served on river stones",
  },
  {
    src: CAFE_MEDIA.interior,
    tag: "Interiors",
    title: "The Mint Dining Room",
    sub: "Terrazzo floors & cherry blossoms",
  },
  {
    src: CAFE_MEDIA.drinks,
    tag: "Drinks",
    title: "Layered Cold Brews",
    sub: "Passion fruit, caramel, classic",
  },
  {
    src: CAFE_MEDIA.pastries,
    tag: "Bakes",
    title: "The Pastry Counter",
    sub: "Brownies, tiramisu jars & more",
  },
];

const INTERVAL = 5500;

function markIfComplete(
  img: HTMLImageElement | null,
  src: string,
  markReady: (src: string) => void,
) {
  if (!img) return;
  const done = () => {
    if (img.naturalWidth > 0) markReady(src);
  };
  if (img.complete) {
    done();
    return;
  }
  img.decode?.().then(done).catch(done);
}

/** One big picture that rotates on a timer, with small thumbnails underneath. */
export function HeroCarousel() {
  const [i, setI] = useState(0);
  const [wanted, setWanted] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [ready, setReady] = useState<Set<string>>(() => new Set());
  const drag = useRef<number | null>(null);

  const markReady = useCallback((src: string) => {
    setReady((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }, []);

  const go = useCallback((n: number) => {
    setWanted((n + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (!ready.has(SLIDES[wanted].src) || wanted === i) return;
    setI(wanted);
    setCycle((c) => c + 1);
  }, [wanted, ready, i]);

  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setTimeout(() => go(i + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, cycle, go]);

  const slide = SLIDES[i];

  return (
    <div
      className="hero-media"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-shape">
      <div
        className="hero-main"
        onPointerDown={(e) => (drag.current = e.clientX)}
        onPointerUp={(e) => {
          if (drag.current === null) return;
          const dx = e.clientX - drag.current;
          drag.current = null;
          if (Math.abs(dx) > 45) go(i + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        {SLIDES.map((s, idx) => (
          <div key={s.src} className={clsx("hero-slide", idx === i && "active")}>
            <img
              src={s.src}
              alt={s.title}
              className={clsx("cover", ready.has(s.src) && "is-ready")}
              draggable={false}
              decoding="async"
              fetchPriority={idx === 0 ? "high" : "low"}
              ref={(el) => markIfComplete(el, s.src, markReady)}
              onLoad={(e) => markIfComplete(e.currentTarget, s.src, markReady)}
            />
          </div>
        ))}
        <div className="hero-main-shade" />

        <span className="hero-tag">{slide.tag}</span>
        <span className="hero-rating">
          <Star size={14} fill="#f2b84b" color="#f2b84b" /> 4.5 · Loved in Jubilee Hills
        </span>

        <div className="hero-caption" key={i}>
          <h3>{slide.title}</h3>
          <p>{slide.sub}</p>
        </div>

      </div>
      </div>

      <div className="hero-thumbs" role="tablist" aria-label="Cafe photos">
        {SLIDES.map((s, idx) => (
          <button
            key={s.src}
            role="tab"
            aria-selected={idx === i}
            aria-label={s.title}
            className={clsx("hero-thumb", idx === i && "on")}
            onClick={() => go(idx)}
          >
            <img
              src={s.src}
              alt=""
              className={clsx("cover", ready.has(s.src) && "is-ready")}
              draggable={false}
              decoding="async"
              onLoad={(e) => markIfComplete(e.currentTarget, s.src, markReady)}
            />
            {idx === i && (
              <span
                key={cycle}
                className="hero-progress"
                style={{
                  animationDuration: `${INTERVAL}ms`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
