import { BaseDocument } from './mongo';
import { Sport } from './sport';

/**
 * Season status
 */
export enum SeasonStatus {
  Active = 'active', // Season in progress
  Completed = 'completed', // Season finished, results finalized
  Upcoming = 'upcoming', // Season not started, lines may be set
}

/**
 * A season for a sport with team lines
 * This is reference data set by admins before each season
 */
export interface Season extends BaseDocument {
  endDate: Date; // When season ends (for results)
  lockDate: Date; // Default lock date for new groups
  name: string; // e.g., '2025 MLB Season'
  season: string; // e.g., '2025'
  sport: Sport;
  startDate: Date; // When season starts
  status: SeasonStatus;
}

/**
 * Season summary for UI
 */
export interface SeasonSummary {
  id: string;
  isLocked: boolean;
  lockDate: Date;
  name: string;
  season: string;
  sport: Sport;
}
