import { cache } from 'react';

/**
 * Per-request memoization using React.cache().
 * Deduplicates calls within a single server render — if multiple
 * components call the same function with the same args, the DB
 * is only hit once per request.
 *
 * Usage:
 *   export const getStuff = cached(async (id: string) => { ... });
 */
export function cached<T extends (...args: never[]) => Promise<unknown>>(fn: T): T {
	return cache(fn) as T;
}
