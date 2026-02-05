'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getFullTeamName, getLineForTeam, MLB_TEAMS } from '@/static-data';
import { Conference } from '@/types';

type Pick = 'over' | 'under' | null;

// Combine team data with lines for display
const TEAMS_WITH_LINES = MLB_TEAMS.map((team) => ({
  ...team,
  fullName: getFullTeamName(team),
  line: getLineForTeam(team.id) ?? 0,
}));

export function TeamPicksSection() {
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLeague, setFilterLeague] = useState<'AL' | 'NL' | 'all'>('all');

  const handlePickChange = (teamId: string, pick: Pick) => {
    setPicks((prev) => ({ ...prev, [teamId]: pick }));
  };

  const filteredTeams = TEAMS_WITH_LINES.filter((team) => {
    const matchesSearch =
      team.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConference = filterLeague === 'all' || team.conference === filterLeague;
    return matchesSearch && matchesConference;
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
            {pickedCount}/{TEAMS_WITH_LINES.length} picked
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
                  className={`w-12 justify-center ${team.conference === Conference.AL ? 'border-primary/30 bg-primary/5' : 'border-accent bg-accent/30'}`}
                  variant="outline"
                >
                  {team.abbreviation}
                </Badge>
                <div>
                  <p className="font-medium">{team.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {team.conference} {team.division.replace('_', ' ').replace('AL ', '').replace('NL ', '')}
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
