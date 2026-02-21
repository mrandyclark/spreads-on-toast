import { getGroupForMember } from '@/server/groups/group.actions';
import { groupService } from '@/server/groups/group.service';
import { errorResponse, jsonResponse, withAuth } from '@/server/http/responses';

export const GET = withAuth(async (_request, { params, user }) => {
	const { id } = await params;

	if (!(await groupService.isMember(id, user.id))) {
		return errorResponse('Forbidden', 403);
	}

	const group = await getGroupForMember(id, user.id);

	if (!group) {
		return errorResponse('Group not found', 404);
	}

	return jsonResponse(group);
});

export const PATCH = withAuth(async (request, { params, user }) => {
	const { id } = await params;

	if (!(await groupService.isOwner(id, user.id))) {
		return errorResponse('Forbidden', 403);
	}

	const body = await request.json();
	const group = await groupService.findByIdAndUpdate(id, {
		$set: {
			...(body.lockDate && { lockDate: new Date(body.lockDate) }),
			...(body.name && { name: body.name }),
			...(body.season && { season: body.season }),
		},
	});

	if (!group) {
		return errorResponse('Group not found', 404);
	}

	return jsonResponse(group);
});

export const DELETE = withAuth(async (_request, { params, user }) => {
	const { id } = await params;

	if (!(await groupService.isOwner(id, user.id))) {
		return errorResponse('Forbidden', 403);
	}

	await groupService.deleteById(id);

	return jsonResponse({ success: true });
});
