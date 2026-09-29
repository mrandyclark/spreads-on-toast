// Read-only: node --env-file=.env.local scripts/export-league.mjs GROUP_UUID [OUTPUT_DIR]
// Offline: node scripts/export-league.mjs --source exports/league-source.json [OUTPUT_DIR]
import mongoose from 'mongoose';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { buildLeagueExport, renderLeagueReport } from './league-export.mjs';

async function readLeague(groupId) {
	let uri = process.env.MONGO_URI;

	if (!uri) {
		throw new Error('Load .env.local before running this export.');
	}

	if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
		const url = new URL(uri);
		url.username = encodeURIComponent(process.env.MONGO_USER);
		url.password = encodeURIComponent(process.env.MONGO_PASSWORD);
		uri = url.toString();
	}

	// Native client avoids Mongoose model registration and automatic index writes.
	const client = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

	try {
		await client.connect();
		const db = client.db();
		const group = await db
			.collection('groups')
			.findOne({ _id: new mongoose.mongo.UUID(groupId) }, { projection: { inviteCode: 0 } });

		if (!group) {
			throw new Error('League not found.');
		}

		const season = await db
			.collection('seasons')
			.findOne({ season: group.season, sport: group.sport });
		const latest = await db
			.collection('teamstandings')
			.find({ season: group.season, sport: group.sport })
			.sort({ date: -1 })
			.limit(1)
			.next();

		if (!season || !latest) {
			throw new Error('Season or standings missing.');
		}

		const [users, sheets, teams, lines, standings] = await Promise.all([
			db
				.collection('users')
				.find(
					{ _id: { $in: group.members.map((member) => member.user) } },
					{ projection: { nameFirst: 1, nameLast: 1 } },
				)
				.toArray(),
			db.collection('sheets').find({ group: group._id }).toArray(),
			db.collection('teams').find({ sport: group.sport }).toArray(),
			db.collection('teamlines').find({ season: group.season, sport: group.sport }).toArray(),
			db
				.collection('teamstandings')
				.find({ date: latest.date, season: group.season, sport: group.sport })
				.toArray(),
		]);
		return JSON.parse(
			JSON.stringify({
				exportedAt: new Date().toISOString(),
				group,
				lines,
				season,
				sheets,
				standings,
				teams,
				users,
			}),
		);
	} finally {
		await client.close();
	}
}

async function main() {
	const args = process.argv.slice(2);

	if (!args[0]) {
		throw new Error('Supply a league UUID, or --source PATH.');
	}

	const offline = args[0] === '--source';
	const source = offline ? JSON.parse(await readFile(args[1], 'utf8')) : await readLeague(args[0]);
	const report = buildLeagueExport(source);
	const outputDir = path.resolve(
		args[offline ? 2 : 1] ?? `exports/${report.league.season}-${report.league.id}`,
	);
	await mkdir(outputDir, { recursive: true });
	await writeFile(path.join(outputDir, 'source.json'), JSON.stringify(source, null, 2) + '\n');
	await writeFile(path.join(outputDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');
	await writeFile(path.join(outputDir, 'season-recap.md'), renderLeagueReport(report));
	console.log(`Exported ${report.members.length} members to ${outputDir}`);
}

main().catch((error) => {
	// Driver errors may contain connection details; keep them out of terminal output.
	console.error(
		error.name?.startsWith('Mongo')
			? 'Database read failed; check connection access.'
			: error.message,
	);
	process.exitCode = 1;
});
