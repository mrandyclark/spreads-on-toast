'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const MLB_TEAMS = [
  { abbr: 'NYY', division: 'East', id: 'nyy', league: 'AL', line: 91.5, name: 'New York Yankees' },
  { abbr: 'BOS', division: 'East', id: 'bos', league: 'AL', line: 81.5, name: 'Boston Red Sox' },
  { abbr: 'TOR', division: 'East', id: 'tor', league: 'AL', line: 85.5, name: 'Toronto Blue Jays' },
  { abbr: 'BAL', division: 'East', id: 'bal', league: 'AL', line: 88.5, name: 'Baltimore Orioles' },
  { abbr: 'TB', division: 'East', id: 'tb', league: 'AL', line: 86.5, name: 'Tampa Bay Rays' },
  { abbr: 'CLE', division: 'Central', id: 'cle', league: 'AL', line: 82.5, name: 'Cleveland Guardians' },
  { abbr: 'MIN', division: 'Central', id: 'min', league: 'AL', line: 83.5, name: 'Minnesota Twins' },
  { abbr: 'DET', division: 'Central', id: 'det', league: 'AL', line: 74.5, name: 'Detroit Tigers' },
  { abbr: 'CWS', division: 'Central', id: 'cws', league: 'AL', line: 68.5, name: 'Chicago White Sox' },
  { abbr: 'KC', division: 'Central', id: 'kc', league: 'AL', line: 73.5, name: 'Kansas City Royals' },
  { abbr: 'HOU', division: 'West', id: 'hou', league: 'AL', line: 89.5, name: 'Houston Astros' },
  { abbr: 'TEX', division: 'West', id: 'tex', league: 'AL', line: 86.5, name: 'Texas Rangers' },
  { abbr: 'SEA', division: 'West', id: 'sea', league: 'AL', line: 84.5, name: 'Seattle Mariners' },
  { abbr: 'LAA', division: 'West', id: 'laa', league: 'AL', line: 76.5, name: 'Los Angeles Angels' },
  { abbr: 'OAK', division: 'West', id: 'oak', league: 'AL', line: 58.5, name: 'Oakland Athletics' },
  { abbr: 'LAD', division: 'West', id: 'lad', league: 'NL', line: 96.5, name: 'Los Angeles Dodgers' },
  { abbr: 'SF', division: 'West', id: 'sf', league: 'NL', line: 79.5, name: 'San Francisco Giants' },
  { abbr: 'SD', division: 'West', id: 'sd', league: 'NL', line: 85.5, name: 'San Diego Padres' },
  { abbr: 'ARI', division: 'West', id: 'ari', league: 'NL', line: 84.5, name: 'Arizona Diamondbacks' },
  { abbr: 'COL', division: 'West', id: 'col', league: 'NL', line: 62.5, name: 'Colorado Rockies' },
  { abbr: 'ATL', division: 'East', id: 'atl', league: 'NL', line: 92.5, name: 'Atlanta Braves' },
  { abbr: 'PHI', division: 'East', id: 'phi', league: 'NL', line: 88.5, name: 'Philadelphia Phillies' },
  { abbr: 'NYM', division: 'East', id: 'nym', league: 'NL', line: 84.5, name: 'New York Mets' },
  { abbr: 'MIA', division: 'East', id: 'mia', league: 'NL', line: 70.5, name: 'Miami Marlins' },
  { abbr: 'WSH', division: 'East', id: 'wsh', league: 'NL', line: 67.5, name: 'Washington Nationals' },
  { abbr: 'MIL', division: 'Central', id: 'mil', league: 'NL', line: 85.5, name: 'Milwaukee Brewers' },
  { abbr: 'CHC', division: 'Central', id: 'chc', league: 'NL', line: 81.5, name: 'Chicago Cubs' },
  { abbr: 'CIN', division: 'Central', id: 'cin', league: 'NL', line: 78.5, name: 'Cincinnati Reds' },
  { abbr: 'STL', division: 'Central', id: 'stl', league: 'NL', line: 79.5, name: 'St. Louis Cardinals' },
  { abbr: 'PIT', division: 'Central', id: 'pit', league: 'NL', line: 72.5, name: 'Pittsburgh Pirates' },
];

type Pick = 'over' | 'under' | null;

export function TeamPicksSection() {
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLeague, setFilterLeague] = useState<'AL' | 'NL' | 'all'>('all');

  const handlePickChange = (teamId: string, pick: Pick) => {
    setPicks((prev) => ({ ...prev, [teamId]: pick }));
  };

  const filteredTeams = MLB_TEAMS.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.abbr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLeague = filterLeague === 'all' || team.league === filterLeague;
    return matchesSearch && matchesLeague;
  });

  const pickedCount = Object.values(picks).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Team Win Totals</CardTitle>
            <CardDescription>Pick over or under for each team{"'"}s season win total</CardDescription>
          </div>
          <Badge className="w-fit" variant="outline">
            {pickedCount}/{MLB_TEAMS.length} picked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              value={searchQuery}
            />
          </div>
          <ToggleGroup
            className="justify-start"
            onValueChange={(v) => v && setFilterLeague(v as 'AL' | 'NL' | 'all')}
            type="single"
            value={filterLeague}
          >
            <ToggleGroupItem aria-label="All teams" value="all">
              All
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="American League" value="AL">
              AL
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="National League" value="NL">
              NL
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          {filteredTeams.map((team) => (
            <div
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
              key={team.id}
            >
              <div className="flex items-center gap-3">
                <Badge
                  className={`w-12 justify-center ${team.league === 'AL' ? 'border-primary/30 bg-primary/5' : 'border-accent bg-accent/30'}`}
                  variant="outline"
                >
                  {team.abbr}
                </Badge>
                <div>
                  <p className="font-medium">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {team.league} {team.division}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums text-muted-foreground">{team.line}</span>
                <ToggleGroup
                  className="gap-1"
                  onValueChange={(v) => handlePickChange(team.id, v as Pick)}
                  type="single"
                  value={picks[team.id] || ''}
                >
                  <ToggleGroupItem
                    aria-label={`Over ${team.line} wins`}
                    className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    value="over"
                  >
                    Over
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Under ${team.line} wins`}
                    className="h-8 px-3 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
                    value="under"
                  >
                    Under
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No teams found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
