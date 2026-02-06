/**
 * MLB Stats API Client
 * Fetches standings data from the official MLB Stats API
 * API Docs: https://statsapi.mlb.com
 */

import {
	ExpectedRecord,
	GameState,
	GameType,
	LeagueRecord,
	MlbScheduleGame,
	MlbScheduleResponse,
	Streak,
	TeamSplits,
} from '@/types';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

// League IDs
const AL_LEAGUE_ID = 103;
const NL_LEAGUE_ID = 104;

interface MlbStreak {
	streakCode: string;
	streakNumber: number;
	streakType: 'losses' | 'wins';
}

interface MlbSplitRecord {
	losses: number;
	pct: string;
	type: string;
	wins: number;
}

interface MlbExpectedRecord {
	losses: number;
	pct: string;
	type: string;
	wins: number;
}

interface MlbLeagueRecord {
	losses: number;
	pct: string;
	wins: number;
}

interface MlbTeamRecord {
	clinched: boolean;
	clinchIndicator?: string;
	divisionChamp?: boolean;
	divisionGamesBack?: string;
	divisionLeader?: boolean;
	divisionRank: string;
	eliminationNumber: string;
	gamesBack: string;
	gamesPlayed: number;
	hasWildcard?: boolean;
	leagueGamesBack?: string;
	leagueRank: string;
	leagueRecord?: MlbLeagueRecord;
	losses: number;
	records?: {
		expectedRecords?: MlbExpectedRecord[];
		splitRecords?: MlbSplitRecord[];
	};
	runDifferential: number;
	runsAllowed: number;
	runsScored: number;
	season: string;
	sportGamesBack?: string;
	sportRank?: string;
	streak?: MlbStreak;
	team: {
		id: number;
		link: string;
		name: string;
	};
	wildCardGamesBack: string;
	wildCardLeader?: boolean;
	wildCardRank?: string;
	winningPercentage: string;
	wins: number;
}

interface MlbDivisionStandings {
	division: {
		id: number;
		link: string;
	};
	league: {
		id: number;
		link: string;
	};
	standingsType: string;
	teamRecords: MlbTeamRecord[];
}

interface MlbStandingsResponse {
	copyright: string;
	records: MlbDivisionStandings[];
}

export interface TeamStandingData {
	// Playoff status
	clinched: boolean;
	clinchIndicator?: string;
	divisionChamp?: boolean;
	divisionGamesBack?: string;
	divisionLeader?: boolean;

	// Rankings
	divisionRank: number;
	eliminated: boolean;

	// Expected record from MLB
	expectedRecord?: ExpectedRecord;
	externalId: number;

	// Games back
	gamesBack: string;
	gamesPlayed: number;
	hasWildcard?: boolean;
	leagueGamesBack?: string;
	leagueRank: number;

	// League record
	leagueRecord?: LeagueRecord;
	losses: number;

	name: string;
	runDifferential: number;

	runsAllowed: number;
	// Run production
	runsScored: number;

	// Splits
	splits?: TeamSplits;
	sportGamesBack?: string;
	sportRank?: number;

	// Streak
	streak?: Streak;
	wildCardGamesBack: string;
	wildCardLeader?: boolean;

	wildCardRank?: number;
	// Core record
	wins: number;
}

/**
 * Map split type from MLB API to our field name
 */
const SPLIT_TYPE_MAP: Record<string, keyof TeamSplits> = {
	away: 'away',
	day: 'day',
	extraInning: 'extraInning',
	grass: 'grass',
	home: 'home',
	lastTen: 'lastTen',
	left: 'left',
	leftAway: 'leftAway',
	leftHome: 'leftHome',
	night: 'night',
	oneRun: 'oneRun',
	right: 'right',
	rightAway: 'rightAway',
	rightHome: 'rightHome',
	turf: 'turf',
	winners: 'winners',
};

/**
 * Parse split records from MLB API into our TeamSplits structure
 */
