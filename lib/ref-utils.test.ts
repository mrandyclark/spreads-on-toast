import { describe, expect, it } from 'vitest';

import { resolveRef, resolveRefId, resolveRefIds } from './ref-utils';

interface MockDoc {
	id: string;
	name: string;
}

const mockDoc: MockDoc = { id: 'abc123', name: 'Test' };

describe('ref-utils', () => {
	describe('resolveRef', () => {
		it('returns object when ref is populated', () => {
			expect(resolveRef(mockDoc)).toBe(mockDoc);
		});

		it('returns null when ref is a string', () => {
			expect(resolveRef('abc123')).toBeNull();
		});
	});

	describe('resolveRefId', () => {
		it('returns id from populated object', () => {
			expect(resolveRefId(mockDoc)).toBe('abc123');
		});

		it('returns string as-is when unpopulated', () => {
			expect(resolveRefId('abc123')).toBe('abc123');
		});

		it('returns undefined when ref is undefined', () => {
			expect(resolveRefId(undefined)).toBeUndefined();
		});
	});

	describe('resolveRefIds', () => {
		it('returns ids from mixed array', () => {
			const refs = [mockDoc, 'def456', { id: 'ghi789', name: 'Other' }];
			expect(resolveRefIds(refs)).toEqual(['abc123', 'def456', 'ghi789']);
		});

		it('returns empty array for undefined', () => {
			expect(resolveRefIds(undefined)).toEqual([]);
		});

		it('returns empty array for empty array', () => {
			expect(resolveRefIds([])).toEqual([]);
		});
	});
});
