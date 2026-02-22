import { resolveRefId } from '@/lib/ref-utils';
import { GameModel } from '@/models/game.model';
import { Game, GameState, GameType, Team, UpcomingGame } from '@/types';

import { BaseService } from '../base.service';

const TEAM_POPULATE = ['homeTeam.team', 'awayTeam.team'];

class GameService extends BaseService<Game> {
	constructor() {
		super(GameModel);
	}

	async getUpcomingGames(teamId: string, fromDate?: string, limit = 10): Promise<UpcomingGame[]> {
		const startDate = fromDate ? new Date(fromDate) : new Date();
		startDate.setHours(0, 0, 0, 0);

		const games = await this.find(
			{
				$or: [
					{ 'homeTeam.team': teamId },
					{ 'awayTeam.team': teamId },
				],
				gameDate: { $gte: startDate },
			},
			// eslint-disable-next-line perfectionist/sort-objects
			{ sort: { gameDate: 1 }, limit, populate: TEAM_POPULATE },
		);

		return games.map((game) => {
			const homeTeam = typeof game.homeTeam.team === 'object' ? game.homeTeam.team as Team : null;
			const awayTeam = typeof game.awayTeam.team === 'object' ? game.awayTeam.team as Team : null;
			const isHome = resolveRefId(game.homeTeam.team) === teamId;
			const opponentData = isHome ? awayTeam : homeTeam;

			return {
				awayTeam: {
					abbreviation: awayTeam?.abbreviation ?? 'TBD',
					name: awayTeam?.name ?? 'TBD',
					score: game.awayTeam.score,
				},
				gameDate: game.gameDate.toISOString(),
				gameType: game.gameType as GameType,
				homeTeam: {
					abbreviation: homeTeam?.abbreviation ?? 'TBD',
					name: homeTeam?.name ?? 'TBD',
					score: game.homeTeam.score,
				},
				id: game.id,
				isHome,
				mlbGameId: game.mlbGameId,
				opponent: {
					abbreviation: opponentData?.abbreviation ?? 'TBD',
					name: opponentData?.name ?? 'TBD',
				},
				status: game.status.abstractGameState as GameState,
				venue: game.venue.name,
			};
		});
	}

	async getRecentGames(teamId: string, limit = 10): Promise<Game[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return this.find(
			{
				$or: [
					{ 'homeTeam.team': teamId },
					{ 'awayTeam.team': teamId },
				],
				gameDate: { $lt: today },
			},
			// eslint-disable-next-line perfectionist/sort-objects
			{ sort: { gameDate: -1 }, limit },
		);
	}

	async getTeamSeasonSchedule(teamId: string, season: string): Promise<Game[]> {
		return this.find(
			{
				$or: [
					{ 'homeTeam.team': teamId },
					{ 'awayTeam.team': teamId },
				],
				season,
			},
			{ sort: { gameDate: 1 } },
		);
	}

	async getLastGameForTeams(teamIds: string[], asOfDate?: string): Promise<Game[]> {
		if (teamIds.length === 0) {
			return [];
		}

		const now = asOfDate ? new Date(asOfDate + 'T23:59:59Z') : new Date();
		const seenGameIds = new Set<number>();
		const results: Game[] = [];

		for (const teamId of teamIds) {
			const game = await this.findOne(
				{
					$or: [
						{ 'homeTeam.team': teamId },
						{ 'awayTeam.team': teamId },
					],
					gameDate: { $lt: now },
					'status.abstractGameState': GameState.Final,
				},
				// eslint-disable-next-line perfectionist/sort-objects
				{ sort: { gameDate: -1 }, populate: TEAM_POPULATE },
			);

			if (!game || seenGameIds.has(game.mlbGameId)) {
				continue;
			}

			seenGameIds.add(game.mlbGameId);
			results.push(game);
		}

		return results;
	}

	async getNextGameForTeams(teamIds: string[], asOfDate?: string): Promise<Game[]> {
		if (teamIds.length === 0) {
			return [];
		}

		const now = asOfDate ? new Date(asOfDate + 'T00:00:00Z') : new Date();

		if (asOfDate) {
			now.setUTCDate(now.getUTCDate() + 1);
		}

		const seenGameIds = new Set<number>();
		const results: Game[] = [];

		for (const teamId of teamIds) {
			const game = await this.findOne(
				{
					$or: [
						{ 'homeTeam.team': teamId },
						{ 'awayTeam.team': teamId },
					],
					gameDate: { $gte: now },
				},
				{ populate: TEAM_POPULATE, sort: { gameDate: 1 } },
			);

			if (!game || seenGameIds.has(game.mlbGameId)) {
				continue;
			}

			seenGameIds.add(game.mlbGameId);
			results.push(game);
		}

		return results;
	}

	async findByIdPopulated(id: string): Promise<Game | null> {
		return this.findById(id, { populate: TEAM_POPULATE });
	}

	async findRegularSeasonForSOS(season: string): Promise<Game[]> {
		return this.find(
			{
				gameType: GameType.RegularSeason,
				publicFacing: true,
				season,
				tiebreaker: { $ne: true },
			},
			{ select: 'homeTeam.teamMlbId awayTeam.teamMlbId homeTeam.leagueRecord awayTeam.leagueRecord officialDate status.statusCode' },
		);
	}

	async getOpenerForTeams(teamIds: string[]): Promise<Game[]> {
		if (teamIds.length === 0) {
			return [];
		}

		const now = new Date();
		const seenGameIds = new Set<number>();
		const results: Game[] = [];

		for (const teamId of teamIds) {
			const game = await this.findOne(
				{
					$or: [
						{ 'homeTeam.team': teamId },
						{ 'awayTeam.team': teamId },
					],
					gameDate: { $gte: now },
					gameType: GameType.RegularSeason,
				},
				{ populate: TEAM_POPULATE, sort: { gameDate: 1 } },
			);

			if (!game || seenGameIds.has(game.mlbGameId)) {
				continue;
			}

			seenGameIds.add(game.mlbGameId);
			results.push(game);
		}

		return results;
	}
}

export const gameService = new GameService();
