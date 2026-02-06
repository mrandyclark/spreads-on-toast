'use client';

import { ChevronRight, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getLeaderboardAction, LeaderboardData, LeaderboardEntry } from '@/app/(logged-in)/league/[id]/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface SelectedMember {
  isCurrentUser: boolean;
  userId: string;
  userInitials: string;
  userName: string;
}

interface MlbLeaderboardProps {
  currentUserId: string;
  groupId: string;
  onMemberSelect?: (member: SelectedMember) => void;
  selectedDate?: string; // YYYY-MM-DD format for historical lookup
}

export function MlbLeaderboard({ currentUserId, groupId, onMemberSelect, selectedDate }: MlbLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);

      try {
        const result = await getLeaderboardAction(groupId, selectedDate);

        if (result.leaderboard) {
          setLeaderboard(result.leaderboard);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [groupId, selectedDate]);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading leaderboard...</div>;
  }

  if (!leaderboard || leaderboard.entries.length === 0) {
    return <div className="text-muted-foreground">No results yet.</div>;
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Standings</h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {leaderboard.entries.map((entry: LeaderboardEntry, index: number) => {
              const isCurrentUser = entry.userId.toLowerCase() === currentUserId.toLowerCase();
              const rank = index + 1;

              return (
                <button
                  className={cn('flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50', isCurrentUser && 'bg-primary/5')}
                  key={entry.userId}
                  onClick={() => onMemberSelect?.({
                    isCurrentUser,
                    userId: entry.userId,
                    userInitials: entry.userInitials,
                    userName: entry.userName,
                  })}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {rank === 1 ? (
                      <Crown className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-muted-foreground">{rank}</span>
                    )}
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarFallback className={isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                      {entry.userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.userName}</span>
                      {isCurrentUser && (
                        <Badge className="text-xs" variant="outline">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.wins} correct ({entry.winPct}%)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress className="hidden h-2 w-20 sm:block" value={entry.winPct} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
