import { NextRequest, NextResponse } from 'next/server';

import { AuthUser, getAuthUser } from '@/lib/auth';

export function jsonResponse<T>(data: T, status = 200) {
	return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 500) {
	return NextResponse.json({ error: message }, { status });
}

type RouteParams = { params: Promise<Record<string, string>> };

type RouteHandler = (request: NextRequest, context: RouteParams) => Promise<NextResponse>;

type AuthRouteHandler = (
	request: NextRequest,
	context: RouteParams & { user: AuthUser },
) => Promise<NextResponse>;

function handleError(error: unknown) {
	console.error('API Error:', error);

	if (error instanceof Error) {
		if (error.message.includes('duplicate key')) {
			return errorResponse('Resource already exists', 409);
		}

		if (process.env.NODE_ENV === 'development') {
			return errorResponse(error.message, 500);
		}
	}

	return errorResponse('Internal server error', 500);
}

/**
 * Wrap a route handler with authentication and error handling
 */
export function withAuth(handler: AuthRouteHandler): RouteHandler {
	return async (request: NextRequest, context: RouteParams) => {
		try {
			const user = await getAuthUser();

			if (!user) {
				return errorResponse('Unauthorized', 401);
			}

			return await handler(request, { ...context, user });
		} catch (error) {
			return handleError(error);
		}
	};
}
