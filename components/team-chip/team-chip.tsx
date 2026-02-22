'use client';

import { TeamChip as TeamChipType } from '@/types';

import TeamChipBadge from './team-chip-badge';

interface TeamChipsProps {
	chips: TeamChipType[];
}

const TeamChips = ({ chips }: TeamChipsProps) => {
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
};

export default TeamChips;
