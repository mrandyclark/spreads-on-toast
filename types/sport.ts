/**
 * Supported sports/leagues for spreads
 * Note: "Sport" is used here to avoid confusion with "League" (e.g., MLB is a league)
 */
export enum Sport {
	MLB = 'MLB',
	// Future: NBA = 'NBA',
	// Future: NFL = 'NFL',
	// Future: NHL = 'NHL',
}

/**
 * Division within a sport (for organizing teams)
 */
export enum Division {
	// MLB American League
	AL_Central = 'AL_Central',
	AL_East = 'AL_East',
	AL_West = 'AL_West',
	// MLB National League
	NL_Central = 'NL_Central',
	NL_East = 'NL_East',
	NL_West = 'NL_West',
}

/**
 * Conference/League within a sport (AL vs NL for MLB)
 */
export enum Conference {
	AL = 'AL', // American League
	NL = 'NL', // National League
}
