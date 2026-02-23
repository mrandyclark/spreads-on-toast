import { describe, expect, it } from 'vitest';

import { calculateProjectedWins, calculatePythagoreanWins } from './index';

describe('mlb-api', () => {
	describe('calculateProjectedWins', () => {
		it('projects full season wins from current pace', () => {
			expect(calculateProjectedWins(50, 81, 162)).toBe(100);
		});

		it('returns 0 for 0 games played', () => {
			expect(calculateProjectedWins(0, 0)).toBe(0);
		});

		it('rounds to 1 decimal for display', () => {
			expect(calculateProjectedWins(45, 80, 162, true)).toBe(91.1);
		});

		it('returns full precision when not for display', () => {
			const result = calculateProjectedWins(45, 80, 162, false);
			expect(result).toBeCloseTo(91.125, 3);
		});

		it('handles perfect record', () => {
			expect(calculateProjectedWins(81, 81, 162)).toBe(162);
		});
	});

	describe('calculatePythagoreanWins', () => {
		it('returns 0 for 0 games played', () => {
			expect(calculatePythagoreanWins(0, 0, 0)).toBe(0);
		});

		it('returns 0 for 0 runs scored', () => {
			expect(calculatePythagoreanWins(0, 100, 81)).toBe(0);
		});

		it('returns 0 for 0 runs allowed', () => {
			expect(calculatePythagoreanWins(100, 0, 81)).toBe(0);
		});

		it('projects ~81 wins for equal runs scored/allowed', () => {
			const result = calculatePythagoreanWins(400, 400, 81, 162);
			expect(result).toBe(81);
		});

		it('projects more wins when outscoring opponents', () => {
			const result = calculatePythagoreanWins(500, 350, 81, 162);
			expect(result).toBeGreaterThan(81);
		});

		it('projects fewer wins when outscored by opponents', () => {
			const result = calculatePythagoreanWins(350, 500, 81, 162);
			expect(result).toBeLessThan(81);
		});
	});
});
