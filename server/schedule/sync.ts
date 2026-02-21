import { randomUUID } from 'crypto';

import { dbConnect } from '@/lib/mongoose';
import { GameModel } from '@/models/game.model';
import { Sport } from '@/types';

import { fetchMlbSchedule, ScheduleGameData } from '../mlb-api';
import { teamService } from '../teams/team.service';

export async function syncTeamSchedule(
	teamMlbId: number,
	season: string,
): Promise<{ created: number; errors: string[]; updated: number }> {
	await dbConnect();

	const games = await fetchMlbSchedule(teamMlbId, season);

	return syncGamesToDatabase(games, season);
}

export async function syncAllSchedules(
	season: string,
): Promise<{ created: number; errors: string[]; updated: number }> {
	await dbConnect();

	const teams = await teamService.findWithExternalIds(Sport.MLB);

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

async function syncGamesToDatabase(
	games: ScheduleGameData[],
	season: string,
): Promise<{ created: number; errors: string[]; updated: number }> {
	await dbConnect();

	const teams = await teamService.findWithExternalIds(Sport.MLB);
	const teamsByExternalId = new Map(teams.map((t) => [t.externalId, t]));

	let created = 0;
	let updated = 0;
	const errors: string[] = [];
	let processed = 0;

	for (const game of games) {
		try {
			const homeTeam = teamsByExternalId.get(game.homeTeamMlbId);
			const awayTeam = teamsByExternalId.get(game.awayTeamMlbId);

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
					team: awayTeam?.id,
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
					team: homeTeam?.id,
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

			const existingGame = await GameModel.findOne({ mlbGameId: game.mlbGameId });

			if (existingGame) {
				await GameModel.updateOne(
					{ mlbGameId: game.mlbGameId },
					{ $set: gameDoc },
				);
				updated++;
			} else {
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
