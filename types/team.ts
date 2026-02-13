import { BaseDocument, Ref } from './mongo';
import { Conference, Division, Sport } from './sport';

/**
 * Team brand colors (hex codes)
 */
export interface TeamColors {
	primary: string; // e.g., '#0C2340'
	secondary: string; // e.g., '#FFFFFF'
}

/**
 * A team in a sport (e.g., New York Yankees)
 * This is reference data that rarely changes
 */
export interface Team extends BaseDocument {
	abbreviation: string; // e.g., 'NYY'
	city: string; // e.g., 'New York'
	colors?: TeamColors;
	conference: Conference; // e.g., 'AL'
	division: Division; // e.g., 'AL_East'
	externalId?: number; // External API ID (e.g., MLB Stats API team ID: 147 for Yankees)
	logoUrl?: string;
	name: string; // e.g., 'Yankees'
	sport: Sport; // e.g., 'MLB'
}

/**
 * A team's betting line for a season
 * This is set at the start of each season
 */
export interface TeamLine extends BaseDocument {
	line: number; // e.g., 91.5 (over/under wins)
	season: string; // e.g., '2025'
	sport: Sport;
	team: Ref<Team>; // Team ID or populated Team
}

/**
 * Minimal team info for UI display
 */
export interface TeamSummary {
	abbreviation: string;
	city: string;
	conference: Conference;
	id: string;
	name: string;
}

/**
 * Team with its line for a season (for pick UI)
 */
export interface TeamWithLine extends TeamSummary {
	division: Division;
	line: number;
}

/**
 * Streak information for a team
 */
export interface Streak {
	code: string; // e.g., 'W5', 'L3'
	count: number; // e.g., 5, 3
	type: 'losses' | 'wins';
}

/**
 * Split record (home/away, vs L/R, last 10, etc.)
 */
export interface SplitRecord {
	losses: number;
	pct: string;
	wins: number;
}

/**
 * Expected record from MLB API
 */
export interface ExpectedRecord {
	losses: number;
	pct: string;
	source: string; // e.g., 'mlb'
	type: string; // e.g., 'xWinLoss'
	wins: number;
}

/**
 * League record
 */
export interface LeagueRecord {
	losses: number;
	pct: string;
	wins: number;
}

/**
 * All split records for a team
 */
export interface TeamSplits {
	away?: SplitRecord;
	day?: SplitRecord;
	extraInning?: SplitRecord;
	grass?: SplitRecord;
	home?: SplitRecord;
	lastTen?: SplitRecord;
	left?: SplitRecord; // vs LHP
	leftAway?: SplitRecord;
	leftHome?: SplitRecord;
	night?: SplitRecord;
	oneRun?: SplitRecord;
	right?: SplitRecord; // vs RHP
	rightAway?: SplitRecord;
	rightHome?: SplitRecord;
	turf?: SplitRecord;
	winners?: SplitRecord;
}

/**
 * Daily snapshot of a team's record for a season
 * Used to track win totals and calculate projected wins over time
 */
export interface TeamStanding extends BaseDocument {
	// Playoff status
	clinched?: boolean; // Has clinched playoff spot
	clinchIndicator?: string; // Raw clinch indicator (e.g., "x"|"y"|"z"|"w")
	date: Date; // The date of this snapshot

	// Games back
	divisionChamp?: boolean; // Is division champion
	divisionGamesBack?: string; // Games behind division leader
	divisionLeader?: boolean; // Is division leader

	// Rankings
	divisionRank?: number; // 1-5 within division
	eliminated?: boolean; // Has been eliminated

	// MLB expected record
	expectedRecord?: ExpectedRecord;
	gamesBack?: string; // Games behind division leader (can be "-" or "1.0")

	gamesPlayed: number;
	hasWildcard?: boolean; // Has wildcard spot

	// League record
	leagueGamesBack?: string; // Games behind league leader
	leagueRank?: number; // 1-15 within AL/NL
	leagueRecord?: LeagueRecord;

	losses: number;
	// Calculated projections
	projectedWins: number; // (wins / gamesPlayed) * 162

	pythagoreanWins?: number; // Expected wins based on run differential
	runDifferential?: number; // runsScored - runsAllowed
	runsAllowed?: number;

	// Run production
	runsScored?: number;
	season: string; // e.g., '2026'

	// Splits (home/away, vs L/R, last 10, etc.)
	splits?: TeamSplits;
	sport: Sport;
	sportGamesBack?: string; // Games behind sport leader
	sportRank?: number; // Rank across entire sport

	// Streak
	streak?: Streak;
	team: Ref<Team>; // Team ID or populated Team

	wildCardGamesBack?: string; // Games behind wild card
	wildCardLeader?: boolean; // Is wild card leader

	wildCardRank?: number; // Wild card position
	// Core record
	wins: number;
}
