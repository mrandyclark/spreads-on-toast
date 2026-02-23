import { resolveRefId } from '@/lib/ref-utils';
import { SheetModel } from '@/models/sheet.model';
import { Sheet, Sport, TeamPick } from '@/types';

import { BaseService } from '../base.service';
import { teamLineService } from '../seasons/team-line.service';

class SheetService extends BaseService<Sheet> {
	constructor() {
		super(SheetModel);
	}

	async createForGroup(input: { group: string; season: string; sport: Sport; user: string }): Promise<Sheet> {
		const teamLines = await teamLineService.findBySeason(input.sport, input.season);

		const teamPicks: TeamPick[] = teamLines.map((tl) => ({
			team: resolveRefId(tl.team)!,
		}));

		return this.create({
			group: input.group,
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

	async findByUser(userId: string): Promise<Sheet[]> {
		return this.find({ user: userId });
	}

	async findByGroupPopulated(groupId: string): Promise<Sheet[]> {
		return this.find({ group: groupId }, { populate: 'teamPicks.team' });
	}

	async findByUserAndGroupPopulated(userId: string, groupId: string): Promise<null | Sheet> {
		return this.findOne({ group: groupId, user: userId }, { populate: 'teamPicks.team' });
	}

	async getOrCreate(input: { group: string; season: string; sport: Sport; user: string }): Promise<Sheet> {
		const existing = await this.findByGroupAndUser(input.group, input.user);

		if (existing) {
			return existing;
		}

		return this.createForGroup(input);
	}
}

export const sheetService = new SheetService();
