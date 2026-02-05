import { BaseDocument, Ref } from './mongo';
import { Conference } from './sport';
import { User } from './user';

/**
 * Pick direction for team win totals
 */
export enum PickDirection {
  Over = 'over',
  Under = 'under',
}

/**
 * Pick result after season ends
 */
export enum PickResult {
  Correct = 'correct',
  Incorrect = 'incorrect',
  Push = 'push', // Exact match to line
}

/**
 * A single team pick (over/under on win total)
 */
export interface TeamPick {
  line: number; // The line at time of pick (e.g., 91.5)
  pick: PickDirection; // 'over' or 'under'
  result?: PickResult; // Set after season ends
  team: string; // Team ID
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
  group: string; // Group ID
  postseasonPicks?: PostseasonPicks;
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
