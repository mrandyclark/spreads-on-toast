interface ContributionBarProps {
	offense: number;
	pitching: number;
}

const ContributionBar = ({ offense, pitching }: ContributionBarProps) => {
	const offensePct = Math.round(offense * 100);
	const pitchingPct = Math.round(pitching * 100);

	return (
		<div className="space-y-3">
			<div className="text-muted-foreground text-sm font-medium">Run Contribution</div>
			<div className="h-4 w-full overflow-hidden rounded-full">
				<div className="flex h-full">
					<div
						className="bg-al flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
						style={{ width: `${offensePct}%` }}>
						{offensePct > 15 && `${offensePct}%`}
					</div>
					<div
						className="bg-nl flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
						style={{ width: `${pitchingPct}%` }}>
						{pitchingPct > 15 && `${pitchingPct}%`}
					</div>
				</div>
			</div>
			<div className="flex justify-between text-xs">
				<span className="text-al">Offense {offensePct}%</span>
				<span className="text-nl">Pitching {pitchingPct}%</span>
			</div>
		</div>
	);
};

export default ContributionBar;
