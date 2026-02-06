import { Ref } from '@/types';

// Helper to get ID from a Ref (works whether populated or not)
export function getRefId<T extends { id: string }>(ref: Ref<T> | undefined): string | undefined {
	if (!ref) {
		return undefined;
	}

	if (typeof ref === 'string') {
		return ref;
	}

	return ref.id;
}

// Helper to check if a Ref is populated (is an object, not a string)
export function isPopulated<T>(ref: Ref<T> | undefined): ref is T {
	return ref !== undefined && typeof ref !== 'string';
}
