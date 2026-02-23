import { Group } from './group';
import { BaseDocument, Ref } from './mongo';
import { Conference, Sport } from './sport';
import { Team } from './team';
import { User } from './user';

/**
 * Pick direction for team win totals
 */
export enum PickDirection {
	Over = 'over',
	Under = 'under',
}

/**
 * Pick choice for UI state (includes null for unpicked)
 */
export type PickChoice = null | PickDirection;

/**
 * Pick result (pending during season, resolved after)
 */
export enum PickResult {
	Loss = 'loss',
	Pending = 'pending',
	Push = 'push',
	Win = 'win',
}

/**
 * A single team pick (over/under on win total)
 */
export interface TeamPick {
	line?: number; // Deprecated: was copied from TeamLine, now resolved at read time
	pick?: PickDirection; // 'over' or 'under' (undefined until user picks)
	result?: PickResult; // Set after season ends
	team: Ref<Team>; // Team ID or populated Team
}

/**
 * Postseason picks (5 teams per conference to make playoffs)
 */
export interface PostseasonPicks {
	al: string[]; // 5 AL team IDs
	nl: string[]; // 5 NL team IDs
}

/**
 * World Series picks (pennant winners)
 */
export interface WorldSeriesPicks {
	alChampion: string; // AL pennant winner team ID
	nlChampion: string; // NL pennant winner team ID
	winner?: Conference; // Which champion wins the WS (optional tiebreaker)
}

/**
 * A user's pick sheet for a group
 * Contains all their picks for the season
 */
export interface Sheet extends BaseDocument {
	group: Ref<Group>; // Group ID or populated Group
	postseasonPicks?: PostseasonPicks;
	sport: Sport; // Sport this sheet is for
	submittedAt?: Date; // When picks were finalized
	teamPicks: TeamPick[];
	user: Ref<User>;
	worldSeriesPicks?: WorldSeriesPicks;
}

/**
 * Sheet summary for leaderboard
 */
export interface SheetSummary {
	correctPicks: number;
	rank: number;
	totalPicks: number;
	userId: string;
	userName: string;
}

/**
 * Sheet detail for viewing picks
 */
export interface SheetDetail {
	postseasonPicks?: PostseasonPicks;
	teamPicks: TeamPickDisplay[];
	worldSeriesPicks?: WorldSeriesPicks;
}

/**
 * Team pick with display info
 */
export interface TeamPickDisplay {
	actualWins?: number; // Filled in during/after season
	line: number;
	pick: PickDirection;
	result?: PickResult;
	teamAbbreviation: string;
	teamName: string;
}
