import { GroupMemberSummary, GroupSummary, Sport } from '@/types';

/**
 * Mock group data for UI development
 * This will be replaced with real API data
 */
export const MOCK_GROUP: GroupSummary = {
	id: 'mlb-2024',
	isLocked: false,
	lockDate: new Date('2025-03-28T12:00:00'),
	memberCount: 6,
	name: 'Toast Masters MLB',
	season: '2025',
	sport: Sport.MLB,
};

/**
 * Mock group members for leaderboard
 */
export const MOCK_MEMBERS: GroupMemberSummary[] = [
	{
		avatar: 'MT',
		correctPicks: 18,
		id: '1',
		isCurrentUser: false,
		name: 'Mike T.',
		rank: 1,
		totalPicks: 30,
	},
	{
		avatar: 'SK',
		correctPicks: 16,
		id: '2',
		isCurrentUser: false,
		name: 'Sarah K.',
		rank: 2,
		totalPicks: 30,
	},
	{
		avatar: 'YO',
		correctPicks: 15,
		id: '3',
		isCurrentUser: true,
		name: 'You',
		rank: 3,
		totalPicks: 30,
	},
	{
		avatar: 'JL',
		correctPicks: 14,
		id: '4',
		isCurrentUser: false,
		name: 'Jake L.',
		rank: 4,
		totalPicks: 30,
	},
	{
		avatar: 'ER',
		correctPicks: 12,
		id: '5',
		isCurrentUser: false,
		name: 'Emma R.',
		rank: 5,
		totalPicks: 30,
	},
	{
		avatar: 'CP',
		correctPicks: 10,
		id: '6',
		isCurrentUser: false,
		name: 'Chris P.',
		rank: 6,
		totalPicks: 30,
	},
];

/**
 * Mock player picks for viewing other players' sheets
 */
export const MOCK_PLAYER_PICKS = {
	postseasonAL: ['nyy', 'hou', 'tex', 'bal', 'min'],
	postseasonNL: ['lad', 'atl', 'phi', 'mil', 'ari'],
	teamPicks: [
		{ line: 91.5, pick: 'over' as const, teamId: 'nyy' },
		{ line: 96.5, pick: 'over' as const, teamId: 'lad' },
		{ line: 92.5, pick: 'under' as const, teamId: 'atl' },
		{ line: 89.5, pick: 'over' as const, teamId: 'hou' },
		{ line: 88.5, pick: 'over' as const, teamId: 'phi' },
	],
	worldSeriesAL: 'nyy',
	worldSeriesNL: 'lad',
};

/**
 * Mock leagues for dashboard
 */
export const MOCK_LEAGUES: GroupSummary[] = [
	{
		id: '1',
		isLocked: true,
		lockDate: new Date('2024-09-01'),
		memberCount: 8,
		name: 'Sunday Squad',
		season: '2024-25',
		sport: Sport.MLB,
		yourRank: 2,
	},
	{
		id: '2',
		isLocked: false,
		lockDate: new Date('2025-10-15'),
		memberCount: 6,
		name: 'Hoops Heads',
		season: '2025-26',
		sport: Sport.MLB,
		yourRank: 1,
	},
	{
		id: '3',
		isLocked: true,
		lockDate: new Date('2025-03-28'),
		memberCount: 10,
		name: 'Diamond Dynasty',
		season: '2025',
		sport: Sport.MLB,
		yourRank: 5,
	},
];
