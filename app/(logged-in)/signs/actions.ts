'use server';

import { revalidatePath } from 'next/cache';

import { getAuthUser } from '@/lib/auth';
import {
	createSign,
	getSign,
	getSignsForUser,
	getTeamsForConfig,
	updateSignConfig,
} from '@/server/signs/sign.actions';
import { Division, Sign, SignConfig, Team } from '@/types';

export async function getSignsAction(): Promise<{ error?: string; signs?: Sign[] }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	return { signs: await getSignsForUser(user.id) };
}

export async function getSignAction(signId: string): Promise<{ error?: string; sign?: Sign }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	const sign = await getSign(signId);

	return sign ? { sign } : { error: 'Sign not found' };
}

export async function createSignAction(title: string): Promise<{ error?: string; sign?: Sign }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	if (!title.trim()) {
		return { error: 'Sign name is required' };
	}

	try {
		const sign = await createSign(user.id, title.trim());
		revalidatePath('/signs');
		return { sign };
	} catch (error) {
		console.error('Failed to create sign:', error);
		return { error: 'Failed to create sign' };
	}
}

export async function updateSignConfigAction(
	signId: string,
	config: Partial<SignConfig>,
): Promise<{ error?: string; sign?: Sign }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	try {
		const result = await updateSignConfig(signId, user.id, config);

		if (result.sign) {
			revalidatePath(`/signs/${signId}`);
		}

		return result;
	} catch (error) {
		console.error('Failed to update sign:', error);
		return { error: 'Failed to update sign settings' };
	}
}

export async function getTeamsAction(): Promise<{ error?: string; teams?: Team[] }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	return { teams: await getTeamsForConfig() };
}

export async function getDivisionsAction(): Promise<{ divisions: Division[] }> {
	return { divisions: Object.values(Division) };
}
