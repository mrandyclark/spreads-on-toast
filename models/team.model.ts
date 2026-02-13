import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidType } from '@/lib/mongo-utils';
import { Conference, Division, ModelName, Sport, Team, With_id } from '@/types';

const TeamSchema = new Schema<With_id<Team>>({
	_id: UuidType,
	abbreviation: { required: true, type: String, unique: true },
	city: { required: true, trim: true, type: String },
	colors: {
		primary: { trim: true, type: String },
		secondary: { trim: true, type: String },
	},
	conference: { enum: enumToValues(Conference), required: true, type: String },
	division: { enum: enumToValues(Division), required: true, type: String },
	externalId: { index: true, type: Number },
	logoUrl: { type: String },
	name: { required: true, trim: true, type: String },
	sport: { enum: enumToValues(Sport), required: true, type: String },
});

TeamSchema.index({ sport: 1 });

configureSchema(TeamSchema);

export const TeamModel: Model<With_id<Team>> =
	mongoose.models[ModelName.Team] || mongoose.model(ModelName.Team, TeamSchema);
