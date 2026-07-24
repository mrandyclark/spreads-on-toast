import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /api/health', () => {
	it('returns a non-cacheable liveness response', async () => {
		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(body).toMatchObject({
			service: 'spreads-on-toast',
			status: 'ok',
		});
		expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});
});
