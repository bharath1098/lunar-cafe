"use client";

import { useEffect, useId, useMemo, useRef } from "react";

/** deterministic pseudo-random so server + client render the same sky */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// moon disc inside the 200×200 viewBox (matches the cropped photo)
const CX = 100;
const CY = 101;
const R = 96;

/**
 * Path of the sunlit part of the moon for a phase angle `phi` (0 → 2π).
 * 0 = new, π/2 = first quarter, π = full, 3π/2 = last quarter.
 * The terminator is a true half-ellipse (semi-axis R·|cos φ|), exactly like the real thing.
 * The path is always drawn "waxing" (lit on the right); waning phases are mirrored by a transform.
 */
function litPath(phi: number) {
  const p = phi % (2 * Math.PI);
  const psi = p <= Math.PI ? p : 2 * Math.PI - p; // 0..π, mirrored for waning
  const rx = R * Math.cos(psi);
  const rxAbs = Math.max(Math.abs(rx), 0.01);
  const sweep = rx < 0 ? 1 : 0; // gibbous bulges left, crescent bulges right
  const d = `M ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${CX} ${CY + R} A ${rxAbs} ${R} 0 0 ${sweep} ${CX} ${CY - R} Z`;
  const waning = p > Math.PI;
  return { d, waning, lit: (1 - Math.cos(p)) / 2 };
}

const CYCLE_SECONDS = 96; // one full lunation on screen (sped up, but slow enough to feel natural)
const START_PHASE = Math.PI * 0.82; // waxing gibbous: looks great on first paint

const CLOUDS = [
  { top: 10, w: 420, h: 86, dur: 190, delay: -40, op: 0.8, front: false },
  { top: 27, w: 300, h: 64, dur: 150, delay: -110, op: 0.7, front: false },
  { top: 52, w: 520, h: 100, dur: 230, delay: -20, op: 0.65, front: false },
  { top: 72, w: 340, h: 70, dur: 170, delay: -90, op: 0.6, front: false },
  { top: 40, w: 380, h: 76, dur: 140, delay: -60, op: 0.38, front: true },
];

/**
 * The Lunar sky — the moon is the star in BOTH themes.
 *  - light : a pale daytime moon in a soft mint morning sky, drifting clouds, blossom petals
 *  - dark  : the same moon brightens, glows, stars fade in, shooting stars cross the sky
 * The moon slowly moves through its real phases, with a correctly curved terminator.
 */
export function LunarSky({ variant = "hero" }: { variant?: "hero" | "page" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const initial = useMemo(() => litPath(START_PHASE), []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const path = pathRef.current;
    const root = rootRef.current;
    if (!path || !root) return;

    const apply = (phi: number) => {
      const { d, waning, lit } = litPath(phi);
      path.setAttribute("d", d);
      path.setAttribute("transform", waning ? `translate(${CX * 2} 0) scale(-1 1)` : "");
      root.style.setProperty("--lit", String(0.12 + lit * 0.88));
    };

    if (reduce) {
      apply(Math.PI); // stay a calm full moon
      return;
    }

    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 40) return; // ~25 fps is plenty for a slow phase change
      last = now;
      const phi = START_PHASE + ((now - t0) / 1000 / CYCLE_SECONDS) * Math.PI * 2;
      apply(phi);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stars = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: variant === "hero" ? 58 : 30 }, () => ({
      x: r() * 100,
      y: r() * 82,
      s: 0.8 + r() * 2.2,
      d: r() * 6,
      t: 2.4 + r() * 4,
    }));
  }, [variant]);

  const petals = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: variant === "hero" ? 14 : 8 }, () => ({
      x: r() * 100,
      s: 9 + r() * 11,
      d: -r() * 18,
      t: 14 + r() * 12,
      sway: 30 + r() * 70,
      b: r() > 0.5,
    }));
  }, [variant]);

  const cloud = (c: (typeof CLOUDS)[number], i: number) => (
    <i
      key={i}
      className="cloud"
      style={
        {
          top: `${c.top}%`,
          width: c.w,
          height: c.h,
          opacity: c.op,
          animationDuration: `${c.dur}s`,
          animationDelay: `${c.delay}s`,
        } as React.CSSProperties
      }
    />
  );

  return (
    <div ref={rootRef} className={`lunar-sky lunar-sky-${variant}`} aria-hidden>
      <div className="sky-layer sky-day" />
      <div className="sky-layer sky-night" />

      <div className="sky-stars">
        {stars.map((st, i) => (
          <i
            key={i}
            style={{
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: st.s,
              height: st.s,
              animationDelay: `${st.d}s`,
              animationDuration: `${st.t}s`,
            }}
          />
        ))}
        <b className="shooting-star" />
        <b className="shooting-star s2" />
      </div>

      <div className="sky-clouds">{CLOUDS.filter((c) => !c.front).map(cloud)}</div>

      <div className="sky-moon">
        <div className="moon-halo-wrap">
          <div className="moon-halo" />
        </div>
        <svg viewBox="0 0 200 202" className="moon-svg" role="img" aria-label="">
          <defs>
            <clipPath id={`${uid}c`}>
              <circle cx={CX} cy={CY} r={R} />
            </clipPath>
            <filter id={`${uid}b`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <radialGradient id={`${uid}l`} cx="50%" cy="50%" r="50%">
              <stop offset="0.72" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.38" />
            </radialGradient>
            <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="202">
              <path
                ref={pathRef}
                d={initial.d}
                fill="#fff"
                filter={`url(#${uid}b)`}
                transform={initial.waning ? `translate(${CX * 2} 0) scale(-1 1)` : undefined}
              />
            </mask>
          </defs>

          {/* slight tilt, like a real moon seen from the northern hemisphere */}
          <g transform={`rotate(-16 ${CX} ${CY})`}>
            {/* the unlit side, barely visible (earthshine) */}
            <g clipPath={`url(#${uid}c)`} className="moon-earthshine">
              <image
                href="/media/sky/moon.jpg"
                xlinkHref="/media/sky/moon.jpg"
                x="0"
                y="1"
                width="200"
                height="200"
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
            {/* the sunlit side */}
            <g clipPath={`url(#${uid}c)`}>
              <g mask={`url(#${uid}m)`}>
                <image
                  href="/media/sky/moon.jpg"
                  xlinkHref="/media/sky/moon.jpg"
                  x="0"
                  y="1"
                  width="200"
                  height="200"
                  className="moon-lit"
                  preserveAspectRatio="xMidYMid slice"
                />
                <circle cx={CX} cy={CY} r={R} fill={`url(#${uid}l)`} />
              </g>
            </g>
          </g>
        </svg>
      </div>

      <div className="sky-clouds sky-clouds-front">
        {CLOUDS.filter((c) => c.front).map(cloud)}
      </div>

      <div className="sky-petals">
        {petals.map((p, i) => (
          <span
            key={i}
            className={p.b ? "petal petal-b" : "petal"}
            style={
              {
                left: `${p.x}%`,
                width: p.s,
                height: p.s * 0.8,
                animationDelay: `${p.d}s`,
                animationDuration: `${p.t}s`,
                "--sway": `${p.sway}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
