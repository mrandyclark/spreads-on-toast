'use server';

import { revalidatePath } from 'next/cache';

import { withAuth } from '@/lib/with-auth-action';
import { createSign, updateSignConfig } from '@/server/signs/sign.actions';
import { SignConfig } from '@/types';

export const createSignAction = withAuth(async (user, title: string) => {
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
});

export const updateSignConfigAction = withAuth(async (user, signId: string, config: Partial<SignConfig>) => {
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
});
