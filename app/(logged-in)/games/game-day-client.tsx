'use client';

import { addDays, format, parseISO } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Moon, Radio, Sun } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DatePicker from '@/components/ui/date-picker';
import { formatGameTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

import { GameDayCard, getGameDayData } from './actions';

interface GameDayClientProps {
	selectedDate: string;
}

const GameDayClient = ({ selectedDate }: GameDayClientProps) => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [games, setGames] = useState<GameDayCard[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchGames = useCallback(async (date: string, silent = false) => {
		if (!silent) {
			setLoading(true);
		}

		try {
			setGames(await getGameDayData(date));
		} finally {
			if (!silent) {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void fetchGames(selectedDate);
	}, [selectedDate, fetchGames]);

	const hasLiveGames = games.some((game) => game.status === 'Live');
	const intervalRef = useRef<null | ReturnType<typeof setInterval>>(null);

	useEffect(() => {
		if (hasLiveGames) {
			intervalRef.current = setInterval(() => void fetchGames(selectedDate, true), 30_000);
		}
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [hasLiveGames, selectedDate, fetchGames]);

	const goToDate = (date: string) => {
		startTransition(() => router.push(`/games?date=${date}`));
	};

	const parsedDate = parseISO(selectedDate);
	const liveCount = games.filter((game) => game.status === 'Live').length;
	const finalCount = games.filter((game) => game.status === 'Final').length;

	return (
		<div>
			<section className="night-panel relative mb-6 overflow-hidden rounded-[1.75rem] p-5 sm:p-8">
				<div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="eyebrow flex items-center gap-2 text-[#f2b84b]">
							{liveCount > 0 ? <Radio className="h-3.5 w-3.5 animate-pulse" /> : null}
							{liveCount > 0 ? `${liveCount} live now` : 'Daily baseball'}
						</p>
						<h1 className="display-type mt-2 text-5xl text-white sm:text-6xl">The slate</h1>
						<p className="mt-2 text-sm font-semibold text-white/55">
							{format(parsedDate, 'EEEE, MMMM d')} · {games.length} games · {finalCount} final
						</p>
					</div>
					<DatePicker
						onChange={(date) => date && goToDate(date)}
						placeholder="Select date"
						value={selectedDate}
					/>
				</div>
			</section>

			<div className="mb-6 grid grid-cols-[44px_1fr_44px] items-center gap-2">
				<Button
					aria-label="Previous day"
					onClick={() => goToDate(format(addDays(parsedDate, -1), 'yyyy-MM-dd'))}
					size="icon"
					variant="outline">
					<ChevronLeft />
				</Button>
				<div className="bg-card flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black">
					<CalendarDays className="text-primary h-4 w-4" />
					{format(parsedDate, 'EEE, MMM d')}
				</div>
				<Button
					aria-label="Next day"
					onClick={() => goToDate(format(addDays(parsedDate, 1), 'yyyy-MM-dd'))}
					size="icon"
					variant="outline">
					<ChevronRight />
				</Button>
			</div>

			{(loading || isPending) && (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<Card className="animate-pulse" key={index}>
							<CardContent className="h-56 p-4" />
						</Card>
					))}
				</div>
			)}
			{!loading && !isPending && games.length === 0 && (
				<Card className="border-dashed">
					<CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
						<div className="bg-muted flex h-12 w-12 items-center justify-center rounded-2xl">☂</div>
						<h2 className="mt-4 text-xl font-black">Rain delay</h2>
						<p className="text-muted-foreground mt-1 text-sm">
							No games are scheduled for this date.
						</p>
					</CardContent>
				</Card>
			)}
			{!loading && !isPending && games.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{games.map((game) => (
						<GameCard game={game} key={game.gameId} />
					))}
				</div>
			)}
		</div>
	);
};

const GameCard = ({ game }: { game: GameDayCard }) => {
	const isLive = game.status === 'Live';
	const isFinal = game.status === 'Final';
	const hasScore = isLive || isFinal;
	const awayWon = isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0);
	const homeWon = isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0);
	const status = isLive
		? `${game.inningState ?? ''} ${game.currentInning ?? ''}`.trim()
		: isFinal
			? 'Final'
			: formatGameTime(game.gameDate);

	return (
		<Link className="group block" href={`/games/${game.gameId}`}>
			<Card
				className={cn(
					'group-hover:border-foreground/25 relative h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg',
					isLive && 'border-primary/50',
				)}>
				{isLive && <div className="bg-primary absolute top-0 bottom-0 left-0 w-1" />}
				<CardContent className="p-0">
					<div className="border-border/70 flex items-center justify-between border-b px-4 py-3 text-[11px] font-bold tracking-wide uppercase">
						<span
							className={cn(
								'flex items-center gap-1.5',
								isLive ? 'text-primary' : 'text-muted-foreground',
							)}>
							{isLive ? (
								<span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
							) : game.dayNight === 'night' ? (
								<Moon className="h-3.5 w-3.5" />
							) : (
								<Sun className="h-3.5 w-3.5" />
							)}
							{status}
						</span>
						<span className="text-muted-foreground max-w-[150px] truncate normal-case">
							{game.venue?.name}
						</span>
					</div>

					<div className="space-y-1 p-3">
						<TeamScoreRow
							abbreviation={game.awayTeamAbbreviation}
							city={game.awayTeamCity}
							color={game.awayTeamColors?.primary}
							name={game.awayTeamName}
							record={game.awayRecord}
							score={hasScore ? game.awayScore : undefined}
							winner={awayWon}
						/>
						<TeamScoreRow
							abbreviation={game.homeTeamAbbreviation}
							city={game.homeTeamCity}
							color={game.homeTeamColors?.primary}
							name={game.homeTeamName}
							record={game.homeRecord}
							score={hasScore ? game.homeScore : undefined}
							winner={homeWon}
						/>
					</div>

					{(game.awayPitcher || game.homePitcher) && (
						<div className="border-border/70 mx-4 flex items-center justify-between border-t py-3 text-xs">
							<span className="text-muted-foreground truncate">{game.awayPitcher ?? 'TBD'}</span>
							<span className="text-muted-foreground px-2 text-[9px] font-black tracking-widest uppercase">
								Starters
							</span>
							<span className="text-muted-foreground truncate text-right">
								{game.homePitcher ?? 'TBD'}
							</span>
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	);
};

interface TeamScoreRowProps {
	abbreviation: string;
	city: string;
	color?: string;
	name: string;
	record?: string;
	score?: null | number;
	winner: boolean;
}

const TeamScoreRow = ({
	abbreviation,
	city,
	color,
	name,
	record,
	score,
	winner,
}: TeamScoreRowProps) => (
	<div className={cn('flex items-center gap-3 rounded-xl p-2.5', winner && 'bg-muted')}>
		<div
			className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white shadow-sm"
			style={{ backgroundColor: color ?? '#304657' }}>
			{abbreviation}
		</div>
		<div className="min-w-0 flex-1">
			<p className={cn('truncate text-sm', winner ? 'font-black' : 'font-bold')}>
				{name}
				<span className="sr-only">{city}</span>
			</p>
			<p className="text-muted-foreground mt-0.5 text-[11px]">{record}</p>
		</div>
		{score != null ? (
			<span
				className={cn(
					'tabular text-3xl',
					winner ? 'font-black' : 'text-muted-foreground font-bold',
				)}>
				{score}
			</span>
		) : (
			<ChevronRight className="text-muted-foreground h-5 w-5" />
		)}
	</div>
);

export default GameDayClient;
