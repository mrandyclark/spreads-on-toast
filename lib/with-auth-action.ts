import { ActionError, unauthorized } from './action-errors';
import { AuthUser, getAuthUser } from './auth';

// Distributes Partial across union members, then merges into a single flat type
type DistributePartial<T> = T extends unknown ? Partial<T> : never;
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type ActionResult<T> = UnionToIntersection<DistributePartial<ActionError | T>>;

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
			return unauthorized() as ActionResult<TResult>;
		}

		return action(user, ...args) as ActionResult<TResult>;
	};
}
