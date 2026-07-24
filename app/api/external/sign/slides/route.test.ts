import { NextRequest } from 'next/server';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSign } from '@/server/signs/sign.actions';
import { getSignSlides } from '@/server/slides';
import { SignRole, SlidesResponse, SlideType } from '@/types';

import { GET } from './route';

vi.mock('@/server/signs/sign.actions', () => ({
	getSign: vi.fn(),
}));

vi.mock('@/server/slides', () => ({
	getSignSlides: vi.fn(),
}));

const ORIGINAL_API_KEY = process.env.EXTERNAL_API_KEY;

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

const makeRequest = (query = '', headers: Record<string, string> = {}) =>
	new NextRequest(`http://localhost/api/external/sign/slides${query}`, { headers });

const authenticationCases: Array<{
	expectedBody: { error: string };
	expectedStatus: number;
	headers: Record<string, string>;
	unsetApiKey: boolean;
}> = [
	{
		expectedBody: { error: 'API not configured' },
		expectedStatus: 500,
		headers: {},
		unsetApiKey: true,
	},
	{
		expectedBody: { error: 'Unauthorized' },
		expectedStatus: 401,
		headers: { 'x-api-key': 'wrong' },
		unsetApiKey: false,
	},
	{
		expectedBody: { error: 'X-Sign-Id header is required' },
		expectedStatus: 400,
		headers: { 'x-api-key': 'contract-test-key' },
		unsetApiKey: false,
	},
];

describe('GET /api/external/sign/slides contract', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.EXTERNAL_API_KEY = 'contract-test-key';
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
	});

	afterAll(() => {
		process.env.EXTERNAL_API_KEY = ORIGINAL_API_KEY;
	});

	it.each(authenticationCases)(
		'preserves the $expectedStatus authentication/header response',
		async ({ expectedBody, expectedStatus, headers, unsetApiKey }) => {
			if (unsetApiKey) {
				delete process.env.EXTERNAL_API_KEY;
			}

			const response = await GET(makeRequest('', headers));

			expect(response.status).toBe(expectedStatus);
			expect(await response.json()).toEqual(expectedBody);
		},
	);

	it('preserves date validation and does not generate slides for invalid input', async () => {
		const response = await GET(
			makeRequest('?date=07%2F24%2F2026', {
				'x-api-key': 'contract-test-key',
				'x-sign-id': 'sign-one',
			}),
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Date must be in YYYY-MM-DD format' });
		expect(getSignSlides).not.toHaveBeenCalled();
	});

	it('passes the configured content and date through and preserves slide field types and ordering', async () => {
		const payload: SlidesResponse = {
			generatedAt: '2026-07-24T12:00:00.000Z',
			slides: [
				{
					slideType: SlideType.STANDINGS,
					teams: [
						{
							abbreviation: 'CIN',
							gamesBack: '-',
							losses: 44,
							name: 'Reds',
							rank: 1,
							wins: 58,
						},
					],
					title: 'NL Central',
				},
				{
					awayTeam: {
						abbreviation: 'CIN',
						errors: 0,
						hits: 8,
						name: 'Reds',
						runs: 4,
					},
					gameDate: '2026-07-23T23:10:00.000Z',
					homeTeam: {
						abbreviation: 'LAD',
						errors: 1,
						hits: 7,
						name: 'Dodgers',
						runs: 3,
					},
					slideType: SlideType.LAST_GAME,
				},
			],
		};
		vi.mocked(getSignSlides).mockResolvedValue(payload);

		const response = await GET(
			makeRequest('?date=2026-07-24', {
				'x-api-key': 'contract-test-key',
				'x-sign-id': 'sign-one',
			}),
		);

		expect(getSignSlides).toHaveBeenCalledWith(config.content, '2026-07-24');
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBeNull();
		expect(await response.json()).toEqual(payload);
	});

	it.each([
		{ date: '?date=2026-07-24', message: 'No data available for 2026-07-24' },
		{ date: '', message: 'No data available for current season' },
	])('preserves the empty-data message for "$date"', async ({ date, message }) => {
		vi.mocked(getSignSlides).mockResolvedValue({
			generatedAt: '2026-07-24T12:00:00.000Z',
			slides: [],
		});

		const response = await GET(
			makeRequest(date, {
				'x-api-key': 'contract-test-key',
				'x-sign-id': 'sign-one',
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			generatedAt: '2026-07-24T12:00:00.000Z',
			message,
			slides: [],
		});
	});
});
