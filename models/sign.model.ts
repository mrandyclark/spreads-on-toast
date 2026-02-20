import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidRefType, UuidType } from '@/lib/mongo-utils';
import { Division, ModelName, Sign, SignConfig, SignContentConfig, SignDisplayConfig, SignMember, SignRole, SignScheduleConfig, With_id } from '@/types';

const SignMemberSchema = new Schema<SignMember>(
	{
		joinedAt: { default: Date.now, type: Date },
		role: { default: SignRole.Viewer, enum: enumToValues(SignRole), type: String },
		user: { ...UuidRefType, ref: ModelName.User, required: true },
	},
	{ _id: false },
);

const SignDisplayConfigSchema = new Schema<SignDisplayConfig>(
	{
		brightness: { default: 35, max: 100, min: 0, type: Number },
		rotationIntervalSeconds: { default: 10, type: Number },
	},
	{ _id: false },
);

const SignScheduleConfigSchema = new Schema<SignScheduleConfig>(
	{
		enabled: { default: false, type: Boolean },
		offTime: { default: '23:00', type: String },
		onTime: { default: '07:00', type: String },
		timezone: { default: 'America/Los_Angeles', type: String },
	},
	{ _id: false },
);

const SignContentConfigSchema = new Schema<SignContentConfig>(
	{
		lastGameTeamIds: { default: [], type: [String] },
		nextGameTeamIds: { default: [], type: [String] },
		standingsDivisions: { default: [], enum: enumToValues(Division), type: [String] },
	},
	{ _id: false },
);

const SignConfigSchema = new Schema<SignConfig>(
	{
		content: { default: () => ({}), type: SignContentConfigSchema },
		display: { default: () => ({}), type: SignDisplayConfigSchema },
		schedule: { default: () => ({}), type: SignScheduleConfigSchema },
	},
	{ _id: false },
);

const SignSchema = new Schema<With_id<Sign>>({
	_id: UuidType,
	config: { default: () => ({}), type: SignConfigSchema },
	members: { default: [], type: [SignMemberSchema] },
	owner: { ...UuidRefType, index: true, ref: ModelName.User, required: true },
	title: { required: true, trim: true, type: String },
});

SignSchema.index({ 'members.user': 1 });

configureSchema(SignSchema);

export const SignModel: Model<With_id<Sign>> =
	mongoose.models[ModelName.Sign] || mongoose.model(ModelName.Sign, SignSchema);
