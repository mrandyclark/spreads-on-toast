'use client';

import { Trophy } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AL_TEAMS = [
  { abbr: 'NYY', id: 'nyy', name: 'New York Yankees' },
  { abbr: 'BOS', id: 'bos', name: 'Boston Red Sox' },
  { abbr: 'TOR', id: 'tor', name: 'Toronto Blue Jays' },
  { abbr: 'BAL', id: 'bal', name: 'Baltimore Orioles' },
  { abbr: 'TB', id: 'tb', name: 'Tampa Bay Rays' },
  { abbr: 'CLE', id: 'cle', name: 'Cleveland Guardians' },
  { abbr: 'MIN', id: 'min', name: 'Minnesota Twins' },
  { abbr: 'DET', id: 'det', name: 'Detroit Tigers' },
  { abbr: 'CWS', id: 'cws', name: 'Chicago White Sox' },
  { abbr: 'KC', id: 'kc', name: 'Kansas City Royals' },
  { abbr: 'HOU', id: 'hou', name: 'Houston Astros' },
  { abbr: 'TEX', id: 'tex', name: 'Texas Rangers' },
  { abbr: 'SEA', id: 'sea', name: 'Seattle Mariners' },
  { abbr: 'LAA', id: 'laa', name: 'Los Angeles Angels' },
  { abbr: 'OAK', id: 'oak', name: 'Oakland Athletics' },
];

const NL_TEAMS = [
  { abbr: 'LAD', id: 'lad', name: 'Los Angeles Dodgers' },
  { abbr: 'SF', id: 'sf', name: 'San Francisco Giants' },
  { abbr: 'SD', id: 'sd', name: 'San Diego Padres' },
  { abbr: 'ARI', id: 'ari', name: 'Arizona Diamondbacks' },
  { abbr: 'COL', id: 'col', name: 'Colorado Rockies' },
  { abbr: 'ATL', id: 'atl', name: 'Atlanta Braves' },
  { abbr: 'PHI', id: 'phi', name: 'Philadelphia Phillies' },
  { abbr: 'NYM', id: 'nym', name: 'New York Mets' },
  { abbr: 'MIA', id: 'mia', name: 'Miami Marlins' },
  { abbr: 'WSH', id: 'wsh', name: 'Washington Nationals' },
  { abbr: 'MIL', id: 'mil', name: 'Milwaukee Brewers' },
  { abbr: 'CHC', id: 'chc', name: 'Chicago Cubs' },
  { abbr: 'CIN', id: 'cin', name: 'Cincinnati Reds' },
  { abbr: 'STL', id: 'stl', name: 'St. Louis Cardinals' },
  { abbr: 'PIT', id: 'pit', name: 'Pittsburgh Pirates' },
];

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
                        {team.abbr}
                      </Badge>
                      {team.name}
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
                        {team.abbr}
                      </Badge>
                      {team.name}
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
                    <p className="text-2xl font-bold">{alTeam.abbr}</p>
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
                    <p className="text-2xl font-bold">{nlTeam.abbr}</p>
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
