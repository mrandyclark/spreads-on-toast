import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/server/http/responses';
import { seasonService } from '@/server/seasons/season.service';
import { Sport } from '@/types';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const sport = searchParams.get('sport') as null | Sport;

	if (!sport) {
		return errorResponse('Sport is required', 400);
	}

	if (!Object.values(Sport).includes(sport)) {
		return errorResponse('Invalid sport', 400);
	}

	const seasons = await seasonService.findAvailable(sport);

	return jsonResponse(seasons);
}
