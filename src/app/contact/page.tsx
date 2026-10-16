import Image from "next/image";
import { Clock, MapPin, Phone, ShoppingBag } from "lucide-react";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { CAFE } from "@/lib/cafe";
import { CAFE_MEDIA } from "@/lib/media";

export default function ContactPage() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(CAFE.mapsQuery)}&output=embed`;
  return (
    <PublicShell>
      <PageHero
        eyebrow="Visit us"
        title="Find Lunar"
        subtitle={CAFE.addressLines.join(", ")}
        image={CAFE_MEDIA.nightSign}
      />
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="wrap">
          <div className="info-grid contact-info">
            {[
              { i: <MapPin size={22} />, t: "Address", d: CAFE.addressLines.join(", ") + ", Hyderabad" },
              { i: <Clock size={22} />, t: "Hours", d: `${CAFE.hours}, every day` },
              { i: <Phone size={22} />, t: "Call", d: CAFE.phoneDisplay },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 0.06}>
                <div className="info-card" style={{ height: "100%" }}>
                  <div className="icon-bubble">{c.i}</div>
                  <h3 className="h-display h-md">{c.t}</h3>
                  <p className="muted" style={{ lineHeight: 1.6 }}>{c.d}</p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.18}>
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

          <div className="contact-map">
            <Reveal className="contact-map-cell">
              <div className="contact-map-frame">
                <iframe
                  title="Lunar Cafe map"
                  src={mapSrc}
                  loading="lazy"
                />
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
