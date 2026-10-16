import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
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

export const metadata: Metadata = {
  title: "Lunar Cafe | Jubilee Hills, Hyderabad",
  description:
    "A space to pause. A place to connect. Moments that matter. Artisanal coffee and gourmet fusion at Lunar Cafe, Jubilee Hills.",
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
              "z();window.addEventListener('resize',z)})()",
          }}
        />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
