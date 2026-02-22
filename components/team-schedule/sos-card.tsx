import { HelpCircle } from 'lucide-react';

import { PopoverContent, PopoverTrigger, ScrollDismissPopover } from '@/components/ui/popover';
import { ordinal } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import { DifficultyLabel, SOSData } from '@/types';

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

interface SOSCardProps {
	data: null | SOSData;
	title: string;
	tooltipContent: string;
}

const SOSCard = ({ data, title, tooltipContent }: SOSCardProps) => {
	if (!data) {
		return (
			<div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg p-6">
				<span className="text-muted-foreground text-sm">Not enough games yet</span>
			</div>
		);
	}

	const barWidth = Math.max(data.percentile, 5);

	return (
		<div className="bg-muted/50 rounded-lg p-4">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm font-medium">{title}</span>
					<ScrollDismissPopover>
						<PopoverTrigger asChild>
							<button className="focus:outline-none" type="button">
								<HelpCircle className="text-muted-foreground h-4 w-4 cursor-help" />
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-64 p-3" side="top">
							<p className="text-muted-foreground mb-2 text-sm">{tooltipContent}</p>
							<p className="text-muted-foreground text-xs font-medium">
								Ranked {ordinal(data.rank)} hardest based on opponent win percentage.
							</p>
						</PopoverContent>
					</ScrollDismissPopover>
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
};

export default SOSCard;
