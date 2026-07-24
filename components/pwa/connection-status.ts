const DEFAULT_TIMEOUT_MS = 8_000;

interface HealthProbeOptions {
	fetcher?: typeof fetch;
	timeoutMs?: number;
}

export const probeApplicationHealth = async ({
	fetcher = globalThis.fetch,
	timeoutMs = DEFAULT_TIMEOUT_MS,
}: HealthProbeOptions = {}): Promise<boolean> => {
	const controller = new AbortController();
	const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetcher('/api/health', {
			cache: 'no-store',
			credentials: 'same-origin',
			headers: { Accept: 'application/json' },
			signal: controller.signal,
		});

		return response.ok;
	} catch {
		return false;
	} finally {
		globalThis.clearTimeout(timeout);
	}
};
