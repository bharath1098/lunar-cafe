"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  ArrowUpRight,
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

  // a link is active on its own page and on any page below it (/menu/cheese-omelette -> Menu)
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className={clsx("site-header on-dark", scrolled && "scrolled")}>
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Lunar Cafe home">
            <span className="brand-mark">
              <Image
                src={CAFE_MEDIA.logo}
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
                className={clsx(isActive(l.href) && "active")}
                aria-current={isActive(l.href) ? "page" : undefined}
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
              <Link
                key={l.href}
                href={l.href}
                className={clsx(isActive(l.href) && "active")}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/feedback"
              className={clsx(isActive("/feedback") && "active")}
              aria-current={isActive("/feedback") ? "page" : undefined}
            >
              {tr.feedback}
            </Link>
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
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CAFE.mapsQuery)}`;
  const telHref = `tel:${CAFE.phoneDisplay.replace(/\s/g, "")}`;
  const explore = [
    { href: "/menu", label: tr.menu },
    { href: "/about", label: tr.about },
    { href: "/gallery", label: tr.gallery },
    { href: "/loyalty", label: tr.loyalty },
    { href: "/feedback", label: tr.feedback },
    { href: "/contact", label: tr.contact },
  ];
  const partners = [
    { href: CAFE.zomatoUrl, label: "Zomato" },
    { href: CAFE.swiggyUrl, label: "Swiggy" },
    { href: CAFE.districtUrl, label: "District" },
  ];

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark">
                <Image
                  src={CAFE_MEDIA.logo}
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
            <p className="footer-tagline">{CAFE.tagline}</p>
            <div className="footer-cta">
              <Link href="/reserve" className="footer-cta-btn is-primary">
                {tr.bookTable}
              </Link>
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="footer-cta-btn"
              >
                Directions
              </a>
            </div>
          </div>

          <nav className="footer-nav" aria-label="Explore">
            <h5>Explore</h5>
            <div className="footer-chips">
              {explore.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="footer-visit">
            <h5>Visit</h5>
            <div className="footer-visit-list">
              <a
                className="footer-fact"
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
              >
                <span className="footer-ico">
                  <MapPin size={15} />
                </span>
                <span>
                  {CAFE.addressLines[0]}
                  <small>{CAFE.addressLines[1]}</small>
                </span>
              </a>
              <p className="footer-fact">
                <span className="footer-ico">
                  <Clock size={15} />
                </span>
                <span>
                  Open daily
                  <small>{CAFE.hours}</small>
                </span>
              </p>
              <a className="footer-fact" href={telHref}>
                <span className="footer-ico">
                  <Phone size={15} />
                </span>
                <span>
                  Call us
                  <small>{CAFE.phoneDisplay}</small>
                </span>
              </a>
            </div>
          </div>

          <div className="footer-order">
            <h5>{tr.orderPartners}</h5>
            <div className="footer-chips is-partners">
              {partners.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.label}
                  <ArrowUpRight size={13} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-mark" aria-hidden>
          LUNAR
        </div>
        <p className="footer-legal">
          © {new Date().getFullYear()} Lunar Cafe · GSTIN {CAFE.gstin}
          <span className="footer-legal-dot" aria-hidden>
            ·
          </span>
          <Link href="/staff/login" className="footer-staff">
            {tr.staff} login
          </Link>
          <br />
          Moon photograph: Gregory H. Revera,{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 3.0
          </a>
        </p>
      </div>
    </footer>
  );
}
