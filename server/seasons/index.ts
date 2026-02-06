import { dbConnect } from '@/lib/mongoose';
import { SeasonModel } from '@/models/season.model';
import { TeamLineModel } from '@/models/team-line.model';
import { Season, SeasonStatus, Sport, TeamLine } from '@/types';

export interface CreateSeasonInput {
	endDate: Date;
	lockDate: Date;
	name: string;
	season: string;
	sport: Sport;
	startDate: Date;
	status?: SeasonStatus;
}

export interface CreateTeamLineInput {
	line: number;
	season: string;
	sport: Sport;
	team: string;
}

export async function createSeason(input: CreateSeasonInput): Promise<Season> {
	await dbConnect();

	const season = await SeasonModel.create(input);

	return season.toJSON() as Season;
}

export async function getSeasonById(id: string): Promise<null | Season> {
	await dbConnect();

	const season = await SeasonModel.findById(id);

	return (season?.toJSON() as Season) ?? null;
}

export async function getSeasonBySportAndYear(sport: Sport, year: string): Promise<null | Season> {
	await dbConnect();

	const season = await SeasonModel.findOne({ season: year, sport });

	return (season?.toJSON() as Season) ?? null;
}

export async function getSeasonsBySport(sport: Sport): Promise<Season[]> {
	await dbConnect();

	const seasons = await SeasonModel.find({ sport }).sort({ season: -1 });

	return seasons.map((s) => s.toJSON() as Season);
}

export async function getAvailableSeasons(sport: Sport): Promise<Season[]> {
	await dbConnect();

	const seasons = await SeasonModel.find({
		sport,
		status: { $in: [SeasonStatus.Upcoming, SeasonStatus.Active] },
	}).sort({ season: -1 });

	return seasons.map((s) => s.toJSON() as Season);
}

export async function updateSeason(
	id: string,
	updates: Partial<Omit<Season, 'createdAt' | 'id' | 'updatedAt'>>,
): Promise<null | Season> {
	await dbConnect();

	const season = await SeasonModel.findByIdAndUpdate(id, { $set: updates }, { new: true });

	return (season?.toJSON() as Season) ?? null;
}

export async function createTeamLine(input: CreateTeamLineInput): Promise<TeamLine> {
	await dbConnect();

	const teamLine = await TeamLineModel.create(input);

	return teamLine.toJSON() as TeamLine;
}

export async function createTeamLines(inputs: CreateTeamLineInput[]): Promise<TeamLine[]> {
	await dbConnect();

	const teamLines = await TeamLineModel.insertMany(inputs);

	return teamLines.map((tl) => tl.toJSON() as TeamLine);
}

export async function getTeamLinesBySeason(sport: Sport, season: string): Promise<TeamLine[]> {
	await dbConnect();

	const teamLines = await TeamLineModel.find({ season, sport });

	return teamLines.map((tl) => tl.toJSON() as TeamLine);
}

export async function updateTeamLine(id: string, line: number): Promise<null | TeamLine> {
	await dbConnect();

	const teamLine = await TeamLineModel.findByIdAndUpdate(id, { $set: { line } }, { new: true });

	return (teamLine?.toJSON() as TeamLine) ?? null;
}
