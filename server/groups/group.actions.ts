import { resolveRefId } from '@/lib/ref-utils';
import { calculateProjectedWins } from '@/server/mlb-api';
import { Group, LeaderboardEntry, PickResult, TeamPick, User } from '@/types';

import { teamLineService } from '../seasons/team-line.service';
import { sheetService } from '../sheets/sheet.service';
import {
	calculatePickResult,
	getFinalStandings,
	getStandingsDateRange,
	getStandingsForDate,
} from '../standings/standings.actions';
import { groupService } from './group.service';

export { groupService };

// =============================================================================
// TYPES
// =============================================================================

export interface JoinGroupResult {
	error?: string;
	group?: Group;
}

export interface GroupWithSeasonDates extends Group {
	seasonEndDate?: Date;
	seasonStartDate?: Date;
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Join a group by invite code (adds member + creates sheet)
 */
export async function joinGroupByInviteCode(
	inviteCode: string,
	userId: string,
): Promise<JoinGroupResult> {
	const group = await groupService.findByInviteCode(inviteCode);

	if (!group) {
		return { error: 'Invalid invite code' };
	}

	const isMember = group.members.some((m) => resolveRefId(m.user) === userId);

	if (isMember) {
		return { error: 'You are already a member of this group' };
	}

	const updated = await groupService.addMember(group.id, userId);

	if (!updated) {
		return { error: 'Failed to join group' };
	}

	await sheetService.createForGroup({
		group: updated.id,
		season: updated.season,
		sport: updated.sport,
		user: userId,
	});

	return { group: updated };
}

/**
 * Get a group for a member with populated users and season date range
 */
export async function getGroupForMember(
	groupId: string,
	userId: string,
): Promise<GroupWithSeasonDates | null> {
	const group = await groupService.findForMemberPopulated(groupId, userId);

	if (!group) {
		return null;
	}

	const result = group as GroupWithSeasonDates;
	const dateRange = await getStandingsDateRange(group.season);

	if (dateRange.minDate) {
		result.seasonStartDate = dateRange.minDate;
	}

	if (dateRange.maxDate) {
		result.seasonEndDate = dateRange.maxDate;
	}

	return result;
}

/**
 * Calculate leaderboard entries for a group.
 * Returns entries sorted by wins desc, winPct desc, with isCurrentUser = false.
 * Callers should set isCurrentUser and rank as needed.
 */
export async function calculateLeaderboard(
	group: Group,
	groupId: string,
	date?: string,
): Promise<LeaderboardEntry[]> {
	// Get standings data — historical or final
	let standingsData: Map<string, { gamesPlayed: number; wins: number }>;

	if (date) {
		const dateObj = new Date(date);
		const historicalStandings = await getStandingsForDate(group.season, dateObj);
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

	const [sheets, teamLines] = await Promise.all([
		sheetService.findByGroupPopulated(groupId),
		teamLineService.findBySeason(group.sport, group.season),
	]);
	const linesByTeamId = new Map(teamLines.map((tl) => [resolveRefId(tl.team), tl.line]));
	const entries: LeaderboardEntry[] = [];

	for (const member of group.members) {
		const memberUser = member.user as User;
		const memberId = resolveRefId(member.user)!;
		const sheet = sheets.find((s) => s.user.toString() === memberId);

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

				const projectedWins =
					standing && standing.gamesPlayed > 0
						? calculateProjectedWins(standing.wins, standing.gamesPlayed, 162, false)
						: 0;
				const line = linesByTeamId.get(teamId) ?? 0;
				const result: PickResult = calculatePickResult(teamPick.pick, line, projectedWins);

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

		const userName = memberUser
			? `${memberUser.nameFirst ?? ''} ${memberUser.nameLast ?? ''}`.trim() || 'Member'
			: 'Member';

		const userInitials = memberUser
			? `${memberUser.nameFirst?.[0] ?? ''}${memberUser.nameLast?.[0] ?? ''}`.toUpperCase() || '?'
			: '?';

		entries.push({
			isCurrentUser: false,
			losses,
			pushes,
			total,
			userId: memberId,
			userInitials,
			userName,
			winPct,
			wins,
		});
	}

	entries.sort((a, b) => b.wins - a.wins || b.winPct - a.winPct);

	return entries;
}
