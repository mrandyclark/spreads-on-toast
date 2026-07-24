import { timingSafeEqual } from 'node:crypto';

const safeSecretEqual = (provided: null | string, expected: string | undefined): boolean => {
	if (!provided || !expected) {
		return false;
	}

	const providedBuffer = Buffer.from(provided);
	const expectedBuffer = Buffer.from(expected);

	if (providedBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return timingSafeEqual(providedBuffer, expectedBuffer);
};

export const hasValidApiKey = (
	provided: null | string,
	expected = process.env.EXTERNAL_API_KEY,
): boolean => safeSecretEqual(provided, expected);

export const hasValidBearerSecret = (
	authorization: null | string,
	expected = process.env.CRON_SECRET,
): boolean => {
	if (!authorization?.startsWith('Bearer ')) {
		return false;
	}

	return safeSecretEqual(authorization.slice(7), expected);
};
