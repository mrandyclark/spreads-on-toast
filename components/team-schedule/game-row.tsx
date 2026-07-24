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
			className="border-border hover:bg-muted/50 -mx-2 flex items-center justify-between gap-4 rounded-md border-b px-2 py-3 transition-colors last:border-0"
			href={`/games/${game.id}`}>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-xs">{game.isHome ? 'vs' : '@'}</span>
					<span className="truncate font-medium">{game.opponent.name}</span>
					<span className="text-muted-foreground text-xs">({game.opponent.abbreviation})</span>
					{gameTypeLabel && (
						<span className="bg-muted rounded px-1.5 py-0.5 text-xs">{gameTypeLabel}</span>
					)}
				</div>

				<div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
					<span className="flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						{date} • {time}
					</span>
				</div>
			</div>

			<div className="shrink-0 text-right">
				{game.status === GameState.Final && (
					<div className="text-sm">
						<span
							className={cn(
								'font-medium',
								game.homeTeam.score !== undefined &&
									game.awayTeam.score !== undefined &&
									((game.isHome && game.homeTeam.score > game.awayTeam.score) ||
										(!game.isHome && game.awayTeam.score > game.homeTeam.score))
									? 'text-green-600'
									: 'text-red-600',
							)}>
							{game.isHome
								? `${game.homeTeam.score}-${game.awayTeam.score}`
								: `${game.awayTeam.score}-${game.homeTeam.score}`}
						</span>
					</div>
				)}
				{game.status === GameState.Live && (
					<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
						Live
					</span>
				)}
				{game.status !== GameState.Final && game.status !== GameState.Live && (
					<span className="text-muted-foreground text-xs">{game.isHome ? 'Home' : 'Away'}</span>
				)}
			</div>
		</Link>
	);
};

export default GameRow;
