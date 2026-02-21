import { UserModel } from '@/models/user.model';
import { User } from '@/types';

import { BaseService } from '../base.service';

class UserService extends BaseService<User> {
	constructor() {
		super(UserModel);
	}

	async findByKindeId(kindeId: string): Promise<null | User> {
		return this.findOne({ kindeId });
	}

	async updateByKindeId(
		kindeId: string,
		updates: Partial<Omit<User, 'createdAt' | 'id' | 'kindeId' | 'updatedAt'>>,
	): Promise<null | User> {
		return this.findOneAndUpdate({ kindeId }, { $set: updates });
	}
}

export const userService = new UserService();
