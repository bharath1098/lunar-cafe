"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ApiLoader } from "@/components/ApiLoader";
import { IntroSplash } from "@/components/IntroSplash";

export type ThemeMode = "light" | "dark" | "auto";

type Prefs = {
  locale: Locale;
  currency: string;
  theme: ThemeMode;
  setLocale: (l: Locale) => void;
  setCurrency: (c: string) => void;
  setTheme: (m: ThemeMode) => void;
  tr: ReturnType<typeof t>;
};

const PrefsContext = createContext<Prefs | null>(null);

// Light mode is retired: the site is always the night-sky (dark) theme.
function applyTheme(_mode: ThemeMode) {
  document.documentElement.dataset.theme = "dark";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [currency, setCurrencyState] = useState("INR");
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const l = localStorage.getItem("lunar-locale") as Locale | null;
    const c = localStorage.getItem("lunar-currency");
    const th = localStorage.getItem("lunar-theme") as ThemeMode | null;
    if (l) setLocaleState(l);
    if (c) setCurrencyState(c);
    if (th === "light" || th === "dark" || th === "auto") setThemeState(th);
  }, []);

  // keep <html data-theme> in sync (and follow the OS when set to "auto")
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("auto");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [theme]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("lunar-locale", l);
  }, []);

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
    localStorage.setItem("lunar-currency", c);
  }, []);

  const setTheme = useCallback((m: ThemeMode) => {
    setThemeState(m);
    localStorage.setItem("lunar-theme", m);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      currency,
      theme,
      setLocale,
      setCurrency,
      setTheme,
      tr: t(locale),
    }),
    [locale, currency, theme, setLocale, setCurrency, setTheme],
  );

  return (
    <PrefsContext.Provider value={value}>
      {children}
      <ApiLoader />
      <IntroSplash />
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs outside Providers");
  return ctx;
}
