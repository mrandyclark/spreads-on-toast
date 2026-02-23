import { randomUUID } from 'crypto';

import { dbConnect } from '@/lib/mongoose';
import { BallparkModel } from '@/models/ballpark.model';
import { Sport, Team } from '@/types';

import { teamService } from '../teams/team.service';

/**
 * Ballpark seed data.
 * - fieldOrientation: compass degrees from home plate → center field (0=N, 90=E, 180=S, 270=W)
 * - elevation: feet above sea level
 * - mlbVenueId: from MLB Stats API (Game.venue.mlbId)
 *
 * Field orientations sourced from: https://en.wikipedia.org/wiki/Orientation_of_churches#Baseball
 * and individual ballpark references. Values are approximate (±5°).
 */
const BALLPARK_DATA: {
	city: string;
	elevation: number;
	fieldOrientation: number;
	lat: number;
	lng: number;
	mlbVenueId: number;
	name: string;
	roofType: 'dome' | 'open' | 'retractable';
	state: string;
	teamAbbreviation: string;
}[] = [
	// eslint-disable-next-line perfectionist/sort-objects
	{ teamAbbreviation: 'AZ', name: 'Chase Field', lat: 33.45, lng: -112.07, city: 'Phoenix', state: 'AZ', mlbVenueId: 15, fieldOrientation: 198, roofType: 'retractable', elevation: 1082 },
	{ city: 'Atlanta', elevation: 1050, fieldOrientation: 225, lat: 33.89, lng: -84.47, mlbVenueId: 4705, name: 'Truist Park', roofType: 'open', state: 'GA', teamAbbreviation: 'ATL' },
	{ city: 'Baltimore', elevation: 30, fieldOrientation: 218, lat: 39.28, lng: -76.62, mlbVenueId: 2, name: 'Oriole Park at Camden Yards', roofType: 'open', state: 'MD', teamAbbreviation: 'BAL' },
	{ city: 'Boston', elevation: 20, fieldOrientation: 65, lat: 42.35, lng: -71.10, mlbVenueId: 3, name: 'Fenway Park', roofType: 'open', state: 'MA', teamAbbreviation: 'BOS' },
	{ city: 'Chicago', elevation: 600, fieldOrientation: 198, lat: 41.95, lng: -87.66, mlbVenueId: 17, name: 'Wrigley Field', roofType: 'open', state: 'IL', teamAbbreviation: 'CHC' },
	{ city: 'Chicago', elevation: 595, fieldOrientation: 225, lat: 41.83, lng: -87.63, mlbVenueId: 4, name: 'Rate Field', roofType: 'open', state: 'IL', teamAbbreviation: 'CWS' },
	{ city: 'Cincinnati', elevation: 490, fieldOrientation: 195, lat: 39.10, lng: -84.51, mlbVenueId: 2602, name: 'Great American Ball Park', roofType: 'open', state: 'OH', teamAbbreviation: 'CIN' },
	{ city: 'Cleveland', elevation: 660, fieldOrientation: 195, lat: 41.50, lng: -81.69, mlbVenueId: 5, name: 'Progressive Field', roofType: 'open', state: 'OH', teamAbbreviation: 'CLE' },
	{ city: 'Denver', elevation: 5280, fieldOrientation: 225, lat: 39.76, lng: -104.99, mlbVenueId: 19, name: 'Coors Field', roofType: 'open', state: 'CO', teamAbbreviation: 'COL' },
	{ city: 'Detroit', elevation: 600, fieldOrientation: 215, lat: 42.34, lng: -83.05, mlbVenueId: 2394, name: 'Comerica Park', roofType: 'open', state: 'MI', teamAbbreviation: 'DET' },
	{ city: 'Houston', elevation: 40, fieldOrientation: 225, lat: 29.76, lng: -95.36, mlbVenueId: 2392, name: 'Minute Maid Park', roofType: 'retractable', state: 'TX', teamAbbreviation: 'HOU' },
	{ city: 'Kansas City', elevation: 820, fieldOrientation: 225, lat: 39.05, lng: -94.48, mlbVenueId: 7, name: 'Kauffman Stadium', roofType: 'open', state: 'MO', teamAbbreviation: 'KC' },
	{ city: 'Anaheim', elevation: 160, fieldOrientation: 225, lat: 33.80, lng: -117.88, mlbVenueId: 1, name: 'Angel Stadium of Anaheim', roofType: 'open', state: 'CA', teamAbbreviation: 'LAA' },
	{ city: 'Los Angeles', elevation: 515, fieldOrientation: 225, lat: 34.07, lng: -118.24, mlbVenueId: 22, name: 'Dodger Stadium', roofType: 'open', state: 'CA', teamAbbreviation: 'LAD' },
	{ city: 'Miami', elevation: 7, fieldOrientation: 225, lat: 25.78, lng: -80.22, mlbVenueId: 4169, name: 'loanDepot Park', roofType: 'retractable', state: 'FL', teamAbbreviation: 'MIA' },
	{ city: 'Milwaukee', elevation: 635, fieldOrientation: 225, lat: 43.03, lng: -87.97, mlbVenueId: 32, name: 'American Family Field', roofType: 'retractable', state: 'WI', teamAbbreviation: 'MIL' },
	{ city: 'Minneapolis', elevation: 815, fieldOrientation: 225, lat: 44.98, lng: -93.28, mlbVenueId: 3312, name: 'Target Field', roofType: 'open', state: 'MN', teamAbbreviation: 'MIN' },
	{ city: 'New York', elevation: 20, fieldOrientation: 225, lat: 40.76, lng: -73.85, mlbVenueId: 3289, name: 'Citi Field', roofType: 'open', state: 'NY', teamAbbreviation: 'NYM' },
	{ city: 'New York', elevation: 55, fieldOrientation: 225, lat: 40.83, lng: -73.93, mlbVenueId: 3313, name: 'Yankee Stadium', roofType: 'open', state: 'NY', teamAbbreviation: 'NYY' },
	{ city: 'Sacramento', elevation: 25, fieldOrientation: 225, lat: 38.58, lng: -121.51, mlbVenueId: 2529, name: 'Sutter Health Park', roofType: 'open', state: 'CA', teamAbbreviation: 'OAK' },
	{ city: 'Philadelphia', elevation: 20, fieldOrientation: 225, lat: 39.91, lng: -75.17, mlbVenueId: 2681, name: 'Citizens Bank Park', roofType: 'open', state: 'PA', teamAbbreviation: 'PHI' },
	{ city: 'Pittsburgh', elevation: 730, fieldOrientation: 225, lat: 40.45, lng: -80.01, mlbVenueId: 31, name: 'PNC Park', roofType: 'open', state: 'PA', teamAbbreviation: 'PIT' },
	{ city: 'San Diego', elevation: 15, fieldOrientation: 225, lat: 32.71, lng: -117.16, mlbVenueId: 2680, name: 'Petco Park', roofType: 'open', state: 'CA', teamAbbreviation: 'SD' },
	{ city: 'San Francisco', elevation: 5, fieldOrientation: 225, lat: 37.78, lng: -122.39, mlbVenueId: 2395, name: 'Oracle Park', roofType: 'open', state: 'CA', teamAbbreviation: 'SF' },
	{ city: 'Seattle', elevation: 20, fieldOrientation: 225, lat: 47.59, lng: -122.33, mlbVenueId: 680, name: 'T-Mobile Park', roofType: 'retractable', state: 'WA', teamAbbreviation: 'SEA' },
	{ city: 'St. Louis', elevation: 465, fieldOrientation: 225, lat: 38.62, lng: -90.19, mlbVenueId: 2889, name: 'Busch Stadium', roofType: 'open', state: 'MO', teamAbbreviation: 'STL' },
	{ city: 'St. Petersburg', elevation: 45, fieldOrientation: 225, lat: 27.77, lng: -82.65, mlbVenueId: 12, name: 'Tropicana Field', roofType: 'dome', state: 'FL', teamAbbreviation: 'TB' },
	{ city: 'Arlington', elevation: 545, fieldOrientation: 225, lat: 32.75, lng: -97.08, mlbVenueId: 5325, name: 'Globe Life Field', roofType: 'retractable', state: 'TX', teamAbbreviation: 'TEX' },
	{ city: 'Toronto', elevation: 250, fieldOrientation: 315, lat: 43.64, lng: -79.39, mlbVenueId: 14, name: 'Rogers Centre', roofType: 'retractable', state: 'ON', teamAbbreviation: 'TOR' },
	{ city: 'Washington', elevation: 25, fieldOrientation: 225, lat: 38.87, lng: -77.01, mlbVenueId: 3309, name: 'Nationals Park', roofType: 'open', state: 'DC', teamAbbreviation: 'WSH' },
];

