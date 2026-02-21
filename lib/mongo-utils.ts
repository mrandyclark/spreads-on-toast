import type { QueryFilter } from 'mongoose';

import { Schema, Types } from 'mongoose';

import {
	type BaseDocument,
	type Cursor,
	type MongoOperator,
	type PaginatedResult,
	type PopulateOption,
	type Ref,
	type SearchOptions,
} from '@/types';

export type { Cursor, PaginatedResult, PopulateOption, SearchOptions };

const OPERATORS: MongoOperator[] = ['$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin'];

// Default pagination
const DEFAULT_LIMIT = 50;
const DEFAULT_SORT_FIELD = '_id';
const DEFAULT_SORT_DIRECTION = 1;
const POPULATE_PREFIX = '_populate_';

/**
 * Clean a MongoDB document for API response.
 * - Converts _id to id
 * - Removes __v
 * - Handles ObjectId, Decimal128, UUID conversions
 * - Recursively cleans nested objects and arrays
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanMongoDoc<T>(doc: any): null | T {
	if (!doc || typeof doc !== 'object' || doc instanceof Date) {
		return doc;
	}

	if (doc instanceof Types.UUID || doc instanceof Types.ObjectId) {
		return doc.toString() as T;
	}

	if (doc instanceof Types.Decimal128) {
		return parseFloat(doc.toString()) as T;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { __v, _id, ...copy } = doc;

	if (_id) {
		copy.id = _id instanceof Types.ObjectId ? _id.toString() : _id;
	}

	Object.keys(copy).forEach((key) => {
		const value = copy[key];

		if (Array.isArray(value)) {
			copy[key] = value.map(cleanMongoDoc);
			return;
		}

		if (value instanceof Types.ObjectId) {
			copy[key] = value.toString();
			return;
		}

		if (value instanceof Types.Decimal128) {
			copy[key] = parseFloat(value.toString());
			return;
		}

		if (value && typeof value === 'object') {
			copy[key] = cleanMongoDoc(value);
		}
	});

	return copy as T;
}

/**
 * Clean an array of MongoDB documents
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanMongoDocs<T>(docs: any[]): T[] {
	return docs.map((doc) => cleanMongoDoc<T>(doc)).filter(Boolean) as T[];
}

/**
 * Encode a cursor for pagination
 */
export function encodeCursor(value: unknown, id: string): string {
	return Buffer.from(JSON.stringify({ id, value }), 'utf-8').toString('base64');
}

/**
 * Decode a cursor for pagination
 */
export function decodeCursor(cursor: string): Cursor {
	return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}

/**
 * Build a search query with support for:
 * - Regex search on specified fields
 * - Array values converted to $in queries
 */
export function buildSearchQuery<T extends object>(
	params: QueryFilter<T>,
	regexFields: string[] = [],
): QueryFilter<T> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const query: any = { ...params };

	Object.entries(query).forEach(([key, value]) => {
		// Convert arrays to $in
		if (Array.isArray(value)) {
			query[key] = { $in: value };
			return;
		}

		// Convert string fields to regex for search
		if (regexFields.includes(key) && typeof value === 'string' && value.length) {
			const decoded = decodeURIComponent(value);
			const escaped = decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			query[key] = new RegExp(escaped, 'i');
		}
	});

	return query as QueryFilter<T>;
}

/**
 * Apply pagination to a result set and return with cursor info
 */
export function paginateResults<T extends BaseDocument>(
	results: T[],
	limit: number,
	sortField: string = DEFAULT_SORT_FIELD,
): PaginatedResult<T> {
	const hasMore = results.length > limit;
	const data = hasMore ? results.slice(0, limit) : results;

	let nextCursor: string | undefined;

	if (hasMore && data.length > 0) {
		const lastItem = data[data.length - 1];
		const sortValue = (lastItem as Record<string, unknown>)[sortField];
		nextCursor = encodeCursor(sortValue, lastItem.id);
	}

	return { data, hasMore, nextCursor };
}

/**
 * Build cursor-based pagination filter
 */
export function buildCursorFilter<T>(
	cursor: string,
	sortField: string = DEFAULT_SORT_FIELD,
	sortDirection: -1 | 1 = DEFAULT_SORT_DIRECTION,
): QueryFilter<T> {
	const decoded = decodeCursor(cursor);
	const operator = sortDirection === 1 ? '$gt' : '$lt';

	return {
		$or: [
			{
				_id: { [operator]: decoded.id },
				[sortField]: decoded.value,
			},
			{
				[sortField]: { [operator]: decoded.value },
			},
		],
	} as QueryFilter<T>;
}

