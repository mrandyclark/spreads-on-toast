'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

const MAX_PICKS = 5;

export function PostseasonPicks() {
  const [alPicks, setAlPicks] = useState<string[]>([]);
  const [nlPicks, setNlPicks] = useState<string[]>([]);

  const togglePick = (teamId: string, league: 'AL' | 'NL') => {
    if (league === 'AL') {
      if (alPicks.includes(teamId)) {
        setAlPicks(alPicks.filter((id) => id !== teamId));
      } else if (alPicks.length < MAX_PICKS) {
        setAlPicks([...alPicks, teamId]);
      }
    } else {
      if (nlPicks.includes(teamId)) {
        setNlPicks(nlPicks.filter((id) => id !== teamId));
      } else if (nlPicks.length < MAX_PICKS) {
        setNlPicks([...nlPicks, teamId]);
      }
    }
  };

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
            {AL_TEAMS.map((team) => {
              const isSelected = alPicks.includes(team.id);
              const isDisabled = !isSelected && alPicks.length >= MAX_PICKS;
              return (
                <button
                  className={`
                    relative flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                    }
                    ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                  disabled={isDisabled}
                  key={team.id}
                  onClick={() => togglePick(team.id, 'AL')}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  {team.abbr}
                </button>
              );
            })}
          </div>
          {alPicks.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Your picks:</p>
              <div className="flex flex-wrap gap-1.5">
                {alPicks.map((id) => {
                  const team = AL_TEAMS.find((t) => t.id === id);
                  return (
                    <Badge key={id} variant="secondary">
                      {team?.abbr}
                    </Badge>
                  );
                })}
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
            {NL_TEAMS.map((team) => {
              const isSelected = nlPicks.includes(team.id);
              const isDisabled = !isSelected && nlPicks.length >= MAX_PICKS;
              return (
                <button
                  className={`
                    relative flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                    }
                    ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                  disabled={isDisabled}
                  key={team.id}
                  onClick={() => togglePick(team.id, 'NL')}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  {team.abbr}
                </button>
              );
            })}
          </div>
          {nlPicks.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Your picks:</p>
              <div className="flex flex-wrap gap-1.5">
                {nlPicks.map((id) => {
                  const team = NL_TEAMS.find((t) => t.id === id);
                  return (
                    <Badge key={id} variant="secondary">
                      {team?.abbr}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
