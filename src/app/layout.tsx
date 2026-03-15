import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'AutoParts Finder — Search Used Auto Parts Across the US',
  description:
    'Find used auto parts from eBay Motors, Car-Part.com, Craigslist, and more — all in one search.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AutoParts Finder',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'AutoParts Finder',
    description: 'Search used auto parts across the US in one place.',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">{children}</body>
    </html>
  );
}
