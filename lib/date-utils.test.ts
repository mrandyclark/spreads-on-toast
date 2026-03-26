import { describe, expect, it } from 'vitest';

import { formatDateDisplay, formatGameDate, formatGameTime, formatShortDate, toDateString, todayET } from './date-utils';

describe('date-utils', () => {
	describe('toDateString', () => {
		it('returns YYYY-MM-DD string as-is', () => {
			expect(toDateString('2025-06-15')).toBe('2025-06-15');
		});

		it('extracts date from ISO string', () => {
			expect(toDateString('2025-09-26T00:00:00.000Z')).toBe('2025-09-26');
		});

		it('converts Date object to YYYY-MM-DD using UTC', () => {
			const date = new Date('2025-06-15T00:00:00.000Z');
			expect(toDateString(date)).toBe('2025-06-15');
		});

		it('does not shift midnight UTC dates back a day', () => {
			const date = new Date('2026-03-26T00:00:00.000Z');
			expect(toDateString(date)).toBe('2026-03-26');
		});

		it('returns today for undefined', () => {
			const result = toDateString(undefined);
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});

		it('returns today for invalid date string', () => {
			const result = toDateString('not-a-date');
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});

	describe('formatDateDisplay', () => {
		it('formats date with ordinal suffix', () => {
			expect(formatDateDisplay('2025-09-03')).toBe('September 3rd, 2025');
		});

		it('handles 1st', () => {
			expect(formatDateDisplay('2025-06-01')).toBe('June 1st, 2025');
		});

		it('handles 2nd', () => {
			expect(formatDateDisplay('2025-06-02')).toBe('June 2nd, 2025');
		});

		it('handles 11th (teen exception)', () => {
			expect(formatDateDisplay('2025-06-11')).toBe('June 11th, 2025');
		});

		it('handles 21st', () => {
			expect(formatDateDisplay('2025-06-21')).toBe('June 21st, 2025');
		});

		it('handles ISO string input', () => {
			expect(formatDateDisplay('2025-09-03T00:00:00.000Z')).toBe('September 3rd, 2025');
		});

		it('returns Invalid date for garbage', () => {
			expect(formatDateDisplay('nope')).toBe('Invalid date');
		});
	});

	describe('formatShortDate', () => {
		it('formats as M/D', () => {
			const date = new Date(2025, 5, 2); // June 2
			expect(formatShortDate(date)).toBe('6/2');
		});

		it('does not pad single digits', () => {
			const date = new Date(2025, 0, 5); // Jan 5
			expect(formatShortDate(date)).toBe('1/5');
		});
	});

	describe('todayET', () => {
		it('returns YYYY-MM-DD format', () => {
			const result = todayET();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});

		it('returns a valid date', () => {
			const result = todayET();
			const [year, month, day] = result.split('-').map(Number);
			expect(year).toBeGreaterThanOrEqual(2025);
			expect(month).toBeGreaterThanOrEqual(1);
			expect(month).toBeLessThanOrEqual(12);
			expect(day).toBeGreaterThanOrEqual(1);
			expect(day).toBeLessThanOrEqual(31);
		});
	});

	describe('formatGameDate', () => {
		it('formats Date object', () => {
			const result = formatGameDate(new Date('2025-06-02T23:10:00.000Z'));
			expect(result).toContain('June');
			expect(result).toContain('2025');
		});

		it('formats ISO string', () => {
			const result = formatGameDate('2025-06-02T23:10:00.000Z');
			expect(result).toContain('June');
			expect(result).toContain('2025');
		});

		it('uses ET timezone so midnight UTC stays same date', () => {
			const result = formatGameDate('2025-06-02T00:00:00.000Z');
			expect(result).toContain('June 1');
		});
	});

	describe('formatGameTime', () => {
		it('formats with default ET timezone', () => {
			const result = formatGameTime('2025-06-02T23:10:00.000Z');
			expect(result).toMatch(/\d{1,2}:\d{2}\s[AP]M\s[A-Z]{2,4}/);
		});

		it('formats ISO string', () => {
			const result = formatGameTime('2025-06-02T23:10:00.000Z');
			expect(result).toContain('PM');
		});

		it('accepts custom timezone', () => {
			const result = formatGameTime('2025-06-02T23:10:00.000Z', 'America/Chicago');
			expect(result).toContain('CDT');
		});

		it('accepts Date object', () => {
			const result = formatGameTime(new Date('2025-06-02T23:10:00.000Z'));
			expect(result).toMatch(/\d{1,2}:\d{2}\s[AP]M\s[A-Z]{2,4}/);
		});
	});
});
