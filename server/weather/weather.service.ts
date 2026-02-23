import { WeatherModel } from '@/models/weather.model';
import { NwsGridpointForecast, NwsPointsResponse, Weather } from '@/types';

import { BaseService } from '../base.service';

const NWS_API_BASE_URL = 'https://api.weather.gov';
const NWS_USER_AGENT = 'SpreadsOnToast/1.0 (contact@spreads-on-toast.com)'; // NWS requires User-Agent

class WeatherService extends BaseService<Weather> {
	constructor() {
		super(WeatherModel);
	}

	/**
	 * Find weather by game ID
	 */
	async findByGameId(gameId: string): Promise<null | Weather> {
		return this.findOne({ game: gameId });
	}

	/**
	 * Find weather for multiple games
	 */
	async findByGameIds(gameIds: string[]): Promise<Weather[]> {
		return this.find({ game: { $in: gameIds } });
	}

	/**
	 * Fetch forecast from National Weather Service API for a specific game time
	 */
	async fetchWeatherFromApi(
		lat: number,
		lng: number,
		gameTime: Date,
	): Promise<NwsGridpointForecast> {
		// Step 1: Get gridpoint metadata for this location
		const pointsUrl = `${NWS_API_BASE_URL}/points/${lat.toFixed(4)},${lng.toFixed(4)}`;

		console.log(`[NWS API] Fetching gridpoint: ${pointsUrl}`);

		const pointsResponse = await fetch(pointsUrl, {
			headers: {
				'User-Agent': NWS_USER_AGENT,
			},
		});

		if (!pointsResponse.ok) {
			const errorText = await pointsResponse.text();
			throw new Error(`NWS Points API error: ${pointsResponse.status} - ${errorText}`);
		}

		const pointsData: NwsPointsResponse = await pointsResponse.json();

		// Step 2: Fetch hourly forecast
		const forecastUrl = pointsData.properties.forecastHourly;

		console.log(`[NWS API] Fetching hourly forecast: ${forecastUrl}`);

		const forecastResponse = await fetch(forecastUrl, {
			headers: {
				'User-Agent': NWS_USER_AGENT,
			},
		});

		if (!forecastResponse.ok) {
			const errorText = await forecastResponse.text();
			throw new Error(`NWS Forecast API error: ${forecastResponse.status} - ${errorText}`);
		}

		return forecastResponse.json();
	}

	/**
	 * Convert compass direction (N, NE, E, etc.) to degrees
	 */
	private compassToDegrees(direction: string): number {
		const directions: Record<string, number> = {
			E: 90,
			ENE: 67.5,
			ESE: 112.5,
			N: 0,
			NE: 45,
			NNE: 22.5,
			NNW: 337.5,
			NW: 315,
			S: 180,
			SE: 135,
			SSE: 157.5,
			SSW: 202.5,
			SW: 225,
			W: 270,
			WNW: 292.5,
			WSW: 247.5,
		};

		return directions[direction] ?? 0;
	}

	/**
	 * Parse wind speed string (e.g., "10 mph", "5 to 10 mph") to number
	 */
	private parseWindSpeed(windSpeed: string): number {
		// Handle ranges like "5 to 10 mph" - take the average
		const rangeMatch = windSpeed.match(/(\d+)\s+to\s+(\d+)/);

		if (rangeMatch) {
			const low = parseInt(rangeMatch[1], 10);
			const high = parseInt(rangeMatch[2], 10);

			return Math.round((low + high) / 2);
		}

		// Handle single values like "10 mph"
		const singleMatch = windSpeed.match(/(\d+)/);

		return singleMatch ? parseInt(singleMatch[1], 10) : 0;
	}

	/**
	 * Convert NWS forecast response to our Weather format
	 * Finds the forecast period closest to game time
	 */
	transformWeatherData(
		apiResponse: NwsGridpointForecast,
		gameId: string,
		gameTime: Date,
	): Omit<Weather, 'createdAt' | 'id' | 'updatedAt'> {
		// Find the forecast period closest to game time
		const periods = apiResponse.properties.periods;
		let closestPeriod = periods[0];
		let minDiff = Math.abs(new Date(closestPeriod.startTime).getTime() - gameTime.getTime());

		for (const period of periods) {
			const periodStart = new Date(period.startTime);
			const diff = Math.abs(periodStart.getTime() - gameTime.getTime());

			if (diff < minDiff) {
				minDiff = diff;
				closestPeriod = period;
			}
		}

		return {
			conditions: closestPeriod.shortForecast,
			fetchedAt: new Date(),
			game: gameId,
			humidity: closestPeriod.relativeHumidity.value,
			temperature: closestPeriod.temperature,
			windDirection: this.compassToDegrees(closestPeriod.windDirection),
			windSpeed: this.parseWindSpeed(closestPeriod.windSpeed),
		};
	}

	/**
	 * Upsert weather data for a game
	 */
	async upsertWeather(
		gameId: string,
		weatherData: Omit<Weather, 'createdAt' | 'id' | 'updatedAt'>,
	): Promise<Weather> {
		const existing = await this.findByGameId(gameId);

		if (existing) {
			const updated = await this.findOneAndUpdate({ game: gameId }, weatherData);

			if (!updated) {
				throw new Error(`Failed to update weather for game ${gameId}`);
			}

			return updated;
		}

		return this.create(weatherData);
	}
}

export const weatherService = new WeatherService();
