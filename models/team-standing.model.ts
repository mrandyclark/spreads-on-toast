import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidRefType, UuidType } from '@/lib/mongo-utils';
import { ModelName, Sport, TeamStanding, With_id } from '@/types';

const StreakSchema = new Schema(
	{
		code: { type: String }, // e.g., 'W5', 'L3'
		count: { type: Number },
		type: { enum: ['wins', 'losses'], type: String },
	},
	{ _id: false },
);

const SplitRecordSchema = new Schema(
	{
		losses: { type: Number },
		pct: { type: String },
		wins: { type: Number },
	},
	{ _id: false },
);

const ExpectedRecordSchema = new Schema(
	{
		losses: { type: Number },
		pct: { type: String },
		source: { type: String },
		type: { type: String },
		wins: { type: Number },
	},
	{ _id: false },
);

const LeagueRecordSchema = new Schema(
	{
		losses: { type: Number },
		pct: { type: String },
		wins: { type: Number },
	},
	{ _id: false },
);

const TeamSplitsSchema = new Schema(
	{
		away: { type: SplitRecordSchema },
		day: { type: SplitRecordSchema },
		extraInning: { type: SplitRecordSchema },
		grass: { type: SplitRecordSchema },
		home: { type: SplitRecordSchema },
		lastTen: { type: SplitRecordSchema },
		left: { type: SplitRecordSchema },
		leftAway: { type: SplitRecordSchema },
		leftHome: { type: SplitRecordSchema },
		night: { type: SplitRecordSchema },
		oneRun: { type: SplitRecordSchema },
		right: { type: SplitRecordSchema },
		rightAway: { type: SplitRecordSchema },
		rightHome: { type: SplitRecordSchema },
		turf: { type: SplitRecordSchema },
		winners: { type: SplitRecordSchema },
	},
	{ _id: false },
);

const TeamStandingSchema = new Schema<With_id<TeamStanding>>({
	_id: UuidType,
	date: { required: true, type: Date },
	season: { required: true, type: String },
	sport: { enum: enumToValues(Sport), required: true, type: String },
	team: { ...UuidRefType, ref: ModelName.Team, required: true },

	// Core record
	gamesPlayed: { default: 0, required: true, type: Number },
	losses: { default: 0, required: true, type: Number },
	wins: { default: 0, required: true, type: Number },

	// Calculated projections
	projectedWins: { default: 0, required: true, type: Number },
	pythagoreanWins: { type: Number },

	// Rankings
	divisionRank: { type: Number },
	leagueRank: { type: Number },
	sportRank: { type: Number },
	wildCardRank: { type: Number },

	// Games back
	divisionGamesBack: { type: String },
	gamesBack: { type: String },
	leagueGamesBack: { type: String },
	sportGamesBack: { type: String },
	wildCardGamesBack: { type: String },

	// Run production
	runDifferential: { type: Number },
	runsAllowed: { type: Number },
	runsScored: { type: Number },

	// Streak
	streak: { type: StreakSchema },

	// Playoff status
	clinched: { type: Boolean },
	clinchIndicator: { type: String },
	divisionChamp: { type: Boolean },
	divisionLeader: { type: Boolean },
	eliminated: { type: Boolean },
	hasWildcard: { type: Boolean },
	wildCardLeader: { type: Boolean },

	// Splits
	splits: { type: TeamSplitsSchema },

	// Expected record (from MLB API)
	expectedRecord: { type: ExpectedRecordSchema },

	// League record
	leagueRecord: { type: LeagueRecordSchema },
});

// Unique constraint: one standing per team per date per season
 
TeamStandingSchema.index({ date: 1, season: 1, team: 1 }, { unique: true });

// Index for querying all standings on a specific date (standings board, CRON upserts)
TeamStandingSchema.index({ date: 1, season: 1 });

// Index for team detail page: all standings for a team in a season, sorted by date
// eslint-disable-next-line perfectionist/sort-objects
TeamStandingSchema.index({ season: 1, team: 1, date: 1 });

// Index for findLatestDate / findDateRange: season-only queries sorted by date
// eslint-disable-next-line perfectionist/sort-objects
TeamStandingSchema.index({ season: 1, date: -1 });

configureSchema(TeamStandingSchema);

export const TeamStandingModel: Model<With_id<TeamStanding>> =
	mongoose.models[ModelName.TeamStanding] ||
	mongoose.model(ModelName.TeamStanding, TeamStandingSchema);
