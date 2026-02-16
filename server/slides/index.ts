import { getDivisionStandings } from '@/server/standings';
import { Slide, SlideType, SlidesResponse, StandingsSlide } from '@/types';

/**
 * Build all slides for a sign
 * Currently returns standings slides (one per division)
 * Future: add more slide types (picks, schedule, messages, etc.)
 */
export async function getSignSlides(date?: string): Promise<SlidesResponse> {
	const slides: Slide[] = [];

	// Build standings slides
	const standingsSlides = await buildStandingsSlides(date);
	slides.push(...standingsSlides);

	return {
		generatedAt: new Date().toISOString(),
		slides,
	};
}

/**
 * Build one slide per division from the current standings data
 */
async function buildStandingsSlides(date?: string): Promise<StandingsSlide[]> {
	const standings = await getDivisionStandings(date);

	if (!standings) {
		return [];
	}

	return standings.divisions.map((division) => ({
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
