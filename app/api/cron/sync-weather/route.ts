import { NextRequest, NextResponse } from 'next/server';

import { toDateString } from '@/lib/date-utils';
import { syncWeatherForDate } from '@/server/weather/sync';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * CRON endpoint to sync weather for today's games
 * Runs hourly to keep weather data fresh
 *
 * Vercel CRON: 0 * * * * (every hour)
 */
export async function GET(request: NextRequest) {
	// Verify CRON secret
	const authHeader = request.headers.get('authorization');

	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const today = toDateString(new Date());
		const result = await syncWeatherForDate(today);

		console.log(
			`[Weather Sync] Updated ${result.updated}, Skipped ${result.skipped} for ${today}`,
		);

		if (result.errors.length > 0) {
			console.error('[Weather Sync] Errors:', result.errors);
		}

		return NextResponse.json({
			date: today,
			errors: result.errors,
			skipped: result.skipped,
			success: true,
			updated: result.updated,
		});
	} catch (error) {
		console.error('[Weather Sync] Fatal error:', error);

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Unknown error',
				success: false,
			},
			{ status: 500 },
		);
	}
}
