import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import { errorResponse, jsonResponse } from '@/server/http/responses';
import { userService } from '@/server/users/user.service';

const client = jwksClient({
	jwksUri: `${process.env.KINDE_ISSUER_URL}/.well-known/jwks.json`,
});

interface KindeUserData {
	email: string;
	first_name: string;
	id: string;
	is_password_reset_requested: boolean;
	is_suspended: boolean;
	last_name: string;
	organizations: Array<{
		code: string;
		permissions: Array<{ id: string; key: string }> | null;
		roles: Array<{ id: string; key: string }> | null;
	}>;
	phone: null | string;
	username: string;
}

interface KindeWebhookEvent {
	data: {
		user: KindeUserData;
	};
	event_id: string;
	source: string;
	timestamp: string;
	type: string;
}

export async function POST(request: Request) {
	try {
		const token = await request.text();

		// Decode the token to get the key ID
		const decoded = jwt.decode(token, { complete: true });

		if (!decoded || !decoded.header.kid) {
			console.error('[webhook] Invalid token format');
			return errorResponse('Invalid token', 400);
		}

		// Verify the token using Kinde's public keys
		const key = await client.getSigningKey(decoded.header.kid);
		const signingKey = key.getPublicKey();
		const event = jwt.verify(token, signingKey) as KindeWebhookEvent;

		console.log('[webhook] Received event:', event.type);

		switch (event.type) {
			case 'user.created': {
				const { user } = event.data;
				const existingUser = await userService.findByKindeId(user.id);

				if (!existingUser) {
					await userService.create({
						email: user.email,
						kindeId: user.id,
						nameFirst: user.first_name || undefined,
						nameLast: user.last_name || undefined,
					});
					console.log('[webhook] Created user with kindeId:', user.id);
				}

				break;
			}

			case 'user.updated': {
				const { user } = event.data;
				const existingUser = await userService.findByKindeId(user.id);

				if (existingUser) {
					await userService.updateByKindeId(user.id, {
						email: user.email,
						nameFirst: user.first_name || undefined,
						nameLast: user.last_name || undefined,
					});
					console.log('[webhook] Updated user with kindeId:', user.id);
				} else {
					await userService.create({
						email: user.email,
						kindeId: user.id,
						nameFirst: user.first_name || undefined,
						nameLast: user.last_name || undefined,
					});
					console.log('[webhook] Created user (via update event) with kindeId:', user.id);
				}

				break;
			}

			default:
				console.log('[webhook] Unhandled event type:', event.type);
		}

		return jsonResponse({ received: true });
	} catch (err) {
		console.error('[webhook] Error:', err);
		return errorResponse('Webhook processing failed', 400);
	}
}
