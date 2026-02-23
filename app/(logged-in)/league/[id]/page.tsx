import LeagueDetailClient from '@/components/league-detail/league-detail-client';
import { getAuthUser } from '@/lib/auth';
import { getGroupForMember } from '@/server/groups/group.actions';
import { sheetService } from '@/server/sheets/sheet.service';

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

	return (
		<LeagueDetailClient
			initialGroup={group}
			initialSheet={sheet}
		/>
	);
}
