"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export type CoreKind =
  | "beans"
  | "mint"
  | "basil"
  | "cheese"
  | "sesame"
  | "pearl"
  | "berry"
  | "cocoa"
  | "tomato";

const KIND_BY_SLUG: Record<string, CoreKind> = {
  "lunar-lattes": "beans",
  mocktails: "mint",
  "wood-fired-pizza": "basil",
  "creamy-pasta": "cheese",
  burgers: "sesame",
  "bubble-tea": "pearl",
  desserts: "cocoa",
  smoothies: "berry",
  sandwiches: "tomato",
};

type Spot = { x: string; y: string; s: number; r: number; d: number };

/** Only inside the centre V — clip-path on .ex-core also hides anything that drifts out. */
const SPOTS: Spot[] = [
  { x: "36%", y: "22%", s: 1, r: -28, d: 0 },
  { x: "64%", y: "20%", s: 0.9, r: 22, d: 0.12 },
  { x: "32%", y: "48%", s: 1.1, r: 14, d: 0.22 },
  { x: "68%", y: "46%", s: 1.05, r: -18, d: 0.3 },
  { x: "40%", y: "72%", s: 0.85, r: 26, d: 0.18 },
  { x: "60%", y: "74%", s: 0.95, r: -12, d: 0.36 },
  { x: "50%", y: "38%", s: 1.15, r: 8, d: 0.08 },
];

