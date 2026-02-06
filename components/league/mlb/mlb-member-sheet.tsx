'use client';

import { Check, Minus, Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { GroupResults, TeamPickResult } from '@/app/api/groups/[id]/results/route';
import { Badge } from '@/components/ui/badge';
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Conference, Sheet, Team } from '@/types';

interface MlbMemberSheetProps {
  groupId: string;
  isCurrentUser: boolean;
  memberInitials: string;
  memberName: string;
  selectedDate?: string;
  userId: string;
}

function ResultIcon({ result }: { result: 'loss' | 'pending' | 'push' | 'win' }) {
  switch (result) {
    case 'win':
      return <Check className="h-3 w-3 text-green-500" />;
    case 'loss':
      return <X className="h-3 w-3 text-red-500" />;
    case 'push':
      return <Minus className="h-3 w-3 text-yellow-500" />;
    default:
      return null;
  }
}

function getResultBgClass(result: 'loss' | 'pending' | 'push' | 'win') {
  switch (result) {
    case 'win':
      return 'bg-green-500/10';
    case 'loss':
      return 'bg-red-500/10';
    case 'push':
      return 'bg-yellow-500/10';
    default:
      return '';
  }
}

export function MlbMemberSheet({ groupId, isCurrentUser, memberInitials, memberName, selectedDate, userId }: MlbMemberSheetProps) {
  const [results, setResults] = useState<GroupResults | null>(null);
  const [sheet, setSheet] = useState<null | Sheet>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      try {
        const dateParam = selectedDate ? `&date=${selectedDate}` : '';
        const [resultsRes, sheetRes] = await Promise.all([
          fetch(`/api/groups/${groupId}/results?userId=${userId}${dateParam}`),
          fetch(`/api/groups/${groupId}/sheet?userId=${userId}`),
        ]);

        if (resultsRes.ok) {
          const data = await resultsRes.json();
          setResults(data);
        }

        if (sheetRes.ok) {
          const data = await sheetRes.json();
          setSheet(data);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [groupId, userId, selectedDate]);

  // Get postseason picks from sheet
  const alPostseasonTeams = sheet
    ? (sheet.postseasonPicks?.al ?? [])
        .map((id) => sheet.teamPicks.find((tp) => (typeof tp.team === 'object' ? tp.team.id : tp.team) === id)?.team)
        .filter((t): t is Team => typeof t === 'object')
    : [];

  const nlPostseasonTeams = sheet
    ? (sheet.postseasonPicks?.nl ?? [])
        .map((id) => sheet.teamPicks.find((tp) => (typeof tp.team === 'object' ? tp.team.id : tp.team) === id)?.team)
        .filter((t): t is Team => typeof t === 'object')
    : [];

  // Get World Series picks
  const alChampion = sheet?.teamPicks.find(
    (tp) => (typeof tp.team === 'object' ? tp.team.id : tp.team) === sheet?.worldSeriesPicks?.alChampion,
  )?.team as Team | undefined;

  const nlChampion = sheet?.teamPicks.find(
    (tp) => (typeof tp.team === 'object' ? tp.team.id : tp.team) === sheet?.worldSeriesPicks?.nlChampion,
  )?.team as Team | undefined;

  const wsWinner = sheet?.worldSeriesPicks?.winner;

  return (
    <SheetContent className="overflow-y-auto sm:max-w-lg">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            {memberInitials}
          </div>
          <span>{memberName}{isCurrentUser ? '' : "'s"} Picks</span>
        </SheetTitle>
        {results && (
          <SheetDescription>
            <span className="text-green-500">{results.summary.wins}W</span>
            {' · '}
            <span className="text-red-500">{results.summary.losses}L</span>
            {results.summary.pushes > 0 && (
              <>
                {' · '}
                <span className="text-yellow-500">{results.summary.pushes}P</span>
              </>
            )}
            {' · '}
            {Math.round((results.summary.wins / results.summary.total) * 100)}% correct
          </SheetDescription>
        )}
      </SheetHeader>

      {isLoading ? (
        <div className="mt-6 text-sm text-muted-foreground">Loading picks...</div>
      ) : (
        <div className="mt-6">
          <Tabs className="w-full" defaultValue="teams">
            <TabsList className="mb-4 w-full">
              <TabsTrigger className="flex-1" value="teams">Teams</TabsTrigger>
              <TabsTrigger className="flex-1" value="postseason">Postseason</TabsTrigger>
              <TabsTrigger className="flex-1" value="ws">World Series</TabsTrigger>
            </TabsList>

            <TabsContent value="teams">
              <div className="grid gap-2 sm:grid-cols-2">
                {results?.picks.map((pick: TeamPickResult) => (
                  <div
                    className={`rounded-lg border p-2.5 ${getResultBgClass(pick.result)}`}
                    key={pick.team.id}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ResultIcon result={pick.result} />
                        <span className="text-sm font-semibold">{pick.team.abbreviation}</span>
                      </div>
                      <Badge className="text-xs" variant={pick.pick === 'over' ? 'default' : 'secondary'}>
                        {pick.pick.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-0.5 text-xs">
                      {pick.actualWins !== undefined && pick.actualWins !== pick.projectedWins && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Wins:</span>
                          <span>{pick.actualWins}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{pick.gamesPlayed === 162 ? 'Final:' : 'Estimated:'}</span>
                        <span>{pick.projectedWins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Line:</span>
                        <span>{pick.line}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="postseason">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">American League</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {alPostseasonTeams.length > 0 ? (
                      alPostseasonTeams.map((team) => (
                        <Badge className="border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-400" key={team.id} variant="outline">
                          {team.abbreviation}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No picks</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">National League</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {nlPostseasonTeams.length > 0 ? (
                      nlPostseasonTeams.map((team) => (
                        <Badge className="border-blue-500/30 bg-blue-500/10 text-xs text-blue-700 dark:text-blue-400" key={team.id} variant="outline">
                          {team.abbreviation}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No picks</span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ws">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-lg px-4 py-3 text-center ${wsWinner === Conference.AL ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'}`}
                  >
                    <Badge className="bg-primary">{alChampion?.abbreviation ?? '???'}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">AL Champion</p>
                  </div>
                  <Trophy className="h-5 w-5 text-primary" />
                  <div
                    className={`rounded-lg px-4 py-3 text-center ${wsWinner === Conference.NL ? 'bg-blue-800/20 ring-2 ring-blue-800' : 'bg-muted'}`}
                  >
                    <Badge className="bg-blue-800">{nlChampion?.abbreviation ?? '???'}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">NL Champion</p>
                  </div>
                </div>
                {wsWinner && (
                  <p className="text-sm text-muted-foreground">
                    Picked <span className="font-medium text-foreground">{wsWinner === Conference.AL ? alChampion?.abbreviation : nlChampion?.abbreviation}</span> to win
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </SheetContent>
  );
}
