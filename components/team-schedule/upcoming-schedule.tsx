'use client';

import { Calendar } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpcomingGame } from '@/types';

import GameRow from './game-row';

interface UpcomingScheduleProps {
	games: UpcomingGame[];
	teamAbbreviation: string;
}

const UpcomingSchedule = ({ games }: UpcomingScheduleProps) => {
	return (
		<Card className="h-full">
			<CardHeader className="pb-4">
				<CardTitle>Upcoming Games</CardTitle>
				<CardDescription>
					Next {games.length} scheduled games
				</CardDescription>
			</CardHeader>
			<CardContent>
				{games.length === 0 && (
					<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
						<Calendar className="h-8 w-8 mb-2" />
						<span className="text-sm">No upcoming games scheduled</span>
					</div>
				)}
				{games.length > 0 && (
					<div className="divide-y divide-border">
						{games.map((game) => (
							<GameRow
								game={game}
								key={game.mlbGameId}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default UpcomingSchedule;
