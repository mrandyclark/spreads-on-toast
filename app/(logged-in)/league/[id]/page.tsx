'use client';

import { ArrowLeft, Calendar, CalendarDays, Lock, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getGroupAction, getSheetAction, savePicksAction } from './actions';

import { MlbLeaderboard, MlbLockedResults, MlbMemberSheet, MlbPicksForm, SelectedMember } from '@/components/league/mlb';
import { ToastIcon } from '@/components/toast-icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet as SheetUI } from '@/components/ui/sheet';
import { Group, PostseasonPicks, Sheet, WorldSeriesPicks } from '@/types';

export default function LeagueDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [sheet, setSheet] = useState<null | Sheet>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teamPicks, setTeamPicks] = useState<Record<string, 'over' | 'under' | null>>({});
  const [postseasonPicks, setPostseasonPicks] = useState<null | PostseasonPicks>(null);
  const [worldSeriesPicks, setWorldSeriesPicks] = useState<null | WorldSeriesPicks>(null);
  const [selectedMember, setSelectedMember] = useState<null | SelectedMember>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('[LeaguePage] Fetching data for group:', groupId);
        const [groupResult, sheetResult] = await Promise.all([
          getGroupAction(groupId),
          getSheetAction(groupId),
        ]);

        console.log('[LeaguePage] Group result:', groupResult);
        console.log('[LeaguePage] Sheet result:', sheetResult);

        if (groupResult.group) {
          setGroup(groupResult.group);
        } else if (groupResult.error) {
          console.error('[LeaguePage] Group error:', groupResult.error);
        }

        if (sheetResult.sheet) {
          setSheet(sheetResult.sheet);
        } else if (sheetResult.error) {
          console.error('[LeaguePage] Sheet error:', sheetResult.error);
        }
      } catch (error) {
        console.error('[LeaguePage] Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [groupId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Group not found</div>
      </div>
    );
  }

  const lockDate = new Date(group.lockDate);
  const isLocked = lockDate < new Date();
  const daysUntilLock = Math.max(0, Math.ceil((lockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleSavePicks = async () => {
    setIsSaving(true);

    try {
      const result = await savePicksAction(groupId, {
        postseasonPicks: postseasonPicks ?? undefined,
        teamPicks,
        worldSeriesPicks: worldSeriesPicks ?? undefined,
      });

      if (result.sheet) {
        setSheet(result.sheet);
      }
    } finally {
      setIsSaving(false);
    }
  };

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
              <span className="font-semibold">{group.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="hidden sm:flex" variant="secondary">
              {group.sport} {group.season}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{group.members.length}</span>
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
                      {lockDate.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        weekday: 'long',
                      })}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {isLocked ? (
          <div className="space-y-8">
            {/* Date picker for historical view */}
            {group.seasonStartDate && group.seasonEndDate && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">View as of:</span>
                </div>
                <input
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  max={new Date(group.seasonEndDate).toISOString().split('T')[0]}
                  min={new Date(group.seasonStartDate).toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value || undefined)}
                  type="date"
                  value={selectedDate ?? ''}
                />
                {selectedDate && (
                  <Button onClick={() => setSelectedDate(undefined)} size="sm" variant="ghost">
                    Show Final Results
                  </Button>
                )}
              </div>
            )}

            <MlbLeaderboard
              currentUserId="e8291a50-6e79-4842-b85d-dc5ba36fec80"
              groupId={groupId}
              onMemberSelect={(member) => {
                setSelectedMember(member);
                setSheetOpen(true);
              }}
              selectedDate={selectedDate}
            />

            {sheet && (
              <MlbLockedResults groupId={groupId} selectedDate={selectedDate} sheet={sheet} userId="e8291a50-6e79-4842-b85d-dc5ba36fec80" />
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Picks</h2>
                <Button disabled={isSaving} onClick={handleSavePicks} size="sm">
                  {isSaving ? 'Saving...' : 'Save All Picks'}
                </Button>
              </div>

              {/* Sport-specific picks form - renders based on group.sport */}
              {sheet && (
                <MlbPicksForm
                  onPostseasonPicksChange={setPostseasonPicks}
                  onTeamPicksChange={setTeamPicks}
                  onWorldSeriesPicksChange={setWorldSeriesPicks}
                  sheet={sheet}
                />
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">League Members</h2>
              <Card>
                <CardContent className="p-4">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Other members{"'"} picks will be visible after the lock date.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {group.members.map((member) => {
                      const user = typeof member.user === 'object' ? member.user : null;
                      const displayName = user ? `${user.nameFirst ?? ''} ${user.nameLast ?? ''}`.trim() || 'Member' : 'Member';
                      const initials = user?.nameFirst ? user.nameFirst.slice(0, 2).toUpperCase() : '??';
                      return (
                        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5" key={typeof member.user === 'string' ? member.user : member.user.id}>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{displayName}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </main>

      <SheetUI onOpenChange={setSheetOpen} open={sheetOpen}>
        {selectedMember && (
          <MlbMemberSheet
            groupId={groupId}
            isCurrentUser={selectedMember.isCurrentUser}
            memberInitials={selectedMember.userInitials}
            memberName={selectedMember.userName}
            selectedDate={selectedDate}
            userId={selectedMember.userId}
          />
        )}
      </SheetUI>
    </div>
  );
}
