import { BaseDocument, Ref } from './mongo';
import { PickResult, PostseasonPicks, WorldSeriesPicks } from './sheet';
import { Sport } from './sport';
import { Team } from './team';
import { User } from './user';

/**
 * Group status based on lock date (computed)
 */
export enum GroupStatus {
	Active = 'active', // Season in progress, picks locked
	Completed = 'completed', // Season finished
	Open = 'open', // Accepting picks (before lock date)
}

/**
 * Group visibility status (owner/admin controlled)
 */
export enum GroupVisibility {
	Active = 'active', // Visible in dashboard
	Archived = 'archived', // Hidden from dashboard (can still be accessed directly)
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
	visibility?: GroupVisibility; // Owner-controlled visibility (defaults to active)
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

export interface CreateGroupInput {
	lockDate: string;
	name: string;
	season: string;
	sport: Sport;
}

export interface CopyableSheet {
	groupId: string;
	groupName: string;
	sheetId: string;
}

export interface SavePicksInput {
	postseasonPicks?: PostseasonPicks;
	teamPicks: Record<string, 'over' | 'under' | null>;
	worldSeriesPicks?: WorldSeriesPicks;
}

export interface TeamPickResult {
	actualWins?: number;
	gamesPlayed?: number;
	line: number;
	pick: 'over' | 'under';
	projectedWins: number;
	result: PickResult;
	team: Team;
}

export interface GroupResults {
	date?: string;
	picks: TeamPickResult[];
	summary: {
		losses: number;
		pending?: number;
		pushes: number;
		total: number;
		wins: number;
	};
}

export interface LeaderboardEntry {
	losses: number;
	pushes: number;
	rank?: number;
	total: number;
	userId: string;
	userInitials: string;
	userName: string;
	winPct: number;
	wins: number;
}

export interface LeaderboardData {
	date?: string;
	entries: LeaderboardEntry[];
}

export interface LeaderboardResponse {
	date?: string;
	entries: LeaderboardEntry[];
	season: string;
}

export interface SelectedMember {
	isCurrentUser: boolean;
	userId: string;
	userInitials: string;
	userName: string;
}
