import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface OverUnderBadgeProps {
	line: number;
	projected: number;
}

const OverUnderBadge = ({ line, projected }: OverUnderBadgeProps) => {
	const diff = projected - line;

	if (Math.abs(diff) < 0.5) {
		return (
			<span className="text-muted-foreground inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium dark:bg-gray-800">
				<Minus className="h-4 w-4" />
				Push
			</span>
		);
	}

	if (diff > 0) {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
				<ArrowUp className="h-4 w-4" />
				Over by {diff.toFixed(1)}
			</span>
		);
	}

	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
			<ArrowDown className="h-4 w-4" />
			Under by {Math.abs(diff).toFixed(1)}
		</span>
	);
};

export default OverUnderBadge;
