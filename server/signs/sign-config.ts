import { Division, SignConfig } from '@/types';

type SignConfigValidation =
	| { error: string; value?: never }
	| { error?: never; value: Partial<SignConfig> };

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isUniqueStringArray = (value: unknown, maxLength: number): value is string[] =>
	Array.isArray(value) &&
	value.length <= maxLength &&
	value.every((entry) => typeof entry === 'string' && entry.length > 0 && entry.length <= 100) &&
	new Set(value).size === value.length;

const isTime = (value: unknown): value is string =>
	typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const isTimezone = (value: unknown): value is string => {
	if (typeof value !== 'string' || value.length > 100) {
		return false;
	}

	try {
		new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
		return true;
	} catch {
		return false;
	}
};

export const validateSignConfig = (input: unknown): SignConfigValidation => {
	if (!isRecord(input)) {
		return { error: 'Sign configuration must be an object' };
	}

	const allowedSections = new Set(['content', 'display', 'schedule']);

	if (Object.keys(input).some((key) => !allowedSections.has(key))) {
		return { error: 'Sign configuration contains an unsupported section' };
	}

	const value: Partial<SignConfig> = {};

	if (input.content !== undefined) {
		if (!isRecord(input.content)) {
			return { error: 'Content configuration must be an object' };
		}

		const allowedFields = new Set([
			'lastGameTeamIds',
			'nextGameTeamIds',
			'openerCountdownTeamIds',
			'standingsDivisions',
		]);

		if (Object.keys(input.content).some((key) => !allowedFields.has(key))) {
			return { error: 'Content configuration contains an unsupported field' };
		}

		const content: Partial<SignConfig['content']> = {};

		for (const field of ['lastGameTeamIds', 'nextGameTeamIds', 'openerCountdownTeamIds'] as const) {
			const fieldValue = input.content[field];

			if (fieldValue !== undefined) {
				if (!isUniqueStringArray(fieldValue, 30)) {
					return { error: `${field} must contain no more than 30 unique team IDs` };
				}

				content[field] = fieldValue;
			}
		}

		if (input.content.standingsDivisions !== undefined) {
			const divisions = input.content.standingsDivisions;

			if (
				!isUniqueStringArray(divisions, 6) ||
				!divisions.every((division) => Object.values(Division).includes(division as Division))
			) {
				return { error: 'standingsDivisions contains an invalid MLB division' };
			}

			content.standingsDivisions = divisions as Division[];
		}

		value.content = content as SignConfig['content'];
	}

	if (input.display !== undefined) {
		if (!isRecord(input.display)) {
			return { error: 'Display configuration must be an object' };
		}

		const allowedFields = new Set(['brightness', 'rotationIntervalSeconds']);

		if (Object.keys(input.display).some((key) => !allowedFields.has(key))) {
			return { error: 'Display configuration contains an unsupported field' };
		}

		const display: Partial<SignConfig['display']> = {};

		if (input.display.brightness !== undefined) {
			if (
				typeof input.display.brightness !== 'number' ||
				!Number.isInteger(input.display.brightness) ||
				input.display.brightness < 0 ||
				input.display.brightness > 100
			) {
				return { error: 'Brightness must be a whole number from 0 through 100' };
			}

			display.brightness = input.display.brightness;
		}

		if (input.display.rotationIntervalSeconds !== undefined) {
			if (
				typeof input.display.rotationIntervalSeconds !== 'number' ||
				!Number.isInteger(input.display.rotationIntervalSeconds) ||
				input.display.rotationIntervalSeconds < 5 ||
				input.display.rotationIntervalSeconds > 3600
			) {
				return { error: 'Rotation interval must be a whole number from 5 through 3600 seconds' };
			}

			display.rotationIntervalSeconds = input.display.rotationIntervalSeconds;
		}

		value.display = display as SignConfig['display'];
	}

	if (input.schedule !== undefined) {
		if (!isRecord(input.schedule)) {
			return { error: 'Schedule configuration must be an object' };
		}

		const allowedFields = new Set(['enabled', 'offTime', 'onTime', 'timezone']);

		if (Object.keys(input.schedule).some((key) => !allowedFields.has(key))) {
			return { error: 'Schedule configuration contains an unsupported field' };
		}

		const schedule: Partial<SignConfig['schedule']> = {};

		if (input.schedule.enabled !== undefined) {
			if (typeof input.schedule.enabled !== 'boolean') {
				return { error: 'Schedule enabled must be true or false' };
			}

			schedule.enabled = input.schedule.enabled;
		}

		if (input.schedule.offTime !== undefined) {
			if (!isTime(input.schedule.offTime)) {
				return { error: 'Off time must use HH:mm format' };
			}

			schedule.offTime = input.schedule.offTime;
		}

		if (input.schedule.onTime !== undefined) {
			if (!isTime(input.schedule.onTime)) {
				return { error: 'On time must use HH:mm format' };
			}

			schedule.onTime = input.schedule.onTime;
		}

		if (input.schedule.timezone !== undefined) {
			if (!isTimezone(input.schedule.timezone)) {
				return { error: 'Timezone must be a valid IANA timezone' };
			}

			schedule.timezone = input.schedule.timezone;
		}

		value.schedule = schedule as SignConfig['schedule'];
	}

	return { value };
};
