import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
	awayScore?: number;
	awayWinner?: boolean;
	homeScore?: number;
	homeWinner?: boolean;
	isFinal: boolean;
}

const ScoreDisplay = ({ awayScore, awayWinner, homeScore, homeWinner, isFinal }: ScoreDisplayProps) => {
	if (!isFinal || awayScore === undefined || homeScore === undefined) {
		return (
			<div className="text-muted-foreground text-center text-3xl font-light tracking-wider sm:text-4xl">
				vs
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3 sm:gap-4">
			<span className={cn(
				'text-4xl font-bold tabular-nums sm:text-5xl',
				awayWinner ? 'text-foreground' : 'text-muted-foreground/60',
			)}>
				{awayScore}
			</span>
			<span className="text-muted-foreground text-lg">-</span>
			<span className={cn(
				'text-4xl font-bold tabular-nums sm:text-5xl',
				homeWinner ? 'text-foreground' : 'text-muted-foreground/60',
			)}>
				{homeScore}
			</span>
		</div>
	);
};

export default ScoreDisplay;
