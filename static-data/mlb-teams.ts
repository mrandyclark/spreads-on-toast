import { Conference, Division } from '@/types';

/**
 * MLB team data for UI display
 * This is static reference data - actual team records come from the database
 */
export interface MLBTeamData {
	abbreviation: string;
	city: string;
	conference: Conference;
	division: Division;
	id: string;
	name: string;
}

/**
 * All 30 MLB teams
 */
export const MLB_TEAMS: MLBTeamData[] = [
	// American League East
	{
		abbreviation: 'NYY',
		city: 'New York',
		conference: Conference.AL,
		division: Division.AL_East,
		id: 'nyy',
		name: 'Yankees',
	},
	{
		abbreviation: 'BOS',
		city: 'Boston',
		conference: Conference.AL,
		division: Division.AL_East,
		id: 'bos',
		name: 'Red Sox',
	},
	{
		abbreviation: 'TOR',
		city: 'Toronto',
		conference: Conference.AL,
		division: Division.AL_East,
		id: 'tor',
		name: 'Blue Jays',
	},
	{
		abbreviation: 'BAL',
		city: 'Baltimore',
		conference: Conference.AL,
		division: Division.AL_East,
		id: 'bal',
		name: 'Orioles',
	},
	{
		abbreviation: 'TB',
		city: 'Tampa Bay',
		conference: Conference.AL,
		division: Division.AL_East,
		id: 'tb',
		name: 'Rays',
	},
	// American League Central
	{
		abbreviation: 'CLE',
		city: 'Cleveland',
		conference: Conference.AL,
		division: Division.AL_Central,
		id: 'cle',
		name: 'Guardians',
	},
	{
		abbreviation: 'MIN',
		city: 'Minnesota',
		conference: Conference.AL,
		division: Division.AL_Central,
		id: 'min',
		name: 'Twins',
	},
	{
		abbreviation: 'DET',
		city: 'Detroit',
		conference: Conference.AL,
		division: Division.AL_Central,
		id: 'det',
		name: 'Tigers',
	},
	{
		abbreviation: 'CWS',
		city: 'Chicago',
		conference: Conference.AL,
		division: Division.AL_Central,
		id: 'cws',
		name: 'White Sox',
	},
	{
		abbreviation: 'KC',
		city: 'Kansas City',
		conference: Conference.AL,
		division: Division.AL_Central,
		id: 'kc',
		name: 'Royals',
	},
	// American League West
	{
		abbreviation: 'HOU',
		city: 'Houston',
		conference: Conference.AL,
		division: Division.AL_West,
		id: 'hou',
		name: 'Astros',
	},
	{
		abbreviation: 'TEX',
		city: 'Texas',
		conference: Conference.AL,
		division: Division.AL_West,
		id: 'tex',
		name: 'Rangers',
	},
	{
		abbreviation: 'SEA',
		city: 'Seattle',
		conference: Conference.AL,
		division: Division.AL_West,
		id: 'sea',
		name: 'Mariners',
	},
	{
		abbreviation: 'LAA',
		city: 'Los Angeles',
		conference: Conference.AL,
		division: Division.AL_West,
		id: 'laa',
		name: 'Angels',
	},
	{
		abbreviation: 'OAK',
		city: 'Oakland',
		conference: Conference.AL,
		division: Division.AL_West,
		id: 'oak',
		name: 'Athletics',
	},
	// National League East
	{
		abbreviation: 'ATL',
		city: 'Atlanta',
		conference: Conference.NL,
		division: Division.NL_East,
		id: 'atl',
		name: 'Braves',
	},
	{
		abbreviation: 'PHI',
		city: 'Philadelphia',
		conference: Conference.NL,
		division: Division.NL_East,
		id: 'phi',
		name: 'Phillies',
	},
	{
		abbreviation: 'NYM',
		city: 'New York',
		conference: Conference.NL,
		division: Division.NL_East,
		id: 'nym',
		name: 'Mets',
	},
	{
		abbreviation: 'MIA',
		city: 'Miami',
		conference: Conference.NL,
		division: Division.NL_East,
		id: 'mia',
		name: 'Marlins',
	},
	{
		abbreviation: 'WSH',
		city: 'Washington',
		conference: Conference.NL,
		division: Division.NL_East,
		id: 'wsh',
		name: 'Nationals',
	},
	// National League Central
	{
		abbreviation: 'MIL',
		city: 'Milwaukee',
		conference: Conference.NL,
		division: Division.NL_Central,
		id: 'mil',
		name: 'Brewers',
	},
	{
		abbreviation: 'CHC',
		city: 'Chicago',
		conference: Conference.NL,
		division: Division.NL_Central,
		id: 'chc',
		name: 'Cubs',
	},
	{
		abbreviation: 'CIN',
		city: 'Cincinnati',
		conference: Conference.NL,
		division: Division.NL_Central,
		id: 'cin',
		name: 'Reds',
	},
	{
		abbreviation: 'STL',
		city: 'St. Louis',
		conference: Conference.NL,
		division: Division.NL_Central,
		id: 'stl',
		name: 'Cardinals',
	},
	{
		abbreviation: 'PIT',
		city: 'Pittsburgh',
		conference: Conference.NL,
		division: Division.NL_Central,
		id: 'pit',
		name: 'Pirates',
	},
	// National League West
	{
		abbreviation: 'LAD',
		city: 'Los Angeles',
		conference: Conference.NL,
		division: Division.NL_West,
		id: 'lad',
		name: 'Dodgers',
	},
	{
		abbreviation: 'SF',
		city: 'San Francisco',
		conference: Conference.NL,
		division: Division.NL_West,
		id: 'sf',
		name: 'Giants',
	},
	{
		abbreviation: 'SD',
		city: 'San Diego',
		conference: Conference.NL,
		division: Division.NL_West,
		id: 'sd',
		name: 'Padres',
	},
	{
		abbreviation: 'ARI',
		city: 'Arizona',
		conference: Conference.NL,
		division: Division.NL_West,
		id: 'ari',
		name: 'Diamondbacks',
	},
	{
		abbreviation: 'COL',
		city: 'Colorado',
		conference: Conference.NL,
		division: Division.NL_West,
		id: 'col',
		name: 'Rockies',
	},
];

/**
 * Get teams by conference
 */
export const AL_TEAMS = MLB_TEAMS.filter((t) => t.conference === Conference.AL);
export const NL_TEAMS = MLB_TEAMS.filter((t) => t.conference === Conference.NL);

/**
 * Get team by ID
 */
export function getTeamById(id: string): MLBTeamData | undefined {
	return MLB_TEAMS.find((t) => t.id === id);
}

/**
 * Get team by abbreviation
 */
export function getTeamByAbbreviation(abbr: string): MLBTeamData | undefined {
	return MLB_TEAMS.find((t) => t.abbreviation === abbr);
}

/**
 * Get full team name (city + name)
 */
export function getFullTeamName(team: MLBTeamData): string {
	return `${team.city} ${team.name}`;
}
