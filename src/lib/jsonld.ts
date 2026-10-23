import { CAFE } from "./cafe";
import { absoluteUrl, siteUrl } from "./site";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** Cafe + website identity in the first HTML response. No retired search-box action. */
export function cafeJsonLd() {
  const origin = siteUrl();
  const phone = CAFE.phoneDisplay.replace(/[^\d+]/g, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CafeOrCoffeeShop",
        "@id": `${origin}/#cafe`,
        name: CAFE.name,
        url: origin,
        image: absoluteUrl("/media/cafe/lunar-logo.jpg"),
        telephone: phone,
        email: CAFE.email,
        servesCuisine: ["Coffee", "Fusion"],
        hasMenu: absoluteUrl("/menu"),
        acceptsReservations: true,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Road no 7, Jubilee Hills, Bhavani Nagar",
          addressLocality: CAFE.city,
          postalCode: "500045",
          addressRegion: "Telangana",
          addressCountry: "IN",
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: DAYS,
            opens: CAFE.hoursStart,
            closes: CAFE.hoursEnd,
          },
        ],
        sameAs: [CAFE.zomatoUrl, CAFE.swiggyUrl, CAFE.districtUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: CAFE.name,
        url: origin,
        publisher: { "@id": `${origin}/#cafe` },
      },
    ],
  };
}
