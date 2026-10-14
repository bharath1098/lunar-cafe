import Image from "next/image";
import { Coffee, Leaf, Moon } from "lucide-react";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/Reveal";
import { CAFE } from "@/lib/cafe";
import { CAFE_MEDIA } from "@/lib/media";

export default function AboutPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Our story"
        title="A space to pause"
        subtitle={CAFE.tagline}
        image={CAFE_MEDIA.interior}
      />

      <section className="section">
        <div className="wrap split" style={{ alignItems: "center" }}>
          <Reveal>
            <div className="arch-photo">
              <Image
                src={CAFE_MEDIA.arch}
                alt="Floral arch at Lunar Cafe"
                fill
                className="cover"
                sizes="(max-width: 960px) 100vw, 45vw"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="eyebrow">Jubilee Hills, Hyderabad</span>
            <h2 className="h-display h-lg" style={{ margin: "1rem 0" }}>
              Mint walls, golden light, slow coffee
            </h2>
            <p className="lead">
              Lunar Cafe is a cozy hideaway serving artisanal coffee and gourmet
              fusion dishes — from Lunar Sky Lattes and bubble tea to bowls,
              pizzas, and chef-special pastas.
            </p>
            <p className="lead" style={{ marginTop: "1rem" }}>
              Scan the QR on your table to order together with friends. One group
              code keeps your table in sync, so every guest adds to the same
              bill.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section-dark">
        <div className="wrap info-grid">
          {[
            {
              i: <Coffee size={22} />,
              t: "Artisanal coffee",
              d: "Barista classics and signature lattes made with care.",
            },
            {
              i: <Leaf size={22} />,
              t: "Garden energy",
              d: "Terrazzo floors, cherry blossoms, and a leafy patio.",
            },
            {
              i: <Moon size={22} />,
              t: "Moments that matter",
              d: "Evenings that run late with friends, family and good light.",
            },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.1}>
              <div
                className="info-card"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  boxShadow: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--on-dark)",
                }}
              >
                <div
                  className="icon-bubble"
                  style={{ background: "rgba(226,204,146,0.15)", color: "var(--gold-300)", boxShadow: "none" }}
                >
                  {f.i}
                </div>
                <h3 className="h-display h-md">{f.t}</h3>
                <p style={{ opacity: 0.75, lineHeight: 1.6 }}>{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
