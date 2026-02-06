import { Conference, Sheet, Team, TeamPick } from '@/types';

/**
 * Extract postseason team picks from a sheet
 */
export function getPostseasonTeams(sheet: null | Sheet): { al: Team[]; nl: Team[] } {
	if (!sheet) {
		return { al: [], nl: [] };
	}

	const alTeams = (sheet.postseasonPicks?.al ?? [])
		.map((id) => sheet.teamPicks.find((tp) => getTeamId(tp) === id)?.team)
		.filter((t): t is Team => typeof t === 'object');

	const nlTeams = (sheet.postseasonPicks?.nl ?? [])
		.map((id) => sheet.teamPicks.find((tp) => getTeamId(tp) === id)?.team)
		.filter((t): t is Team => typeof t === 'object');

	return { al: alTeams, nl: nlTeams };
}

/**
 * Extract World Series champion picks from a sheet
 */
export function getWorldSeriesChampions(sheet: null | Sheet): {
	alChampion: Team | undefined;
	nlChampion: Team | undefined;
	winner: Conference | undefined;
} {
	if (!sheet) {
		return { alChampion: undefined, nlChampion: undefined, winner: undefined };
	}

	const alChampion = sheet.teamPicks.find(
		(tp) => getTeamId(tp) === sheet.worldSeriesPicks?.alChampion,
	)?.team as Team | undefined;

	const nlChampion = sheet.teamPicks.find(
		(tp) => getTeamId(tp) === sheet.worldSeriesPicks?.nlChampion,
	)?.team as Team | undefined;

	const winner = sheet.worldSeriesPicks?.winner;

	return { alChampion, nlChampion, winner };
}

/**
 * Get team ID from a TeamPick (handles both populated and unpopulated)
 */
export function getTeamId(teamPick: TeamPick): string {
	return typeof teamPick.team === 'object' ? teamPick.team.id : teamPick.team;
}

/**
 * Get Team object from a TeamPick (returns null if not populated)
 */
export function getTeamFromPick(teamPick: TeamPick): null | Team {
	return typeof teamPick.team === 'object' ? teamPick.team : null;
}

/**
 * Extract all teams from teamPicks array
 */
export function getTeamsFromPicks(teamPicks: TeamPick[]): Team[] {
	return teamPicks.map((tp) => getTeamFromPick(tp)).filter((t): t is Team => t !== null);
}

/**
 * Filter teams by conference
 */
export function filterTeamsByConference(teams: Team[], conference: Conference): Team[] {
	return teams.filter((t) => t.conference === conference);
}

/**
 * Get full team name (city + name)
 */
export function getFullTeamName(team: Team): string {
	return `${team.city} ${team.name}`;
}

/**
 * Get teams split by conference, sorted by abbreviation
 */
export function getTeamsByConference(teamPicks: TeamPick[]): { al: Team[]; nl: Team[] } {
	const teams = getTeamsFromPicks(teamPicks);
	return {
		al: teams
			.filter((t) => t.conference === Conference.AL)
			.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation)),
		nl: teams
			.filter((t) => t.conference === Conference.NL)
			.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation)),
	};
}

/**
 * Get teams split by conference, sorted by full name
 */
export function getTeamsByConferenceSortedByName(teamPicks: TeamPick[]): {
	al: Team[];
	nl: Team[];
} {
	const teams = getTeamsFromPicks(teamPicks);
	return {
		al: teams
			.filter((t) => t.conference === Conference.AL)
			.sort((a, b) => getFullTeamName(a).localeCompare(getFullTeamName(b))),
		nl: teams
			.filter((t) => t.conference === Conference.NL)
			.sort((a, b) => getFullTeamName(a).localeCompare(getFullTeamName(b))),
	};
}
