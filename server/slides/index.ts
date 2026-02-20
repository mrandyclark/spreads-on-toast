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
 * Slide order: standings (by division) → last game box scores → next game previews
 */
export async function getSignSlides(
	contentConfig?: SignContentConfig,
	date?: string,
): Promise<SlidesResponse> {
	const slides: Slide[] = [];

	// Build standings slides (filtered to selected divisions)
	const standingsSlides = await buildStandingsSlides(contentConfig?.standingsDivisions, date);
	slides.push(...standingsSlides);

	// Build last game box score slides
	const lastGameSlides = await buildLastGameSlides(contentConfig?.lastGameTeamIds ?? []);
	slides.push(...lastGameSlides);

	// Build next game slides
	const nextGameSlides = await buildNextGameSlides(contentConfig?.nextGameTeamIds ?? []);
	slides.push(...nextGameSlides);

	return {
		generatedAt: new Date().toISOString(),
		slides,
	};
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
 * Build box score slides for the last completed game of each selected team.
 * Away team is always listed first. Deduplication is handled by getLastGameForTeams.
 */
async function buildLastGameSlides(teamIds: string[]): Promise<LastGameSlide[]> {
	if (teamIds.length === 0) {
		return [];
	}

	const games = await getLastGameForTeams(teamIds);

	return games.map((game) => gameToLastGameSlide(game));
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
 * Build next game slides for each selected team.
 * Deduplication is handled by getNextGameForTeams.
 */
async function buildNextGameSlides(teamIds: string[]): Promise<NextGameSlide[]> {
	if (teamIds.length === 0) {
		return [];
	}

	const games = await getNextGameForTeams(teamIds);
	const slides: NextGameSlide[] = [];

	for (const game of games) {
		// Determine which selected team this slide is "for"
		// If both teams are selected, create a slide for the first one found
		const homeTeamSelected = teamIds.includes(game.homeTeam.team?._id ?? '');
		const isHome = homeTeamSelected;

		const team = isHome ? game.homeTeam : game.awayTeam;
		const opponent = isHome ? game.awayTeam : game.homeTeam;

		slides.push({
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
		});
	}

	return slides;
}
