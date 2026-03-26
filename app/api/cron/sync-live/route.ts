import { NextRequest } from 'next/server';

import { syncLiveGames } from '@/server/schedule/sync';

/**
 * CRON endpoint to sync live MLB game scores
 * Runs every 5 minutes during game hours (~12pm-1am ET)
 * Single MLB API call for today's games, updates only in-progress games
 *
 * Security: Vercel CRON requests include CRON_SECRET header
 */
export async function GET(request: NextRequest) {
	const authHeader = request.headers.get('authorization');

	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const result = await syncLiveGames();

		return Response.json({
			message: 'Live sync complete',
			...result,
		});
	} catch (error) {
		console.error('[Live Sync] Error:', error);

		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 },
		);
	}
}
