import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/server/http/responses';
import { getStandingsBoardData } from '@/server/standings';

/**
 * GET /api/standings?season=2025&date=2025-07-03
 * Returns standings data for a specific season and date
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const season = searchParams.get('season');
	const date = searchParams.get('date');

	if (!season) {
		return errorResponse('Season is required', 400);
	}

	if (!date) {
		return errorResponse('Date is required', 400);
	}

	// Validate date format (YYYY-MM-DD)
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return errorResponse('Date must be in YYYY-MM-DD format', 400);
	}

	const standings = await getStandingsBoardData(season, date);

	return jsonResponse(standings);
}
