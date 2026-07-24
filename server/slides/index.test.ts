import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Game, GameState, GameType, SlideType } from '@/types';

vi.mock('@/server/schedule/game.service', () => ({
	gameService: {
		getLastGameForTeams: vi.fn(),
		getNextGameForTeams: vi.fn(),
		getOpenerForTeams: vi.fn(() => Promise.resolve([])),
	},
}));

vi.mock('@/server/standings/standings.actions', () => ({
	getDivisionStandings: vi.fn(),
}));

import { gameService } from '@/server/schedule/game.service';
import { getDivisionStandings } from '@/server/standings/standings.actions';

import { getSignSlides } from '.';

const makeGame = (mlbGameId: number): Game =>
	({
		awayTeam: {
			errors: 0,
			hits: 7,
			score: 3,
			team: {
				abbreviation: 'CIN',
				city: 'Cincinnati',
				id: 'reds',
				name: 'Reds',
			},
		},
		gameDate: new Date('2026-07-23T23:10:00.000Z'),
		gameType: GameType.RegularSeason,
		homeTeam: {
			errors: 1,
			hits: 8,
			score: 4,
			team: {
				abbreviation: 'LAD',
				city: 'Los Angeles',
				id: 'dodgers',
				name: 'Dodgers',
			},
		},
		id: `game-${mlbGameId}`,
		mlbGameId,
		status: { abstractGameState: GameState.Final },
		venue: { mlbId: 1, name: 'Dodger Stadium' },
	}) as Game;

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(gameService.getLastGameForTeams).mockResolvedValue([]);
	vi.mocked(gameService.getNextGameForTeams).mockResolvedValue([]);
	vi.mocked(getDivisionStandings).mockResolvedValue(null);
});

describe('getSignSlides', () => {
	it('preserves standings then configured-team game ordering and de-duplicates a shared game', async () => {
		const sharedGame = makeGame(123);
		vi.mocked(getDivisionStandings).mockResolvedValue({
			asOfDate: '2026-07-24',
			divisions: [
				{
					league: 'National League',
					name: 'NL Central',
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
				},
			],
			season: '2026',
		});
		vi.mocked(gameService.getLastGameForTeams).mockResolvedValue([sharedGame]);

		const result = await getSignSlides({
			lastGameTeamIds: ['reds', 'dodgers'],
			nextGameTeamIds: [],
			openerCountdownTeamIds: [],
			standingsDivisions: [],
		});

		expect(result.slides.map((slide) => slide.slideType)).toEqual([
			SlideType.STANDINGS,
			SlideType.LAST_GAME,
		]);
	});

	it('passes an explicit date to standings and last/next game queries', async () => {
		await getSignSlides(
			{
				lastGameTeamIds: ['reds'],
				nextGameTeamIds: ['reds'],
				openerCountdownTeamIds: [],
				standingsDivisions: [],
			},
			'2026-07-24',
		);

		expect(getDivisionStandings).toHaveBeenCalledWith('2026-07-24');
		expect(gameService.getLastGameForTeams).toHaveBeenCalledWith(['reds'], '2026-07-24');
		expect(gameService.getNextGameForTeams).toHaveBeenCalledWith(['reds'], '2026-07-24');
	});
});
