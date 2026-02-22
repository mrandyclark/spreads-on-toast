'use server';

import { revalidatePath } from 'next/cache';

import { resolveRef, resolveRefId } from '@/lib/ref-utils';
import { withAuth } from '@/lib/with-auth-action';
import { getGroupForMember, groupService } from '@/server/groups/group.actions';
import { calculateProjectedWins } from '@/server/mlb-api';
import { sheetService } from '@/server/sheets/sheet.service';
import {
	calculatePickResult,
	getFinalStandings,
	getStandingsForDate,
} from '@/server/standings/standings.actions';
import {
	GroupResults,
	GroupRole,
	GroupVisibility,
	LeaderboardData,
	LeaderboardEntry,
	PickDirection,
	PickResult,
	SavePicksInput,
	Sheet,
	Team,
	TeamPick,
	TeamPickResult,
	User,
} from '@/types';

export const updateGroupNameAction = withAuth(async (user, groupId: string, name: string) => {
	const group = await groupService.findById(groupId);

	if (!group) {
		return { error: 'Group not found' };
	}

	const member = group.members.find((m) => resolveRefId(m.user) === user.id);

	if (!member || (member.role !== GroupRole.Owner && member.role !== GroupRole.Admin)) {
		return { error: 'Not authorized to edit group' };
	}

	await groupService.findByIdAndUpdate(groupId, { $set: { name: name.trim() } });

	return { success: true };
});

export const updateGroupVisibilityAction = withAuth(async (user, groupId: string, visibility: GroupVisibility) => {
	const group = await groupService.findById(groupId);

	if (!group) {
		return { error: 'Group not found' };
	}

	const member = group.members.find((m) => resolveRefId(m.user) === user.id);

	if (!member || (member.role !== GroupRole.Owner && member.role !== GroupRole.Admin)) {
		return { error: 'Not authorized to edit group' };
	}

	await groupService.findByIdAndUpdate(groupId, { $set: { visibility } });

	return { success: true };
});

