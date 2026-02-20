import { BaseDocument, Ref } from './mongo';
import { Division } from './sport';
import { User } from './user';

/**
 * Bump this version when the sign payload format changes.
 * Signs compare this against their installed version and restart/reinstall when it differs.
 */
export const SIGN_PAYLOAD_VERSION = 2;

/**
 * A member's role on a sign
 */
export enum SignRole {
	Owner = 'owner', // Created the sign, full control
	Viewer = 'viewer', // Can view the sign in the UI
}

/**
 * A member associated with a sign
 */
export interface SignMember {
	joinedAt: Date;
	role: SignRole;
	user: Ref<User>;
}

/**
 * Display settings for a sign
 */
export interface SignDisplayConfig {
	brightness: number; // 0-100
	rotationIntervalSeconds: number;
}

/**
 * Schedule settings for automatic on/off
 */
export interface SignScheduleConfig {
	enabled: boolean;
	offTime: string; // HH:mm format (e.g., '23:00')
	onTime: string; // HH:mm format (e.g., '07:00')
	timezone: string; // IANA timezone (e.g., 'America/Los_Angeles')
}

/**
 * Content settings for what a sign displays
 */
export interface SignContentConfig {
	lastGameTeamIds: string[]; // Team IDs to show last game box scores for
	nextGameTeamIds: string[]; // Team IDs to show next game info for
	standingsDivisions: Division[]; // Which divisions to show standings for
}

/**
 * Full configuration for a sign
 */
export interface SignConfig {
	content: SignContentConfig;
	display: SignDisplayConfig;
	schedule: SignScheduleConfig;
}

/**
 * A physical sign (e.g., Raspberry Pi digital display)
 * Owners can manage config, viewers can see it in the UI
 */
export interface Sign extends BaseDocument {
	config: SignConfig;
	members: SignMember[];
	owner: Ref<User>;
	title: string;
}

/**
 * Response shape returned by the external sign config endpoint.
 * Signs use payloadVersion to determine if they need to restart/reinstall.
 */
export interface SignExternalConfigResponse {
	config: SignConfig;
	payloadVersion: number;
}
