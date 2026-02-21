import { TeamModel } from '@/models/team.model';
import { Sport, Team } from '@/types';

import { BaseService } from '../base.service';

class TeamService extends BaseService<Team> {
	constructor() {
		super(TeamModel);
	}

	async findByAbbreviation(abbreviation: string, sport: Sport): Promise<null | Team> {
		return this.findOne({ abbreviation: abbreviation.toUpperCase(), sport });
	}

	async findByIds(ids: string[]): Promise<Team[]> {
		return this.find({ _id: { $in: ids } });
	}

	async findBySport(sport: Sport): Promise<Team[]> {
		return this.find({ sport }, { sort: { name: 1 } });
	}

	async findMlbTeams(): Promise<Team[]> {
		return this.findBySport(Sport.MLB);
	}

	async findWithExternalIds(sport: Sport): Promise<Team[]> {
		return this.find(
			{ externalId: { $exists: true }, sport },
			{ select: 'externalId abbreviation name conference division' },
		);
	}
}

export const teamService = new TeamService();
