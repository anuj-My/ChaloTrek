import type { Metadata } from "next";
import { Geist_Mono, Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";

import { siteConfig } from "@/lib/site-config";

// Body text: a quiet, very legible sans.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

// Headings: an editorial serif. The optical-size axis keeps big headlines
// crisp and small ones sturdy.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s — ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
