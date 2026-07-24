import mongoose from 'mongoose';

import { dbConnect } from '@/lib/mongoose';
import { GroupModel } from '@/models/group.model';
import { SheetModel } from '@/models/sheet.model';
import { TeamLineModel } from '@/models/team-line.model';

interface MigrationSummary {
	errors: string[];
	skipped: number;
	updated: number;
}

const migrate = async (): Promise<MigrationSummary> => {
	await dbConnect();

	const sheets = await SheetModel.find({
		$or: [
			{ lineSnapshotAt: { $exists: false } },
			{ lockAt: { $exists: false } },
			{ 'teamPicks.line': { $exists: false } },
		],
	}).lean();
	const summary: MigrationSummary = { errors: [], skipped: 0, updated: 0 };

	for (const sheet of sheets) {
		const group = await GroupModel.findById(sheet.group).lean();

		if (!group) {
			summary.errors.push(`Sheet ${sheet._id.toString()} references a missing group`);
			continue;
		}

		const teamLines = await TeamLineModel.find({
			season: group.season,
			sport: group.sport,
		}).lean();
		const linesByTeamId = new Map(
			teamLines.map((teamLine) => [teamLine.team.toString(), teamLine.line]),
		);
		let missingLine = false;
		const teamPicks = sheet.teamPicks.map((teamPick) => {
			const teamId = teamPick.team.toString();
			const line = teamPick.line ?? linesByTeamId.get(teamId);

			if (line === undefined) {
				missingLine = true;
			}

			return {
				...teamPick,
				line,
			};
		});

		if (missingLine) {
			summary.errors.push(
				`Sheet ${sheet._id.toString()} has teams without a ${group.sport} ${group.season} line`,
			);
			continue;
		}

		const result = await SheetModel.updateOne(
			{
				$or: [
					{ lineSnapshotAt: { $exists: false } },
					{ lockAt: { $exists: false } },
					{ 'teamPicks.line': { $exists: false } },
				],
				_id: sheet._id,
			},
			{
				$set: {
					lineSnapshotAt: sheet.lineSnapshotAt ?? new Date(),
					lockAt: sheet.lockAt ?? group.lockDate,
					teamPicks,
				},
			},
		);

		if (result.modifiedCount === 1) {
			summary.updated++;
		} else {
			summary.skipped++;
		}
	}

	return summary;
};

migrate()
	.then(async (summary) => {
		console.log(JSON.stringify({ event: 'sheet_snapshot_migration_complete', ...summary }));
		await mongoose.disconnect();

		if (summary.errors.length > 0) {
			process.exitCode = 1;
		}
	})
	.catch(async (error) => {
		console.error(
			JSON.stringify({
				error: error instanceof Error ? error.message : String(error),
				event: 'sheet_snapshot_migration_failed',
			}),
		);
		await mongoose.disconnect();
		process.exitCode = 1;
	});
