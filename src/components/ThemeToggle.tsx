"use client";

import { Moon, Sun } from "lucide-react";
import { usePrefs } from "./Providers";

/** Quick sun ⇄ moon switch (the full Light / Dark / Auto choice lives in Preference). */
export function ThemeToggle() {
  const { theme, setTheme } = usePrefs();

  const toggle = () => {
    const isDark =
      document.documentElement.dataset.theme === "dark" ||
      (theme === "dark");
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label="Switch between day and night"
      title="Day / Night"
    >
      <Sun size={18} className="tt-sun" />
      <Moon size={18} className="tt-moon" />
    </button>
  );
}
