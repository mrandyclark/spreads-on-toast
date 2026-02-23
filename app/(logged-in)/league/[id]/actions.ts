'use server';

import { revalidatePath } from 'next/cache';

import { forbidden, locked, notFound, serverError } from '@/lib/action-errors';
import { resolveRef, resolveRefId } from '@/lib/ref-utils';
import { withAuth } from '@/lib/with-auth-action';
import { calculateLeaderboard, getGroupForMember, groupService } from '@/server/groups/group.actions';
import { calculateProjectedWins } from '@/server/mlb-api';
import { teamLineService } from '@/server/seasons/team-line.service';
import { sheetService } from '@/server/sheets/sheet.service';
import {
	calculatePickResult,
	getFinalStandings,
	getStandingsForDate,
} from '@/server/standings/standings.actions';
import {
	CopyableSheet,
	GroupResults,
	GroupRole,
	GroupVisibility,
	LeaderboardData,
	PickDirection,
	PickResult,
	SavePicksInput,
	Team,
	TeamPick,
	TeamPickResult,
} from '@/types';
import { groupService as groupSvc } from '@/server/groups/group.service';

export const updateGroupNameAction = withAuth(async (user, groupId: string, name: string) => {
	const group = await groupService.findById(groupId);

	if (!group) {
		return notFound('Group');
	}

	const member = group.members.find((m) => resolveRefId(m.user) === user.id);

	if (!member || (member.role !== GroupRole.Owner && member.role !== GroupRole.Admin)) {
		return forbidden('edit group');
	}

	await groupService.findByIdAndUpdate(groupId, { $set: { name: name.trim() } });

	return { success: true };
});

export const updateGroupVisibilityAction = withAuth(async (user, groupId: string, visibility: GroupVisibility) => {
	const group = await groupService.findById(groupId);

	if (!group) {
		return notFound('Group');
	}

	const member = group.members.find((m) => resolveRefId(m.user) === user.id);

	if (!member || (member.role !== GroupRole.Owner && member.role !== GroupRole.Admin)) {
		return forbidden('edit group');
	}

	await groupService.findByIdAndUpdate(groupId, { $set: { visibility } });

	return { success: true };
});

