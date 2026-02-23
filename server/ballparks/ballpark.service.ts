import { BallparkModel } from '@/models/ballpark.model';
import { Ballpark, Sport } from '@/types';

import { BaseService } from '../base.service';

class BallparkService extends BaseService<Ballpark> {
	constructor() {
		super(BallparkModel);
	}

	async findByMlbVenueId(mlbVenueId: number): Promise<Ballpark | null> {
		return this.findOne({ mlbVenueId });
	}

	async findBySport(sport: Sport): Promise<Ballpark[]> {
		return this.find({ sport }, { populate: 'team' });
	}

	async findByTeam(teamId: string): Promise<Ballpark | null> {
		return this.findOne({ team: teamId });
	}
}

export const ballparkService = new BallparkService();
