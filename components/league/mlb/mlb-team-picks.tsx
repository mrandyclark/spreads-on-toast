'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Conference, PickChoice, Team, TeamPick } from '@/types';

interface MlbTeamPicksProps {
	onPicksChange?: (picks: Record<string, PickChoice>) => void;
	teamPicks: TeamPick[];
}

export function MlbTeamPicks({ onPicksChange, teamPicks }: MlbTeamPicksProps) {
	const [picks, setPicks] = useState<Record<string, PickChoice>>(() => {
		const initial: Record<string, PickChoice> = {};
		teamPicks.forEach((tp) => {
			const teamId = typeof tp.team === 'object' ? tp.team.id : tp.team;

			if (tp.pick) {
				initial[teamId] = tp.pick;
			}
		});
		return initial;
	});
	const [searchQuery, setSearchQuery] = useState('');
	const [filterLeague, setFilterLeague] = useState<'AL' | 'all' | 'NL'>('all');

	// Build teams with lines from the sheet's teamPicks (populated)
	const teamsWithLines = teamPicks
		.map((tp) => {
			const team = typeof tp.team === 'object' ? (tp.team as Team) : null;

			if (!team) {
				return null;
			}
			return {
				abbreviation: team.abbreviation,
				conference: team.conference,
				division: team.division,
				fullName: `${team.city} ${team.name}`,
				id: team.id,
				line: tp.line,
			};
		})
		.filter(Boolean)
		.sort((a, b) => a!.fullName.localeCompare(b!.fullName)) as Array<{
		abbreviation: string;
		conference: Conference;
		division: string;
		fullName: string;
		id: string;
		line: number;
	}>;

	const handlePickChange = (teamId: string, pick: PickChoice) => {
		const newPicks = { ...picks, [teamId]: pick };
		setPicks(newPicks);
		onPicksChange?.(newPicks);
	};

	const filteredTeams = teamsWithLines.filter((team) => {
		const matchesSearch =
			team.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesConference = filterLeague === 'all' || team.conference === filterLeague;
		return matchesSearch && matchesConference;
	});

	const pickedCount = Object.values(picks).filter(Boolean).length;

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="text-lg">Team Win Totals</CardTitle>
						<CardDescription>
							Pick over or under for each team{"'"}s season win total
						</CardDescription>
					</div>
					<Badge className="w-fit" variant="outline">
						{pickedCount}/{teamsWithLines.length} picked
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
					<div className="relative flex-1">
						<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
						<Input
							className="pl-9"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search teams..."
							value={searchQuery}
						/>
					</div>
					<ToggleGroup
						className="justify-start"
						onValueChange={(v) => v && setFilterLeague(v as 'AL' | 'all' | 'NL')}
						type="single"
						value={filterLeague}>
						<ToggleGroupItem aria-label="All teams" value="all">
							All
						</ToggleGroupItem>
						<ToggleGroupItem aria-label="American League" value="AL">
							AL
						</ToggleGroupItem>
						<ToggleGroupItem aria-label="National League" value="NL">
							NL
						</ToggleGroupItem>
					</ToggleGroup>
				</div>

				<div className="space-y-2">
					{filteredTeams.map((team) => (
						<div
							className="border-border bg-card hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
							key={team.id}>
							<div className="flex items-center gap-3">
								<Badge
									className={cn(
										'w-12 justify-center',
										team.conference === Conference.AL
											? 'border-primary/30 bg-primary/5'
											: 'border-blue-500/30 bg-blue-500/10',
									)}
									variant="outline">
									{team.abbreviation}
								</Badge>
								<div>
									<p className="font-medium">{team.fullName}</p>
									<p className="text-muted-foreground text-xs">
										{team.conference}{' '}
										{team.division.replace('_', ' ').replace('AL ', '').replace('NL ', '')}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground text-sm font-medium tabular-nums">
									{team.line}
								</span>
								<ToggleGroup
									className="gap-1"
									onValueChange={(v) => handlePickChange(team.id, v as PickChoice)}
									type="single"
									value={picks[team.id] || ''}>
									<ToggleGroupItem
										aria-label={`Over ${team.line} wins`}
										className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 px-3 text-xs"
										value="over">
										Over
									</ToggleGroupItem>
									<ToggleGroupItem
										aria-label={`Under ${team.line} wins`}
										className="data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground h-8 px-3 text-xs"
										value="under">
										Under
									</ToggleGroupItem>
								</ToggleGroup>
							</div>
						</div>
					))}
				</div>

				{filteredTeams.length === 0 && (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">No teams found matching your search.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
