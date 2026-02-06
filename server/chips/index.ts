/**
 * Team Chips Calculation
 *
 * Chips are narrative badges that summarize a team's identity and performance.
 * Each chip belongs to a category, and at most one chip is selected per category.
 */

import {
	ENVIRONMENT,
	GAME_STYLE,
	LEAGUE_FALLBACKS,
	OFFENSE,
	PITCHING,
	SUSTAINABILITY,
	TEAM_TIER,
	VS_WINNERS,
} from '@/config/chip-thresholds';
import {
	CHIP_CONTENT,
	ChipCategory,
	ChipKey,
	LeagueAverages,
	TeamChip,
	TeamStanding,
} from '@/types';

// =============================================================================
// LEAGUE AVERAGES CALCULATION
// =============================================================================

/**
 * Calculate league averages from all team standings for a given date
 */
export function calculateLeagueAverages(allStandings: TeamStanding[]): LeagueAverages {
	if (allStandings.length === 0) {
		return {
			avgRunDiffPerWin: LEAGUE_FALLBACKS.AVG_RUN_DIFF_PER_WIN,
			avgRunsPerGame: LEAGUE_FALLBACKS.AVG_RUNS_PER_GAME,
		};
	}

	let totalRunsScored = 0;
	let totalGamesPlayed = 0;
	let totalRunDiff = 0;
	let totalWins = 0;

	for (const standing of allStandings) {
		if (standing.gamesPlayed > 0) {
			totalRunsScored += standing.runsScored ?? 0;
			totalGamesPlayed += standing.gamesPlayed;
			totalRunDiff += standing.runDifferential ?? 0;
			totalWins += standing.wins;
		}
	}

	// Average runs per game (use scored, as scored and allowed should average the same league-wide)
	const avgRunsPerGame =
		totalGamesPlayed > 0
			? totalRunsScored / totalGamesPlayed
			: LEAGUE_FALLBACKS.AVG_RUNS_PER_GAME;

	// Average run differential per win above .500
	// This is trickier - we want the relationship between run diff and wins
	// Simplified: total run diff / total wins (for teams with positive run diff)
	const avgRunDiffPerWin =
		totalWins > 0 ? totalRunDiff / totalWins : LEAGUE_FALLBACKS.AVG_RUN_DIFF_PER_WIN;

	return {
		avgRunDiffPerWin,
		avgRunsPerGame,
	};
}

// =============================================================================
// CHIP CALCULATION
// =============================================================================

/**
 * Calculate all chips for a team based on their standing and league averages
 */
