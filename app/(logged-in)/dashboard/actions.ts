'use server';

import { revalidatePath } from 'next/cache';

import { serverError, validation } from '@/lib/action-errors';
import { withAuth } from '@/lib/with-auth-action';
import { joinGroupByInviteCode } from '@/server/groups/group.actions';
import { groupService } from '@/server/groups/group.service';
import { seasonService } from '@/server/seasons/season.service';
import { getStandingsBoardData } from '@/server/standings/standings.actions';
import { CreateGroupInput, Sport } from '@/types';

export const getSeasonsAction = withAuth(async (_user, sport: Sport) => {
	const seasons = await seasonService.findBySport(sport);

	return { seasons };
});

export const createGroupAction = withAuth(async (user, input: CreateGroupInput) => {
	if (!input.name.trim()) {
		return validation('Group name is required');
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
		return serverError('create group');
	}
});

export const joinGroupAction = withAuth(async (user, inviteCode: string) => {
	if (!inviteCode.trim()) {
		return validation('Invite code is required');
	}

	try {
		const result = await joinGroupByInviteCode(inviteCode, user.id);

		if (result.error) {
			return validation(result.error);
		}

		revalidatePath('/dashboard');

		return { group: result.group };
	} catch (error) {
		console.error('Failed to join group:', error);
		return serverError('join group');
	}
});

export const getStandingsAction = withAuth(async (_user, season: string, date: string) => {
	if (!season || !date) {
		return validation('Season and date are required');
	}

	const standings = await getStandingsBoardData(season, date);

	return { standings };
});
