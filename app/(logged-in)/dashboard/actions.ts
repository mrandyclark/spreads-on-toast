'use server';

import { revalidatePath } from 'next/cache';

import { getAuthUser } from '@/lib/auth';
import { joinGroupByInviteCode } from '@/server/groups/group.actions';
import { groupService } from '@/server/groups/group.service';
import { seasonService } from '@/server/seasons/season.service';
import { CreateGroupInput, Group, Season, Sport } from '@/types';

export async function getGroupsAction(): Promise<{ error?: string; groups?: Group[] }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	const groups = await groupService.findByUser(user.id);

	return { groups };
}

export async function getSeasonsAction(
	sport: Sport,
): Promise<{ error?: string; seasons?: Season[] }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	const seasons = await seasonService.findBySport(sport);

	return { seasons };
}

export async function createGroupAction(
	input: CreateGroupInput,
): Promise<{ error?: string; group?: Group }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	if (!input.name.trim()) {
		return { error: 'Group name is required' };
	}

	try {
		const group = await groupService.createGroup({
			lockDate: new Date(input.lockDate),
			name: input.name.trim(),
			owner: user.id,
			season: input.season,
			sport: input.sport,
		});

		revalidatePath('/dashboard');

		return { group };
	} catch (error) {
		console.error('Failed to create group:', error);
		return { error: 'Failed to create group' };
	}
}

export async function joinGroupAction(
	inviteCode: string,
): Promise<{ error?: string; group?: Group }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	if (!inviteCode.trim()) {
		return { error: 'Invite code is required' };
	}

	try {
		const result = await joinGroupByInviteCode(inviteCode, user.id);

		if (result.error) {
			return { error: result.error };
		}

		revalidatePath('/dashboard');

		return { group: result.group };
	} catch (error) {
		console.error('Failed to join group:', error);
		return { error: 'Failed to join group' };
	}
}
