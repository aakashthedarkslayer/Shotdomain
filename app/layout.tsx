import type { Metadata } from 'next';
import { Anybody, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

// One family for everything people read; its width axis does the work:
// very condensed for poster heads, condensed for captions, normal for body.
const anybody = Anybody({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-anybody',
  display: 'swap',
});

// Only for pasted code: cURL, cookie values, custom CSS.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShotDomain | One Shot Every Domain',
  description:
    'Enter one URL. ShotDomain finds every page, captures it on desktop, tablet and mobile, and gives you a single ZIP.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${anybody.variable} ${plexMono.variable}`}>
      <body className="min-h-full font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
