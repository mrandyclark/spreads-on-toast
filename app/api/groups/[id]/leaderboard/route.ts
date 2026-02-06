import { NextRequest } from 'next/server';

import { dbConnect } from '@/lib/mongoose';
import { GroupModel } from '@/models/group.model';
import { SheetModel } from '@/models/sheet.model';
import { calculateProjectedWins } from '@/server/mlb-api';
import { calculatePickResult, getFinalStandings, getStandingsForDate, PickResult } from '@/server/standings';
import { TeamPick, User } from '@/types';

export interface LeaderboardEntry {
  losses: number;
  pushes: number;
  rank: number;
  total: number;
  userId: string;
  userInitials: string;
  userName: string;
  winPct: number;
  wins: number;
}

export interface LeaderboardResponse {
  date?: string;
  entries: LeaderboardEntry[];
  season: string;
}

/**
 * GET /api/groups/[id]/leaderboard
 * Get the leaderboard for a group (all members' results)
 * 
 * Query params:
 * - date: optional, YYYY-MM-DD format for historical lookup (uses projected wins)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await dbConnect();

  // Get the group with populated members
  const group = await GroupModel.findById(id).populate('members.user');

  if (!group) {
    return Response.json({ error: 'Group not found' }, { status: 404 });
  }

  // Check if locked
  if (new Date(group.lockDate) > new Date()) {
    return Response.json({ error: 'Season not yet locked' }, { status: 400 });
  }

  // Get optional date parameter for historical lookup
  const dateParam = request.nextUrl.searchParams.get('date');
  const isHistorical = !!dateParam;

  // Get standings - either for a specific date or final standings
  // Store wins and gamesPlayed so we can recalculate with full precision
  let standingsData: Map<string, { wins: number; gamesPlayed: number }>;

  if (isHistorical && dateParam) {
    const date = new Date(dateParam);
    const historicalStandings = await getStandingsForDate(group.season, date);
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
  const sheets = await SheetModel.find({ group: id }).populate('teamPicks.team');

  // Calculate results for each member
  const entries: LeaderboardEntry[] = [];

  for (const member of group.members) {
    const user = member.user as User;
    const userId = typeof member.user === 'string' ? member.user : user.id;

    // Find the sheet for this user
    const sheet = sheets.find((s) => s.user.toString() === userId);

    let wins = 0;
    let losses = 0;
    let pushes = 0;

    if (sheet) {
      for (const teamPick of sheet.teamPicks as TeamPick[]) {
        if (!teamPick.pick) {continue;}

        const teamId = typeof teamPick.team === 'string' ? teamPick.team : (teamPick.team as { id: string }).id;
        const standing = standingsData.get(teamId);
        
        // Recalculate projected wins with full precision to avoid false pushes
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

    const userName = user
      ? `${user.nameFirst ?? ''} ${user.nameLast ?? ''}`.trim() || 'Member'
      : 'Member';

    const userInitials = user?.nameFirst
      ? user.nameFirst.slice(0, 2).toUpperCase()
      : '??';

    entries.push({
      losses,
      pushes,
      rank: 0, // Will be set after sorting
      total,
      userId,
      userInitials,
      userName,
      winPct,
      wins,
    });
  }

  // Sort by wins (descending), then by win percentage
  entries.sort((a, b) => {
    if (b.wins !== a.wins) {return b.wins - a.wins;}
    return b.winPct - a.winPct;
  });

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  const response: LeaderboardResponse = {
    date: dateParam ?? undefined,
    entries,
    season: group.season,
  };

  return Response.json(response);
}