function parseSplitRecords(splitRecords?: MlbSplitRecord[]): TeamSplits | undefined {
	if (!splitRecords || splitRecords.length === 0) {
		return undefined;
	}

	const splits: TeamSplits = {};

	for (const split of splitRecords) {
		const fieldName = SPLIT_TYPE_MAP[split.type];

		if (fieldName) {
			splits[fieldName] = {
				losses: split.losses,
				pct: split.pct,
				wins: split.wins,
			};
		}
	}

	return Object.keys(splits).length > 0 ? splits : undefined;
}

/**
 * Parse expected record from MLB API
 */
function parseExpectedRecord(expectedRecords?: MlbExpectedRecord[]): ExpectedRecord | undefined {
	if (!expectedRecords || expectedRecords.length === 0) {
		return undefined;
	}

	// Find xWinLoss type first, otherwise use first entry
	const xWinLoss = expectedRecords.find((r) => r.type === 'xWinLoss') ?? expectedRecords[0];

	return {
		losses: xWinLoss.losses,
		pct: xWinLoss.pct,
		source: 'mlb',
		type: xWinLoss.type,
		wins: xWinLoss.wins,
	};
}

/**
 * Fetch MLB standings for a given season and optional date
 * @param season - The season year (e.g., '2026')
 * @param date - Optional date in YYYY-MM-DD format for historical data
 */
export async function fetchMlbStandings(
	season: string,
	date?: string,
): Promise<TeamStandingData[]> {
	const url = new URL(`${MLB_API_BASE}/standings`);
	url.searchParams.set('leagueId', `${AL_LEAGUE_ID},${NL_LEAGUE_ID}`);
	url.searchParams.set('season', season);

	if (date) {
		url.searchParams.set('date', date);
	}

	const response = await fetch(url.toString());

	if (!response.ok) {
		throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
	}

	const data: MlbStandingsResponse = await response.json();

	// Flatten all team records from all divisions
	const standings: TeamStandingData[] = [];

	for (const division of data.records) {
		for (const record of division.teamRecords) {
			// Parse streak if present
			let streak: Streak | undefined;

			if (record.streak) {
				streak = {
					code: record.streak.streakCode,
					count: record.streak.streakNumber,
					type: record.streak.streakType,
				};
			}

			// Check if eliminated (eliminationNumber is a number, not "-")
			const eliminated = record.eliminationNumber !== '-' && record.eliminationNumber === '0';

			// Parse splits
			const splits = parseSplitRecords(record.records?.splitRecords);

			// Parse expected record
			const expectedRecord = parseExpectedRecord(record.records?.expectedRecords);

			// Parse league record
			const leagueRecord: LeagueRecord | undefined = record.leagueRecord
				? {
					losses: record.leagueRecord.losses,
					pct: record.leagueRecord.pct,
					wins: record.leagueRecord.wins,
				}
				: undefined;

			standings.push({
				externalId: record.team.id,
				name: record.team.name,

				// Core record
				gamesPlayed: record.gamesPlayed,
				losses: record.losses,
				wins: record.wins,

				// Rankings (parse from string to number)
				divisionRank: parseInt(record.divisionRank, 10),
				leagueRank: parseInt(record.leagueRank, 10),
				sportRank: record.sportRank ? parseInt(record.sportRank, 10) : undefined,
				wildCardRank: record.wildCardRank ? parseInt(record.wildCardRank, 10) : undefined,

				// Games back
				divisionGamesBack: record.divisionGamesBack,
				gamesBack: record.gamesBack,
				leagueGamesBack: record.leagueGamesBack,
				sportGamesBack: record.sportGamesBack,
				wildCardGamesBack: record.wildCardGamesBack,

				// Run production
				runDifferential: record.runDifferential,
				runsAllowed: record.runsAllowed,
				runsScored: record.runsScored,

				// Streak
				streak,

				// Playoff status
				clinched: record.clinched,
				clinchIndicator: record.clinchIndicator,
				divisionChamp: record.divisionChamp,
				divisionLeader: record.divisionLeader,
				eliminated,
				hasWildcard: record.hasWildcard,
				wildCardLeader: record.wildCardLeader,

				// Splits
				splits,

				// Expected record
				expectedRecord,

				// League record
				leagueRecord,
			});
		}
	}

	return standings;
}

