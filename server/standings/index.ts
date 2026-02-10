import { randomUUID } from 'crypto';

import { dbConnect } from '@/lib/mongoose';
import { TeamStandingModel } from '@/models/team-standing.model';
import { TeamModel } from '@/models/team.model';
import {
	PickResult,
	SeasonWithDates,
	SituationalRecord,
	Sport,
	StandingsBoardData,
	TeamDetailData,
	TeamHistoryDataPoint,
	TeamStanding,
	WinProfileData,
} from '@/types';

import { calculateLeagueAverages, calculateTeamChips } from '../chips';
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
 * Calculate win profile data from team standing splits
 */
function calculateWinProfile(standing: Record<string, unknown> | TeamStanding): undefined | WinProfileData {
	const splits = (standing as TeamStanding).splits;
	const runsScored = (standing as TeamStanding).runsScored;
	const runsAllowed = (standing as TeamStanding).runsAllowed;

	// Calculate offense/pitching contribution
	let offenseContribution = 0.5;
	let pitchingContribution = 0.5;

	if (runsScored && runsAllowed && runsScored + runsAllowed > 0) {
		offenseContribution = runsScored / (runsScored + runsAllowed);
		pitchingContribution = 1 - offenseContribution;
	}

	// Build situational records from splits
	const situational: SituationalRecord[] = [];

	if (splits) {
		// One-run games
		if (splits.oneRun) {
			situational.push({
				label: 'One-Run Games',
				losses: splits.oneRun.losses,
				pct: parseFloat(splits.oneRun.pct) || 0,
				wins: splits.oneRun.wins,
			});
		}

		// Extra-inning games
		if (splits.extraInning) {
			situational.push({
				label: 'Extra Innings',
				losses: splits.extraInning.losses,
				pct: parseFloat(splits.extraInning.pct) || 0,
				wins: splits.extraInning.wins,
			});
		}

		// vs Winning teams
		if (splits.winners) {
			situational.push({
				label: 'vs Winning Teams',
				losses: splits.winners.losses,
				pct: parseFloat(splits.winners.pct) || 0,
				wins: splits.winners.wins,
			});
		}

		// Home record
		if (splits.home) {
			situational.push({
				label: 'Home',
				losses: splits.home.losses,
				pct: parseFloat(splits.home.pct) || 0,
				wins: splits.home.wins,
			});
		}

		// Away record
		if (splits.away) {
			situational.push({
				label: 'Away',
				losses: splits.away.losses,
				pct: parseFloat(splits.away.pct) || 0,
				wins: splits.away.wins,
			});
		}

		// Last 10 games
		if (splits.lastTen) {
			situational.push({
				label: 'Last 10 Games',
				losses: splits.lastTen.losses,
				pct: parseFloat(splits.lastTen.pct) || 0,
				wins: splits.lastTen.wins,
			});
		}
	}

	// Only return if we have some data
	if (situational.length === 0 && offenseContribution === 0.5) {
		return undefined;
	}

	return {
		offenseContribution,
		pitchingContribution,
		situational,
	};
}

/**
 * Get comprehensive team detail data for the team page
 */
