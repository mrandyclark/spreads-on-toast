import { describe, expect, it } from 'vitest';

import { forbidden, locked, notFound, serverError, unauthorized, validation } from './action-errors';

describe('action-errors', () => {
	describe('notFound', () => {
		it('returns 404 with resource name', () => {
			const result = notFound('Group');
			expect(result).toEqual({
				error: 'not-found',
				errorCode: 404,
				errorMessage: 'Group not found',
			});
		});
	});

	describe('unauthorized', () => {
		it('returns 401', () => {
			const result = unauthorized();
			expect(result).toEqual({
				error: 'unauthorized',
				errorCode: 401,
				errorMessage: 'Unauthorized',
			});
		});
	});

	describe('forbidden', () => {
		it('returns 403 with action', () => {
			const result = forbidden('edit group');
			expect(result).toEqual({
				error: 'forbidden',
				errorCode: 403,
				errorMessage: 'Not authorized to edit group',
			});
		});

		it('returns 403 without action', () => {
			const result = forbidden();
			expect(result).toEqual({
				error: 'forbidden',
				errorCode: 403,
				errorMessage: 'Not authorized',
			});
		});
	});

	describe('validation', () => {
		it('returns 400 with message', () => {
			const result = validation('Name is required');
			expect(result).toEqual({
				error: 'validation',
				errorCode: 400,
				errorMessage: 'Name is required',
			});
		});
	});

	describe('locked', () => {
		it('returns 423 with resource', () => {
			const result = locked('Picks');
			expect(result).toEqual({
				error: 'locked',
				errorCode: 423,
				errorMessage: 'Picks are locked',
			});
		});
	});

	describe('serverError', () => {
		it('returns 500 with action', () => {
			const result = serverError('save picks');
			expect(result).toEqual({
				error: 'server-error',
				errorCode: 500,
				errorMessage: 'Failed to save picks',
			});
		});
	});
});
