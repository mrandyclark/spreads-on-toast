'use server';

import { revalidatePath } from 'next/cache';

import { dbConnect } from '@/lib/mongoose';
import { withAuth } from '@/lib/with-auth-action';
import { GroupModel } from '@/models/group.model';
import { SheetModel } from '@/models/sheet.model';
import { getGroupForMember } from '@/server/groups';
import { calculateProjectedWins } from '@/server/mlb-api';
import { getSheetByGroupAndUserPopulated, updateSheet } from '@/server/sheets';
import {
	calculatePickResult,
	getFinalStandings,
	getStandingsForDate,
} from '@/server/standings';
import {
	Group,
	GroupRole,
	GroupVisibility,
	PickDirection,
	PickResult,
	PostseasonPicks,
	Sheet,
	Team,
	TeamPick,
	User,
	WorldSeriesPicks,
} from '@/types';

export const getGroupAction = withAuth(async (user, groupId: string) => {
	const group = await getGroupForMember(groupId, user.id);

	if (!group) {
		return {};
	}

	return { group: JSON.parse(JSON.stringify(group)) as Group };
});

export const updateGroupNameAction = withAuth(async (user, groupId: string, name: string) => {
	await dbConnect();

	const group = await GroupModel.findById(groupId);

	if (!group) {
		return { error: 'Group not found' };
	}

	// Check if user is owner or admin
	const member = group.members.find(
		(m) => m.user.toString() === user.id,
	);

	if (!member || (member.role !== GroupRole.Owner && member.role !== GroupRole.Admin)) {
		return { error: 'Not authorized to edit group' };
	}

	group.name = name.trim();
	await group.save();

	return { success: true };
});

export const updateGroupVisibilityAction = withAuth(async (user, groupId: string, visibility: GroupVisibility) => {
	await dbConnect();

	const group = await GroupModel.findById(groupId);

	if (!group) {
		return { error: 'Group not found' };
	}

	// Check if user is owner or admin
	const member = group.members.find(
		(m) => m.user.toString() === user.id,
	);

	if (!member || (member.role !== GroupRole.Owner && member.role !== GroupRole.Admin)) {
		return { error: 'Not authorized to edit group' };
	}

	group.visibility = visibility;
	await group.save();

	return { success: true };
});

export const getSheetAction = withAuth(async (user, groupId: string) => {
	const sheet = await getSheetByGroupAndUserPopulated(groupId, user.id);

	if (!sheet) {
		return {};
	}

	return { sheet: JSON.parse(JSON.stringify(sheet)) as Sheet };
});

export interface CopyableSheet {
	groupId: string;
	groupName: string;
	sheetId: string;
}

export const getCopyableSheetsAction = withAuth(async (user, groupId: string) => {
	await dbConnect();

	// Get the current group to know the sport/season
	const currentGroup = await GroupModel.findById(groupId);

	if (!currentGroup) {
		return { sheets: [] };
	}

	// Find all groups the user is a member of with the same sport/season
	const groups = await GroupModel.find({
		'members.user': user.id,
		season: currentGroup.season,
		sport: currentGroup.sport,
	});

	// Filter out the current group
	const otherGroups = groups.filter((g) => g.id !== groupId);

	if (otherGroups.length === 0) {
		return { sheets: [] };
	}

	// Get sheets for these groups
	const sheets = await SheetModel.find({
		group: { $in: otherGroups.map((g) => g.id) },
		user: user.id,
	});

	// Build the result with group names
	const result: CopyableSheet[] = sheets.map((s) => {
		const group = otherGroups.find((g) => g.id === s.group.toString());

		return {
			groupId: s.group.toString(),
			groupName: group?.name ?? 'Unknown',
			sheetId: s.id,
		};
	});

	return { sheets: result };
});

export const copyPicksFromSheetAction = withAuth(async (user, targetGroupId: string, sourceSheetId: string) => {
	await dbConnect();

	// Get the source sheet
	const sourceSheet = await SheetModel.findById(sourceSheetId);

	if (!sourceSheet || sourceSheet.user.toString() !== user.id) {
		return { error: 'Source sheet not found' };
	}

	// Get the target sheet
	const targetSheet = await SheetModel.findOne({ group: targetGroupId, user: user.id });

	if (!targetSheet) {
		return { error: 'Target sheet not found' };
	}

	// Get the target group to check lock status
	const targetGroup = await GroupModel.findById(targetGroupId);

	if (!targetGroup) {
		return { error: 'Group not found' };
	}

	if (new Date(targetGroup.lockDate) < new Date()) {
		return { error: 'Picks are locked' };
	}

	// Copy picks - match by team ID
	const sourcePicksMap = new Map(
		sourceSheet.teamPicks.map((tp: { pick?: PickDirection; team: { toString: () => string } }) => [tp.team.toString(), tp.pick]),
	);

	targetSheet.teamPicks = targetSheet.teamPicks.map((tp: { line: number; pick?: PickDirection; team: { toString: () => string } }) => {
		const teamId = tp.team.toString();
		const sourcePick = sourcePicksMap.get(teamId);

		return {
			line: tp.line,
			pick: sourcePick ?? tp.pick,
			team: teamId,
		};
	});

	// Copy postseason picks if they exist
	if (sourceSheet.postseasonPicks) {
		targetSheet.postseasonPicks = sourceSheet.postseasonPicks;
	}

	// Copy world series picks if they exist
	if (sourceSheet.worldSeriesPicks) {
		targetSheet.worldSeriesPicks = sourceSheet.worldSeriesPicks;
	}

	await targetSheet.save();

	return { success: true };
});

