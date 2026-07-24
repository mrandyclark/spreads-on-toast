import { describe, expect, it } from 'vitest';

import { Division } from '@/types';

import { validateSignConfig } from './sign-config';

describe('validateSignConfig', () => {
	it('accepts safe partial configuration', () => {
		const result = validateSignConfig({
			content: {
				standingsDivisions: [Division.AL_East],
			},
			display: {
				brightness: 40,
				rotationIntervalSeconds: 15,
			},
			schedule: {
				enabled: true,
				offTime: '23:00',
				onTime: '07:00',
				timezone: 'America/Anchorage',
			},
		});

		expect(result.error).toBeUndefined();
	});

	it.each([
		[{ admin: true }, 'unsupported section'],
		[{ display: { brightness: 101 } }, 'Brightness'],
		[{ display: { rotationIntervalSeconds: 0 } }, 'Rotation interval'],
		[{ schedule: { onTime: '7am' } }, 'On time'],
		[{ schedule: { timezone: 'Mars/Olympus' } }, 'Timezone'],
		[{ content: { standingsDivisions: ['invalid'] } }, 'invalid MLB division'],
	])('rejects malformed config %#', (input, expectedError) => {
		expect(validateSignConfig(input).error).toContain(expectedError);
	});
});
