import { describe, expect, it } from 'vitest';

import { hasValidApiKey, hasValidBearerSecret } from './authentication';

describe('HTTP secret authentication', () => {
	it('compares API keys without accepting absent or partial values', () => {
		expect(hasValidApiKey('correct-key', 'correct-key')).toBe(true);
		expect(hasValidApiKey('correct', 'correct-key')).toBe(false);
		expect(hasValidApiKey(null, 'correct-key')).toBe(false);
		expect(hasValidApiKey('correct-key', undefined)).toBe(false);
	});

	it('requires the exact bearer scheme and secret', () => {
		expect(hasValidBearerSecret('Bearer cron-secret', 'cron-secret')).toBe(true);
		expect(hasValidBearerSecret('bearer cron-secret', 'cron-secret')).toBe(false);
		expect(hasValidBearerSecret('Bearer wrong', 'cron-secret')).toBe(false);
	});
});
