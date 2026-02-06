import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, UuidRefType, UuidType } from '@/lib/mongo-utils';
import { Game, GameState, GameType, ModelName, With_id } from '@/types';

const GameStatusSchema = new Schema(
	{
		abstractGameCode: { type: String },
		abstractGameState: { enum: Object.values(GameState), type: String },
		codedGameState: { type: String },
		detailedState: { type: String },
		reason: { type: String },
		startTimeTBD: { type: Boolean },
		statusCode: { type: String },
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

const GameTeamDataSchema = new Schema(
	{
		isWinner: { type: Boolean },
		leagueRecord: { type: LeagueRecordSchema },
		score: { type: Number },
		seriesNumber: { type: Number },
		splitSquad: { type: Boolean },
		team: { ...UuidRefType, ref: ModelName.Team },
		teamMlbId: { required: true, type: Number },
	},
	{ _id: false },
);

const GameVenueSchema = new Schema(
	{
		mlbId: { required: true, type: Number },
		name: { type: String },
	},
	{ _id: false },
);

const GameSchema = new Schema<With_id<Game>>({
	_id: UuidType,

	// Core identifiers
	calendarEventId: { type: String },
	gameDate: { required: true, type: Date },
	mlbGameId: { index: true, required: true, type: Number, unique: true },
	officialDate: { index: true, required: true, type: String },
	season: { index: true, required: true, type: String },

	// Game classification
	gamesInSeries: { type: Number },
	gameType: { enum: Object.values(GameType), required: true, type: String },
	seriesDescription: { type: String },
	seriesGameNumber: { type: Number },

	// Teams
	awayTeam: { required: true, type: GameTeamDataSchema },
	homeTeam: { required: true, type: GameTeamDataSchema },

	// Venue
	venue: { required: true, type: GameVenueSchema },

	// Status
	status: { required: true, type: GameStatusSchema },

	// Game details
	dayNight: { enum: ['day', 'night'], type: String },
	description: { type: String },
	doubleHeader: { enum: ['N', 'Y', 'S'], type: String },
	gameNumber: { default: 1, type: Number },
	ifNecessary: { default: false, type: Boolean },
	ifNecessaryDescription: { type: String },
	scheduledInnings: { default: 9, type: Number },
	tiebreaker: { default: false, type: Boolean },

	// Flags
	isTie: { type: Boolean },
	publicFacing: { default: true, type: Boolean },
	reverseHomeAwayStatus: { default: false, type: Boolean },

	// Other
	gamedayType: { type: String },
	inningBreakLength: { type: Number },
});

// Index for querying games by team
GameSchema.index({ 'homeTeam.team': 1, season: 1 });
GameSchema.index({ 'awayTeam.team': 1, season: 1 });
GameSchema.index({ 'homeTeam.teamMlbId': 1, season: 1 });
GameSchema.index({ 'awayTeam.teamMlbId': 1, season: 1 });

// Index for querying games by date range
GameSchema.index({ officialDate: 1, season: 1 });

// Index for querying by game type (regular season, playoffs, etc.)
GameSchema.index({ gameType: 1, season: 1 });

configureSchema(GameSchema);

export const GameModel: Model<With_id<Game>> =
	mongoose.models[ModelName.Game] || mongoose.model(ModelName.Game, GameSchema);
