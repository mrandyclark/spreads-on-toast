import { BaseDocument } from './mongo';

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
	isWinner?: boolean;
	leagueRecord: {
		losses: number;
		pct: string;
		wins: number;
	};
	score?: number;
	seriesNumber: number;
	splitSquad: boolean;
	team: string;
	teamMlbId: number;
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
	score?: number;
	seriesNumber: number;
	splitSquad: boolean;
	team: {
		id: number;
		link: string;
		name: string;
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
