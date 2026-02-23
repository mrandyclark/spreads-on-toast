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
	{ teamAbbreviation: 'ATL', name: 'Truist Park', lat: 33.89, lng: -84.47, city: 'Atlanta', state: 'GA', mlbVenueId: 4705, fieldOrientation: 225, roofType: 'open', elevation: 1050 },
	{ teamAbbreviation: 'BAL', name: 'Oriole Park at Camden Yards', lat: 39.28, lng: -76.62, city: 'Baltimore', state: 'MD', mlbVenueId: 2, fieldOrientation: 218, roofType: 'open', elevation: 30 },
	{ teamAbbreviation: 'BOS', name: 'Fenway Park', lat: 42.35, lng: -71.10, city: 'Boston', state: 'MA', mlbVenueId: 3, fieldOrientation: 65, roofType: 'open', elevation: 20 },
	{ teamAbbreviation: 'CHC', name: 'Wrigley Field', lat: 41.95, lng: -87.66, city: 'Chicago', state: 'IL', mlbVenueId: 17, fieldOrientation: 198, roofType: 'open', elevation: 600 },
	{ teamAbbreviation: 'CWS', name: 'Rate Field', lat: 41.83, lng: -87.63, city: 'Chicago', state: 'IL', mlbVenueId: 4, fieldOrientation: 225, roofType: 'open', elevation: 595 },
	{ teamAbbreviation: 'CIN', name: 'Great American Ball Park', lat: 39.10, lng: -84.51, city: 'Cincinnati', state: 'OH', mlbVenueId: 2602, fieldOrientation: 195, roofType: 'open', elevation: 490 },
	{ teamAbbreviation: 'CLE', name: 'Progressive Field', lat: 41.50, lng: -81.69, city: 'Cleveland', state: 'OH', mlbVenueId: 5, fieldOrientation: 195, roofType: 'open', elevation: 660 },
	{ teamAbbreviation: 'COL', name: 'Coors Field', lat: 39.76, lng: -104.99, city: 'Denver', state: 'CO', mlbVenueId: 19, fieldOrientation: 225, roofType: 'open', elevation: 5280 },
	{ teamAbbreviation: 'DET', name: 'Comerica Park', lat: 42.34, lng: -83.05, city: 'Detroit', state: 'MI', mlbVenueId: 2394, fieldOrientation: 215, roofType: 'open', elevation: 600 },
	{ teamAbbreviation: 'HOU', name: 'Minute Maid Park', lat: 29.76, lng: -95.36, city: 'Houston', state: 'TX', mlbVenueId: 2392, fieldOrientation: 225, roofType: 'retractable', elevation: 40 },
	{ teamAbbreviation: 'KC', name: 'Kauffman Stadium', lat: 39.05, lng: -94.48, city: 'Kansas City', state: 'MO', mlbVenueId: 7, fieldOrientation: 225, roofType: 'open', elevation: 820 },
	{ teamAbbreviation: 'LAA', name: 'Angel Stadium of Anaheim', lat: 33.80, lng: -117.88, city: 'Anaheim', state: 'CA', mlbVenueId: 1, fieldOrientation: 225, roofType: 'open', elevation: 160 },
	{ teamAbbreviation: 'LAD', name: 'Dodger Stadium', lat: 34.07, lng: -118.24, city: 'Los Angeles', state: 'CA', mlbVenueId: 22, fieldOrientation: 225, roofType: 'open', elevation: 515 },
	{ teamAbbreviation: 'MIA', name: 'loanDepot Park', lat: 25.78, lng: -80.22, city: 'Miami', state: 'FL', mlbVenueId: 4169, fieldOrientation: 225, roofType: 'retractable', elevation: 7 },
	{ teamAbbreviation: 'MIL', name: 'American Family Field', lat: 43.03, lng: -87.97, city: 'Milwaukee', state: 'WI', mlbVenueId: 32, fieldOrientation: 225, roofType: 'retractable', elevation: 635 },
	{ teamAbbreviation: 'MIN', name: 'Target Field', lat: 44.98, lng: -93.28, city: 'Minneapolis', state: 'MN', mlbVenueId: 3312, fieldOrientation: 225, roofType: 'open', elevation: 815 },
	{ teamAbbreviation: 'NYM', name: 'Citi Field', lat: 40.76, lng: -73.85, city: 'New York', state: 'NY', mlbVenueId: 3289, fieldOrientation: 225, roofType: 'open', elevation: 20 },
	{ teamAbbreviation: 'NYY', name: 'Yankee Stadium', lat: 40.83, lng: -73.93, city: 'New York', state: 'NY', mlbVenueId: 3313, fieldOrientation: 225, roofType: 'open', elevation: 55 },
	{ teamAbbreviation: 'OAK', name: 'Sutter Health Park', lat: 38.58, lng: -121.51, city: 'Sacramento', state: 'CA', mlbVenueId: 2529, fieldOrientation: 225, roofType: 'open', elevation: 25 },
	{ teamAbbreviation: 'PHI', name: 'Citizens Bank Park', lat: 39.91, lng: -75.17, city: 'Philadelphia', state: 'PA', mlbVenueId: 2681, fieldOrientation: 225, roofType: 'open', elevation: 20 },
	{ teamAbbreviation: 'PIT', name: 'PNC Park', lat: 40.45, lng: -80.01, city: 'Pittsburgh', state: 'PA', mlbVenueId: 31, fieldOrientation: 225, roofType: 'open', elevation: 730 },
	{ teamAbbreviation: 'SD', name: 'Petco Park', lat: 32.71, lng: -117.16, city: 'San Diego', state: 'CA', mlbVenueId: 2680, fieldOrientation: 225, roofType: 'open', elevation: 15 },
	{ teamAbbreviation: 'SF', name: 'Oracle Park', lat: 37.78, lng: -122.39, city: 'San Francisco', state: 'CA', mlbVenueId: 2395, fieldOrientation: 225, roofType: 'open', elevation: 5 },
	{ teamAbbreviation: 'SEA', name: 'T-Mobile Park', lat: 47.59, lng: -122.33, city: 'Seattle', state: 'WA', mlbVenueId: 680, fieldOrientation: 225, roofType: 'retractable', elevation: 20 },
	{ teamAbbreviation: 'STL', name: 'Busch Stadium', lat: 38.62, lng: -90.19, city: 'St. Louis', state: 'MO', mlbVenueId: 2889, fieldOrientation: 225, roofType: 'open', elevation: 465 },
	{ teamAbbreviation: 'TB', name: 'Tropicana Field', lat: 27.77, lng: -82.65, city: 'St. Petersburg', state: 'FL', mlbVenueId: 12, fieldOrientation: 225, roofType: 'dome', elevation: 45 },
	{ teamAbbreviation: 'TEX', name: 'Globe Life Field', lat: 32.75, lng: -97.08, city: 'Arlington', state: 'TX', mlbVenueId: 5325, fieldOrientation: 225, roofType: 'retractable', elevation: 545 },
	{ teamAbbreviation: 'TOR', name: 'Rogers Centre', lat: 43.64, lng: -79.39, city: 'Toronto', state: 'ON', mlbVenueId: 14, fieldOrientation: 315, roofType: 'retractable', elevation: 250 },
	{ teamAbbreviation: 'WSH', name: 'Nationals Park', lat: 38.87, lng: -77.01, city: 'Washington', state: 'DC', mlbVenueId: 3309, fieldOrientation: 225, roofType: 'open', elevation: 25 },
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
