import { Game } from './game';
import { BaseDocument, Ref } from './mongo';

/**
 * Weather conditions for a game
 * Updated hourly via CRON for today's games
 */
export interface Weather extends BaseDocument {
	conditions: string; // e.g., "Clear", "Clouds", "Rain"
	fetchedAt: Date; // When this weather data was last fetched
	game: Ref<Game>;
	humidity: number; // Percentage
	temperature: number; // Fahrenheit
	windDirection: number; // Compass degrees (0=N, 90=E, 180=S, 270=W)
	windSpeed: number; // MPH
}

/**
 * National Weather Service API response structure
 * https://www.weather.gov/documentation/services-web-api
 */
export interface NwsGridpointForecast {
	properties: {
		periods: Array<{
			detailedForecast: string;
			endTime: string;
			isDaytime: boolean;
			relativeHumidity: {
				value: number; // Percentage
			};
			shortForecast: string;
			startTime: string;
			temperature: number; // Fahrenheit
			windDirection: string; // e.g., "NW", "SE"
			windSpeed: string; // e.g., "10 mph", "5 to 10 mph"
		}>;
	};
}

export interface NwsPointsResponse {
	properties: {
		forecast: string; // URL to gridpoint forecast
		forecastHourly: string; // URL to hourly forecast
	};
}
