import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { CopyButton } from "@/components/CopyButton";
import { CAFE } from "@/lib/cafe";
import { CAFE_MEDIA } from "@/lib/media";

export const metadata: Metadata = {
  title: "Contact Lunar Cafe Jubilee Hills",
  description: `Find Lunar Cafe at ${CAFE.addressLines.join(", ")}, ${CAFE.city}. Call ${CAFE.phoneDisplay} or email ${CAFE.email}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(CAFE.mapsQuery)}&output=embed`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CAFE.mapsQuery)}`;
  const telHref = `tel:${CAFE.phoneDisplay.replace(/\s/g, "")}`;
  const mailHref = `mailto:${CAFE.email}`;
  const address = `${CAFE.addressLines.join(", ")}, ${CAFE.city}`;
  return (
    <PublicShell>
      <PageHero
        eyebrow="Visit us"
        title="Find Lunar"
        subtitle={address}
        image={CAFE_MEDIA.nightSign}
      />
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="wrap">
          <div className="info-grid contact-info">
            <Reveal>
              <div className="info-card" style={{ height: "100%" }}>
                <div className="icon-bubble">
                  <MapPin size={22} />
                </div>
                <h3 className="h-display h-md">Address</h3>
                <p className="muted" style={{ lineHeight: 1.6 }}>
                  <a href={mapsHref} target="_blank" rel="noreferrer">
                    {address}
                  </a>
                </p>
                <CopyButton value={address} label="Copy address" />
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div className="info-card" style={{ height: "100%" }}>
                <div className="icon-bubble">
                  <Clock size={22} />
                </div>
                <h3 className="h-display h-md">Hours</h3>
                <p className="muted" style={{ lineHeight: 1.6 }}>
                  {CAFE.hours}, every day
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="info-card" style={{ height: "100%" }}>
                <div className="icon-bubble">
                  <Phone size={22} />
                </div>
                <h3 className="h-display h-md">Call</h3>
                <p className="muted" style={{ lineHeight: 1.6 }}>
                  <a href={telHref}>{CAFE.phoneDisplay}</a>
                </p>
                <CopyButton value={CAFE.phoneDisplay} label="Copy number" />
              </div>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="info-card" style={{ height: "100%" }}>
                <div className="icon-bubble">
                  <Mail size={22} />
                </div>
                <h3 className="h-display h-md">Email</h3>
                <p className="muted" style={{ lineHeight: 1.6 }}>
                  <a href={mailHref}>{CAFE.email}</a>
                </p>
                <CopyButton value={CAFE.email} label="Copy email" />
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="info-card" style={{ height: "100%" }}>
                <div className="icon-bubble">
                  <ShoppingBag size={22} />
                </div>
                <h3 className="h-display h-md">Order or reserve</h3>
                <p className="muted contact-partners">
                  <a href={CAFE.zomatoUrl} target="_blank" rel="noreferrer">
                    Zomato
                  </a>
                  <a href={CAFE.swiggyUrl} target="_blank" rel="noreferrer">
                    Swiggy Dineout
                  </a>
                  <a href={CAFE.districtUrl} target="_blank" rel="noreferrer">
                    District
                  </a>
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="neo-card contact-form-card">
              <h2 className="h-display h-md" style={{ marginBottom: "0.4rem" }}>
                Send a message
              </h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Reception reads these. For a table, use Reserve.
              </p>
              <ContactForm />
            </div>
          </Reveal>

          <div className="contact-map">
            <Reveal className="contact-map-cell">
              <div className="contact-map-frame">
                <iframe title="Lunar Cafe map, wide" src={mapSrc} loading="lazy" />
              </div>
            </Reveal>
            <Reveal className="contact-map-cell" delay={0.1}>
              <div className="contact-map-frame">
                <Image
                  src={CAFE_MEDIA.goldSign}
                  alt="Lunar Cafe sign"
                  fill
                  className="cover"
                  sizes="(max-width: 960px) 100vw, 45vw"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
