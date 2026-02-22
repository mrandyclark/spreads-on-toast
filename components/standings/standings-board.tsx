'use client';

import { useEffect, useState } from 'react';

import DatePicker from '@/components/ui/date-picker';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { AL_DIVISIONS, NL_DIVISIONS } from '@/lib/constants';
import { SeasonWithDates, StandingsBoardData } from '@/types';

import LeagueStandings from './league-standings';

const MlbStandingsBoard = () => {
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

			{isLoadingStandings && (
				<div className="text-muted-foreground">Loading standings...</div>
			)}
			{!isLoadingStandings && standings.length === 0 && (
				<div className="text-muted-foreground">No standings data for this date.</div>
			)}
			{!isLoadingStandings && standings.length > 0 && (
				<div className="grid min-w-0 gap-6 lg:grid-cols-2">
					<LeagueStandings divisions={AL_DIVISIONS} standings={alStandings} title="American League" />
					<LeagueStandings divisions={NL_DIVISIONS} standings={nlStandings} title="National League" />
				</div>
			)}
		</section>
	);
};

export default MlbStandingsBoard;
