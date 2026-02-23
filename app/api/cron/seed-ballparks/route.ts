import { NextRequest } from 'next/server';

import { seedBallparks } from '@/server/ballparks/seed';

/**
 * One-time seed endpoint for ballpark data.
 * Run once to populate the ballparks collection.
 *
 * Security: Requires CRON_SECRET header (same as other cron routes)
 */
export async function GET(request: NextRequest) {
	const authHeader = request.headers.get('authorization');

	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const result = await seedBallparks();

		return Response.json({
			message: 'Ballparks seeded successfully',
			...result,
		});
	} catch (error) {
		console.error('Error seeding ballparks:', error);

		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 },
		);
	}
}
