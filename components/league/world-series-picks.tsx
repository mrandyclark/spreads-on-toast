'use client';

import { Trophy } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AL_TEAMS, getFullTeamName, getTeamById, NL_TEAMS } from '@/static-data';

export function WorldSeriesPicks() {
  const [alChampion, setAlChampion] = useState<string>('');
  const [nlChampion, setNlChampion] = useState<string>('');

  const alTeam = AL_TEAMS.find((t) => t.id === alChampion);
  const nlTeam = NL_TEAMS.find((t) => t.id === nlChampion);

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
            <Select onValueChange={setAlChampion} value={alChampion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select AL champion" />
              </SelectTrigger>
              <SelectContent>
                {AL_TEAMS.map((team) => (
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
            <Select onValueChange={setNlChampion} value={nlChampion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select NL champion" />
              </SelectTrigger>
              <SelectContent>
                {NL_TEAMS.map((team) => (
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
              <div
                className={`rounded-lg px-6 py-4 text-center transition-all ${alChampion ? 'bg-primary text-primary-foreground' : 'border-2 border-dashed border-border bg-background'}`}
              >
                {alTeam ? (
                  <>
                    <p className="text-2xl font-bold">{alTeam.abbreviation}</p>
                    <p className="text-xs opacity-80">AL Champion</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Select AL</p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-muted-foreground">vs</span>
                <Trophy className="mt-1 h-5 w-5 text-primary" />
              </div>
              <div
                className={`rounded-lg px-6 py-4 text-center transition-all ${nlChampion ? 'bg-primary text-primary-foreground' : 'border-2 border-dashed border-border bg-background'}`}
              >
                {nlTeam ? (
                  <>
                    <p className="text-2xl font-bold">{nlTeam.abbreviation}</p>
                    <p className="text-xs opacity-80">NL Champion</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Select NL</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
