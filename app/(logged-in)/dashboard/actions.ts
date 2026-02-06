'use server';

import { revalidatePath } from 'next/cache';

import { getAuthUser } from '@/lib/auth';
import { createGroup, getGroupsByUser, joinGroupByInviteCode } from '@/server/groups';
import { getSeasonsBySport, getTeamLinesBySeason } from '@/server/seasons';
import { getLatestStandings } from '@/server/standings';
import { getTeamsBySport } from '@/server/teams';
import { Conference, Group, Season, Sport, Team, TeamLine, TeamStanding } from '@/types';

export async function getGroupsAction(): Promise<{ error?: string; groups?: Group[] }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	const groups = await getGroupsByUser(user.id);

	return { groups };
}

export async function getSeasonsAction(
	sport: Sport,
): Promise<{ error?: string; seasons?: Season[] }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	const seasons = await getSeasonsBySport(sport);

	return { seasons };
}

export interface CreateGroupInput {
	lockDate: string;
	name: string;
	season: string;
	sport: Sport;
}

export async function createGroupAction(
	input: CreateGroupInput,
): Promise<{ error?: string; group?: Group }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	if (!input.name.trim()) {
		return { error: 'Group name is required' };
	}

	try {
		const group = await createGroup({
			lockDate: new Date(input.lockDate),
			name: input.name.trim(),
			owner: user.id,
			season: input.season,
			sport: input.sport,
		});

		revalidatePath('/dashboard');

		return { group };
	} catch (error) {
		console.error('Failed to create group:', error);
		return { error: 'Failed to create group' };
	}
}

export async function joinGroupAction(
	inviteCode: string,
): Promise<{ error?: string; group?: Group }> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	if (!inviteCode.trim()) {
		return { error: 'Invite code is required' };
	}

	try {
		const result = await joinGroupByInviteCode(inviteCode, user.id);

		if (result.error) {
			return { error: result.error };
		}

		revalidatePath('/dashboard');

		return { group: result.group };
	} catch (error) {
		console.error('Failed to join group:', error);
		return { error: 'Failed to join group' };
	}
}

export interface StandingsTeamRow {
	abbreviation: string;
	city: string;
	conference: Conference;
	line: number | null;
	losses: number;
	name: string;
	projectedWins: number;
	overUnder: 'over' | 'under' | 'push' | null;
	teamId: string;
	wins: number;
}

export async function getStandingsAction(): Promise<{
	error?: string;
	standings?: StandingsTeamRow[];
	asOfDate?: string;
}> {
	const user = await getAuthUser();

	if (!user) {
		return { error: 'Unauthorized' };
	}

	try {
		// Get the current season year
		const currentYear = new Date().getFullYear().toString();

		// Fetch standings, teams, and lines in parallel
		const [latestStandings, teams, teamLines] = await Promise.all([
			getLatestStandings(currentYear),
			getTeamsBySport(Sport.MLB),
			getTeamLinesBySeason(Sport.MLB, currentYear),
		]);

		if (latestStandings.length === 0) {
			return { standings: [] };
		}

		// Build lookup maps
		const teamsById = new Map<string, Team>(teams.map((t) => [t.id, t]));
		const linesByTeamId = new Map<string, number>(
			teamLines.map((tl) => {
				const teamId = typeof tl.team === 'string' ? tl.team : (tl.team as Team).id;
				return [teamId, tl.line];
			}),
		);

		// Get the date from the first standing
		const asOfDate = latestStandings[0]?.date
			? new Date(latestStandings[0].date).toISOString()
			: undefined;

		const rows: StandingsTeamRow[] = latestStandings
			.map((standing) => {
				const teamId =
					typeof standing.team === 'string' ? standing.team : (standing.team as Team).id;
				const team =
					typeof standing.team === 'object' && standing.team !== null
						? (standing.team as Team)
						: teamsById.get(teamId);

				if (!team) return null;

				const line = linesByTeamId.get(team.id) ?? null;
				let overUnder: 'over' | 'under' | 'push' | null = null;

				if (line !== null && standing.projectedWins > 0) {
					if (standing.projectedWins > line) {
						overUnder = 'over';
					} else if (standing.projectedWins < line) {
						overUnder = 'under';
					} else {
						overUnder = 'push';
					}
				}

				return {
					abbreviation: team.abbreviation,
					city: team.city,
					conference: team.conference,
					line,
					losses: standing.losses,
					name: team.name,
					projectedWins: standing.projectedWins,
					overUnder,
					teamId: team.id,
					wins: standing.wins,
				};
			})
			.filter(Boolean) as StandingsTeamRow[];

		return { standings: rows, asOfDate };
	} catch (error) {
		console.error('Failed to fetch standings:', error);
		return { error: 'Failed to fetch standings' };
	}
}
