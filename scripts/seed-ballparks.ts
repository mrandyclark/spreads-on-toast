// npx tsx --env-file=.env.local scripts/seed-ballparks.ts

import { seedBallparks } from '@/server/ballparks/seed';

async function main() {
	const result = await seedBallparks();
	console.log('Result:', result);
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
