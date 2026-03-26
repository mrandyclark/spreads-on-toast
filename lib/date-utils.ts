/**
 * Get today's date as YYYY-MM-DD in US Eastern time.
 * MLB uses ET as its reference timezone, and this avoids Vercel (UTC) server
 * returning tomorrow's date after 6pm CT / 7pm ET.
 */
export function todayET(): string {
	const now = new Date();
	const parts = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).split('-');
	return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
}

/**
 * Convert a Date object or string to YYYY-MM-DD format
 * Handles various input formats including ISO strings and Date objects
 */
export function toDateString(dateInput: Date | string | undefined): string {
	if (!dateInput) {
		return todayET();
	}

	if (dateInput instanceof Date) {
		const year = dateInput.getUTCFullYear();
		const month = String(dateInput.getUTCMonth() + 1).padStart(2, '0');
		const day = String(dateInput.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	const str = String(dateInput);

	// If already in YYYY-MM-DD format, return as-is
	if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
		return str;
	}

	// If it's an ISO string like "2025-09-26T00:00:00.000Z", extract the date part
	if (str.includes('T')) {
		return str.split('T')[0];
	}

	// Parse as Date and extract UTC date parts (DB dates are stored as midnight UTC)
	const d = new Date(dateInput);

	if (isNaN(d.getTime())) {
		return todayET();
	}

	const year = d.getUTCFullYear();
	const month = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Format a YYYY-MM-DD date string for display
 * Returns format like "September 3rd, 2025"
 */
export function formatDateDisplay(dateStr: string): string {
	const parts = dateStr.includes('T') ? dateStr.split('T')[0].split('-') : dateStr.split('-');
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10);
	const day = parseInt(parts[2], 10);

	if (isNaN(day) || isNaN(month) || isNaN(year)) {
		return 'Invalid date';
	}

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	const suffix =
		day === 1 || day === 21 || day === 31
			? 'st'
			: day === 2 || day === 22
				? 'nd'
				: day === 3 || day === 23
					? 'rd'
					: 'th';

	return `${monthNames[month - 1]} ${day}${suffix}, ${year}`;
}

/**
 * Format a date string for long display: "Monday, June 2, 2025"
 * Uses US Eastern timezone to avoid Vercel UTC rendering
 */
export function formatGameDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'long',
		timeZone: 'America/New_York',
		weekday: 'long',
		year: 'numeric',
	});
}

/**
 * Format a date for time display in a specific timezone: "7:10 PM EDT"
 * Defaults to US Eastern
 */
export function formatGameTime(date: Date | string, timeZone = 'America/New_York'): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone,
		timeZoneName: 'short',
	});
}

/**
 * Format a Date for short display: "6/2"
 */
export function formatShortDate(date: Date): string {
	return `${date.getMonth() + 1}/${date.getDate()}`;
}
