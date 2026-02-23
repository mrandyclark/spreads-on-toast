import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '@/lib/auth';

import {
	Group,
	GroupRole,
	GroupVisibility,
	LeaderboardEntry,
	PickDirection,
	Sheet,
	Sport,
} from '@/types';

const mockUser: AuthUser = {
	email: 'test@test.com',
	id: 'user1',
	kindeId: 'kinde1',
	nameFirst: 'Test',
	nameLast: 'User',
};

vi.mock('next/cache', () => ({
	revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
	getAuthUser: vi.fn(() => Promise.resolve(mockUser)),
}));

vi.mock('@/server/groups/group.actions', () => ({
	calculateLeaderboard: vi.fn(),
	getGroupForMember: vi.fn(),
	groupService: {
		findById: vi.fn(),
		findByIdAndUpdate: vi.fn(),
		findForMemberPopulated: vi.fn(),
		isMember: vi.fn(),
	},
}));

vi.mock('@/server/groups/group.service', () => ({
	groupService: {
		findByUserSportSeason: vi.fn(),
	},
}));

vi.mock('@/server/seasons/team-line.service', () => ({
	teamLineService: {
		findBySeason: vi.fn(() => Promise.resolve([])),
	},
}));

vi.mock('@/server/sheets/sheet.service', () => ({
	sheetService: {
		find: vi.fn(),
		findByGroupAndUser: vi.fn(),
		findByGroupAndUserPopulated: vi.fn(),
		findById: vi.fn(),
		findByIdAndUpdate: vi.fn(),
		findByUserAndGroupPopulated: vi.fn(),
	},
}));

vi.mock('@/server/standings/standings.actions', () => ({
	calculatePickResult: vi.fn(),
	getFinalStandings: vi.fn(() => Promise.resolve(new Map())),
	getStandingsForDate: vi.fn(() => Promise.resolve(new Map())),
}));

vi.mock('@/server/mlb-api', () => ({
	calculateProjectedWins: vi.fn(() => 0),
}));

import { calculateLeaderboard, getGroupForMember, groupService } from '@/server/groups/group.actions';
import { sheetService } from '@/server/sheets/sheet.service';

import {
	copyPicksFromSheetAction,
	getLeaderboardAction,
	getSheetForMemberAction,
	savePicksAction,
	updateGroupNameAction,
	updateGroupVisibilityAction,
} from './actions';

const mockGroup: Group = {
	createdAt: new Date(),
	id: 'group1',
	inviteCode: 'ABC123',
	lockDate: new Date('2099-04-01'),
	members: [
		{ joinedAt: new Date(), role: GroupRole.Owner, user: 'user1' },
		{ joinedAt: new Date(), role: GroupRole.Member, user: 'user2' },
	],
	name: 'Test Group',
	owner: 'user1',
	season: '2025',
	sport: Sport.MLB,
	updatedAt: new Date(),
	visibility: GroupVisibility.Active,
};

const lockedGroup: Group = {
	...mockGroup,
	lockDate: new Date('2020-01-01'),
};

const mockSheet = {
	id: 'sheet1',
	teamPicks: [
		{ line: 91.5, pick: PickDirection.Over, team: 't1' },
		{ line: 82.5, team: 't2' },
	],
	user: 'user1',
} as unknown as Sheet;

beforeEach(() => {
	vi.clearAllMocks();
});

