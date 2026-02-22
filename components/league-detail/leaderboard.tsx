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

const MlbLeaderboard = ({
	groupId,
	onMemberSelect,
	selectedDate,
}: MlbLeaderboardProps) => {
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
				<Button onClick={fetchLeaderboard} size="sm" variant="outline">Retry</Button>
			</div>
		);
	}

	if (!leaderboard || leaderboard.entries.length === 0) {
		return <div className="text-muted-foreground">No results yet.</div>;
	}

	return (
		<section>
			<h2 className="mb-4 text-xl font-semibold">Standings</h2>
			<Card>
				<CardContent className="p-0">
					<div className="divide-border divide-y">
						{leaderboard.entries.map((entry: LeaderboardEntry, index: number) => {
							const { isCurrentUser } = entry;
							const rank = index + 1;

							return (
								<button
									className={cn(
										'hover:bg-muted/50 flex w-full items-center gap-4 p-4 text-left transition-colors',
										isCurrentUser && 'bg-primary/5',
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
									<div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
										{rank === 1 && (
											<Crown className="text-primary h-4 w-4" />
										)}

										{rank !== 1 && (
											<span className="text-muted-foreground">{rank}</span>
										)}
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
											<span className="font-medium">{entry.userName}</span>
											{isCurrentUser && (
												<Badge className="text-xs" variant="outline">
													You
												</Badge>
											)}
										</div>
										<div className="text-muted-foreground text-sm">
											{entry.wins} correct ({entry.winPct}%)
										</div>
									</div>
									<div className="flex items-center gap-2">
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
}

export default MlbLeaderboard;
