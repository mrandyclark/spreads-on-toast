/**
 * Difficulty label based on percentile bands
 */
export type DifficultyLabel = 'Easy' | 'Average' | 'Hard';

/**
 * SOS data for a single direction (played or remaining)
 */
export interface SOSData {
	avgOpponentWinPct: number;
	gameCount: number;
	label: DifficultyLabel;
	percentile: number;
	rank: number;
}

/**
 * Complete schedule difficulty data for a team
 */
export interface ScheduleDifficultyData {
	played: SOSData | null;
	remaining: SOSData | null;
	teamCount: number;
}
