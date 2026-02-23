'use server';

import { resolveRef } from '@/lib/ref-utils';
import { ballparkService } from '@/server/ballparks/ballpark.service';
import { gameService } from '@/server/schedule/game.service';
import { weatherService } from '@/server/weather/weather.service';
import { Game, Sport, Team } from '@/types';

/**
 * Serializable game card data for the game day page
 */
export interface GameDayCard {
	awayPitcher: null | string;
	awayRecord: string;
	awayTeamAbbreviation: string;
	awayTeamCity: string;
	awayTeamColors?: { primary: string; secondary: string };
	awayTeamId: string;
	awayTeamName: string;
	dayNight: 'day' | 'night';
	gameDate: string;
	gameId: string;
	homePitcher: null | string;
	homeRecord: string;
	homeTeamAbbreviation: string;
	homeTeamCity: string;
	homeTeamColors?: { primary: string; secondary: string };
	homeTeamId: string;
	homeTeamName: string;
	status: string;
	venue: null | {
		elevation: number;
		fieldOrientation: number;
		name: string;
		roofType: string;
	};
	weather: null | {
		conditions: string;
		humidity: number;
		temperature: number;
		windDirection: number;
		windSpeed: number;
	};
}

function formatRecord(record: { losses: number; wins: number }): string {
	return `${record.wins}-${record.losses}`;
}

function toGameDayCard(
	game: Game,
	venueMap: Map<number, { elevation: number; fieldOrientation: number; roofType: string }>,
	weatherMap: Map<string, { conditions: string; humidity: number; temperature: number; windDirection: number; windSpeed: number }>,
): GameDayCard | null {
	const awayTeam = resolveRef<Team>(game.awayTeam.team);
	const homeTeam = resolveRef<Team>(game.homeTeam.team);

	if (!awayTeam || !homeTeam) {
		return null;
	}

	const venueData = venueMap.get(game.venue.mlbId);
	const weatherData = weatherMap.get(game.id);

	return {
		awayPitcher: game.awayTeam.probablePitcher?.fullName ?? null,
		awayRecord: formatRecord(game.awayTeam.leagueRecord),
		awayTeamAbbreviation: awayTeam.abbreviation,
		awayTeamCity: awayTeam.city,
		awayTeamColors: awayTeam.colors,
		awayTeamId: awayTeam.id,
		awayTeamName: awayTeam.name,
		dayNight: game.dayNight,
		gameDate: game.gameDate.toISOString(),
		gameId: game.id,
		homePitcher: game.homeTeam.probablePitcher?.fullName ?? null,
		homeRecord: formatRecord(game.homeTeam.leagueRecord),
		homeTeamAbbreviation: homeTeam.abbreviation,
		homeTeamCity: homeTeam.city,
		homeTeamColors: homeTeam.colors,
		homeTeamId: homeTeam.id,
		homeTeamName: homeTeam.name,
		status: game.status.abstractGameState,
		venue: venueData
			? {
					elevation: venueData.elevation,
					fieldOrientation: venueData.fieldOrientation,
					name: game.venue.name,
					roofType: venueData.roofType,
				}
			: null,
		weather: weatherData
			? {
					conditions: weatherData.conditions,
					humidity: weatherData.humidity,
					temperature: weatherData.temperature,
					windDirection: weatherData.windDirection,
					windSpeed: weatherData.windSpeed,
				}
			: null,
	};
}

/**
 * Get all games for a given date with ballpark and weather data
 */
export async function getGameDayData(date: string): Promise<GameDayCard[]> {
	const [games, ballparks] = await Promise.all([
		gameService.findByDatePopulated(date),
		ballparkService.findBySport(Sport.MLB),
	]);

	// Fetch weather for all games
	const gameIds = games.map((g) => g.id);
	const weatherData = await weatherService.findByGameIds(gameIds);

	const venueMap = new Map(
		ballparks.map((bp) => [
			bp.mlbVenueId,
			{
				elevation: bp.elevation,
				fieldOrientation: bp.fieldOrientation,
				roofType: bp.roofType,
			},
		]),
	);

	const weatherMap = new Map(
		weatherData.map((w) => [
			w.game as string,
			{
				conditions: w.conditions,
				humidity: w.humidity,
				temperature: w.temperature,
				windDirection: w.windDirection,
				windSpeed: w.windSpeed,
			},
		]),
	);

	return games
		.map((game) => toGameDayCard(game, venueMap, weatherMap))
		.filter((card): card is GameDayCard => card !== null);
}

/**
 * Get available game dates for a season
 */
export async function getGameDates(season: string): Promise<string[]> {
	const dates = await gameService.distinct<string>('officialDate', {
		gameType: 'R',
		publicFacing: true,
		season,
	});

	return dates.sort().reverse();
}
