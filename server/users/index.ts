import { dbConnect } from '@/lib/mongoose';
import { UserModel } from '@/models/user.model';
import { User } from '@/types/user';

export interface CreateUserInput {
  email: string;
  imageUrl?: string;
  kindeId: string;
  nameFirst?: string;
  nameLast?: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  await dbConnect();

  const user = await UserModel.create(input);
  return user.toJSON() as User;
}

export async function getUserByKindeId(kindeId: string): Promise<null | User> {
  await dbConnect();

  const user = await UserModel.findOne({ kindeId });
  return user ? (user.toJSON() as User) : null;
}

export async function getUserById(id: string): Promise<null | User> {
  await dbConnect();

  const user = await UserModel.findById(id);
  return user ? (user.toJSON() as User) : null;
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'createdAt' | 'id' | 'kindeId' | 'updatedAt'>>,
): Promise<null | User> {
  await dbConnect();

  const user = await UserModel.findByIdAndUpdate(id, updates, { new: true });
  return user ? (user.toJSON() as User) : null;
}

export async function deleteUser(id: string): Promise<boolean> {
  await dbConnect();

  const result = await UserModel.findByIdAndDelete(id);
  return !!result;
}
