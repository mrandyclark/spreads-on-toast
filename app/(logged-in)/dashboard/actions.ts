'use server';

import { revalidatePath } from 'next/cache';

import { getAuthUser } from '@/lib/auth';
import { createGroup, getGroupsByUser } from '@/server/groups';
import { getSeasonsBySport } from '@/server/seasons';
import { Group, Season, Sport } from '@/types';

export async function getGroupsAction(): Promise<{ error?: string; groups?: Group[] }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	const groups = await getGroupsByUser(user.id);

	return { groups };
}

export async function getSeasonsAction(
	sport: Sport,
): Promise<{ error?: string; seasons?: Season[] }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	const seasons = await getSeasonsBySport(sport);

	return { seasons };
}

export interface CreateGroupInput {
	lockDate: string;
	name: string;
	season: string;
	sport: Sport;
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
		const group = await createGroup({
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
