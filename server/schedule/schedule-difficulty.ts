import {
	DifficultyLabel,
	Game,
	GameState,
	ScheduleDifficultyData,
	SOSData,
	Sport,
} from '@/types';

import { teamService } from '../teams/team.service';
import { gameService } from './game.service';

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_GAMES_FOR_CONFIDENCE = 5;

// Percentile bands for difficulty labels
const PERCENTILE_HARD_MIN = 67;
const PERCENTILE_EASY_MAX = 33;

// =============================================================================
// TYPES
// =============================================================================

interface TeamSOS {
	avgOpponentWinPct: number;
	gameCount: number;
	teamMlbId: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse a win percentage string like ".615" to a number (0.615)
 */
function parseWinPct(pct: string | undefined): null | number {
	if (!pct) {
		return null;
	}

	const parsed = parseFloat(pct);

	if (isNaN(parsed)) {
		return null;
	}

	return parsed;
}

/**
 * Determine difficulty label based on percentile
 */
function getDifficultyLabel(percentile: number): DifficultyLabel {
	if (percentile >= PERCENTILE_HARD_MIN) {
		return 'Hard';
	}

	if (percentile <= PERCENTILE_EASY_MAX) {
		return 'Easy';
	}

	return 'Average';
}

/**
 * Calculate percentile rank (higher = harder schedule)
 */
function calculatePercentile(value: number, allValues: number[]): number {
	if (allValues.length === 0) {
		return 50;
	}

	const sorted = [...allValues].sort((a, b) => a - b);
	const belowCount = sorted.filter((v) => v < value).length;
	const equalCount = sorted.filter((v) => v === value).length;

	// Percentile = (values below + half of equal values) / total * 100
	return ((belowCount + equalCount / 2) / sorted.length) * 100;
}

/**
 * Calculate rank (1 = hardest schedule)
 */
function calculateRank(value: number, allValues: number[]): number {
	const sorted = [...allValues].sort((a, b) => b - a); // Descending (highest first)
	return sorted.findIndex((v) => v === value) + 1;
}

/**
 * Check if a game is "played" (Final)
 */
function isGameFinal(game: Game): boolean {
	return (
		game.status.abstractGameState === GameState.Final ||
		game.status.statusCode === 'F'
	);
}

/**
 * Get opponent win percentage for a game from the team's perspective
 */
function getOpponentWinPct(game: Game, teamMlbId: number): null | number {
	const isHome = game.homeTeam.teamMlbId === teamMlbId;
	const opponent = isHome ? game.awayTeam : game.homeTeam;

	return parseWinPct(opponent.leagueRecord?.pct);
}

// =============================================================================
// CORE CALCULATION
// =============================================================================

/**
 * Calculate SOS for a set of games
 */
function calculateSOS(games: Game[], teamMlbId: number): null | TeamSOS {
	const opponentWinPcts: number[] = [];

	for (const game of games) {
		const pct = getOpponentWinPct(game, teamMlbId);

		if (pct !== null) {
			opponentWinPcts.push(pct);
		}
	}

	if (opponentWinPcts.length === 0) {
		return null;
	}

	const avgOpponentWinPct =
		opponentWinPcts.reduce((sum, pct) => sum + pct, 0) / opponentWinPcts.length;

	return {
		avgOpponentWinPct,
		gameCount: opponentWinPcts.length,
		teamMlbId,
	};
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get schedule difficulty data for a team, including league-wide percentiles
 */
export async function getScheduleDifficulty(
	teamMlbId: number,
	season: string,
	asOfDate: string,
): Promise<ScheduleDifficultyData> {
	const [teams, allGames] = await Promise.all([
		teamService.findWithExternalIds(Sport.MLB),
		gameService.findRegularSeasonForSOS(season),
	]);

	const teamMlbIds = teams.map((t) => t.externalId).filter((id): id is number => id !== undefined);

	// Index games by team MLB ID for fast lookup
	const gamesByTeam = new Map<number, Game[]>();

	for (const mlbId of teamMlbIds) {
		gamesByTeam.set(mlbId, []);
	}

	for (const game of allGames) {
		const homeId = game.homeTeam.teamMlbId;
		const awayId = game.awayTeam.teamMlbId;

		gamesByTeam.get(homeId)?.push(game);
		gamesByTeam.get(awayId)?.push(game);
	}

	// Calculate SOS for all teams (for percentile calculation)
	const allPlayedSOS: number[] = [];
	const allRemainingSOS: number[] = [];
	let targetPlayed: null | TeamSOS = null;
	let targetRemaining: null | TeamSOS = null;

	for (const mlbId of teamMlbIds) {
		const teamGames = gamesByTeam.get(mlbId) ?? [];

		// Split into played and remaining
		const playedGames: Game[] = [];
		const remainingGames: Game[] = [];

		for (const game of teamGames) {
			if (isGameFinal(game) && game.officialDate <= asOfDate) {
				playedGames.push(game);
			} else if (game.officialDate > asOfDate || !isGameFinal(game)) {
				remainingGames.push(game);
			}
		}

		const played = calculateSOS(playedGames, mlbId);
		const remaining = calculateSOS(remainingGames, mlbId);

		if (played && played.gameCount >= MIN_GAMES_FOR_CONFIDENCE) {
			allPlayedSOS.push(played.avgOpponentWinPct);

			if (mlbId === teamMlbId) {
				targetPlayed = played;
			}
		}

		if (remaining && remaining.gameCount >= MIN_GAMES_FOR_CONFIDENCE) {
			allRemainingSOS.push(remaining.avgOpponentWinPct);

			if (mlbId === teamMlbId) {
				targetRemaining = remaining;
			}
		}

		// Also capture target even if below confidence threshold
		if (mlbId === teamMlbId) {
			if (!targetPlayed && played) {
				targetPlayed = played;
			}

			if (!targetRemaining && remaining) {
				targetRemaining = remaining;
			}
		}
	}

	// Build response with percentiles
	let playedData: null | SOSData = null;
	let remainingData: null | SOSData = null;

	if (targetPlayed) {
		const percentile = calculatePercentile(targetPlayed.avgOpponentWinPct, allPlayedSOS);
		const rank = calculateRank(targetPlayed.avgOpponentWinPct, allPlayedSOS);

		playedData = {
			avgOpponentWinPct: targetPlayed.avgOpponentWinPct,
			gameCount: targetPlayed.gameCount,
			label: getDifficultyLabel(percentile),
			percentile,
			rank,
		};
	}

	if (targetRemaining) {
		const percentile = calculatePercentile(targetRemaining.avgOpponentWinPct, allRemainingSOS);
		const rank = calculateRank(targetRemaining.avgOpponentWinPct, allRemainingSOS);

		remainingData = {
			avgOpponentWinPct: targetRemaining.avgOpponentWinPct,
			gameCount: targetRemaining.gameCount,
			label: getDifficultyLabel(percentile),
			percentile,
			rank,
		};
	}

	return {
		played: playedData,
		remaining: remainingData,
		teamCount: teamMlbIds.length,
	};
}

/**
 * Get schedule difficulty by team UUID (convenience wrapper)
 */
export async function getScheduleDifficultyByTeamId(
	teamId: string,
	season: string,
	asOfDate: string,
): Promise<null | ScheduleDifficultyData> {
	const team = await teamService.findById(teamId);

	if (!team || !team.externalId) {
		return null;
	}

	return getScheduleDifficulty(team.externalId, season, asOfDate);
}
