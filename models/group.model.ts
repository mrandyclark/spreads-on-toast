import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidRefType, UuidType } from '@/lib/mongo-utils';
import { Group, GroupMember, GroupRole, ModelName, With_id } from '@/types';

const GroupMemberSchema = new Schema<GroupMember>(
	{
		joinedAt: { default: Date.now, type: Date },
		role: { default: GroupRole.Member, enum: enumToValues(GroupRole), type: String },
		user: { ...UuidRefType, ref: ModelName.User, required: true },
	},
	{ _id: false },
);

const GroupSchema = new Schema<With_id<Group>>({
	_id: UuidType,
	inviteCode: { required: true, type: String, unique: true },
	lockDate: { required: true, type: Date },
	members: { default: [], type: [GroupMemberSchema] },
	name: { required: true, trim: true, type: String },
	owner: { ...UuidRefType, index: true, ref: ModelName.User, required: true },
	season: { required: true, type: String },
	sport: { required: true, type: String },
});

GroupSchema.index({ 'members.user': 1 });

configureSchema(GroupSchema);

export const GroupModel: Model<With_id<Group>> =
	mongoose.models[ModelName.Group] || mongoose.model(ModelName.Group, GroupSchema);
