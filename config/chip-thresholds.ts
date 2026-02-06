/**
 * Team Chip Thresholds Configuration
 *
 * These thresholds control when team "chips" (badges/labels) are assigned.
 * Chips provide quick narrative context about a team's identity and performance.
 *
 * All thresholds are tweakable - adjust based on observed data patterns.
 */

// =============================================================================
// CATEGORY 1: TEAM TIER
// Determines overall team strength classification
// Pick ONE: Elite Team > Contender > Bubble Team > Rebuilding
// =============================================================================

export const TEAM_TIER = {
	// Elite Team: Top teams in the sport
	ELITE_PROJECTED_WINS_MIN: 95, // OR projectedWins >= 95
	ELITE_SPORT_RANK_MAX: 5, // sportRank <= 5

	// Contender: Playoff-caliber teams
	CONTENDER_PROJECTED_WINS_MAX: 94, // OR projectedWins 90-94
	CONTENDER_PROJECTED_WINS_MIN: 90,
	CONTENDER_SPORT_RANK_MAX: 10, // sportRank 6-10
	CONTENDER_SPORT_RANK_MIN: 6,

	// Bubble Team: On the edge of playoff contention
	BUBBLE_PROJECTED_WINS_MAX: 89, // projectedWins 84-89
	BUBBLE_PROJECTED_WINS_MIN: 84,

	// Rebuilding: Teams not expected to contend
	REBUILDING_PROJECTED_WINS_MAX: 74, // projectedWins < 75
};

// =============================================================================
// CATEGORY 2: OFFENSE IDENTITY
// Based on runs scored per game vs league average
// Pick ONE: Elite Offense | Weak Offense | (none)
// =============================================================================

export const OFFENSE = {
	// How many runs above/below league average to trigger chip
	ELITE_RPG_ABOVE_AVG: 0.5, // rpgFor >= leagueAvg + 0.5
	WEAK_RPG_BELOW_AVG: 0.5, // rpgFor <= leagueAvg - 0.5
};

// =============================================================================
// CATEGORY 3: PITCHING IDENTITY
// Based on runs allowed per game vs league average
// Pick ONE: Elite Pitching | Weak Pitching | (none)
// =============================================================================

export const PITCHING = {
	// How many runs above/below league average to trigger chip
	ELITE_RPG_BELOW_AVG: 0.5, // rpgAgainst <= leagueAvg - 0.5
	WEAK_RPG_ABOVE_AVG: 0.5, // rpgAgainst >= leagueAvg + 0.5
};

// =============================================================================
// CATEGORY 4: ENVIRONMENT / FORM
// Recent performance and home/road splits
// Priority: Hot/Cold > Home/Road
// Pick ONE: Hot Right Now | Cold Streak | Strong Home Team | Road Warriors | (none)
// =============================================================================

export const ENVIRONMENT = {
	// Last 10 games winning percentage thresholds
	COLD_LAST_TEN_PCT_MAX: 0.3, // lastTenPct <= .300
	HOT_LAST_TEN_PCT_MIN: 0.7, // lastTenPct >= .700

	// Home/Away split difference thresholds
	ROAD_WARRIORS_SPLIT_DIFF: 0.08, // awayPct - homePct >= 0.080
	STRONG_HOME_SPLIT_DIFF: 0.08, // homePct - awayPct >= 0.080
};

// =============================================================================
// CATEGORY 5: GAME STYLE
// How the team wins/loses games
// Pick ONE: Close-Game Heavy | Blowout-Driven | (none)
// =============================================================================

export const GAME_STYLE = {
	// One-run games as percentage of total games
	CLOSE_GAME_RATE_MIN: 0.3, // oneRunRate >= 0.30

	// Run differential per win above league average
	BLOWOUT_RUN_DIFF_PER_WIN_ABOVE_AVG: 0.8, // (runDiff / wins) >= leagueAvg + 0.8
};

// =============================================================================
// CATEGORY 6: SUSTAINABILITY
// Are results matching underlying performance?
// Uses: delta = actualWins - expectedWins (MLB xWinLoss preferred, fallback to pythagorean)
// Pick ONE: Overperforming | Underperforming | Results Match Profile
// =============================================================================

export const SUSTAINABILITY = {
	// Delta thresholds (actual wins vs expected wins)
	OVERPERFORMING_DELTA_MIN: 3, // delta >= +3
	UNDERPERFORMING_DELTA_MAX: -3, // delta <= -3
	// Results Match Profile: abs(delta) < 3
};

// =============================================================================
// CATEGORY 7: VS WINNERS (optional)
// Record against winning teams
// Pick ONE: Beats Winners | Struggles vs Winners | (none)
// =============================================================================

export const VS_WINNERS = {
	// Winning percentage vs winning teams thresholds
	BEATS_WINNERS_PCT_MIN: 0.55, // winnersPct >= .550
	STRUGGLES_VS_WINNERS_PCT_MAX: 0.4, // winnersPct <= .400
};

// =============================================================================
// LEAGUE AVERAGE FALLBACKS
// Used when we can't calculate league averages from data
// These are approximate MLB historical averages
// =============================================================================

export const LEAGUE_FALLBACKS = {
	// Average runs per game (both scored and allowed average to this)
	AVG_RUNS_PER_GAME: 4.5,

	// Average run differential per win (roughly 0.1 runs per win above .500)
	AVG_RUN_DIFF_PER_WIN: 0.1,
};
