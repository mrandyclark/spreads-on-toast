/**
 * Backfill timezone data on existing ballpark documents.
 * Usage: npx tsx --env-file=.env.local scripts/backfill-ballpark-timezones.ts
 */
import { dbConnect } from '@/lib/mongoose';
import { BallparkModel } from '@/models/ballpark.model';

// MLB venue ID → IANA timezone (from actual DB mlbVenueId values)
const VENUE_TIMEZONES: Record<number, string> = {
	1: 'America/Los_Angeles',     // Angel Stadium of Anaheim — Anaheim, CA
	2: 'America/New_York',        // Oriole Park at Camden Yards — Baltimore, MD
	3: 'America/New_York',        // Fenway Park — Boston, MA
	4: 'America/Chicago',         // Rate Field — Chicago, IL (White Sox)
	5: 'America/New_York',        // Progressive Field — Cleveland, OH
	7: 'America/Chicago',         // Kauffman Stadium — Kansas City, MO
	12: 'America/New_York',       // Tropicana Field — St. Petersburg, FL
	14: 'America/Toronto',        // Rogers Centre — Toronto, ON
	15: 'America/Phoenix',        // Chase Field — Phoenix, AZ
	17: 'America/Chicago',        // Wrigley Field — Chicago, IL
	19: 'America/Denver',         // Coors Field — Denver, CO
	22: 'America/Los_Angeles',    // Dodger Stadium — Los Angeles, CA
	31: 'America/New_York',       // PNC Park — Pittsburgh, PA
	32: 'America/Chicago',        // American Family Field — Milwaukee, WI
	680: 'America/Los_Angeles',   // T-Mobile Park — Seattle, WA
	2392: 'America/Chicago',      // Minute Maid Park — Houston, TX
	2394: 'America/New_York',     // Comerica Park — Detroit, MI
	2395: 'America/Los_Angeles',  // Oracle Park — San Francisco, CA
	2529: 'America/Los_Angeles',  // Sutter Health Park — Sacramento, CA (A's temporary)
	2602: 'America/New_York',     // Great American Ball Park — Cincinnati, OH
	2680: 'America/Los_Angeles',  // Petco Park — San Diego, CA
	2681: 'America/New_York',     // Citizens Bank Park — Philadelphia, PA
	2889: 'America/Chicago',      // Busch Stadium — St. Louis, MO
	3289: 'America/New_York',     // Citi Field — New York, NY
	3309: 'America/New_York',     // Nationals Park — Washington, DC
	3312: 'America/Chicago',      // Target Field — Minneapolis, MN
	3313: 'America/New_York',     // Yankee Stadium — New York, NY
	4169: 'America/New_York',     // loanDepot Park — Miami, FL
	4705: 'America/New_York',     // Truist Park — Atlanta, GA
	5325: 'America/Chicago',      // Globe Life Field — Arlington, TX
};

async function main() {
	await dbConnect();

	const ballparks = await BallparkModel.find({});

	console.log(`Found ${ballparks.length} ballparks`);

	let updated = 0;

	for (const bp of ballparks) {
		const tz = VENUE_TIMEZONES[bp.mlbVenueId];

		if (tz) {
			await BallparkModel.updateOne(
				{ _id: bp._id },
				{ $set: { timezone: tz } },
			);
			console.log(`  ✓ ${bp.name} → ${tz}`);
			updated++;
		} else {
			console.log(`  ✗ ${bp.name} (venue ${bp.mlbVenueId}) — no timezone mapping`);
		}
	}

	console.log(`\nUpdated ${updated}/${ballparks.length} ballparks`);
	process.exit(0);
}

main().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});
