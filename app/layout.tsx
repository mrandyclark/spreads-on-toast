import type { Metadata, Viewport } from 'next';

import { Analytics } from '@vercel/analytics/next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';

import './globals.css';

const dmSans = DM_Sans({
	subsets: ['latin'],
	variable: '--font-dm-sans',
});

const dmSerif = DM_Serif_Display({
	subsets: ['latin'],
	variable: '--font-dm-serif',
	weight: '400',
});

export const metadata: Metadata = {
	description:
		"Pick season win totals vs the line, lock them in, and see who comes out on top by season's end. A fun friend-group competition tracker.",
	icons: {
		apple: '/apple-touch-icon.png',
		icon: [
			{ sizes: '32x32', type: 'image/png', url: '/favicon-32x32.png' },
			{ sizes: '16x16', type: 'image/png', url: '/favicon-16x16.png' },
		],
		shortcut: '/favicon.ico',
	},
	manifest: '/site.webmanifest',
	title: 'spreadsontoast - Lock Your Preseason Spreads',
};

export const viewport: Viewport = {
	themeColor: '#c05621',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html className={`${dmSans.variable} ${dmSerif.variable}`} lang="en">
			<body className="font-sans antialiased">
				{children}
				<Analytics />
			</body>
		</html>
	);
}
