'use client';

import { HelpCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DifficultyLabel, ScheduleDifficultyData, SOSData } from '@/types';

interface ScheduleDifficultyProps {
	data: ScheduleDifficultyData;
}

const LABEL_DISPLAY: Record<DifficultyLabel, string> = {
	Average: 'Average',
	Easy: 'Below Average',
	Hard: 'Above Average',
};

const LABEL_COLORS: Record<DifficultyLabel, string> = {
	Average: 'text-yellow-600 dark:text-yellow-400',
	Easy: 'text-green-600 dark:text-green-400',
	Hard: 'text-red-600 dark:text-red-400',
};

const LABEL_BG_COLORS: Record<DifficultyLabel, string> = {
	Average: 'bg-yellow-600',
	Easy: 'bg-green-600',
	Hard: 'bg-red-600',
};

function formatWinPct(pct: number): string {
	return `.${(pct * 1000).toFixed(0).padStart(3, '0')}`;
}

function getOrdinal(n: number): string {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function SOSCard({
	data,
	title,
	tooltipContent,
}: {
	data: null | SOSData;
	title: string;
	tooltipContent: string;
}) {
	if (!data) {
		return (
			<div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg p-6">
				<span className="text-muted-foreground text-sm">Not enough games yet</span>
			</div>
		);
	}

	// Bar width scales with percentile (higher percentile = harder schedule = longer bar)
	const barWidth = Math.max(data.percentile, 5);

	return (
		<div className="bg-muted/50 rounded-lg p-4">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm font-medium">{title}</span>
					<Popover>
						<PopoverTrigger asChild>
							<button className="focus:outline-none" type="button">
								<HelpCircle className="text-muted-foreground h-4 w-4 cursor-help" />
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-64 p-3" side="top">
							<p className="text-muted-foreground mb-2 text-sm">{tooltipContent}</p>
							<p className="text-muted-foreground text-xs font-medium">
								Ranked {getOrdinal(data.rank)} hardest based on opponent win percentage.
							</p>
						</PopoverContent>
					</Popover>
				</div>
				<span className={cn('text-sm font-semibold', LABEL_COLORS[data.label])}>
					{LABEL_DISPLAY[data.label]}
				</span>
			</div>

			<div className="mb-2 flex items-baseline gap-2">
				<span className="text-3xl font-bold">{formatWinPct(data.avgOpponentWinPct)}</span>
				<span className="text-muted-foreground text-sm">avg opp win%</span>
			</div>

			<div className="bg-muted mb-3 h-2 w-full overflow-hidden rounded-full">
				<div
					className={cn('h-full rounded-full transition-all duration-300', LABEL_BG_COLORS[data.label])}
					style={{ width: `${barWidth}%` }}
				/>
			</div>

			<div className="text-muted-foreground flex justify-between text-xs">
				<span>{data.gameCount} games</span>
				<span>Rank: {data.rank} of 30</span>
			</div>
		</div>
	);
}

export function ScheduleDifficulty({ data }: ScheduleDifficultyProps) {
	return (
		<Card>
			<CardHeader className="pb-4">
				<CardTitle>Schedule Difficulty</CardTitle>
				<CardDescription>
					Strength of schedule based on opponent win percentage at time of each game
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 md:grid-cols-2">
					<SOSCard
						data={data.played}
						title="Played (to date)"
						tooltipContent="Average win percentage of opponents faced in completed games. Uses each opponent's record at the time of the game, not their current record."
					/>
					<SOSCard
						data={data.remaining}
						title="Remaining"
						tooltipContent="Average win percentage of opponents in upcoming games. Includes postponed games that haven't been completed yet."
					/>
				</div>
			</CardContent>
		</Card>
	);
}
