'use client';

import { Badge } from '@/components/ui/badge';
import { PopoverContent, PopoverTrigger, ScrollDismissPopover } from '@/components/ui/popover';
import { TeamChip as TeamChipType } from '@/types';

interface TeamChipProps {
	chip: TeamChipType;
}

export function TeamChipBadge({ chip }: TeamChipProps) {
	return (
		<ScrollDismissPopover>
			<PopoverTrigger asChild>
				<button className="focus:outline-none" type="button">
					<Badge className="cursor-pointer border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30">
						{chip.label}
					</Badge>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" side="top">
				<div className="space-y-1.5">
					<p className="text-foreground text-sm font-medium">{chip.tooltip}</p>
					<p className="text-muted-foreground text-xs">{chip.detail}</p>
				</div>
			</PopoverContent>
		</ScrollDismissPopover>
	);
}

interface TeamChipsProps {
	chips: TeamChipType[];
}

export function TeamChips({ chips }: TeamChipsProps) {
	if (chips.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			{chips.map((chip) => (
				<TeamChipBadge chip={chip} key={chip.key} />
			))}
		</div>
	);
}
