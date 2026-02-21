// npx tsx --env-file=.env.local scripts/backfill-2025-standings.ts
//
// Backfills 2025 MLB standings data from the MLB Stats API
// Season ran from March 27, 2025 to September 28, 2025 (regular season end)

import { dbConnect } from '@/lib/mongoose';
import { syncMlbStandings } from '@/server/standings/sync';

const SEASON = '2025';
const START_DATE = new Date('2025-03-27'); // Opening Day 2025
const END_DATE = new Date('2025-09-28'); // Regular season end

function formatDate(date: Date): string {
	return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

async function backfill() {
	await dbConnect();

	console.log(`Backfilling ${SEASON} MLB standings...`);
	console.log(`Date range: ${formatDate(START_DATE)} to ${formatDate(END_DATE)}`);

	let currentDate = START_DATE;
	let totalCreated = 0;
	let totalUpdated = 0;
	let totalErrors: string[] = [];
	let daysProcessed = 0;

	while (currentDate <= END_DATE) {
		const dateStr = formatDate(currentDate);

		try {
			// Small delay to be nice to the MLB API (100ms between requests)
			if (daysProcessed > 0) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			const result = await syncMlbStandings(SEASON, currentDate, dateStr);

			totalCreated += result.created;
			totalUpdated += result.updated;
			totalErrors = [...totalErrors, ...result.errors];

			daysProcessed++;

			// Progress update every 10 days
			if (daysProcessed % 10 === 0) {
				console.log(`Processed ${daysProcessed} days... (${dateStr})`);
			}
		} catch (error) {
			console.error(`Error processing ${dateStr}:`, error);
			totalErrors.push(`${dateStr}: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		currentDate = addDays(currentDate, 1);
	}

	console.log('\n=== Backfill Complete ===');
	console.log(`Days processed: ${daysProcessed}`);
	console.log(`Records created: ${totalCreated}`);
	console.log(`Records updated: ${totalUpdated}`);

	if (totalErrors.length > 0) {
		console.log(`\nErrors (${totalErrors.length}):`);
		// Only show first 10 errors to avoid spam
		totalErrors.slice(0, 10).forEach((err) => console.log(`  - ${err}`));

		if (totalErrors.length > 10) {
			console.log(`  ... and ${totalErrors.length - 10} more`);
		}
	}

	process.exit(0);
}

backfill().catch((err) => {
	console.error('Backfill failed:', err);
	process.exit(1);
});
