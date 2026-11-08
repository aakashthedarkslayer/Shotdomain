import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShotDomain — Screenshot every page of a website',
  description:
    'Enter one URL. ShotDomain finds every page, captures it on desktop, tablet and mobile, and gives you a single ZIP.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full bg-bg font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
