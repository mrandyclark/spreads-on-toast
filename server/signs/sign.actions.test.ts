import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Sign, SignRole } from '@/types';

import { createSign, deleteSign, getSign, getSignsForUser, isMember, isOwner, updateSign, updateSignConfig } from './sign.actions';

vi.mock('./sign.service', () => ({
	signService: {
		createSign: vi.fn(),
		deleteById: vi.fn(),
		find: vi.fn(),
		findById: vi.fn(),
		findByIdAndUpdate: vi.fn(),
		findByUser: vi.fn(),
		isMember: vi.fn(),
		isOwner: vi.fn(),
		updateConfig: vi.fn(),
	},
}));

vi.mock('../teams/team.service', () => ({
	teamService: {
		findMlbTeams: vi.fn(),
	},
}));

import { signService } from './sign.service';

const mockSign = {
	config: {},
	id: 'sign1',
	members: [{ role: SignRole.Owner, user: 'user1' }],
	owner: 'user1',
	title: 'My Sign',
} as unknown as Sign;

beforeEach(() => {
	vi.clearAllMocks();
});

describe('sign.actions', () => {
	describe('getSignsForUser', () => {
		it('delegates to signService.findByUser', async () => {
			vi.mocked(signService.findByUser).mockResolvedValue([mockSign]);
			const result = await getSignsForUser('user1');
			expect(signService.findByUser).toHaveBeenCalledWith('user1');
			expect(result).toEqual([mockSign]);
		});
	});

	describe('getSign', () => {
		it('delegates to signService.findById', async () => {
			vi.mocked(signService.findById).mockResolvedValue(mockSign);
			const result = await getSign('sign1');
			expect(signService.findById).toHaveBeenCalledWith('sign1');
			expect(result).toBe(mockSign);
		});

		it('returns null when not found', async () => {
			vi.mocked(signService.findById).mockResolvedValue(null);
			const result = await getSign('missing');
			expect(result).toBeNull();
		});
	});

	describe('createSign', () => {
		it('delegates to signService.createSign', async () => {
			vi.mocked(signService.createSign).mockResolvedValue(mockSign);
			const result = await createSign('user1', 'My Sign');
			expect(signService.createSign).toHaveBeenCalledWith('user1', 'My Sign');
			expect(result).toBe(mockSign);
		});
	});

	describe('isMember', () => {
		it('returns true when user is member', async () => {
			vi.mocked(signService.isMember).mockResolvedValue(true);
			expect(await isMember('sign1', 'user1')).toBe(true);
		});

		it('returns false when user is not member', async () => {
			vi.mocked(signService.isMember).mockResolvedValue(false);
			expect(await isMember('sign1', 'user2')).toBe(false);
		});
	});

	describe('isOwner', () => {
		it('returns true when user is owner', async () => {
			vi.mocked(signService.isOwner).mockResolvedValue(true);
			expect(await isOwner('sign1', 'user1')).toBe(true);
		});
	});

	describe('deleteSign', () => {
		it('delegates to signService.deleteById', async () => {
			vi.mocked(signService.deleteById).mockResolvedValue(true);
			expect(await deleteSign('sign1')).toBe(true);
		});
	});

	describe('updateSign', () => {
		it('updates title via $set', async () => {
			vi.mocked(signService.findByIdAndUpdate).mockResolvedValue(mockSign);
			await updateSign('sign1', { title: 'New Title' });
			expect(signService.findByIdAndUpdate).toHaveBeenCalledWith('sign1', {
				$set: { title: 'New Title' },
			});
		});

		it('flattens nested config to dot notation', async () => {
			vi.mocked(signService.findByIdAndUpdate).mockResolvedValue(mockSign);
			await updateSign('sign1', {
				config: { standings: { showDivision: true } } as never,
			});
			expect(signService.findByIdAndUpdate).toHaveBeenCalledWith('sign1', {
				$set: { 'config.standings.showDivision': true },
			});
		});

		it('returns current sign when no fields to update', async () => {
			vi.mocked(signService.findById).mockResolvedValue(mockSign);
			await updateSign('sign1', {});
			expect(signService.findById).toHaveBeenCalledWith('sign1');
			expect(signService.findByIdAndUpdate).not.toHaveBeenCalled();
		});
	});

	describe('updateSignConfig', () => {
		it('updates config when user is owner', async () => {
			vi.mocked(signService.isOwner).mockResolvedValue(true);
			vi.mocked(signService.updateConfig).mockResolvedValue(mockSign);
			const result = await updateSignConfig('sign1', 'user1', { standings: { showDivision: true } } as never);
			expect(result).toEqual({ sign: mockSign });
		});

		it('returns error when user is not owner', async () => {
			vi.mocked(signService.isOwner).mockResolvedValue(false);
			const result = await updateSignConfig('sign1', 'user2', {});
			expect(result.error).toBe('Only the sign owner can update settings');
		});

		it('returns error when sign not found after update', async () => {
			vi.mocked(signService.isOwner).mockResolvedValue(true);
			vi.mocked(signService.updateConfig).mockResolvedValue(null);
			const result = await updateSignConfig('sign1', 'user1', {});
			expect(result.error).toBe('Sign not found');
		});
	});
});
