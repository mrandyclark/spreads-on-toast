// npx tsx --env-file=.env.local scripts/test-weather-sync.ts [date]
// Example: npx tsx --env-file=.env.local scripts/test-weather-sync.ts 2025-08-23

import { syncWeatherForDate } from '@/server/weather/sync';

async function main() {
	const date = process.argv[2] || '2025-08-23';
	console.log(`[Test Weather Sync] Syncing weather for ${date}...`);

	const result = await syncWeatherForDate(date);

	console.log('\n=== Results ===');
	console.log(`Updated: ${result.updated} games`);
	console.log(`Skipped: ${result.skipped} games (already started)`);
	console.log(`Errors: ${result.errors.length}`);

	if (result.errors.length > 0) {
		console.log('\n=== Errors ===');
		result.errors.forEach((err) => console.error(err));
	}

	process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
	console.error('[Test Weather Sync] Fatal error:', err);
	process.exit(1);
});