/**
 * Calculate projected wins based on current pace
 * @param wins - Current wins
 * @param gamesPlayed - Games played so far
 * @param totalGames - Total games in season (default 162 for MLB)
 * @param forDisplay - If true, round to 1 decimal for display; if false, return full precision for calculations
 */
export function calculateProjectedWins(
	wins: number,
	gamesPlayed: number,
	totalGames = 162,
	forDisplay = true,
): number {
	if (gamesPlayed === 0) {
		return 0;
	}

	const projected = (wins / gamesPlayed) * totalGames;
	return forDisplay ? Math.round(projected * 10) / 10 : projected;
}

/**
 * Calculate Pythagorean wins (expected wins based on run differential)
 * Uses the Pythagorean expectation formula: RS^1.83 / (RS^1.83 + RA^1.83)
 * The exponent 1.83 is commonly used for baseball
 */
export function calculatePythagoreanWins(
	runsScored: number,
	runsAllowed: number,
	gamesPlayed: number,
	totalGames = 162,
): number {
	if (gamesPlayed === 0 || runsScored === 0 || runsAllowed === 0) {
		return 0;
	}

	const exponent = 1.83;
	const winPct =
		Math.pow(runsScored, exponent) /
		(Math.pow(runsScored, exponent) + Math.pow(runsAllowed, exponent));
	const projectedWins = winPct * totalGames;

	return Math.round(projectedWins * 10) / 10; // Round to 1 decimal
}

/**
 * Normalized game data from MLB Schedule API
 */
export interface ScheduleGameData {
	awayIsWinner?: boolean;
	awayLeagueRecord: { losses: number; pct: string; wins: number };
	awayScore?: number;
	awaySeriesNumber: number;
	awaySplitSquad: boolean;
	awayTeamMlbId: number;
	awayTeamName: string;
	calendarEventId: string;
	dayNight: 'day' | 'night';
	description?: string;
	doubleHeader: 'N' | 'S' | 'Y';
	gameDate: Date;
	gamedayType: string;
	gameNumber: number;
	gamesInSeries: number;
	gameType: GameType;
	homeIsWinner?: boolean;
	homeLeagueRecord: { losses: number; pct: string; wins: number };
	homeScore?: number;
	homeSeriesNumber: number;
	homeSplitSquad: boolean;
	homeTeamMlbId: number;
	homeTeamName: string;
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
	status: {
		abstractGameCode: string;
		abstractGameState: GameState;
		codedGameState: string;
		detailedState: string;
		reason?: string;
		startTimeTBD: boolean;
		statusCode: string;
	};
	tiebreaker: boolean;
	venueMlbId: number;
	venueName: string;
}

/**
 * Map MLB API game type to our GameType enum
 */
function mapGameType(gameType: string): GameType {
	switch (gameType) {
		case 'S':
			return GameType.SpringTraining;
		case 'R':
			return GameType.RegularSeason;
		case 'E':
			return GameType.Exhibition;
		case 'F':
			return GameType.WildCard;
		case 'D':
			return GameType.DivisionSeries;
		case 'L':
			return GameType.LeagueChampionship;
		case 'W':
			return GameType.WorldSeries;
		case 'P':
			return GameType.Postseason;
		default:
			return GameType.RegularSeason;
	}
}

/**
 * Map MLB API game state to our GameState enum
 */
function mapGameState(state: string): GameState {
	switch (state) {
		case 'Final':
			return GameState.Final;
		case 'Live':
			return GameState.Live;
		case 'Preview':
		default:
			return GameState.Preview;
	}
}

/**
 * Transform MLB API game to normalized format
 */
