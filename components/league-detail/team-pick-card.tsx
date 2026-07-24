'use client';

import { Check, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getResultBorderClass, getResultIcon } from '@/lib/result-utils';
import { cn } from '@/lib/utils';
import { PickChoice, PickResult } from '@/types';

interface TeamPickCardProps {
	abbreviation?: string;
	editable?: boolean;
	gamesPlayed?: number;
	line: number;
	onChange?: (pick: PickChoice) => void;
	pick?: 'over' | 'under' | null;
	projectedWins?: number;
	result?: PickResult;
	teamName: string;
}

const TeamPickCard = ({
	abbreviation,
	editable = false,
	gamesPlayed,
	line,
	onChange,
	pick,
	projectedWins,
	result,
	teamName,
}: TeamPickCardProps) => {
	const showEstimated = gamesPlayed !== undefined && gamesPlayed < 162;

	return (
		<div
			className={cn(
				'bg-card overflow-hidden rounded-2xl border p-3 transition-all',
				result ? getResultBorderClass(result) : 'border-border bg-card',
			)}>
			<div className="flex items-center gap-3">
				<div className="bg-foreground text-background flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-black">
					{abbreviation ?? teamName.slice(0, 3).toUpperCase()}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						{result && getResultIcon(result)}
						<span className="truncate font-black">{teamName}</span>
					</div>
					<div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
						{projectedWins !== undefined && (
							<div className="flex items-center gap-1">
								<span className="text-muted-foreground">{showEstimated ? 'Est:' : 'Final:'}</span>
								<span className="tabular font-black">{projectedWins}</span>
							</div>
						)}

						<div className="flex items-center gap-1">
							<span className="text-muted-foreground">Vegas line</span>
							<span className="tabular font-black">{line}</span>
						</div>

						{abbreviation && (
							<Link
								className="text-primary hover:text-primary/80 hidden items-center gap-1 text-xs font-bold transition-colors sm:flex"
								href={`/teams/MLB/${abbreviation}`}>
								View Team
								<ExternalLink className="h-3 w-3" />
							</Link>
						)}
					</div>
				</div>

				{editable && (
					<ToggleGroup
						className="bg-muted grid w-[128px] shrink-0 grid-cols-2 gap-1 rounded-xl p-1 sm:w-[154px]"
						onValueChange={(v) => onChange?.(v as PickChoice)}
						type="single"
						value={pick || ''}>
						<ToggleGroupItem
							aria-label={`Over ${line} wins`}
							className="data-[state=on]:bg-outfield h-10 rounded-lg px-2 text-xs font-black data-[state=on]:text-white"
							value="over">
							<TrendingUp className="h-3.5 w-3.5" />O
						</ToggleGroupItem>
						<ToggleGroupItem
							aria-label={`Under ${line} wins`}
							className="data-[state=on]:bg-bullpen h-10 rounded-lg px-2 text-xs font-black data-[state=on]:text-white"
							value="under">
							<TrendingDown className="h-3.5 w-3.5" />U
						</ToggleGroupItem>
					</ToggleGroup>
				)}

				{!editable && pick && (
					<Badge className="gap-1 font-black" variant={pick === 'over' ? 'default' : 'secondary'}>
						<Check className="h-3 w-3" />
						{pick.toUpperCase()}
					</Badge>
				)}
			</div>
		</div>
	);
};

export default TeamPickCard;
