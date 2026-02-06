import { Check, Minus, X } from 'lucide-react';
import { createElement } from 'react';

import { PickResult } from '@/types';

/**
 * Returns the appropriate icon component for a pick result
 */
export function getResultIcon(result: PickResult, className = 'h-4 w-4') {
	switch (result) {
		case PickResult.Win:
			return createElement(Check, { className: `${className} text-green-500` });
		case PickResult.Loss:
			return createElement(X, { className: `${className} text-red-500` });
		case PickResult.Push:
			return createElement(Minus, { className: `${className} text-yellow-500` });
		default:
			return null;
	}
}

/**
 * Returns CSS classes for result background styling
 */
export function getResultBgClass(result: PickResult): string {
	switch (result) {
		case PickResult.Win:
			return 'bg-green-500/10';
		case PickResult.Loss:
			return 'bg-red-500/10';
		case PickResult.Push:
			return 'bg-yellow-500/10';
		default:
			return '';
	}
}

/**
 * Returns CSS classes for result border styling
 */
export function getResultBorderClass(result: PickResult): string {
	switch (result) {
		case PickResult.Win:
			return 'border-green-500/50 bg-green-500/5';
		case PickResult.Loss:
			return 'border-red-500/50 bg-red-500/5';
		case PickResult.Push:
			return 'border-yellow-500/50 bg-yellow-500/5';
		default:
			return 'border-border';
	}
}