export function calculateTeamChips(
	standing: TeamStanding,
	leagueAverages: LeagueAverages,
): TeamChip[] {
	const chips: TeamChip[] = [];

	// Skip chip calculation if not enough games played
	if (standing.gamesPlayed < 10) {
		return chips;
	}

	// Derived values
	const rpgFor = standing.runsScored ? standing.runsScored / standing.gamesPlayed : 0;
	const rpgAgainst = standing.runsAllowed ? standing.runsAllowed / standing.gamesPlayed : 0;

	// Parse split percentages (stored as strings like ".500" or "1.000")
	const homePct = parsePct(standing.splits?.home?.pct);
	const awayPct = parsePct(standing.splits?.away?.pct);
	const lastTenPct = parsePct(standing.splits?.lastTen?.pct);
	const winnersPct = parsePct(standing.splits?.winners?.pct);

	// One-run game rate
	const oneRunWins = standing.splits?.oneRun?.wins ?? 0;
	const oneRunLosses = standing.splits?.oneRun?.losses ?? 0;
	const oneRunRate = (oneRunWins + oneRunLosses) / standing.gamesPlayed;

	// Expected wins delta (prefer MLB expected, fallback to pythagorean)
	const expectedWins = standing.expectedRecord?.wins ?? standing.pythagoreanWins ?? standing.wins;
	const delta = standing.wins - expectedWins;

	// Run diff per win
	const runDiffPerWin =
		standing.wins > 0 ? (standing.runDifferential ?? 0) / standing.wins : 0;

	// -------------------------------------------------------------------------
	// CATEGORY 1: TEAM TIER
	// -------------------------------------------------------------------------
	const tierChip = calculateTierChip(standing);

	if (tierChip) {
		chips.push(tierChip);
	}

	// -------------------------------------------------------------------------
	// CATEGORY 2: OFFENSE IDENTITY
	// -------------------------------------------------------------------------
	const offenseChip = calculateOffenseChip(rpgFor, leagueAverages.avgRunsPerGame);

	if (offenseChip) {
		chips.push(offenseChip);
	}

	// -------------------------------------------------------------------------
	// CATEGORY 3: PITCHING IDENTITY
	// -------------------------------------------------------------------------
	const pitchingChip = calculatePitchingChip(rpgAgainst, leagueAverages.avgRunsPerGame);

	if (pitchingChip) {
		chips.push(pitchingChip);
	}

	// -------------------------------------------------------------------------
	// CATEGORY 4: ENVIRONMENT / FORM
	// -------------------------------------------------------------------------
	const environmentChip = calculateEnvironmentChip(homePct, awayPct, lastTenPct);

	if (environmentChip) {
		chips.push(environmentChip);
	}

	// -------------------------------------------------------------------------
	// CATEGORY 5: GAME STYLE
	// -------------------------------------------------------------------------
	const gameStyleChip = calculateGameStyleChip(
		oneRunRate,
		runDiffPerWin,
		leagueAverages.avgRunDiffPerWin,
	);

	if (gameStyleChip) {
		chips.push(gameStyleChip);
	}

	// -------------------------------------------------------------------------
	// CATEGORY 6: SUSTAINABILITY
	// -------------------------------------------------------------------------
	const sustainabilityChip = calculateSustainabilityChip(delta);

	if (sustainabilityChip) {
		chips.push(sustainabilityChip);
	}

	// -------------------------------------------------------------------------
	// CATEGORY 7: VS WINNERS
	// -------------------------------------------------------------------------
	const vsWinnersChip = calculateVsWinnersChip(winnersPct);

	if (vsWinnersChip) {
		chips.push(vsWinnersChip);
	}

	return chips;
}

// =============================================================================
// INDIVIDUAL CHIP CALCULATORS
// =============================================================================

function calculateTierChip(standing: TeamStanding): null | TeamChip {
	const { projectedWins, sportRank } = standing;

	// Elite Team
	if (
		(sportRank && sportRank <= TEAM_TIER.ELITE_SPORT_RANK_MAX) ||
		projectedWins >= TEAM_TIER.ELITE_PROJECTED_WINS_MIN
	) {
		return createChip(ChipCategory.Tier, ChipKey.EliteTeam);
	}

	// Contender
	if (
		(sportRank &&
			sportRank >= TEAM_TIER.CONTENDER_SPORT_RANK_MIN &&
			sportRank <= TEAM_TIER.CONTENDER_SPORT_RANK_MAX) ||
		(projectedWins >= TEAM_TIER.CONTENDER_PROJECTED_WINS_MIN &&
			projectedWins <= TEAM_TIER.CONTENDER_PROJECTED_WINS_MAX)
	) {
		return createChip(ChipCategory.Tier, ChipKey.Contender);
	}

	// Bubble Team
	if (
		projectedWins >= TEAM_TIER.BUBBLE_PROJECTED_WINS_MIN &&
		projectedWins <= TEAM_TIER.BUBBLE_PROJECTED_WINS_MAX
	) {
		return createChip(ChipCategory.Tier, ChipKey.BubbleTeam);
	}

	// Rebuilding
	if (projectedWins <= TEAM_TIER.REBUILDING_PROJECTED_WINS_MAX) {
		return createChip(ChipCategory.Tier, ChipKey.Rebuilding);
	}

	return null;
}

function calculateOffenseChip(rpgFor: number, leagueAvgRpg: number): null | TeamChip {
	if (rpgFor >= leagueAvgRpg + OFFENSE.ELITE_RPG_ABOVE_AVG) {
		return createChip(ChipCategory.Offense, ChipKey.EliteOffense);
	}

	if (rpgFor <= leagueAvgRpg - OFFENSE.WEAK_RPG_BELOW_AVG) {
		return createChip(ChipCategory.Offense, ChipKey.WeakOffense);
	}

	return null;
}

