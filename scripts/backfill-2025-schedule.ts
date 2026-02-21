// npx tsx --env-file=.env.local scripts/backfill-2025-schedule.ts
//
// Backfills 2025 MLB schedule data from the MLB Stats API
// This fetches the full season schedule for all 30 MLB teams

import { dbConnect } from '@/lib/mongoose';
import { syncAllSchedules } from '@/server/schedule/sync';

const SEASON = '2025';

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

		if (result.errors.length > 0) {
			console.log(`\nErrors (${result.errors.length}):`);
			result.errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`));

			if (result.errors.length > 10) {
				console.log(`  ... and ${result.errors.length - 10} more`);
			}
		}
	} catch (error) {
		console.error('Backfill failed:', error);
		process.exit(1);
	}

	process.exit(0);
}

backfill().catch((err) => {
	console.error('Backfill failed:', err);
	process.exit(1);
});
