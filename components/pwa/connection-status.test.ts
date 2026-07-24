import { afterEach, describe, expect, it, vi } from 'vitest';

import { probeApplicationHealth } from './connection-status';

afterEach(() => {
	vi.useRealTimers();
});

describe('probeApplicationHealth', () => {
	it('treats a successful uncached same-origin health response as online', async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));

		await expect(probeApplicationHealth({ fetcher })).resolves.toBe(true);
		expect(fetcher).toHaveBeenCalledWith(
			'/api/health',
			expect.objectContaining({
				cache: 'no-store',
				credentials: 'same-origin',
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it('treats non-success and network responses as unavailable', async () => {
		const unavailable = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response(null, { status: 503 }));
		const disconnected = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Network failed'));

		await expect(probeApplicationHealth({ fetcher: unavailable })).resolves.toBe(false);
		await expect(probeApplicationHealth({ fetcher: disconnected })).resolves.toBe(false);
	});

	it('times out a health request that never completes', async () => {
		vi.useFakeTimers();
		const fetcher = vi.fn<typeof fetch>().mockImplementation(
			(_input, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => {
						reject(new DOMException('Aborted', 'AbortError'));
					});
				}),
		);

		const probe = probeApplicationHealth({ fetcher, timeoutMs: 100 });
		await vi.advanceTimersByTimeAsync(100);

		await expect(probe).resolves.toBe(false);
	});
});
