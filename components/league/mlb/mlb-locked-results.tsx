'use client';

import { Check, Minus, Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getResultsAction, GroupResults, TeamPickResult } from '@/app/(logged-in)/league/[id]/actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Conference, Sheet, Team } from '@/types';

interface MlbLockedResultsProps {
  groupId: string;
  selectedDate?: string; // YYYY-MM-DD format for historical lookup
  sheet: Sheet;
  userId: string;
}

function ResultIcon({ result }: { result: 'loss' | 'pending' | 'push' | 'win' }) {
  switch (result) {
    case 'win':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'loss':
      return <X className="h-4 w-4 text-red-500" />;
    case 'push':
      return <Minus className="h-4 w-4 text-yellow-500" />;
    default:
      return null;
  }
}

function getResultBorderClass(result: 'loss' | 'pending' | 'push' | 'win') {
  switch (result) {
    case 'win':
      return 'border-green-500/50 bg-green-500/5';
    case 'loss':
      return 'border-red-500/50 bg-red-500/5';
    case 'push':
      return 'border-yellow-500/50 bg-yellow-500/5';
    default:
      return 'border-border';
  }
}

export function MlbLockedResults({ groupId, selectedDate, sheet, userId }: MlbLockedResultsProps) {
  const [results, setResults] = useState<GroupResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      setIsLoading(true);

      try {
        const result = await getResultsAction(groupId, userId, selectedDate);

        if (result.results) {
          setResults(result.results);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
  }, [groupId, userId, selectedDate]);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading results...</div>;
  }

  // Get postseason picks from sheet
  const alPostseasonTeams = (sheet.postseasonPicks?.al ?? [])
    .map((id) => sheet.teamPicks.find((tp) => (typeof tp.team === 'object' ? tp.team.id : tp.team) === id)?.team)
    .filter((t): t is Team => typeof t === 'object');

  const nlPostseasonTeams = (sheet.postseasonPicks?.nl ?? [])
    .map((id) => sheet.teamPicks.find((tp) => (typeof tp.team === 'object' ? tp.team.id : tp.team) === id)?.team)
    .filter((t): t is Team => typeof t === 'object');

  // Get World Series picks
  const alChampion = sheet.teamPicks.find(
    (tp) => (typeof tp.team === 'object' ? tp.team.id : tp.team) === sheet.worldSeriesPicks?.alChampion,
  )?.team as Team | undefined;

  const nlChampion = sheet.teamPicks.find(
    (tp) => (typeof tp.team === 'object' ? tp.team.id : tp.team) === sheet.worldSeriesPicks?.nlChampion,
  )?.team as Team | undefined;

  const wsWinner = sheet.worldSeriesPicks?.winner;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Picks</h2>
        {results && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-500">{results.summary.wins}W</span>
            <span className="text-red-500">{results.summary.losses}L</span>
            {results.summary.pushes > 0 && <span className="text-yellow-500">{results.summary.pushes}P</span>}
            <span className="text-muted-foreground">
              ({Math.round((results.summary.wins / results.summary.total) * 100)}%)
            </span>
          </div>
        )}
      </div>

      <Tabs className="w-full" defaultValue="teams">
        <TabsList className="mb-4">
          <TabsTrigger value="teams">Team Picks ({results?.summary.total ?? 0})</TabsTrigger>
          <TabsTrigger value="postseason">Postseason</TabsTrigger>
          <TabsTrigger value="worldseries">World Series</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <Card>
            <CardContent className="p-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Your locked win total picks for the season. Final results based on end-of-season standings.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results?.picks.map((pick: TeamPickResult) => (
                  <div
                    className={`rounded-lg border p-3 ${getResultBorderClass(pick.result)}`}
                    key={pick.team.id}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ResultIcon result={pick.result} />
                        <span className="font-semibold">{pick.team.abbreviation}</span>
                      </div>
                      <Badge variant={pick.pick === 'over' ? 'default' : 'secondary'}>{pick.pick.toUpperCase()}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      {selectedDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Wins:</span>
                          <span className="font-medium">{pick.actualWins}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{selectedDate ? 'Estimated:' : 'Final:'}</span>
                        <span className="font-medium">{pick.projectedWins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Line:</span>
                        <span className="font-medium">{pick.line}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="postseason">
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 font-medium">American League</h4>
                  <div className="flex flex-wrap gap-2">
                    {alPostseasonTeams.length > 0 ? (
                      alPostseasonTeams.map((team) => (
                        <Badge className="border-red-500/30 bg-red-500/10 px-3 py-1 text-red-700 dark:text-red-400" key={team.id} variant="outline">
                          {team.abbreviation}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No picks</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 font-medium">National League</h4>
                  <div className="flex flex-wrap gap-2">
                    {nlPostseasonTeams.length > 0 ? (
                      nlPostseasonTeams.map((team) => (
                        <Badge className="border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-700 dark:text-blue-400" key={team.id} variant="outline">
                          {team.abbreviation}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No picks</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worldseries">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-center">
              <div
                className={`flex items-center gap-3 rounded-lg px-4 py-3 ${wsWinner === Conference.AL ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'}`}
              >
                <Badge className="bg-primary">{alChampion?.abbreviation ?? '???'}</Badge>
                <span className="text-sm text-muted-foreground">AL Champion</span>
              </div>
              <Trophy className="h-6 w-6 text-primary" />
              <div
                className={`flex items-center gap-3 rounded-lg px-4 py-3 ${wsWinner === Conference.NL ? 'bg-blue-800/20 ring-2 ring-blue-800' : 'bg-muted'}`}
              >
                <Badge className="bg-blue-800">{nlChampion?.abbreviation ?? '???'}</Badge>
                <span className="text-sm text-muted-foreground">NL Champion</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

