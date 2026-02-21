import { errorResponse, jsonResponse, withAuth } from '@/server/http/responses';
import { deleteSign, getSign, isMember, isOwner, updateSign } from '@/server/signs/sign.actions';

export const GET = withAuth(async (_request, { params, user }) => {
	const { id } = await params;

	if (!(await isMember(id, user.id))) {
		return errorResponse('Forbidden', 403);
	}

	const sign = await getSign(id);

	if (!sign) {
		return errorResponse('Sign not found', 404);
	}

	return jsonResponse(sign);
});

export const PATCH = withAuth(async (request, { params, user }) => {
	const { id } = await params;

	if (!(await isOwner(id, user.id))) {
		return errorResponse('Forbidden', 403);
	}

	const body = await request.json();
	const sign = await updateSign(id, {
		config: body.config,
		title: body.title,
	});

	if (!sign) {
		return errorResponse('Sign not found', 404);
	}

	return jsonResponse(sign);
});

export const DELETE = withAuth(async (_request, { params, user }) => {
	const { id } = await params;

	if (!(await isOwner(id, user.id))) {
		return errorResponse('Forbidden', 403);
	}

	await deleteSign(id);

	return jsonResponse({ success: true });
});
