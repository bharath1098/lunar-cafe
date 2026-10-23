import { CAFE } from "@/lib/cafe";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Plain-language facts for answer engines. Matches the pages guests can read. */
export function GET() {
  const body = `# ${CAFE.name}

> ${CAFE.name} is a cafe in Jubilee Hills, Hyderabad. Coffee, mocktails, and fusion plates. Open every day ${CAFE.hours}.

## Facts

- Name: ${CAFE.name}
- Address: ${CAFE.addressLines.join(", ")}, ${CAFE.city}
- Phone: ${CAFE.phoneDisplay}
- Email: ${CAFE.email}
- Hours: ${CAFE.hours}, every day
- Reservations: walk-ins are welcome; a reservation is confirmed by phone
- Table ordering: guests scan the QR code on the table
- Rewards: 100 welcome points, then 1 point per ₹100; 100 points is ₹50 off

## Pages

- Home: ${absoluteUrl("/")}
- Menu: ${absoluteUrl("/menu")}
- About: ${absoluteUrl("/about")}
- Contact: ${absoluteUrl("/contact")}
- Reserve: ${absoluteUrl("/reserve")}
- FAQ: ${absoluteUrl("/faq")}
- Gallery: ${absoluteUrl("/gallery")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
