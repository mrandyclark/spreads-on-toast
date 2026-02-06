import { jsonResponse } from '@/server/http/responses';
import { getStartedSeasonsWithDates } from '@/server/standings';

/**
 * GET /api/standings/seasons
 * Returns seasons that have started with their available standings dates
 */
export async function GET() {
	const seasons = await getStartedSeasonsWithDates();

	return jsonResponse(seasons);
}
