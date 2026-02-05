import { deleteGroup, getGroupForMember, isGroupMember, isGroupOwner, updateGroup } from '@/server/groups';
import { errorResponse, jsonResponse, withAuth } from '@/server/http/responses';

export const GET = withAuth(async (_request, { params, user }) => {
  const { id } = await params;

  if (!(await isGroupMember(id, user.id))) {
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

  if (!(await isGroupOwner(id, user.id))) {
    return errorResponse('Forbidden', 403);
  }

  const body = await request.json();
  const group = await updateGroup(id, {
    lockDate: body.lockDate ? new Date(body.lockDate) : undefined,
    name: body.name,
    season: body.season,
  });

  if (!group) {
    return errorResponse('Group not found', 404);
  }

  return jsonResponse(group);
});

export const DELETE = withAuth(async (_request, { params, user }) => {
  const { id } = await params;

  if (!(await isGroupOwner(id, user.id))) {
    return errorResponse('Forbidden', 403);
  }

  await deleteGroup(id);

  return jsonResponse({ success: true });
});
