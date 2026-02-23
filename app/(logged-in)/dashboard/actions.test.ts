import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '@/lib/auth';
import type { Group, Season } from '@/types';

import { Sport } from '@/types';

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
	joinGroupByInviteCode: vi.fn(),
}));

vi.mock('@/server/groups/group.service', () => ({
	groupService: {
		createGroup: vi.fn(),
	},
}));

vi.mock('@/server/seasons/season.service', () => ({
	seasonService: {
		findBySport: vi.fn(),
	},
}));

vi.mock('@/server/standings/standings.actions', () => ({
	getStandingsBoardData: vi.fn(),
}));

import { joinGroupByInviteCode } from '@/server/groups/group.actions';
import { groupService } from '@/server/groups/group.service';
import { seasonService } from '@/server/seasons/season.service';
import { getStandingsBoardData } from '@/server/standings/standings.actions';

import { createGroupAction, getSeasonsAction, getStandingsAction, joinGroupAction } from './actions';

const mockGroup = { id: 'group1', name: 'Test' } as unknown as Group;

beforeEach(() => {
	vi.clearAllMocks();
});

describe('dashboard app actions', () => {
	describe('getSeasonsAction', () => {
		it('returns seasons for sport', async () => {
			const mockSeasons = [{ id: 's1', season: '2025' }] as unknown as Season[];
			vi.mocked(seasonService.findBySport).mockResolvedValue(mockSeasons);

			const result = await getSeasonsAction(Sport.MLB);

			expect(seasonService.findBySport).toHaveBeenCalledWith(Sport.MLB);
			expect(result.seasons).toEqual(mockSeasons);
		});
	});

	describe('createGroupAction', () => {
		it('returns validation error for empty name', async () => {
			const result = await createGroupAction({
				lockDate: '2025-04-01',
				name: '   ',
				season: '2025',
				sport: Sport.MLB,
			});
			expect(result.error).toBe('validation');
			expect(result.errorMessage).toBe('Group name is required');
		});

		it('creates group on valid input', async () => {
			vi.mocked(groupService.createGroup).mockResolvedValue(mockGroup);

			const result = await createGroupAction({
				lockDate: '2025-04-01',
				name: 'My Group',
				season: '2025',
				sport: Sport.MLB,
			});

			expect(groupService.createGroup).toHaveBeenCalledWith({
				lockDate: new Date('2025-04-01'),
				name: 'My Group',
				owner: 'user1',
				season: '2025',
				sport: Sport.MLB,
			});
			expect(result.group).toBe(mockGroup);
		});

		it('returns server error on exception', async () => {
			vi.mocked(groupService.createGroup).mockRejectedValue(new Error('DB error'));

			const result = await createGroupAction({
				lockDate: '2025-04-01',
				name: 'My Group',
				season: '2025',
				sport: Sport.MLB,
			});

			expect(result.error).toBe('server-error');
		});
	});

	describe('joinGroupAction', () => {
		it('returns validation error for empty invite code', async () => {
			const result = await joinGroupAction('   ');
			expect(result.error).toBe('validation');
		});

		it('returns validation error when join fails', async () => {
			vi.mocked(joinGroupByInviteCode).mockResolvedValue({ error: 'Invalid invite code' });

			const result = await joinGroupAction('BADCODE');

			expect(result.error).toBe('validation');
			expect(result.errorMessage).toBe('Invalid invite code');
		});

		it('returns group on success', async () => {
			vi.mocked(joinGroupByInviteCode).mockResolvedValue({ group: mockGroup });

			const result = await joinGroupAction('ABC123');

			expect(joinGroupByInviteCode).toHaveBeenCalledWith('ABC123', 'user1');
			expect(result.group).toBe(mockGroup);
		});

		it('returns server error on exception', async () => {
			vi.mocked(joinGroupByInviteCode).mockRejectedValue(new Error('DB error'));

			const result = await joinGroupAction('ABC123');

			expect(result.error).toBe('server-error');
		});
	});

	describe('getStandingsAction', () => {
		it('returns validation error when season missing', async () => {
			const result = await getStandingsAction('', '2025-06-15');
			expect(result.error).toBe('validation');
		});

		it('returns validation error when date missing', async () => {
			const result = await getStandingsAction('2025', '');
			expect(result.error).toBe('validation');
		});

		it('returns standings data', async () => {
			const mockStandings = [{ teamId: 't1', wins: 50 }];
			vi.mocked(getStandingsBoardData).mockResolvedValue(mockStandings as never);

			const result = await getStandingsAction('2025', '2025-06-15');

			expect(getStandingsBoardData).toHaveBeenCalledWith('2025', '2025-06-15');
			expect(result.standings).toEqual(mockStandings);
		});
	});
});
