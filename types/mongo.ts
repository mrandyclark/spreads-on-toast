import { type PopulateOptions, type Schema } from 'mongoose';

export interface BaseDocument {
  createdAt: Date;
  id: string;
  updatedAt: Date;
}

export interface BaseSubDocument {
  id: string;
}

export interface Cursor {
  id: string;
  value: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface SearchOptions {
  after?: string;
  lean?: boolean;
  limit?: number;
  populate?: PopulateOptions | PopulateOptions[] | string | string[];
  projection?: string;
  skip?: number;
  sortDirection?: -1 | 1;
  sortField?: string;
}

export type MongoOperator = '$eq' | '$gt' | '$gte' | '$in' | '$lt' | '$lte' | '$ne' | '$nin';

export interface PopulateOption {
  match?: Record<string, unknown>;
  model?: string;
  options?: Record<string, unknown>;
  path?: string;
  populate?: PopulateOption | PopulateOption[] | string | string[];
  select?: Record<string, boolean | number | object> | string;
}

export type SchemaTree<T> = {
  tree?: Record<
    string,
    {
      type?: {
        name: string;
      };
    }
  >;
} & Schema<T>;

export interface SearchResults<T extends BaseDocument> {
  data: T[];
  endCursor?: null | string;
  hasMore?: boolean;
}

// Enhanced Ref type - string when unpopulated, T when populated
export type Ref<T> = string | T;

// Disable "any" check for generic because _id is a complicated mix of types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type With_id<T extends BaseDocument | BaseSubDocument> = { _id?: any } & Omit<T, '_id'>;

// Model names for refs and model registration - add your models here
export enum ModelName {
  User = 'User',
}
