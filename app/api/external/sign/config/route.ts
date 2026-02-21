import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/server/http/responses';
import { getSign } from '@/server/signs/sign.actions';
import { SIGN_PAYLOAD_VERSION, SignExternalConfigResponse } from '@/types';

/**
 * External API endpoint for sign configuration
 * Used by signs to fetch their display/schedule config
 *
 * GET /api/external/sign/config
 *
 * Required headers:
 *   X-Sign-Id: UUID of the sign requesting its config
 *
 * Response format:
 * {
 *   "payloadVersion": 2,
 *   "config": {
 *     "display": {
 *       "brightness": 35,
 *       "rotationIntervalSeconds": 10
 *     },
 *     "schedule": {
 *       "enabled": true,
 *       "onTime": "09:00",
 *       "offTime": "21:00",
 *       "timezone": "America/Denver"
 *     }
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
		const sign = await getSign(signId);

		if (!sign) {
			return errorResponse('Sign not found', 404);
		}

		const response: SignExternalConfigResponse = {
			config: sign.config,
			payloadVersion: SIGN_PAYLOAD_VERSION,
		};

		return jsonResponse(response);
	} catch (error) {
		console.error('[External API] Error fetching sign config:', error);
		return errorResponse('Internal server error', 500);
	}
}
