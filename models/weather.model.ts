import mongoose, { Schema } from 'mongoose';

import { configureSchema, UuidRefType } from '@/lib/mongo-utils';
import { Weather } from '@/types';

const WeatherSchema = new Schema<Weather>(
	{
		conditions: { required: true, type: String },
		fetchedAt: { required: true, type: Date },
		game: { ...UuidRefType, ref: 'Game', required: true },
		humidity: { required: true, type: Number },
		temperature: { required: true, type: Number },
		windDirection: { required: true, type: Number },
		windSpeed: { required: true, type: Number },
	},
	{ timestamps: true },
);

configureSchema(WeatherSchema);

// Index for efficient lookups by game
WeatherSchema.index({ game: 1 });

export const WeatherModel =
	mongoose.models.Weather || mongoose.model<Weather>('Weather', WeatherSchema);
