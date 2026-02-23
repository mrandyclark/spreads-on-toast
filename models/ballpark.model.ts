import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidRefType, UuidType } from '@/lib/mongo-utils';
import { Ballpark, ModelName, Sport, With_id } from '@/types';

const BallparkLocationSchema = new Schema(
	{
		city: { required: true, type: String },
		lat: { required: true, type: Number },
		lng: { required: true, type: Number },
		state: { required: true, type: String },
	},
	{ _id: false },
);

const BallparkSchema = new Schema<With_id<Ballpark>>({
	_id: UuidType,
	elevation: { required: true, type: Number },
	fieldOrientation: { required: true, type: Number },
	location: { required: true, type: BallparkLocationSchema },
	mlbVenueId: { index: true, required: true, type: Number, unique: true },
	name: { required: true, type: String },
	roofType: { enum: ['dome', 'open', 'retractable'], required: true, type: String },
	sport: { enum: enumToValues(Sport), required: true, type: String },
	team: { ...UuidRefType, index: true, ref: ModelName.Team, required: true },
});

configureSchema(BallparkSchema);

export const BallparkModel: Model<With_id<Ballpark>> =
	mongoose.models[ModelName.Ballpark] || mongoose.model(ModelName.Ballpark, BallparkSchema);
