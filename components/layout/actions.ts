'use server';

import { getAuthUser } from '@/lib/auth';

export async function getCurrentUserAction() {
	const user = await getAuthUser();

	if (!user) {
		return { user: null };
	}

	return {
		user: {
			email: user.email,
			nameFirst: user.nameFirst,
			nameLast: user.nameLast,
		},
	};
}
