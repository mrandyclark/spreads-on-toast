import { describe, expect, it } from 'vitest';

import { Conference, Division, PickDirection, Sport, Team, TeamPick } from '@/types';

import { validateSavePicksInput } from './pick-rules';

const makeTeam = (id: string, conference: Conference): Team =>
	({
		abbreviation: id.toUpperCase(),
		city: 'City',
		conference,
		createdAt: new Date(),
		division: conference === Conference.AL ? Division.AL_East : Division.NL_East,
		id,
		kindeId: undefined,
		name: 'Team',
		sport: Sport.MLB,
		updatedAt: new Date(),
	}) as Team;

const eligibleTeamPicks: TeamPick[] = [
	{ line: 81.5, team: makeTeam('al-one', Conference.AL) },
	{ line: 82.5, team: makeTeam('al-two', Conference.AL) },
	{ line: 83.5, team: makeTeam('nl-one', Conference.NL) },
	{ line: 84.5, team: makeTeam('nl-two', Conference.NL) },
];

describe('validateSavePicksInput', () => {
	it('accepts valid partial picks for the server-owned team set', () => {
		const result = validateSavePicksInput(
			{
				postseasonPicks: { al: ['al-one'], nl: ['nl-one'] },
				teamPicks: {
					'al-one': PickDirection.Over,
					'nl-one': null,
				},
				worldSeriesPicks: {
					alChampion: 'al-one',
					nlChampion: 'nl-one',
					winner: Conference.AL,
				},
			},
			eligibleTeamPicks,
		);

		expect(result.error).toBeUndefined();
		expect(result.value?.teamPicks).toEqual({
			'al-one': PickDirection.Over,
			'nl-one': null,
		});
	});

	it('rejects a runtime pick value that TypeScript cannot protect against', () => {
		const result = validateSavePicksInput(
			{ teamPicks: { 'al-one': 'sideways' } },
			eligibleTeamPicks,
		);

		expect(result.error).toBe('Each team pick must be over, under, or unselected');
	});

	it('rejects team IDs outside the immutable sheet eligibility set', () => {
		const result = validateSavePicksInput(
			{ teamPicks: { attackerTeam: PickDirection.Over } },
			eligibleTeamPicks,
		);

		expect(result.error).toBe('Team picks contain an ineligible team');
	});

	it('rejects duplicate or wrong-league postseason selections', () => {
		expect(
			validateSavePicksInput(
				{
					postseasonPicks: { al: ['al-one', 'al-one'], nl: [] },
					teamPicks: {},
				},
				eligibleTeamPicks,
			).error,
		).toContain('unique');

		expect(
			validateSavePicksInput(
				{
					postseasonPicks: { al: ['nl-one'], nl: [] },
					teamPicks: {},
				},
				eligibleTeamPicks,
			).error,
		).toContain('ineligible');
	});

	it('requires a champion to remain in the selected postseason field', () => {
		const result = validateSavePicksInput(
			{
				postseasonPicks: { al: ['al-one'], nl: ['nl-one'] },
				teamPicks: {},
				worldSeriesPicks: {
					alChampion: 'al-two',
					nlChampion: 'nl-one',
				},
			},
			eligibleTeamPicks,
		);

		expect(result.error).toContain('selected postseason teams');
	});
});
