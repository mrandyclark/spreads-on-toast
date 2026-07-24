import { resolveRefId } from '@/lib/ref-utils';
import { SheetModel } from '@/models/sheet.model';
import { PostseasonPicks, Sheet, Sport, TeamPick, WorldSeriesPicks } from '@/types';

import { BaseService } from '../base.service';
import { teamLineService } from '../seasons/team-line.service';

class SheetService extends BaseService<Sheet> {
	constructor() {
		super(SheetModel);
	}

	async createForGroup(input: {
		group: string;
		lockAt: Date;
		season: string;
		sport: Sport;
		user: string;
	}): Promise<Sheet> {
		const teamLines = await teamLineService.findBySeason(input.sport, input.season);
		const snapshotAt = new Date();

		if (teamLines.length === 0) {
			throw new Error(`No ${input.sport} team lines configured for ${input.season}`);
		}

		const teamPicks: TeamPick[] = teamLines.map((tl) => ({
			line: tl.line,
			team: resolveRefId(tl.team)!,
		}));

		return this.create({
			group: input.group,
			lineSnapshotAt: snapshotAt,
			lockAt: input.lockAt,
			sport: input.sport,
			teamPicks,
			user: input.user,
		});
	}

	async findByGroupAndUser(groupId: string, userId: string): Promise<null | Sheet> {
		return this.findOne({ group: groupId, user: userId });
	}

	async findByGroupAndUserPopulated(groupId: string, userId: string): Promise<null | Sheet> {
		return this.findOne({ group: groupId, user: userId }, { populate: 'teamPicks.team' });
	}

	async findByGroup(groupId: string): Promise<Sheet[]> {
		return this.find({ group: groupId });
	}

	async findByUserAndGroupPopulated(userId: string, groupId: string): Promise<null | Sheet> {
		return this.findOne({ group: groupId, user: userId }, { populate: 'teamPicks.team' });
	}

	async getOrCreate(input: {
		group: string;
		lockAt: Date;
		season: string;
		sport: Sport;
		user: string;
	}): Promise<Sheet> {
		const existing = await this.findByGroupAndUser(input.group, input.user);

		if (existing) {
			return existing;
		}

		return this.createForGroup(input);
	}

	async ensureHistoricalSnapshot(
		sheet: Sheet,
		lockAt: Date,
		linesByTeamId: Map<string, number>,
	): Promise<null | Sheet> {
		const teamPicks = sheet.teamPicks.map((teamPick) => {
			const teamId = resolveRefId(teamPick.team)!;
			const line = teamPick.line ?? linesByTeamId.get(teamId);

			if (typeof line !== 'number' || !Number.isFinite(line)) {
				throw new Error(`No immutable line is available for team ${teamId}`);
			}

			return {
				...teamPick,
				line,
				team: teamId,
			};
		});

		return this.findOneAndUpdate(
			{ _id: sheet.id, lockAt: { $exists: false } },
			{
				$set: {
					lineSnapshotAt: new Date(),
					lockAt,
					teamPicks,
				},
			},
		);
	}

	async updatePicksBeforeLock(
		sheetId: string,
		userId: string,
		teamPicks: TeamPick[],
		input: {
			postseasonPicks?: PostseasonPicks;
			worldSeriesPicks?: WorldSeriesPicks;
		},
		now = new Date(),
	): Promise<null | Sheet> {
		const updateFields: Record<string, unknown> = {
			lastSavedAt: now,
			teamPicks,
		};

		if (input.postseasonPicks !== undefined) {
			updateFields.postseasonPicks = input.postseasonPicks;
		}

		if (input.worldSeriesPicks !== undefined) {
			updateFields.worldSeriesPicks = input.worldSeriesPicks;
		}

		return this.findOneAndUpdate(
			{
				_id: sheetId,
				lockAt: { $gt: now },
				user: userId,
			},
			{ $set: updateFields },
		);
	}
}

export const sheetService = new SheetService();
