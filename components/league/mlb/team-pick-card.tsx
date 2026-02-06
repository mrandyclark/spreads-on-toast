'use client';

import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getResultBorderClass, getResultIcon } from '@/lib/result-utils';
import { cn } from '@/lib/utils';
import { PickChoice, PickResult } from '@/types';

interface TeamPickCardProps {
	// actualWins?: number;
	editable?: boolean;
	gamesPlayed?: number;
	line: number;
	onChange?: (pick: PickChoice) => void;
	pick?: 'over' | 'under' | null;
	projectedWins?: number;
	result?: PickResult;
	teamName: string;
}

export function TeamPickCard({
	editable = false,
	gamesPlayed,
	line,
	onChange,
	pick,
	projectedWins,
	result,
	teamName,
}: TeamPickCardProps) {
	const showEstimated = gamesPlayed !== undefined && gamesPlayed < 162;

	return (
		<div className={cn('rounded-lg border p-3', result ? getResultBorderClass(result) : 'border-border bg-card')}>
			<div className="mb-2 flex w-full items-center gap-2">
				{result && getResultIcon(result)}
				<span className="font-semibold">{teamName}</span>
			</div>

			<div className="flex items-center justify-between text-sm">
				<div className="flex items-center gap-4">
					{projectedWins !== undefined && (
						<div className="flex items-center gap-1">
							<span className="text-muted-foreground">
								{showEstimated ? 'Est:' : 'Final:'}
							</span>
							<span className="font-medium">{projectedWins}</span>
						</div>
					)}

					<div className="flex items-center gap-1">
						<span className="text-muted-foreground">Line:</span>
						<span className="font-medium">{line}</span>
					</div>
				</div>

				{editable && (
					<ToggleGroup
						className="gap-1"
						onValueChange={(v) => onChange?.(v as PickChoice)}
						type="single"
						value={pick || ''}>
						<ToggleGroupItem
							aria-label={`Over ${line} wins`}
							className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 px-3 text-xs"
							value="over">
							Over
						</ToggleGroupItem>
						<ToggleGroupItem
							aria-label={`Under ${line} wins`}
							className="data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground h-8 px-3 text-xs"
							value="under">
							Under
						</ToggleGroupItem>
					</ToggleGroup>
				)}

				{!editable && pick && (
					<Badge variant={pick === 'over' ? 'default' : 'secondary'}>
						{pick.toUpperCase()}
					</Badge>
				)}
			</div>
		</div>
	);
}
