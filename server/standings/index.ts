import { randomUUID } from 'crypto';

import { dbConnect } from '@/lib/mongoose';
import { TeamStandingModel } from '@/models/team-standing.model';
import { TeamModel } from '@/models/team.model';
import { Sport, TeamStanding } from '@/types';

import { calculateProjectedWins, calculatePythagoreanWins, fetchMlbStandings } from '../mlb-api';

/**
 * Fetch standings from MLB API and save to database
 * @param season - The season year (e.g., '2026')
 * @param date - The date to save standings for (defaults to today)
 * @param fetchDate - Optional date to fetch from API (for backfilling)
 */
export async function syncMlbStandings(
	season: string,
	date: Date = new Date(),
	fetchDate?: string,
): Promise<{ created: number; errors: string[]; updated: number }> {
	await dbConnect();

	// Normalize date to midnight UTC for consistent storage
	const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

	// Fetch standings from MLB API
	const standings = await fetchMlbStandings(season, fetchDate);

	// Get all MLB teams with their external IDs
	const teams = await TeamModel.find({ externalId: { $exists: true }, sport: Sport.MLB });
	const teamsByExternalId = new Map(teams.map((t) => [t.externalId, t]));

	let created = 0;
	let updated = 0;
	const errors: string[] = [];

	for (const standing of standings) {
		const team = teamsByExternalId.get(standing.externalId);

		if (!team) {
			errors.push(`No team found for MLB ID ${standing.externalId} (${standing.name})`);
			continue;
		}

		const projectedWins = calculateProjectedWins(standing.wins, standing.gamesPlayed);
		const pythagoreanWins = calculatePythagoreanWins(
			standing.runsScored,
			standing.runsAllowed,
			standing.gamesPlayed,
		);

		// Upsert the standing
		const result = await TeamStandingModel.findOneAndUpdate(
			{
				date: normalizedDate,
				season,
				team: team._id,
			},
			{
				$set: {
					// Core record
					gamesPlayed: standing.gamesPlayed,
					losses: standing.losses,
					wins: standing.wins,

					// Calculated projections
					projectedWins,
					pythagoreanWins: pythagoreanWins || undefined,

					// Rankings
					divisionRank: standing.divisionRank,
					leagueRank: standing.leagueRank,
					wildCardRank: standing.wildCardRank,

					// Games back
					gamesBack: standing.gamesBack,
					wildCardGamesBack: standing.wildCardGamesBack,

					// Run production
					runDifferential: standing.runDifferential,
					runsAllowed: standing.runsAllowed,
					runsScored: standing.runsScored,

					// Streak
					streak: standing.streak,

					// Playoff status
					clinched: standing.clinched,
					eliminated: standing.eliminated,

					sport: Sport.MLB,
				},
				$setOnInsert: {
					_id: randomUUID(),
				},
			},
			{ new: true, upsert: true },
		);

		if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
			created++;
		} else {
			updated++;
		}
	}

	return { created, errors, updated };
}

/**
 * Get standings for a team over a season (for trend charts)
 */
export async function getTeamStandingsHistory(
	teamId: string,
	season: string,
): Promise<TeamStanding[]> {
	await dbConnect();

	const standings = await TeamStandingModel.find({ season, team: teamId }).sort({ date: 1 });

	return standings.map((s) => s.toJSON() as TeamStanding);
}

/**
 * Get latest standings for all teams in a season
 */
export async function getLatestStandings(season: string): Promise<TeamStanding[]> {
	await dbConnect();

	// Get the most recent date with standings
	const latestStanding = await TeamStandingModel.findOne({ season }).sort({ date: -1 });

	if (!latestStanding) {
		return [];
	}

	const standings = await TeamStandingModel.find({
		date: latestStanding.date,
		season,
	}).populate('team');

	return standings.map((s) => s.toJSON() as TeamStanding);
}

/**
 * Get a team's standing for a specific date
 */
export async function getTeamStandingByDate(
	teamId: string,
	season: string,
	date: Date,
): Promise<null | TeamStanding> {
	await dbConnect();

	const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

	const standing = await TeamStandingModel.findOne({
		date: normalizedDate,
		season,
		team: teamId,
	});

	return standing ? (standing.toJSON() as TeamStanding) : null;
}

/**
 * Get final standings for a season (last day of data)
 * Returns a map of teamId -> final wins
 */
export async function getFinalStandings(season: string): Promise<Map<string, number>> {
	await dbConnect();

	// Get the most recent date with standings for this season
	const latestStanding = await TeamStandingModel.findOne({ season }).sort({ date: -1 });

	if (!latestStanding) {
		return new Map();
	}

	const standings = await TeamStandingModel.find({
		date: latestStanding.date,
		season,
	});

	const finalWins = new Map<string, number>();

	for (const standing of standings) {
		finalWins.set(standing.team.toString(), standing.wins);
	}

	return finalWins;
}

/**
 * Get the date range we have standings data for
 * Returns the earliest and latest dates with data for a season
 */
export async function getStandingsDateRange(
	season: string,
): Promise<{ minDate: Date | null; maxDate: Date | null }> {
	await dbConnect();

	const [earliest, latest] = await Promise.all([
		TeamStandingModel.findOne({ season }).sort({ date: 1 }),
		TeamStandingModel.findOne({ season }).sort({ date: -1 }),
	]);

	return {
		maxDate: latest?.date ?? null,
		minDate: earliest?.date ?? null,
	};
}

export interface StandingsOnDate {
	gamesPlayed: number;
	losses: number;
	projectedWins: number;
	wins: number;
}

/**
 * Get standings for a specific date
 * Returns a map of teamId -> standings data (including projected wins)
 */
export async function getStandingsForDate(
	season: string,
	date: Date,
): Promise<Map<string, StandingsOnDate>> {
	await dbConnect();

	const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

	const standings = await TeamStandingModel.find({
		date: normalizedDate,
		season,
	});

	const result = new Map<string, StandingsOnDate>();

	for (const standing of standings) {
		result.set(standing.team.toString(), {
			gamesPlayed: standing.gamesPlayed,
			losses: standing.losses,
			projectedWins: standing.projectedWins,
			wins: standing.wins,
		});
	}

	return result;
}

/**
 * Result of an over/under pick
 */
export type PickResult = 'loss' | 'pending' | 'push' | 'win';

/**
 * Calculate the result of an over/under pick
 */
export function calculatePickResult(
	pick: 'over' | 'under',
	line: number,
	finalWins: number,
): PickResult {
	if (finalWins > line) {
		return pick === 'over' ? 'win' : 'loss';
	} else if (finalWins < line) {
		return pick === 'under' ? 'win' : 'loss';
	} else {
		return 'push'; // Exact match = push
	}
}
