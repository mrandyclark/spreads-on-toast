import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchMlbJson } from './client';

const isPayload = (value: unknown): value is { ok: boolean } =>
	typeof value === 'object' && value !== null && 'ok' in value;

afterEach(() => {
	vi.restoreAllMocks();
});

describe('fetchMlbJson', () => {
	it('returns a validated JSON payload', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				headers: { 'content-type': 'application/json' },
				status: 200,
			}),
		);

		await expect(fetchMlbJson('https://statsapi.mlb.com/test', isPayload)).resolves.toEqual({
			ok: true,
		});
	});

	it('rejects an unchecked external schema', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ changed: true }), { status: 200 }),
		);

		await expect(
			fetchMlbJson('https://statsapi.mlb.com/test', isPayload, { attempts: 1 }),
		).rejects.toThrow('invalid response shape');
	});

	it('does not retry a non-retryable client error', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

		await expect(
			fetchMlbJson('https://statsapi.mlb.com/test', isPayload, { attempts: 1 }),
		).rejects.toThrow('404 Not Found');
		expect(fetchMock).toHaveBeenCalledOnce();
	});
});
