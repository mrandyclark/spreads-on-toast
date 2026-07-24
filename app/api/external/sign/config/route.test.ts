import { NextRequest } from 'next/server';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSign } from '@/server/signs/sign.actions';
import { SIGN_PAYLOAD_VERSION, SignRole } from '@/types';

import { GET } from './route';

vi.mock('@/server/signs/sign.actions', () => ({
	getSign: vi.fn(),
}));

const ORIGINAL_API_KEY = process.env.EXTERNAL_API_KEY;

const makeRequest = (headers: Record<string, string> = {}) =>
	new NextRequest('http://localhost/api/external/sign/config', { headers });

describe('GET /api/external/sign/config contract', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.EXTERNAL_API_KEY = 'contract-test-key';
	});

	afterAll(() => {
		process.env.EXTERNAL_API_KEY = ORIGINAL_API_KEY;
	});

	it('returns the existing not-configured response when the API key is absent', async () => {
		delete process.env.EXTERNAL_API_KEY;

		const response = await GET(makeRequest());

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'API not configured' });
	});

	it('returns the existing unauthorized response for a missing or incorrect API key', async () => {
		const response = await GET(makeRequest({ 'x-api-key': 'wrong' }));

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});

	it('requires the existing X-Sign-Id header', async () => {
		const response = await GET(makeRequest({ 'x-api-key': 'contract-test-key' }));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'X-Sign-Id header is required' });
	});

	it('returns the existing not-found response', async () => {
		vi.mocked(getSign).mockResolvedValue(null);

		const response = await GET(
			makeRequest({
				'x-api-key': 'contract-test-key',
				'x-sign-id': 'sign-one',
			}),
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: 'Sign not found' });
	});

	it('preserves the exact successful payload shape and default response headers', async () => {
		const config = {
			content: {
				lastGameTeamIds: ['reds'],
				nextGameTeamIds: ['reds'],
				openerCountdownTeamIds: [],
				standingsDivisions: [],
			},
			display: {
				brightness: 35,
				rotationIntervalSeconds: 10,
			},
			schedule: {
				enabled: true,
				offTime: '21:00',
				onTime: '09:00',
				timezone: 'America/Denver',
			},
		};

		vi.mocked(getSign).mockResolvedValue({
			config,
			createdAt: new Date('2026-01-01T00:00:00.000Z'),
			id: 'sign-one',
			members: [
				{ joinedAt: new Date('2026-01-01T00:00:00.000Z'), role: SignRole.Owner, user: 'user-one' },
			],
			owner: 'user-one',
			title: 'Kitchen',
			updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		});

		const response = await GET(
			makeRequest({
				'x-api-key': 'contract-test-key',
				'x-sign-id': 'sign-one',
			}),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBeNull();
		expect(response.headers.get('content-type')).toContain('application/json');
		expect(await response.json()).toEqual({
			config,
			payloadVersion: SIGN_PAYLOAD_VERSION,
		});
	});
});
