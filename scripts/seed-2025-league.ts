// npx tsx --env-file=.env.local scripts/seed-2025-league.ts
//
// Creates a 2025 league with MAC's picks

import { randomUUID } from 'crypto';

import { dbConnect } from '@/lib/mongoose';
import { GroupModel } from '@/models/group.model';
import { SeasonModel } from '@/models/season.model';
import { SheetModel } from '@/models/sheet.model';
import { TeamLineModel } from '@/models/team-line.model';
import { TeamModel } from '@/models/team.model';
import { Conference, GroupRole, PickDirection, Sport, TeamPick } from '@/types';

const USER_ID = 'e8291a50-6e79-4842-b85d-dc5ba36fec80';

// MAC's over/under picks
const OVER_PICKS = [
	'LAA',
	'ATL',
	'BAL',
	'BOS',
	'CWS',
	'CIN',
	'CLE',
	'DET',
	'HOU',
	'KC',
	'MIL',
	'NYY',
	'OAK',
	'PHI',
	'PIT',
	'SEA',
	'STL',
];
const UNDER_PICKS = [
	'ARI',
	'CHC',
	'COL',
	'LAD',
	'MIA',
	'MIN',
	'NYM',
	'SD',
	'SF',
	'TB',
	'TEX',
	'TOR',
	'WSH',
];

// Postseason picks
const AL_POSTSEASON = ['BOS', 'NYY', 'CLE', 'DET', 'HOU'];
const NL_POSTSEASON = ['LAD', 'CIN', 'SD', 'PHI', 'NYM'];

// World Series
const AL_CHAMPION = 'DET';
const NL_CHAMPION = 'LAD';
const WS_WINNER = Conference.NL; // Dodgers

async function seed() {
	await dbConnect();

	console.log("Creating 2025 league with MAC's picks...");

	// 1. Get the 2025 season
	const season = await SeasonModel.findOne({ season: '2025', sport: Sport.MLB });

	if (!season) {
		console.error('2025 MLB Season not found! Run seed-2025-mlb.ts first.');
		process.exit(1);
	}

	// 2. Get all teams
	const teams = await TeamModel.find({ sport: Sport.MLB });
	const teamsByAbbr = new Map(teams.map((t) => [t.abbreviation, t._id.toString()]));

	// 3. Get team lines for 2025
	const teamLines = await TeamLineModel.find({ season: '2025', sport: Sport.MLB });
	const linesByTeamId = new Map(teamLines.map((tl) => [tl.team.toString(), tl.line]));

	// 4. Create or find the group
	let group = await GroupModel.findOne({ name: '2025 Test League', season: '2025' });

	if (group) {
		console.log('Group already exists, using existing...');
	} else {
		group = await GroupModel.create({
			inviteCode: randomUUID().slice(0, 8),
			lockDate: new Date('2025-03-27'),
			members: [{ joinedAt: new Date(), role: GroupRole.Owner, user: USER_ID }],
			name: '2025 Test League',
			owner: USER_ID,
			season: '2025',
			sport: Sport.MLB,
		});
		console.log('Created group: 2025 Test League');
	}

	// 5. Build team picks
	const teamPicks: TeamPick[] = [];

	for (const abbr of OVER_PICKS) {
		const teamId = teamsByAbbr.get(abbr);

		if (!teamId) {
			console.error(`Team not found: ${abbr}`);
			continue;
		}

		const line = linesByTeamId.get(teamId);

		if (line !== undefined) {
			teamPicks.push({ line, pick: PickDirection.Over, team: teamId });
		}
	}

	for (const abbr of UNDER_PICKS) {
		const teamId = teamsByAbbr.get(abbr);

		if (!teamId) {
			console.error(`Team not found: ${abbr}`);
			continue;
		}

		const line = linesByTeamId.get(teamId);

		if (line !== undefined) {
			teamPicks.push({ line, pick: PickDirection.Under, team: teamId });
		}
	}

	// 6. Build postseason picks
	const postseasonPicks = {
		al: AL_POSTSEASON.map((abbr) => teamsByAbbr.get(abbr)).filter(Boolean),
		nl: NL_POSTSEASON.map((abbr) => teamsByAbbr.get(abbr)).filter(Boolean),
	};

	// 7. Build World Series picks
	const worldSeriesPicks = {
		alChampion: teamsByAbbr.get(AL_CHAMPION),
		nlChampion: teamsByAbbr.get(NL_CHAMPION),
		winner: WS_WINNER,
	};

	// 8. Create or update the sheet
	let sheet = await SheetModel.findOne({ group: group._id, user: USER_ID });

	if (sheet) {
		sheet.teamPicks = teamPicks;
		sheet.postseasonPicks = postseasonPicks;
		sheet.worldSeriesPicks = worldSeriesPicks;
		await sheet.save();
		console.log('Updated existing sheet with picks');
	} else {
		sheet = await SheetModel.create({
			group: group._id,
			postseasonPicks,
			sport: Sport.MLB,
			teamPicks,
			user: USER_ID,
			worldSeriesPicks,
		});
		console.log('Created sheet with picks');
	}

	console.log('\n=== Summary ===');
	console.log(`Group ID: ${group._id}`);
	console.log(`Sheet ID: ${sheet._id}`);
	console.log(`Over picks: ${OVER_PICKS.length}`);
	console.log(`Under picks: ${UNDER_PICKS.length}`);
	console.log(`AL Postseason: ${AL_POSTSEASON.join(', ')}`);
	console.log(`NL Postseason: ${NL_POSTSEASON.join(', ')}`);
	console.log(`World Series: ${AL_CHAMPION} vs ${NL_CHAMPION}, Winner: ${NL_CHAMPION}`);

	process.exit(0);
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
