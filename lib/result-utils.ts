import { Check, Minus, X } from 'lucide-react';
import { createElement } from 'react';

export type PickResult = 'loss' | 'pending' | 'push' | 'win';

/**
 * Returns the appropriate icon component for a pick result
 */
export function getResultIcon(result: PickResult, className = 'h-4 w-4') {
	switch (result) {
		case 'win':
			return createElement(Check, { className: `${className} text-green-500` });
		case 'loss':
			return createElement(X, { className: `${className} text-red-500` });
		case 'push':
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
		case 'win':
			return 'bg-green-500/10';
		case 'loss':
			return 'bg-red-500/10';
		case 'push':
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
		case 'win':
			return 'border-green-500/50 bg-green-500/5';
		case 'loss':
			return 'border-red-500/50 bg-red-500/5';
		case 'push':
			return 'border-yellow-500/50 bg-yellow-500/5';
		default:
			return 'border-border';
	}
}
