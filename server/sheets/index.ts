import { dbConnect } from '@/lib/mongoose';
import { SheetModel } from '@/models/sheet.model';
import { TeamLineModel } from '@/models/team-line.model';
import { Sheet, Sport, TeamPick } from '@/types';

export interface CreateSheetInput {
	group: string;
	season: string;
	sport: Sport;
	user: string;
}

export async function createSheet(input: CreateSheetInput): Promise<Sheet> {
	await dbConnect();

	// Fetch team lines for this sport/season to pre-populate the sheet
	const teamLines = await TeamLineModel.find({
		season: input.season,
		sport: input.sport,
	});

	const teamPicks: TeamPick[] = teamLines.map((tl) => ({
		line: tl.line,
		team: tl.team.toString(),
	}));

	const sheet = await SheetModel.create({
		group: input.group,
		sport: input.sport,
		teamPicks,
		user: input.user,
	});

	return sheet.toJSON() as Sheet;
}

export async function getSheetById(id: string): Promise<null | Sheet> {
	await dbConnect();

	const sheet = await SheetModel.findById(id);

	return (sheet?.toJSON() as Sheet) ?? null;
}

export async function getSheetByGroupAndUser(
	groupId: string,
	userId: string,
): Promise<null | Sheet> {
	await dbConnect();

	const sheet = await SheetModel.findOne({ group: groupId, user: userId });

	return (sheet?.toJSON() as Sheet) ?? null;
}

export async function getSheetByGroupAndUserPopulated(
	groupId: string,
	userId: string,
): Promise<null | Sheet> {
	await dbConnect();

	const sheet = await SheetModel.findOne({ group: groupId, user: userId }).populate(
		'teamPicks.team',
	);

	return (sheet?.toJSON() as Sheet) ?? null;
}

export async function getSheetsByGroup(groupId: string): Promise<Sheet[]> {
	await dbConnect();

	const sheets = await SheetModel.find({ group: groupId });

	return sheets.map((sheet) => sheet.toJSON() as Sheet);
}

export async function getSheetsByUser(userId: string): Promise<Sheet[]> {
	await dbConnect();

	const sheets = await SheetModel.find({ user: userId });

	return sheets.map((sheet) => sheet.toJSON() as Sheet);
}

export async function updateSheet(
	id: string,
	updates: Partial<
		Pick<Sheet, 'postseasonPicks' | 'submittedAt' | 'teamPicks' | 'worldSeriesPicks'>
	>,
): Promise<null | Sheet> {
	await dbConnect();

	const sheet = await SheetModel.findByIdAndUpdate(id, { $set: updates }, { new: true });

	return (sheet?.toJSON() as Sheet) ?? null;
}

export async function deleteSheet(id: string): Promise<boolean> {
	await dbConnect();

	const result = await SheetModel.findByIdAndDelete(id);

	return !!result;
}

export async function getOrCreateSheet(input: CreateSheetInput): Promise<Sheet> {
	await dbConnect();

	const existing = await getSheetByGroupAndUser(input.group, input.user);

	if (existing) {
		return existing;
	}

	return createSheet(input);
}
