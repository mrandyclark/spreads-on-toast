import { TeamStandingModel } from '@/models/team-standing.model';
import { TeamStanding } from '@/types';

import { BaseService } from '../base.service';

class StandingService extends BaseService<TeamStanding> {
	constructor() {
		super(TeamStandingModel);
	}

	async findByTeamAndSeason(teamId: string, season: string, options?: { select?: string }): Promise<TeamStanding[]> {
		return this.find({ season, team: teamId }, { sort: { date: 1 }, ...options });
	}

	async findByDateAndSeason(date: Date, season: string, options?: { select?: string }): Promise<TeamStanding[]> {
		return this.find({ date, season }, options);
	}

	async findByDatePopulated(date: Date, season: string): Promise<TeamStanding[]> {
		return this.find({ date, season }, { populate: 'team' });
	}

	async findByTeamSeasonDate(teamId: string, season: string, date: Date): Promise<null | TeamStanding> {
		const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		return this.findOne({ date: normalizedDate, season, team: teamId });
	}

	async findLatestByDate(season: string): Promise<null | TeamStanding> {
		return this.findOne({ season }, { select: 'date' });
	}

	async findLatestDate(season: string): Promise<Date | null> {
		const doc = await this.findOne({ season }, { select: 'date', sort: { date: -1 } });
		return doc?.date ?? null;
	}

	async findAllForLatestDate(season: string): Promise<TeamStanding[]> {
		const latestDate = await this.findLatestDate(season);

		if (!latestDate) {
			return [];
		}

		return this.find({ date: latestDate, season });
	}

	async findDateRange(season: string): Promise<{ maxDate: Date | null; minDate: Date | null }> {
		const [earliest, latest] = await Promise.all([
			this.findOne({ season }, { select: 'date', sort: { date: 1 } }),
			this.findOne({ season }, { select: 'date', sort: { date: -1 } }),
		]);

		return {
			maxDate: latest?.date ?? null,
			minDate: earliest?.date ?? null,
		};
	}

	async findDistinctDates(season: string): Promise<Date[]> {
		const dates = await this.distinct<Date>('date', { season });
		return dates.sort((a, b) => b.getTime() - a.getTime());
	}

	async findDatesBySeason(): Promise<Map<string, string[]>> {
		const results = await this.aggregate<{ _id: string; dates: Date[] }>([
			{ $group: { _id: '$season', dates: { $addToSet: '$date' } } },
		]);

		const map = new Map<string, string[]>();

		for (const entry of results) {
			const sorted = entry.dates
				.sort((a, b) => b.getTime() - a.getTime())
				.map((d) => d.toISOString().split('T')[0]);
			map.set(entry._id, sorted);
		}

		return map;
	}
}

export const standingService = new StandingService();
