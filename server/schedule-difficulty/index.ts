import { dbConnect } from '@/lib/mongoose';
import { GameModel } from '@/models/game.model';
import { TeamModel } from '@/models/team.model';
import {
	DifficultyLabel,
	Game,
	GameState,
	GameType,
	ScheduleDifficultyData,
	SOSData,
	Sport,
} from '@/types';

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

/**
 * Get all regular season games for a team in a season
 */
async function getTeamGames(
	teamMlbId: number,
	season: string,
): Promise<Game[]> {
	const games = await GameModel.find({
		$or: [
			{ 'homeTeam.teamMlbId': teamMlbId },
			{ 'awayTeam.teamMlbId': teamMlbId },
		],
		gameType: GameType.RegularSeason,
		publicFacing: true,
		season,
		tiebreaker: { $ne: true },
	}).lean();

	return games as Game[];
}

/**
 * Calculate played and remaining SOS for a single team
 */
async function calculateTeamScheduleDifficulty(
	teamMlbId: number,
	season: string,
	asOfDate: string,
): Promise<{ played: null | TeamSOS; remaining: null | TeamSOS }> {
	const games = await getTeamGames(teamMlbId, season);

	// Split into played and remaining
	// Played: Final games with officialDate <= asOfDate
	// Remaining: Games with officialDate > asOfDate OR not Final (handles postponements)
	const playedGames: Game[] = [];
	const remainingGames: Game[] = [];

	for (const game of games) {
		if (isGameFinal(game) && game.officialDate <= asOfDate) {
			playedGames.push(game);
		} else if (game.officialDate > asOfDate || !isGameFinal(game)) {
			remainingGames.push(game);
		}
	}

	const played = calculateSOS(playedGames, teamMlbId);
	const remaining = calculateSOS(remainingGames, teamMlbId);

	return { played, remaining };
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
	await dbConnect();

	// Get all MLB teams
	const teams = await TeamModel.find({
		externalId: { $exists: true },
		sport: Sport.MLB,
	});

	const teamMlbIds = teams.map((t) => t.externalId).filter((id): id is number => id !== undefined);

	// Calculate SOS for all teams (for percentile calculation)
	const allPlayedSOS: number[] = [];
	const allRemainingSOS: number[] = [];
	let targetPlayed: null | TeamSOS = null;
	let targetRemaining: null | TeamSOS = null;

	for (const mlbId of teamMlbIds) {
		const { played, remaining } = await calculateTeamScheduleDifficulty(mlbId, season, asOfDate);

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
	await dbConnect();

	const team = await TeamModel.findById(teamId);

	if (!team || !team.externalId) {
		return null;
	}

	return getScheduleDifficulty(team.externalId, season, asOfDate);
}
