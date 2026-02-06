'use client';

import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
	getResultsAction,
	getSheetForMemberAction,
	GroupResults,
	TeamPickResult,
} from '@/app/(logged-in)/league/[id]/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getResultBgClass, getResultIcon } from '@/lib/result-utils';
import { getPostseasonTeams, getWorldSeriesChampions } from '@/lib/sheet-utils';
import { cn } from '@/lib/utils';
import { Conference, Sheet } from '@/types';

interface MlbMemberSheetProps {
	groupId: string;
	isCurrentUser: boolean;
	memberInitials: string;
	memberName: string;
	onDateChange?: (date: string | undefined) => void;
	seasonEndDate?: string;
	seasonStartDate?: string;
	selectedDate?: string;
	userId: string;
}

export function MlbMemberSheet({
	groupId,
	isCurrentUser,
	memberInitials,
	memberName,
	onDateChange,
	seasonEndDate,
	seasonStartDate,
	selectedDate,
	userId,
}: MlbMemberSheetProps) {
	const [results, setResults] = useState<GroupResults | null>(null);
	const [sheet, setSheet] = useState<null | Sheet>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function fetchData() {
			setIsLoading(true);

			try {
				const [resultsResult, sheetResult] = await Promise.all([
					getResultsAction(groupId, userId, selectedDate),
					getSheetForMemberAction(groupId, userId),
				]);

				if (resultsResult.results) {
					setResults(resultsResult.results);
				}

				if (sheetResult.sheet) {
					setSheet(sheetResult.sheet);
				}
			} finally {
				setIsLoading(false);
			}
		}

		if (userId) {
			fetchData();
		}
	}, [groupId, userId, selectedDate]);

	const { al: alPostseasonTeams, nl: nlPostseasonTeams } = getPostseasonTeams(sheet);
	const { alChampion, nlChampion, winner: wsWinner } = getWorldSeriesChampions(sheet);

	return (
		<SheetContent className="overflow-y-auto sm:max-w-lg">
			<SheetHeader>
				<SheetTitle className="flex items-center gap-3">
					<div
						className={cn(
							'flex h-10 w-10 items-center justify-center rounded-full',
							isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary',
						)}>
						{memberInitials}
					</div>
					<span>
						{memberName}
						{isCurrentUser ? '' : "'s"} Picks
					</span>
				</SheetTitle>
				{results && (
					<SheetDescription>
						{results.summary.wins} correct (
						{Math.round((results.summary.wins / results.summary.total) * 100)}%)
					</SheetDescription>
				)}
			</SheetHeader>

			{/* Date picker */}
			{seasonStartDate && seasonEndDate && onDateChange && (
				<div className="mt-4 flex flex-col items-end gap-1">
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-sm">View as of:</span>
						<DatePicker
							maxDate={seasonEndDate}
							minDate={seasonStartDate}
							onChange={onDateChange}
							value={selectedDate || seasonEndDate}
						/>
					</div>
					{selectedDate && (
						<Button
							className="h-auto p-0"
							onClick={() => onDateChange(undefined)}
							size="sm"
							variant="link">
							Show Final Results
						</Button>
					)}
				</div>
			)}

			{isLoading ? (
				<div className="text-muted-foreground mt-6 text-sm">Loading picks...</div>
			) : (
				<div className="mt-6">
					<Tabs className="w-full" defaultValue="teams">
						<TabsList className="mb-4 w-full">
							<TabsTrigger className="flex-1" value="teams">
								Teams
							</TabsTrigger>
							<TabsTrigger className="flex-1" value="postseason">
								Postseason
							</TabsTrigger>
							<TabsTrigger className="flex-1" value="ws">
								World Series
							</TabsTrigger>
						</TabsList>

						<TabsContent value="teams">
							<div className="grid gap-2 sm:grid-cols-2">
								{results?.picks.map((pick: TeamPickResult) => (
									<div
										className={cn('rounded-lg border p-2.5', getResultBgClass(pick.result))}
										key={pick.team.id}>
										<div className="mb-1.5 flex items-center justify-between">
											<div className="flex items-center gap-1.5">
												{getResultIcon(pick.result, 'h-3 w-3')}
												<span className="text-sm font-semibold">{pick.team.abbreviation}</span>
											</div>
											<Badge
												className="text-xs"
												variant={pick.pick === 'over' ? 'default' : 'secondary'}>
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
												<span className="text-muted-foreground">
													{pick.gamesPlayed === 162 ? 'Final:' : 'Estimated:'}
												</span>
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
									<h4 className="text-muted-foreground mb-2 text-sm font-medium">
										American League
									</h4>
									<div className="flex flex-wrap gap-1.5">
										{alPostseasonTeams.length > 0 ? (
											alPostseasonTeams.map((team) => (
												<Badge
													className="border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-400"
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
									<h4 className="text-muted-foreground mb-2 text-sm font-medium">
										National League
									</h4>
									<div className="flex flex-wrap gap-1.5">
										{nlPostseasonTeams.length > 0 ? (
											nlPostseasonTeams.map((team) => (
												<Badge
													className="border-blue-500/30 bg-blue-500/10 text-xs text-blue-700 dark:text-blue-400"
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
						</TabsContent>

						<TabsContent value="ws">
							<div className="flex flex-col items-center gap-4 py-4">
								<div className="flex items-center gap-4">
									<div
										className={cn(
											'rounded-lg px-4 py-3 text-center',
											wsWinner === Conference.AL ? 'bg-primary/20 ring-primary ring-2' : 'bg-muted',
										)}>
										<Badge className="bg-primary">{alChampion?.abbreviation ?? '???'}</Badge>
										<p className="text-muted-foreground mt-1 text-xs">AL Champion</p>
									</div>
									<Trophy className="text-primary h-5 w-5" />
									<div
										className={cn(
											'rounded-lg px-4 py-3 text-center',
											wsWinner === Conference.NL
												? 'bg-blue-800/20 ring-2 ring-blue-800'
												: 'bg-muted',
										)}>
										<Badge className="bg-blue-800">{nlChampion?.abbreviation ?? '???'}</Badge>
										<p className="text-muted-foreground mt-1 text-xs">NL Champion</p>
									</div>
								</div>
								{wsWinner && (
									<p className="text-muted-foreground text-sm">
										Picked{' '}
										<span className="text-foreground font-medium">
											{wsWinner === Conference.AL
												? alChampion?.abbreviation
												: nlChampion?.abbreviation}
										</span>{' '}
										to win
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
