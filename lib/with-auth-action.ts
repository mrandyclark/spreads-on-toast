import { AuthUser, getAuthUser } from './auth';

type ActionResult<T> = { error?: string } & T;

/**
 * Higher-order function that wraps a server action with authentication.
 * Returns a new function that handles auth check before calling the action.
 *
 * @example
 * export const getGroupAction = withAuth(async (user, groupId: string) => {
 *   const group = await getGroupForMember(groupId, user.id);
 *   return { group };
 * });
 */
export function withAuth<TArgs extends unknown[], TResult extends object>(
	action: (user: AuthUser, ...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<ActionResult<TResult>> {
	return async (...args: TArgs): Promise<ActionResult<TResult>> => {
		const user = await getAuthUser();

		if (!user) {
			return { error: 'Unauthorized' } as ActionResult<TResult>;
		}

		return action(user, ...args);
	};
}
