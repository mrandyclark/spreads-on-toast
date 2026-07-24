const DEFAULT_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RETRY_DELAY_MS = 2_000;

const wait = (milliseconds: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});

const retryDelay = (response: Response | undefined, attempt: number): number => {
	const retryAfter = response?.headers.get('retry-after');

	if (retryAfter) {
		const seconds = Number(retryAfter);

		if (Number.isFinite(seconds)) {
			return Math.min(seconds * 1_000, MAX_RETRY_DELAY_MS);
		}
	}

	return Math.min(250 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
};

const isRetryableStatus = (status: number): boolean =>
	status === 408 || status === 429 || status >= 500;

export async function fetchMlbJson<T>(
	url: string,
	validate: (value: unknown) => value is T,
	options: {
		attempts?: number;
		timeoutMs?: number;
	} = {},
): Promise<T> {
	const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= attempts; attempt++) {
		let response: Response | undefined;

		try {
			response = await fetch(url, {
				headers: {
					accept: 'application/json',
					'user-agent': 'spreads-on-toast/1.0',
				},
				signal: AbortSignal.timeout(timeoutMs),
			});

			if (!response.ok) {
				const error = new Error(`MLB API error: ${response.status} ${response.statusText}`);

				if (!isRetryableStatus(response.status) || attempt === attempts) {
					throw error;
				}

				lastError = error;
				await wait(retryDelay(response, attempt));
				continue;
			}

			const payload: unknown = await response.json();

			if (!validate(payload)) {
				throw new Error('MLB API returned an invalid response shape');
			}

			return payload;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error('Unknown MLB API failure');

			if (attempt === attempts || (response !== undefined && !isRetryableStatus(response.status))) {
				throw lastError;
			}

			await wait(retryDelay(response, attempt));
		}
	}

	throw lastError ?? new Error('MLB API request failed');
}
