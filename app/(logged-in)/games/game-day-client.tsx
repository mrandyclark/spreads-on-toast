'use client';

import { Calendar, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { GameDayCard, getGameDayData } from './actions';

interface GameDayClientProps {
	selectedDate: string;
}

const GameDayClient = ({ selectedDate }: GameDayClientProps) => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [games, setGames] = useState<GameDayCard[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchGames = useCallback(async (date: string) => {
		setLoading(true);

		try {
			const data = await getGameDayData(date);
			setGames(data);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchGames(selectedDate);
	}, [selectedDate, fetchGames]);

	const handleDateChange = (newDate: string) => {
		startTransition(() => {
			router.push(`/games?date=${newDate}`);
		});
	};

	const formatDisplayDate = (dateStr: string) => {
		const [year, month, day] = dateStr.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString('en-US', {
			day: 'numeric',
			month: 'long',
			weekday: 'long',
			year: 'numeric',
		});
	};

	const formatGameTime = (isoDate: string) => {
		const date = new Date(isoDate);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
		});
	};

	return (
		<div>
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Game Day</h1>
					<p className="text-muted-foreground text-sm">
						{formatDisplayDate(selectedDate)}
						{games.length > 0 && ` · ${games.length} game${games.length !== 1 ? 's' : ''}`}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Calendar className="text-muted-foreground h-4 w-4" />
					<Input
						className="w-auto"
						onChange={(e) => handleDateChange(e.target.value)}
						type="date"
						value={selectedDate}
					/>
				</div>
			</div>

			{/* Games grid */}
			{loading || isPending ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Card className="animate-pulse" key={i}>
							<CardContent className="h-48 p-4" />
						</Card>
					))}
				</div>
			) : games.length === 0 ? (
				<Card>
					<CardContent className="flex items-center justify-center p-12">
						<p className="text-muted-foreground">No games scheduled for this date.</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{games.map((game) => (
						<GameCard formatGameTime={formatGameTime} game={game} key={game.gameId} />
					))}
				</div>
			)}
		</div>
	);
};

const GameCard = ({ formatGameTime, game }: { formatGameTime: (d: string) => string; game: GameDayCard }) => {
	return (
		<Link href={`/games/${game.gameId}`}>
			<Card className="hover:bg-muted/50 transition-colors">
				<CardContent className="p-4">
					{/* Time + Venue row */}
					<div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
						<div className="flex items-center gap-1.5">
							{game.dayNight === 'night' ? (
								<Moon className="h-3 w-3" />
							) : (
								<Sun className="h-3 w-3" />
							)}
							<span>{formatGameTime(game.gameDate)}</span>
						</div>
						{game.venue && (
							<span className="truncate pl-2">{game.venue.name}</span>
						)}
					</div>

					{/* Matchup */}
					<div className="space-y-2">
						{/* Away team */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span
									className="inline-block h-3 w-3 rounded-full"
									style={{ backgroundColor: game.awayTeamColors?.primary ?? '#666' }}
								/>
								<span className="font-semibold">{game.awayTeamAbbreviation}</span>
								<span className="text-muted-foreground text-sm">{game.awayTeamCity} {game.awayTeamName}</span>
							</div>
							<span className="text-muted-foreground text-xs">{game.awayRecord}</span>
						</div>

						{/* Home team */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span
									className="inline-block h-3 w-3 rounded-full"
									style={{ backgroundColor: game.homeTeamColors?.primary ?? '#666' }}
								/>
								<span className="font-semibold">{game.homeTeamAbbreviation}</span>
								<span className="text-muted-foreground text-sm">{game.homeTeamCity} {game.homeTeamName}</span>
							</div>
							<span className="text-muted-foreground text-xs">{game.homeRecord}</span>
						</div>
					</div>

					{/* Pitchers */}
					{(game.awayPitcher || game.homePitcher) && (
						<div className="text-muted-foreground mt-3 border-t pt-3 text-xs">
							<div className="flex justify-between">
								<span>{game.awayPitcher ?? 'TBD'}</span>
								<span className="font-medium">vs</span>
								<span>{game.homePitcher ?? 'TBD'}</span>
							</div>
						</div>
					)}

					{/* Venue info */}
					{game.venue && (
						<div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
							{game.venue.roofType !== 'open' && (
								<span className="bg-muted rounded px-1.5 py-0.5 capitalize">{game.venue.roofType}</span>
							)}
							{game.venue.elevation > 1000 && (
								<span className="bg-muted rounded px-1.5 py-0.5">{game.venue.elevation.toLocaleString()}ft</span>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	);
};

export default GameDayClient;
