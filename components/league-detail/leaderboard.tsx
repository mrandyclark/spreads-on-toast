'use client';

import { AlertCircle, ChevronRight, Crown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { getLeaderboardAction } from '@/app/(logged-in)/league/[id]/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LeaderboardData, LeaderboardEntry, SelectedMember } from '@/types';

interface MlbLeaderboardProps {
	groupId: string;
	onMemberSelect?: (member: SelectedMember) => void;
	selectedDate?: string; // YYYY-MM-DD format for historical lookup
}

const MlbLeaderboard = ({ groupId, onMemberSelect, selectedDate }: MlbLeaderboardProps) => {
	const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<null | string>(null);

	const fetchLeaderboard = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await getLeaderboardAction(groupId, selectedDate);

			if (result.error) {
				setError(result.errorMessage ?? 'Failed to load leaderboard');
			} else if (result.leaderboard) {
				setLeaderboard(result.leaderboard);
			}
		} catch {
			setError('Failed to load leaderboard');
		} finally {
			setIsLoading(false);
		}
	}, [groupId, selectedDate]);

	useEffect(() => {
		// This effect intentionally synchronizes the selected historical date with server results.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchLeaderboard();
	}, [fetchLeaderboard]);

	if (isLoading) {
		return <div className="text-muted-foreground">Loading leaderboard...</div>;
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-2 py-4 text-center">
				<AlertCircle className="text-destructive h-5 w-5" />
				<p className="text-muted-foreground text-sm">{error}</p>
				<Button onClick={fetchLeaderboard} size="sm" variant="outline">
					Retry
				</Button>
			</div>
		);
	}

	if (!leaderboard || leaderboard.entries.length === 0) {
		return <div className="text-muted-foreground">No results yet.</div>;
	}

	return (
		<section>
			<div className="mb-4">
				<p className="text-primary eyebrow">League competition</p>
				<h2 className="mt-1 text-2xl font-black tracking-[-.03em]">The league table</h2>
			</div>
			<Card className="overflow-hidden">
				<CardContent className="p-0">
					<div className="divide-border divide-y">
						{leaderboard.entries.map((entry: LeaderboardEntry, index: number) => {
							const { isCurrentUser } = entry;
							const rank = index + 1;

							return (
								<button
									className={cn(
										'hover:bg-muted/50 flex w-full items-center gap-3 p-4 text-left transition-colors sm:gap-4',
										isCurrentUser && 'bg-accent/15',
									)}
									key={entry.userId}
									onClick={() =>
										onMemberSelect?.({
											isCurrentUser,
											userId: entry.userId,
											userInitials: entry.userInitials,
											userName: entry.userName,
										})
									}>
									<div
										className={cn(
											'bg-muted flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black',
											rank === 1 && 'bg-accent text-accent-foreground',
										)}>
										{rank === 1 && <Crown className="h-4 w-4" />}

										{rank !== 1 && <span>{rank}</span>}
									</div>
									<Avatar className="border-border h-10 w-10 border-2">
										<AvatarFallback
											className={
												isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
											}>
											{entry.userInitials}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<span className="font-black">{entry.userName}</span>
											{isCurrentUser && (
												<Badge className="text-xs" variant="outline">
													You
												</Badge>
											)}
										</div>
										<div className="text-muted-foreground mt-0.5 text-xs">
											{entry.wins} called right · {entry.winPct}%
										</div>
									</div>
									<div className="flex items-center gap-3">
										<span className="tabular hidden text-lg font-black sm:block">
											{entry.winPct}%
										</span>
										<Progress className="hidden h-2 w-20 sm:block" value={entry.winPct} />
										<ChevronRight className="text-muted-foreground h-4 w-4" />
									</div>
								</button>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</section>
	);
};

export default MlbLeaderboard;
