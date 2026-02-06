import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidRefType, UuidType } from '@/lib/mongo-utils';
import { ModelName, Sport, TeamLine, With_id } from '@/types';

const TeamLineSchema = new Schema<With_id<TeamLine>>({
	_id: UuidType,
	line: { required: true, type: Number },
	season: { index: true, required: true, type: String },
	sport: { enum: enumToValues(Sport), required: true, type: String },
	team: { ...UuidRefType, index: true, ref: ModelName.Team, required: true },
});

TeamLineSchema.index({ season: 1, sport: 1, team: 1 }, { unique: true });

configureSchema(TeamLineSchema);

export const TeamLineModel: Model<With_id<TeamLine>> =
	mongoose.models[ModelName.TeamLine] || mongoose.model(ModelName.TeamLine, TeamLineSchema);
