import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { SiteHeader } from '@/components/layout/site-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getStartedSeasonsWithDates, getTeamDetailData } from '@/server/standings/standings.actions';
import { teamService } from '@/server/teams/team.service';
import { Sport } from '@/types';

import { TeamHeader, TeamStatsClient } from './team-detail-client';
import { TeamScheduleSection } from './team-schedule-section';

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

function SectionSkeleton({ height = 'h-48' }: { height?: string }) {
	return (
		<Card>
			<CardHeader>
				<div className="bg-muted h-5 w-40 animate-pulse rounded" />
			</CardHeader>
			<CardContent>
				<div className={`bg-muted ${height} w-full animate-pulse rounded`} />
			</CardContent>
		</Card>
	);
}

function ScheduleSkeleton() {
	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<SectionSkeleton />
			<SectionSkeleton />
		</div>
	);
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
	const { abbreviation, league } = await params;
	const { date: dateParam, season: seasonParam } = await searchParams;

	// Validate league
	const sport = league.toUpperCase() as Sport;

	if (!Object.values(Sport).includes(sport)) {
		notFound();
	}

	const [team, seasons] = await Promise.all([
		teamService.findByAbbreviation(abbreviation, sport),
		getStartedSeasonsWithDates(),
	]);

	if (!team) {
		notFound();
	}

	const season = seasonParam ?? seasons[0]?.season ?? '2025';
	const currentSeasonData = seasons.find((s) => s.season === season);
	const availableDates = currentSeasonData?.dates ?? [];
	const selectedDate = dateParam ?? currentSeasonData?.latestDate ?? '';

	const teamId = team.id;
	const teamCity = team.city;
	const teamName = team.name;
	const teamAbbreviation = team.abbreviation.toLowerCase();

	// Fetch team stats at page level so date changes are fast (parallelized internally)
	const { current, history } = await getTeamDetailData(teamId, season, selectedDate);

	return (
		<div className="bg-background min-h-screen">
			<SiteHeader />

			<main className="mx-auto max-w-5xl px-4 py-8">
				<TeamHeader
					availableDates={availableDates}
					season={season}
					seasons={seasons}
					selectedDate={selectedDate}
					teamAbbreviation={teamAbbreviation}
					teamCity={teamCity}
					teamName={teamName}>
					<TeamStatsClient
						current={current}
						history={history}
						season={season}
						selectedDate={selectedDate}
					/>

					<Suspense fallback={<ScheduleSkeleton />}>
						<TeamScheduleSection
							season={season}
							selectedDate={selectedDate}
							teamAbbreviation={teamAbbreviation}
							teamId={teamId}
						/>
					</Suspense>
				</TeamHeader>
			</main>
		</div>
	);
}