export async function getTeamDetailData(
	teamId: string,
	season: string,
	selectedDate?: string,
): Promise<{ current: null | TeamDetailData; history: TeamHistoryDataPoint[] }> {
	await dbConnect();

	// Get team info - use lean() to get plain object
	const team = await TeamModel.findById(teamId).lean();

	if (!team) {
		return { current: null, history: [] };
	}

	// Get team line for this season
	const { TeamLineModel } = await import('@/models/team-line.model');
	const teamLine = await TeamLineModel.findOne({ season, team: teamId }).lean();
	const line = teamLine?.line ?? 81;

	// Get all standings history for the season - use lean() to get plain objects
	const standings = await TeamStandingModel.find({ season, team: teamId }).sort({ date: 1 }).lean();

	if (standings.length === 0) {
		return { current: null, history: [] };
	}

	// Find the standing for the selected date, or use the latest
	let targetStanding = standings[standings.length - 1];

	if (selectedDate) {
		const targetDateStr = selectedDate;
		const found = standings.find((s) => {
			const standingDate = new Date(s.date).toISOString().split('T')[0];
			return standingDate === targetDateStr;
		});

		if (found) {
			targetStanding = found;
		}
	}

	// Get all team standings for the target date to calculate league averages
	const targetDate = new Date(targetStanding.date);
	const allStandingsForDate = await TeamStandingModel.find({
		date: targetDate,
		season,
	}).lean();

	// Calculate league averages and team chips
	const leagueAverages = calculateLeagueAverages(allStandingsForDate as TeamStanding[]);
	const chips = calculateTeamChips(targetStanding as TeamStanding, leagueAverages);

	// Calculate win profile data
	const winProfile = calculateWinProfile(targetStanding);

	const current: TeamDetailData = {
		abbreviation: team.abbreviation,
		chips,
		city: team.city,
		conference: team.conference,
		division: team.division,
		divisionRank: targetStanding.divisionRank,
		gamesBack: targetStanding.gamesBack,
		gamesPlayed: targetStanding.gamesPlayed,
		id: team._id.toString(),
		leagueRank: targetStanding.leagueRank,
		line,
		losses: targetStanding.losses,
		name: team.name,
		projectedWins: targetStanding.projectedWins,
		pythagoreanWins: targetStanding.pythagoreanWins,
		runDifferential: targetStanding.runDifferential,
		runsAllowed: targetStanding.runsAllowed,
		runsScored: targetStanding.runsScored,
		season,
		streak: targetStanding.streak
			? { code: targetStanding.streak.code, count: targetStanding.streak.count, type: targetStanding.streak.type }
			: undefined,
		wildCardGamesBack: targetStanding.wildCardGamesBack,
		wildCardRank: targetStanding.wildCardRank,
		winProfile,
		wins: targetStanding.wins,
	};

	// Build history for charts
	const history: TeamHistoryDataPoint[] = standings.map((s) => ({
		date: new Date(s.date).toISOString().split('T')[0],
		gamesPlayed: s.gamesPlayed,
		losses: s.losses,
		projectedWins: s.projectedWins,
		pythagoreanWins: s.pythagoreanWins,
		runDifferential: s.runDifferential,
		wins: s.wins,
	}));

	return { current, history };
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
 * Get standings for a specific season and date, with team info and lines
 * This is the main function for the standings board UI
 */
export async function getStandingsBoardData(
	season: string,
	date: string,
): Promise<StandingsBoardData[]> {
	await dbConnect();

	// Parse the date string (YYYY-MM-DD)
	const [year, month, day] = date.split('-').map(Number);
	const normalizedDate = new Date(Date.UTC(year, month - 1, day));

	// Get standings for this date
	const standings = await TeamStandingModel.find({
		date: normalizedDate,
		season,
	}).populate('team');

	// Get team lines for this season
	const { TeamLineModel } = await import('@/models/team-line.model');
	const teamLines = await TeamLineModel.find({ season, sport: Sport.MLB });
	const linesByTeamId = new Map(teamLines.map((tl) => [tl.team.toString(), tl.line]));

	const result: StandingsBoardData[] = [];

	for (const standing of standings) {
		const team = standing.team as unknown as {
			_id: string;
			abbreviation: string;
			conference: string;
			division: string;
			name: string;
		};

		if (!team || typeof team === 'string') {
			continue;
		}

		const line = linesByTeamId.get(team._id.toString()) ?? 81;

		result.push({
			abbreviation: team.abbreviation,
			conference: team.conference,
			division: team.division,
			line,
			losses: standing.losses,
			name: team.name,
			pythagoreanWins: standing.pythagoreanWins ?? standing.projectedWins,
			teamId: team._id.toString(),
			wins: standing.wins,
		});
	}

	return result;
}

/**
 * Get all unique dates that have standings data for a season
 * Returns dates in descending order (most recent first)
 */
export async function getStandingsDates(season: string): Promise<Date[]> {
	await dbConnect();

	const dates = await TeamStandingModel.distinct('date', { season });

	// Sort descending (most recent first)
	return dates.sort((a, b) => b.getTime() - a.getTime());
}

/**
 * Get seasons that have started (startDate <= today) with their available standings dates
 * Returns seasons with standings data, sorted by season year descending
 */
export async function getStartedSeasonsWithDates(): Promise<SeasonWithDates[]> {
	await dbConnect();

	const today = new Date();

	// Import SeasonModel here to avoid circular dependency
	const { SeasonModel } = await import('@/models/season.model');

	// Get seasons that have started - use lean() to get plain objects
	const seasons = await SeasonModel.find({
		sport: Sport.MLB,
		startDate: { $lte: today },
	}).sort({ season: -1 }).lean();

	const result: SeasonWithDates[] = [];

	for (const season of seasons) {
		const dates = await getStandingsDates(season.season);

		// Format dates as YYYY-MM-DD strings
		const dateStrings = dates.map((d) => d.toISOString().split('T')[0]);

		result.push({
			dates: dateStrings,
			id: season._id.toString(),
			latestDate: dateStrings[0] ?? null,
			name: season.name,
			season: season.season,
		});
	}

	return result;
}

/**
 * Division standings response format for external API consumers (e.g., Raspberry Pi sign)
 */
export interface DivisionStandingsTeam {
	abbreviation: string;
	gamesBack: string;
	losses: number;
	name: string;
	rank: number;
	wins: number;
}

export interface DivisionStandingsEntry {
	league: string;
	name: string;
	teams: DivisionStandingsTeam[];
}

export interface DivisionStandingsResponse {
	asOfDate: string;
	divisions: DivisionStandingsEntry[];
	season: string;
}

/**
 * Division display names for the API response
 */
const DIVISION_DISPLAY_NAMES: Record<string, string> = {
	AL_Central: 'AL Central',
	AL_East: 'AL East',
	AL_West: 'AL West',
	NL_Central: 'NL Central',
	NL_East: 'NL East',
	NL_West: 'NL West',
};

/**
 * Conference display names
 */
const CONFERENCE_DISPLAY_NAMES: Record<string, string> = {
	AL: 'American League',
	NL: 'National League',
};

/**
 * Get current MLB standings grouped by division
 * Returns the latest standings data formatted for external consumers
 */
export async function getDivisionStandings(date?: string): Promise<DivisionStandingsResponse | null> {
	await dbConnect();

	let targetDate: Date;
	let season: string;

	if (date) {
		// Parse the provided date (YYYY-MM-DD) and derive season from it
		const [year, month, day] = date.split('-').map(Number);
		targetDate = new Date(Date.UTC(year, month - 1, day));
		season = year.toString();
	} else {
		// Use current year and get the most recent date with standings
		season = new Date().getFullYear().toString();
		const latestStanding = await TeamStandingModel.findOne({ season }).sort({ date: -1 });

		if (!latestStanding) {
			return null;
		}

		targetDate = latestStanding.date;
	}

	// Get all standings for that date with team info
	const standings = await TeamStandingModel.find({
		date: targetDate,
		season,
	}).populate('team');

	if (standings.length === 0) {
		return null;
	}

	// Group by division
	const divisionMap = new Map<string, DivisionStandingsTeam[]>();

	for (const standing of standings) {
		const team = standing.team as unknown as {
			_id: string;
			abbreviation: string;
			conference: string;
			division: string;
			name: string;
		};

		if (!team || typeof team === 'string') {
			continue;
		}

		const divisionKey = team.division;

		if (!divisionMap.has(divisionKey)) {
			divisionMap.set(divisionKey, []);
		}

		divisionMap.get(divisionKey)!.push({
			abbreviation: team.abbreviation,
			gamesBack: standing.divisionGamesBack ?? '-',
			losses: standing.losses,
			name: `${team.name}`,
			rank: standing.divisionRank ?? 0,
			wins: standing.wins,
		});
	}

	// Sort teams within each division by rank
	for (const teams of divisionMap.values()) {
		teams.sort((a, b) => a.rank - b.rank);
	}

	// Build the response with divisions in a consistent order
	const divisionOrder = ['NL_East', 'NL_Central', 'NL_West', 'AL_East', 'AL_Central', 'AL_West'];
	const divisions: DivisionStandingsEntry[] = [];

	for (const divisionKey of divisionOrder) {
		const teams = divisionMap.get(divisionKey);

		if (teams && teams.length > 0) {
			const conference = divisionKey.startsWith('AL') ? 'AL' : 'NL';

			divisions.push({
				league: CONFERENCE_DISPLAY_NAMES[conference] ?? conference,
				name: DIVISION_DISPLAY_NAMES[divisionKey] ?? divisionKey,
				teams,
			});
		}
	}

	return {
		asOfDate: targetDate.toISOString().split('T')[0],
		divisions,
		season,
	};
}

/**
 * Calculate the result of an over/under pick
 */
export function calculatePickResult(
	pick: 'over' | 'under',
	line: number,
	finalWins: number,
): PickResult {
	if (finalWins > line) {
		return pick === 'over' ? PickResult.Win : PickResult.Loss;
	} else if (finalWins < line) {
		return pick === 'under' ? PickResult.Win : PickResult.Loss;
	} else {
		return PickResult.Push;
	}
}
