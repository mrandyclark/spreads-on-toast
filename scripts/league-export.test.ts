import { describe, expect, it } from 'vitest';

import { buildLeagueExport, renderLeagueReport } from './league-export.mjs';

const makeSource = () => ({
	exportedAt: '2026-09-28T12:00:00Z',
	group: {
		_id: 'group',
		members: [{ user: 'a' }, { user: 'b' }],
		name: 'Test league',
		season: '2026',
	},
	lines: [{ line: 91.5, team: 'nyy' }],
	season: { endDate: '2026-10-01', status: 'upcoming' },
	sheets: ['a', 'b'].map((user) => ({ teamPicks: [{ pick: 'over', team: 'nyy' }], user })),
	standings: [
		{
			date: '2026-09-28',
			gamesPlayed: 161,
			losses: 68,
			pythagoreanWins: 89,
			team: 'nyy',
			wins: 93,
		},
	],
	teams: [{ _id: 'nyy', abbreviation: 'NYY', city: 'New York', name: 'Yankees' }],
	users: [
		{ _id: 'a', nameFirst: 'Alice' },
		{ _id: 'b', nameFirst: 'Bob' },
	],
});

describe('actual-win league export', () => {
	it('uses actual wins with 161 games even when the season is not marked complete', () => {
		const report = buildLeagueExport(makeSource());
		expect(report.members[0]).toMatchObject({ estimatedCorrect: 0, rank: 1, wins: 1 });
		expect(report.members[1]).toMatchObject({ rank: 1, wins: 1 });
		expect(renderLeagueReport(report)).toContain('OVER 91.5: WIN');
	});
	it('uses saved lines ahead of current season lines and preserves pushes', () => {
		const source = makeSource();
		Object.assign(source.sheets[0].teamPicks[0], { line: 93 });
		const report = buildLeagueExport(source);
		expect(
			report.members.find((member: { userId: string }) => member.userId === 'a'),
		).toMatchObject({
			pushes: 1,
			wins: 0,
		});
	});
	it('fails rather than grading a missing standing or line as zero', () => {
		const missingStanding = makeSource();
		missingStanding.standings[0].team = 'other';
		expect(() => buildLeagueExport(missingStanding)).toThrow('Missing or invalid');
		const missingLine = makeSource();
		missingLine.lines[0].team = 'other';
		expect(() => buildLeagueExport(missingLine)).toThrow('Missing or invalid');
	});
	it('rejects duplicate picks and inconsistent records', () => {
		const duplicate = makeSource();
		duplicate.sheets[0].teamPicks.push(duplicate.sheets[0].teamPicks[0]);
		expect(() => buildLeagueExport(duplicate)).toThrow('Incomplete or duplicate');
		const badRecord = makeSource();
		badRecord.standings[0].gamesPlayed = 162;
		expect(() => buildLeagueExport(badRecord)).toThrow('Missing or invalid');
	});
});
