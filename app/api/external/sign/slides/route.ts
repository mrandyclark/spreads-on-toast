import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/server/http/responses';
import { getSignSlides } from '@/server/slides';

/**
 * External API endpoint for sign slides
 * Used by external consumers like Raspberry Pi digital signs
 *
 * Security: Requires X-API-Key header matching EXTERNAL_API_KEY env var
 *
 * GET /api/external/sign/slides
 *
 * Optional headers:
 *   X-Sign-Id: Identifier for the requesting sign (for future per-sign config)
 *
 * Optional query params:
 *   date: YYYY-MM-DD format, defaults to latest available
 *
 * Response format:
 * {
 *   "generatedAt": "2026-07-15T12:00:00.000Z",
 *   "slides": [
 *     {
 *       "slideType": "standings",
 *       "title": "NL East",
 *       "teams": [
 *         {
 *           "name": "Yankees",
 *           "abbreviation": "NYY",
 *           "colors": { "primary": "#0C2340", "secondary": "#FFFFFF" },
 *           "rank": 1,
 *           "wins": 55,
 *           "losses": 40,
 *           "gamesBack": "-"
 *         }
 *       ]
 *     }
 *   ]
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

	try {
		// Optional date parameter (YYYY-MM-DD format)
		const { searchParams } = new URL(request.url);
		const date = searchParams.get('date') ?? undefined;

		// Validate date format if provided
		if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return errorResponse('Date must be in YYYY-MM-DD format', 400);
		}

		// Log sign ID if provided (for future per-sign tracking)
		const signId = request.headers.get('x-sign-id');

		if (signId) {
			console.log(`[External API] Slides requested by sign: ${signId}`);
		}

		const slidesResponse = await getSignSlides(date);

		if (slidesResponse.slides.length === 0) {
			return jsonResponse({
				...slidesResponse,
				message: date
					? `No data available for ${date}`
					: 'No data available for current season',
			});
		}

		return jsonResponse(slidesResponse);
	} catch (error) {
		console.error('[External API] Error building slides:', error);
		return errorResponse('Internal server error', 500);
	}
}
