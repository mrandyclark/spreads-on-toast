import { dbConnect } from '@/lib/mongoose';
import { TeamModel } from '@/models/team.model';
import { Sport, Team } from '@/types';

export async function getTeamsBySport(sport: Sport): Promise<Team[]> {
  await dbConnect();

  const teams = await TeamModel.find({ sport }).sort({ name: 1 });

  return teams.map((team) => team.toJSON() as Team);
}

export async function getTeamById(id: string): Promise<null | Team> {
  await dbConnect();

  const team = await TeamModel.findById(id);

  return (team?.toJSON() as Team) ?? null;
}

export async function getTeamsByIds(ids: string[]): Promise<Team[]> {
  await dbConnect();

  const teams = await TeamModel.find({ _id: { $in: ids } });

  return teams.map((team) => team.toJSON() as Team);
}
