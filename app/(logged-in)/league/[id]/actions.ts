'use server';

import { revalidatePath } from 'next/cache';

import { forbidden, locked, notFound, serverError, validation } from '@/lib/action-errors';
import { resolveRef, resolveRefId } from '@/lib/ref-utils';
import { withAuth } from '@/lib/with-auth-action';
import {
	calculateLeaderboard,
	getGroupForMember,
	groupService,
} from '@/server/groups/group.actions';
import { validateSavePicksInput } from '@/server/picks/pick-rules';
import { isSeasonFinalForScoring, selectWinsForScoring } from '@/server/picks/scoring';
import { seasonService } from '@/server/seasons/season.service';
import { teamLineService } from '@/server/seasons/team-line.service';
import { sheetService } from '@/server/sheets/sheet.service';
import { calculatePickResult, getStandingsForDate } from '@/server/standings/standings.actions';
import {
	CopyableSheet,
	GroupResults,
	GroupRole,
	GroupVisibility,
	LeaderboardData,
	PickDirection,
	PickResult,
	SavePicksInput,
	TeamPick,
	TeamPickResult,
} from '@/types';

const isLocked = (lockDate: Date): boolean => new Date(lockDate).getTime() <= Date.now();

const isValidDate = (date?: string): boolean => {
	if (date === undefined) {
		return true;
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return false;
	}

	const parsed = new Date(`${date}T00:00:00.000Z`);

	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

export const updateGroupNameAction = withAuth(async (user, groupId: string, name: string) => {
	if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
		return validation('Group name must be between 1 and 80 characters');
	}

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

export const updateGroupVisibilityAction = withAuth(
	async (user, groupId: string, visibility: GroupVisibility) => {
		if (!Object.values(GroupVisibility).includes(visibility)) {
			return validation('Invalid group visibility');
		}

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
	},
);

export const copyPicksFromSheetAction = withAuth(
	async (user, targetGroupId: string, sourceSheetId: string) => {
		const sourceSheet = await sheetService.findById(sourceSheetId);

		if (!sourceSheet || resolveRefId(sourceSheet.user) !== user.id) {
			return notFound('Source sheet');
		}

		const targetSheet = await sheetService.findByGroupAndUserPopulated(targetGroupId, user.id);

		if (!targetSheet) {
			return notFound('Target sheet');
		}

		const targetGroup = await groupService.findById(targetGroupId);

		if (!targetGroup) {
			return notFound('Group');
		}

		if (isLocked(targetGroup.lockDate)) {
			return locked('Picks');
		}

		const sourcePicksMap = new Map(
			sourceSheet.teamPicks.map((tp: TeamPick) => [resolveRefId(tp.team), tp.pick]),
		);

		const teamPicks = Object.fromEntries(
			targetSheet.teamPicks.map((teamPick) => {
				const teamId = resolveRefId(teamPick.team)!;
				return [teamId, sourcePicksMap.get(teamId) ?? teamPick.pick ?? null];
			}),
		);
		const validationResult = validateSavePicksInput(
			{
				postseasonPicks: sourceSheet.postseasonPicks,
				teamPicks,
				worldSeriesPicks: sourceSheet.worldSeriesPicks,
			},
			targetSheet.teamPicks,
		);

		if (!validationResult.value) {
			return validation(validationResult.error);
		}

		const normalizedInput = validationResult.value;

		const teamLines = await teamLineService.findBySeason(targetGroup.sport, targetGroup.season);
		const linesByTeamId = new Map(
			teamLines.map((teamLine) => [resolveRefId(teamLine.team), teamLine.line]),
		);

		await sheetService.ensureHistoricalSnapshot(targetSheet, targetGroup.lockDate, linesByTeamId);

		const updatedTeamPicks = targetSheet.teamPicks.map((tp: TeamPick) => {
			const teamId = resolveRefId(tp.team)!;
			const pick = normalizedInput.teamPicks[teamId];

			return {
				line: tp.line ?? linesByTeamId.get(teamId),
				pick: pick ? (pick === 'over' ? PickDirection.Over : PickDirection.Under) : undefined,
				team: teamId,
			};
		});

		const updatedSheet = await sheetService.updatePicksBeforeLock(
			targetSheet.id,
			user.id,
			updatedTeamPicks,
			{
				postseasonPicks: normalizedInput.postseasonPicks,
				worldSeriesPicks: normalizedInput.worldSeriesPicks,
			},
		);

		if (!updatedSheet) {
			return locked('Picks');
		}

		return { success: true };
	},
);

export const getSheetForMemberAction = withAuth(async (user, groupId: string, memberId: string) => {
	const group = await getGroupForMember(groupId, user.id);

	if (!group) {
		return notFound('Group');
	}

	if (memberId !== user.id && !isLocked(group.lockDate)) {
		return forbidden('view other members’ picks before the deadline');
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

	if (isLocked(group.lockDate)) {
		return locked('Picks');
	}

	const validationResult = validateSavePicksInput(input, sheet.teamPicks);

	if (!validationResult.value) {
		return validation(validationResult.error);
	}

	const normalizedInput = validationResult.value;

	try {
		const teamLines = await teamLineService.findBySeason(group.sport, group.season);
		const linesByTeamId = new Map(
			teamLines.map((teamLine) => [resolveRefId(teamLine.team), teamLine.line]),
		);

		await sheetService.ensureHistoricalSnapshot(sheet, group.lockDate, linesByTeamId);

		const updatedTeamPicks: TeamPick[] = sheet.teamPicks.map((tp: TeamPick) => {
			const teamId = resolveRefId(tp.team)!;
			const pick = normalizedInput.teamPicks[teamId];
			const line = tp.line ?? linesByTeamId.get(teamId);

			if (typeof line !== 'number' || !Number.isFinite(line)) {
				throw new Error(`No immutable line is available for team ${teamId}`);
			}

			return {
				line,
				pick: pick ? (pick === 'over' ? PickDirection.Over : PickDirection.Under) : undefined,
				team: teamId,
			};
		});

		const updatedSheet = await sheetService.updatePicksBeforeLock(
			sheet.id,
			user.id,
			updatedTeamPicks,
			{
				postseasonPicks: normalizedInput.postseasonPicks,
				worldSeriesPicks: normalizedInput.worldSeriesPicks,
			},
		);

		if (!updatedSheet) {
			return locked('Picks');
		}

		revalidatePath(`/league/${groupId}`);
		return { sheet: updatedSheet };
	} catch (error) {
		console.error('Failed to save picks:', error);
		return serverError('save picks');
	}
});

export const getResultsAction = withAuth(
	async (user, groupId: string, userId?: string, date?: string) => {
		if (!isValidDate(date)) {
			return validation('Date must be in YYYY-MM-DD format');
		}

		const group = await groupService.findForMember(groupId, user.id);

		if (!group) {
			return forbidden('view results');
		}

		const targetUserId = userId || user.id;

		if (targetUserId !== user.id && !isLocked(group.lockDate)) {
			return forbidden('view other members’ results before the deadline');
		}

		const [sheet, teamLines, season] = await Promise.all([
			sheetService.findByUserAndGroupPopulated(targetUserId, groupId),
			teamLineService.findBySeason(group.sport, group.season),
			seasonService.findBySportAndYear(group.sport, group.season),
		]);

		if (!sheet) {
			return notFound('Sheet');
		}

		const linesByTeamId = new Map(teamLines.map((tl) => [resolveRefId(tl.team), tl.line]));
		const isFinal = isSeasonFinalForScoring(season, date);

		// Get standings data
		const standingsData = date
			? await getStandingsForDate(group.season, new Date(date))
			: await getStandingsForDate(group.season, new Date());

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
			const scoringWins = selectWinsForScoring(standing ?? {}, isFinal);

			const line = teamPick.line ?? linesByTeamId.get(team.id) ?? 0;
			const result = calculatePickResult(teamPick.pick, line, scoringWins);

			picks.push({
				actualWins,
				gamesPlayed,
				line,
				pick: teamPick.pick,
				projectedWins: scoringWins,
				result,
				team,
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
	const group = await groupService.findForMember(groupId, user.id);

	if (!group || isLocked(group.lockDate)) {
		return { sheets: [] as CopyableSheet[] };
	}

	const otherGroups = await groupService.findByUserSportSeason(user.id, group.sport, group.season);
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
	if (!isValidDate(date)) {
		return validation('Date must be in YYYY-MM-DD format');
	}

	const group = await groupService.findForMemberPopulated(groupId, user.id);

	if (!group) {
		return notFound('Group');
	}

	if (!isLocked(group.lockDate)) {
		return locked('Picks');
	}

	const entries = await calculateLeaderboard(group, groupId, date);

	for (const entry of entries) {
		entry.isCurrentUser = entry.userId === user.id;
	}

	return { leaderboard: { date, entries } as LeaderboardData };
});
