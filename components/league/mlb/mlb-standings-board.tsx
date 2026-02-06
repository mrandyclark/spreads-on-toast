'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SeasonWithDates, StandingsBoardData } from '@/types';

function getOverUnder(pythagoreanWins: number, line: number): 'over' | 'push' | 'under' {
	const diff = pythagoreanWins - line;

	if (Math.abs(diff) < 0.5) {
		return 'push';
	}

	return diff > 0 ? 'over' : 'under';
}

function OverUnderIndicator({ line, pythagoreanWins }: { line: number; pythagoreanWins: number }) {
	const result = getOverUnder(pythagoreanWins, line);

	if (result === 'over') {
		return (
			<span className="text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
				<ArrowUp className="h-4 w-4" />
				Over
			</span>
		);
	}

	if (result === 'under') {
		return (
			<span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
				<ArrowDown className="h-4 w-4" />
				Under
			</span>
		);
	}

	return (
		<span className="text-muted-foreground flex items-center gap-1 font-medium">
			<Minus className="h-4 w-4" />
			Push
		</span>
	);
}

const DIVISION_LABELS: Record<string, string> = {
	AL_Central: 'Central',
	AL_East: 'East',
	AL_West: 'West',
	NL_Central: 'Central',
	NL_East: 'East',
	NL_West: 'West',
};

const AL_DIVISIONS = ['AL_East', 'AL_Central', 'AL_West'];
const NL_DIVISIONS = ['NL_East', 'NL_Central', 'NL_West'];

interface DivisionRowsProps {
	division: string;
	standings: StandingsBoardData[];
}

function DivisionRows({ division, standings }: DivisionRowsProps) {
	// Sort by pythagorean wins descending
	const sortedStandings = [...standings].sort((a, b) => b.pythagoreanWins - a.pythagoreanWins);

	return (
		<>
			<tr>
				<td
					className="bg-foreground/80 px-4 py-2 text-sm font-semibold text-white dark:bg-foreground/60"
					colSpan={7}>
					{DIVISION_LABELS[division] ?? division}
				</td>
			</tr>
			{sortedStandings.map((team) => (
				<tr className="border-border border-b" key={team.abbreviation}>
					<td className="text-muted-foreground w-[50px] px-2 py-2 text-center text-xs">{team.abbreviation}</td>
					<td className="px-2 py-2 font-medium">
						<Link
							className="hover:text-primary hover:underline"
							href={`/teams/mlb/${team.abbreviation.toLowerCase()}`}>
							{team.name}
						</Link>
					</td>
					<td className="px-2 py-2 text-center">{team.wins}</td>
					<td className="px-2 py-2 text-center">{team.losses}</td>
					<td className="px-2 py-2 text-center">{team.line}</td>
					<td
						className={cn(
							'px-2 py-2 text-center font-medium',
							team.pythagoreanWins > team.line && 'text-green-600 dark:text-green-400',
							team.pythagoreanWins < team.line && 'text-red-600 dark:text-red-400',
						)}>
						{team.pythagoreanWins.toFixed(1)}
					</td>
					<td className="px-2 py-2 text-center">
						<OverUnderIndicator line={team.line} pythagoreanWins={team.pythagoreanWins} />
					</td>
				</tr>
			))}
		</>
	);
}

interface LeagueStandingsProps {
	divisions: string[];
	standings: StandingsBoardData[];
	title: string;
}

function LeagueStandings({ divisions, standings, title }: LeagueStandingsProps) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-border border-b">
								<th className="text-muted-foreground w-[50px] px-2 py-3 text-center font-medium"></th>
								<th className="text-muted-foreground px-2 py-3 text-left font-medium">Team</th>
								<th className="text-muted-foreground w-[50px] px-2 py-3 text-center font-medium">W</th>
								<th className="text-muted-foreground w-[50px] px-2 py-3 text-center font-medium">L</th>
								<th className="text-muted-foreground w-[60px] px-2 py-3 text-center font-medium">Line</th>
								<th className="text-muted-foreground w-[70px] px-2 py-3 text-center font-medium">Proj W</th>
								<th className="text-muted-foreground w-[80px] px-2 py-3 text-center font-medium">O/U</th>
							</tr>
						</thead>
						<tbody>
							{divisions.map((division) => {
								const divisionStandings = standings.filter((t) => t.division === division);

								return (
									<DivisionRows
										division={division}
										key={division}
										standings={divisionStandings}
									/>
								);
							})}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}

