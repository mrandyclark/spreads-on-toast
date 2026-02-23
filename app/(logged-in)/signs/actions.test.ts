import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '@/lib/auth';
import type { Sign } from '@/types';

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

vi.mock('@/server/signs/sign.actions', () => ({
	createSign: vi.fn(),
	updateSignConfig: vi.fn(),
}));

import { createSign, updateSignConfig } from '@/server/signs/sign.actions';

import { createSignAction, updateSignConfigAction } from './actions';

const mockSign = { id: 'sign1', title: 'My Sign' } as unknown as Sign;

beforeEach(() => {
	vi.clearAllMocks();
});

describe('signs app actions', () => {
	describe('createSignAction', () => {
		it('returns validation error for empty title', async () => {
			const result = await createSignAction('   ');
			expect(result.error).toBe('validation');
			expect(result.errorMessage).toBe('Sign name is required');
		});

		it('creates sign and returns it', async () => {
			vi.mocked(createSign).mockResolvedValue(mockSign);
			const result = await createSignAction('My Sign');
			expect(createSign).toHaveBeenCalledWith('user1', 'My Sign');
			expect(result.sign).toBe(mockSign);
		});

		it('returns server error on exception', async () => {
			vi.mocked(createSign).mockRejectedValue(new Error('DB error'));
			const result = await createSignAction('My Sign');
			expect(result.error).toBe('server-error');
		});
	});

	describe('updateSignConfigAction', () => {
		it('returns result from updateSignConfig', async () => {
			vi.mocked(updateSignConfig).mockResolvedValue({ sign: mockSign });
			const result = await updateSignConfigAction('sign1', { standings: {} } as never);
			expect(updateSignConfig).toHaveBeenCalledWith('sign1', 'user1', { standings: {} });
			expect(result.sign).toBe(mockSign);
		});

		it('returns server error on exception', async () => {
			vi.mocked(updateSignConfig).mockRejectedValue(new Error('DB error'));
			const result = await updateSignConfigAction('sign1', {});
			expect(result.error).toBe('server-error');
		});
	});
});
