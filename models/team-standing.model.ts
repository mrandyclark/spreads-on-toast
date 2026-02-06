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
  wildCardRank: { type: Number },

  // Games back
  gamesBack: { type: String },
  wildCardGamesBack: { type: String },

  // Run production
  runDifferential: { type: Number },
  runsAllowed: { type: Number },
  runsScored: { type: Number },

  // Streak
  streak: { type: StreakSchema },

  // Playoff status
  clinched: { type: Boolean },
  eliminated: { type: Boolean },
});

// Unique constraint + index for querying standings by team and season (for trend charts)
TeamStandingSchema.index({ date: 1, season: 1, team: 1 }, { unique: true });

// Index for querying all standings on a specific date (for CRON upserts)
TeamStandingSchema.index({ date: 1, season: 1 });

configureSchema(TeamStandingSchema);

export const TeamStandingModel: Model<With_id<TeamStanding>> =
  mongoose.models[ModelName.TeamStanding] || mongoose.model(ModelName.TeamStanding, TeamStandingSchema);