describe('league app actions', () => {
	describe('updateGroupNameAction', () => {
		it('returns not-found when group missing', async () => {
			vi.mocked(groupService.findById).mockResolvedValue(null);
			const result = await updateGroupNameAction('group1', 'New Name');
			expect(result.error).toBe('not-found');
		});

		it('returns forbidden when user is not admin/owner', async () => {
			const groupWithUser2 = {
				...mockGroup,
				members: [
					{ joinedAt: new Date(), role: GroupRole.Owner, user: 'other' },
					{ joinedAt: new Date(), role: GroupRole.Member, user: 'user1' },
				],
			};
			vi.mocked(groupService.findById).mockResolvedValue(groupWithUser2);
			const result = await updateGroupNameAction('group1', 'New Name');
			expect(result.error).toBe('forbidden');
		});

		it('updates name when user is owner', async () => {
			vi.mocked(groupService.findById).mockResolvedValue(mockGroup);
			vi.mocked(groupService.findByIdAndUpdate).mockResolvedValue(mockGroup);
			const result = await updateGroupNameAction('group1', 'New Name');
			expect(groupService.findByIdAndUpdate).toHaveBeenCalledWith('group1', {
				$set: { name: 'New Name' },
			});
			expect(result.success).toBe(true);
		});
	});

	describe('updateGroupVisibilityAction', () => {
		it('returns not-found when group missing', async () => {
			vi.mocked(groupService.findById).mockResolvedValue(null);
			const result = await updateGroupVisibilityAction('group1', GroupVisibility.Archived);
			expect(result.error).toBe('not-found');
		});

		it('updates visibility when user is owner', async () => {
			vi.mocked(groupService.findById).mockResolvedValue(mockGroup);
			vi.mocked(groupService.findByIdAndUpdate).mockResolvedValue(mockGroup);
			const result = await updateGroupVisibilityAction('group1', GroupVisibility.Archived);
			expect(groupService.findByIdAndUpdate).toHaveBeenCalledWith('group1', {
				$set: { visibility: GroupVisibility.Archived },
			});
			expect(result.success).toBe(true);
		});
	});

	describe('copyPicksFromSheetAction', () => {
		it('returns not-found when source sheet missing', async () => {
			vi.mocked(sheetService.findById).mockResolvedValue(null);
			const result = await copyPicksFromSheetAction('group1', 'sheet-bad');
			expect(result.error).toBe('not-found');
		});

		it('returns not-found when source sheet belongs to different user', async () => {
			vi.mocked(sheetService.findById).mockResolvedValue({ ...mockSheet, user: 'other' } as never);
			const result = await copyPicksFromSheetAction('group1', 'sheet1');
			expect(result.error).toBe('not-found');
		});

		it('returns locked when group is past lock date', async () => {
			vi.mocked(sheetService.findById).mockResolvedValue(mockSheet);
			vi.mocked(sheetService.findByGroupAndUser).mockResolvedValue(mockSheet);
			vi.mocked(groupService.findById).mockResolvedValue(lockedGroup);
			const result = await copyPicksFromSheetAction('group1', 'sheet1');
			expect(result.error).toBe('locked');
		});
	});

	describe('getSheetForMemberAction', () => {
		it('returns not-found when group not found for user', async () => {
			vi.mocked(getGroupForMember).mockResolvedValue(null);
			const result = await getSheetForMemberAction('group1', 'user2');
			expect(result.error).toBe('not-found');
		});

		it('returns not-found when sheet not found', async () => {
			vi.mocked(getGroupForMember).mockResolvedValue(mockGroup as never);
			vi.mocked(sheetService.findByGroupAndUserPopulated).mockResolvedValue(null);
			const result = await getSheetForMemberAction('group1', 'user2');
			expect(result.error).toBe('not-found');
		});

		it('returns sheet when found', async () => {
			vi.mocked(getGroupForMember).mockResolvedValue(mockGroup as never);
			vi.mocked(sheetService.findByGroupAndUserPopulated).mockResolvedValue(mockSheet);
			const result = await getSheetForMemberAction('group1', 'user2');
			expect(result.sheet).toBe(mockSheet);
		});
	});

	describe('savePicksAction', () => {
		it('returns not-found when sheet missing', async () => {
			vi.mocked(sheetService.findByGroupAndUserPopulated).mockResolvedValue(null);
			const result = await savePicksAction('group1', { teamPicks: {} });
			expect(result.error).toBe('not-found');
		});

		it('returns locked when past lock date', async () => {
			vi.mocked(sheetService.findByGroupAndUserPopulated).mockResolvedValue(mockSheet);
			vi.mocked(getGroupForMember).mockResolvedValue(lockedGroup as never);
			const result = await savePicksAction('group1', { teamPicks: {} });
			expect(result.error).toBe('locked');
		});

		it('saves picks and revalidates path', async () => {
			vi.mocked(sheetService.findByGroupAndUserPopulated).mockResolvedValue(mockSheet);
			vi.mocked(getGroupForMember).mockResolvedValue(mockGroup as never);
			vi.mocked(sheetService.findByIdAndUpdate).mockResolvedValue(mockSheet);

			const result = await savePicksAction('group1', {
				teamPicks: { t1: 'over', t2: 'under' },
			});

			expect(sheetService.findByIdAndUpdate).toHaveBeenCalled();
			expect(result.sheet).toBeDefined();
		});
	});

	describe('getLeaderboardAction', () => {
		it('returns not-found when group not found', async () => {
			vi.mocked(groupService.findForMemberPopulated).mockResolvedValue(null);
			const result = await getLeaderboardAction('group1');
			expect(result.error).toBe('not-found');
		});

		it('returns leaderboard with isCurrentUser set', async () => {
			vi.mocked(groupService.findForMemberPopulated).mockResolvedValue(mockGroup);
			const entries: LeaderboardEntry[] = [
				{ isCurrentUser: false, losses: 5, pushes: 1, total: 16, userId: 'user1', userInitials: 'TU', userName: 'Test User', winPct: 63, wins: 10 },
				{ isCurrentUser: false, losses: 8, pushes: 0, total: 16, userId: 'user2', userInitials: 'OT', userName: 'Other', winPct: 50, wins: 8 },
			];
			vi.mocked(calculateLeaderboard).mockResolvedValue(entries);

			const result = await getLeaderboardAction('group1');

			expect(result.leaderboard).toBeDefined();
			expect(result.leaderboard!.entries[0].isCurrentUser).toBe(true);
			expect(result.leaderboard!.entries[1].isCurrentUser).toBe(false);
		});

		it('passes date through to calculateLeaderboard', async () => {
			vi.mocked(groupService.findForMemberPopulated).mockResolvedValue(mockGroup);
			vi.mocked(calculateLeaderboard).mockResolvedValue([]);

			await getLeaderboardAction('group1', '2025-06-15');

			expect(calculateLeaderboard).toHaveBeenCalledWith(mockGroup, 'group1', '2025-06-15');
		});
	});
});
