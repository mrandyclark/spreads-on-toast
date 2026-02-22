/**
 * Convert a Date object or string to YYYY-MM-DD format
 * Handles various input formats including ISO strings and Date objects
 */
export function toDateString(dateInput: Date | string | undefined): string {
	if (!dateInput) {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

	// Parse as Date and extract local date parts
	const d = new Date(dateInput);

	if (isNaN(d.getTime())) {
		// Invalid date, return today
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	}

	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
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
 * Format a Date for long display: "Monday, June 2, 2025"
 */
export function formatGameDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'long',
		weekday: 'long',
		year: 'numeric',
	});
}

/**
 * Format a Date for time display: "7:10 PM EDT"
 */
export function formatGameTime(date: Date): string {
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short',
	});
}

/**
 * Format a Date for short display: "6/2"
 */
export function formatShortDate(date: Date): string {
	return `${date.getMonth() + 1}/${date.getDate()}`;
}
