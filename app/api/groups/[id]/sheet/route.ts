import { getGroupForMember } from '@/server/groups/group.actions';
import { errorResponse, jsonResponse, withAuth } from '@/server/http/responses';
import { sheetService } from '@/server/sheets/sheet.service';
import { Conference, PickDirection } from '@/types';

export const GET = withAuth(async (_request, { params, user }) => {
	const { id } = await params;

	const group = await getGroupForMember(id, user.id);

	if (!group) {
		return errorResponse('Forbidden', 403);
	}

	const sheet = await sheetService.findByGroupAndUserPopulated(id, user.id);

	if (!sheet) {
		return errorResponse('Sheet not found', 404);
	}

	return jsonResponse(sheet);
});

interface UpdatePicksBody {
	postseasonPicks?: { al: string[]; nl: string[] };
	teamPicks?: Array<{ pick: PickDirection; team: string }>;
	worldSeriesPicks?: { alChampion: string; nlChampion: string; winner?: string };
}

export const PATCH = withAuth(async (request, { params, user }) => {
	const { id } = await params;

	const group = await getGroupForMember(id, user.id);

	if (!group) {
		return errorResponse('Forbidden', 403);
	}

	// Check if picks are locked
	const lockDate = new Date(group.lockDate);

	if (lockDate < new Date()) {
		return errorResponse('Picks are locked', 400);
	}

	const sheet = await sheetService.findByGroupAndUser(id, user.id);

	if (!sheet) {
		return errorResponse('Sheet not found', 404);
	}

	const body: UpdatePicksBody = await request.json();

	// Update team picks - merge with existing picks
	if (body.teamPicks) {
		const pickMap = new Map(body.teamPicks.map((p) => [p.team, p.pick]));

		const updatedTeamPicks = sheet.teamPicks.map((tp) => {
			const teamId = typeof tp.team === 'object' ? tp.team.id : tp.team;
			const newPick = pickMap.get(teamId);
			return newPick ? { ...tp, pick: newPick, team: teamId } : { ...tp, team: teamId };
		});

		await sheetService.findByIdAndUpdate(sheet.id, { $set: { teamPicks: updatedTeamPicks } });
	}

	if (body.postseasonPicks) {
		await sheetService.findByIdAndUpdate(sheet.id, { $set: { postseasonPicks: body.postseasonPicks } });
	}

	if (body.worldSeriesPicks) {
		await sheetService.findByIdAndUpdate(sheet.id, {
			$set: {
				worldSeriesPicks: {
					alChampion: body.worldSeriesPicks.alChampion,
					nlChampion: body.worldSeriesPicks.nlChampion,
					...(body.worldSeriesPicks.winner && { winner: body.worldSeriesPicks.winner as Conference }),
				},
			},
		});
	}

	const updatedSheet = await sheetService.findByGroupAndUserPopulated(id, user.id);

	return jsonResponse(updatedSheet);
});
