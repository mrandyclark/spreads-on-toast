import type { Metadata } from 'next';

import { Analytics } from '@vercel/analytics/next';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  description: 'A Next.js starter template with Vercel, MongoDB, and Kinde authentication.',
  title: 'Next.js Starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-bg text-text font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
