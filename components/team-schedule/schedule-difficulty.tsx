'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleDifficultyData } from '@/types';

import SOSCard from './sos-card';

interface ScheduleDifficultyProps {
	data: ScheduleDifficultyData;
}

const ScheduleDifficulty = ({ data }: ScheduleDifficultyProps) => {
	return (
		<Card className="h-full">
			<CardHeader className="pb-4">
				<CardTitle>Schedule Difficulty</CardTitle>
				<CardDescription>
					Strength of schedule based on opponent win percentage at time of each game
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4">
					<SOSCard
						data={data.played}
						title="Played (to date)"
						tooltipContent="Average win percentage of opponents faced in completed games. Uses each opponent's record at the time of the game, not their current record."
					/>
					<SOSCard
						data={data.remaining}
						title="Remaining"
						tooltipContent="Average win percentage of opponents in upcoming games. Includes postponed games that haven't been completed yet."
					/>
				</div>
			</CardContent>
		</Card>
	);
};

export default ScheduleDifficulty;
