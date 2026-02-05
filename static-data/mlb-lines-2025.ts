/**
 * MLB 2025 Season Win Total Lines
 * These are the over/under lines for each team's season win total
 * Source: Mock data for UI development
 */
export interface TeamLineData {
  line: number;
  teamId: string;
}

export const MLB_LINES_2025: TeamLineData[] = [
  // American League East
  { line: 91.5, teamId: 'nyy' },
  { line: 81.5, teamId: 'bos' },
  { line: 85.5, teamId: 'tor' },
  { line: 88.5, teamId: 'bal' },
  { line: 86.5, teamId: 'tb' },
  // American League Central
  { line: 82.5, teamId: 'cle' },
  { line: 83.5, teamId: 'min' },
  { line: 74.5, teamId: 'det' },
  { line: 68.5, teamId: 'cws' },
  { line: 73.5, teamId: 'kc' },
  // American League West
  { line: 89.5, teamId: 'hou' },
  { line: 86.5, teamId: 'tex' },
  { line: 84.5, teamId: 'sea' },
  { line: 76.5, teamId: 'laa' },
  { line: 58.5, teamId: 'oak' },
  // National League East
  { line: 92.5, teamId: 'atl' },
  { line: 88.5, teamId: 'phi' },
  { line: 84.5, teamId: 'nym' },
  { line: 70.5, teamId: 'mia' },
  { line: 67.5, teamId: 'wsh' },
  // National League Central
  { line: 85.5, teamId: 'mil' },
  { line: 81.5, teamId: 'chc' },
  { line: 78.5, teamId: 'cin' },
  { line: 79.5, teamId: 'stl' },
  { line: 72.5, teamId: 'pit' },
  // National League West
  { line: 96.5, teamId: 'lad' },
  { line: 79.5, teamId: 'sf' },
  { line: 85.5, teamId: 'sd' },
  { line: 84.5, teamId: 'ari' },
  { line: 62.5, teamId: 'col' },
];

/**
 * Get line for a team
 */
export function getLineForTeam(teamId: string): number | undefined {
  return MLB_LINES_2025.find((l) => l.teamId === teamId)?.line;
}
