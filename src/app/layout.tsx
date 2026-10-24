import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { siteConfig } from "@/lib/site-config";

// Body text: friendly and very legible on phones.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Headings: a grotesque with character, so the brand doesn't read as a SaaS tool.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
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
      className={`${jakarta.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
