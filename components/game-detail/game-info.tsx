import { Calendar, Clock, MapPin, Moon, Sun } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatGameDate, formatGameTime } from '@/lib/date-utils';
import { resolveRef } from '@/lib/ref-utils';
import { Game, GameType } from '@/types';

const GAME_TYPE_LABELS: Record<string, string> = {
	[GameType.DivisionSeries]: 'Division Series',
	[GameType.Exhibition]: 'Exhibition',
	[GameType.LeagueChampionship]: 'League Championship',
	[GameType.Postseason]: 'Postseason',
	[GameType.RegularSeason]: 'Regular Season',
	[GameType.SpringTraining]: 'Spring Training',
	[GameType.WildCard]: 'Wild Card',
	[GameType.WorldSeries]: 'World Series',
};

interface GameInfoProps {
	game: Game;
}

const GameInfo = ({ game }: GameInfoProps) => {
	const awayTeam = resolveRef(game.awayTeam.team);
	const homeTeam = resolveRef(game.homeTeam.team);
	const gameTypeLabel = GAME_TYPE_LABELS[game.gameType] ?? game.gameType;
	const isNight = game.dayNight === 'night';

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">Game Info</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 text-sm sm:grid-cols-2">
					<div className="flex items-center gap-2">
						<Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
						<span>{formatGameDate(game.gameDate)}</span>
					</div>
					<div className="flex items-center gap-2">
						<Clock className="text-muted-foreground h-4 w-4 shrink-0" />
						<span>{game.status.startTimeTBD ? 'Time TBD' : formatGameTime(game.gameDate)}</span>
					</div>
					<div className="flex items-center gap-2">
						<MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
						<span>{game.venue.name}</span>
					</div>
					<div className="flex items-center gap-2">
						{isNight
							? <Moon className="text-muted-foreground h-4 w-4 shrink-0" />
							: <Sun className="text-muted-foreground h-4 w-4 shrink-0" />
						}
						<span>{isNight ? 'Night game' : 'Day game'}</span>
					</div>
				</div>

				<div className="border-border mt-4 border-t pt-4">
					<div className="grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<span className="text-muted-foreground">Game type</span>
							<p className="font-medium">{gameTypeLabel}</p>
						</div>
						{game.seriesDescription && (
							<div>
								<span className="text-muted-foreground">Series</span>
								<p className="font-medium">
									{game.seriesDescription}
									{game.gamesInSeries > 1 && ` (Game ${game.seriesGameNumber} of ${game.gamesInSeries})`}
								</p>
							</div>
						)}
					</div>
				</div>

				{(awayTeam || homeTeam) && (
					<div className="border-border mt-4 border-t pt-4">
						<div className="grid gap-3 text-sm sm:grid-cols-2">
							{awayTeam && (
								<div>
									<span className="text-muted-foreground">{awayTeam.abbreviation} record</span>
									<p className="font-medium">
										{game.awayTeam.leagueRecord.wins}-{game.awayTeam.leagueRecord.losses}
										{' '}
										<span className="text-muted-foreground">({game.awayTeam.leagueRecord.pct})</span>
									</p>
								</div>
							)}
							{homeTeam && (
								<div>
									<span className="text-muted-foreground">{homeTeam.abbreviation} record</span>
									<p className="font-medium">
										{game.homeTeam.leagueRecord.wins}-{game.homeTeam.leagueRecord.losses}
										{' '}
										<span className="text-muted-foreground">({game.homeTeam.leagueRecord.pct})</span>
									</p>
								</div>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default GameInfo;
