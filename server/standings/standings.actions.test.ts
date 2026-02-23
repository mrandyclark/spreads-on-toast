import { describe, expect, it, vi } from 'vitest';

import { PickResult } from '@/types';

vi.mock('../chips', () => ({
	calculateLeagueAverages: vi.fn(),
	calculateTeamChips: vi.fn(),
}));

vi.mock('../seasons/season.service', () => ({
	seasonService: { findStarted: vi.fn() },
}));

vi.mock('../seasons/team-line.service', () => ({
	teamLineService: { findBySeason: vi.fn(), findByTeamAndSeason: vi.fn() },
}));

vi.mock('../teams/team.service', () => ({
	teamService: { findById: vi.fn() },
}));

vi.mock('./standing.service', () => ({
	standingService: {
		find: vi.fn(),
		findAllForLatestDate: vi.fn(),
		findByDateAndSeason: vi.fn(),
		findByDatePopulated: vi.fn(),
		findByTeamAndSeason: vi.fn(),
		findDateRange: vi.fn(),
		findDatesBySeason: vi.fn(),
		findLatestDate: vi.fn(),
	},
}));

import { calculatePickResult } from './standings.actions';

describe('standings.actions', () => {
	describe('calculatePickResult', () => {
		it('returns Win for over pick when wins exceed line', () => {
			expect(calculatePickResult('over', 91.5, 95)).toBe(PickResult.Win);
		});

		it('returns Loss for over pick when wins below line', () => {
			expect(calculatePickResult('over', 91.5, 88)).toBe(PickResult.Loss);
		});

		it('returns Win for under pick when wins below line', () => {
			expect(calculatePickResult('under', 91.5, 88)).toBe(PickResult.Win);
		});

		it('returns Loss for under pick when wins exceed line', () => {
			expect(calculatePickResult('under', 91.5, 95)).toBe(PickResult.Loss);
		});

		it('returns Push when wins equal line', () => {
			expect(calculatePickResult('over', 91, 91)).toBe(PickResult.Push);
			expect(calculatePickResult('under', 91, 91)).toBe(PickResult.Push);
		});

		it('handles half-game lines (no push possible)', () => {
			expect(calculatePickResult('over', 91.5, 92)).toBe(PickResult.Win);
			expect(calculatePickResult('over', 91.5, 91)).toBe(PickResult.Loss);
		});

		it('handles edge case of 0 wins', () => {
			expect(calculatePickResult('under', 91.5, 0)).toBe(PickResult.Win);
			expect(calculatePickResult('over', 91.5, 0)).toBe(PickResult.Loss);
		});
	});
});
