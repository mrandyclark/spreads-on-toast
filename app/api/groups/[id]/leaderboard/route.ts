import { NextRequest } from 'next/server';

import { calculateLeaderboard } from '@/server/groups/group.actions';
import { groupService } from '@/server/groups/group.service';
import { LeaderboardResponse } from '@/types';

/**
 * GET /api/groups/[id]/leaderboard
 * Get the leaderboard for a group (all members' results)
 *
 * Query params:
 * - date: optional, YYYY-MM-DD format for historical lookup (uses projected wins)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

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
	const entries = await calculateLeaderboard(group, id, dateParam ?? undefined);

	// Assign ranks for API consumers
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
