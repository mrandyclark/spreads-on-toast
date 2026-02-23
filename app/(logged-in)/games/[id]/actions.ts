'use server';

import { ballparkService } from '@/server/ballparks/ballpark.service';
import { gameService } from '@/server/schedule/game.service';
import { weatherService } from '@/server/weather/weather.service';
import { Ballpark, Game, Weather } from '@/types';

/**
 * Get game detail with populated teams, ballpark, and weather data
 */
export async function getGameDetail(gameId: string): Promise<{
	ballpark: Ballpark | null;
	game: Game | null;
	weather: Weather | null;
}> {
	const game = await gameService.findByIdPopulated(gameId);

	if (!game) {
		return { ballpark: null, game: null, weather: null };
	}

	const [ballpark, weather] = await Promise.all([
		ballparkService.findByMlbVenueId(game.venue.mlbId),
		weatherService.findByGameId(gameId),
	]);

	return { ballpark, game, weather };
}
