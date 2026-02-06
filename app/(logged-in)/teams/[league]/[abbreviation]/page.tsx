import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/layout/site-header';
import { dbConnect } from '@/lib/mongoose';
import { TeamModel } from '@/models/team.model';
import { getStartedSeasonsWithDates, getTeamDetailData } from '@/server/standings';
import { Sport } from '@/types';

import { TeamDetailClient } from './team-detail-client';

interface TeamPageProps {
	params: Promise<{
		abbreviation: string;
		league: string;
	}>;
	searchParams: Promise<{
		date?: string;
		season?: string;
	}>;
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
	const { abbreviation, league } = await params;
	const { date: dateParam, season: seasonParam } = await searchParams;

	// Validate league
	const sport = league.toUpperCase() as Sport;

	if (!Object.values(Sport).includes(sport)) {
		notFound();
	}

	await dbConnect();

	// Find team by abbreviation (case-insensitive)
	const team = await TeamModel.findOne({
		abbreviation: abbreviation.toUpperCase(),
		sport,
	});

	if (!team) {
		notFound();
	}

	// Get available seasons and dates
	const seasons = await getStartedSeasonsWithDates();

	// Default to first season (most recent) if not specified
	const season = seasonParam ?? seasons[0]?.season ?? '2025';
	const currentSeasonData = seasons.find((s) => s.season === season);
	const availableDates = currentSeasonData?.dates ?? [];

	// Default to latest date if not specified
	const selectedDate = dateParam ?? currentSeasonData?.latestDate ?? '';

	// Get team detail data for the selected date
	const { current, history } = await getTeamDetailData(team._id.toString(), season, selectedDate);

	// Convert to plain strings to avoid Mongoose document serialization issues
	const teamCity = String(team.city);
	const teamName = String(team.name);
	const teamAbbreviation = String(team.abbreviation).toLowerCase();

	return (
		<div className="bg-background min-h-screen">
			<SiteHeader />

			<main className="mx-auto max-w-5xl px-4 py-8">
				<TeamDetailClient
					availableDates={availableDates}
					current={current}
					history={history}
					season={season}
					seasons={seasons}
					selectedDate={selectedDate}
					teamAbbreviation={teamAbbreviation}
					teamCity={teamCity}
					teamName={teamName}
				/>
			</main>
		</div>
	);
}