function calculatePitchingChip(rpgAgainst: number, leagueAvgRpg: number): null | TeamChip {
	if (rpgAgainst <= leagueAvgRpg - PITCHING.ELITE_RPG_BELOW_AVG) {
		return createChip(ChipCategory.Pitching, ChipKey.ElitePitching);
	}

	if (rpgAgainst >= leagueAvgRpg + PITCHING.WEAK_RPG_ABOVE_AVG) {
		return createChip(ChipCategory.Pitching, ChipKey.WeakPitching);
	}

	return null;
}

function calculateEnvironmentChip(
	homePct: null | number,
	awayPct: null | number,
	lastTenPct: null | number,
): null | TeamChip {
	// Priority 1: Hot/Cold (recent form takes precedence)
	if (lastTenPct !== null) {
		if (lastTenPct >= ENVIRONMENT.HOT_LAST_TEN_PCT_MIN) {
			return createChip(ChipCategory.Environment, ChipKey.HotRightNow);
		}

		if (lastTenPct <= ENVIRONMENT.COLD_LAST_TEN_PCT_MAX) {
			return createChip(ChipCategory.Environment, ChipKey.ColdStreak);
		}
	}

	// Priority 2: Home/Road splits
	if (homePct !== null && awayPct !== null) {
		const homeDiff = homePct - awayPct;

		if (homeDiff >= ENVIRONMENT.STRONG_HOME_SPLIT_DIFF) {
			return createChip(ChipCategory.Environment, ChipKey.StrongHomeTeam);
		}

		if (homeDiff <= -ENVIRONMENT.ROAD_WARRIORS_SPLIT_DIFF) {
			return createChip(ChipCategory.Environment, ChipKey.RoadWarriors);
		}
	}

	return null;
}

function calculateGameStyleChip(
	oneRunRate: number,
	runDiffPerWin: number,
	leagueAvgRunDiffPerWin: number,
): null | TeamChip {
	if (oneRunRate >= GAME_STYLE.CLOSE_GAME_RATE_MIN) {
		return createChip(ChipCategory.GameStyle, ChipKey.CloseGameHeavy);
	}

	if (runDiffPerWin >= leagueAvgRunDiffPerWin + GAME_STYLE.BLOWOUT_RUN_DIFF_PER_WIN_ABOVE_AVG) {
		return createChip(ChipCategory.GameStyle, ChipKey.BlowoutDriven);
	}

	return null;
}

function calculateSustainabilityChip(delta: number): null | TeamChip {
	if (delta >= SUSTAINABILITY.OVERPERFORMING_DELTA_MIN) {
		return createChip(ChipCategory.Sustainability, ChipKey.Overperforming);
	}

	if (delta <= SUSTAINABILITY.UNDERPERFORMING_DELTA_MAX) {
		return createChip(ChipCategory.Sustainability, ChipKey.Underperforming);
	}

	return createChip(ChipCategory.Sustainability, ChipKey.ResultsMatchProfile);
}

function calculateVsWinnersChip(winnersPct: null | number): null | TeamChip {
	if (winnersPct === null) {
		return null;
	}

	if (winnersPct >= VS_WINNERS.BEATS_WINNERS_PCT_MIN) {
		return createChip(ChipCategory.VsWinners, ChipKey.BeatsWinners);
	}

	if (winnersPct <= VS_WINNERS.STRUGGLES_VS_WINNERS_PCT_MAX) {
		return createChip(ChipCategory.VsWinners, ChipKey.StrugglesVsWinners);
	}

	return null;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create a chip with content from CHIP_CONTENT
 */
function createChip(category: ChipCategory, key: ChipKey): TeamChip {
	const content = CHIP_CONTENT[key];

	return {
		category,
		detail: content.detail,
		key,
		label: content.label,
		tooltip: content.tooltip,
	};
}

/**
 * Parse a percentage string like ".500" or "1.000" to a number
 */
function parsePct(pct: string | undefined): null | number {
	if (!pct) {
		return null;
	}

	const parsed = parseFloat(pct);

	return isNaN(parsed) ? null : parsed;
}
