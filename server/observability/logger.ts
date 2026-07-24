type LogContext = Record<string, boolean | null | number | string | undefined>;

const write = (
	level: 'error' | 'info' | 'warn',
	event: string,
	context: LogContext = {},
	error?: unknown,
) => {
	const payload: Record<string, unknown> = {
		...context,
		event,
		level,
		timestamp: new Date().toISOString(),
	};

	if (error instanceof Error) {
		payload.error = {
			message: error.message,
			name: error.name,
		};
	} else if (error !== undefined) {
		payload.error = String(error);
	}

	const serialized = JSON.stringify(payload);

	if (level === 'error') {
		console.error(serialized);
	} else if (level === 'warn') {
		console.warn(serialized);
	} else {
		console.info(serialized);
	}
};

export const logger = {
	error: (event: string, context?: LogContext, error?: unknown) =>
		write('error', event, context, error),
	info: (event: string, context?: LogContext) => write('info', event, context),
	warn: (event: string, context?: LogContext, error?: unknown) =>
		write('warn', event, context, error),
};
