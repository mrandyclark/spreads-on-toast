'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Conference, PickChoice, Team, TeamPick } from '@/types';

import { TeamPickCard } from './team-pick-card';

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

				<div className="space-y-3">
					{filteredTeams.map((team) => (
						<TeamPickCard
							editable
							key={team.id}
							line={team.line}
							onChange={(pick) => handlePickChange(team.id, pick)}
							pick={picks[team.id]}
							teamName={team.fullName}
						/>
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
