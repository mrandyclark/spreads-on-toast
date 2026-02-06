// npx tsx --env-file=.env.local scripts/seed-scott-picks.ts
//
// Creates a stub user for Scott and adds his 2025 picks to the league

import { dbConnect } from '@/lib/mongoose';
import { GroupModel } from '@/models/group.model';
import { SheetModel } from '@/models/sheet.model';
import { TeamLineModel } from '@/models/team-line.model';
import { TeamModel } from '@/models/team.model';
import { UserModel } from '@/models/user.model';
import { Conference, GroupRole, PickDirection, Sport, TeamPick } from '@/types';

const SCOTT_USER_ID = 'f61e3617-9693-4e85-ad66-9386f0fe92fe';
const GROUP_ID = '34060da8-d363-4c26-b1dc-be74d782705f';

// Scott's over/under picks
const OVER_PICKS = [
	'BAL',
	'BOS',
	'CWS',
	'CLE',
	'DET',
	'KC',
	'LAD',
	'MIL',
	'OAK',
	'PHI',
	'PIT',
	'TOR',
];
const UNDER_PICKS = [
	'LAA',
	'ARI',
	'ATL',
	'CHC',
	'CIN',
	'COL',
	'HOU',
	'MIA',
	'MIN',
	'NYM',
	'NYY',
	'SD',
	'SEA',
	'SF',
	'STL',
	'TB',
	'TEX',
	'WSH',
];

// Postseason picks
const AL_POSTSEASON = ['NYY', 'TEX', 'SEA', 'KC', 'TB'];
const NL_POSTSEASON = ['LAD', 'ATL', 'MIL', 'NYM', 'MIA'];

// World Series
const AL_CHAMPION = 'NYY';
const NL_CHAMPION = 'LAD';
const WS_WINNER = Conference.NL; // Dodgers

async function seed() {
	await dbConnect();

	console.log('Creating Scott user and picks...');

	// 1. Create or find Scott user
	let scottUser = await UserModel.findById(SCOTT_USER_ID);

	if (scottUser) {
		console.log('Scott user already exists');
	} else {
		scottUser = await UserModel.create({
			_id: SCOTT_USER_ID,
			email: 'scott@example.com',
			kindeId: 'stub_scott',
			nameFirst: 'Scott',
			nameLast: '',
		});
		console.log('Created Scott user');
	}

	// 2. Get the group and add Scott as a member
	const group = await GroupModel.findById(GROUP_ID);

	if (!group) {
		console.error('Group not found!');
		process.exit(1);
	}

	const isMember = group.members.some((m) => m.user.toString() === SCOTT_USER_ID);

	if (!isMember) {
		group.members.push({
			joinedAt: new Date(),
			role: GroupRole.Member,
			user: SCOTT_USER_ID,
		});
		await group.save();
		console.log('Added Scott to group');
	} else {
		console.log('Scott already in group');
	}

	// 3. Get all teams
	const teams = await TeamModel.find({ sport: Sport.MLB });
	const teamsByAbbr = new Map(teams.map((t) => [t.abbreviation, t._id.toString()]));

	// 4. Get team lines for 2025
	const teamLines = await TeamLineModel.find({ season: '2025', sport: Sport.MLB });
	const linesByTeamId = new Map(teamLines.map((tl) => [tl.team.toString(), tl.line]));

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
		al: AL_POSTSEASON.map((abbr) => teamsByAbbr.get(abbr)).filter((id): id is string => !!id),
		nl: NL_POSTSEASON.map((abbr) => teamsByAbbr.get(abbr)).filter((id): id is string => !!id),
	};

	// 7. Build World Series picks
	const worldSeriesPicks = {
		alChampion: teamsByAbbr.get(AL_CHAMPION),
		nlChampion: teamsByAbbr.get(NL_CHAMPION),
		winner: WS_WINNER,
	};

	// 8. Create or update the sheet
	let sheet = await SheetModel.findOne({ group: GROUP_ID, user: SCOTT_USER_ID });

	if (sheet) {
		sheet.teamPicks = teamPicks;
		sheet.postseasonPicks = postseasonPicks;
		sheet.worldSeriesPicks = worldSeriesPicks;
		await sheet.save();
		console.log('Updated existing sheet with picks');
	} else {
		sheet = await SheetModel.create({
			group: GROUP_ID,
			postseasonPicks,
			sport: Sport.MLB,
			teamPicks,
			user: SCOTT_USER_ID,
			worldSeriesPicks,
		});
		console.log('Created sheet with picks');
	}

	console.log('\n=== Summary ===');
	console.log(`User ID: ${SCOTT_USER_ID}`);
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
