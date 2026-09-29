import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import TeamPickCard from './team-pick-card';

describe('team pick scoring labels', () => {
	it('labels actual totals final even for a team finishing at 161 games', () => {
		const html = renderToStaticMarkup(
			createElement(TeamPickCard, {
				gamesPlayed: 161,
				isFinal: true,
				line: 91.5,
				projectedWins: 93,
				teamName: 'Yankees',
			}),
		);
		expect(html).toContain('Final:');
		expect(html).not.toContain('Est:');
	});
	it('does not label a Pythagorean estimate final just because 162 games were played', () => {
		const html = renderToStaticMarkup(
			createElement(TeamPickCard, {
				gamesPlayed: 162,
				isFinal: false,
				line: 85.5,
				projectedWins: 88.6,
				teamName: 'Tigers',
			}),
		);
		expect(html).toContain('Est:');
		expect(html).not.toContain('Final:');
	});
});
