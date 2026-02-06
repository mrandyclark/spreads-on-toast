'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTeamsByConference, getTeamsFromPicks } from '@/lib/sheet-utils';
import { cn } from '@/lib/utils';
import { PostseasonPicks, Team, TeamPick } from '@/types';

const MAX_PICKS = 5;

interface MlbPostseasonPicksProps {
  initialPicks?: PostseasonPicks;
  onPicksChange?: (picks: PostseasonPicks) => void;
  teamPicks: TeamPick[];
}

export function MlbPostseasonPicks({ initialPicks, onPicksChange, teamPicks }: MlbPostseasonPicksProps) {
  const [alPicks, setAlPicks] = useState<string[]>(initialPicks?.al ?? []);
  const [nlPicks, setNlPicks] = useState<string[]>(initialPicks?.nl ?? []);

  const teams = getTeamsFromPicks(teamPicks);
  const { al: alTeams, nl: nlTeams } = getTeamsByConference(teamPicks);

  const togglePick = (teamId: string, league: 'AL' | 'NL') => {
    let newAlPicks = alPicks;
    let newNlPicks = nlPicks;

    if (league === 'AL') {
      if (alPicks.includes(teamId)) {
        newAlPicks = alPicks.filter((id) => id !== teamId);
      } else if (alPicks.length < MAX_PICKS) {
        newAlPicks = [...alPicks, teamId];
      }

      setAlPicks(newAlPicks);
    } else {
      if (nlPicks.includes(teamId)) {
        newNlPicks = nlPicks.filter((id) => id !== teamId);
      } else if (nlPicks.length < MAX_PICKS) {
        newNlPicks = [...nlPicks, teamId];
      }

      setNlPicks(newNlPicks);
    }

    onPicksChange?.({ al: newAlPicks, nl: newNlPicks });
  };

  const getTeamById = (id: string) => teams.find((t) => t.id === id);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">American League</CardTitle>
              <CardDescription>Pick 5 playoff teams</CardDescription>
            </div>
            <Badge variant={alPicks.length === MAX_PICKS ? 'default' : 'outline'}>
              {alPicks.length}/{MAX_PICKS}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {alTeams.map((team) => {
              const isSelected = alPicks.includes(team.id);
              const isDisabled = !isSelected && alPicks.length >= MAX_PICKS;
              return (
                <button
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50',
                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  )}
                  disabled={isDisabled}
                  key={team.id}
                  onClick={() => togglePick(team.id, 'AL')}
                >
                  {team.abbreviation}
                </button>
              );
            })}
          </div>
          {alPicks.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Your picks:</p>
              <div className="flex flex-wrap gap-1.5">
                {alPicks
                  .map((id) => getTeamById(id))
                  .filter(Boolean)
                  .sort((a, b) => a!.abbreviation.localeCompare(b!.abbreviation))
                  .map((team) => (
                    <Badge key={team!.id} variant="secondary">
                      {team!.abbreviation}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">National League</CardTitle>
              <CardDescription>Pick 5 playoff teams</CardDescription>
            </div>
            <Badge variant={nlPicks.length === MAX_PICKS ? 'default' : 'outline'}>
              {nlPicks.length}/{MAX_PICKS}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {nlTeams.map((team) => {
              const isSelected = nlPicks.includes(team.id);
              const isDisabled = !isSelected && nlPicks.length >= MAX_PICKS;
              return (
                <button
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    isSelected
                      ? 'border-blue-800 bg-blue-800/90 text-white'
                      : 'border-border bg-card hover:border-blue-400/50 hover:bg-muted/50',
                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  )}
                  disabled={isDisabled}
                  key={team.id}
                  onClick={() => togglePick(team.id, 'NL')}
                >
                  {team.abbreviation}
                </button>
              );
            })}
          </div>
          {nlPicks.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Your picks:</p>
              <div className="flex flex-wrap gap-1.5">
                {nlPicks
                  .map((id) => getTeamById(id))
                  .filter(Boolean)
                  .sort((a, b) => a!.abbreviation.localeCompare(b!.abbreviation))
                  .map((team) => (
                    <Badge key={team!.id} variant="secondary">
                      {team!.abbreviation}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
