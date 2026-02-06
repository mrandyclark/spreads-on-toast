import { BaseDocument, Ref } from './mongo';
import { User } from './user';

/**
 * Invitation status
 */
export enum InvitationStatus {
	Accepted = 'accepted',
	Declined = 'declined',
	Expired = 'expired',
	Pending = 'pending',
}

/**
 * An invitation to join a group
 */
export interface Invitation extends BaseDocument {
	email: string; // Email of invitee (lowercase)
	group: string; // Group ID
	invitedBy: Ref<User>; // User who sent the invite
	lastSent?: Date; // Last time invitation email was sent
	status: InvitationStatus;
}

/**
 * Invitation with populated details for UI
 */
export interface InvitationDetail {
	groupId: string;
	groupName: string;
	id: string;
	invitedByName: string;
}
