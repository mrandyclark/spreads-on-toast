'use client';

import { Trophy } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Conference, Team, TeamPick, WorldSeriesPicks } from '@/types';

interface MlbWorldSeriesPicksProps {
  initialPicks?: WorldSeriesPicks;
  onPicksChange?: (picks: WorldSeriesPicks) => void;
  teamPicks: TeamPick[];
}

export function MlbWorldSeriesPicks({ initialPicks, onPicksChange, teamPicks }: MlbWorldSeriesPicksProps) {
  const [alChampion, setAlChampion] = useState<string>(initialPicks?.alChampion ?? '');
  const [nlChampion, setNlChampion] = useState<string>(initialPicks?.nlChampion ?? '');
  const [winner, setWinner] = useState<Conference | undefined>(initialPicks?.winner);

  // Build team lists from populated teamPicks
  const teams = teamPicks
    .map((tp) => (typeof tp.team === 'object' ? (tp.team as Team) : null))
    .filter(Boolean) as Team[];

  const getFullTeamName = (team: Team) => `${team.city} ${team.name}`;

  const alTeams = teams
    .filter((t) => t.conference === Conference.AL)
    .sort((a, b) => getFullTeamName(a).localeCompare(getFullTeamName(b)));
  const nlTeams = teams
    .filter((t) => t.conference === Conference.NL)
    .sort((a, b) => getFullTeamName(a).localeCompare(getFullTeamName(b)));

  const alTeam = alTeams.find((t) => t.id === alChampion);
  const nlTeam = nlTeams.find((t) => t.id === nlChampion);

  const handleAlChange = (value: string) => {
    setAlChampion(value);
    onPicksChange?.({ alChampion: value, nlChampion, winner });
  };

  const handleNlChange = (value: string) => {
    setNlChampion(value);
    onPicksChange?.({ alChampion, nlChampion: value, winner });
  };

  const handleWinnerChange = (value: Conference) => {
    setWinner(value);
    onPicksChange?.({ alChampion, nlChampion, winner: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          World Series Prediction
        </CardTitle>
        <CardDescription>Pick one team from each league to face off in the World Series</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm font-medium">American League Champion</label>
            <Select onValueChange={handleAlChange} value={alChampion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select AL champion" />
              </SelectTrigger>
              <SelectContent>
                {alTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <span className="flex items-center gap-2">
                      <Badge className="text-xs" variant="outline">
                        {team.abbreviation}
                      </Badge>
                      {getFullTeamName(team)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">National League Champion</label>
            <Select onValueChange={handleNlChange} value={nlChampion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select NL champion" />
              </SelectTrigger>
              <SelectContent>
                {nlTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <span className="flex items-center gap-2">
                      <Badge className="text-xs" variant="outline">
                        {team.abbreviation}
                      </Badge>
                      {getFullTeamName(team)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(alChampion || nlChampion) && (
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-6">
            <p className="mb-4 text-center text-sm font-medium text-muted-foreground">Your World Series Matchup</p>
            <div className="flex items-center justify-center gap-4">
              <button
                className={`rounded-lg px-6 py-4 text-center transition-all ${
                  !alChampion
                    ? 'border-2 border-dashed border-border bg-background'
                    : winner === Conference.AL
                      ? 'ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground'
                      : 'bg-primary/70 text-primary-foreground hover:bg-primary'
                } ${alChampion && nlChampion ? 'cursor-pointer' : ''}`}
                disabled={!alChampion || !nlChampion}
                onClick={() => alChampion && nlChampion && handleWinnerChange(Conference.AL)}
                type="button"
              >
                {alTeam ? (
                  <>
                    <p className="text-2xl font-bold">{alTeam.abbreviation}</p>
                    <p className="text-xs opacity-80">AL Champion</p>
                    {winner === Conference.AL && <p className="mt-1 text-xs font-semibold">🏆 Winner</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Select AL</p>
                )}
              </button>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-muted-foreground">vs</span>
                <Trophy className="mt-1 h-5 w-5 text-primary" />
              </div>
              <button
                className={`rounded-lg px-6 py-4 text-center transition-all ${
                  !nlChampion
                    ? 'border-2 border-dashed border-border bg-background'
                    : winner === Conference.NL
                      ? 'ring-2 ring-blue-800 ring-offset-2 bg-blue-800 text-white'
                      : 'bg-blue-800/70 text-white hover:bg-blue-800'
                } ${alChampion && nlChampion ? 'cursor-pointer' : ''}`}
                disabled={!alChampion || !nlChampion}
                onClick={() => alChampion && nlChampion && handleWinnerChange(Conference.NL)}
                type="button"
              >
                {nlTeam ? (
                  <>
                    <p className="text-2xl font-bold">{nlTeam.abbreviation}</p>
                    <p className="text-xs opacity-80">NL Champion</p>
                    {winner === Conference.NL && <p className="mt-1 text-xs font-semibold">🏆 Winner</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Select NL</p>
                )}
              </button>
            </div>
            {alChampion && nlChampion && !winner && (
              <p className="mt-4 text-center text-sm text-muted-foreground">Click a team above to pick the World Series champion</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
