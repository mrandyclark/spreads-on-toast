'use client';

import { ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DIVISION_LABELS, DIVISION_ORDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TeamSummary } from '@/types';

interface TeamSwitcherProps {
	currentAbbreviation: string;
	season: string;
	teams: TeamSummary[];
}

const TeamSwitcher = ({ currentAbbreviation, season, teams }: TeamSwitcherProps) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	const teamsByDivision = teams.reduce<Record<string, TeamSummary[]>>((acc, team) => {
		if (!acc[team.division]) {
			acc[team.division] = [];
		}

		acc[team.division].push(team);
		return acc;
	}, {});

	const handleSelect = (abbreviation: string) => {
		setOpen(false);
		router.push(`/teams/mlb/${abbreviation.toLowerCase()}?season=${season}`);
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button className="gap-1.5" size="sm" variant="outline">
					Switch Team
					<ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[280px] p-2">
				<div className="max-h-[360px] overflow-y-auto">
					{DIVISION_ORDER.map((div) => {
						const divTeams = teamsByDivision[div];

						if (!divTeams || divTeams.length === 0) {return null;}

						return (
							<div key={div}>
								<p className="text-muted-foreground px-2 py-1.5 text-xs font-medium uppercase tracking-wide">
									{DIVISION_LABELS[div] ?? div}
								</p>
								{divTeams.map((team) => (
									<button
										className={cn(
											'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
											team.abbreviation.toLowerCase() === currentAbbreviation
												? 'bg-primary/10 text-primary font-medium'
												: 'hover:bg-muted text-foreground',
										)}
										key={team.id}
										onClick={() => handleSelect(team.abbreviation)}
										type="button">
										{team.city} {team.name}
										<span className="text-muted-foreground ml-auto text-xs">{team.abbreviation}</span>
									</button>
								))}
							</div>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default TeamSwitcher;
