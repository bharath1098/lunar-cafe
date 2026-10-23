import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { CAFE } from "@/lib/cafe";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Hours, reservations, table QR ordering, loyalty points and dietary questions for Lunar Cafe, Jubilee Hills.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    q: "When are you open?",
    a: `Every day, ${CAFE.hours}. The kitchen and bar follow the same hours.`,
  },
  {
    q: "Do I need a reservation?",
    a: "Walk-ins are welcome. A reservation holds a request for reception — a table is assigned when you arrive. Use Reserve a table and we’ll confirm by phone.",
  },
  {
    q: "How does ordering at the table work?",
    a: "Scan the QR on your table, join with your name and phone, and order for the group. The host can share a 6-digit code so everyone adds to the same bill.",
  },
  {
    q: "Can I see prices before I sit down?",
    a: "The public menu lists dishes. Prices and ordering open once you scan the table QR, so the bill matches the table you are actually at.",
  },
  {
    q: "Is there a vegetarian menu?",
    a: "Yes. The menu marks vegetarian dishes, and you can filter to veg only on the menu page.",
  },
  {
    q: "How do Lunar Rewards work?",
    a: "Join with your phone number. You get 100 welcome points, then 1 point for every ₹100 on a paid bill. 100 points is ₹50 off, redeemed with reception when you pay.",
  },
  {
    q: "Can I delete my rewards profile?",
    a: "Yes. Open Lunar Rewards, look up your number, and choose Delete my rewards profile. Past bills stay in our accounts; the points profile is removed.",
  },
  {
    q: "What if a dish is unavailable?",
    a: "The floor can decline an item. You’ll see the reason on your table order, and the rest of the ticket still goes through.",
  },
  {
    q: "Do you take calls and messages?",
    a: `Call ${CAFE.phoneDisplay} or email ${CAFE.email}. The contact page also has a message form.`,
  },
  {
    q: "Where are you?",
    a: `${CAFE.addressLines.join(", ")}, ${CAFE.city}. Open the contact page for the map.`,
  },
];

export default function FaqPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Questions"
        title="Before you visit"
        subtitle="Hours, reservations, the table QR, and rewards — the short version."
      />
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="wrap">
          <div className="faq-list">
            {FAQS.map((item) => (
              <details key={item.q} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <p className="muted" style={{ marginTop: "1.5rem" }}>
            Still stuck? <Link href="/contact">Contact the cafe</Link> or{" "}
            <Link href="/reserve">reserve a table</Link>.
          </p>
          <p className="muted" style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>
            Last updated {CAFE.updated}
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
