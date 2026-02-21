import { errorResponse, jsonResponse, withAuth } from '@/server/http/responses';
import { createSign, getSignsForUser } from '@/server/signs/sign.actions';

export const GET = withAuth(async (_request, { user }) => {
	const signs = await getSignsForUser(user.id);

	return jsonResponse(signs);
});

export const POST = withAuth(async (request, { user }) => {
	const body = await request.json();

	if (!body.title) {
		return errorResponse('Title is required', 400);
	}

	const sign = await createSign(user.id, body.title);

	return jsonResponse(sign, 201);
});
