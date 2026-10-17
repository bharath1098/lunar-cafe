"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

function loopDistance(row: HTMLElement): number {
  const track = row.firstElementChild as HTMLElement | null;
  if (!track) return 0;
  const first = track.firstElementChild as HTMLElement | null;
  if (!first) return Math.floor(track.scrollWidth / 2);
  const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
  return first.offsetWidth + gap;
}

/**
 * A horizontally scrollable row (scrollbar hidden).
 *
 * Non-looping rows show a small animated ">>" cue at the edge(s) that still
 * have content. Looping rows skip the arrows — drag or wheel both directions.
 *
 * `loop` + duplicated children: after the last card the first ones follow,
 * so the row never hits a dead end.
 */
export function ScrollHint({
  className,
  children,
  forceEnd = false,
  loop = false,
  autoScroll = false,
  ...rowProps
}: {
  /** classes for the scrolling row itself (e.g. "chip-row") */
  className?: string;
  children: React.ReactNode;
  /** always show the right ">>" (for auto-scrolling marquees) */
  forceEnd?: boolean;
  /** wrap forever: last item is followed by the first copy */
  loop?: boolean;
  /** slowly drift right (paused on hover). Requires `loop`. */
  autoScroll?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  const rowRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const target = useRef(0);
  const paused = useRef(false);
  const drag = useRef<{ x: number; origin: number; moved: boolean } | null>(null);
  const wheelResume = useRef(0);
  const [more, setMore] = useState({ start: false, end: forceEnd });

  const update = useCallback(() => {
    if (loop) return;
    const el = rowRef.current;
    if (!el) return;
    const start = el.scrollLeft > 4;
    const end = forceEnd || el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
  }, [forceEnd, loop]);

  useEffect(() => {
    if (loop) return;
    const el = rowRef.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true });
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [update, loop]);

  useEffect(() => {
    if (!loop) return;
    const row = rowRef.current;
    const wrap = wrapRef.current;
    if (!row) return;
    const track = row.firstElementChild as HTMLElement | null;
    if (!track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const drift = autoScroll && !reduce ? 0.55 : 0;

    const onEnter = () => {
      paused.current = true;
    };
    const onLeave = () => {
      paused.current = false;
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!wrap?.contains(e.relatedTarget as Node | null)) paused.current = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag.current = { x: e.clientX, origin: target.current, moved: false };
      paused.current = true;
      wrap?.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 6) d.moved = true;
      if (d.moved) {
        e.preventDefault();
        target.current = d.origin - dx;
      }
    };
    const endDrag = (e: PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      try {
        wrap?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* already released */
      }
      if (d?.moved) {
        // Block the click that follows a drag so links don't navigate.
        const block = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        wrap?.addEventListener("click", block, { capture: true, once: true });
        window.setTimeout(() => wrap?.removeEventListener("click", block, true), 0);
      }
      if (!wrap?.matches(":hover")) paused.current = false;
    };
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      target.current += dx;
      paused.current = true;
      window.clearTimeout(wheelResume.current);
      wheelResume.current = window.setTimeout(() => {
        if (!wrap?.matches(":hover")) paused.current = false;
      }, 400);
    };

    wrap?.addEventListener("mouseenter", onEnter);
    wrap?.addEventListener("mouseleave", onLeave);
    wrap?.addEventListener("focusin", onEnter);
    wrap?.addEventListener("focusout", onFocusOut);
    wrap?.addEventListener("pointerdown", onPointerDown);
    wrap?.addEventListener("pointermove", onPointerMove);
    wrap?.addEventListener("pointerup", endDrag);
    wrap?.addEventListener("pointercancel", endDrag);
    wrap?.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const L = loopDistance(row);
      if (L <= 1) return;
      if (drift && !paused.current && !drag.current) target.current += drift;
      pos.current += (target.current - pos.current) * 0.16;
      if (Math.abs(target.current - pos.current) < 0.2) pos.current = target.current;
      if (target.current > L * 8) {
        target.current -= L * 4;
        pos.current -= L * 4;
      }
      if (target.current < -L * 4) {
        target.current += L * 4;
        pos.current += L * 4;
      }
      const x = ((pos.current % L) + L) % L;
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      wrap?.removeEventListener("mouseenter", onEnter);
      wrap?.removeEventListener("mouseleave", onLeave);
      wrap?.removeEventListener("focusin", onEnter);
      wrap?.removeEventListener("focusout", onFocusOut);
      wrap?.removeEventListener("pointerdown", onPointerDown);
      wrap?.removeEventListener("pointermove", onPointerMove);
      wrap?.removeEventListener("pointerup", endDrag);
      wrap?.removeEventListener("pointercancel", endDrag);
      wrap?.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelResume.current);
      track.style.transform = "";
    };
  }, [loop, autoScroll]);

  const nudge = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div ref={wrapRef} className={clsx("scroll-hint-wrap", loop && "is-loop-strip")}>
      <div ref={rowRef} className={clsx(className, loop && "is-looping")} {...rowProps}>
        {children}
      </div>
      {!loop && (
        <>
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
        </>
      )}
    </div>
  );
}
