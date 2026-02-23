import { describe, expect, it } from 'vitest';

import {
	addValueToArray,
	handleRemoveByFunction,
	handleRemoveByIndex,
	handleRemoveByKey,
	handleReplaceByIndex,
	reorderArrayByDragDrop,
	safeArray,
	safeJoin,
	safePush,
	safeReplaceByIndex,
	safeToggle,
	safeUpdate,
	safeUpdateByIndex,
	safeUpdateMultiple,
	removeValueFromArray,
	toggleValue,
} from './state-utils';

interface Item {
	id: string;
	name: string;
}

const a: Item = { id: '1', name: 'Alice' };
const b: Item = { id: '2', name: 'Bob' };
const c: Item = { id: '3', name: 'Charlie' };

describe('state-utils', () => {
	describe('safeArray', () => {
		it('clones an array', () => {
			const arr = [1, 2, 3];
			const result = safeArray(arr);
			expect(result).toEqual([1, 2, 3]);
			expect(result).not.toBe(arr);
		});

		it('returns empty array for undefined', () => {
			expect(safeArray(undefined)).toEqual([]);
		});
	});

	describe('safePush', () => {
		it('adds item to array', () => {
			expect(safePush([a], b)).toEqual([a, b]);
		});

		it('returns original if toAdd is undefined', () => {
			expect(safePush([a], undefined)).toEqual([a]);
		});

		it('prevents duplicates with uniqueKey', () => {
			expect(safePush([a], { id: '1', name: 'Duplicate' }, 'id')).toEqual([a]);
		});

		it('allows non-duplicate with uniqueKey', () => {
			expect(safePush([a], b, 'id')).toEqual([a, b]);
		});
	});

	describe('safeJoin', () => {
		it('concatenates two arrays', () => {
			expect(safeJoin([a], [b])).toEqual([a, b]);
		});

		it('deduplicates with uniqueKey', () => {
			expect(safeJoin([a, b], [b, c], 'id')).toEqual([a, b, c]);
		});

		it('handles undefined arrays', () => {
			expect(safeJoin(undefined, [a])).toEqual([a]);
			expect(safeJoin([a], undefined)).toEqual([a]);
		});
	});

	describe('handleRemoveByKey', () => {
		it('removes item matching key', () => {
			expect(handleRemoveByKey([a, b, c], 'id', b)).toEqual([a, c]);
		});
	});

	describe('handleRemoveByIndex', () => {
		it('removes item at index', () => {
			expect(handleRemoveByIndex([a, b, c], 1)).toEqual([a, c]);
		});

		it('returns copy for out-of-bounds index', () => {
			expect(handleRemoveByIndex([a, b], 5)).toEqual([a, b]);
		});

		it('returns copy for undefined index', () => {
			expect(handleRemoveByIndex([a, b], undefined)).toEqual([a, b]);
		});

		it('returns empty array for undefined array', () => {
			expect(handleRemoveByIndex(undefined, 0)).toEqual([]);
		});
	});

	describe('handleRemoveByFunction', () => {
		it('keeps items matching predicate', () => {
			expect(handleRemoveByFunction([a, b, c], (item) => item.id !== '2')).toEqual([a, c]);
		});
	});

	describe('toggleValue', () => {
		it('adds value if not present', () => {
			expect(toggleValue([1, 2], 3)).toEqual([1, 2, 3]);
		});

		it('removes value if present', () => {
			expect(toggleValue([1, 2, 3], 2)).toEqual([1, 3]);
		});
	});

	describe('safeToggle', () => {
		it('adds when isSelected is true', () => {
			expect(safeToggle([a], b, true, 'id')).toEqual([a, b]);
		});

		it('removes when isSelected is false', () => {
			expect(safeToggle([a, b], b, false, 'id')).toEqual([a]);
		});

		it('returns empty array when args missing', () => {
			expect(safeToggle(undefined, a, true, 'id')).toEqual([]);
		});
	});

	describe('safeUpdate', () => {
		it('updates a key on an object', () => {
			expect(safeUpdate(a, 'name', 'Updated')).toEqual({ id: '1', name: 'Updated' });
		});

		it('handles undefined current', () => {
			expect(safeUpdate(undefined as unknown as Item, 'name', 'New')).toEqual({ name: 'New' });
		});
	});

	describe('safeUpdateMultiple', () => {
		it('applies multiple updates', () => {
			const result = safeUpdateMultiple(a, [
				{ key: 'name', value: 'Updated' },
				{ key: 'id', value: '99' },
			]);
			expect(result).toEqual({ id: '99', name: 'Updated' });
		});

		it('returns current for empty updates', () => {
			expect(safeUpdateMultiple(a, [])).toEqual(a);
		});
	});

	describe('addValueToArray', () => {
		it('adds value to array property', () => {
			const obj = { id: '1', tags: ['a'] };
			const result = addValueToArray(obj, 'tags', 'b');
			expect(result.tags).toContain('b');
		});
	});

	describe('removeValueFromArray', () => {
		it('removes value from array property', () => {
			const obj = { id: '1', tags: ['a', 'b', 'c'] };
			const result = removeValueFromArray(obj, 'tags', 'b');
			expect(result.tags).toEqual(['a', 'c']);
		});
	});

	describe('safeReplaceByIndex', () => {
		it('replaces item at index', () => {
			expect(safeReplaceByIndex([a, b, c], 1, { id: '2', name: 'Updated' })).toEqual([
				a,
				{ id: '2', name: 'Updated' },
				c,
			]);
		});

		it('returns original for out-of-bounds', () => {
			expect(safeReplaceByIndex([a], 5, b)).toEqual([a]);
		});

		it('returns empty array for undefined array', () => {
			expect(safeReplaceByIndex(undefined, 0, a)).toEqual([]);
		});
	});

	describe('handleReplaceByIndex', () => {
		it('replaces at valid index', () => {
			expect(handleReplaceByIndex([a, b], 0, c)).toEqual([c, b]);
		});

		it('appends for negative index', () => {
			expect(handleReplaceByIndex([a], -1, b)).toEqual([a, b]);
		});
	});

	describe('safeUpdateByIndex', () => {
		it('updates a key at index', () => {
			const result = safeUpdateByIndex([a, b], 1, 'name', 'Updated');
			expect(result[1].name).toBe('Updated');
		});

		it('returns copy for undefined index', () => {
			expect(safeUpdateByIndex([a, b], undefined, 'name', 'X')).toEqual([a, b]);
		});
	});

	describe('reorderArrayByDragDrop', () => {
		it('moves item from source to destination', () => {
			const result = reorderArrayByDragDrop([a, b, c], {
				destination: { index: 0 },
				source: { index: 2 },
			});
			expect(result).toEqual([c, a, b]);
		});

		it('returns original if no destination', () => {
			const result = reorderArrayByDragDrop([a, b, c], {
				destination: null,
				source: { index: 0 },
			});
			expect(result).toEqual([a, b, c]);
		});
	});
});
