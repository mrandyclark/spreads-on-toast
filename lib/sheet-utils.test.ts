import { describe, expect, it } from 'vitest';

import { Conference, Division, Sport } from '@/types';

import {
	filterTeamsByConference,
	getFullTeamName,
	getTeamFromPick,
	getTeamId,
	getTeamsByConference,
	getTeamsByConferenceSortedByName,
	getTeamsFromPicks,
	toTeamsWithLines,
} from './sheet-utils';

import type { Team, TeamPick } from '@/types';

const makeTeam = (overrides: Partial<Team> & { abbreviation: string; city: string; id: string; name: string }): Team => ({
	conference: Conference.AL,
	createdAt: new Date(),
	division: Division.AL_East,
	sport: Sport.MLB,
	updatedAt: new Date(),
	...overrides,
});

const yankees = makeTeam({ abbreviation: 'NYY', city: 'New York', id: 't1', name: 'Yankees' });
const redSox = makeTeam({ abbreviation: 'BOS', city: 'Boston', id: 't2', name: 'Red Sox' });
const dodgers = makeTeam({
	abbreviation: 'LAD',
	city: 'Los Angeles',
	conference: Conference.NL,
	division: Division.NL_West,
	id: 't3',
	name: 'Dodgers',
});
const mets = makeTeam({
	abbreviation: 'NYM',
	city: 'New York',
	conference: Conference.NL,
	division: Division.NL_East,
	id: 't4',
	name: 'Mets',
});

const populatedPick = (team: Team): TeamPick => ({ team });
const unpopulatedPick = (teamId: string): TeamPick => ({ team: teamId });

describe('sheet-utils', () => {
	describe('getTeamId', () => {
		it('returns id from populated team', () => {
			expect(getTeamId(populatedPick(yankees))).toBe('t1');
		});

		it('returns string from unpopulated team', () => {
			expect(getTeamId(unpopulatedPick('t1'))).toBe('t1');
		});
	});

	describe('getTeamFromPick', () => {
		it('returns team object when populated', () => {
			expect(getTeamFromPick(populatedPick(yankees))).toBe(yankees);
		});

		it('returns null when unpopulated', () => {
			expect(getTeamFromPick(unpopulatedPick('t1'))).toBeNull();
		});
	});

	describe('getTeamsFromPicks', () => {
		it('extracts populated teams', () => {
			const picks = [populatedPick(yankees), populatedPick(dodgers)];
			expect(getTeamsFromPicks(picks)).toEqual([yankees, dodgers]);
		});

		it('filters out unpopulated picks', () => {
			const picks = [populatedPick(yankees), unpopulatedPick('t2')];
			expect(getTeamsFromPicks(picks)).toEqual([yankees]);
		});
	});

	describe('filterTeamsByConference', () => {
		it('filters AL teams', () => {
			expect(filterTeamsByConference([yankees, dodgers, redSox], Conference.AL)).toEqual([yankees, redSox]);
		});

		it('filters NL teams', () => {
			expect(filterTeamsByConference([yankees, dodgers, mets], Conference.NL)).toEqual([dodgers, mets]);
		});
	});

	describe('getFullTeamName', () => {
		it('combines city and name', () => {
			expect(getFullTeamName(yankees)).toBe('New York Yankees');
		});
	});

	describe('getTeamsByConference', () => {
		it('splits and sorts by abbreviation', () => {
			const picks = [populatedPick(yankees), populatedPick(redSox), populatedPick(dodgers), populatedPick(mets)];
			const result = getTeamsByConference(picks);
			expect(result.al.map((t) => t.abbreviation)).toEqual(['BOS', 'NYY']);
			expect(result.nl.map((t) => t.abbreviation)).toEqual(['LAD', 'NYM']);
		});
	});

	describe('getTeamsByConferenceSortedByName', () => {
		it('splits and sorts by full name', () => {
			const picks = [populatedPick(yankees), populatedPick(redSox), populatedPick(dodgers), populatedPick(mets)];
			const result = getTeamsByConferenceSortedByName(picks);
			expect(result.al.map((t) => t.name)).toEqual(['Red Sox', 'Yankees']);
			expect(result.nl.map((t) => t.name)).toEqual(['Dodgers', 'Mets']);
		});
	});

	describe('toTeamsWithLines', () => {
		it('converts populated picks to TeamWithLine sorted by full name', () => {
			const picks = [populatedPick(yankees), populatedPick(redSox)];
			const linesMap = new Map([['t1', 91.5], ['t2', 82.5]]);
			const result = toTeamsWithLines(picks, linesMap);
			expect(result).toEqual([
				{
					abbreviation: 'BOS',
					city: 'Boston',
					conference: Conference.AL,
					division: Division.AL_East,
					id: 't2',
					line: 82.5,
					name: 'Red Sox',
				},
				{
					abbreviation: 'NYY',
					city: 'New York',
					conference: Conference.AL,
					division: Division.AL_East,
					id: 't1',
					line: 91.5,
					name: 'Yankees',
				},
			]);
		});

		it('skips unpopulated picks', () => {
			const picks = [populatedPick(yankees), unpopulatedPick('t2')];
			const linesMap = new Map([['t1', 91.5], ['t2', 82.5]]);
			expect(toTeamsWithLines(picks, linesMap)).toHaveLength(1);
		});
	});
});