export function MlbStandingsBoard() {
	const [seasons, setSeasons] = useState<SeasonWithDates[]>([]);
	const [selectedSeason, setSelectedSeason] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [standings, setStandings] = useState<StandingsBoardData[]>([]);
	const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);
	const [isLoadingStandings, setIsLoadingStandings] = useState(false);

	// Fetch available seasons on mount
	useEffect(() => {
		async function fetchSeasons() {
			try {
				const response = await fetch('/api/standings/seasons');
				const data = await response.json();

				setSeasons(data);

				// Default to first season (most recent) and its latest date
				if (data.length > 0) {
					setSelectedSeason(data[0].season);
					setSelectedDate(data[0].latestDate ?? '');
				}
			} finally {
				setIsLoadingSeasons(false);
			}
		}

		void fetchSeasons();
	}, []);

	// Fetch standings when season/date changes
	useEffect(() => {
		if (!selectedSeason || !selectedDate) {
			return;
		}

		async function fetchStandings() {
			setIsLoadingStandings(true);

			try {
				const response = await fetch(
					`/api/standings?season=${selectedSeason}&date=${selectedDate}`,
				);
				const data = await response.json();

				setStandings(data);
			} finally {
				setIsLoadingStandings(false);
			}
		}

		void fetchStandings();
	}, [selectedSeason, selectedDate]);

	// Get date range for selected season
	const currentSeasonData = seasons.find((s) => s.season === selectedSeason);
	const availableDates = currentSeasonData?.dates ?? [];
	const minDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined;
	const maxDate = availableDates.length > 0 ? availableDates[0] : undefined;

	// Handle season change - reset date to latest for that season
	const handleSeasonChange = (season: string) => {
		setSelectedSeason(season);

		const seasonData = seasons.find((s) => s.season === season);

		if (seasonData?.latestDate) {
			setSelectedDate(seasonData.latestDate);
		}
	};

	// Filter standings by conference
	const alStandings = standings.filter((t) => t.conference === 'AL');
	const nlStandings = standings.filter((t) => t.conference === 'NL');

	if (isLoadingSeasons) {
		return (
			<section>
				<h2 className="mb-4 text-xl font-semibold">MLB Standings</h2>
				<div className="text-muted-foreground">Loading...</div>
			</section>
		);
	}

	if (seasons.length === 0) {
		return (
			<section>
				<h2 className="mb-4 text-xl font-semibold">MLB Standings</h2>
				<div className="text-muted-foreground">No standings data available yet.</div>
			</section>
		);
	}

	return (
		<section>
			<div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-xl font-semibold">MLB Standings</h2>

				<div className="flex items-center gap-3">
					<Select onValueChange={handleSeasonChange} value={selectedSeason}>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Season" />
						</SelectTrigger>
						<SelectContent>
							{seasons.map((s) => (
								<SelectItem key={s.season} value={s.season}>
									{s.season}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<DatePicker
						maxDate={maxDate}
						minDate={minDate}
						onChange={(date) => date && setSelectedDate(date)}
						placeholder="Select date"
						value={selectedDate}
					/>
				</div>
			</div>

			{isLoadingStandings ? (
				<div className="text-muted-foreground">Loading standings...</div>
			) : standings.length === 0 ? (
				<div className="text-muted-foreground">No standings data for this date.</div>
			) : (
				<div className="grid gap-6 lg:grid-cols-2">
					<LeagueStandings divisions={AL_DIVISIONS} standings={alStandings} title="American League" />
					<LeagueStandings divisions={NL_DIVISIONS} standings={nlStandings} title="National League" />
				</div>
			)}
		</section>
	);
}
