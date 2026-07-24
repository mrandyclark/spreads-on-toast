import type { Metadata, Viewport } from 'next';

import { Analytics } from '@vercel/analytics/next';

import PwaController from '@/components/pwa/pwa-controller';

import './globals.css';

export const metadata: Metadata = {
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'Spreads',
	},
	applicationName: 'Spreads on Toast',
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
	other: {
		'mobile-web-app-capable': 'yes',
	},
	title: {
		default: 'Spreads on Toast — Call your shot',
		template: '%s · Spreads on Toast',
	},
};

export const viewport: Viewport = {
	colorScheme: 'light dark',
	themeColor: [
		{ color: '#f6f0e3', media: '(prefers-color-scheme: light)' },
		{ color: '#09141e', media: '(prefers-color-scheme: dark)' },
	],
	viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="font-sans antialiased">
				{children}
				<PwaController />
				{process.env.VERCEL === '1' ? <Analytics /> : null}
			</body>
		</html>
	);
}
