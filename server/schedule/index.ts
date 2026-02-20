import { randomUUID } from 'crypto';

import { dbConnect } from '@/lib/mongoose';
import { GameModel } from '@/models/game.model';
import { TeamModel } from '@/models/team.model';
import { GameState, GameType, Sport, UpcomingGame } from '@/types';

import { fetchMlbSchedule, ScheduleGameData } from '../mlb-api';

/**
 * Sync schedule for a single team from MLB API
 * @param teamMlbId - MLB external team ID
 * @param season - Season year (e.g., '2026')
 */
export async function syncTeamSchedule(
	teamMlbId: number,
	season: string,
): Promise<{ created: number; errors: string[]; updated: number }> {
	await dbConnect();

	const games = await fetchMlbSchedule(teamMlbId, season);

	return syncGamesToDatabase(games, season);
}

/**
 * Sync schedule for all MLB teams for a season
 * @param season - Season year (e.g., '2026')
 */
export async function syncAllSchedules(
	season: string,
): Promise<{ created: number; errors: string[]; updated: number }> {
	await dbConnect();

	// Get all MLB teams with external IDs
	const teams = await TeamModel.find({
		externalId: { $exists: true },
		sport: Sport.MLB,
	});

	const allGames: ScheduleGameData[] = [];
	const seenMlbGameIds = new Set<number>();
	const errors: string[] = [];

	console.log(`[Schedule Sync] Syncing schedules for ${teams.length} teams, season ${season}`);

	for (const team of teams) {
		if (!team.externalId) {
			continue;
		}

		try {
			const games = await fetchMlbSchedule(team.externalId, season);

			for (const game of games) {
				if (!seenMlbGameIds.has(game.mlbGameId)) {
					seenMlbGameIds.add(game.mlbGameId);
					allGames.push(game);
				}
			}

			// Small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (error) {
			const msg = `Error fetching schedule for team ${team.name} (${team.externalId}): ${error}`;
			console.error(`[Schedule Sync] ${msg}`);
			errors.push(msg);
		}
	}

	console.log(`[Schedule Sync] Fetched ${allGames.length} unique games`);
	console.log(`[Schedule Sync] Starting database sync...`);

	const result = await syncGamesToDatabase(allGames, season);

	return {
		created: result.created,
		errors: [...errors, ...result.errors],
		updated: result.updated,
	};
}

/**
 * Sync games to database with upsert logic
 */
async function syncGamesToDatabase(
	games: ScheduleGameData[],
	season: string,
): Promise<{ created: number; errors: string[]; updated: number }> {
	await dbConnect();

	// Get all MLB teams with their external IDs for mapping
	const teams = await TeamModel.find({
		externalId: { $exists: true },
		sport: Sport.MLB,
	});
	const teamsByExternalId = new Map(teams.map((t) => [t.externalId, t]));

	let created = 0;
	let updated = 0;
	const errors: string[] = [];
	let processed = 0;

	for (const game of games) {
		try {
			const homeTeam = teamsByExternalId.get(game.homeTeamMlbId);
			const awayTeam = teamsByExternalId.get(game.awayTeamMlbId);

			// Build the game document
			const gameDoc = {
				awayTeam: {
					errors: game.linescore?.teams.away.errors,
					hits: game.linescore?.teams.away.hits,
					isWinner: game.awayIsWinner,
					leagueRecord: game.awayLeagueRecord,
					leftOnBase: game.linescore?.teams.away.leftOnBase,
					score: game.awayScore,
					seriesNumber: game.awaySeriesNumber,
					splitSquad: game.awaySplitSquad,
					team: awayTeam?._id?.toString(),
					teamMlbId: game.awayTeamMlbId,
				},
				calendarEventId: game.calendarEventId,
				dayNight: game.dayNight,
				description: game.description,
				doubleHeader: game.doubleHeader,
				gameDate: game.gameDate,
				gamedayType: game.gamedayType,
				gameNumber: game.gameNumber,
				gamesInSeries: game.gamesInSeries,
				gameType: game.gameType,
				homeTeam: {
					errors: game.linescore?.teams.home.errors,
					hits: game.linescore?.teams.home.hits,
					isWinner: game.homeIsWinner,
					leagueRecord: game.homeLeagueRecord,
					leftOnBase: game.linescore?.teams.home.leftOnBase,
					score: game.homeScore,
					seriesNumber: game.homeSeriesNumber,
					splitSquad: game.homeSplitSquad,
					team: homeTeam?._id?.toString(),
					teamMlbId: game.homeTeamMlbId,
				},
				ifNecessary: game.ifNecessary,
				ifNecessaryDescription: game.ifNecessaryDescription,
				inningBreakLength: game.inningBreakLength,
				isTie: game.isTie,
				linescore: game.linescore,
				mlbGameId: game.mlbGameId,
				officialDate: game.officialDate,
				publicFacing: game.publicFacing,
				reverseHomeAwayStatus: game.reverseHomeAwayStatus,
				scheduledInnings: game.scheduledInnings,
				season: game.season,
				seriesDescription: game.seriesDescription,
				seriesGameNumber: game.seriesGameNumber,
				status: game.status,
				tiebreaker: game.tiebreaker,
				venue: {
					mlbId: game.venueMlbId,
					name: game.venueName,
				},
			};

			// Check if game exists
			const existingGame = await GameModel.findOne({ mlbGameId: game.mlbGameId });

			if (existingGame) {
				// Update existing game
				await GameModel.updateOne(
					{ mlbGameId: game.mlbGameId },
					{ $set: gameDoc },
				);
				updated++;
			} else {
				// Create new game
				await GameModel.create({
					_id: randomUUID(),
					...gameDoc,
				});
				created++;
			}
		} catch (error) {
			const msg = `Error syncing game ${game.mlbGameId}: ${error}`;
			console.error(`[Schedule Sync] ${msg}`);
			errors.push(msg);
		}

		processed++;

		if (processed % 100 === 0) {
			console.log(`[Schedule Sync] Processed ${processed}/${games.length} games...`);
		}
	}

	console.log(`[Schedule Sync] Season ${season}: Created ${created}, Updated ${updated}, Errors ${errors.length}`);

	return { created, errors, updated };
}

