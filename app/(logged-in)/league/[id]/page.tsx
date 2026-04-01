import LeagueDetailClient from '@/components/league-detail/league-detail-client';
import { getAuthUser } from '@/lib/auth';
import { resolveRefId } from '@/lib/ref-utils';
import { getGroupForMember } from '@/server/groups/group.actions';
import { teamLineService } from '@/server/seasons/team-line.service';
import { sheetService } from '@/server/sheets/sheet.service';
import { standingService } from '@/server/standings/standing.service';

export default async function LeagueDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: groupId } = await params;
	const user = await getAuthUser();

	if (!user) {
		return null;
	}

	const [group, sheet] = await Promise.all([
		getGroupForMember(groupId, user.id),
		sheetService.findByGroupAndUserPopulated(groupId, user.id),
	]);

	if (!group) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Group not found</div>
			</div>
		);
	}

	const [teamLines, standings] = await Promise.all([
		teamLineService.findBySeason(group.sport, group.season),
		standingService.findAllForLatestDate(group.season, {
			select: 'team projectedWins gamesPlayed',
		}),
	]);

	const linesByTeamId: Record<string, number> = {};
	const projectedWinsByTeamId: Record<string, number> = {};
	const gamesPlayedByTeamId: Record<string, number> = {};

	for (const tl of teamLines) {
		linesByTeamId[resolveRefId(tl.team)] = tl.line;
	}

	for (const standing of standings) {
		const teamId = resolveRefId(standing.team);
		projectedWinsByTeamId[teamId] = standing.projectedWins;
		gamesPlayedByTeamId[teamId] = standing.gamesPlayed;
	}

	return (
		<LeagueDetailClient
			gamesPlayedByTeamId={gamesPlayedByTeamId}
			initialGroup={group}
			initialSheet={sheet}
			linesByTeamId={linesByTeamId}
			projectedWinsByTeamId={projectedWinsByTeamId}
		/>
	);
}
