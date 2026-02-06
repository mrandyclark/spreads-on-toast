import { createGroup, getGroupsByUser } from '@/server/groups';
import { errorResponse, jsonResponse, withAuth } from '@/server/http/responses';

export const GET = withAuth(async (_request, { user }) => {
	const groups = await getGroupsByUser(user.id);

	return jsonResponse(groups);
});

export const POST = withAuth(async (request, { user }) => {
	const body = await request.json();

	if (!body.name) {
		return errorResponse('Name is required', 400);
	}

	if (!body.sport) {
		return errorResponse('Sport is required', 400);
	}

	if (!body.season) {
		return errorResponse('Season is required', 400);
	}

	if (!body.lockDate) {
		return errorResponse('Lock date is required', 400);
	}

	const group = await createGroup({
		lockDate: new Date(body.lockDate),
		name: body.name,
		owner: user.id,
		season: body.season,
		sport: body.sport,
	});

	return jsonResponse(group, 201);
});
