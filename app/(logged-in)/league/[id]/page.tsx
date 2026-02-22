import LeagueDetailClient from '@/components/league-detail/league-detail-client';
import { getAuthUser } from '@/lib/auth';
import { resolveRefId } from '@/lib/ref-utils';
import { getGroupForMember } from '@/server/groups/group.actions';
import { groupService } from '@/server/groups/group.service';
import { sheetService } from '@/server/sheets/sheet.service';
import { CopyableSheet, Group, Sheet } from '@/types';

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

	// Get copyable sheets from other groups with same sport/season
	const otherGroups = await groupService.findByUserSportSeason(user.id, group.sport, group.season);
	const filteredGroups = otherGroups.filter((g) => g.id !== groupId);
	let copyableSheets: CopyableSheet[] = [];

	if (filteredGroups.length > 0) {
		const otherGroupIds = filteredGroups.map((g) => g.id);
		const sheets = await sheetService.find({ group: { $in: otherGroupIds }, user: user.id });

		copyableSheets = sheets.map((s) => {
			const g = filteredGroups.find((fg) => fg.id === resolveRefId(s.group));

			return {
				groupId: resolveRefId(s.group)!,
				groupName: g?.name ?? 'Unknown',
				sheetId: s.id,
			};
		});
	}

	return (
		<LeagueDetailClient
			initialCopyableSheets={copyableSheets}
			initialGroup={JSON.parse(JSON.stringify(group)) as Group}
			initialSheet={sheet ? JSON.parse(JSON.stringify(sheet)) as Sheet : null}
		/>
	);
}
