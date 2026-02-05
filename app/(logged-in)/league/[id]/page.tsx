'use client';

import { ArrowLeft, Calendar, ChevronRight, Crown, Lock, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PostseasonPicks } from '@/components/league/postseason-picks';
import { StandingsChart } from '@/components/league/standings-chart';
import { TeamPicksSection } from '@/components/league/team-picks-section';
import { WorldSeriesPicks } from '@/components/league/world-series-picks';
import { ToastIcon } from '@/components/toast-icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LEAGUE_DATA = {
  id: 'mlb-2024',
  isLocked: false,
  lockDate: new Date('2024-03-28T12:00:00'),
  memberCount: 6,
  name: 'Toast Masters MLB',
  season: '2024',
  sport: 'MLB',
};

const MEMBERS = [
  { avatar: 'MT', correctPicks: 18, id: '1', name: 'Mike T.', rank: 1, totalPicks: 30, trend: 'up' },
  { avatar: 'SK', correctPicks: 16, id: '2', name: 'Sarah K.', rank: 2, totalPicks: 30, trend: 'same' },
  { avatar: 'YO', correctPicks: 15, id: '3', isCurrentUser: true, name: 'You', rank: 3, totalPicks: 30, trend: 'down' },
  { avatar: 'JL', correctPicks: 14, id: '4', name: 'Jake L.', rank: 4, totalPicks: 30, trend: 'up' },
  { avatar: 'ER', correctPicks: 12, id: '5', name: 'Emma R.', rank: 5, totalPicks: 30, trend: 'down' },
  { avatar: 'CP', correctPicks: 10, id: '6', name: 'Chris P.', rank: 6, totalPicks: 30, trend: 'same' },
];

const MOCK_PLAYER_PICKS = {
  postseasonAL: ['NYY', 'HOU', 'TEX', 'BAL', 'MIN'],
  postseasonNL: ['LAD', 'ATL', 'PHI', 'MIL', 'ARI'],
  teamPicks: [
    { line: 91.5, pick: 'over', team: 'NYY' },
    { line: 96.5, pick: 'over', team: 'LAD' },
    { line: 92.5, pick: 'under', team: 'ATL' },
    { line: 89.5, pick: 'over', team: 'HOU' },
    { line: 88.5, pick: 'over', team: 'PHI' },
  ],
  worldSeriesAL: 'NYY',
  worldSeriesNL: 'LAD',
};

