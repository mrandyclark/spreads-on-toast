import { TeamLineModel } from '@/models/team-line.model';
import { Sport, TeamLine } from '@/types';

import { BaseService } from '../base.service';

class TeamLineService extends BaseService<TeamLine> {
	constructor() {
		super(TeamLineModel);
	}

	async findByTeamAndSeason(teamId: string, season: string): Promise<null | TeamLine> {
		return this.findOne({ season, team: teamId });
	}

	async findBySeason(sport: Sport, season: string): Promise<TeamLine[]> {
		return this.find({ season, sport });
	}
}

export const teamLineService = new TeamLineService();
