"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadPublicData, prefetchPublicData } from "@/lib/public-data";

const SEEN_KEY = "lunar-intro-seen";
const MIN_MS = 4500;
const MAX_MS = 6500;
const LEAVE_MS = 860;

const CX = 100;
const CY = 101;
const R = 96;
const PHI_START = 0.58;
const PHI_END = Math.PI * 0.86;
const PHASE_MS = 3800;

function litPath(phi: number) {
  const p = phi % (2 * Math.PI);
  const psi = p <= Math.PI ? p : 2 * Math.PI - p;
  const rx = R * Math.cos(psi);
  const rxAbs = Math.max(Math.abs(rx), 0.01);
  const sweep = rx < 0 ? 1 : 0;
  const d = `M ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${CX} ${CY + R} A ${rxAbs} ${R} 0 0 ${sweep} ${CX} ${CY - R} Z`;
  const waning = p > Math.PI;
  return { d, waning, lit: (1 - Math.cos(p)) / 2 };
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function skipPath(pathname: string) {
  return (
    pathname.startsWith("/staff") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/t/")
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(0, ms));
  });
}

export function IntroSplash() {
  const pathname = usePathname();
  const router = useRouter();
  const skip = skipPath(pathname);
  const [mode, setMode] = useState<"play" | "leave" | "off">(skip ? "off" : "play");
  const finishing = useRef(false);

  const stars = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 42 }, () => ({
      x: r() * 100,
      y: r() * 100,
      s: 0.7 + r() * 2.1,
      d: r() * 0.7,
      t: 2.2 + r() * 3.4,
    }));
  }, []);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode */
    }
    setMode("leave");
  }, []);

  useEffect(() => {
    if (skip) {
      document.documentElement.dataset.intro = "skip";
      setMode("off");
      return;
    }
    if (document.documentElement.dataset.intro === "done") {
      setMode("off");
      return;
    }

    document.documentElement.dataset.intro = "open";
    prefetchPublicData();
    router.prefetch("/menu");
    router.prefetch("/reserve");
    router.prefetch("/gallery");

    const started = Number(
      document.documentElement.dataset.introStart || Date.now(),
    );
    let cancelled = false;

    const api = loadPublicData()
      .then(() => true)
      .catch(() => false);

    void Promise.race([
      wait(started + MAX_MS - Date.now()),
      Promise.all([wait(started + MIN_MS - Date.now()), api]),
    ]).then(() => {
      if (!cancelled) finish();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, router, skip]);

  useEffect(() => {
    if (mode !== "leave") return;
    const t = window.setTimeout(() => {
      document.documentElement.dataset.intro = "done";
      setMode("off");
    }, LEAVE_MS);
    return () => window.clearTimeout(t);
  }, [mode]);

  if (mode === "off") return null;

  return (
    <div
      className={`intro-splash${mode === "leave" ? " is-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Lunar Cafe"
      onClick={finish}
    >
      <div className="intro-sky" aria-hidden>
        <div className="intro-stars">
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
          <b className="intro-shoot" />
        </div>
        <div className="intro-glow" />
        <div className="intro-mist" />
      </div>

      <div className="intro-center">
        <IntroMoon />

        <p className="intro-kicker">Jubilee Hills · Hyderabad</p>
        <h1 className="intro-title">
          <span>Lunar</span>
          <em>Cafe</em>
        </h1>
        <p className="intro-tag">A space to pause.</p>
        <span className="intro-bar" aria-hidden />
        <span className="intro-hint">Enter the evening</span>
      </div>
    </div>
  );
}

function IntroMoon() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pathRef = useRef<SVGPathElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = useMemo(() => litPath(PHI_START), []);

  const sparks = useMemo(() => {
    const r = rng(29);
    return Array.from({ length: 11 }, (_, i) => {
      const a = (i / 11) * Math.PI * 2 + r() * 0.35;
      const dist = 46 + r() * 12;
      return {
        x: 50 + Math.cos(a) * dist,
        y: 50 + Math.sin(a) * dist,
        d: r() * 1.4,
        s: 1.6 + r() * 2.8,
        t: 1.6 + r() * 1.8,
      };
    });
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    const root = rootRef.current;
    if (!path || !root) return;

    const apply = (phi: number) => {
      const { d, waning, lit } = litPath(phi);
      path.setAttribute("d", d);
      path.setAttribute(
        "transform",
        waning ? `translate(${CX * 2} 0) scale(-1 1)` : "",
      );
      root.style.setProperty("--lit", String(0.2 + lit * 0.8));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(PHI_END);
      return;
    }

    apply(PHI_START);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / PHASE_MS);
      const e = 1 - (1 - t) ** 3;
      apply(PHI_START + (PHI_END - PHI_START) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={rootRef} className="intro-moon-stage" aria-hidden>
      <div className="intro-moon-bloom" />
      <i className="intro-moon-ring r1" />
      <i className="intro-moon-ring r2" />
      <i className="intro-moon-ring r3" />
      <div className="intro-moon-orb">
        <svg viewBox="0 0 200 202" className="intro-moon-svg">
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
            <mask
              id={`${uid}m`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="200"
              height="202"
            >
              <path
                ref={pathRef}
                d={initial.d}
                fill="#fff"
                filter={`url(#${uid}b)`}
                transform={
                  initial.waning
                    ? `translate(${CX * 2} 0) scale(-1 1)`
                    : undefined
                }
              />
            </mask>
          </defs>
          <g transform={`rotate(-16 ${CX} ${CY})`}>
            <g clipPath={`url(#${uid}c)`} className="intro-moon-earthshine">
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
            <g clipPath={`url(#${uid}c)`}>
              <g mask={`url(#${uid}m)`}>
                <image
                  href="/media/sky/moon.jpg"
                  xlinkHref="/media/sky/moon.jpg"
                  x="0"
                  y="1"
                  width="200"
                  height="200"
                  className="intro-moon-lit"
                  preserveAspectRatio="xMidYMid slice"
                />
                <circle cx={CX} cy={CY} r={R} fill={`url(#${uid}l)`} />
              </g>
            </g>
          </g>
        </svg>
      </div>
      <div className="intro-moon-sparks">
        {sparks.map((sp, i) => (
          <span
            key={i}
            style={{
              left: `${sp.x}%`,
              top: `${sp.y}%`,
              width: sp.s,
              height: sp.s,
              animationDelay: `${sp.d}s`,
              animationDuration: `${sp.t}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
