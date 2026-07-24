'use server';

import { revalidatePath } from 'next/cache';

import { serverError, validation } from '@/lib/action-errors';
import { withAuth } from '@/lib/with-auth-action';
import { joinGroupByInviteCode } from '@/server/groups/group.actions';
import { groupService } from '@/server/groups/group.service';
import { seasonService } from '@/server/seasons/season.service';
import { sheetService } from '@/server/sheets/sheet.service';
import { getStandingsBoardData } from '@/server/standings/standings.actions';
import { CreateGroupInput, Sport } from '@/types';

export const getSeasonsAction = withAuth(async (_user, sport: Sport) => {
	if (!Object.values(Sport).includes(sport)) {
		return validation('Unsupported sport');
	}

	const seasons = await seasonService.findBySport(sport);

	return { seasons };
});

export const createGroupAction = withAuth(async (user, input: CreateGroupInput) => {
	if (!input || typeof input.name !== 'string' || !input.name.trim()) {
		return validation('Group name is required');
	}

	if (input.name.trim().length > 80) {
		return validation('Group name must be 80 characters or fewer');
	}

	if (!Object.values(Sport).includes(input.sport) || !/^\d{4}$/.test(input.season)) {
		return validation('Choose a valid sport and season');
	}

	try {
		const season = await seasonService.findBySportAndYear(input.sport, input.season);

		if (!season) {
			return validation('Season is not configured');
		}

		if (new Date(season.lockDate).getTime() <= Date.now()) {
			return validation('This season is already locked');
		}

		const group = await groupService.createGroup({
			lockDate: season.lockDate,
			name: input.name.trim(),
			owner: user.id,
			season: input.season,
			sport: input.sport,
		});

		try {
			await sheetService.createForGroup({
				group: group.id,
				lockAt: season.lockDate,
				season: input.season,
				sport: input.sport,
				user: user.id,
			});
		} catch (error) {
			await groupService.deleteById(group.id);
			throw error;
		}

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
	if (!/^\d{4}$/.test(season) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return validation('Season and date are required');
	}

	const standings = await getStandingsBoardData(season, date);

	return { standings };
});
