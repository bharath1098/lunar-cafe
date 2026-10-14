import Image from "next/image";
import { GuestTableBar } from "./GuestTableBar";
import { SiteFooter, SiteHeader } from "./SiteHeader";
import { Reveal } from "./Reveal";
import { LunarSky } from "./LunarSky";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <GuestTableBar />
      {children}
      <SiteFooter />
    </>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section className="page-hero">
      <LunarSky variant="page" />
      <div className="wrap">
        <Reveal>
          <span className="eyebrow" style={{ color: "var(--gold-300)" }}>
            {eyebrow}
          </span>
          <h1 className="h-display h-xl" style={{ margin: "1rem 0" }}>
            {title}
          </h1>
          {subtitle && <p className="lead">{subtitle}</p>}
        </Reveal>
      </div>
      {image && (
        <div className="arch-deco">
          <Image src={image} alt="" fill sizes="190px" className="cover" />
        </div>
      )}
    </section>
  );
}