function transformGame(game: MlbScheduleGame): ScheduleGameData {
	return {
		awayIsWinner: game.teams.away.isWinner,
		awayLeagueRecord: {
			losses: game.teams.away.leagueRecord.losses,
			pct: game.teams.away.leagueRecord.pct,
			wins: game.teams.away.leagueRecord.wins,
		},
		awayScore: game.teams.away.score,
		awaySeriesNumber: game.teams.away.seriesNumber,
		awaySplitSquad: game.teams.away.splitSquad,
		awayTeamMlbId: game.teams.away.team.id,
		awayTeamName: game.teams.away.team.name,
		calendarEventId: game.calendarEventID,
		dayNight: game.dayNight === 'night' ? 'night' : 'day',
		description: game.description,
		doubleHeader: game.doubleHeader as 'N' | 'S' | 'Y',
		gameDate: new Date(game.gameDate),
		gamedayType: game.gamedayType,
		gameNumber: game.gameNumber,
		gamesInSeries: game.gamesInSeries,
		gameType: mapGameType(game.gameType),
		homeIsWinner: game.teams.home.isWinner,
		homeLeagueRecord: {
			losses: game.teams.home.leagueRecord.losses,
			pct: game.teams.home.leagueRecord.pct,
			wins: game.teams.home.leagueRecord.wins,
		},
		homeScore: game.teams.home.score,
		homeSeriesNumber: game.teams.home.seriesNumber,
		homeSplitSquad: game.teams.home.splitSquad,
		homeTeamMlbId: game.teams.home.team.id,
		homeTeamName: game.teams.home.team.name,
		ifNecessary: game.ifNecessary === 'Y',
		ifNecessaryDescription: game.ifNecessaryDescription,
		inningBreakLength: game.inningBreakLength,
		isTie: game.isTie,
		mlbGameId: game.gamePk,
		officialDate: game.officialDate,
		publicFacing: game.publicFacing,
		reverseHomeAwayStatus: game.reverseHomeAwayStatus,
		scheduledInnings: game.scheduledInnings,
		season: game.season,
		seriesDescription: game.seriesDescription,
		seriesGameNumber: game.seriesGameNumber,
		status: {
			abstractGameCode: game.status.abstractGameCode,
			abstractGameState: mapGameState(game.status.abstractGameState),
			codedGameState: game.status.codedGameState,
			detailedState: game.status.detailedState,
			reason: game.status.reason,
			startTimeTBD: game.status.startTimeTBD,
			statusCode: game.status.statusCode,
		},
		tiebreaker: game.tiebreaker === 'Y',
		venueMlbId: game.venue.id,
		venueName: game.venue.name,
	};
}

/**
 * Fetch schedule for a team from MLB Stats API
 * @param teamMlbId - MLB team ID (e.g., 113 for Reds)
 * @param season - Season year (e.g., '2026')
 * @returns Array of normalized game data
 */
export async function fetchMlbSchedule(
	teamMlbId: number,
	season: string,
): Promise<ScheduleGameData[]> {
	const url = `${MLB_API_BASE}/schedule?sportId=1&teamId=${teamMlbId}&season=${season}&startDate=${season}-01-01&endDate=${season}-12-31&gameType=R,F,D,L,W`;

	console.log(`[MLB API] Fetching schedule for team ${teamMlbId}, season ${season}`);

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
	}

	const data: MlbScheduleResponse = await response.json();

	const games: ScheduleGameData[] = [];

	for (const dateEntry of data.dates) {
		for (const game of dateEntry.games) {
			games.push(transformGame(game));
		}
	}

	console.log(`[MLB API] Fetched ${games.length} games for team ${teamMlbId}`);

	return games;
}

/**
 * Fetch schedule for all MLB teams for a season
 * Note: This fetches by team, so games will be duplicated (once per team)
 * The sync function should handle deduplication by mlbGameId
 */
export async function fetchAllMlbSchedules(
	season: string,
	teamMlbIds: number[],
): Promise<ScheduleGameData[]> {
	const allGames: ScheduleGameData[] = [];
	const seenMlbGameIds = new Set<number>();

	for (const teamMlbId of teamMlbIds) {
		try {
			const games = await fetchMlbSchedule(teamMlbId, season);

			for (const game of games) {
				if (!seenMlbGameIds.has(game.mlbGameId)) {
					seenMlbGameIds.add(game.mlbGameId);
					allGames.push(game);
				}
			}

			// Small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (error) {
			console.error(`[MLB API] Error fetching schedule for team ${teamMlbId}:`, error);
		}
	}

	console.log(`[MLB API] Fetched ${allGames.length} unique games for season ${season}`);

	return allGames;
}
