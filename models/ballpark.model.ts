import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidRefType, UuidType } from '@/lib/mongo-utils';
import { Ballpark, ModelName, Sport, With_id } from '@/types';

const GpsCoordSchema = new Schema(
	{
		lat: { required: true, type: Number },
		lng: { required: true, type: Number },
	},
	{ _id: false },
);

const BallparkLocationSchema = new Schema(
	{
		city: { required: true, type: String },
		lat: { required: true, type: Number },
		lng: { required: true, type: Number },
		postalCode: { required: true, type: String },
		state: { required: true, type: String },
		street: { required: true, type: String },
	},
	{ _id: false },
);

const BallparkSchema = new Schema<With_id<Ballpark>>({
	_id: UuidType,
	elevation: { required: true, type: Number },
	fieldOrientation: { required: true, type: Number },
	homePlate: { type: GpsCoordSchema },
	location: { required: true, type: BallparkLocationSchema },
	mlbVenueId: { index: true, required: true, type: Number, unique: true },
	name: { required: true, type: String },
	pitchersMound: { type: GpsCoordSchema },
	roofType: { enum: ['dome', 'open', 'retractable'], required: true, type: String },
	sport: { enum: enumToValues(Sport), required: true, type: String },
	team: { ...UuidRefType, index: true, ref: ModelName.Team, required: true },
	timezone: { type: String },
});

configureSchema(BallparkSchema);

export const BallparkModel: Model<With_id<Ballpark>> =
	mongoose.models[ModelName.Ballpark] || mongoose.model(ModelName.Ballpark, BallparkSchema);
