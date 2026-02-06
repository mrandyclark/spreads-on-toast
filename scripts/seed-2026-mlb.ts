// npx tsx --env-file=.env.local scripts/seed-2026-mlb.ts

import { dbConnect } from '@/lib/mongoose';
import { SeasonModel } from '@/models/season.model';
import { TeamLineModel } from '@/models/team-line.model';
import { TeamModel } from '@/models/team.model';
import { Conference, Division, SeasonStatus, Sport } from '@/types';

// MLB Stats API team IDs: https://statsapi.mlb.com/api/v1/teams?sportId=1
const MLB_TEAMS = [
	{
		abbreviation: 'ARI',
		city: 'Arizona',
		conference: Conference.NL,
		division: Division.NL_West,
		externalId: 109,
		name: 'Diamondbacks',
	},
	{
		abbreviation: 'ATL',
		city: 'Atlanta',
		conference: Conference.NL,
		division: Division.NL_East,
		externalId: 144,
		name: 'Braves',
	},
	{
		abbreviation: 'BAL',
		city: 'Baltimore',
		conference: Conference.AL,
		division: Division.AL_East,
		externalId: 110,
		name: 'Orioles',
	},
	{
		abbreviation: 'BOS',
		city: 'Boston',
		conference: Conference.AL,
		division: Division.AL_East,
		externalId: 111,
		name: 'Red Sox',
	},
	{
		abbreviation: 'CHC',
		city: 'Chicago',
		conference: Conference.NL,
		division: Division.NL_Central,
		externalId: 112,
		name: 'Cubs',
	},
	{
		abbreviation: 'CIN',
		city: 'Cincinnati',
		conference: Conference.NL,
		division: Division.NL_Central,
		externalId: 113,
		name: 'Reds',
	},
	{
		abbreviation: 'CLE',
		city: 'Cleveland',
		conference: Conference.AL,
		division: Division.AL_Central,
		externalId: 114,
		name: 'Guardians',
	},
	{
		abbreviation: 'COL',
		city: 'Colorado',
		conference: Conference.NL,
		division: Division.NL_West,
		externalId: 115,
		name: 'Rockies',
	},
	{
		abbreviation: 'CWS',
		city: 'Chicago',
		conference: Conference.AL,
		division: Division.AL_Central,
		externalId: 145,
		name: 'White Sox',
	},
	{
		abbreviation: 'DET',
		city: 'Detroit',
		conference: Conference.AL,
		division: Division.AL_Central,
		externalId: 116,
		name: 'Tigers',
	},
	{
		abbreviation: 'HOU',
		city: 'Houston',
		conference: Conference.AL,
		division: Division.AL_West,
		externalId: 117,
		name: 'Astros',
	},
	{
		abbreviation: 'KC',
		city: 'Kansas City',
		conference: Conference.AL,
		division: Division.AL_Central,
		externalId: 118,
		name: 'Royals',
	},
	{
		abbreviation: 'LAA',
		city: 'Los Angeles',
		conference: Conference.AL,
		division: Division.AL_West,
		externalId: 108,
		name: 'Angels',
	},
	{
		abbreviation: 'LAD',
		city: 'Los Angeles',
		conference: Conference.NL,
		division: Division.NL_West,
		externalId: 119,
		name: 'Dodgers',
	},
	{
		abbreviation: 'MIA',
		city: 'Miami',
		conference: Conference.NL,
		division: Division.NL_East,
		externalId: 146,
		name: 'Marlins',
	},
	{
		abbreviation: 'MIL',
		city: 'Milwaukee',
		conference: Conference.NL,
		division: Division.NL_Central,
		externalId: 158,
		name: 'Brewers',
	},
	{
		abbreviation: 'MIN',
		city: 'Minnesota',
		conference: Conference.AL,
		division: Division.AL_Central,
		externalId: 142,
		name: 'Twins',
	},
	{
		abbreviation: 'NYM',
		city: 'New York',
		conference: Conference.NL,
		division: Division.NL_East,
		externalId: 121,
		name: 'Mets',
	},
	{
		abbreviation: 'NYY',
		city: 'New York',
		conference: Conference.AL,
		division: Division.AL_East,
		externalId: 147,
		name: 'Yankees',
	},
	{
		abbreviation: 'OAK',
		city: 'Oakland',
		conference: Conference.AL,
		division: Division.AL_West,
		externalId: 133,
		name: 'Athletics',
	},
	{
		abbreviation: 'PHI',
		city: 'Philadelphia',
		conference: Conference.NL,
		division: Division.NL_East,
		externalId: 143,
		name: 'Phillies',
	},
	{
		abbreviation: 'PIT',
		city: 'Pittsburgh',
		conference: Conference.NL,
		division: Division.NL_Central,
		externalId: 134,
		name: 'Pirates',
	},
	{
		abbreviation: 'SD',
		city: 'San Diego',
		conference: Conference.NL,
		division: Division.NL_West,
		externalId: 135,
		name: 'Padres',
	},
	{
		abbreviation: 'SEA',
		city: 'Seattle',
		conference: Conference.AL,
		division: Division.AL_West,
		externalId: 136,
		name: 'Mariners',
	},
	{
		abbreviation: 'SF',
		city: 'San Francisco',
		conference: Conference.NL,
		division: Division.NL_West,
		externalId: 137,
		name: 'Giants',
	},
	{
		abbreviation: 'STL',
		city: 'St. Louis',
		conference: Conference.NL,
		division: Division.NL_Central,
		externalId: 138,
		name: 'Cardinals',
	},
	{
		abbreviation: 'TB',
		city: 'Tampa Bay',
		conference: Conference.AL,
		division: Division.AL_East,
		externalId: 139,
		name: 'Rays',
	},
	{
		abbreviation: 'TEX',
		city: 'Texas',
		conference: Conference.AL,
		division: Division.AL_West,
		externalId: 140,
		name: 'Rangers',
	},
	{
		abbreviation: 'TOR',
		city: 'Toronto',
		conference: Conference.AL,
		division: Division.AL_East,
		externalId: 141,
		name: 'Blue Jays',
	},
	{
		abbreviation: 'WSH',
		city: 'Washington',
		conference: Conference.NL,
		division: Division.NL_East,
		externalId: 120,
		name: 'Nationals',
	},
];

