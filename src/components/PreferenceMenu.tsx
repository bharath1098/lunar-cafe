"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { usePrefs } from "./Providers";
import { CURRENCIES, LOCALES } from "@/lib/cafe";
import type { Locale } from "@/lib/i18n";

export function PreferenceMenu({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, currency, setCurrency } = usePrefs();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const localeName = LOCALES.find((l) => l.code === locale)?.name ?? "English";

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="pref-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="pref-panel"
            role="dialog"
            aria-label="Preferences"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="pref-head">
              <div>
                <strong>Preference</strong>
                <small>
                  Lang: {localeName}, currency: {currency}
                </small>
              </div>
              <button className="pref-close" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <h6 className="pref-title">Language</h6>
            <div className="pref-grid pref-grid-3">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  className={clsx("pref-opt", locale === l.code && "on")}
                  onClick={() => setLocale(l.code as Locale)}
                >
                  {locale === l.code && <Check size={14} className="pref-check" />}
                  <span className="pref-main">{l.label}</span>
                  <span className="pref-sub">{l.name}</span>
                </button>
              ))}
            </div>

            <h6 className="pref-title">Currency</h6>
            <div className="pref-grid pref-grid-3">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  className={clsx("pref-opt", currency === c.code && "on")}
                  onClick={() => setCurrency(c.code)}
                  title={c.name}
                >
                  {currency === c.code && <Check size={14} className="pref-check" />}
                  <span className="pref-main pref-symbol">{c.symbol}</span>
                  <span className="pref-sub">{c.code}</span>
                </button>
              ))}
            </div>
            <p className="pref-note">
              Prices are shown in your selected currency for reference. Bills at the
              cafe are always charged in ₹.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        className={clsx("pref-trigger", compact && "compact")}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SlidersHorizontal size={16} />
        <span className="pref-trigger-label">Preference</span>
      </button>
      {mounted && createPortal(panel, document.body)}
    </>
  );
}
