"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * A horizontally scrollable row (scrollbar hidden) with a small animated ">>"
 * at the edge(s) that still have content, so people can tell it scrolls.
 * The cue disappears at the end and can be clicked to scroll further.
 */
export function ScrollHint({
  className,
  children,
  forceEnd = false,
  ...rowProps
}: {
  /** classes for the scrolling row itself (e.g. "chip-row") */
  className?: string;
  children: React.ReactNode;
  /** always show the right ">>" (for auto-scrolling marquees) */
  forceEnd?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ start: false, end: forceEnd });

  const update = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const start = el.scrollLeft > 4;
    const end = forceEnd || el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
  }, [forceEnd]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // children changing width (e.g. categories loading) also changes scrollWidth
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true });
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [update]);

  const nudge = (dir: 1 | -1) =>
    rowRef.current?.scrollBy({
      left: dir * Math.max(160, rowRef.current.clientWidth * 0.6),
      behavior: "smooth",
    });

  return (
    <div className="scroll-hint-wrap">
      <div ref={rowRef} className={className} {...rowProps}>
        {children}
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Scroll left"
        className={clsx("scroll-hint scroll-hint-start", more.start && "on")}
        onClick={() => nudge(-1)}
      >
        <ChevronsLeft size={18} aria-hidden />
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Scroll right"
        className={clsx("scroll-hint scroll-hint-end", more.end && "on")}
        onClick={() => nudge(1)}
      >
        <ChevronsRight size={18} aria-hidden />
      </button>
    </div>
  );
}
