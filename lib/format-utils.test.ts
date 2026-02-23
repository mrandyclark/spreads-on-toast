import { describe, expect, it } from 'vitest';

import { countAndPluralize, formatMoney, getOrdinalSuffix, ordinal, pluralize } from './format-utils';

describe('format-utils', () => {
	describe('pluralize', () => {
		it('returns singular when count is 1', () => {
			expect(pluralize('member', 1)).toBe('member');
		});

		it('adds s for regular nouns', () => {
			expect(pluralize('member', 2)).toBe('members');
		});

		it('handles -y → -ies', () => {
			expect(pluralize('cherry', 2)).toBe('cherries');
		});

		it('handles -ch → -ches', () => {
			expect(pluralize('match', 2)).toBe('matches');
		});

		it('handles -sh → -shes', () => {
			expect(pluralize('wish', 3)).toBe('wishes');
		});

		it('handles -ss → -sses', () => {
			expect(pluralize('loss', 2)).toBe('losses');
		});

		it('handles -x → -xes', () => {
			expect(pluralize('box', 2)).toBe('boxes');
		});

		it('handles irregular: person → people', () => {
			expect(pluralize('person', 2)).toBe('people');
		});

		it('handles uncountable: sheep', () => {
			expect(pluralize('sheep', 5)).toBe('sheep');
		});

		it('returns noun as-is when count is undefined', () => {
			expect(pluralize('member')).toBe('member');
		});

		it('returns noun as-is for empty string', () => {
			expect(pluralize('')).toBe('');
		});

		it('adds s for count 0', () => {
			expect(pluralize('member', 0)).toBe('members');
		});
	});

	describe('countAndPluralize', () => {
		it('formats singular', () => {
			expect(countAndPluralize(1, 'member')).toBe('1 member');
		});

		it('formats plural', () => {
			expect(countAndPluralize(3, 'member')).toBe('3 members');
		});

		it('formats zero', () => {
			expect(countAndPluralize(0, 'pick')).toBe('0 picks');
		});
	});

	describe('formatMoney', () => {
		it('formats whole number', () => {
			expect(formatMoney(1000)).toBe('$1,000.00');
		});

		it('formats decimal', () => {
			expect(formatMoney(1234.5)).toBe('$1,234.50');
		});

		it('formats zero', () => {
			expect(formatMoney(0)).toBe('$0.00');
		});

		it('formats negative', () => {
			expect(formatMoney(-50)).toBe('-$50.00');
		});
	});

	describe('getOrdinalSuffix', () => {
		it('returns st for 1', () => {
			expect(getOrdinalSuffix(1)).toBe('st');
		});

		it('returns nd for 2', () => {
			expect(getOrdinalSuffix(2)).toBe('nd');
		});

		it('returns rd for 3', () => {
			expect(getOrdinalSuffix(3)).toBe('rd');
		});

		it('returns th for 4-9', () => {
			expect(getOrdinalSuffix(4)).toBe('th');
			expect(getOrdinalSuffix(9)).toBe('th');
		});

		it('returns th for teens (11-13)', () => {
			expect(getOrdinalSuffix(11)).toBe('th');
			expect(getOrdinalSuffix(12)).toBe('th');
			expect(getOrdinalSuffix(13)).toBe('th');
		});

		it('returns st/nd/rd for 21/22/23', () => {
			expect(getOrdinalSuffix(21)).toBe('st');
			expect(getOrdinalSuffix(22)).toBe('nd');
			expect(getOrdinalSuffix(23)).toBe('rd');
		});
	});

	describe('ordinal', () => {
		it('formats 1st', () => {
			expect(ordinal(1)).toBe('1st');
		});

		it('formats 11th', () => {
			expect(ordinal(11)).toBe('11th');
		});

		it('formats 22nd', () => {
			expect(ordinal(22)).toBe('22nd');
		});

		it('formats 103rd', () => {
			expect(ordinal(103)).toBe('103rd');
		});
	});
});
