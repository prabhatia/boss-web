import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'boss — Professional Transparency & Career Intelligence',
  description:
    'Rate your managers anonymously. Discover companies that match your values. Find jobs powered by your real workplace preferences.',
  openGraph: {
    title: 'boss — The truth about work, for everyone',
    description:
      'Anonymous workplace ratings, verified salary data, and AI job matching built on what you actually value.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
