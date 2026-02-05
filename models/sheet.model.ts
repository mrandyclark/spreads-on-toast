import mongoose, { Model, Schema } from 'mongoose';

import { configureSchema, enumToValues, UuidRefType, UuidType } from '@/lib/mongo-utils';
import { ModelName, PickDirection, PickResult, PostseasonPicks, Sheet, Sport, TeamPick, With_id, WorldSeriesPicks } from '@/types';

const TeamPickSchema = new Schema<TeamPick>(
  {
    line: { required: true, type: Number },
    pick: { enum: enumToValues(PickDirection), type: String },
    result: { enum: enumToValues(PickResult), type: String },
    team: { ...UuidRefType, ref: ModelName.Team, required: true },
  },
  { _id: false },
);

const PostseasonPicksSchema = new Schema<PostseasonPicks>(
  {
    al: { default: [], type: [String] },
    nl: { default: [], type: [String] },
  },
  { _id: false },
);

const WorldSeriesPicksSchema = new Schema<WorldSeriesPicks>(
  {
    alChampion: { type: String },
    nlChampion: { type: String },
    winner: { type: String },
  },
  { _id: false },
);

const SheetSchema = new Schema<With_id<Sheet>>({
  _id: UuidType,
  group: { ...UuidRefType, index: true, ref: ModelName.Group, required: true },
  postseasonPicks: { type: PostseasonPicksSchema },
  sport: { enum: enumToValues(Sport), required: true, type: String },
  submittedAt: { type: Date },
  teamPicks: { default: [], type: [TeamPickSchema] },
  user: { ...UuidRefType, index: true, ref: ModelName.User, required: true },
  worldSeriesPicks: { type: WorldSeriesPicksSchema },
});

SheetSchema.index({ group: 1, user: 1 }, { unique: true });

configureSchema(SheetSchema);

export const SheetModel: Model<With_id<Sheet>> =
  mongoose.models[ModelName.Sheet] || mongoose.model(ModelName.Sheet, SheetSchema);
