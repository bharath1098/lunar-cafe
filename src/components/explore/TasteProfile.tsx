"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { TasteProfile as TasteProfileData } from "@/lib/taste-profile";

const RING_COUNT = 14;

/** Concentric taste rings — sits on the right of the story on flavour pages. */
export function TasteProfile({ profile }: { profile: TasteProfileData }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(profile.defaultIndex);
  const [ripple, setRipple] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const select = (i: number) => {
    setActive(i);
    if (!inView) return;
    setRipple(false);
    requestAnimationFrame(() => setRipple(true));
  };

  const key = profile.keys[active] ?? profile.keys[profile.defaultIndex];

  return (
    <div
      ref={rootRef}
      className={`ex-taste${inView ? " is-in" : ""}${ripple ? " is-ripple" : ""}`}
      aria-label="Taste profile"
      onAnimationEnd={(e) => {
        if ((e.target as HTMLElement).classList?.contains("ex-taste-core")) {
          setRipple(false);
        }
      }}
    >
      <div className="ex-taste-stage">
        <div className="ex-taste-rings" aria-hidden="true">
          <span className="ex-taste-core" />
          {Array.from({ length: RING_COUNT }, (_, i) => (
            <span
              key={i}
              className="ex-taste-ring"
              style={{ "--i": i, "--n": RING_COUNT } as CSSProperties}
            />
          ))}
        </div>

        <div className="ex-taste-metric">
          <span>{profile.metricLabel}</span>
          <strong>{profile.metricValue}</strong>
        </div>

        <ul
          className="ex-taste-keys"
          role="list"
          onMouseLeave={() => setActive(profile.defaultIndex)}
        >
          {profile.keys.map((k, i) => {
            const on = i === active;
            return (
              <li key={k.name}>
                <button
                  type="button"
                  className={on ? "is-on" : undefined}
                  aria-pressed={on}
                  onMouseEnter={() => select(i)}
                  onFocus={() => select(i)}
                  onClick={() => select(i)}
                >
                  {k.name}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="ex-taste-desc" key={key.name}>
          {key.text}
        </p>

        <p className="ex-taste-score" aria-label={`Score ${key.score} of 15`}>
          <strong>{key.score}</strong>
          <span>/15</span>
        </p>
      </div>
    </div>
  );
}
