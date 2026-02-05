import { BaseDocument } from './mongo';

/**
 * Full user record from database
 */
export interface User extends BaseDocument {
  email: string;
  imageUrl?: string;
  kindeId: string;
  nameFirst?: string;
  nameLast?: string;
}

/**
 * Minimal user info from Kinde session (no DB lookup required)
 */
export interface SessionUser {
  email?: string;
  id: string;
  nameFirst?: string;
  nameLast?: string;
}
