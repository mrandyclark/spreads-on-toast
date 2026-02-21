import { populatedToId } from '@/lib/mongo-utils';
import { Group } from '@/types';

import { sheetService } from '../sheets/sheet.service';
import { getStandingsDateRange } from '../standings/standings.actions';
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

	const isMember = group.members.some((m) => populatedToId(m.user) === userId);

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
