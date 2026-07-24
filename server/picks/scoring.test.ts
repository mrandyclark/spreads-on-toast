import { describe, expect, it } from 'vitest';

import { Season, SeasonStatus, Sport } from '@/types';

import { isSeasonFinalForScoring, selectWinsForScoring } from './scoring';

const season: Season = {
	createdAt: new Date(),
	endDate: new Date('2026-10-01T00:00:00.000Z'),
	id: 'season-one',
	lockDate: new Date('2026-03-26T00:00:00.000Z'),
	name: '2026 MLB',
	season: '2026',
	sport: Sport.MLB,
	startDate: new Date('2026-03-26T00:00:00.000Z'),
	status: SeasonStatus.Active,
	updatedAt: new Date(),
};

describe('pick scoring source', () => {
	it('uses actual wins for completed seasons and dates after the configured end', () => {
		expect(isSeasonFinalForScoring({ ...season, status: SeasonStatus.Completed }, undefined)).toBe(
			true,
		);
		expect(isSeasonFinalForScoring(season, '2026-10-02')).toBe(true);
	});

	it('uses projections while a season is live', () => {
		expect(isSeasonFinalForScoring(season, '2026-07-24')).toBe(false);
		expect(selectWinsForScoring({ projectedWins: 88, pythagoreanWins: 90, wins: 54 }, false)).toBe(
			90,
		);
	});

	it('uses actual wins for final scoring', () => {
		expect(selectWinsForScoring({ projectedWins: 88, pythagoreanWins: 90, wins: 87 }, true)).toBe(
			87,
		);
	});
});
