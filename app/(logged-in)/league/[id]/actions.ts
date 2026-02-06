'use server';

import { revalidatePath } from 'next/cache';

import { getAuthUser } from '@/lib/auth';
import { dbConnect } from '@/lib/mongoose';
import { GroupModel } from '@/models/group.model';
import { SheetModel } from '@/models/sheet.model';
import { getGroupForMember } from '@/server/groups';
import { calculateProjectedWins } from '@/server/mlb-api';
import { getSheetByGroupAndUserPopulated, updateSheet } from '@/server/sheets';
import { calculatePickResult, getFinalStandings, getStandingsForDate, PickResult } from '@/server/standings';
import { Group, PickDirection, PostseasonPicks, Sheet, Team, TeamPick, User, WorldSeriesPicks } from '@/types';

export async function getGroupAction(groupId: string): Promise<{ error?: string; group?: Group }> {
  console.log('[getGroupAction] Starting for groupId:', groupId);
  const user = await getAuthUser();
  console.log('[getGroupAction] User:', user ? user.id : 'null');

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const group = await getGroupForMember(groupId, user.id);
  console.log('[getGroupAction] Group found:', !!group);

  if (!group) {
    return { error: 'Group not found' };
  }

  return { group };
}

export async function getSheetAction(groupId: string): Promise<{ error?: string; sheet?: Sheet }> {
  const user = await getAuthUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const sheet = await getSheetByGroupAndUserPopulated(groupId, user.id);

  if (!sheet) {
    return { error: 'Sheet not found' };
  }

  return { sheet };
}

export async function getSheetForMemberAction(groupId: string, memberId: string): Promise<{ error?: string; sheet?: Sheet }> {
  const user = await getAuthUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify current user is a member of the group
  const group = await getGroupForMember(groupId, user.id);

  if (!group) {
    return { error: 'Group not found' };
  }

  const sheet = await getSheetByGroupAndUserPopulated(groupId, memberId);

  if (!sheet) {
    return { error: 'Sheet not found' };
  }

  return { sheet };
}

export interface SavePicksInput {
  postseasonPicks?: PostseasonPicks;
  teamPicks: Record<string, 'over' | 'under' | null>;
  worldSeriesPicks?: WorldSeriesPicks;
}

export async function savePicksAction(
  groupId: string,
  input: SavePicksInput,
): Promise<{ error?: string; sheet?: Sheet }> {
  const user = await getAuthUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get the user's sheet
  const sheet = await getSheetByGroupAndUserPopulated(groupId, user.id);

  if (!sheet) {
    return { error: 'Sheet not found' };
  }

  // Check if group is locked
  const group = await getGroupForMember(groupId, user.id);

  if (!group) {
    return { error: 'Group not found' };
  }

  if (new Date(group.lockDate) < new Date()) {
    return { error: 'Picks are locked' };
  }

  // Update team picks
  const updatedTeamPicks: TeamPick[] = sheet.teamPicks.map((tp: TeamPick) => {
    const teamId = typeof tp.team === 'string' ? tp.team : tp.team.id;
    const pick = input.teamPicks[teamId];

    return {
      ...tp,
      pick: pick ? (pick === 'over' ? PickDirection.Over : PickDirection.Under) : undefined,
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
}

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

export async function getResultsAction(
  groupId: string,
  userId?: string,
  date?: string,
): Promise<{ error?: string; results?: GroupResults }> {
  const user = await getAuthUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  await dbConnect();

  // Get group and verify membership
  const group = await GroupModel.findOne({ _id: groupId, 'members.user': user.id });

  if (!group) {
    return { error: 'Group not found' };
  }

  // Use provided userId or current user
  const targetUserId = userId || user.id;

  // Get the user's sheet
  const sheet = await SheetModel.findOne({ group: groupId, user: targetUserId }).populate('teamPicks.team');

  if (!sheet) {
    return { error: 'Sheet not found' };
  }

  // Get standings data
  let standingsData: Map<string, { projectedWins: number; wins: number; gamesPlayed: number }>;

  if (date) {
    const dateObj = new Date(date);
    const historicalStandings = await getStandingsForDate(group.season, dateObj);
    standingsData = new Map();

    for (const [teamId, data] of historicalStandings) {
      standingsData.set(teamId, { gamesPlayed: data.gamesPlayed, projectedWins: data.projectedWins, wins: data.wins });
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
    const projectedWinsForComparison = gamesPlayed > 0
      ? calculateProjectedWins(actualWins, gamesPlayed, 162, false)
      : 0;
    const projectedWinsForDisplay = standing?.projectedWins ?? 0;

    const result = calculatePickResult(teamPick.pick, teamPick.line, projectedWinsForComparison);

    picks.push({
      actualWins,
      gamesPlayed,
      line: teamPick.line,
      pick: teamPick.pick,
      projectedWins: projectedWinsForDisplay,
      result,
      team,
    });

    if (result === 'win') {wins++;}
    else if (result === 'loss') {losses++;}
    else if (result === 'push') {pushes++;}
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
      summary: {
        losses,
        pending: 0,
        pushes,
        total: wins + losses + pushes,
        wins,
      },
    },
  };
}

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

export async function getLeaderboardAction(
  groupId: string,
  date?: string,
): Promise<{ error?: string; leaderboard?: LeaderboardData }> {
  const user = await getAuthUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  await dbConnect();

  // Get group and verify membership
  const group = await GroupModel.findOne({ _id: groupId, 'members.user': user.id }).populate('members.user');

  if (!group) {
    return { error: 'Group not found' };
  }

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

  // Get all sheets for this group
  const sheets = await SheetModel.find({ group: groupId }).populate('teamPicks.team');

  // Calculate results for each member
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

        const teamId = typeof teamPick.team === 'string' ? teamPick.team : (teamPick.team as { id: string }).id;
        const standing = standingsData.get(teamId);

        const projectedWins = standing && standing.gamesPlayed > 0
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

    entries.push({
      losses,
      pushes,
      total,
      userId: memberId,
      userInitials,
      userName,
      winPct,
      wins,
    });
  }

  // Sort by wins descending
  entries.sort((a, b) => b.wins - a.wins || b.winPct - a.winPct);

  return {
    leaderboard: {
      date,
      entries,
    },
  };
}
