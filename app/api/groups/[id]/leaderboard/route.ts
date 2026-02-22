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
import { LeaderboardEntry, LeaderboardResponse, PickResult, TeamPick, User } from '@/types';

/**
 * GET /api/groups/[id]/leaderboard
 * Get the leaderboard for a group (all members' results)
 *
 * Query params:
 * - date: optional, YYYY-MM-DD format for historical lookup (uses projected wins)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	// findForMemberPopulated requires a userId, but this is a public-ish API route
	// Use findById + check lock, then get populated group for member iteration
	const groupBasic = await groupService.findById(id);

	if (!groupBasic) {
		return Response.json({ error: 'Group not found' }, { status: 404 });
	}

	if (new Date(groupBasic.lockDate) > new Date()) {
		return Response.json({ error: 'Season not yet locked' }, { status: 400 });
	}

	// Need populated members for user names — use owner as the member check
	const group = await groupService.findForMemberPopulated(id, String(groupBasic.owner));

	if (!group) {
		return Response.json({ error: 'Group not found' }, { status: 404 });
	}

	const dateParam = request.nextUrl.searchParams.get('date');
	const isHistorical = !!dateParam;

	// Get standings - either for a specific date or final standings
	// Store wins and gamesPlayed so we can recalculate with full precision
	let standingsData: Map<string, { wins: number; gamesPlayed: number }>;

	if (isHistorical && dateParam) {
		const date = new Date(dateParam);
		const historicalStandings = await getStandingsForDate(group.season, date);
		standingsData = new Map();

		for (const [teamId, data] of historicalStandings) {
			standingsData.set(teamId, { gamesPlayed: data.gamesPlayed, wins: data.wins });
		}
	} else {
		const finalStandings = await getFinalStandings(group.season);
		standingsData = new Map();

		for (const [teamId, wins] of finalStandings) {
			standingsData.set(teamId, { gamesPlayed: 162, wins });
		}
	}

	const sheets = await sheetService.findByGroupPopulated(id);

	// Calculate results for each member
	const entries: LeaderboardEntry[] = [];

	for (const member of group.members) {
		const user = member.user as User;
		const userId = resolveRefId(member.user)!;

		// Find the sheet for this user
		const sheet = sheets.find((s) => s.user.toString() === userId);

		let wins = 0;
		let losses = 0;
		let pushes = 0;

		if (sheet) {
			for (const teamPick of sheet.teamPicks as TeamPick[]) {
				if (!teamPick.pick) {
					continue;
				}

				const teamId = resolveRefId(teamPick.team)!;
				const standing = standingsData.get(teamId);

				// Recalculate projected wins with full precision to avoid false pushes
				const projectedWins =
					standing && standing.gamesPlayed > 0
						? calculateProjectedWins(standing.wins, standing.gamesPlayed, 162, false)
						: 0;
				const result: PickResult = calculatePickResult(teamPick.pick, teamPick.line, projectedWins);

				if (result === PickResult.Win) {
					wins++;
				} else if (result === PickResult.Loss) {
					losses++;
				} else if (result === PickResult.Push) {
					pushes++;
				}
			}
		}

		const total = wins + losses + pushes;
		const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;

		const userName = user
			? `${user.nameFirst ?? ''} ${user.nameLast ?? ''}`.trim() || 'Member'
			: 'Member';

		const userInitials = user?.nameFirst ? user.nameFirst.slice(0, 2).toUpperCase() : '??';

		entries.push({
			isCurrentUser: false,
			losses,
			pushes,
			rank: 0, // Will be set after sorting
			total,
			userId,
			userInitials,
			userName,
			winPct,
			wins,
		});
	}

	// Sort by wins (descending), then by win percentage
	entries.sort((a, b) => {
		if (b.wins !== a.wins) {
			return b.wins - a.wins;
		}
		return b.winPct - a.winPct;
	});

	// Assign ranks
	entries.forEach((entry, index) => {
		entry.rank = index + 1;
	});

	const response: LeaderboardResponse = {
		date: dateParam ?? undefined,
		entries,
		season: group.season,
	};

	return Response.json(response);
}
