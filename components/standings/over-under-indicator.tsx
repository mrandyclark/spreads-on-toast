import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface OverUnderIndicatorProps {
	line: number;
	pythagoreanWins: number;
}

const OverUnderIndicator = ({ line, pythagoreanWins }: OverUnderIndicatorProps) => {
	const diff = pythagoreanWins - line;

	if (Math.abs(diff) < 0.5) {
		return (
			<span className="text-muted-foreground flex items-center gap-1 font-medium">
				<Minus className="h-4 w-4" />
				Push
			</span>
		);
	}

	if (diff > 0) {
		return (
			<span className="text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
				<ArrowUp className="h-4 w-4" />
				Over
			</span>
		);
	}

	return (
		<span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
			<ArrowDown className="h-4 w-4" />
			Under
		</span>
	);
};

export default OverUnderIndicator;
