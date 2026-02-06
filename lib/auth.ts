import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { headers } from 'next/headers';

import { createUser, getUserByKindeId } from '@/server/users';

export interface AuthUser {
	email?: string;
	id: string;
	imageUrl?: string;
	kindeId: string;
	nameFirst?: string;
	nameLast?: string;
}

const KINDE_ISSUER_URL = process.env.KINDE_ISSUER_URL!;

let jwks: null | ReturnType<typeof createRemoteJWKSet> = null;

function getJWKS() {
	if (!jwks) {
		jwks = createRemoteJWKSet(new URL(`${KINDE_ISSUER_URL}/.well-known/jwks.json`));
	}

	return jwks;
}

async function verifyBearerToken(token: string): Promise<null | string> {
	try {
		const { payload } = await jwtVerify(token, getJWKS(), {
			issuer: KINDE_ISSUER_URL,
		});
		return payload.sub ?? null;
	} catch {
		return null;
	}
}

async function getKindeId(): Promise<null | string> {
	// First, check for Bearer token in Authorization header
	const headersList = await headers();
	const authHeader = headersList.get('authorization');

	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.slice(7);
		const kindeId = await verifyBearerToken(token);

		if (kindeId) {
			return kindeId;
		}
	}

	// Fall back to Kinde session (cookie-based)
	const { getUser, isAuthenticated } = getKindeServerSession();

	if (await isAuthenticated()) {
		const kindeUser = await getUser();

		if (kindeUser) {
			return kindeUser.id;
		}
	}

	return null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
	const kindeId = await getKindeId();

	if (!kindeId) {
		return null;
	}

	// Look up user in our database by kindeId
	let dbUser = await getUserByKindeId(kindeId);

	// Auto-create user if they don't exist (webhook may have failed)
	if (!dbUser) {
		// Try to get email from Kinde session for web users
		let email: string | undefined;
		let nameFirst: string | undefined;
		let nameLast: string | undefined;

		try {
			const { getUser } = getKindeServerSession();
			const kindeUser = await getUser();

			if (kindeUser) {
				email = kindeUser.email ?? undefined;
				nameFirst = kindeUser.given_name ?? undefined;
				nameLast = kindeUser.family_name ?? undefined;
			}
		} catch {
			// Ignore - may be using Bearer token without session
		}

		// Create the user with whatever info we have
		dbUser = await createUser({
			email: email || `${kindeId}@unknown.com`,
			kindeId,
			nameFirst,
			nameLast,
		});
	}

	return {
		email: dbUser.email,
		id: dbUser.id,
		imageUrl: dbUser.imageUrl,
		kindeId: dbUser.kindeId!,
		nameFirst: dbUser.nameFirst,
		nameLast: dbUser.nameLast,
	};
}
