import { dbConnect } from '@/lib/mongoose';
import { GroupModel } from '@/models/group.model';
import { createSheet } from '@/server/sheets';
import { Group, GroupRole, Sport } from '@/types';

export interface CreateGroupInput {
  lockDate: Date;
  name: string;
  owner: string;
  season: string;
  sport: Sport;
}

export interface UpdateGroupInput {
  lockDate?: Date;
  name?: string;
  season?: string;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  await dbConnect();

  const group = await GroupModel.create({
    inviteCode: generateInviteCode(),
    lockDate: input.lockDate,
    members: [{ joinedAt: new Date(), role: GroupRole.Owner, user: input.owner }],
    name: input.name,
    owner: input.owner,
    season: input.season,
    sport: input.sport,
  });

  const groupJson = group.toJSON() as Group;

  await createSheet({
    group: groupJson.id,
    season: input.season,
    sport: input.sport,
    user: input.owner,
  });

  return groupJson;
}

export async function getGroupById(id: string): Promise<Group | null> {
  await dbConnect();

  const group = await GroupModel.findById(id);

  return (group?.toJSON() as Group) ?? null;
}

export async function getGroupsByUser(userId: string): Promise<Group[]> {
  await dbConnect();

  const groups = await GroupModel.find({ 'members.user': userId }).sort({ createdAt: -1 });

  return groups.map((group) => group.toJSON() as Group);
}

export async function updateGroup(id: string, input: UpdateGroupInput): Promise<Group | null> {
  await dbConnect();

  const updateFields: Record<string, unknown> = {};
  const unsetFields: Record<string, 1> = {};

  Object.entries(input).forEach(([key, value]) => {
    if (value === null) {
      unsetFields[key] = 1;
    } else if (value !== undefined) {
      updateFields[key] = value;
    }
  });

  const updateOperation: Record<string, unknown> = {};

  if (Object.keys(updateFields).length > 0) {
    updateOperation.$set = updateFields;
  }

  if (Object.keys(unsetFields).length > 0) {
    updateOperation.$unset = unsetFields;
  }

  const group = await GroupModel.findByIdAndUpdate(id, updateOperation, { new: true });

  return (group?.toJSON() as Group) ?? null;
}

export async function deleteGroup(id: string): Promise<boolean> {
  await dbConnect();

  const result = await GroupModel.findByIdAndDelete(id);

  return !!result;
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  await dbConnect();

  const group = await GroupModel.findOne({ _id: groupId, 'members.user': userId });

  return !!group;
}

export async function isGroupOwner(groupId: string, userId: string): Promise<boolean> {
  await dbConnect();

  const group = await GroupModel.findOne({ _id: groupId, owner: userId });

  return !!group;
}

export async function getGroupForMember(groupId: string, userId: string): Promise<Group | null> {
  await dbConnect();

  const group = await GroupModel.findOne({ _id: groupId, 'members.user': userId });

  return (group?.toJSON() as Group) ?? null;
}
