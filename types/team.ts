import { BaseDocument } from './mongo';
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
  team: string; // Team ID
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
