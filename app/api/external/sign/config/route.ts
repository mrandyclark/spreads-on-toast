import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/server/http/responses';
import { getSignById } from '@/server/signs';

/**
 * External API endpoint for sign configuration
 * Used by signs to fetch their display/schedule config
 *
 * Security: Requires X-API-Key header matching EXTERNAL_API_KEY env var
 *
 * GET /api/external/sign/config
 *
 * Required headers:
 *   X-Sign-Id: UUID of the sign requesting its config
 *
 * Response format:
 * {
 *   "display": {
 *     "brightness": 35,
 *     "rotationIntervalSeconds": 10
 *   },
 *   "schedule": {
 *     "enabled": true,
 *     "onTime": "09:00",
 *     "offTime": "21:00",
 *     "timezone": "America/Denver"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
	// Validate API key
	const apiKey = request.headers.get('x-api-key');
	const expectedKey = process.env.EXTERNAL_API_KEY;

	if (!expectedKey) {
		console.error('[External API] EXTERNAL_API_KEY environment variable not set');
		return errorResponse('API not configured', 500);
	}

	if (!apiKey || apiKey !== expectedKey) {
		return errorResponse('Unauthorized', 401);
	}

	// Require sign ID
	const signId = request.headers.get('x-sign-id');

	if (!signId) {
		return errorResponse('X-Sign-Id header is required', 400);
	}

	try {
		const sign = await getSignById(signId);

		if (!sign) {
			return errorResponse('Sign not found', 404);
		}

		return jsonResponse(sign.config);
	} catch (error) {
		console.error('[External API] Error fetching sign config:', error);
		return errorResponse('Internal server error', 500);
	}
}
