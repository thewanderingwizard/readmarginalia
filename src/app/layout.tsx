import type { Metadata } from "next";
import { Bodoni_Moda, Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const text = EB_Garamond({
  variable: "--font-text",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const wordmark = Bodoni_Moda({
  variable: "--font-wordmark",
  subsets: ["latin"],
  display: "swap",
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.readmarginalia.org"),
  title: {
    default: "Marginalia — For All the Readers",
    template: "%s — Marginalia",
  },
  description: "A quiet place to tend the books that shape you.",
  applicationName: "Marginalia",
  icons: {
    icon: "/brand/marginalia-crest-master.png",
    apple: "/brand/marginalia-crest-master.png",
  },
  openGraph: {
    title: "Marginalia",
    description: "A quiet place to tend the books that shape you.",
    type: "website",
    siteName: "Marginalia",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${wordmark.variable}`}>
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
