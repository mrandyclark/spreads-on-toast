import { NextRequest } from 'next/server';

import { dbConnect } from '@/lib/mongoose';
import { SeasonModel } from '@/models/season.model';
import { syncMlbStandings } from '@/server/standings';
import { Sport } from '@/types';

/**
 * CRON endpoint to sync MLB standings daily
 * Called by Vercel CRON at 6am ET (after west coast games finish)
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
    await dbConnect();

    const currentYear = new Date().getFullYear().toString();
    const today = new Date();

    // Check if we're within the season dates
    const season = await SeasonModel.findOne({ season: currentYear, sport: Sport.MLB });

    if (!season) {
      return Response.json({
        message: 'No MLB season found for current year',
        skipped: true,
        season: currentYear,
      });
    }

    // Skip if before season start or after season end
    if (today < new Date(season.startDate)) {
      return Response.json({
        message: 'Season has not started yet',
        skipped: true,
        season: currentYear,
        startDate: season.startDate,
      });
    }

    if (today > new Date(season.endDate)) {
      return Response.json({
        message: 'Season has ended',
        skipped: true,
        season: currentYear,
        endDate: season.endDate,
      });
    }

    // Season is active, sync standings
    const result = await syncMlbStandings(currentYear);

    return Response.json({
      message: 'Standings synced successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error syncing standings:', error);

    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
