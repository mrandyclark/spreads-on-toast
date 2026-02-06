'use client';

import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
	getResultsAction,
	GroupResults,
	TeamPickResult,
} from '@/app/(logged-in)/league/[id]/actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPostseasonTeams, getWorldSeriesChampions } from '@/lib/sheet-utils';
import { cn } from '@/lib/utils';
import { Conference, Sheet } from '@/types';

import { TeamPickCard } from './team-pick-card';

interface MlbLockedResultsProps {
	groupId: string;
	selectedDate?: string; // YYYY-MM-DD format for historical lookup
	sheet: Sheet;
	userId: string;
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

	const { al: alPostseasonTeams, nl: nlPostseasonTeams } = getPostseasonTeams(sheet);
	const { alChampion, nlChampion, winner: wsWinner } = getWorldSeriesChampions(sheet);

	return (
		<section>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-xl font-semibold">Your Picks</h2>
				{results && (
					<div className="flex items-center gap-4 text-sm">
						<span className="text-green-500">{results.summary.wins}W</span>
						<span className="text-red-500">{results.summary.losses}L</span>
						{results.summary.pushes > 0 && (
							<span className="text-yellow-500">{results.summary.pushes}P</span>
						)}
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
							<p className="text-muted-foreground mb-4 text-sm">
								Your locked win total picks for the season. Final results based on end-of-season
								standings.
							</p>
							<div className="space-y-3">
								{results?.picks.map((pick: TeamPickResult) => (
									<TeamPickCard
										gamesPlayed={pick.gamesPlayed}
										key={pick.team.id}
										line={pick.line}
										pick={pick.pick}
										projectedWins={pick.projectedWins}
										result={pick.result}
										teamName={`${pick.team.city} ${pick.team.name}`}
									/>
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
												<Badge
													className="border-red-500/30 bg-red-500/10 px-3 py-1 text-red-700 dark:text-red-400"
													key={team.id}
													variant="outline">
													{team.abbreviation}
												</Badge>
											))
										) : (
											<span className="text-muted-foreground text-sm">No picks</span>
										)}
									</div>
								</div>
								<div>
									<h4 className="mb-3 font-medium">National League</h4>
									<div className="flex flex-wrap gap-2">
										{nlPostseasonTeams.length > 0 ? (
											nlPostseasonTeams.map((team) => (
												<Badge
													className="border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-700 dark:text-blue-400"
													key={team.id}
													variant="outline">
													{team.abbreviation}
												</Badge>
											))
										) : (
											<span className="text-muted-foreground text-sm">No picks</span>
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
								className={cn(
									'flex items-center gap-3 rounded-lg px-4 py-3',
									wsWinner === Conference.AL ? 'bg-primary/20 ring-primary ring-2' : 'bg-muted',
								)}>
								<Badge className="bg-primary">{alChampion?.abbreviation ?? '???'}</Badge>
								<span className="text-muted-foreground text-sm">AL Champion</span>
							</div>
							<Trophy className="text-primary h-6 w-6" />
							<div
								className={cn(
									'flex items-center gap-3 rounded-lg px-4 py-3',
									wsWinner === Conference.NL ? 'bg-blue-800/20 ring-2 ring-blue-800' : 'bg-muted',
								)}>
								<Badge className="bg-blue-800">{nlChampion?.abbreviation ?? '???'}</Badge>
								<span className="text-muted-foreground text-sm">NL Champion</span>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</section>
	);
}
