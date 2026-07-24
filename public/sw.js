const CACHE_VERSION = 'spreads-on-toast-v2-20260724';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PUBLIC_CACHE = `${CACHE_VERSION}-public`;
const OFFLINE_URL = '/offline';
const PRECACHE_URLS = [
	OFFLINE_URL,
	'/site.webmanifest',
	'/toast-icon.svg',
	'/android-chrome-192x192.png',
	'/android-chrome-512x512.png',
	'/maskable-icon-192x192.png',
	'/maskable-icon-512x512.png',
];
const PUBLIC_NAVIGATIONS = new Set(['/', OFFLINE_URL]);

const precacheOfflineShell = async () => {
	const cache = await caches.open(STATIC_CACHE);
	await cache.addAll(PRECACHE_URLS);

	// Next.js emits route-specific scripts and styles into the prerendered offline
	// document. Cache those dependencies during install so the fallback does not
	// become an unstyled page or throw chunk-load errors during a real outage.
	const offlineResponse = await cache.match(OFFLINE_URL);
	const offlineHtml = await offlineResponse?.clone().text();
	const assetUrls = [
		...new Set(
			[...(offlineHtml?.matchAll(/(?:href|src)="([^"]+)"/g) ?? [])]
				.map((match) => match[1])
				.filter((url) => url.startsWith('/_next/static/')),
		),
	];

	await cache.addAll(assetUrls);
};

self.addEventListener('install', (event) => {
	event.waitUntil(precacheOfflineShell());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith('spreads-on-toast-') && !key.startsWith(CACHE_VERSION))
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data?.type === 'CLEAR_CACHES') {
		event.waitUntil(
			caches
				.keys()
				.then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
				.then(() => event.source?.postMessage({ type: 'CACHES_CLEARED' })),
		);
	}
});

const cacheFirst = async (request) => {
	const cachedResponse = await caches.match(request);

	if (cachedResponse) {
		return cachedResponse;
	}

	const response = await fetch(request);

	if (response.ok) {
		const cache = await caches.open(STATIC_CACHE);
		await cache.put(request, response.clone());
	}

	return response;
};

const networkFirstPublic = async (request) => {
	try {
		const response = await fetch(request);

		if (response.ok) {
			const cache = await caches.open(PUBLIC_CACHE);
			await cache.put(request, response.clone());
		}

		return response;
	} catch {
		return (await caches.match(request)) ?? (await caches.match(OFFLINE_URL));
	}
};

self.addEventListener('fetch', (event) => {
	const { request } = event;

	if (request.method !== 'GET') {
		return;
	}

	const url = new URL(request.url);

	if (url.origin !== self.location.origin) {
		return;
	}

	if (
		url.pathname.startsWith('/api/') ||
		url.pathname.startsWith('/_next/image') ||
		url.pathname.startsWith('/signs/')
	) {
		return;
	}

	if (request.mode === 'navigate') {
		if (PUBLIC_NAVIGATIONS.has(url.pathname)) {
			event.respondWith(networkFirstPublic(request));
			return;
		}

		event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
		return;
	}

	if (
		url.pathname.startsWith('/_next/static/') ||
		/\.(?:css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/i.test(url.pathname)
	) {
		event.respondWith(cacheFirst(request));
	}
});
