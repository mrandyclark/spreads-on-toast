import { NextRequest } from 'next/server';

import { resolveRefId } from '@/lib/ref-utils';
import { groupService } from '@/server/groups/group.service';
import { calculateProjectedWins } from '@/server/mlb-api';
import { sheetService } from '@/server/sheets/sheet.service';
import {
	calculatePickResult,
	getFinalStandings,
	getStandingsForDate,
} from '@/server/standings/standings.actions';
import { GroupResults, PickResult, Team, TeamPick, TeamPickResult } from '@/types';

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

	const group = await groupService.findById(id);

	if (!group) {
		return Response.json({ error: 'Group not found' }, { status: 404 });
	}

	if (new Date(group.lockDate) > new Date()) {
		return Response.json({ error: 'Season not yet locked' }, { status: 400 });
	}

	const userId = request.nextUrl.searchParams.get('userId');

	if (!userId) {
		return Response.json({ error: 'userId required' }, { status: 400 });
	}

	const dateParam = request.nextUrl.searchParams.get('date');
	const isHistorical = !!dateParam;

	const sheet = await sheetService.findByUserAndGroupPopulated(userId, id);

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
		const teamId = resolveRefId(teamPick.team)!;
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

		if (result === PickResult.Win) {
			wins++;
		} else if (result === PickResult.Loss) {
			losses++;
		} else if (result === PickResult.Push) {
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
