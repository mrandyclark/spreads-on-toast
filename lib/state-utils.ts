/**
 * Immutable state management helpers for arrays and objects.
 * All functions return new references — safe for React state updates.
 */

export const safeArray = <T>(arr?: T[]): T[] => {
	if (Array.isArray(arr)) {
		return [...arr];
	}

	return [];
};

export const safePush = <T>(arr?: T[], toAdd?: T, uniqueKey?: keyof T): T[] => {
	if (!toAdd) {
		return arr || [];
	}

	const safe = safeArray<T>(arr);

	if (uniqueKey) {
		const foundIndex = safe.findIndex((item: T) => {
			return item[uniqueKey] === toAdd[uniqueKey];
		});

		if (foundIndex >= 0) {
			return safe;
		}
	}

	safe.push(toAdd);
	return safe;
};

export const safeJoin = <T>(arr1?: T[], arr2?: T[], uniqueKey?: keyof T): T[] => {
	const safeArr1 = safeArray<T>(arr1);
	const safeArr2 = safeArray<T>(arr2);

	if (!uniqueKey) {
		return [...safeArr1, ...safeArr2];
	}

	const result = [...safeArr1];

	safeArr2.forEach((item) => {
		const exists = result.some((existing) => existing[uniqueKey] === item[uniqueKey]);

		if (!exists) {
			result.push(item);
		}
	});

	return result;
};

export const handleRemoveByKey = <T>(original: T[], key: keyof T, value: T): T[] => {
	const toUpdate = safeArray<T>(original);

	return toUpdate.filter((item: T) => {
		return item[key] !== value[key];
	});
};

export const handleRemoveByIndex = <T>(original?: T[], index?: number): T[] => {
	const toUpdate = safeArray<T>(original);

	if (typeof index === 'undefined' || index < 0 || index >= toUpdate.length) {
		return toUpdate;
	}

	return toUpdate.filter((_, i) => i !== index);
};

export const handleRemoveByFunction = <T>(original: T[], comparer: (item: T) => boolean): T[] => {
	return safeArray<T>(original).filter(comparer);
};

export const safeToggle = <T>(
	arr?: T[],
	toToggle?: T,
	isSelected?: boolean,
	uniqueKey?: keyof T,
): T[] => {
	if (!arr || !toToggle || !uniqueKey) {
		return [] as T[];
	}

	if (isSelected) {
		return safePush<T>(arr, toToggle, uniqueKey);
	}

	return handleRemoveByKey<T>(arr, uniqueKey, toToggle);
};

/**
 * Toggle a primitive value in an array.
 * If the value exists, remove it. If it doesn't, add it.
 */
export const toggleValue = <T>(arr: T[], value: T): T[] => {
	return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
};

export const safeUpdate = <T>(current: T | undefined, key: keyof T, value: unknown): T => {
	return { ...(current || {}), [key]: value } as T;
};

export const safeUpdateMultiple = <T>(
	current?: T,
	updates?: { key: keyof T; value: unknown }[],
): T => {
	if (!current) {
		current = {} as T;
	}

	if (!updates || updates.length === 0) {
		return current;
	}

	let toUpdate: T = { ...current };

	updates.forEach((update) => {
		toUpdate = safeUpdate<T>(toUpdate, update.key, update.value);
	});

	return toUpdate;
};

export const addValueToArray = <T>(current: T, key: keyof T, value: string): T => {
	if (!current) {
		current = {} as T;
	}

	const toUpdate: string[] = (current[key] as string[]) || [];
	toUpdate.push(value);
	return { ...(current || {}), [key]: toUpdate } as T;
};

export const removeValueFromArray = <T>(current: T, key: keyof T, value: unknown): T => {
	if (!current) {
		current = {} as T;
	}

	let toUpdate: string[] = (current[key] as string[]) || [];
	toUpdate = toUpdate.filter((item) => {
		return item !== value;
	});

	return { ...(current || {}), [key]: toUpdate } as T;
};

export const safeReplaceByIndex = <T>(all?: T[], index?: number, value?: T): T[] => {
	if (!all || index === undefined || value === undefined || index < 0 || index >= all.length) {
		return all || [];
	}

	return [...all.slice(0, index), value, ...all.slice(index + 1)];
};

export const handleReplaceByIndex = <T>(all: T[], index: number, value: T): T[] => {
	return index >= 0 ? all.map((item, i) => (i === index ? value : item)) : [...all, value];
};

export const safeUpdateByIndex = <T>(
	all?: T[],
	index?: number,
	key?: keyof T,
	value?: unknown,
): T[] => {
	const toUpdate: T[] = safeArray<T>(all);

	if (typeof index === 'undefined' || !key || !value || index < 0 || !toUpdate[index]) {
		return toUpdate;
	}

	toUpdate[index] = { ...((toUpdate[index] || {}) as T), [key]: value };
	return toUpdate;
};

export const reorderArrayByDragDrop = <T>(
	originalArray: T[],
	dragResult: { destination: null | { index: number }; source: { index: number } },
): T[] => {
	const { destination, source } = dragResult;

	if (!destination) {
		return originalArray;
	}

	const reordered = Array.from(originalArray);
	const [moved] = reordered.splice(source.index, 1);
	reordered.splice(destination.index, 0, moved);

	return reordered;
};
