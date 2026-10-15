"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export function CategoryBar({
  categories,
  value,
  onChange,
  moreOpen,
  onMoreOpenChange,
}: {
  categories: string[];
  value: string;
  onChange: (next: string) => void;
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(categories.length);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const measureRow = measureRef.current;
    if (!wrap || !measureRow || categories.length === 0) return;

    const chips = Array.from(measureRow.querySelectorAll<HTMLElement>("[data-measure-chip]"));
    const moreBtn = measureRow.querySelector<HTMLElement>("[data-measure-more]");
    if (!chips.length || !moreBtn) return;

    const gap = 8;
    const moreWidth = moreBtn.offsetWidth;
    const available = wrap.clientWidth;
    let used = 0;
    let count = chips.length;

    for (let i = 0; i < chips.length; i++) {
      const next = used + chips[i].offsetWidth + (i > 0 ? gap : 0);
      const remaining = chips.length - (i + 1);
      const needMore = remaining > 0;
      const limit = available - (needMore ? moreWidth + gap : 0);
      if (next > limit) {
        count = Math.max(1, i);
        break;
      }
      used = next;
      count = i + 1;
    }

    setVisibleCount(count);
  }, [categories]);

  useEffect(() => {
    measure();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!moreOpen) return;
    function onDoc(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        onMoreOpenChange(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onMoreOpenChange(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen, onMoreOpenChange]);

  const visible = categories.slice(0, visibleCount);
  const hidden = categories.slice(visibleCount);
  const selectedHidden = hidden.includes(value);

  return (
    <div className="order-filters" ref={wrapRef}>
      <div className="chip-measure" aria-hidden ref={measureRef}>
        {categories.map((c) => (
          <span key={c} data-measure-chip className="chip">
            {c}
          </span>
        ))}
        <span data-measure-more className="chip cat-more-btn">
          More <ChevronDown size={14} />
        </span>
      </div>

      <div className="chip-row chip-row-fit">
        {visible.map((c) => (
          <button
            key={c}
            type="button"
            className={clsx("chip", value === c && "chip-on")}
            onClick={() => onChange(c)}
          >
            {c}
          </button>
        ))}
        {hidden.length > 0 && (
          <div className="cat-more" ref={moreRef}>
            <button
              type="button"
              className={clsx("chip cat-more-btn", (moreOpen || selectedHidden) && "chip-on")}
              aria-expanded={moreOpen}
              aria-haspopup="listbox"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const zoom =
                  parseFloat(
                    getComputedStyle(document.documentElement).getPropertyValue("--ui-zoom"),
                  ) || 1;
                setMenuPos({
                  top: (rect.bottom + 8) / zoom,
                  right: Math.max(12, (window.innerWidth - rect.right) / zoom),
                });
                onMoreOpenChange(!moreOpen);
              }}
            >
              <span className="cat-more-label">{selectedHidden ? value : "More"}</span>
              <ChevronDown size={14} />
            </button>
            {moreOpen && (
              <div
                className="cat-more-menu"
                role="listbox"
                aria-label="More categories"
                style={{ top: menuPos.top, right: menuPos.right }}
              >
                {hidden.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="option"
                    aria-selected={value === c}
                    className={clsx("cat-more-item", value === c && "on")}
                    onClick={() => onChange(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
