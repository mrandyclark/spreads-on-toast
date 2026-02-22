'use client';

import { Trophy } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { getFullTeamName, getTeamsByConferenceSortedByName } from '@/lib/sheet-utils';
import { cn } from '@/lib/utils';
import { Conference, PostseasonPicks, TeamPick, WorldSeriesPicks } from '@/types';

interface MlbWorldSeriesPicksProps {
	initialPicks?: WorldSeriesPicks;
	onPicksChange?: (picks: WorldSeriesPicks) => void;
	postseasonPicks?: PostseasonPicks;
	teamPicks: TeamPick[];
}

const MlbWorldSeriesPicks = ({
	initialPicks,
	onPicksChange,
	postseasonPicks,
	teamPicks,
}: MlbWorldSeriesPicksProps) => {
	const [alChampion, setAlChampion] = useState<string>(initialPicks?.alChampion ?? '');
	const [nlChampion, setNlChampion] = useState<string>(initialPicks?.nlChampion ?? '');
	const [winner, setWinner] = useState<Conference | undefined>(initialPicks?.winner);

	const { al: allAlTeams, nl: allNlTeams } = getTeamsByConferenceSortedByName(teamPicks);

	// Filter to only teams picked for postseason (if postseason picks exist)
	const alTeams = postseasonPicks?.al?.length
		? allAlTeams.filter((t) => postseasonPicks.al.includes(t.id))
		: allAlTeams;

	const nlTeams = postseasonPicks?.nl?.length
		? allNlTeams.filter((t) => postseasonPicks.nl.includes(t.id))
		: allNlTeams;

	const alTeam = alTeams.find((t) => t.id === alChampion);
	const nlTeam = nlTeams.find((t) => t.id === nlChampion);

	const handleAlChange = (value: string) => {
		setAlChampion(value);
		onPicksChange?.({ alChampion: value, nlChampion, winner });
	};

	const handleNlChange = (value: string) => {
		setNlChampion(value);
		onPicksChange?.({ alChampion, nlChampion: value, winner });
	};

	const handleWinnerChange = (value: Conference) => {
		setWinner(value);
		onPicksChange?.({ alChampion, nlChampion, winner: value });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Trophy className="text-primary h-5 w-5" />
					World Series Prediction
				</CardTitle>
				<CardDescription>
					Pick one team from each league to face off in the World Series
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-3">
						<label className="text-sm font-medium">American League Champion</label>
						<Select onValueChange={handleAlChange} value={alChampion}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select AL champion" />
							</SelectTrigger>
							<SelectContent>
								{alTeams.map((team) => (
									<SelectItem key={team.id} value={team.id}>
										<span className="flex items-center gap-2">
											<Badge className="text-xs" variant="outline">
												{team.abbreviation}
											</Badge>
											{getFullTeamName(team)}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-3">
						<label className="text-sm font-medium">National League Champion</label>
						<Select onValueChange={handleNlChange} value={nlChampion}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select NL champion" />
							</SelectTrigger>
							<SelectContent>
								{nlTeams.map((team) => (
									<SelectItem key={team.id} value={team.id}>
										<span className="flex items-center gap-2">
											<Badge className="text-xs" variant="outline">
												{team.abbreviation}
											</Badge>
											{getFullTeamName(team)}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{(alChampion || nlChampion) && (
					<div className="border-border bg-muted/30 mt-6 rounded-xl border p-6">
						<p className="text-muted-foreground mb-4 text-center text-sm font-medium">
							Your World Series Matchup
						</p>
						<div className="flex items-center justify-center gap-4">
							<button
								className={cn(
									'rounded-lg px-6 py-4 text-center transition-all',
									!alChampion && 'bg-primary/50 text-primary-foreground border-2 border-dashed border-primary/30',
									alChampion &&
										winner === Conference.AL &&
										'ring-primary bg-primary text-primary-foreground ring-2 ring-offset-2',
									alChampion &&
										winner !== Conference.AL &&
										'bg-primary/70 text-primary-foreground hover:bg-primary',
									alChampion && nlChampion && 'cursor-pointer',
								)}
								disabled={!alChampion || !nlChampion}
								onClick={() => alChampion && nlChampion && handleWinnerChange(Conference.AL)}
								type="button">
								{alTeam && (
									<>
										<p className="text-2xl font-bold">{alTeam.abbreviation}</p>
										<p className="text-xs opacity-80">AL Champion</p>
										{winner === Conference.AL && (
											<p className="mt-1 text-xs font-semibold">🏆 Winner</p>
										)}
									</>
								)}

								{!alTeam && (
									<p className="text-sm text-white/70">Select AL</p>
								)}
							</button>
							<div className="flex flex-col items-center">
								<span className="text-muted-foreground text-lg font-bold">vs</span>
								<Trophy className="text-primary mt-1 h-5 w-5" />
							</div>
							<button
								className={cn(
									'rounded-lg px-6 py-4 text-center transition-all',
									!nlChampion && 'bg-blue-800/50 text-white border-2 border-dashed border-blue-800/30',
									nlChampion &&
										winner === Conference.NL &&
										'bg-blue-800 text-white ring-2 ring-blue-800 ring-offset-2',
									nlChampion &&
										winner !== Conference.NL &&
										'bg-blue-800/70 text-white hover:bg-blue-800',
									alChampion && nlChampion && 'cursor-pointer',
								)}
								disabled={!alChampion || !nlChampion}
								onClick={() => alChampion && nlChampion && handleWinnerChange(Conference.NL)}
								type="button">
								{nlTeam && (
									<>
										<p className="text-2xl font-bold">{nlTeam.abbreviation}</p>
										<p className="text-xs opacity-80">NL Champion</p>
										{winner === Conference.NL && (
											<p className="mt-1 text-xs font-semibold">🏆 Winner</p>
										)}
									</>
								)}

								{!nlTeam && (
									<p className="text-sm text-white/70">Select NL</p>
								)}
							</button>
						</div>
						{alChampion && nlChampion && !winner && (
							<p className="text-muted-foreground mt-4 text-center text-sm">
								Click a team above to pick the World Series champion
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default MlbWorldSeriesPicks;
