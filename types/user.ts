import { BaseDocument } from './mongo';

export interface User extends BaseDocument {
  email: string;
  imageUrl?: string;
  kindeId: string;
  nameFirst?: string;
  nameLast?: string;
}
