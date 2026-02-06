import { BaseDocument, Ref } from './mongo';
import { Conference, Division, Sport } from './sport';

/**
 * A team in a sport (e.g., New York Yankees)
 * This is reference data that rarely changes
 */
export interface Team extends BaseDocument {
  abbreviation: string; // e.g., 'NYY'
  city: string; // e.g., 'New York'
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
 * Daily snapshot of a team's record for a season
 * Used to track win totals and calculate projected wins over time
 */
export interface TeamStanding extends BaseDocument {
  // Playoff status
  clinched?: boolean; // Has clinched playoff spot
  date: Date; // The date of this snapshot
  // Rankings
  divisionRank?: number; // 1-5 within division
  eliminated?: boolean; // Has been eliminated

  // Games back
  gamesBack?: string; // Games behind division leader (can be "-" or "1.0")
  gamesPlayed: number;
  leagueRank?: number; // 1-15 within AL/NL

  losses: number;
  // Calculated projections
  projectedWins: number; // (wins / gamesPlayed) * 162

  pythagoreanWins?: number; // Expected wins based on run differential
  runDifferential?: number; // runsScored - runsAllowed
  runsAllowed?: number;

  // Run production
  runsScored?: number;
  season: string; // e.g., '2026'

  sport: Sport;
  // Streak
  streak?: Streak;
  team: Ref<Team>; // Team ID or populated Team

  wildCardGamesBack?: string; // Games behind wild card

  wildCardRank?: number; // Wild card position
  // Core record
  wins: number;
}
