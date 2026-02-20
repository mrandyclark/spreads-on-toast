import { getLastGameForTeams, getNextGameForTeams, PopulatedGame } from '@/server/schedule';
import { getDivisionStandings } from '@/server/standings';
import {
	LastGameSlide,
	NextGameSlide,
	SignContentConfig,
	Slide,
	SlidesResponse,
	SlideType,
	StandingsSlide,
} from '@/types';

/**
 * Build all slides for a sign based on its content configuration.
 *
 * Slide order:
 *   1. Standings (one per selected division)
 *   2. Per-team game slides, grouped by team in config order:
 *      - Team's last game (box score)
 *      - Team's next game (preview)
 *
 * If two teams played each other in their last game, the shared box score
 * appears once under the first team, and the second team skips to its next game.
 *
 * Example (Reds & Dodgers, different last games):
 *   NL East → NL Central → NL West → Reds last → Reds next → Dodgers last → Dodgers next
 *
 * Example (Reds & Dodgers played each other):
 *   NL East → NL Central → NL West → CIN/LAD box score → Reds next → Dodgers next
 */
export async function getSignSlides(
	contentConfig?: SignContentConfig,
	date?: string,
): Promise<SlidesResponse> {
	const slides: Slide[] = [];

	// Build standings slides (filtered to selected divisions)
	const standingsSlides = await buildStandingsSlides(contentConfig?.standingsDivisions, date);
	slides.push(...standingsSlides);

	// Build per-team game slides (last game → next game, grouped by team)
	const gameSlides = await buildTeamGameSlides(contentConfig, date);
	slides.push(...gameSlides);

	return {
		generatedAt: new Date().toISOString(),
		slides,
	};
}

/**
 * Build game slides grouped by team.
 * For each team: last game box score, then next game preview.
 * Deduplicates shared last games across teams.
 */
async function buildTeamGameSlides(
	contentConfig?: SignContentConfig,
	date?: string,
): Promise<Slide[]> {
	const lastGameTeamIds = contentConfig?.lastGameTeamIds ?? [];
	const nextGameTeamIds = contentConfig?.nextGameTeamIds ?? [];

	// Get the union of all team IDs we need data for
	const allTeamIds = [...new Set([...lastGameTeamIds, ...nextGameTeamIds])];

	if (allTeamIds.length === 0) {
		return [];
	}

	// Fetch all last games and next games upfront (these already deduplicate by mlbGameId)
	const [lastGames, nextGames] = await Promise.all([
		getLastGameForTeams(lastGameTeamIds, date),
		getNextGameForTeams(nextGameTeamIds, date),
	]);

	// Index last games by team ID for quick lookup
	const lastGameByTeamId = new Map<string, PopulatedGame>();

	for (const game of lastGames) {
		const homeId = game.homeTeam.team?.id;
		const awayId = game.awayTeam.team?.id;

		if (homeId) {
			lastGameByTeamId.set(homeId, game);
		}

		if (awayId) {
			lastGameByTeamId.set(awayId, game);
		}
	}

	// Index next games by team ID for quick lookup
	const nextGameByTeamId = new Map<string, PopulatedGame>();

	for (const game of nextGames) {
		const homeId = game.homeTeam.team?.id;
		const awayId = game.awayTeam.team?.id;

		if (homeId) {
			nextGameByTeamId.set(homeId, game);
		}

		if (awayId) {
			nextGameByTeamId.set(awayId, game);
		}
	}

	// Build slides grouped by team, deduplicating shared last games
	const slides: Slide[] = [];
	const emittedLastGameIds = new Set<number>();
	const emittedNextGameIds = new Set<number>();

	for (const teamId of allTeamIds) {
		// Last game for this team (skip if already emitted as a shared game)
		if (lastGameTeamIds.includes(teamId)) {
			const lastGame = lastGameByTeamId.get(teamId);

			if (lastGame && !emittedLastGameIds.has(lastGame.mlbGameId)) {
				emittedLastGameIds.add(lastGame.mlbGameId);
				slides.push(gameToLastGameSlide(lastGame));
			}
		}

		// Next game for this team (skip if already emitted as a shared game)
		if (nextGameTeamIds.includes(teamId)) {
			const nextGame = nextGameByTeamId.get(teamId);

			if (nextGame && !emittedNextGameIds.has(nextGame.mlbGameId)) {
				emittedNextGameIds.add(nextGame.mlbGameId);
				slides.push(gameToNextGameSlide(nextGame, teamId));
			}
		}
	}

	return slides;
}

/**
 * Build one slide per division from the current standings data.
 * If divisions are specified, only those divisions are included.
 * If no divisions are specified, all divisions are included.
 */
async function buildStandingsSlides(
	divisions?: string[],
	date?: string,
): Promise<StandingsSlide[]> {
	const standings = await getDivisionStandings(date);

	if (!standings) {
		return [];
	}

	// Filter to selected divisions if specified
	// Division enum values are like 'AL_East', standings names are like 'AL East'
	const filteredDivisions = divisions && divisions.length > 0
		? standings.divisions.filter((d) => divisions.includes(d.name.replace(' ', '_')))
		: standings.divisions;

	return filteredDivisions.map((division) => ({
		slideType: SlideType.STANDINGS as const,
		teams: division.teams.map((team) => ({
			abbreviation: team.abbreviation,
			colors: team.colors,
			gamesBack: team.gamesBack,
			losses: team.losses,
			name: team.name,
			rank: team.rank,
			wins: team.wins,
		})),
		title: division.name,
	}));
}

/**
 * Convert a populated game to a LastGameSlide
 */
function gameToLastGameSlide(game: PopulatedGame): LastGameSlide {
	return {
		awayTeam: {
			abbreviation: game.awayTeam.team?.abbreviation ?? 'TBD',
			colors: game.awayTeam.team?.colors,
			errors: game.awayTeam.errors ?? 0,
			hits: game.awayTeam.hits ?? 0,
			name: game.awayTeam.team?.name ?? 'TBD',
			runs: game.awayTeam.score ?? 0,
		},
		gameDate: game.gameDate.toISOString(),
		homeTeam: {
			abbreviation: game.homeTeam.team?.abbreviation ?? 'TBD',
			colors: game.homeTeam.team?.colors,
			errors: game.homeTeam.errors ?? 0,
			hits: game.homeTeam.hits ?? 0,
			name: game.homeTeam.team?.name ?? 'TBD',
			runs: game.homeTeam.score ?? 0,
		},
		slideType: SlideType.LAST_GAME,
	};
}

/**
 * Convert a populated game to a NextGameSlide for a specific team
 */
function gameToNextGameSlide(
	game: PopulatedGame,
	teamId: string,
): NextGameSlide {
	const homeId = game.homeTeam.team?.id ?? '';
	const isHomeForTeam = homeId === teamId;

	// If this team is the home team, use home perspective; otherwise away
	const isHome = isHomeForTeam;
	const team = isHome ? game.homeTeam : game.awayTeam;
	const opponent = isHome ? game.awayTeam : game.homeTeam;

	return {
		gameDate: game.gameDate.toISOString(),
		isHome,
		opponent: {
			abbreviation: opponent.team?.abbreviation ?? 'TBD',
			colors: opponent.team?.colors,
			name: opponent.team?.name ?? 'TBD',
		},
		slideType: SlideType.NEXT_GAME,
		team: {
			abbreviation: team.team?.abbreviation ?? 'TBD',
			colors: team.team?.colors,
			name: team.team?.name ?? 'TBD',
		},
		venue: game.venue.name,
	};
}
