import { NextRequest } from 'next/server';

import { hasValidApiKey } from '@/server/http/authentication';
import { errorResponse, jsonResponse } from '@/server/http/responses';
import { logger } from '@/server/observability/logger';
import { getSign } from '@/server/signs/sign.actions';
import { getSignSlides } from '@/server/slides';

/**
 * External API endpoint for sign slides
 * Used by external consumers like Raspberry Pi digital signs
 *
 * GET /api/external/sign/slides
 *
 * Required headers:
 *   X-Sign-Id: UUID of the sign requesting its slides
 *
 * Optional query params:
 *   date: YYYY-MM-DD format, defaults to latest available
 *
 * Slides are generated based on the sign's content configuration:
 * - standingsDivisions: which divisions to show standings for
 * - lastGameTeamIds: teams to show last game box scores for
 * - nextGameTeamIds: teams to show next game previews for
 *
 * Slide order: standings → per-team (last game → next game)
 */
export async function GET(request: NextRequest) {
	// Validate API key
	const apiKey = request.headers.get('x-api-key');
	const expectedKey = process.env.EXTERNAL_API_KEY;

	if (!expectedKey) {
		logger.error('sign_api_not_configured', { route: 'slides' });
		return errorResponse('API not configured', 500);
	}

	if (!hasValidApiKey(apiKey, expectedKey)) {
		return errorResponse('Unauthorized', 401);
	}

	// Require sign ID
	const signId = request.headers.get('x-sign-id');

	if (!signId) {
		return errorResponse('X-Sign-Id header is required', 400);
	}

	try {
		// Look up the sign to get its content config
		const sign = await getSign(signId);

		if (!sign) {
			return errorResponse('Sign not found', 404);
		}

		// Optional date parameter (YYYY-MM-DD format)
		const { searchParams } = new URL(request.url);
		const date = searchParams.get('date') ?? undefined;

		// Validate date format if provided
		if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return errorResponse('Date must be in YYYY-MM-DD format', 400);
		}

		logger.info('sign_slides_requested', { date, signId });

		const slidesResponse = await getSignSlides(sign.config.content, date);

		if (slidesResponse.slides.length === 0) {
			return jsonResponse({
				...slidesResponse,
				message: date ? `No data available for ${date}` : 'No data available for current season',
			});
		}

		return jsonResponse(slidesResponse);
	} catch (error) {
		logger.error('sign_slides_failed', { signId }, error);
		return errorResponse('Internal server error', 500);
	}
}
