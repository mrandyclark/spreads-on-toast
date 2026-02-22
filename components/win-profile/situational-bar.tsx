import { cn } from '@/lib/utils';

const AL_BAR_CLASS = 'bg-al';
const NL_BAR_CLASS = 'bg-nl';

interface SituationalBarProps {
	isNationalLeague: boolean;
	label: string;
	pct: number;
	record: string;
}

const SituationalBar = ({ isNationalLeague, label, pct, record }: SituationalBarProps) => {
	const barWidth = Math.max(pct * 100, 5);

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between text-sm">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-medium">{record}</span>
			</div>
			<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
				<div
					className={cn(
						'h-full rounded-full transition-all duration-300',
						isNationalLeague ? NL_BAR_CLASS : AL_BAR_CLASS,
					)}
					style={{ width: `${barWidth}%` }}
				/>
			</div>
		</div>
	);
};

export default SituationalBar;
