"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, Mail, Phone } from "lucide-react";
import { CAFE } from "@/lib/cafe";

export function SiteExtras() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [consent, setConsent] = useState<"unknown" | "set">("unknown");

  useEffect(() => {
    try {
      if (localStorage.getItem("lunar-consent")) setConsent("set");
    } catch {
      setConsent("set");
    }
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? window.scrollY / height : 0);
      setShowTop(window.scrollY > 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tel = `tel:${CAFE.phoneDisplay.replace(/\s/g, "")}`;
  const mail = `mailto:${CAFE.email}`;

  function choose(value: "accepted" | "essential") {
    try {
      localStorage.setItem("lunar-consent", value);
    } catch {
      /* ignore */
    }
    setConsent("set");
  }

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />
      <div className="float-contact">
        {showTop && (
          <button
            type="button"
            className="back-to-top"
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp size={18} />
          </button>
        )}
        <a href={mail} aria-label={`Email ${CAFE.email}`}>
          <Mail size={18} />
        </a>
        <a href={tel} aria-label={`Call ${CAFE.phoneDisplay}`}>
          <Phone size={18} />
        </a>
      </div>
      {consent === "unknown" && (
        <div className="cookie-banner" role="dialog" aria-label="Cookie notice">
          <p>
            We store your language and currency on this device, and remember a campaign
            tag if you arrived from a link. No third-party ads.{" "}
            <Link href="/privacy">Privacy</Link>
          </p>
          <div className="cookie-actions">
            <button type="button" className="neo-btn neo-btn-ghost" onClick={() => choose("essential")}>
              Essential only
            </button>
            <button type="button" className="neo-btn neo-btn-primary" onClick={() => choose("accepted")}>
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}
