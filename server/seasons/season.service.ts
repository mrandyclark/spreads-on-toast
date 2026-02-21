import { SeasonModel } from '@/models/season.model';
import { Season, SeasonStatus, Sport } from '@/types';

import { BaseService } from '../base.service';

class SeasonService extends BaseService<Season> {
	constructor() {
		super(SeasonModel);
	}

	async findBySportAndYear(sport: Sport, year: string): Promise<null | Season> {
		return this.findOne({ season: year, sport });
	}

	async findBySport(sport: Sport): Promise<Season[]> {
		return this.find({ sport }, { sort: { season: -1 } });
	}

	async findAvailable(sport: Sport): Promise<Season[]> {
		return this.find(
			{ sport, status: { $in: [SeasonStatus.Upcoming, SeasonStatus.Active] } },
			{ sort: { season: -1 } },
		);
	}

	async findStarted(sport: Sport): Promise<Season[]> {
		return this.find(
			{ sport, startDate: { $lte: new Date() } },
			{ sort: { season: -1 } },
		);
	}
}

export const seasonService = new SeasonService();
