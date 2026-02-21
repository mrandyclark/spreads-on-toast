import { GroupModel } from '@/models/group.model';
import { Group, GroupRole, GroupVisibility, Sport } from '@/types';

import { BaseService } from '../base.service';

class GroupService extends BaseService<Group> {
	constructor() {
		super(GroupModel);
	}

	async createGroup(input: {
		lockDate: Date;
		name: string;
		owner: string;
		season: string;
		sport: Sport;
	}): Promise<Group> {
		return this.create({
			inviteCode: GroupService.generateInviteCode(),
			lockDate: input.lockDate,
			members: [{ joinedAt: new Date(), role: GroupRole.Owner, user: input.owner }],
			name: input.name,
			owner: input.owner,
			season: input.season,
			sport: input.sport,
			visibility: GroupVisibility.Active,
		});
	}

	async findByUser(userId: string): Promise<Group[]> {
		return this.find({ 'members.user': userId }, { sort: { createdAt: -1 } });
	}

	async findByInviteCode(code: string): Promise<Group | null> {
		return this.findOne({ inviteCode: code.trim().toUpperCase() });
	}

	async isMember(groupId: string, userId: string): Promise<boolean> {
		const group = await this.findOne({ _id: groupId, 'members.user': userId });
		return !!group;
	}

	async isOwner(groupId: string, userId: string): Promise<boolean> {
		const group = await this.findOne({ _id: groupId, owner: userId });
		return !!group;
	}

	async findByUserSportSeason(userId: string, sport: Sport, season: string): Promise<Group[]> {
		return this.find({ 'members.user': userId, season, sport });
	}

	async addMember(groupId: string, userId: string): Promise<Group | null> {
		return this.findByIdAndUpdate(groupId, {
			$push: {
				members: { joinedAt: new Date(), role: GroupRole.Member, user: userId },
			},
		});
	}

	async findForMemberPopulated(groupId: string, userId: string): Promise<Group | null> {
		return this.findOne({ _id: groupId, 'members.user': userId }, { populate: 'members.user' });
	}

	private static generateInviteCode(): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let code = '';

		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}

		return code;
	}
}

export const groupService = new GroupService();
