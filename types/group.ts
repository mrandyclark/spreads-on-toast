import { BaseDocument, Ref } from './mongo';
import { Sport } from './sport';
import { User } from './user';

/**
 * Group status based on lock date
 */
export enum GroupStatus {
	Active = 'active', // Season in progress, picks locked
	Completed = 'completed', // Season finished
	Open = 'open', // Accepting picks (before lock date)
}

/**
 * A member's role in a group
 */
export enum GroupRole {
	Admin = 'admin', // Can manage group settings, invite members
	Member = 'member', // Regular member
	Owner = 'owner', // Created the group, full control
}

/**
 * A member of a group
 */
export interface GroupMember {
	joinedAt: Date;
	role: GroupRole;
	user: Ref<User>;
}

/**
 * A competition group (renamed from "league" to avoid confusion with MLB/NFL)
 * Members join a group, make picks before the lock date, and compete
 */
export interface Group extends BaseDocument {
	inviteCode: string; // Short code for joining (e.g., 'ABC123')
	lockDate: Date; // When picks lock (season start)
	members: GroupMember[];
	name: string; // e.g., 'Toast Masters'
	owner: Ref<User>; // User who created the group
	season: string; // e.g., '2025'
	seasonEndDate?: Date; // From Season model (for historical view)
	seasonStartDate?: Date; // From Season model (for historical view)
	sport: Sport; // e.g., 'MLB'
}

/**
 * Group summary for dashboard list
 */
export interface GroupSummary {
	id: string;
	isLocked: boolean;
	lockDate: Date;
	memberCount: number;
	name: string;
	season: string;
	sport: Sport;
	yourRank?: number;
}

/**
 * Group detail with member info
 */
export interface GroupDetail extends GroupSummary {
	inviteCode: string;
	members: GroupMemberSummary[];
}

/**
 * Member info for group detail view
 */
export interface GroupMemberSummary {
	avatar?: string;
	correctPicks: number;
	id: string;
	isCurrentUser: boolean;
	name: string;
	rank: number;
	totalPicks: number;
}