/**
 * Get upcoming games for a team with full team data
 * @param teamId - Team ID
 * @param fromDate - Date string (YYYY-MM-DD) to get games from, defaults to today
 * @param limit - Maximum number of games to return
 */
export async function getUpcomingGames(
	teamId: string,
	fromDate?: string,
	limit = 10,
): Promise<UpcomingGame[]> {
	await dbConnect();

	const startDate = fromDate ? new Date(fromDate) : new Date();
	startDate.setHours(0, 0, 0, 0);

	const games = await GameModel.find({
		$or: [
			{ 'homeTeam.team': teamId },
			{ 'awayTeam.team': teamId },
		],
		gameDate: { $gte: startDate },
	})
		.sort({ gameDate: 1 })
		.limit(limit)
		.populate('homeTeam.team')
		.populate('awayTeam.team')
		.lean();

	return games.map((game) => {
		// After populate, team is either the populated object or the original string ID
		const homeTeamData = typeof game.homeTeam.team === 'object' && game.homeTeam.team !== null
			? game.homeTeam.team as unknown as { _id: string; abbreviation: string; name: string }
			: null;
		const awayTeamData = typeof game.awayTeam.team === 'object' && game.awayTeam.team !== null
			? game.awayTeam.team as unknown as { _id: string; abbreviation: string; name: string }
			: null;
		const isHome = homeTeamData?._id === teamId || game.homeTeam.team === teamId;
		const opponentData = isHome ? awayTeamData : homeTeamData;

		return {
			awayTeam: {
				abbreviation: awayTeamData?.abbreviation ?? 'TBD',
				name: awayTeamData?.name ?? 'TBD',
				score: game.awayTeam.score,
			},
			gameDate: game.gameDate.toISOString(),
			gameType: game.gameType as GameType,
			homeTeam: {
				abbreviation: homeTeamData?.abbreviation ?? 'TBD',
				name: homeTeamData?.name ?? 'TBD',
				score: game.homeTeam.score,
			},
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

/**
 * Get recent games for a team
 */
export async function getRecentGames(
	teamId: string,
	limit = 10,
): Promise<unknown[]> {
	await dbConnect();

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const games = await GameModel.find({
		$or: [
			{ 'homeTeam.team': teamId },
			{ 'awayTeam.team': teamId },
		],
		gameDate: { $lt: today },
	})
		.sort({ gameDate: -1 })
		.limit(limit)
		.lean();

	return games;
}

/**
 * Get all games for a team in a season
 */
export async function getTeamSeasonSchedule(
	teamId: string,
	season: string,
): Promise<unknown[]> {
	await dbConnect();

	const games = await GameModel.find({
		$or: [
			{ 'homeTeam.team': teamId },
			{ 'awayTeam.team': teamId },
		],
		season,
	})
		.sort({ gameDate: 1 })
		.lean();

	return games;
}

/**
 * Populated team shape after .populate()
 */
interface PopulatedTeam {
	_id: string;
	abbreviation: string;
	colors?: { primary: string; secondary: string };
	name: string;
}

/**
 * Game with populated team references for slide building
 */
export interface PopulatedGame {
	awayTeam: {
		errors?: number;
		hits?: number;
		isWinner?: boolean;
		score?: number;
		team: null | PopulatedTeam;
		teamMlbId: number;
	};
	gameDate: Date;
	homeTeam: {
		errors?: number;
		hits?: number;
		isWinner?: boolean;
		score?: number;
		team: null | PopulatedTeam;
		teamMlbId: number;
	};
	mlbGameId: number;
	venue: { name: string };
}

/**
 * Helper to extract populated team data from a lean game document
 */
function extractPopulatedTeam(teamField: unknown): null | PopulatedTeam {
	if (typeof teamField === 'object' && teamField !== null && '_id' in teamField) {
		return teamField as PopulatedTeam;
	}

	return null;
}

/**
 * Get the last completed game for each team ID.
 * Deduplicates: if two selected teams played each other, only one game is returned.
 * @param teamIds - Array of team UUIDs
 * @param asOfDate - Optional date string (YYYY-MM-DD) to use as "now", defaults to current date
 * @returns Array of populated games (deduplicated by mlbGameId)
 */
export async function getLastGameForTeams(teamIds: string[], asOfDate?: string): Promise<PopulatedGame[]> {
	if (teamIds.length === 0) {
		return [];
	}

	await dbConnect();

	const now = asOfDate ? new Date(asOfDate + 'T23:59:59Z') : new Date();
	const seenGameIds = new Set<number>();
	const results: PopulatedGame[] = [];

	for (const teamId of teamIds) {
		const game = await GameModel.findOne({
			$or: [
				{ 'homeTeam.team': teamId },
				{ 'awayTeam.team': teamId },
			],
			gameDate: { $lt: now },
			'status.abstractGameState': GameState.Final,
		})
			.sort({ gameDate: -1 })
			.populate('homeTeam.team')
			.populate('awayTeam.team')
			.lean();

		if (!game || seenGameIds.has(game.mlbGameId)) {
			continue;
		}

		seenGameIds.add(game.mlbGameId);

		results.push({
			awayTeam: {
				errors: game.awayTeam.errors,
				hits: game.awayTeam.hits,
				isWinner: game.awayTeam.isWinner,
				score: game.awayTeam.score,
				team: extractPopulatedTeam(game.awayTeam.team),
				teamMlbId: game.awayTeam.teamMlbId,
			},
			gameDate: game.gameDate,
			homeTeam: {
				errors: game.homeTeam.errors,
				hits: game.homeTeam.hits,
				isWinner: game.homeTeam.isWinner,
				score: game.homeTeam.score,
				team: extractPopulatedTeam(game.homeTeam.team),
				teamMlbId: game.homeTeam.teamMlbId,
			},
			mlbGameId: game.mlbGameId,
			venue: { name: game.venue.name },
		});
	}

	return results;
}

/**
 * Get the next upcoming game for each team ID.
 * Deduplicates: if two selected teams play each other next, only one game is returned.
 * @param teamIds - Array of team UUIDs
 * @param asOfDate - Optional date string (YYYY-MM-DD) to use as "now", defaults to current date
 * @returns Array of populated games (deduplicated by mlbGameId)
 */
export async function getNextGameForTeams(teamIds: string[], asOfDate?: string): Promise<PopulatedGame[]> {
	if (teamIds.length === 0) {
		return [];
	}

	await dbConnect();

	const now = asOfDate ? new Date(asOfDate + 'T00:00:00Z') : new Date();
	const seenGameIds = new Set<number>();
	const results: PopulatedGame[] = [];

	for (const teamId of teamIds) {
		const game = await GameModel.findOne({
			$or: [
				{ 'homeTeam.team': teamId },
				{ 'awayTeam.team': teamId },
			],
			gameDate: { $gte: now },
			'status.abstractGameState': GameState.Preview,
		})
			.sort({ gameDate: 1 })
			.populate('homeTeam.team')
			.populate('awayTeam.team')
			.lean();

		if (!game || seenGameIds.has(game.mlbGameId)) {
			continue;
		}

		seenGameIds.add(game.mlbGameId);

		results.push({
			awayTeam: {
				errors: game.awayTeam.errors,
				hits: game.awayTeam.hits,
				isWinner: game.awayTeam.isWinner,
				score: game.awayTeam.score,
				team: extractPopulatedTeam(game.awayTeam.team),
				teamMlbId: game.awayTeam.teamMlbId,
			},
			gameDate: game.gameDate,
			homeTeam: {
				errors: game.homeTeam.errors,
				hits: game.homeTeam.hits,
				isWinner: game.homeTeam.isWinner,
				score: game.homeTeam.score,
				team: extractPopulatedTeam(game.homeTeam.team),
				teamMlbId: game.homeTeam.teamMlbId,
			},
			mlbGameId: game.mlbGameId,
			venue: { name: game.venue.name },
		});
	}

	return results;
}
