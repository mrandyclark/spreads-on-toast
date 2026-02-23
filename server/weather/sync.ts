import { ballparkService } from '../ballparks/ballpark.service';
import { gameService } from '../schedule/game.service';
import { weatherService } from './weather.service';

/**
 * Sync weather data for all games on a given date
 * Called hourly via CRON for today's games
 */
export async function syncWeatherForDate(date: string): Promise<{
	errors: string[];
	skipped: number;
	updated: number;
}> {
	const errors: string[] = [];
	let updated = 0;
	let skipped = 0;

	try {
		// Get all games for the date
		const games = await gameService.findByDatePopulated(date);

		if (games.length === 0) {
			return { errors: [], skipped: 0, updated: 0 };
		}

		// Fetch weather for each game
		for (const game of games) {
			// Skip games that have already started (weather only useful for upcoming games)
			const gameTime = new Date(game.gameDate);
			const now = new Date();

			if (gameTime < now) {
				skipped++;
				continue;
			}
			try {
				// Get ballpark for coordinates
				const ballpark = await ballparkService.findByMlbVenueId(game.venue.mlbId);

				if (!ballpark) {
					errors.push(`Ballpark not found for venue ${game.venue.mlbId} (game ${game.id})`);
					continue;
				}

				// Fetch forecast from NWS API for game time
				const apiResponse = await weatherService.fetchWeatherFromApi(
					ballpark.location.lat,
					ballpark.location.lng,
					new Date(game.gameDate),
				);

				// Transform and upsert (finds forecast period closest to game time)
				const weatherData = weatherService.transformWeatherData(
					apiResponse,
					game.id,
					new Date(game.gameDate),
				);
				await weatherService.upsertWeather(game.id, weatherData);

				updated++;
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				errors.push(`Failed to fetch weather for game ${game.id}: ${message}`);
			}
		}

		return { errors, skipped, updated };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		errors.push(`Failed to sync weather: ${message}`);
		return { errors, skipped, updated };
	}
}
