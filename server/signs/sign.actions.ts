import { Sign, SignConfig, Team } from '@/types';

import { teamService } from '../teams/team.service';
import { signService } from './sign.service';

export { signService };

/**
 * Get all signs for a user
 */
export async function getSignsForUser(userId: string): Promise<Sign[]> {
	return signService.findByUser(userId);
}

/**
 * Get a single sign by ID
 */
export async function getSign(signId: string): Promise<null | Sign> {
	return signService.findById(signId);
}

/**
 * Create a new sign
 */
export async function createSign(owner: string, title: string): Promise<Sign> {
	return signService.createSign(owner, title);
}

/**
 * Check if a user is a member of a sign
 */
export async function isMember(signId: string, userId: string): Promise<boolean> {
	return signService.isMember(signId, userId);
}

/**
 * Check if a user is the owner of a sign
 */
export async function isOwner(signId: string, userId: string): Promise<boolean> {
	return signService.isOwner(signId, userId);
}

/**
 * Delete a sign
 */
export async function deleteSign(signId: string): Promise<boolean> {
	return signService.deleteById(signId);
}

/**
 * Update a sign (title and/or config)
 */
export async function updateSign(
	signId: string,
	input: { config?: Partial<SignConfig>; title?: string },
): Promise<null | Sign> {
	if (input.title !== undefined) {
		await signService.findByIdAndUpdate(signId, { $set: { title: input.title } });
	}

	if (input.config) {
		return signService.updateConfig(signId, input.config);
	}

	return signService.findById(signId);
}

/**
 * Update a sign's config (only if caller is owner)
 */
export async function updateSignConfig(
	signId: string,
	userId: string,
	config: Partial<SignConfig>,
): Promise<{ error?: string; sign?: Sign }> {
	const isOwner = await signService.isOwner(signId, userId);

	if (!isOwner) {
		return { error: 'Only the sign owner can update settings' };
	}

	const sign = await signService.updateConfig(signId, config);

	if (!sign) {
		return { error: 'Sign not found' };
	}

	return { sign };
}

/**
 * Get all MLB teams (for sign config team pickers)
 */
export async function getTeamsForConfig(): Promise<Team[]> {
	return teamService.findMlbTeams();
}