/**
 * Get default search options with overrides
 */
export function getSearchOptions(overrides: Partial<SearchOptions> = {}): SearchOptions {
	return {
		limit: DEFAULT_LIMIT,
		sortDirection: DEFAULT_SORT_DIRECTION,
		sortField: DEFAULT_SORT_FIELD,
		...overrides,
	};
}

/**
 * Convert a string to camelCase
 */
function toCamel(str: string): string {
	return str.replace(/([-_][a-z])/gi, (match) =>
		match.toUpperCase().replace('-', '').replace('_', ''),
	);
}

/**
 * Strip pagination/populate options from query string and return separated values
 */
export function stripOptions<T>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	queryString: any,
): {
	fieldsToPopulate: string[];
	options: SearchOptions;
	search: QueryFilter<T>;
} {
	const options: SearchOptions = {
		after: undefined,
		lean: undefined,
		limit: DEFAULT_LIMIT,
		populate: undefined,
		projection: undefined,
		skip: undefined,
		sortDirection: undefined,
		sortField: undefined,
	};

	const search: Record<string, unknown> = {};
	const fieldsToPopulate: string[] = [];

	for (const key of Object.keys(queryString)) {
		// Handle known options
		if (key in options) {
			const value = queryString[key];

			if (key === 'limit' || key === 'skip') {
				options[key] = parseInt(value, 10);
			} else if (key === 'sortDirection') {
				options[key] = parseInt(value, 10) as -1 | 1;
			} else if (key === 'lean') {
				options[key] = value === 'true';
			} else {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(options as any)[key] = value;
			}

			continue;
		}

		// Skip internal fields
		if (key.startsWith('_exists')) {
			continue;
		}

		// Handle populate fields
		if (key.startsWith(POPULATE_PREFIX)) {
			const field = key.slice(POPULATE_PREFIX.length);
			fieldsToPopulate.push(toCamel(field));
			continue;
		}

		// Everything else is a search param
		search[toCamel(key)] = queryString[key];
	}

	return { fieldsToPopulate, options, search: search as QueryFilter<T> };
}

/**
 * UUID schema type for Mongoose - use instead of ObjectId
 * Usage: { _id: UuidType }
 */
export const UuidType = {
	default: () => crypto.randomUUID(),
	type: 'UUID',
};

/**
 * UUID schema type for refs (no default - value must be provided)
 * Usage: { user: { ...UuidRefType, ref: ModelName.User, required: true } }
 */
export const UuidRefType = {
	type: Schema.Types.UUID,
};

/**
 * Check if a string is a valid UUID
 */
export function isValidUuid(str: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(str);
}

/**
 * Convert a string UUID to a Mongoose UUID type for queries
 */
export function toUuid(str: string): Types.UUID {
	return new Types.UUID(str);
}

/**
 * Check if a string is a valid ObjectId
 */
export function isValidObjectId(str: string): boolean {
	return Types.ObjectId.isValid(str) && new Types.ObjectId(str).toString() === str;
}

