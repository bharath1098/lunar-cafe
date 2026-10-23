import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { Providers } from "@/components/Providers";
import { cafeJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const description =
  "Lunar Cafe in Jubilee Hills, Hyderabad. Coffee, mocktails and fusion plates, open daily 11:00 AM–11:30 PM. Reserve a table or scan the QR to order.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Lunar Cafe | Coffee and Dining in Jubilee Hills",
    template: "%s · Lunar Cafe",
  },
  description,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Lunar Cafe",
    images: [{ url: "/media/cafe/lunar-logo.jpg", alt: "Lunar Cafe logo" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/media/cafe/lunar-logo.jpg",
    apple: "/media/cafe/lunar-logo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#061c1b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* apply the saved theme before first paint (no flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              // theme + "same look on every screen": the design is laid out for a
              // 1920 CSS px wide screen (B). Any screen at least M px wide is scaled
              // proportionally to it (a 125% laptop = 1536px -> 0.8, a 4K screen -> 2),
              // narrower ones (tablet / phone) keep the normal responsive layout.
              // See --ui-zoom in globals.css.
              "document.documentElement.dataset.theme='dark';" +
              "(function(){var B=1920,M=1280,d=document.documentElement;" +
              "function z(){var w=window.innerWidth,k=w>=M?Math.min(w/B,2.5):1;" +
              "d.style.setProperty('--ui-zoom',k.toFixed(4))}" +
              "z();window.addEventListener('resize',z)})();" +
              "(function(){var d=document.documentElement,p=location.pathname;" +
              "if(/^\\/(staff|order|t)(\\/|$)/.test(p)){d.dataset.intro='skip';return}" +
              "if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.intro='done';return}" +
              "try{if(sessionStorage.getItem('lunar-intro-seen')){d.dataset.intro='done';return}}catch(e){}" +
              "d.dataset.intro='open';d.dataset.introStart=String(Date.now());" +
              "(new Image()).src='/media/sky/moon.jpg'})()",
          }}
        />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <JsonLd data={cafeJsonLd()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
