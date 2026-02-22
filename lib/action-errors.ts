export interface ActionError {
	error: ActionErrorCode;
	errorCode: number;
	errorMessage: string;
}

export type ActionErrorCode =
	| 'forbidden'
	| 'locked'
	| 'not-found'
	| 'server-error'
	| 'unauthorized'
	| 'validation';

export const notFound = (resource: string) => ({
	error: 'not-found' as const,
	errorCode: 404,
	errorMessage: `${resource} not found`,
});

export const unauthorized = () => ({
	error: 'unauthorized' as const,
	errorCode: 401,
	errorMessage: 'Unauthorized',
});

export const forbidden = (action?: string) => ({
	error: 'forbidden' as const,
	errorCode: 403,
	errorMessage: action ? `Not authorized to ${action}` : 'Not authorized',
});

export const validation = (message: string) => ({
	error: 'validation' as const,
	errorCode: 400,
	errorMessage: message,
});

export const locked = (resource: string) => ({
	error: 'locked' as const,
	errorCode: 423,
	errorMessage: `${resource} are locked`,
});

export const serverError = (action: string) => ({
	error: 'server-error' as const,
	errorCode: 500,
	errorMessage: `Failed to ${action}`,
});
