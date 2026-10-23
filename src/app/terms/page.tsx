import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { CAFE } from "@/lib/cafe";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Reservations, table orders, prices in rupees, and Lunar Rewards at Lunar Cafe, Jubilee Hills.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Terms"
        title="House rules"
        subtitle="How reservations, table orders, and rewards work at Lunar Cafe."
      />
      <section className="section legal-copy" style={{ paddingTop: "2rem" }}>
        <div className="wrap">
          <p>Last updated {CAFE.updated}.</p>
          <h2>The cafe</h2>
          <p>
            {CAFE.name} serves at {CAFE.addressLines.join(", ")}, {CAFE.city}, daily {CAFE.hours}.
            GSTIN {CAFE.gstin}.
          </p>
          <h2>Reservations</h2>
          <p>
            A request on the <Link href="/reserve">reserve page</Link> is not a confirmed table.
            Reception confirms by phone and assigns a table when you arrive. We may release a
            booking if the party is very late and the floor is full.
          </p>
          <h2>Orders and prices</h2>
          <p>
            Menu prices and bills are in Indian rupees. If you switch the display currency, that
            figure is a guide only. Ordering opens from the QR on your table. An item can be
            refused if it is finished; the rest of the order still stands. The bill includes the
            taxes and service charge shown before you pay.
          </p>
          <h2>Rewards</h2>
          <p>
            Lunar Rewards is a points record against your phone number. Welcome points and the
            earn rate shown on the rewards page are the current offer and can change. Points are
            redeemed with reception at bill time. They are not cash and are not transferable.
            You can delete the profile from the rewards page.
          </p>
          <h2>Your messages</h2>
          <p>
            Feedback is read by the owner before anything is shown on the site. Don’t send
            another person’s phone number or a staff password through the form.
          </p>
          <h2>The site</h2>
          <p>
            Staff tools are for people who work here. Guest pages are for looking up the menu,
            booking, and ordering at your table. See the <Link href="/privacy">privacy policy</Link>{" "}
            for what we store.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
