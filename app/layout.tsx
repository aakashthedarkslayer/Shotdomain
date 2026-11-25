import type { Metadata } from 'next';
import { Archivo, Geist_Mono } from 'next/font/google';
import './globals.css';

// One family; its width axis carries the type: wide for display, narrow for captions.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
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
    <html lang="en" className={`h-full ${archivo.variable} ${geistMono.variable}`}>
      <body className="min-h-full font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
