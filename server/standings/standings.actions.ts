import { populatedToId } from '@/lib/mongo-utils';
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
import { seasonService } from '../seasons/season.service';
import { teamLineService } from '../seasons/team-line.service';
import { teamService } from '../teams/team.service';
import { standingService } from './standing.service';

export { standingService };

// =============================================================================
// TYPES (exported for consumers)
// =============================================================================

export interface StandingsOnDate {
	gamesPlayed: number;
	losses: number;
	projectedWins: number;
	wins: number;
}

export interface DivisionStandingsTeam {
	abbreviation: string;
	colors?: { primary: string; secondary: string };
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

// =============================================================================
// CONSTANTS
// =============================================================================

const DIVISION_DISPLAY_NAMES: Record<string, string> = {
	AL_Central: 'AL Central',
	AL_East: 'AL East',
	AL_West: 'AL West',
	NL_Central: 'NL Central',
	NL_East: 'NL East',
	NL_West: 'NL West',
};

const CONFERENCE_DISPLAY_NAMES: Record<string, string> = {
	AL: 'American League',
	NL: 'National League',
};

// =============================================================================
// HELPERS
// =============================================================================

function calculateWinProfile(standing: Record<string, unknown> | TeamStanding): undefined | WinProfileData {
	const splits = (standing as TeamStanding).splits;
	const runsScored = (standing as TeamStanding).runsScored;
	const runsAllowed = (standing as TeamStanding).runsAllowed;

	let offenseContribution = 0.5;
	let pitchingContribution = 0.5;

	if (runsScored && runsAllowed && runsScored + runsAllowed > 0) {
		offenseContribution = runsScored / (runsScored + runsAllowed);
		pitchingContribution = 1 - offenseContribution;
	}

	const situational: SituationalRecord[] = [];

	if (splits) {
		if (splits.oneRun) {
			situational.push({
				label: 'One-Run Games',
				losses: splits.oneRun.losses,
				pct: parseFloat(splits.oneRun.pct) || 0,
				wins: splits.oneRun.wins,
			});
		}

		if (splits.extraInning) {
			situational.push({
				label: 'Extra Innings',
				losses: splits.extraInning.losses,
				pct: parseFloat(splits.extraInning.pct) || 0,
				wins: splits.extraInning.wins,
			});
		}

		if (splits.winners) {
			situational.push({
				label: 'vs Winning Teams',
				losses: splits.winners.losses,
				pct: parseFloat(splits.winners.pct) || 0,
				wins: splits.winners.wins,
			});
		}

		if (splits.home) {
			situational.push({
				label: 'Home',
				losses: splits.home.losses,
				pct: parseFloat(splits.home.pct) || 0,
				wins: splits.home.wins,
			});
		}

		if (splits.away) {
			situational.push({
				label: 'Away',
				losses: splits.away.losses,
				pct: parseFloat(splits.away.pct) || 0,
				wins: splits.away.wins,
			});
		}

		if (splits.lastTen) {
			situational.push({
				label: 'Last 10 Games',
				losses: splits.lastTen.losses,
				pct: parseFloat(splits.lastTen.pct) || 0,
				wins: splits.lastTen.wins,
			});
		}
	}

	if (situational.length === 0 && offenseContribution === 0.5) {
		return undefined;
	}

	return {
		offenseContribution,
		pitchingContribution,
		situational,
	};
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Get comprehensive team detail data for the team page
 */
export async function getTeamDetailData(
	teamId: string,
	season: string,
	selectedDate?: string,
): Promise<{ current: null | TeamDetailData; history: TeamHistoryDataPoint[] }> {
	const [team, teamLine, standings] = await Promise.all([
		teamService.findById(teamId),
		teamLineService.findByTeamAndSeason(teamId, season),
		standingService.findByTeamAndSeason(teamId, season, {
			select: 'date gamesPlayed wins losses projectedWins pythagoreanWins runDifferential runsScored runsAllowed divisionRank gamesBack leagueRank wildCardRank wildCardGamesBack streak splits divisionGamesBack',
		}),
	]);

	if (!team) {
		return { current: null, history: [] };
	}

	const line = teamLine?.line ?? 81;

	if (standings.length === 0) {
		return { current: null, history: [] };
	}

	// Find the standing for the selected date, or use the latest
	let targetStanding = standings[standings.length - 1];

	if (selectedDate) {
		const found = standings.find((s) => {
			const standingDate = new Date(s.date).toISOString().split('T')[0];
			return standingDate === selectedDate;
		});

		if (found) {
			targetStanding = found;
		}
	}

	// Get all team standings for the target date to calculate league averages
	const allStandingsForDate = await standingService.find(
		{ date: new Date(targetStanding.date), season },
		{ select: 'gamesPlayed runsScored runDifferential wins' },
	);

	const leagueAverages = calculateLeagueAverages(allStandingsForDate as TeamStanding[]);
	const chips = calculateTeamChips(targetStanding as TeamStanding, leagueAverages);
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
		id: team.id,
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
			? {
				code: targetStanding.streak.code,
				count: targetStanding.streak.count,
				type: targetStanding.streak.type,
			}
			: undefined,
		wildCardGamesBack: targetStanding.wildCardGamesBack,
		wildCardRank: targetStanding.wildCardRank,
		winProfile,
		wins: targetStanding.wins,
	};

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
 * Get seasons that have started with their available standings dates
 */
export async function getStartedSeasonsWithDates(): Promise<SeasonWithDates[]> {
	const [seasons, datesMap] = await Promise.all([
		seasonService.findStarted(Sport.MLB),
		standingService.findDatesBySeason(),
	]);

	return seasons.map((season) => {
		const dateStrings = datesMap.get(season.season) ?? [];

		return {
			dates: dateStrings,
			id: season.id,
			latestDate: dateStrings[0] ?? null,
			name: season.name,
			season: season.season,
		};
	});
}

/**
 * Get standings board data for the UI
 */
export async function getStandingsBoardData(
	season: string,
	date: string,
): Promise<StandingsBoardData[]> {
	const [year, month, day] = date.split('-').map(Number);
	const normalizedDate = new Date(Date.UTC(year, month - 1, day));

	const [standings, teamLines] = await Promise.all([
		standingService.findByDatePopulated(normalizedDate, season),
		teamLineService.findBySeason(Sport.MLB, season),
	]);

	const linesByTeamId = new Map(teamLines.map((tl) => [populatedToId(tl.team), tl.line]));
	const result: StandingsBoardData[] = [];

	for (const standing of standings) {
		const { team } = standing;

		if (!team || typeof team === 'string') {
			continue;
		}

		const line = linesByTeamId.get(team.id) ?? 81;

		result.push({
			abbreviation: team.abbreviation,
			conference: team.conference,
			division: team.division,
			line,
			losses: standing.losses,
			name: team.name,
			pythagoreanWins: standing.pythagoreanWins ?? standing.projectedWins,
			teamId: team.id,
			wins: standing.wins,
		});
	}

	return result;
}

/**
 * Get final standings for a season (last day of data)
 */
export async function getFinalStandings(season: string): Promise<Map<string, number>> {
	const standings = await standingService.findAllForLatestDate(season);
	const finalWins = new Map<string, number>();

	for (const standing of standings) {
		finalWins.set(standing.id, standing.wins);
	}

	return finalWins;
}

/**
 * Get standings for a specific date
 */
export async function getStandingsForDate(
	season: string,
	date: Date,
): Promise<Map<string, StandingsOnDate>> {
	const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const standings = await standingService.findByDateAndSeason(normalizedDate, season, {
		select: 'team gamesPlayed wins losses projectedWins',
	});

	const result = new Map<string, StandingsOnDate>();

	for (const standing of standings) {
		result.set(standing.id, {
			gamesPlayed: standing.gamesPlayed,
			losses: standing.losses,
			projectedWins: standing.projectedWins,
			wins: standing.wins,
		});
	}

	return result;
}

/**
 * Get the date range we have standings data for
 */
export async function getStandingsDateRange(season: string): Promise<{ maxDate: Date | null; minDate: Date | null }> {
	return standingService.findDateRange(season);
}

/**
 * Get division standings for external consumers (e.g., Raspberry Pi sign)
 */
export async function getDivisionStandings(date?: string): Promise<DivisionStandingsResponse | null> {
	let targetDate: Date;
	let season: string;

	if (date) {
		const [year, month, day] = date.split('-').map(Number);
		targetDate = new Date(Date.UTC(year, month - 1, day));
		season = year.toString();
	} else {
		season = new Date().getFullYear().toString();
		const latestDate = await standingService.findLatestDate(season);

		if (!latestDate) {
			return null;
		}

		targetDate = latestDate;
	}

	const standings = await standingService.findByDatePopulated(targetDate, season);

	if (standings.length === 0) {
		return null;
	}

	const divisionMap = new Map<string, DivisionStandingsTeam[]>();

	for (const standing of standings) {
		const { team } = standing;

		if (!team || typeof team === 'string') {
			continue;
		}

		const divisionKey = team.division;

		if (!divisionMap.has(divisionKey)) {
			divisionMap.set(divisionKey, []);
		}

		divisionMap.get(divisionKey)!.push({
			abbreviation: team.abbreviation,
			colors: team.colors,
			gamesBack: standing.divisionGamesBack ?? '-',
			losses: standing.losses,
			name: team.name,
			rank: standing.divisionRank ?? 0,
			wins: standing.wins,
		});
	}

	for (const teams of divisionMap.values()) {
		teams.sort((a, b) => a.rank - b.rank);
	}

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
