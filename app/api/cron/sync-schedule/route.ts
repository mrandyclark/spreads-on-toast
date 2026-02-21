import { NextRequest } from 'next/server';

import { syncAllSchedules } from '@/server/schedule/sync';
import { seasonService } from '@/server/seasons/season.service';
import { Sport } from '@/types';

/**
 * CRON endpoint to sync MLB schedule daily
 * Called by Vercel CRON at 6am ET (after west coast games finish)
 * Updates game results and any schedule changes
 *
 * Security: Vercel CRON requests include CRON_SECRET header
 */
export async function GET(request: NextRequest) {
	// Verify the request is from Vercel CRON
	const authHeader = request.headers.get('authorization');

	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const currentYear = new Date().getFullYear().toString();
		const today = new Date();

		const season = await seasonService.findBySportAndYear(Sport.MLB, currentYear);

		if (!season) {
			return Response.json({
				message: 'No MLB season found for current year',
				season: currentYear,
				skipped: true,
			});
		}

		// Skip if before season start or after season end
		if (today < new Date(season.startDate)) {
			return Response.json({
				message: 'Season has not started yet',
				season: currentYear,
				skipped: true,
				startDate: season.startDate,
			});
		}

		if (today > new Date(season.endDate)) {
			return Response.json({
				endDate: season.endDate,
				message: 'Season has ended',
				season: currentYear,
				skipped: true,
			});
		}

		// Season is active, sync schedule
		const result = await syncAllSchedules(currentYear);

		return Response.json({
			message: 'Schedule synced successfully',
			...result,
		});
	} catch (error) {
		console.error('Error syncing schedule:', error);

		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 },
		);
	}
}