/**
 * Seed all 30 MLB ballparks.
 * Matches teams by abbreviation. Upserts by mlbVenueId.
 */
export async function seedBallparks(): Promise<{ created: number; errors: string[]; updated: number }> {
	await dbConnect();

	const teams = await teamService.findBySport(Sport.MLB);
	const teamsByAbbr = new Map<string, Team>(teams.map((t) => [t.abbreviation, t]));

	let created = 0;
	let updated = 0;
	const errors: string[] = [];

	for (const data of BALLPARK_DATA) {
		const team = teamsByAbbr.get(data.teamAbbreviation);

		if (!team) {
			errors.push(`Team not found for abbreviation: ${data.teamAbbreviation}`);
			continue;
		}

		const doc = {
			elevation: data.elevation,
			fieldOrientation: data.fieldOrientation,
			location: {
				city: data.city,
				lat: data.lat,
				lng: data.lng,
				state: data.state,
			},
			mlbVenueId: data.mlbVenueId,
			name: data.name,
			roofType: data.roofType,
			sport: Sport.MLB,
			team: team.id,
		};

		const existing = await BallparkModel.findOne({ mlbVenueId: data.mlbVenueId });

		if (existing) {
			await BallparkModel.updateOne({ mlbVenueId: data.mlbVenueId }, { $set: doc });
			updated++;
		} else {
			await BallparkModel.create({ _id: randomUUID(), ...doc });
			created++;
		}
	}

	console.log(`[Ballpark Seed] Created ${created}, Updated ${updated}, Errors ${errors.length}`);

	return { created, errors, updated };
}
