import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShotDomain — One URL. Every Page. Every Device. One ZIP.",
  description:
    "ShotDomain discovers your entire sitemap, captures full-bleed retina screenshots across desktop, tablet, and mobile, and downloads an organized ZIP in seconds.",
  keywords: [
    "website screenshot tool",
    "bulk screenshot entire domain",
    "sitemap screenshot capture",
    "responsive mobile screenshot",
    "retina full page capture",
    "website redesign archiving",
  ],
  authors: [{ name: "ShotDomain" }],
  openGraph: {
    title: "ShotDomain — One URL. Every Page. Every Device. One ZIP.",
    description:
      "Automated domain-wide screenshot captures across desktop, tablet, and mobile viewports. Delivered as a structured ZIP.",
    url: "https://shotdomain.com",
    siteName: "ShotDomain",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShotDomain — One URL. Every Page. Every Device. One ZIP.",
    description:
      "Automated domain-wide screenshot captures across desktop, tablet, and mobile viewports.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${instrumentSerif.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full bg-[#FBFBFA] text-[#121315] font-sans antialiased selection:bg-[#E54D2E] selection:text-white dark:bg-[#0E0F11] dark:text-[#EDEDED]">
        {children}
      </body>
    </html>
  );
}