function CoffeeBean({ i }: { i: number }) {
  const tone = i % 2 === 0 ? "#5c3317" : "#3d220f";
  const hi = i % 2 === 0 ? "#8a5630" : "#6b3d1c";
  return (
    <svg viewBox="0 0 64 40" width="100%" height="100%" aria-hidden>
      <ellipse cx="32" cy="20" rx="28" ry="16" fill={tone} />
      <ellipse cx="32" cy="18" rx="22" ry="10" fill={hi} opacity="0.35" />
      <path
        d="M32 6c-3 6-3 22 0 28"
        fill="none"
        stroke="#2a1608"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function MintLeaf({ i }: { i: number }) {
  const fill = i % 2 === 0 ? "#3d9a55" : "#2f7a42";
  return (
    <svg viewBox="0 0 48 64" width="100%" height="100%" aria-hidden>
      <path d="M24 4C12 18 8 34 24 60C40 34 36 18 24 4Z" fill={fill} />
      <path d="M24 12v40" stroke="#1e4f2a" strokeWidth="1.6" opacity="0.5" />
    </svg>
  );
}

function BasilLeaf({ i }: { i: number }) {
  const fill = i % 2 === 0 ? "#2f8f3c" : "#1f6b2c";
  return (
    <svg viewBox="0 0 56 70" width="100%" height="100%" aria-hidden>
      <path d="M28 4C10 20 6 40 28 66C50 40 46 20 28 4Z" fill={fill} />
      <path d="M28 14v42" stroke="#0f3d18" strokeWidth="1.5" opacity="0.45" />
      <path
        d="M28 28c-6 4-10 10-12 16M28 28c6 4 10 10 12 16"
        stroke="#0f3d18"
        strokeWidth="1.2"
        fill="none"
        opacity="0.35"
      />
    </svg>
  );
}

function CheeseShard({ i }: { i: number }) {
  const fill = i % 2 === 0 ? "#f2d56b" : "#e8c44a";
  return (
    <svg viewBox="0 0 54 40" width="100%" height="100%" aria-hidden>
      <path d="M4 30 L26 4 L50 28 L28 36 Z" fill={fill} />
      <circle cx="22" cy="22" r="3" fill="#d4a82e" opacity="0.55" />
      <circle cx="34" cy="24" r="2.2" fill="#d4a82e" opacity="0.45" />
    </svg>
  );
}

function Sesame({ i }: { i: number }) {
  const fill = i % 3 === 0 ? "#f5e6c8" : "#e8d4a8";
  return (
    <svg viewBox="0 0 28 18" width="100%" height="100%" aria-hidden>
      <ellipse cx="14" cy="9" rx="12" ry="7" fill={fill} />
    </svg>
  );
}

function Pearl({ i }: { i: number }) {
  const fill = i % 2 === 0 ? "#2a1a12" : "#3d2818";
  return (
    <svg viewBox="0 0 36 36" width="100%" height="100%" aria-hidden>
      <circle cx="18" cy="18" r="15" fill={fill} />
      <circle cx="12" cy="13" r="4" fill="#fff" opacity="0.18" />
    </svg>
  );
}

function Berry({ i }: { i: number }) {
  const fill = i % 2 === 0 ? "#b01e4a" : "#7a1533";
  return (
    <svg viewBox="0 0 36 40" width="100%" height="100%" aria-hidden>
      <circle cx="18" cy="22" r="14" fill={fill} />
      <path d="M18 8c-4 2-6 5-6 5s4 0 6-2c2 2 6 2 6 2s-2-3-6-5z" fill="#2f8f3c" />
    </svg>
  );
}

function Cocoa({ i }: { i: number }) {
  const fill = i % 2 === 0 ? "#4a2a18" : "#6b3d24";
  return (
    <svg viewBox="0 0 40 48" width="100%" height="100%" aria-hidden>
      <ellipse cx="20" cy="26" rx="14" ry="18" fill={fill} />
      <ellipse cx="20" cy="18" rx="8" ry="5" fill="#fff" opacity="0.12" />
    </svg>
  );
}

function Tomato({ i }: { i: number }) {
  const fill = i % 2 === 0 ? "#d6452e" : "#b83520";
  return (
    <svg viewBox="0 0 44 44" width="100%" height="100%" aria-hidden>
      <circle cx="22" cy="24" r="16" fill={fill} />
      <path d="M22 8c-3 2-5 5-5 5h10s-2-3-5-5z" fill="#2f8f3c" />
    </svg>
  );
}

const RENDER: Record<CoreKind, (i: number) => ReactNode> = {
  beans: (i) => <CoffeeBean i={i} />,
  mint: (i) => <MintLeaf i={i} />,
  basil: (i) => <BasilLeaf i={i} />,
  cheese: (i) => <CheeseShard i={i} />,
  sesame: (i) => <Sesame i={i} />,
  pearl: (i) => <Pearl i={i} />,
  berry: (i) => <Berry i={i} />,
  cocoa: (i) => <Cocoa i={i} />,
  tomato: (i) => <Tomato i={i} />,
};

const SIZE: Record<CoreKind, number> = {
  beans: 64,
  mint: 58,
  basil: 68,
  cheese: 58,
  sesame: 34,
  pearl: 42,
  berry: 48,
  cocoa: 50,
  tomato: 52,
};

export function coreKindForSlug(slug?: string): CoreKind {
  if (!slug) return "basil";
  return KIND_BY_SLUG[slug] || "basil";
}

export function CoreScatter({
  kind,
  slug,
  compact,
}: {
  kind?: CoreKind;
  slug?: string;
  /** Dish pages: only the four outer spots (the middle ones collide with the copy and photo). */
  compact?: boolean;
}) {
  const k = kind || coreKindForSlug(slug);
  const render = RENDER[k];
  const base = SIZE[k];
  const spots = compact ? SPOTS.slice(0, 4) : SPOTS;

  return (
    <div className={compact ? "ex-core ex-core-compact" : "ex-core"} aria-hidden="true">
      {spots.map((s, i) => {
        const size = base * s.s;
        return (
          <motion.span
            key={i}
            className="ex-core-item"
            style={{
              left: s.x,
              top: s.y,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
            }}
            initial={{ opacity: 0, scale: 0.35, rotate: s.r - 20 }}
            animate={{ opacity: 1, scale: 1, rotate: s.r }}
            transition={{ delay: 0.5 + s.d, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            {render(i)}
          </motion.span>
        );
      })}
    </div>
  );
}