const DRAFTKINGS_LINES_2026: Record<string, number> = {
	ARI: 79.5,
	ATL: 88.5,
	BAL: 84.5,
	BOS: 87.5,
	CHC: 88.5,
	CIN: 82.5,
	CLE: 80.5,
	COL: 52.5,
	CWS: 66.5,
	DET: 85.5,
	HOU: 86.5,
	KC: 81.5,
	LAA: 70.5,
	LAD: 102.5,
	MIA: 72.5,
	MIL: 84.5,
	MIN: 73.5,
	NYM: 89.5,
	NYY: 91.5,
	OAK: 75.5,
	PHI: 90.5,
	PIT: 76.5,
	SD: 85.5,
	SEA: 89.5,
	SF: 80.5,
	STL: 69.5,
	TB: 77.5,
	TEX: 83.5,
	TOR: 88.5,
	WSH: 65.5,
};

async function seed() {
	await dbConnect();

	console.log('Seeding 2026 MLB data...');

	// 1. Create or update the 2026 MLB Season
	const existingSeason = await SeasonModel.findOne({ season: '2026', sport: Sport.MLB });

	if (existingSeason) {
		console.log('2026 MLB Season already exists, skipping...');
	} else {
		await SeasonModel.create({
			endDate: new Date('2026-10-01'),
			lockDate: new Date('2026-03-26'),
			name: '2026 MLB Season',
			season: '2026',
			sport: Sport.MLB,
			startDate: new Date('2026-03-26'),
			status: SeasonStatus.Upcoming,
		});
		console.log('Created 2026 MLB Season');
	}

	// 2. Create or update teams (upsert by abbreviation)
	const teamIds: Record<string, string> = {};

	for (const team of MLB_TEAMS) {
		const existing = await TeamModel.findOne({ abbreviation: team.abbreviation });

		if (existing) {
			// Update externalId if not set
			if (!existing.externalId && team.externalId) {
				await TeamModel.updateOne({ _id: existing._id }, { $set: { externalId: team.externalId } });
				console.log(`Updated team ${team.abbreviation} with externalId ${team.externalId}`);
			} else {
				console.log(`Team ${team.abbreviation} already exists`);
			}

			teamIds[team.abbreviation] = existing._id.toString();
		} else {
			const created = await TeamModel.create({ ...team, sport: Sport.MLB });
			teamIds[team.abbreviation] = created._id.toString();
			console.log(`Created team ${team.abbreviation}`);
		}
	}

	// 3. Create team lines for 2026
	for (const [abbr, line] of Object.entries(DRAFTKINGS_LINES_2026)) {
		const teamId = teamIds[abbr];

		if (!teamId) {
			console.error(`No team found for ${abbr}`);
			continue;
		}

		const existing = await TeamLineModel.findOne({
			season: '2026',
			sport: Sport.MLB,
			team: teamId,
		});

		if (existing) {
			console.log(`Team line for ${abbr} 2026 already exists`);
		} else {
			await TeamLineModel.create({
				line,
				season: '2026',
				sport: Sport.MLB,
				team: teamId,
			});
			console.log(`Created team line for ${abbr}: ${line}`);
		}
	}

	console.log('Done!');
	process.exit(0);
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
