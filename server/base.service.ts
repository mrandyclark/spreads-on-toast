import type { Model, PipelineStage, QueryFilter, QueryOptions, UpdateQuery } from 'mongoose';

import { cleanMongoDoc, cleanMongoDocs, encodeCursor } from '@/lib/mongo-utils';
import { dbConnect } from '@/lib/mongoose';
import { BaseDocument, SearchOptions, SearchResults } from '@/types';

const DEFAULT_LIMIT = 50;
const DEFAULT_SORT_FIELD = '_id';
const DEFAULT_SORT_DIRECTION = 1;

/**
 * Base service class for MongoDB CRUD operations.
 * Handles dbConnect, lean queries, and cleanMongoDoc automatically.
 *
 * Usage:
 *   class SignService extends BaseService<Sign> {
 *     constructor() { super(SignModel); }
 *   }
 */
export abstract class BaseService<T extends BaseDocument> {
	protected constructor(public readonly model: Model<T>) {}

	async aggregate<R = unknown>(pipeline: PipelineStage[]): Promise<R[]> {
		await dbConnect();
		return this.model.aggregate(pipeline);
	}

	async count(query: QueryFilter<T> = {}): Promise<number> {
		await dbConnect();
		return this.model.countDocuments(query);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async distinct<R = any>(field: string, query: QueryFilter<T> = {}): Promise<R[]> {
		await dbConnect();
		const results = await this.model.distinct(field, query);
		return results as R[];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async create(params: Record<string, any>): Promise<T> {
		await dbConnect();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const doc = await (this.model as any).create(params);
		return doc.toJSON() as T;
	}

	async deleteById(id: string): Promise<boolean> {
		await dbConnect();
		const result = await this.model.findByIdAndDelete(id);
		return !!result;
	}

	async find(
		query: QueryFilter<T> = {},
		options?: { limit?: number; populate?: string | string[]; select?: string; sort?: Record<string, -1 | 1> },
	): Promise<T[]> {
		await dbConnect();
		let q = this.model.find(query);

		if (options?.sort) {
			q = q.sort(options.sort);
		}

		if (options?.select) {
			q = q.select(options.select);
		}

		if (options?.limit) {
			q = q.limit(options.limit);
		}

		if (options?.populate) {
			const paths = Array.isArray(options.populate) ? options.populate : [options.populate];

			for (const path of paths) {
				q = q.populate(path);
			}
		}

		const results = await q.lean();
		return cleanMongoDocs<T>(results);
	}

	async findById(id: string, options?: { populate?: string | string[]; select?: string }): Promise<null | T> {
		await dbConnect();
		let q = this.model.findById(id);

		if (options?.select) {
			q = q.select(options.select);
		}

		if (options?.populate) {
			const paths = Array.isArray(options.populate) ? options.populate : [options.populate];

			for (const path of paths) {
				q = q.populate(path);
			}
		}

		const doc = await q.lean();
		return cleanMongoDoc<T>(doc);
	}

	async findByIdAndUpdate(
		id: string,
		params: UpdateQuery<T>,
		options?: QueryOptions,
	): Promise<null | T> {
		await dbConnect();
		const doc = await this.model.findByIdAndUpdate(id, params, { new: true, ...options }).lean();
		return cleanMongoDoc<T>(doc);
	}

	async findOne(query: QueryFilter<T>, options?: { populate?: string | string[]; select?: string; sort?: Record<string, -1 | 1> }): Promise<null | T> {
		await dbConnect();
		let q = this.model.findOne(query);

		if (options?.sort) {
			q = q.sort(options.sort);
		}

		if (options?.select) {
			q = q.select(options.select);
		}

		if (options?.populate) {
			const paths = Array.isArray(options.populate) ? options.populate : [options.populate];

			for (const path of paths) {
				q = q.populate(path);
			}
		}

		const doc = await q.lean();
		return cleanMongoDoc<T>(doc);
	}

	async findOneAndUpdate(
		query: QueryFilter<T>,
		params: UpdateQuery<T>,
		options?: QueryOptions,
	): Promise<null | T> {
		await dbConnect();
		const doc = await this.model.findOneAndUpdate(query, params, { new: true, ...options }).lean();
		return cleanMongoDoc<T>(doc);
	}

	async search(query: QueryFilter<T> = {}, options: SearchOptions = {}): Promise<SearchResults<T>> {
		await dbConnect();

		const sortField = options.sortField ?? DEFAULT_SORT_FIELD;
		const sortDirection = options.sortDirection ?? DEFAULT_SORT_DIRECTION;
		const limit = options.limit ?? DEFAULT_LIMIT;
		const skip = options.skip ?? 0;

		const [results, count] = await Promise.all([
			this.model
				.find(query)
				// eslint-disable-next-line perfectionist/sort-objects
				.sort({ [sortField]: sortDirection, _id: sortDirection })
				.skip(skip)
				.limit(limit + 1)
				.lean(),
			this.model.countDocuments(query),
		]);

		const hasMore = results.length > limit;
		const returnedResults = limit === 0 ? results : results.slice(0, limit);
		const last = returnedResults[returnedResults.length - 1];

		const lastDoc = last as unknown as Record<string, unknown> | undefined;

		return {
			count,
			data: cleanMongoDocs<T>(returnedResults),
			endCursor: lastDoc
				? encodeCursor(lastDoc[sortField], String(lastDoc.id ?? lastDoc._id))
				: null,
			hasMore,
		};
	}
}