/**
 * Transform a Mongoose document for JSON/Object output
 * - Converts _id to id
 * - Removes __v
 * - Converts BSON types to strings/numbers
 * - Handles hidden/virtual fields from schema options
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bsonToStrings(ret: any): void {
	if (!ret) {
		return;
	}

	Object.keys(ret).forEach((key) => {
		const value = ret[key];

		if (key === '_id') {
			ret.id = value?.toString?.() ?? value;
			delete ret._id;
			return;
		}

		if (value?.type === 'Buffer') {
			// Convert UUID Buffer to hex string
			ret[key] = Buffer.from(value.data)
				.toString('hex')
				.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
		} else if (value instanceof Types.ObjectId) {
			ret[key] = value.toString();
		} else if (value instanceof Types.UUID) {
			ret[key] = value.toString();
		} else if (value instanceof Types.Decimal128) {
			ret[key] = parseFloat(value.toString());
		} else if (Array.isArray(value)) {
			value.forEach(bsonToStrings);
		} else if (typeof value === 'object' && value !== null) {
			bsonToStrings(value);
		}
	});
}

/**
 * Mongoose transform function for toJSON/toObject
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mongooseTransformDocument<T extends BaseDocument>(doc: any, ret: any): T {
	const hiddenFields = doc.schema?.options?.hide;
	const virtualFields = doc.schema?.options?.virtuals;

	// Remove hidden fields
	if (hiddenFields && typeof hiddenFields === 'string') {
		hiddenFields.split(' ').forEach((prop: string) => {
			delete ret[prop];
		});
	}

	// Add virtual fields
	if (virtualFields && typeof virtualFields === 'string') {
		virtualFields.split(' ').forEach((prop: string) => {
			ret[prop] = doc[prop];
		});
	}

	bsonToStrings(ret);
	delete ret.__v;

	return ret as T;
}

/**
 * Configure a Mongoose schema with standard options:
 * - timestamps: true
 * - toJSON/toObject transforms
 * - Virtual {field}Id getters for ObjectId refs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function configureSchema(schema: any): void {
	// Add virtual {field}Id getters for ObjectId references
	if (schema.tree) {
		Object.entries(schema.tree).forEach(([key, value]) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const fieldDef = value as any;

			if (key !== 'id' && key !== '_id' && fieldDef?.type?.name === 'ObjectId') {
				schema.virtual(`${key}Id`).get(function (this: Record<string, unknown>) {
					const val = this[key];
					return val ? String(val) : null;
				});
			}
		});
	}

	schema.set('timestamps', true);
	schema.set('toObject', { transform: mongooseTransformDocument });
	schema.set('toJSON', { transform: mongooseTransformDocument });
}

/**
 * Convert array of Mongoose documents to JSON
 */
export function arrayToJSON<T extends BaseDocument>(
	arr?: { toJSON(): Record<string, unknown> }[],
): T[] {
	return arr?.map((doc) => doc.toJSON() as T) ?? [];
}

/**
 * Format population paths from field names
 */
export function formatPopulationPaths(
	fieldsToPopulate: string[] = [],
	overrides?: PopulateOption[],
): PopulateOption[] {
	return fieldsToPopulate.map(
		(fieldName) => overrides?.find((o) => o.path === fieldName) ?? { path: fieldName },
	);
}

/**
 * Check if a key is a MongoDB operator
 */
function isMongoOperator(key: string): key is MongoOperator {
	return key.startsWith('$');
}

/**
 * Check if an object contains MongoDB operators
 */
function isMongoOperatorObject(obj: unknown): obj is Partial<Record<MongoOperator, unknown>> {
	if (typeof obj !== 'object' || obj === null) {
		return false;
	}

	return Object.keys(obj).some((key) => OPERATORS.includes(key as MongoOperator));
}

/**
 * Flatten nested params to dot notation, preserving MongoDB operators
 */
export function flattenParams(
	obj: QueryFilter<unknown>,
	prefix = '',
	result: Record<string, unknown> = {},
): Record<string, unknown> {
	for (const [key, value] of Object.entries(obj)) {
		const newKey = prefix ? `${prefix}.${key}` : key;

		if (value === null || value === undefined) {
			result[newKey] = value;
		} else if (isMongoOperatorObject(value)) {
			const operatorValue: Record<string, unknown> = {};

			Object.entries(value).forEach(([op, val]) => {
				if (isMongoOperator(op)) {
					if (op === '$in' || op === '$nin') {
						operatorValue[op] = Array.isArray(val) ? val : [val];
					} else {
						operatorValue[op] = val;
					}
				}
			});
			result[newKey] = operatorValue;
		} else if (typeof value === 'object' && !Array.isArray(value)) {
			flattenParams(value as QueryFilter<unknown>, newKey, result);
		} else {
			result[newKey] = value;
		}
	}

	return result;
}

/**
 * Convert an enum to an array of its values for Mongoose schema enum validation
 */
export function enumToValues<T extends object>(enumObj: T): [string, ...string[]] {
	const values = Object.keys(enumObj)
		.filter((key) => isNaN(Number(key))) // Filter out reverse mappings for numeric enums
		.map((key) => enumObj[key as keyof T] as string);

	return values as unknown as [string, ...string[]];
}

export function populatedToId<T extends { id: string }>(ref?: Ref<T>): string | undefined {
	return ref ? (typeof ref === 'string' ? ref : ref.id) : undefined;
}

export function populatedArrayToId<T extends { id: string }>(refs?: Ref<T>[]): string[] {
	return refs?.map(populatedToId).filter((id) => id !== undefined) ?? [];
}