export const getSheetForMemberAction = withAuth(async (user, groupId: string, memberId: string) => {
	const group = await getGroupForMember(groupId, user.id);

	if (!group) {return {};}

	const sheet = await getSheetByGroupAndUserPopulated(groupId, memberId);

	if (!sheet) {return {};}
	return { sheet: JSON.parse(JSON.stringify(sheet)) as Sheet };
});

export interface SavePicksInput {
	postseasonPicks?: PostseasonPicks;
	teamPicks: Record<string, 'over' | 'under' | null>;
	worldSeriesPicks?: WorldSeriesPicks;
}

export const savePicksAction = withAuth(async (user, groupId: string, input: SavePicksInput) => {
	const sheet = await getSheetByGroupAndUserPopulated(groupId, user.id);

	if (!sheet) {return { error: 'Sheet not found' };}

	const group = await getGroupForMember(groupId, user.id);

	if (!group) {return { error: 'Group not found' };}

	if (new Date(group.lockDate) < new Date()) {
		return { error: 'Picks are locked' };
	}

	const updatedTeamPicks: TeamPick[] = sheet.teamPicks.map((tp: TeamPick) => {
		const teamId = typeof tp.team === 'string' ? tp.team : tp.team.id;
		const pick = input.teamPicks[teamId];
		return {
			line: tp.line,
			pick: pick ? (pick === 'over' ? PickDirection.Over : PickDirection.Under) : undefined,
			team: teamId,
		};
	});

	try {
		const updatedSheet = await updateSheet(sheet.id, {
			postseasonPicks: input.postseasonPicks,
			teamPicks: updatedTeamPicks,
			worldSeriesPicks: input.worldSeriesPicks,
		});
		revalidatePath(`/league/${groupId}`);
		return { sheet: updatedSheet ?? undefined };
	} catch (error) {
		console.error('Failed to save picks:', error);
		return { error: 'Failed to save picks' };
	}
});

// Results types
export interface TeamPickResult {
	actualWins?: number;
	gamesPlayed?: number;
	line: number;
	pick: 'over' | 'under';
	projectedWins: number;
	result: PickResult;
	team: Team;
}

export interface GroupResults {
	date?: string;
	picks: TeamPickResult[];
	summary: {
		wins: number;
		losses: number;
		pushes: number;
		pending: number;
		total: number;
	};
}

export const getResultsAction = withAuth(
	async (user, groupId: string, userId?: string, date?: string) => {
		await dbConnect();

		const group = await GroupModel.findOne({ _id: groupId, 'members.user': user.id });

		if (!group) {return {};}

		const targetUserId = userId || user.id;
		const sheet = await SheetModel.findOne({ group: groupId, user: targetUserId }).populate(
			'teamPicks.team',
		);

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

			const team = teamPick.team as Team;
			const teamId = typeof teamPick.team === 'string' ? teamPick.team : team.id;
			const standing = standingsData.get(teamId);

			const actualWins = standing?.wins ?? 0;
			const gamesPlayed = standing?.gamesPlayed ?? 0;
			const projectedWinsForComparison =
				gamesPlayed > 0 ? calculateProjectedWins(actualWins, gamesPlayed, 162, false) : 0;
			const projectedWinsForDisplay = standing?.projectedWins ?? 0;

			const result = calculatePickResult(teamPick.pick, teamPick.line, projectedWinsForComparison);

			const teamData =
				typeof team === 'object' && team !== null
					? {
						abbreviation: team.abbreviation,
						city: team.city,
						conference: team.conference,
						id: team.id,
						name: team.name,
						sport: team.sport,
					}
					: team;

			picks.push({
				actualWins,
				gamesPlayed,
				line: teamPick.line,
				pick: teamPick.pick,
				projectedWins: projectedWinsForDisplay,
				result,
				team: teamData as Team,
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

// Leaderboard types
export interface LeaderboardEntry {
	losses: number;
	pushes: number;
	total: number;
	userId: string;
	userInitials: string;
	userName: string;
	winPct: number;
	wins: number;
}

export interface LeaderboardData {
	date?: string;
	entries: LeaderboardEntry[];
}

export const getLeaderboardAction = withAuth(async (user, groupId: string, date?: string) => {
	await dbConnect();

	const group = await GroupModel.findOne({ _id: groupId, 'members.user': user.id }).populate(
		'members.user',
	);

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

	const sheets = await SheetModel.find({ group: groupId }).populate('teamPicks.team');
	const entries: LeaderboardEntry[] = [];

	for (const member of group.members) {
		const memberUser = member.user as User;
		const memberId = typeof member.user === 'string' ? member.user : memberUser.id;
		const sheet = sheets.find((s) => s.user.toString() === memberId);

		let wins = 0;
		let losses = 0;
		let pushes = 0;

		if (sheet) {
			for (const teamPick of sheet.teamPicks as TeamPick[]) {
				if (!teamPick.pick) {continue;}

				const teamId =
					typeof teamPick.team === 'string' ? teamPick.team : (teamPick.team as { id: string }).id;
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

		entries.push({ losses, pushes, total, userId: memberId, userInitials, userName, winPct, wins });
	}

	entries.sort((a, b) => b.wins - a.wins || b.winPct - a.winPct);

	return { leaderboard: { date, entries } as LeaderboardData };
});
