import { resolveRef, resolveRefId } from '@/lib/ref-utils';
import { Group, LeaderboardEntry, PickResult, TeamPick, User } from '@/types';

import { isSeasonFinalForScoring, selectWinsForScoring } from '../picks/scoring';
import { seasonService } from '../seasons/season.service';
import { teamLineService } from '../seasons/team-line.service';
import { sheetService } from '../sheets/sheet.service';
import {
	calculatePickResult,
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
		await sheetService.getOrCreate({
			group: group.id,
			lockAt: group.lockDate,
			season: group.season,
			sport: group.sport,
			user: userId,
		});

		return { group };
	}

	if (new Date(group.lockDate).getTime() <= Date.now()) {
		return { error: 'This group is locked and no longer accepts new members' };
	}

	const updated = await groupService.addMember(group.id, userId);

	if (!updated) {
		return { error: 'Failed to join group' };
	}

	await sheetService.getOrCreate({
		group: updated.id,
		lockAt: updated.lockDate,
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

	result.members = group.members.map((member) => {
		const memberUser = resolveRef<User>(member.user);

		if (!memberUser) {
			return member;
		}

		return {
			...member,
			user: {
				...memberUser,
				email: '',
				kindeId: '',
			},
		};
	});

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
	// Fetch standings, sheets, and team lines in parallel
	// Sheets don't need populate — leaderboard only uses team ID + pick
	const [standingsData, sheets, teamLines, season] = await Promise.all([
		date
			? getStandingsForDate(group.season, new Date(date))
			: getStandingsForDate(group.season, new Date()),
		sheetService.findByGroup(groupId),
		teamLineService.findBySeason(group.sport, group.season),
		seasonService.findBySportAndYear(group.sport, group.season),
	]);
	const linesByTeamId = new Map(teamLines.map((tl) => [resolveRefId(tl.team), tl.line]));
	const isFinal = isSeasonFinalForScoring(season, date);
	const entries: LeaderboardEntry[] = [];

	for (const member of group.members) {
		const memberUser = resolveRef<User>(member.user);
		const memberId = resolveRefId(member.user)!;
		const sheet = sheets.find((s) => resolveRefId(s.user) === memberId);

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

				const scoringWins = selectWinsForScoring(standing ?? {}, isFinal);
				const line = teamPick.line ?? linesByTeamId.get(teamId) ?? 0;
				const result: PickResult = calculatePickResult(teamPick.pick, line, scoringWins);

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
