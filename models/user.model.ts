import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, UuidType } from '@/lib/mongo-utils';
import { ModelName, With_id } from '@/types';
import { User } from '@/types/user';

const userSchema = new Schema<With_id<User>>({
  _id: UuidType,
  email: { required: true, type: String, unique: true },
  imageUrl: { type: String },
  kindeId: { index: true, required: true, type: String, unique: true },
  nameFirst: { type: String },
  nameLast: { type: String },
});

configureSchema(userSchema);

export const UserModel: Model<With_id<User>> =
  mongoose.models[ModelName.User] || mongoose.model(ModelName.User, userSchema);
