'use client';

import { useRouter } from 'next/navigation';

import BackLink from '@/components/layout/back-link';
import TeamSwitcher from '@/components/team-detail/team-switcher';
import DatePicker from '@/components/ui/date-picker';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { SeasonWithDates, TeamSummary } from '@/types';

interface TeamHeaderProps {
	allTeams: TeamSummary[];
	availableDates: string[];
	children: React.ReactNode;
	season: string;
	seasons: SeasonWithDates[];
	selectedDate: string;
	teamAbbreviation: string;
	teamCity: string;
	teamName: string;
}

const TeamHeader = ({
	allTeams,
	availableDates,
	children,
	season,
	seasons,
	selectedDate,
	teamAbbreviation,
	teamCity,
	teamName,
}: TeamHeaderProps) => {
	const router = useRouter();

	const minDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined;
	const maxDate = availableDates.length > 0 ? availableDates[0] : undefined;

	const handleSeasonChange = (newSeason: string) => {
		router.push(`/teams/mlb/${teamAbbreviation}?season=${newSeason}`);
	};

	const handleDateChange = (newDate: string | undefined) => {
		if (newDate) {
			router.push(`/teams/mlb/${teamAbbreviation}?season=${season}&date=${newDate}`);
		}
	};

	return (
		<div className="space-y-6">
			{/* Back link */}
			<BackLink href="/dashboard" label="Dashboard" />

			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-foreground text-2xl font-bold sm:text-3xl">
							{teamCity} {teamName}
						</h1>
						<TeamSwitcher
							currentAbbreviation={teamAbbreviation}
							season={season}
							teams={allTeams}
						/>
					</div>
					<p className="text-muted-foreground mt-1">{season} Season</p>
				</div>

				<div className="flex items-center gap-3">
					<Select onValueChange={handleSeasonChange} value={season}>
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
						onChange={handleDateChange}
						placeholder="Select date"
						value={selectedDate}
					/>
				</div>
			</div>

			{children}
		</div>
	);
};

export default TeamHeader;
