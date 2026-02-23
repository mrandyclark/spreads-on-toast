import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, GroupRole, GroupVisibility, PickResult, Sport } from '@/types';

import { getGroupForMember, joinGroupByInviteCode } from './group.actions';

vi.mock('./group.service', () => ({
	groupService: {
		addMember: vi.fn(),
		findByInviteCode: vi.fn(),
		findForMemberPopulated: vi.fn(),
	},
}));

vi.mock('../sheets/sheet.service', () => ({
	sheetService: {
		createForGroup: vi.fn(),
		findByGroupPopulated: vi.fn(),
	},
}));

vi.mock('../standings/standings.actions', () => ({
	calculatePickResult: vi.fn(() => PickResult.Pending),
	getFinalStandings: vi.fn(() => Promise.resolve(new Map())),
	getStandingsDateRange: vi.fn(() => Promise.resolve({ maxDate: null, minDate: null })),
	getStandingsForDate: vi.fn(() => Promise.resolve(new Map())),
}));

vi.mock('@/server/mlb-api', () => ({
	calculateProjectedWins: vi.fn(() => 0),
}));

import { sheetService } from '../sheets/sheet.service';
import { getStandingsDateRange } from '../standings/standings.actions';
import { groupService } from './group.service';

const makeMockGroup = (): Group => ({
	createdAt: new Date(),
	id: 'group1',
	inviteCode: 'ABC123',
	lockDate: new Date('2025-04-01'),
	members: [{ joinedAt: new Date(), role: GroupRole.Owner, user: 'user1' }],
	name: 'Test Group',
	owner: 'user1',
	season: '2025',
	sport: Sport.MLB,
	updatedAt: new Date(),
	visibility: GroupVisibility.Active,
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe('group.actions', () => {
	describe('joinGroupByInviteCode', () => {
		it('returns error for invalid invite code', async () => {
			vi.mocked(groupService.findByInviteCode).mockResolvedValue(null);
			const result = await joinGroupByInviteCode('BADCODE', 'user2');
			expect(result.error).toBe('Invalid invite code');
		});

		it('returns error if already a member', async () => {
			vi.mocked(groupService.findByInviteCode).mockResolvedValue(makeMockGroup());
			const result = await joinGroupByInviteCode('ABC123', 'user1');
			expect(result.error).toBe('You are already a member of this group');
		});

		it('returns error if addMember fails', async () => {
			vi.mocked(groupService.findByInviteCode).mockResolvedValue(makeMockGroup());
			vi.mocked(groupService.addMember).mockResolvedValue(null);
			const result = await joinGroupByInviteCode('ABC123', 'user2');
			expect(result.error).toBe('Failed to join group');
		});

		it('adds member and creates sheet on success', async () => {
			const group = makeMockGroup();
			vi.mocked(groupService.findByInviteCode).mockResolvedValue(group);
			vi.mocked(groupService.addMember).mockResolvedValue(group);
			vi.mocked(sheetService.createForGroup).mockResolvedValue({} as never);

			const result = await joinGroupByInviteCode('ABC123', 'user2');

			expect(result.group).toBe(group);
			expect(groupService.addMember).toHaveBeenCalledWith('group1', 'user2');
			expect(sheetService.createForGroup).toHaveBeenCalledWith({
				group: 'group1',
				season: '2025',
				sport: Sport.MLB,
				user: 'user2',
			});
		});
	});

	describe('getGroupForMember', () => {
		it('returns null when group not found', async () => {
			vi.mocked(groupService.findForMemberPopulated).mockResolvedValue(null);
			const result = await getGroupForMember('group1', 'user1');
			expect(result).toBeNull();
		});

		it('returns group with season dates when available', async () => {
			vi.mocked(groupService.findForMemberPopulated).mockResolvedValue(makeMockGroup());
			vi.mocked(getStandingsDateRange).mockResolvedValue({
				maxDate: new Date('2025-09-28'),
				minDate: new Date('2025-03-27'),
			});

			const result = await getGroupForMember('group1', 'user1');

			expect(result).not.toBeNull();
			expect(result!.seasonStartDate).toEqual(new Date('2025-03-27'));
			expect(result!.seasonEndDate).toEqual(new Date('2025-09-28'));
		});

		it('returns group without season dates when not available', async () => {
			vi.mocked(groupService.findForMemberPopulated).mockResolvedValue(makeMockGroup());
			vi.mocked(getStandingsDateRange).mockResolvedValue({
				maxDate: null,
				minDate: null,
			});

			const result = await getGroupForMember('group1', 'user1');

			expect(result).not.toBeNull();
			expect(result!.seasonStartDate).toBeUndefined();
			expect(result!.seasonEndDate).toBeUndefined();
		});
	});
});
