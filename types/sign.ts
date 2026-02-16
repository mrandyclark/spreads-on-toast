import { BaseDocument, Ref } from './mongo';
import { User } from './user';

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
 * Full configuration for a sign
 */
export interface SignConfig {
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