export const copyPicksFromSheetAction = withAuth(async (user, targetGroupId: string, sourceSheetId: string) => {
	const sourceSheet = await sheetService.findById(sourceSheetId);

	if (!sourceSheet || resolveRefId(sourceSheet.user) !== user.id) {
		return { error: 'Source sheet not found' };
	}

	const targetSheet = await sheetService.findByGroupAndUser(targetGroupId, user.id);

	if (!targetSheet) {
		return { error: 'Target sheet not found' };
	}

	const targetGroup = await groupService.findById(targetGroupId);

	if (!targetGroup) {
		return { error: 'Group not found' };
	}

	if (new Date(targetGroup.lockDate) < new Date()) {
		return { error: 'Picks are locked' };
	}

	const sourcePicksMap = new Map(
		sourceSheet.teamPicks.map((tp: TeamPick) => [resolveRefId(tp.team), tp.pick]),
	);

	const updatedTeamPicks = targetSheet.teamPicks.map((tp: TeamPick) => {
		const teamId = resolveRefId(tp.team)!;
		const sourcePick = sourcePicksMap.get(teamId);

		return {
			line: tp.line,
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

	if (!group) {return {};}

	const sheet = await sheetService.findByGroupAndUserPopulated(groupId, memberId);

	if (!sheet) {return {};}
	return { sheet: JSON.parse(JSON.stringify(sheet)) as Sheet };
});

export const savePicksAction = withAuth(async (user, groupId: string, input: SavePicksInput) => {
	const sheet = await sheetService.findByGroupAndUserPopulated(groupId, user.id);

	if (!sheet) {return { error: 'Sheet not found' };}

	const group = await getGroupForMember(groupId, user.id);

	if (!group) {return { error: 'Group not found' };}

	if (new Date(group.lockDate) < new Date()) {
		return { error: 'Picks are locked' };
	}

	const updatedTeamPicks: TeamPick[] = sheet.teamPicks.map((tp: TeamPick) => {
		const teamId = resolveRefId(tp.team)!;
		const pick = input.teamPicks[teamId];
		return {
			line: tp.line,
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
		return { error: 'Failed to save picks' };
	}
});

export const getResultsAction = withAuth(
	async (user, groupId: string, userId?: string, date?: string) => {
		const isMember = await groupService.isMember(groupId, user.id);

		if (!isMember) {return {};}

		const group = await groupService.findById(groupId);

		if (!group) {return {};}

		const targetUserId = userId || user.id;
		const sheet = await sheetService.findByUserAndGroupPopulated(targetUserId, groupId);

		if (!sheet) {return {};}

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
			if (!teamPick.pick) {continue;}

			const team = resolveRef(teamPick.team);

			if (!team) {continue;}

			const standing = standingsData.get(team.id);

			const actualWins = standing?.wins ?? 0;
			const gamesPlayed = standing?.gamesPlayed ?? 0;
			const projectedWinsForComparison =
				gamesPlayed > 0 ? calculateProjectedWins(actualWins, gamesPlayed, 162, false) : 0;
			const projectedWinsForDisplay = standing?.projectedWins ?? 0;

			const result = calculatePickResult(teamPick.pick, teamPick.line, projectedWinsForComparison);

			picks.push({
				actualWins,
				gamesPlayed,
				line: teamPick.line,
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

export const getLeaderboardAction = withAuth(async (user, groupId: string, date?: string) => {
	const group = await groupService.findForMemberPopulated(groupId, user.id);

	if (!group) {return {};}

	// Get standings data
	let standingsData: Map<string, { wins: number; gamesPlayed: number }>;

	if (date) {
		const dateObj = new Date(date);
		const historicalStandings = await getStandingsForDate(group.season, dateObj);
		standingsData = new Map();

		for (const [teamId, data] of historicalStandings) {
			standingsData.set(teamId, { gamesPlayed: data.gamesPlayed, wins: data.wins });
		}
	} else {
		const finalStandings = await getFinalStandings(group.season);
		standingsData = new Map();

		for (const [teamId, wins] of finalStandings) {
			standingsData.set(teamId, { gamesPlayed: 162, wins });
		}
	}

	const sheets = await sheetService.findByGroupPopulated(groupId);
	const entries: LeaderboardEntry[] = [];

	for (const member of group.members) {
		const memberUser = member.user as User;
		const memberId = resolveRefId(member.user)!;
		const sheet = sheets.find((s) => s.user.toString() === memberId);

		let wins = 0;
		let losses = 0;
		let pushes = 0;

		if (sheet) {
			for (const teamPick of sheet.teamPicks as TeamPick[]) {
				if (!teamPick.pick) {continue;}

				const teamId = resolveRefId(teamPick.team)!;
				const standing = standingsData.get(teamId);

				const projectedWins =
					standing && standing.gamesPlayed > 0
						? calculateProjectedWins(standing.wins, standing.gamesPlayed, 162, false)
						: 0;
				const result: PickResult = calculatePickResult(teamPick.pick, teamPick.line, projectedWins);

				if (result === 'win') {wins++;}
				else if (result === 'loss') {losses++;}
				else if (result === 'push') {pushes++;}
			}
		}

		const total = wins + losses + pushes;
		const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;

		const userName = memberUser
			? `${memberUser.nameFirst ?? ''} ${memberUser.nameLast ?? ''}`.trim() || 'Member'
			: 'Member';

		const userInitials = memberUser
			? `${memberUser.nameFirst?.[0] ?? ''}${memberUser.nameLast?.[0] ?? ''}`.toUpperCase() || '?'
			: '?';

		entries.push({ isCurrentUser: memberId === user.id, losses, pushes, total, userId: memberId, userInitials, userName, winPct, wins });
	}

	entries.sort((a, b) => b.wins - a.wins || b.winPct - a.winPct);

	return { leaderboard: { date, entries } as LeaderboardData };
});