export default function LeagueDetailPage() {
  const [isLocked, setIsLocked] = useState(LEAGUE_DATA.isLocked);
  const [selectedPlayer, setSelectedPlayer] = useState<(typeof MEMBERS)[0] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const daysUntilLock = Math.max(0, Math.ceil((LEAGUE_DATA.lockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              href="/dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Leagues</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <ToastIcon className="h-6 w-6 text-primary" />
              <span className="font-semibold">{LEAGUE_DATA.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="hidden sm:flex" variant="secondary">
              {LEAGUE_DATA.sport} {LEAGUE_DATA.season}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{LEAGUE_DATA.memberCount}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Card className={`mb-8 ${isLocked ? 'border-primary/30 bg-primary/5' : 'border-accent bg-accent/20'}`}>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {isLocked ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Picks are locked</p>
                    <p className="text-sm text-muted-foreground">Season is in progress. Track your standings below.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <Calendar className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{daysUntilLock} days until picks lock</p>
                    <p className="text-sm text-muted-foreground">
                      Locks on{' '}
                      {LEAGUE_DATA.lockDate.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        weekday: 'long',
                      })}
                    </p>
                  </div>
                </>
              )}
            </div>
            <Button className="shrink-0" onClick={() => setIsLocked(!isLocked)} size="sm" variant="outline">
              Demo: Toggle Lock State
            </Button>
          </CardContent>
        </Card>

        {isLocked ? (
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-xl font-semibold">Standings</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {MEMBERS.map((member, index) => (
                      <button
                        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
                        key={member.id}
                        onClick={() => {
                          setSelectedPlayer(member);
                          setSheetOpen(true);
                        }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index === 0 ? (
                            <Crown className="h-4 w-4 text-primary" />
                          ) : (
                            <span className="text-muted-foreground">{member.rank}</span>
                          )}
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-border">
                          <AvatarFallback className={member.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            {member.isCurrentUser && (
                              <Badge className="text-xs" variant="outline">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {member.correctPicks}/{member.totalPicks} correct
                            </span>
                            <span className="text-xs">({Math.round((member.correctPicks / member.totalPicks) * 100)}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress className="hidden h-2 w-20 sm:block" value={(member.correctPicks / member.totalPicks) * 100} />
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">Season Progress</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <StandingsChart members={MEMBERS} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pick Distribution</CardTitle>
                    <CardDescription>How the league picked</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>Over picks</span>
                          <span className="text-muted-foreground">58%</span>
                        </div>
                        <Progress className="h-3" value={58} />
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>Under picks</span>
                          <span className="text-muted-foreground">42%</span>
                        </div>
                        <Progress className="h-3" value={42} />
                      </div>
                      <div className="mt-6 rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">
                          Most picked over: <span className="font-medium text-foreground">LAD (5/6)</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Most picked under: <span className="font-medium text-foreground">OAK (6/6)</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">Your Picks</h2>
              <Tabs className="w-full" defaultValue="teams">
                <TabsList className="mb-4">
                  <TabsTrigger value="teams">Team Picks</TabsTrigger>
                  <TabsTrigger value="postseason">Postseason</TabsTrigger>
                  <TabsTrigger value="worldseries">World Series</TabsTrigger>
                </TabsList>
                <TabsContent value="teams">
                  <Card>
                    <CardContent className="p-4">
                      <p className="mb-4 text-sm text-muted-foreground">Your locked win total picks for the season.</p>
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {MOCK_PLAYER_PICKS.teamPicks.map((pick) => (
                          <div
                            className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                            key={pick.team}
                          >
                            <span className="font-medium">{pick.team}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{pick.line}</span>
                              <Badge variant={pick.pick === 'over' ? 'default' : 'secondary'}>{pick.pick}</Badge>
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
                            {MOCK_PLAYER_PICKS.postseasonAL.map((team) => (
                              <Badge className="px-3 py-1" key={team} variant="outline">
                                {team}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-3 font-medium">National League</h4>
                          <div className="flex flex-wrap gap-2">
                            {MOCK_PLAYER_PICKS.postseasonNL.map((team) => (
                              <Badge className="px-3 py-1" key={team} variant="outline">
                                {team}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="worldseries">
                  <Card>
                    <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-center">
                      <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
                        <Badge className="bg-primary">{MOCK_PLAYER_PICKS.worldSeriesAL}</Badge>
                        <span className="text-sm text-muted-foreground">AL Champion</span>
                      </div>
                      <Trophy className="h-6 w-6 text-primary" />
                      <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
                        <Badge className="bg-primary">{MOCK_PLAYER_PICKS.worldSeriesNL}</Badge>
                        <span className="text-sm text-muted-foreground">NL Champion</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Picks</h2>
                <Button size="sm">Save All Picks</Button>
              </div>

              <Tabs className="w-full" defaultValue="teams">
                <TabsList className="mb-6 w-full justify-start">
                  <TabsTrigger value="teams">Team Win Totals</TabsTrigger>
                  <TabsTrigger value="postseason">Postseason</TabsTrigger>
                  <TabsTrigger value="worldseries">World Series</TabsTrigger>
                </TabsList>

                <TabsContent value="teams">
                  <TeamPicksSection />
                </TabsContent>

                <TabsContent value="postseason">
                  <PostseasonPicks />
                </TabsContent>

                <TabsContent value="worldseries">
                  <WorldSeriesPicks />
                </TabsContent>
              </Tabs>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">League Members</h2>
              <Card>
                <CardContent className="p-4">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Other members{"'"} picks will be visible after the lock date.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {MEMBERS.map((member) => (
                      <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5" key={member.id}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback
                            className={member.isCurrentUser ? 'bg-primary text-xs text-primary-foreground' : 'bg-secondary text-xs'}
                          >
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                        {member.isCurrentUser && (
                          <Badge className="text-xs" variant="outline">
                            You
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </main>

      <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className={selectedPlayer?.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                  {selectedPlayer?.avatar}
                </AvatarFallback>
              </Avatar>
              <span>{selectedPlayer?.name}{"'"}s Picks</span>
            </SheetTitle>
            <SheetDescription>
              {selectedPlayer?.correctPicks}/{selectedPlayer?.totalPicks} correct picks (
              {selectedPlayer ? Math.round((selectedPlayer.correctPicks / selectedPlayer.totalPicks) * 100) : 0}%)
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">Team Picks</h4>
              <div className="space-y-2">
                {MOCK_PLAYER_PICKS.teamPicks.map((pick) => (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3" key={pick.team}>
                    <span className="font-medium">{pick.team}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{pick.line}</span>
                      <Badge variant={pick.pick === 'over' ? 'default' : 'secondary'}>{pick.pick}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">Postseason Picks</h4>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">American League</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MOCK_PLAYER_PICKS.postseasonAL.map((team) => (
                      <Badge className="text-xs" key={team} variant="outline">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">National League</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MOCK_PLAYER_PICKS.postseasonNL.map((team) => (
                      <Badge className="text-xs" key={team} variant="outline">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">World Series</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary">{MOCK_PLAYER_PICKS.worldSeriesAL}</Badge>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <Badge className="bg-primary">{MOCK_PLAYER_PICKS.worldSeriesNL}</Badge>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
