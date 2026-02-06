/**
 * Team Chip Types
 *
 * Chips are narrative badges that summarize a team's identity and performance.
 * Each chip belongs to a category, and at most one chip is selected per category.
 */

// =============================================================================
// ENUMS
// =============================================================================

export enum ChipCategory {
	Environment = 'environment',
	GameStyle = 'gameStyle',
	Offense = 'offense',
	Pitching = 'pitching',
	Sustainability = 'sustainability',
	Tier = 'tier',
	VsWinners = 'vsWinners',
}

export enum ChipKey {
	// Vs Winners
	BeatsWinners = 'beatsWinners',
	BlowoutDriven = 'blowoutDriven',
	BubbleTeam = 'bubbleTeam',
	// Game Style
	CloseGameHeavy = 'closeGameHeavy',

	ColdStreak = 'coldStreak',
	Contender = 'contender',

	// Offense
	EliteOffense = 'eliteOffense',
	// Pitching
	ElitePitching = 'elitePitching',

	// Tier
	EliteTeam = 'eliteTeam',
	// Environment
	HotRightNow = 'hotRightNow',
	// Sustainability
	Overperforming = 'overperforming',
	Rebuilding = 'rebuilding',

	ResultsMatchProfile = 'resultsMatchProfile',
	RoadWarriors = 'roadWarriors',

	StrongHomeTeam = 'strongHomeTeam',
	StrugglesVsWinners = 'strugglesVsWinners',
	Underperforming = 'underperforming',

	WeakOffense = 'weakOffense',
	WeakPitching = 'weakPitching',
}

// =============================================================================
// TYPES
// =============================================================================

export interface TeamChip {
	category: ChipCategory;
	detail: string;
	key: ChipKey;
	label: string;
	tooltip: string;
}

export interface LeagueAverages {
	avgRunDiffPerWin: number;
	avgRunsPerGame: number;
}

// =============================================================================
// CHIP CONTENT (tooltips and details)
// =============================================================================

export const CHIP_CONTENT: Record<ChipKey, { detail: string; label: string; tooltip: string }> = {
	// Category 1: Overall Quality
	[ChipKey.BubbleTeam]: {
		detail: 'Projected for mid-80s wins.',
		label: 'Bubble Team',
		tooltip: 'On the fringe of playoff contention.',
	},
	[ChipKey.Contender]: {
		detail: 'Projected for ~90+ wins or top-10 overall.',
		label: 'Contender',
		tooltip: 'Strong playoff-caliber team with a realistic championship path.',
	},
	[ChipKey.EliteTeam]: {
		detail: 'Top-5 overall or projected for 95+ wins.',
		label: 'Elite Team',
		tooltip: 'Ranks among the very best in MLB by overall performance and projection.',
	},
	[ChipKey.Rebuilding]: {
		detail: 'Projected below 75 wins.',
		label: 'Rebuilding',
		tooltip: 'Focused more on long-term development than immediate contention.',
	},

	// Category 2: Offense Identity
	[ChipKey.EliteOffense]: {
		detail: 'At least 0.5 runs per game above average.',
		label: 'Elite Offense',
		tooltip: 'Scores significantly more runs per game than the league average.',
	},
	[ChipKey.WeakOffense]: {
		detail: 'At least 0.5 runs per game below average.',
		label: 'Weak Offense',
		tooltip: 'Struggles to generate consistent run production.',
	},

	// Category 3: Pitching Identity
	[ChipKey.ElitePitching]: {
		detail: 'At least 0.5 runs per game better than average.',
		label: 'Elite Pitching',
		tooltip: 'Allows significantly fewer runs per game than the league average.',
	},
	[ChipKey.WeakPitching]: {
		detail: 'At least 0.5 runs per game worse than average.',
		label: 'Weak Pitching',
		tooltip: 'Allows significantly more runs per game than the league average.',
	},

	// Category 4: Environment / Form
	[ChipKey.ColdStreak]: {
		detail: 'Winning 30% or fewer of recent games.',
		label: 'Cold Streak',
		tooltip: 'Struggling over the last 10 games.',
	},
	[ChipKey.HotRightNow]: {
		detail: 'Winning 70%+ of recent games.',
		label: 'Hot Right Now',
		tooltip: 'Playing excellent baseball over the last 10 games.',
	},
	[ChipKey.RoadWarriors]: {
		detail: 'Road win rate exceeds home win rate by 8%+.',
		label: 'Road Warriors',
		tooltip: 'Performs better on the road than at home.',
	},
	[ChipKey.StrongHomeTeam]: {
		detail: 'Home win rate exceeds road win rate by 8%+.',
		label: 'Strong Home Team',
		tooltip: 'Wins far more often at home than on the road.',
	},

	// Category 5: Game Style
	[ChipKey.BlowoutDriven]: {
		detail: 'Run differential per win is well above league average.',
		label: 'Blowout-Driven',
		tooltip: 'Wins tend to come by larger margins.',
	},
	[ChipKey.CloseGameHeavy]: {
		detail: '30%+ of games decided by one run.',
		label: 'Close-Game Heavy',
		tooltip: 'Plays a high number of tight, one-run games.',
	},

	// Category 6: Sustainability
	[ChipKey.Overperforming]: {
		detail: 'Actual wins exceed expected wins by 3+.',
		label: 'Overperforming Expectations',
		tooltip: 'Record is better than underlying performance suggests.',
	},
	[ChipKey.ResultsMatchProfile]: {
		detail: 'Actual wins within 3 of expected.',
		label: 'Results Match Profile',
		tooltip: 'Results closely align with underlying performance.',
	},
	[ChipKey.Underperforming]: {
		detail: 'Actual wins trail expected wins by 3+.',
		label: 'Underperforming Expectations',
		tooltip: 'Record is worse than underlying performance suggests.',
	},

	// Category 7: Vs Winners
	[ChipKey.BeatsWinners]: {
		detail: 'Strong record against winning teams.',
		label: 'Beats Winners',
		tooltip: 'Performs well against teams with winning records.',
	},
	[ChipKey.StrugglesVsWinners]: {
		detail: 'Struggles against winning teams.',
		label: 'Struggles vs Winners',
		tooltip: 'Has difficulty competing against teams with winning records.',
	},
};
