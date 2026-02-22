import { resolveRefId } from '@/lib/ref-utils';
import { SignModel } from '@/models/sign.model';
import { Sign, SignRole } from '@/types';

import { BaseService } from '../base.service';

class SignService extends BaseService<Sign> {
	constructor() {
		super(SignModel);
	}

	async addMember(signId: string, userId: string, role: SignRole = SignRole.Viewer): Promise<null | Sign> {
		const sign = await this.findById(signId);

		if (!sign) {
			return null;
		}

		// Already a member
		if (sign.members.some((m) => resolveRefId(m.user) === userId)) {
			return sign;
		}

		return this.findByIdAndUpdate(signId, {
			$push: { members: { joinedAt: new Date(), role, user: userId } },
		});
	}

	async createSign(owner: string, title: string, config?: Partial<Sign['config']>): Promise<Sign> {
		return this.create({
			config,
			members: [{ joinedAt: new Date(), role: SignRole.Owner, user: owner }],
			owner,
			title,
		});
	}

	async findByUser(userId: string): Promise<Sign[]> {
		return this.find(
			{ 'members.user': userId },
			{ sort: { createdAt: -1 } },
		);
	}

	async isMember(signId: string, userId: string): Promise<boolean> {
		const sign = await this.findOne({ _id: signId, 'members.user': userId });
		return !!sign;
	}

	async isOwner(signId: string, userId: string): Promise<boolean> {
		const sign = await this.findOne({ _id: signId, owner: userId });
		return !!sign;
	}

	async removeMember(signId: string, userId: string): Promise<null | Sign> {
		return this.findByIdAndUpdate(signId, {
			$pull: { members: { user: userId } },
		});
	}

	async updateConfig(signId: string, config: Partial<Sign['config']>): Promise<null | Sign> {
		// Flatten nested config fields to dot notation for partial updates
		const updateFields: Record<string, unknown> = {};

		Object.entries(config).forEach(([section, sectionValue]) => {
			if (sectionValue && typeof sectionValue === 'object') {
				Object.entries(sectionValue as unknown as Record<string, unknown>).forEach(([field, fieldValue]) => {
					if (fieldValue !== undefined) {
						updateFields[`config.${section}.${field}`] = fieldValue;
					}
				});
			}
		});

		if (Object.keys(updateFields).length === 0) {
			return this.findById(signId);
		}

		return this.findByIdAndUpdate(signId, { $set: updateFields });
	}
}

export const signService = new SignService();