export const copyPicksFromSheetAction = withAuth(async (user, targetGroupId: string, sourceSheetId: string) => {
	const sourceSheet = await sheetService.findById(sourceSheetId);

	if (!sourceSheet || resolveRefId(sourceSheet.user) !== user.id) {
		return notFound('Source sheet');
	}

	const targetSheet = await sheetService.findByGroupAndUser(targetGroupId, user.id);

	if (!targetSheet) {
		return notFound('Target sheet');
	}

	const targetGroup = await groupService.findById(targetGroupId);

	if (!targetGroup) {
		return notFound('Group');
	}

	if (new Date(targetGroup.lockDate) < new Date()) {
		return locked('Picks');
	}

	const sourcePicksMap = new Map(
		sourceSheet.teamPicks.map((tp: TeamPick) => [resolveRefId(tp.team), tp.pick]),
	);

	const updatedTeamPicks = targetSheet.teamPicks.map((tp: TeamPick) => {
		const teamId = resolveRefId(tp.team)!;
		const sourcePick = sourcePicksMap.get(teamId);

		return {
			pick: sourcePick ?? tp.pick,
			team: teamId,
		};
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const updateData: Record<string, any> = { teamPicks: updatedTeamPicks };

	if (sourceSheet.postseasonPicks) {
		updateData.postseasonPicks = sourceSheet.postseasonPicks;
	}

	if (sourceSheet.worldSeriesPicks) {
		updateData.worldSeriesPicks = sourceSheet.worldSeriesPicks;
	}

	await sheetService.findByIdAndUpdate(targetSheet.id, { $set: updateData });

	return { success: true };
});

export const getSheetForMemberAction = withAuth(async (user, groupId: string, memberId: string) => {
	const group = await getGroupForMember(groupId, user.id);

	if (!group) {
		return notFound('Group');
	}

	const sheet = await sheetService.findByGroupAndUserPopulated(groupId, memberId);

	if (!sheet) {
		return notFound('Sheet');
	}

	return { sheet };
});

export const savePicksAction = withAuth(async (user, groupId: string, input: SavePicksInput) => {
	const sheet = await sheetService.findByGroupAndUserPopulated(groupId, user.id);

	if (!sheet) {
		return notFound('Sheet');
	}

	const group = await getGroupForMember(groupId, user.id);

	if (!group) {
		return notFound('Group');
	}

	if (new Date(group.lockDate) < new Date()) {
		return locked('Picks');
	}

	const updatedTeamPicks: TeamPick[] = sheet.teamPicks.map((tp: TeamPick) => {
		const teamId = resolveRefId(tp.team)!;
		const pick = input.teamPicks[teamId];
		return {
			pick: pick ? (pick === 'over' ? PickDirection.Over : PickDirection.Under) : undefined,
			team: teamId,
		};
	});

	try {
		const updatedSheet = await sheetService.findByIdAndUpdate(sheet.id, {
			$set: {
				postseasonPicks: input.postseasonPicks,
				teamPicks: updatedTeamPicks,
				worldSeriesPicks: input.worldSeriesPicks,
			},
		});
		revalidatePath(`/league/${groupId}`);
		return { sheet: updatedSheet ?? undefined };
	} catch (error) {
		console.error('Failed to save picks:', error);
		return serverError('save picks');
	}
});

export const getResultsAction = withAuth(
	async (user, groupId: string, userId?: string, date?: string) => {
		const isMember = await groupService.isMember(groupId, user.id);

		if (!isMember) {
			return forbidden('view results');
		}

		const group = await groupService.findById(groupId);

		if (!group) {
			return notFound('Group');
		}

		const targetUserId = userId || user.id;
		const [sheet, teamLines] = await Promise.all([
			sheetService.findByUserAndGroupPopulated(targetUserId, groupId),
			teamLineService.findBySeason(group.sport, group.season),
		]);

		if (!sheet) {
			return notFound('Sheet');
		}

		const linesByTeamId = new Map(teamLines.map((tl) => [resolveRefId(tl.team), tl.line]));

		// Get standings data
		let standingsData: Map<string, { projectedWins: number; wins: number; gamesPlayed: number }>;

		if (date) {
			const dateObj = new Date(date);
			const historicalStandings = await getStandingsForDate(group.season, dateObj);
			standingsData = new Map();

			for (const [teamId, data] of historicalStandings) {
				standingsData.set(teamId, {
					gamesPlayed: data.gamesPlayed,
					projectedWins: data.projectedWins,
					wins: data.wins,
				});
			}
		} else {
			const finalStandings = await getFinalStandings(group.season);
			standingsData = new Map();

			for (const [teamId, wins] of finalStandings) {
				standingsData.set(teamId, { gamesPlayed: 162, projectedWins: wins, wins });
			}
		}

		// Calculate results
		const picks: TeamPickResult[] = [];
		let wins = 0;
		let losses = 0;
		let pushes = 0;

		for (const teamPick of sheet.teamPicks as TeamPick[]) {
			if (!teamPick.pick) {
				continue;
			}

			const team = resolveRef(teamPick.team);

			if (!team) {
				continue;
			}

			const standing = standingsData.get(team.id);

			const actualWins = standing?.wins ?? 0;
			const gamesPlayed = standing?.gamesPlayed ?? 0;
			const projectedWinsForComparison =
				gamesPlayed > 0 ? calculateProjectedWins(actualWins, gamesPlayed, 162, false) : 0;
			const projectedWinsForDisplay = standing?.projectedWins ?? 0;

			const line = linesByTeamId.get(team.id) ?? 0;
			const result = calculatePickResult(teamPick.pick, line, projectedWinsForComparison);

			picks.push({
				actualWins,
				gamesPlayed,
				line,
				pick: teamPick.pick,
				projectedWins: projectedWinsForDisplay,
				result,
				team: {
					abbreviation: team.abbreviation,
					city: team.city,
					conference: team.conference,
					id: team.id,
					name: team.name,
					sport: team.sport,
				} as Team,
			});

			if (result === PickResult.Win) {
				wins++;
			} else if (result === PickResult.Loss) {
				losses++;
			} else if (result === PickResult.Push) {
				pushes++;
			}
		}

		picks.sort((a, b) => {
			const nameA = `${a.team.city} ${a.team.name}`;
			const nameB = `${b.team.city} ${b.team.name}`;
			return nameA.localeCompare(nameB);
		});

		return {
			results: {
				date,
				picks,
				summary: { losses, pending: 0, pushes, total: wins + losses + pushes, wins },
			} as GroupResults,
		};
	},
);

export const getCopyableSheetsAction = withAuth(async (user, groupId: string) => {
	const group = await groupService.findById(groupId);

	if (!group) {
		return { sheets: [] as CopyableSheet[] };
	}

	const otherGroups = await groupSvc.findByUserSportSeason(user.id, group.sport, group.season);
	const filteredGroups = otherGroups.filter((g) => g.id !== groupId);

	if (filteredGroups.length === 0) {
		return { sheets: [] as CopyableSheet[] };
	}

	const otherGroupIds = filteredGroups.map((g) => g.id);
	const sheets = await sheetService.find({ group: { $in: otherGroupIds }, user: user.id });

	const copyableSheets: CopyableSheet[] = sheets.map((s) => {
		const g = filteredGroups.find((fg) => fg.id === resolveRefId(s.group));

		return {
			groupId: resolveRefId(s.group)!,
			groupName: g?.name ?? 'Unknown',
			sheetId: s.id,
		};
	});

	return { sheets: copyableSheets };
});

export const getLeaderboardAction = withAuth(async (user, groupId: string, date?: string) => {
	const group = await groupService.findForMemberPopulated(groupId, user.id);

	if (!group) {
		return notFound('Group');
	}

	const entries = await calculateLeaderboard(group, groupId, date);

	for (const entry of entries) {
		entry.isCurrentUser = entry.userId === user.id;
	}

	return { leaderboard: { date, entries } as LeaderboardData };
});
