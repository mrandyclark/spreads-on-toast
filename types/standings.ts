import { TeamChip } from './chip';

/**
 * Standings data for the UI with team info and lines
 */
export interface StandingsBoardData {
	abbreviation: string;
	conference: string;
	division: string;
	line: number;
	losses: number;
	name: string;
	pythagoreanWins: number;
	teamId: string;
	wins: number;
}

/**
 * Season with available standings dates for the standings board UI
 */
export interface SeasonWithDates {
	dates: string[];
	id: string;
	latestDate: null | string;
	name: string;
	season: string;
}

/**
 * Situational performance record for win profile
 */
export interface SituationalRecord {
	label: string;
	losses: number;
	pct: number;
	wins: number;
}

/**
 * Win profile data for the team detail page
 */
export interface WinProfileData {
	offenseContribution: number;
	pitchingContribution: number;
	situational: SituationalRecord[];
}

/**
 * Full team detail data for the team page
 */
export interface TeamDetailData {
	abbreviation: string;
	chips: TeamChip[];
	city: string;
	conference: string;
	division: string;
	divisionRank?: number;
	gamesBack?: string;
	gamesPlayed: number;
	id: string;
	leagueRank?: number;
	line: number;
	losses: number;
	name: string;
	projectedWins: number;
	pythagoreanWins?: number;
	runDifferential?: number;
	runsAllowed?: number;
	runsScored?: number;
	season: string;
	streak?: {
		code: string;
		count: number;
		type: 'losses' | 'wins';
	};
	wildCardGamesBack?: string;
	wildCardRank?: number;
	winProfile?: WinProfileData;
	wins: number;
}

/**
 * Historical data point for charts
 */
export interface TeamHistoryDataPoint {
	date: string;
	gamesPlayed: number;
	losses: number;
	projectedWins: number;
	pythagoreanWins?: number;
	runDifferential?: number;
	wins: number;
}
