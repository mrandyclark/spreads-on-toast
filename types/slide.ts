/**
 * Slide types that can be displayed on a sign
 */
export enum SlideType {
	LAST_GAME = 'lastGame',
	NEXT_GAME = 'nextGame',
	OPENER_COUNTDOWN = 'openerCountdown',
	STANDINGS = 'standings',
}

/**
 * Team data displayed on a standings slide
 */
export interface StandingsSlideTeam {
	abbreviation: string;
	colors?: { primary: string; secondary: string };
	gamesBack: string;
	losses: number;
	name: string;
	rank: number;
	wins: number;
}

/**
 * A standings slide showing one division's teams
 */
export interface StandingsSlide {
	slideType: SlideType.STANDINGS;
	teams: StandingsSlideTeam[];
	title: string;
}

/**
 * Team line in a box score (R/H/E)
 */
export interface BoxScoreTeam {
	abbreviation: string;
	colors?: { primary: string; secondary: string };
	errors: number;
	hits: number;
	name: string;
	runs: number;
}

/**
 * A last game slide showing a box score result
 * Away team is always listed first
 */
export interface LastGameSlide {
	awayTeam: BoxScoreTeam;
	gameDate: string;
	homeTeam: BoxScoreTeam;
	slideType: SlideType.LAST_GAME;
}

/**
 * A next game slide showing upcoming game info
 */
export interface NextGameSlide {
	gameDate: string; // ISO string, sign converts to local timezone
	isHome: boolean;
	opponent: {
		abbreviation: string;
		colors?: { primary: string; secondary: string };
		name: string;
	};
	slideType: SlideType.NEXT_GAME;
	team: {
		abbreviation: string;
		colors?: { primary: string; secondary: string };
		name: string;
	};
	venue: string;
}

/**
 * A countdown slide showing days until a team's opening day
 */
export interface OpenerCountdownSlide {
	daysUntil: number;
	gameDate: string; // ISO string
	opponent: {
		abbreviation: string;
		colors?: { primary: string; secondary: string };
		name: string;
	};
	slideType: SlideType.OPENER_COUNTDOWN;
	team: {
		abbreviation: string;
		colors?: { primary: string; secondary: string };
		name: string;
	};
	venue: string;
}

/**
 * Union of all possible slide types
 * Add new slide interfaces here as they are created
 */
export type Slide = LastGameSlide | NextGameSlide | OpenerCountdownSlide | StandingsSlide;

/**
 * Response from the /api/external/sign/slides endpoint
 */
export interface SlidesResponse {
	generatedAt: string;
	slides: Slide[];
}
