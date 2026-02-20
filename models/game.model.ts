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
		errors: { type: Number },
		hits: { type: Number },
		isWinner: { type: Boolean },
		leagueRecord: { type: LeagueRecordSchema },
		leftOnBase: { type: Number },
		score: { type: Number },
		seriesNumber: { type: Number },
		splitSquad: { type: Boolean },
		team: { ...UuidRefType, ref: ModelName.Team },
		teamMlbId: { required: true, type: Number },
	},
	{ _id: false },
);

const GamePlayerRefSchema = new Schema(
	{
		fullName: { type: String },
		mlbId: { type: Number },
	},
	{ _id: false },
);

const InningHalfDataSchema = new Schema(
	{
		errors: { type: Number },
		hits: { type: Number },
		leftOnBase: { type: Number },
		runs: { type: Number },
	},
	{ _id: false },
);

const GameInningSchema = new Schema(
	{
		away: { type: InningHalfDataSchema },
		home: { type: InningHalfDataSchema },
		num: { type: Number },
		ordinalNum: { type: String },
	},
	{ _id: false },
);

const LinescoreTeamTotalsSchema = new Schema(
	{
		errors: { type: Number },
		hits: { type: Number },
		isWinner: { type: Boolean },
		leftOnBase: { type: Number },
		runs: { type: Number },
	},
	{ _id: false },
);

const GameDefenseSchema = new Schema(
	{
		batter: { type: GamePlayerRefSchema },
		battingOrder: { type: Number },
		catcher: { type: GamePlayerRefSchema },
		center: { type: GamePlayerRefSchema },
		first: { type: GamePlayerRefSchema },
		inHole: { type: GamePlayerRefSchema },
		left: { type: GamePlayerRefSchema },
		onDeck: { type: GamePlayerRefSchema },
		pitcher: { type: GamePlayerRefSchema },
		right: { type: GamePlayerRefSchema },
		second: { type: GamePlayerRefSchema },
		shortstop: { type: GamePlayerRefSchema },
		teamMlbId: { type: Number },
		third: { type: GamePlayerRefSchema },
	},
	{ _id: false },
);

const GameOffenseSchema = new Schema(
	{
		batter: { type: GamePlayerRefSchema },
		battingOrder: { type: Number },
		inHole: { type: GamePlayerRefSchema },
		onDeck: { type: GamePlayerRefSchema },
		pitcher: { type: GamePlayerRefSchema },
		teamMlbId: { type: Number },
	},
	{ _id: false },
);

const GameLinescoreSchema = new Schema(
	{
		balls: { type: Number },
		currentInning: { type: Number },
		currentInningOrdinal: { type: String },
		defense: { type: GameDefenseSchema },
		inningHalf: { type: String },
		innings: { default: [], type: [GameInningSchema] },
		inningState: { type: String },
		isTopInning: { type: Boolean },
		offense: { type: GameOffenseSchema },
		outs: { type: Number },
		scheduledInnings: { type: Number },
		strikes: { type: Number },
		teams: {
			away: { type: LinescoreTeamTotalsSchema },
			home: { type: LinescoreTeamTotalsSchema },
		},
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

	// Linescore
	linescore: { type: GameLinescoreSchema },

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
