import DashboardClient from '@/components/dashboard/dashboard-client';
import { getAuthUser } from '@/lib/auth';
import { groupService } from '@/server/groups/group.service';
import { seasonService } from '@/server/seasons/season.service';
import { getStartedSeasonsWithDates } from '@/server/standings/standings.actions';
import { Sport } from '@/types';

export default async function Dashboard() {
	const user = await getAuthUser();

	if (!user) {
		return null;
	}

	const [groups, seasons, standingsSeasons] = await Promise.all([
		groupService.findByUser(user.id),
		seasonService.findBySport(Sport.MLB),
		getStartedSeasonsWithDates(),
	]);

	return (
		<DashboardClient
			initialGroups={groups}
			initialSeasons={seasons}
			initialStandingsSeasons={standingsSeasons}
		/>
	);
}
