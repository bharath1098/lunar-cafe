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
              "document.documentElement.dataset.theme='dark'",
          }}
        />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
