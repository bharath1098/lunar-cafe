import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { CAFE } from "@/lib/cafe";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What Lunar Cafe stores when you reserve, order, join rewards, or send feedback — and how to delete a rewards profile.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const tel = `tel:${CAFE.phoneDisplay.replace(/\s/g, "")}`;
  return (
    <PublicShell>
      <PageHero
        eyebrow="Privacy"
        title="What we keep"
        subtitle="Plain language about the details Lunar Cafe stores to run the floor."
      />
      <section className="section legal-copy" style={{ paddingTop: "2rem" }}>
        <div className="wrap">
          <p>Last updated {CAFE.updated}.</p>
          <h2>What we collect</h2>
          <ul>
            <li>Name and mobile number when you join a table, reserve, or join Lunar Rewards.</li>
            <li>Orders, bills, payment method, and loyalty points tied to that visit.</li>
            <li>Reservation date, time, party size, seating preference, and any note you leave.</li>
            <li>Feedback you choose to send, including a rating.</li>
            <li>
              Language and currency choices, saved in this browser so the site stays as you left it.
            </li>
            <li>
              Campaign tags (utm_source, utm_medium, utm_campaign) if the link you opened included
              them. We attach those to the reservation or message, not to an ad network.
            </li>
            <li>
              If a page crashes, the page address and error text, so we can fix it. That report
              does not include your bill or password.
            </li>
          </ul>
          <h2>Why</h2>
          <p>
            To seat you, cook the order, print the bill, run rewards, and answer you. We do not
            sell this information and we do not run third-party advertising cookies.
          </p>
          <h2>Who can see it</h2>
          <p>
            Floor staff see open tables and orders. The owner sees bills, reservations, feedback,
            and the team list. Passwords for staff sign-in stay on the server.
          </p>
          <h2>How long, and how to delete</h2>
          <p>
            Bills stay for the cafe’s accounts (GSTIN {CAFE.gstin}). You can remove a Lunar
            Rewards profile yourself from the <Link href="/loyalty">rewards page</Link>. That
            deletes the points record. It does not erase a bill that was already paid.
          </p>
          <h2>Contact</h2>
          <p>
            {CAFE.name}, {CAFE.addressLines.join(", ")}, {CAFE.city}.{" "}
            <a href={tel}>{CAFE.phoneDisplay}</a>
            {" · "}
            <a href={`mailto:${CAFE.email}`}>{CAFE.email}</a>
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
