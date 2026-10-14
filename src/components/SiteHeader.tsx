"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  Clock,
  Menu as MenuIcon,
  Phone,
  MapPin,
  X,
} from "lucide-react";
import { usePrefs } from "./Providers";
import { PreferenceMenu } from "./PreferenceMenu";
import { CAFE } from "@/lib/cafe";
import { CAFE_MEDIA } from "@/lib/media";

export function SiteHeader() {
  const { tr } = usePrefs();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/", label: tr.home },
    { href: "/menu", label: tr.menu },
    { href: "/about", label: tr.about },
    { href: "/gallery", label: tr.gallery },
    { href: "/reserve", label: tr.reserve },
    { href: "/loyalty", label: tr.loyalty },
    { href: "/contact", label: tr.contact },
  ];

  return (
    <>
      <header className={clsx("site-header on-dark", scrolled && "scrolled")}>
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Lunar Cafe home">
            <span className="brand-mark">
              <Image
                src={CAFE_MEDIA.goldSign}
                alt=""
                fill
                sizes="42px"
                className="cover"
              />
            </span>
            <span className="brand-text">
              <strong>LUNAR</strong>
              <small>CAFE</small>
            </span>
          </Link>

          <nav className="nav-links" aria-label="Main">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(pathname === l.href && "active")}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="header-tools">
            <PreferenceMenu />
            <Link href="/reserve" className="btn btn-gold btn-sm">
              {tr.reserve}
            </Link>
            <button
              className="burger"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="drawer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <span className="eyebrow">Lunar Cafe</span>
              <button
                className="burger"
                style={{ display: "grid" }}
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/feedback">{tr.feedback}</Link>
            <div style={{ marginTop: "1.2rem" }}>
              <PreferenceMenu />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function SiteFooter() {
  const { tr } = usePrefs();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: "1rem" }}>
              <span className="brand-mark">
                <Image
                  src={CAFE_MEDIA.goldSign}
                  alt=""
                  fill
                  sizes="42px"
                  className="cover"
                />
              </span>
              <span className="brand-text">
                <strong>LUNAR</strong>
                <small>CAFE</small>
              </span>
            </div>
            <p style={{ maxWidth: 280, lineHeight: 1.6 }}>{CAFE.tagline}</p>
          </div>
          <div>
            <h5>Explore</h5>
            <Link href="/menu">{tr.menu}</Link>
            <Link href="/gallery">{tr.gallery}</Link>
            <Link href="/reserve">{tr.reserve}</Link>
            <Link href="/loyalty">{tr.loyalty}</Link>
            <Link href="/feedback">{tr.feedback}</Link>
          </div>
          <div>
            <h5>Visit</h5>
            <p>
              <MapPin size={13} style={{ display: "inline", marginRight: 6 }} />
              {CAFE.addressLines.join(", ")}
            </p>
            <p>
              <Clock size={13} style={{ display: "inline", marginRight: 6 }} />
              {CAFE.hours}
            </p>
            <p>
              <Phone size={13} style={{ display: "inline", marginRight: 6 }} />
              {CAFE.phoneDisplay}
            </p>
          </div>
          <div>
            <h5>{tr.orderPartners}</h5>
            <a href={CAFE.zomatoUrl} target="_blank" rel="noreferrer">
              Zomato
            </a>
            <a href={CAFE.swiggyUrl} target="_blank" rel="noreferrer">
              Swiggy
            </a>
            <a href={CAFE.districtUrl} target="_blank" rel="noreferrer">
              District
            </a>
            <Link href="/staff/login" style={{ marginTop: "1rem" }}>
              {tr.staff} login
            </Link>
          </div>
        </div>
        <div className="footer-mark" aria-hidden>
          LUNAR
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            opacity: 0.55,
            marginTop: "1.2rem",
          }}
        >
          © {new Date().getFullYear()} Lunar Cafe · GSTIN {CAFE.gstin}
          <br />
          Moon photograph: Gregory H. Revera,{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline", textDecoration: "underline" }}
          >
            CC BY-SA 3.0
          </a>
        </p>
      </div>
    </footer>
  );
}
