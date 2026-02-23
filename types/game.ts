import { BaseDocument, Ref } from './mongo';
import { Team } from './team';

/**
 * Game type codes from MLB API
 * S = Spring Training, R = Regular Season, E = Exhibition,
 * P = Postseason (generic), F = Wild Card, D = Division Series,
 * L = League Championship, W = World Series
 */
export enum GameType {
	DivisionSeries = 'D',
	Exhibition = 'E',
	LeagueChampionship = 'L',
	Postseason = 'P',
	RegularSeason = 'R',
	SpringTraining = 'S',
	WildCard = 'F',
	WorldSeries = 'W',
}

/**
 * Abstract game state from MLB API
 */
export enum GameState {
	Final = 'Final',
	Live = 'Live',
	Preview = 'Preview',
}

/**
 * Game status information
 */
export interface GameStatus {
	abstractGameCode: string;
	abstractGameState: GameState;
	codedGameState: string;
	detailedState: string;
	reason?: string;
	startTimeTBD: boolean;
	statusCode: string;
}

/**
 * Team-specific game data (home or away)
 */
export interface GameTeamData {
	errors?: number;
	hits?: number;
	isWinner?: boolean;
	leagueRecord: {
		losses: number;
		pct: string;
		wins: number;
	};
	leftOnBase?: number;
	probablePitcher?: GamePlayerRef;
	score?: number;
	seriesNumber: number;
	splitSquad: boolean;
	team: Ref<Team>;
	teamMlbId: number;
}

/**
 * Per-inning linescore data for one side (home or away)
 */
export interface InningHalfData {
	errors: number;
	hits: number;
	leftOnBase: number;
	runs?: number;
}

/**
 * Per-inning linescore data
 */
export interface GameInning {
	away: InningHalfData;
	home: InningHalfData;
	num: number;
	ordinalNum: string;
}

/**
 * Linescore team totals
 */
export interface LinescoreTeamTotals {
	errors: number;
	hits: number;
	isWinner?: boolean;
	leftOnBase: number;
	runs: number;
}

/**
 * Player reference (id + name)
 */
export interface GamePlayerRef {
	fullName: string;
	mlbId: number;
}

/**
 * Defensive lineup for a half-inning
 */
export interface GameDefense {
	batter?: GamePlayerRef;
	battingOrder?: number;
	catcher?: GamePlayerRef;
	center?: GamePlayerRef;
	first?: GamePlayerRef;
	inHole?: GamePlayerRef;
	left?: GamePlayerRef;
	onDeck?: GamePlayerRef;
	pitcher?: GamePlayerRef;
	right?: GamePlayerRef;
	second?: GamePlayerRef;
	shortstop?: GamePlayerRef;
	teamMlbId?: number;
	third?: GamePlayerRef;
}

/**
 * Offensive lineup for a half-inning
 */
export interface GameOffense {
	batter?: GamePlayerRef;
	battingOrder?: number;
	inHole?: GamePlayerRef;
	onDeck?: GamePlayerRef;
	pitcher?: GamePlayerRef;
	teamMlbId?: number;
}

/**
 * Full linescore for a game
 */
export interface GameLinescore {
	balls?: number;
	currentInning?: number;
	currentInningOrdinal?: string;
	defense?: GameDefense;
	inningHalf?: string;
	innings: GameInning[];
	inningState?: string;
	isTopInning?: boolean;
	offense?: GameOffense;
	outs?: number;
	scheduledInnings: number;
	strikes?: number;
	teams: {
		away: LinescoreTeamTotals;
		home: LinescoreTeamTotals;
	};
}

/**
 * Venue information
 */
export interface GameVenue {
	mlbId: number;
	name: string;
}

/**
 * Full game document for database storage
 */
export interface Game extends BaseDocument {
	awayTeam: GameTeamData;
	calendarEventId: string;
	dayNight: 'day' | 'night';
	description?: string;
	doubleHeader: 'N' | 'S' | 'Y';
	gameDate: Date;
	gamedayType: string;
	gameNumber: number;
	gamesInSeries: number;
	gameType: GameType;
	homeTeam: GameTeamData;
	ifNecessary: boolean;
	ifNecessaryDescription?: string;
	inningBreakLength: number;
	isTie?: boolean;
	linescore?: GameLinescore;
	mlbGameId: number;
	officialDate: string;
	publicFacing: boolean;
	reverseHomeAwayStatus: boolean;
	scheduledInnings: number;
	season: string;
	seriesDescription: string;
	seriesGameNumber: number;
	status: GameStatus;
	tiebreaker: boolean;
	venue: GameVenue;
}

