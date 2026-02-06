/**
 * MLB Stats API Client
 * Fetches standings data from the official MLB Stats API
 * API Docs: https://statsapi.mlb.com
 */

import { Streak } from '@/types';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

// League IDs
const AL_LEAGUE_ID = 103;
const NL_LEAGUE_ID = 104;

interface MlbStreak {
  streakCode: string;
  streakNumber: number;
  streakType: 'losses' | 'wins';
}

interface MlbTeamRecord {
  clinched: boolean;
  divisionRank: string;
  eliminationNumber: string;
  gamesBack: string;
  gamesPlayed: number;
  leagueRank: string;
  losses: number;
  runDifferential: number;
  runsAllowed: number;
  runsScored: number;
  season: string;
  streak?: MlbStreak;
  team: {
    id: number;
    name: string;
    link: string;
  };
  wildCardGamesBack: string;
  wildCardRank?: string;
  winningPercentage: string;
  wins: number;
}

interface MlbDivisionStandings {
  division: {
    id: number;
    link: string;
  };
  league: {
    id: number;
    link: string;
  };
  standingsType: string;
  teamRecords: MlbTeamRecord[];
}

interface MlbStandingsResponse {
  copyright: string;
  records: MlbDivisionStandings[];
}

export interface TeamStandingData {
  // Playoff status
  clinched: boolean;
  // Rankings
  divisionRank: number;

  eliminated: boolean;
  externalId: number;
  // Games back
  gamesBack: string;

  gamesPlayed: number;
  leagueRank: number;
  losses: number;

  name: string;
  runDifferential: number;

  runsAllowed: number;
  // Run production
  runsScored: number;
  // Streak
  streak?: Streak;

  wildCardGamesBack: string;

  wildCardRank?: number;
  // Core record
  wins: number;
}

/**
 * Fetch MLB standings for a given season and optional date
 * @param season - The season year (e.g., '2026')
 * @param date - Optional date in YYYY-MM-DD format for historical data
 */
export async function fetchMlbStandings(season: string, date?: string): Promise<TeamStandingData[]> {
  const url = new URL(`${MLB_API_BASE}/standings`);
  url.searchParams.set('leagueId', `${AL_LEAGUE_ID},${NL_LEAGUE_ID}`);
  url.searchParams.set('season', season);

  if (date) {
    url.searchParams.set('date', date);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
  }

  const data: MlbStandingsResponse = await response.json();

  // Flatten all team records from all divisions
  const standings: TeamStandingData[] = [];

  for (const division of data.records) {
    for (const record of division.teamRecords) {
      // Parse streak if present
      let streak: Streak | undefined;

      if (record.streak) {
        streak = {
          code: record.streak.streakCode,
          count: record.streak.streakNumber,
          type: record.streak.streakType,
        };
      }

      // Check if eliminated (eliminationNumber is a number, not "-")
      const eliminated = record.eliminationNumber !== '-' && record.eliminationNumber === '0';

      standings.push({
        externalId: record.team.id,
        name: record.team.name,

        // Core record
        gamesPlayed: record.gamesPlayed,
        losses: record.losses,
        wins: record.wins,

        // Rankings (parse from string to number)
        divisionRank: parseInt(record.divisionRank, 10),
        leagueRank: parseInt(record.leagueRank, 10),
        wildCardRank: record.wildCardRank ? parseInt(record.wildCardRank, 10) : undefined,

        // Games back
        gamesBack: record.gamesBack,
        wildCardGamesBack: record.wildCardGamesBack,

        // Run production
        runDifferential: record.runDifferential,
        runsAllowed: record.runsAllowed,
        runsScored: record.runsScored,

        // Streak
        streak,

        // Playoff status
        clinched: record.clinched,
        eliminated,
      });
    }
  }

  return standings;
}

/**
 * Calculate projected wins based on current pace
 * @param wins - Current wins
 * @param gamesPlayed - Games played so far
 * @param totalGames - Total games in season (default 162 for MLB)
 * @param forDisplay - If true, round to 1 decimal for display; if false, return full precision for calculations
 */
export function calculateProjectedWins(wins: number, gamesPlayed: number, totalGames = 162, forDisplay = true): number {
  if (gamesPlayed === 0) {
    return 0;
  }

  const projected = (wins / gamesPlayed) * totalGames;
  return forDisplay ? Math.round(projected * 10) / 10 : projected;
}

/**
 * Calculate Pythagorean wins (expected wins based on run differential)
 * Uses the Pythagorean expectation formula: RS^1.83 / (RS^1.83 + RA^1.83)
 * The exponent 1.83 is commonly used for baseball
 */
export function calculatePythagoreanWins(
  runsScored: number,
  runsAllowed: number,
  gamesPlayed: number,
  totalGames = 162,
): number {
  if (gamesPlayed === 0 || runsScored === 0 || runsAllowed === 0) {
    return 0;
  }

  const exponent = 1.83;
  const winPct = Math.pow(runsScored, exponent) / (Math.pow(runsScored, exponent) + Math.pow(runsAllowed, exponent));
  const projectedWins = winPct * totalGames;

  return Math.round(projectedWins * 10) / 10; // Round to 1 decimal
}
