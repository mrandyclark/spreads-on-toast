import { createSign, getSignsByUser } from '@/server/signs';
import { errorResponse, jsonResponse, withAuth } from '@/server/http/responses';

export const GET = withAuth(async (_request, { user }) => {
	const signs = await getSignsByUser(user.id);

	return jsonResponse(signs);
});

export const POST = withAuth(async (request, { user }) => {
	const body = await request.json();

	if (!body.title) {
		return errorResponse('Title is required', 400);
	}

	const sign = await createSign({
		owner: user.id,
		title: body.title,
	});

	return jsonResponse(sign, 201);
});