/**
 * MLB API response types for schedule endpoint
 */
export interface MlbScheduleTeam {
	isWinner?: boolean;
	leagueRecord: {
		losses: number;
		pct: string;
		wins: number;
	};
	probablePitcher?: {
		fullName: string;
		id: number;
		link: string;
	};
	score?: number;
	seriesNumber: number;
	splitSquad: boolean;
	team: {
		id: number;
		link: string;
		name: string;
	};
}

/**
 * MLB API linescore player reference
 */
export interface MlbLinescorePlayer {
	fullName: string;
	id: number;
	link: string;
}

/**
 * MLB API linescore inning half
 */
export interface MlbLinescoreInningHalf {
	errors: number;
	hits: number;
	leftOnBase: number;
	runs?: number;
}

/**
 * MLB API linescore inning
 */
export interface MlbLinescoreInning {
	away: MlbLinescoreInningHalf;
	home: MlbLinescoreInningHalf;
	num: number;
	ordinalNum: string;
}

/**
 * MLB API linescore team totals
 */
export interface MlbLinescoreTeamTotals {
	errors: number;
	hits: number;
	isWinner?: boolean;
	leftOnBase: number;
	runs: number;
}

/**
 * MLB API linescore defense/offense side
 */
export interface MlbLinescoreSide {
	batter?: MlbLinescorePlayer;
	battingOrder?: number;
	catcher?: MlbLinescorePlayer;
	center?: MlbLinescorePlayer;
	first?: MlbLinescorePlayer;
	inHole?: MlbLinescorePlayer;
	left?: MlbLinescorePlayer;
	onDeck?: MlbLinescorePlayer;
	pitcher?: MlbLinescorePlayer;
	right?: MlbLinescorePlayer;
	second?: MlbLinescorePlayer;
	shortstop?: MlbLinescorePlayer;
	team?: {
		id: number;
		link: string;
		name: string;
	};
	third?: MlbLinescorePlayer;
}

/**
 * MLB API linescore (hydrated on schedule endpoint)
 */
export interface MlbLinescore {
	balls?: number;
	currentInning?: number;
	currentInningOrdinal?: string;
	defense?: MlbLinescoreSide;
	inningHalf?: string;
	innings: MlbLinescoreInning[];
	inningState?: string;
	isTopInning?: boolean;
	offense?: MlbLinescoreSide;
	outs?: number;
	scheduledInnings: number;
	strikes?: number;
	teams: {
		away: MlbLinescoreTeamTotals;
		home: MlbLinescoreTeamTotals;
	};
}

export interface MlbScheduleGame {
	calendarEventID: string;
	dayNight: string;
	description?: string;
	doubleHeader: string;
	gameDate: string;
	gamedayType: string;
	gameNumber: number;
	gamePk: number;
	gamesInSeries: number;
	gameType: string;
	ifNecessary: string;
	ifNecessaryDescription: string;
	inningBreakLength: number;
	isTie?: boolean;
	linescore?: MlbLinescore;
	officialDate: string;
	publicFacing: boolean;
	reverseHomeAwayStatus: boolean;
	scheduledInnings: number;
	season: string;
	seriesDescription: string;
	seriesGameNumber: number;
	status: {
		abstractGameCode: string;
		abstractGameState: string;
		codedGameState: string;
		detailedState: string;
		reason?: string;
		startTimeTBD: boolean;
		statusCode: string;
	};
	teams: {
		away: MlbScheduleTeam;
		home: MlbScheduleTeam;
	};
	tiebreaker: string;
	venue: {
		id: number;
		link: string;
		name: string;
	};
}

export interface MlbScheduleDate {
	date: string;
	events: unknown[];
	games: MlbScheduleGame[];
	totalEvents: number;
	totalGames: number;
	totalGamesInProgress: number;
	totalItems: number;
}

export interface MlbScheduleResponse {
	copyright: string;
	dates: MlbScheduleDate[];
	totalEvents: number;
	totalGames: number;
	totalGamesInProgress: number;
	totalItems: number;
}

/**
 * Simplified game data for upcoming/recent games display
 */
export interface UpcomingGame {
	awayTeam: {
		abbreviation: string;
		name: string;
		score?: number;
	};
	gameDate: string;
	gameType: GameType;
	homeTeam: {
		abbreviation: string;
		name: string;
		score?: number;
	};
	id: string;
	isHome: boolean;
	mlbGameId: number;
	opponent: {
		abbreviation: string;
		name: string;
	};
	status: GameState;
	venue: string;
}
