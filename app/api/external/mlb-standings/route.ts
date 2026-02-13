import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/server/http/responses';
import { getDivisionStandings } from '@/server/standings';

/**
 * External API endpoint for MLB standings
 * Used by external consumers like Raspberry Pi digital signs
 *
 * Security: Requires X-API-Key header matching EXTERNAL_API_KEY env var
 *
 * GET /api/external/mlb-standings
 *
 * Response format:
 * {
 *   "season": "2026",
 *   "asOfDate": "2026-07-15",
 *   "divisions": [
 *     {
 *       "name": "AL East",
 *       "league": "American League",
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

		const standings = await getDivisionStandings(date);

		if (!standings) {
			return jsonResponse({
				divisions: [],
				message: date
					? `No standings data available for ${date}`
					: 'No standings data available for current season',
				season: new Date().getFullYear().toString(),
			});
		}

		return jsonResponse(standings);
	} catch (error) {
		console.error('[External API] Error fetching standings:', error);
		return errorResponse('Internal server error', 500);
	}
}
