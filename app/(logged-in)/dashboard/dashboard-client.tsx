'use client';

import { ChevronRight, Plus, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ToastIcon } from '@/components/toast-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  email?: string;
  id: string;
  nameFirst?: string;
  nameLast?: string;
}

interface DashboardClientProps {
  user: User;
}

const mockLeagues = [
  {
    id: '1',
    members: 8,
    name: 'Sunday Squad',
    season: '2025-26',
    sport: 'NFL',
    yourRank: 2,
  },
  {
    id: '2',
    members: 6,
    name: 'Hoops Heads',
    season: '2025-26',
    sport: 'NBA',
    yourRank: 1,
  },
  {
    id: '3',
    members: 10,
    name: 'Diamond Dynasty',
    season: '2025',
    sport: 'MLB',
    yourRank: 5,
  },
];

export function DashboardClient({ user }: DashboardClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [leagueSport, setLeagueSport] = useState('MLB');
  const [inviteCode, setInviteCode] = useState('');
  const [leagues, setLeagues] = useState(mockLeagues);

  const handleCreateLeague = () => {
    if (leagueName.trim()) {
      const newLeague = {
        id: String(leagues.length + 1),
        members: 1,
        name: leagueName.trim(),
        season: '2025',
        sport: leagueSport,
        yourRank: 1,
      };
      setLeagues([newLeague, ...leagues]);
      setLeagueName('');
      setLeagueSport('MLB');
      setIsCreateOpen(false);
    }
  };

  const handleJoinLeague = () => {
    if (inviteCode.trim()) {
      // Mock joining a league - in real app this would validate the code
      const joinedLeague = {
        id: String(leagues.length + 1),
        members: 5,
        name: 'Joined League',
        season: '2025',
        sport: 'MLB',
        yourRank: 5,
      };
      setLeagues([joinedLeague, ...leagues]);
      setInviteCode('');
      setIsJoinOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link className="flex items-center gap-2" href="/">
            <ToastIcon className="h-8 w-8" />
            <span className="text-lg font-semibold text-foreground">spreadsontoast</span>
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.nameFirst ? `${user.nameFirst} ${user.nameLast || ''}`.trim() : user.email}
            </span>
            <Button asChild size="sm" variant="ghost">
              <Link href="/api/auth/logout">Sign Out</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Your Leagues</h1>
            <p className="mt-1 text-muted-foreground">Manage your leagues and track your standings</p>
          </div>

          <Dialog onOpenChange={setIsCreateOpen} open={isCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create League
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a new league</DialogTitle>
                <DialogDescription>
                  Give your league a name to get started. You can invite friends after creating it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="league-name">League name</Label>
                  <Input
                    id="league-name"
                    onChange={(e) => setLeagueName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateLeague();
                      }
                    }}
                    placeholder="e.g. Sunday Squad"
                    value={leagueName}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="league-sport">Sport</Label>
                  <Select onValueChange={setLeagueSport} value={leagueSport}>
                    <SelectTrigger id="league-sport">
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MLB">MLB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsCreateOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button disabled={!leagueName.trim()} onClick={handleCreateLeague}>
                  Create League
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {leagues.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">No leagues yet</h3>
              <p className="mb-6 max-w-sm text-muted-foreground">
                Create your first league to start making picks and competing with friends.
              </p>
              <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first league
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {leagues.map((league) => (
              <Link href={`/league/${league.id}`} key={league.id}>
                <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                          {league.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                              {league.sport}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {league.members} members
                          </span>
                          <span>{league.season}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden text-right sm:block">
                        <p className="text-sm text-muted-foreground">Your rank</p>
                        <p className="text-lg font-bold text-foreground">#{league.yourRank}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="mb-3 text-muted-foreground">Have an invite code from a friend?</p>
          <Dialog onOpenChange={setIsJoinOpen} open={isJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Join an existing league</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Join a league</DialogTitle>
                <DialogDescription>
                  Enter the invite code you received from a friend to join their league.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="invite-code">Invite code</Label>
                  <Input
                    id="invite-code"
                    onChange={(e) => setInviteCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleJoinLeague();
                      }
                    }}
                    placeholder="e.g. ABC123"
                    value={inviteCode}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsJoinOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button disabled={!inviteCode.trim()} onClick={handleJoinLeague}>
                  Join League
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
