import { NextRequest } from 'next/server';

import { dbConnect } from '@/lib/mongoose';
import { GroupModel } from '@/models/group.model';
import { SheetModel } from '@/models/sheet.model';
import { calculateProjectedWins } from '@/server/mlb-api';
import {
	calculatePickResult,
	getFinalStandings,
	getStandingsForDate,
	PickResult,
} from '@/server/standings';
import { Team, TeamPick } from '@/types';

export interface TeamPickResult {
	actualWins?: number; // Actual wins at that point (for historical)
	gamesPlayed?: number;
	line: number;
	pick: 'over' | 'under';
	projectedWins: number; // Projected wins (for historical) or final wins
	result: PickResult;
	team: Team;
}

export interface GroupResults {
	date?: string; // The date these results are for (if historical)
	picks: TeamPickResult[];
	summary: {
		losses: number;
		pushes: number;
		total: number;
		wins: number;
	};
}

/**
 * GET /api/groups/[id]/results
 * Get the results for a user's picks in a group (for locked seasons)
 *
 * Query params:
 * - userId: required, the user whose picks to fetch
 * - date: optional, YYYY-MM-DD format for historical lookup (uses projected wins)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	await dbConnect();

	// Get the group
	const group = await GroupModel.findById(id);

	if (!group) {
		return Response.json({ error: 'Group not found' }, { status: 404 });
	}

	// Check if locked
	if (new Date(group.lockDate) > new Date()) {
		return Response.json({ error: 'Season not yet locked' }, { status: 400 });
	}

	// Get user ID from query param or session (for now, use query param)
	const userId = request.nextUrl.searchParams.get('userId');

	if (!userId) {
		return Response.json({ error: 'userId required' }, { status: 400 });
	}

	// Get optional date parameter for historical lookup
	const dateParam = request.nextUrl.searchParams.get('date');
	const isHistorical = !!dateParam;

	// Get the user's sheet
	const sheet = await SheetModel.findOne({ group: id, user: userId }).populate('teamPicks.team');

	if (!sheet) {
		return Response.json({ error: 'Sheet not found' }, { status: 404 });
	}

	// Get standings - either for a specific date or final standings
	let standingsData: Map<string, { projectedWins: number; wins: number; gamesPlayed: number }>;

	if (isHistorical && dateParam) {
		const date = new Date(dateParam);
		const historicalStandings = await getStandingsForDate(group.season, date);
		standingsData = new Map();

		for (const [teamId, data] of historicalStandings) {
			standingsData.set(teamId, {
				gamesPlayed: data.gamesPlayed,
				projectedWins: data.projectedWins,
				wins: data.wins,
			});
		}
	} else {
		// Use final standings
		const finalStandings = await getFinalStandings(group.season);
		standingsData = new Map();

		for (const [teamId, wins] of finalStandings) {
			standingsData.set(teamId, {
				gamesPlayed: 162,
				projectedWins: wins, // Final wins = projected wins at end of season
				wins,
			});
		}
	}

	// Calculate results for each pick
	const picks: TeamPickResult[] = [];
	let wins = 0;
	let losses = 0;
	let pushes = 0;

	for (const teamPick of sheet.teamPicks as TeamPick[]) {
		if (!teamPick.pick) {
			continue;
		}

		const team = teamPick.team as Team;
		const teamId = typeof teamPick.team === 'string' ? teamPick.team : team.id;
		const standing = standingsData.get(teamId);

		// Recalculate projected wins with full precision for accurate comparison
		// The stored projectedWins is rounded to 1 decimal which can cause false pushes
		const actualWins = standing?.wins ?? 0;
		const gamesPlayed = standing?.gamesPlayed ?? 0;
		const projectedWinsForComparison =
			gamesPlayed > 0
				? calculateProjectedWins(actualWins, gamesPlayed, 162, false) // Full precision
				: 0;
		const projectedWinsForDisplay = standing?.projectedWins ?? 0; // Rounded for display

		const result = calculatePickResult(teamPick.pick, teamPick.line, projectedWinsForComparison);

		picks.push({
			actualWins,
			gamesPlayed,
			line: teamPick.line,
			pick: teamPick.pick,
			projectedWins: projectedWinsForDisplay,
			result,
			team,
		});

		if (result === 'win') {
			wins++;
		} else if (result === 'loss') {
			losses++;
		} else if (result === 'push') {
			pushes++;
		}
	}

	// Sort by team name
	picks.sort((a, b) => {
		const nameA = `${a.team.city} ${a.team.name}`;
		const nameB = `${b.team.city} ${b.team.name}`;
		return nameA.localeCompare(nameB);
	});

	const results: GroupResults = {
		date: dateParam ?? undefined,
		picks,
		summary: {
			losses,
			pushes,
			total: picks.length,
			wins,
		},
	};

	return Response.json(results);
}
