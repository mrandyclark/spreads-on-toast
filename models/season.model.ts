import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidType } from '@/lib/mongo-utils';
import { ModelName, Season, SeasonStatus, Sport, With_id } from '@/types';

const SeasonSchema = new Schema<With_id<Season>>({
	_id: UuidType,
	endDate: { required: true, type: Date },
	lockDate: { required: true, type: Date },
	name: { required: true, trim: true, type: String },
	season: { required: true, type: String },
	sport: { enum: enumToValues(Sport), required: true, type: String },
	startDate: { required: true, type: Date },
	status: { default: SeasonStatus.Upcoming, enum: enumToValues(SeasonStatus), type: String },
});

SeasonSchema.index({ season: 1, sport: 1 }, { unique: true });

configureSchema(SeasonSchema);

export const SeasonModel: Model<With_id<Season>> =
	mongoose.models[ModelName.Season] || mongoose.model(ModelName.Season, SeasonSchema);
