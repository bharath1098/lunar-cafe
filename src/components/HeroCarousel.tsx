"use client";

import Image from "next/image";
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

/** One big picture that rotates on a timer, with small thumbnails underneath. */
export function HeroCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const drag = useRef<number | null>(null);

  const go = useCallback((n: number) => {
    setI((n + SLIDES.length) % SLIDES.length);
    setCycle((c) => c + 1);
  }, []);

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
            <Image
              src={s.src}
              alt={s.title}
              fill
              priority={idx === 0}
              sizes="(max-width: 960px) 100vw, 45vw"
              className="cover"
              draggable={false}
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
            <Image src={s.src} alt="" fill sizes="110px" className="cover" draggable={false} />
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
