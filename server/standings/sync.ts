import { randomUUID } from 'crypto';

import { dbConnect } from '@/lib/mongoose';
import { TeamStandingModel } from '@/models/team-standing.model';
import { Sport } from '@/types';

import { calculateProjectedWins, calculatePythagoreanWins, fetchMlbStandings } from '../mlb-api';
import { teamService } from '../teams/team.service';

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

	const teams = await teamService.findWithExternalIds(Sport.MLB);
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
				team: team.id,
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
					sportRank: standing.sportRank,
					wildCardRank: standing.wildCardRank,

					// Games back
					divisionGamesBack: standing.divisionGamesBack,
					gamesBack: standing.gamesBack,
					leagueGamesBack: standing.leagueGamesBack,
					sportGamesBack: standing.sportGamesBack,
					wildCardGamesBack: standing.wildCardGamesBack,

					// Run production
					runDifferential: standing.runDifferential,
					runsAllowed: standing.runsAllowed,
					runsScored: standing.runsScored,

					// Streak
					streak: standing.streak,

					// Playoff status
					clinched: standing.clinched,
					clinchIndicator: standing.clinchIndicator,
					divisionChamp: standing.divisionChamp,
					divisionLeader: standing.divisionLeader,
					eliminated: standing.eliminated,
					hasWildcard: standing.hasWildcard,
					wildCardLeader: standing.wildCardLeader,

					// Splits
					splits: standing.splits,

					// Expected record
					expectedRecord: standing.expectedRecord,

					// League record
					leagueRecord: standing.leagueRecord,

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
