import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import PageShell from '@/components/layout/page-shell';
import ScheduleSkeleton from '@/components/team-detail/schedule-skeleton';
import TeamHeader from '@/components/team-detail/team-header';
import TeamStatsClient from '@/components/team-detail/team-stats-client';
import { getStartedSeasonsWithDates, getTeamDetailData } from '@/server/standings/standings.actions';
import { teamService } from '@/server/teams/team.service';
import { Sport, TeamSummary } from '@/types';

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

const TeamPage = async ({ params, searchParams }: TeamPageProps) => {
	const { abbreviation, league } = await params;
	const { date: dateParam, season: seasonParam } = await searchParams;

	// Validate league
	const sport = league.toUpperCase() as Sport;

	if (!Object.values(Sport).includes(sport)) {
		notFound();
	}

	const [team, seasons, allTeamsRaw] = await Promise.all([
		teamService.findByAbbreviation(abbreviation, sport),
		getStartedSeasonsWithDates(),
		teamService.findBySport(sport),
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

	const allTeams: TeamSummary[] = allTeamsRaw.map((t) => ({
		abbreviation: t.abbreviation,
		city: t.city,
		conference: t.conference,
		division: t.division,
		id: t.id,
		name: t.name,
	}));

	// Fetch team stats at page level so date changes are fast (parallelized internally)
	const { current, history } = await getTeamDetailData(teamId, season, selectedDate);

	return (
		<PageShell>
			<TeamHeader
				allTeams={allTeams}
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
		</PageShell>
	);
};

export default TeamPage;
