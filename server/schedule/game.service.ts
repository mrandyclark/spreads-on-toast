import { resolveRef, resolveRefId } from '@/lib/ref-utils';
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
		startDate.setUTCHours(0, 0, 0, 0);

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
			const homeTeam = resolveRef<Team>(game.homeTeam.team);
			const awayTeam = resolveRef<Team>(game.awayTeam.team);
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
		today.setUTCHours(0, 0, 0, 0);

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

		const games = await this.find(
			{
				$or: teamIds.flatMap((id) => [
					{ 'homeTeam.team': id },
					{ 'awayTeam.team': id },
				]),
				gameDate: { $lt: now },
				'status.abstractGameState': GameState.Final,
			},
			// eslint-disable-next-line perfectionist/sort-objects
			{ sort: { gameDate: -1 }, populate: TEAM_POPULATE },
		);

		const results: Game[] = [];
		const coveredTeamIds = new Set<string>();
		const seenGameIds = new Set<number>();

		for (const game of games) {
			const homeId = resolveRefId(game.homeTeam.team);
			const awayId = resolveRefId(game.awayTeam.team);
			const relevantIds = teamIds.filter((id) => (id === homeId || id === awayId) && !coveredTeamIds.has(id));

			if (relevantIds.length === 0) {
				continue;
			}

			for (const id of relevantIds) {
				coveredTeamIds.add(id);
			}

			if (!seenGameIds.has(game.mlbGameId)) {
				seenGameIds.add(game.mlbGameId);
				results.push(game);
			}

			if (coveredTeamIds.size >= teamIds.length) {
				break;
			}
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

		const games = await this.find(
			{
				$or: teamIds.flatMap((id) => [
					{ 'homeTeam.team': id },
					{ 'awayTeam.team': id },
				]),
				gameDate: { $gte: now },
			},
			{ populate: TEAM_POPULATE, sort: { gameDate: 1 } },
		);

		const results: Game[] = [];
		const coveredTeamIds = new Set<string>();
		const seenGameIds = new Set<number>();

		for (const game of games) {
			const homeId = resolveRefId(game.homeTeam.team);
			const awayId = resolveRefId(game.awayTeam.team);
			const relevantIds = teamIds.filter((id) => (id === homeId || id === awayId) && !coveredTeamIds.has(id));

			if (relevantIds.length === 0) {
				continue;
			}

			for (const id of relevantIds) {
				coveredTeamIds.add(id);
			}

			if (!seenGameIds.has(game.mlbGameId)) {
				seenGameIds.add(game.mlbGameId);
				results.push(game);
			}

			if (coveredTeamIds.size >= teamIds.length) {
				break;
			}
		}

		return results;
	}

	async findByDatePopulated(date: string): Promise<Game[]> {
		return this.find(
			{
				gameType: GameType.RegularSeason,
				officialDate: date,
				publicFacing: true,
			},
			{ populate: TEAM_POPULATE, sort: { gameDate: 1 } },
		);
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

	async getOpenerForTeams(teamIds: string[], season?: string): Promise<Game[]> {
		if (teamIds.length === 0) {
			return [];
		}

		const targetSeason = season ?? new Date().getFullYear().toString();

		const games = await this.find(
			{
				$or: teamIds.flatMap((id) => [
					{ 'homeTeam.team': id },
					{ 'awayTeam.team': id },
				]),
				gameType: GameType.RegularSeason,
				season: targetSeason,
			},
			{ populate: TEAM_POPULATE, sort: { gameDate: 1 } },
		);

		const results: Game[] = [];
		const coveredTeamIds = new Set<string>();
		const seenGameIds = new Set<number>();

		for (const game of games) {
			const homeId = resolveRefId(game.homeTeam.team);
			const awayId = resolveRefId(game.awayTeam.team);
			const relevantIds = teamIds.filter((id) => (id === homeId || id === awayId) && !coveredTeamIds.has(id));

			if (relevantIds.length === 0) {
				continue;
			}

			for (const id of relevantIds) {
				coveredTeamIds.add(id);
			}

			if (!seenGameIds.has(game.mlbGameId)) {
				seenGameIds.add(game.mlbGameId);
				results.push(game);
			}

			if (coveredTeamIds.size >= teamIds.length) {
				break;
			}
		}

		return results;
	}
}

export const gameService = new GameService();
