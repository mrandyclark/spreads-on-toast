import { Calendar } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { GameState, GameType, UpcomingGame } from '@/types';

const GAME_TYPE_LABELS: Partial<Record<GameType, string>> = {
	[GameType.DivisionSeries]: 'DS',
	[GameType.LeagueChampionship]: 'LCS',
	[GameType.RegularSeason]: '',
	[GameType.SpringTraining]: 'Spring',
	[GameType.WildCard]: 'WC',
	[GameType.WorldSeries]: 'WS',
};

function formatGameDate(dateString: string): { date: string; time: string } {
	const date = new Date(dateString);

	const dateFormatted = date.toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'short',
		weekday: 'short',
	});

	const timeFormatted = date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
	});

	return { date: dateFormatted, time: timeFormatted };
}

interface GameRowProps {
	game: UpcomingGame;
}

const GameRow = ({ game }: GameRowProps) => {
	const { date, time } = formatGameDate(game.gameDate);
	const gameTypeLabel = GAME_TYPE_LABELS[game.gameType];

	return (
		<Link
			className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-md"
			href={`/games/${game.id}`}>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-xs">
						{game.isHome ? 'vs' : '@'}
					</span>
					<span className="font-medium truncate">
						{game.opponent.name}
					</span>
					<span className="text-muted-foreground text-xs">
						({game.opponent.abbreviation})
					</span>
					{gameTypeLabel && (
						<span className="text-xs bg-muted px-1.5 py-0.5 rounded">
							{gameTypeLabel}
						</span>
					)}
				</div>

				<div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						{date} • {time}
					</span>
				</div>
			</div>

			<div className="text-right shrink-0">
				{game.status === GameState.Final && (
					<div className="text-sm">
						<span className={cn(
							'font-medium',
							game.homeTeam.score !== undefined && game.awayTeam.score !== undefined && (
								(game.isHome && game.homeTeam.score > game.awayTeam.score) ||
								(!game.isHome && game.awayTeam.score > game.homeTeam.score)
							) ? 'text-green-600' : 'text-red-600'
						)}>
							{game.isHome
								? `${game.homeTeam.score}-${game.awayTeam.score}`
								: `${game.awayTeam.score}-${game.homeTeam.score}`
							}
						</span>
					</div>
				)}
				{game.status === GameState.Live && (
					<span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
						Live
					</span>
				)}
				{game.status !== GameState.Final && game.status !== GameState.Live && (
					<span className="text-xs text-muted-foreground">
						{game.isHome ? 'Home' : 'Away'}
					</span>
				)}
			</div>
		</Link>
	);
};

export default GameRow;
