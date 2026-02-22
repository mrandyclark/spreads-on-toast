/**
 * Pluralize an English noun using regex rules.
 * e.g. pluralize('member', 3) => 'members'
 *      pluralize('cherry', 2) => 'cherries'
 *      pluralize('member', 1) => 'member'
 */
export function pluralize(noun: string, count?: number): string {
	if (!noun || typeof noun !== 'string' || typeof count !== 'number' || count === 1) {
		return noun;
	}

	const rules = [
		{ regex: /^octopus/gi, suffix: 'octopuses' },
		{ regex: /^person/gi, suffix: 'people' },
		{ regex: /^ox/gi, suffix: 'oxen' },
		{ regex: /^goose/gi, suffix: 'geese' },
		{ regex: /^mouse/gi, suffix: 'mice' },
		{
			regex:
				/^(bison|buffalo|deer|duck|fish|moose|pike|plankton|salmon|sheep|squid|swine|trout|sheap|equipment|information|rice|money|species|series|news)$/i,
			suffix: '$&',
		},
		{ regex: /(x|ch|ss|sh)$/gi, suffix: '$1es' },
		{ regex: /(hetero|canto|photo|zero|piano|pro|kimono|portico|quarto)$/gi, suffix: '$1s' },
		{ regex: /(?:([^f])fe|([lr])f)$/, suffix: '$1$2ves' },
		{ regex: /o$/gi, suffix: 'oes' },
		{ regex: /([^aeiouy]|qu)y$/gi, suffix: '$1ies' },
		{ regex: /s$/gi, suffix: 's' },
		{ regex: /$/gi, suffix: 's' },
	];

	for (const rule of rules) {
		if (noun.match(rule.regex)) {
			return noun.replace(rule.regex, rule.suffix);
		}
	}

	return noun;
}

/**
 * Returns a string with the count and properly pluralized word.
 * e.g. countAndPluralize(1, 'member') => '1 member'
 *      countAndPluralize(3, 'member') => '3 members'
 */
export function countAndPluralize(count: number, noun: string): string {
	return `${count} ${pluralize(noun, count)}`;
}

/**
 * Format a number as currency.
 * e.g. formatMoney(1234.5) => '$1,234.50'
 */
export function formatMoney(amount: number, currency = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		currency,
		style: 'currency',
	}).format(amount);
}

/**
 * Returns the ordinal suffix for a number.
 * e.g. getOrdinalSuffix(1) => 'st', getOrdinalSuffix(2) => 'nd', getOrdinalSuffix(11) => 'th'
 */
export function getOrdinalSuffix(n: number): string {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Formats a number with its ordinal suffix.
 * e.g. ordinal(1) => '1st', ordinal(3) => '3rd', ordinal(11) => '11th'
 */
export function ordinal(n: number): string {
	return `${n}${getOrdinalSuffix(n)}`;
}
