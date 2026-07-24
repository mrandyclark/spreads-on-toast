import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('PWA assets', () => {
	it('has a complete standalone manifest and branded icon purposes', () => {
		const manifest = JSON.parse(read('public/site.webmanifest')) as {
			display?: string;
			icons?: Array<{ purpose?: string; sizes: string; src: string }>;
			scope?: string;
			start_url?: string;
		};

		expect(manifest.display).toBe('standalone');
		expect(manifest.scope).toBe('/');
		expect(manifest.start_url).toContain('/dashboard');
		expect(manifest.icons).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ purpose: 'any', sizes: '192x192' }),
				expect.objectContaining({ purpose: 'any', sizes: '512x512' }),
				expect.objectContaining({ purpose: 'maskable', sizes: '192x192' }),
				expect.objectContaining({ purpose: 'maskable', sizes: '512x512' }),
			]),
		);

		for (const icon of manifest.icons ?? []) {
			expect(statSync(resolve(root, 'public', icon.src.replace(/^\//, ''))).size).toBeGreaterThan(
				1_000,
			);
		}
	});

	it('keeps authoritative APIs and mutations out of service-worker caches', () => {
		const serviceWorker = read('public/sw.js');

		expect(serviceWorker).toContain("request.method !== 'GET'");
		expect(serviceWorker).toContain("url.pathname.startsWith('/api/')");
		expect(serviceWorker).toContain('SKIP_WAITING');
		expect(serviceWorker).toContain('CLEAR_CACHES');
		expect(serviceWorker).toContain('caches.match(OFFLINE_URL)');
		expect(serviceWorker).toContain("url.startsWith('/_next/static/')");
		expect(serviceWorker).toContain('precacheOfflineShell');
	});
});
