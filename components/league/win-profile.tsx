'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WinProfileData } from '@/types';

interface WinProfileProps {
	conference: string;
	data: WinProfileData;
}

const AL_BAR_CLASS = 'bg-red-600';
const NL_BAR_CLASS = 'bg-blue-600';

function SituationalBar({
	isNationalLeague,
	label,
	pct,
	record,
}: {
	isNationalLeague: boolean;
	label: string;
	pct: number;
	record: string;
}) {
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
}

function ContributionBar({ offense, pitching }: { offense: number; pitching: number }) {
	const offensePct = Math.round(offense * 100);
	const pitchingPct = Math.round(pitching * 100);

	return (
		<div className="space-y-3">
			<div className="text-muted-foreground text-sm font-medium">Run Contribution</div>
			<div className="h-4 w-full overflow-hidden rounded-full">
				<div className="flex h-full">
					<div
						className="flex items-center justify-center bg-red-600 text-xs font-medium text-white transition-all duration-300"
						style={{ width: `${offensePct}%` }}>
						{offensePct > 15 && `${offensePct}%`}
					</div>
					<div
						className="flex items-center justify-center bg-blue-600 text-xs font-medium text-white transition-all duration-300"
						style={{ width: `${pitchingPct}%` }}>
						{pitchingPct > 15 && `${pitchingPct}%`}
					</div>
				</div>
			</div>
			<div className="flex justify-between text-xs">
				<span className="text-red-600 dark:text-red-400">
					Offense {offensePct}%
				</span>
				<span className="text-blue-600 dark:text-blue-400">
					Pitching {pitchingPct}%
				</span>
			</div>
		</div>
	);
}

export function WinProfile({ conference, data }: WinProfileProps) {
	const isNationalLeague = conference === 'NL' || conference === 'National League';
	return (
		<Card>
			<CardHeader className="pb-4">
				<CardTitle>Win Profile</CardTitle>
				<CardDescription>How this team performs across different game types</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-6 md:grid-cols-2">
					{/* Situational Performance */}
					<div className="space-y-4">
						{data.situational.map((record) => (
							<SituationalBar
								isNationalLeague={isNationalLeague}
								key={record.label}
								label={record.label}
								pct={record.pct}
								record={`.${(record.pct * 1000).toFixed(0).padStart(3, '0')}`}
							/>
						))}
					</div>

					{/* Offense vs Pitching Split */}
					<div className="flex flex-col justify-center">
						<ContributionBar
							offense={data.offenseContribution}
							pitching={data.pitchingContribution}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
