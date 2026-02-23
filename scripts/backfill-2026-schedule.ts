// npx tsx --env-file=.env.local scripts/backfill-2026-schedule.ts
//
// Backfills 2026 MLB schedule data from the MLB Stats API
// This fetches the full season schedule for all 30 MLB teams

import { dbConnect } from '@/lib/mongoose';
import { syncAllSchedules } from '@/server/schedule/sync';

const SEASON = '2026';

async function backfill() {
	await dbConnect();

	console.log(`Backfilling ${SEASON} MLB schedule...`);
	console.log('This will fetch schedules for all 30 MLB teams.\n');

	const startTime = Date.now();

	try {
		const result = await syncAllSchedules(SEASON);

		const duration = ((Date.now() - startTime) / 1000).toFixed(1);

		console.log('\n=== Backfill Complete ===');
		console.log(`Duration: ${duration}s`);
		console.log(`Games created: ${result.created}`);
		console.log(`Games updated: ${result.updated}`);
		console.log(`Errors: ${result.errors.length}`);

		if (result.errors.length > 0) {
			console.log('\nErrors:');
			result.errors.forEach((err) => console.error(`  - ${err}`));
		}

		process.exit(result.errors.length > 0 ? 1 : 0);
	} catch (error) {
		console.error('Fatal error during backfill:', error);
		process.exit(1);
	}
}

backfill();
