import { ArrowLeft, Calendar, Clock, MapPin, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/layout/site-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { gameService } from '@/server/schedule/game.service';
import { Game, GameInning, GameState, GameType, Team } from '@/types';

interface GamePageProps {
	params: Promise<{ id: string }>;
}

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

function teamFromRef(ref: Game['homeTeam']['team']): null | Team {
	return typeof ref === 'object' ? (ref as Team) : null;
}

function formatGameDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'long',
		weekday: 'long',
		year: 'numeric',
	});
}

function formatGameTime(date: Date): string {
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short',
	});
}

function TeamLogo({ abbreviation, colors }: { abbreviation: string; colors?: { primary: string; secondary: string } }) {
	return (
		<div
			className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold shadow-sm sm:h-20 sm:w-20 sm:text-2xl"
			style={{
				backgroundColor: colors?.primary ?? '#6b7280',
				color: colors?.secondary ?? '#ffffff',
			}}>
			{abbreviation}
		</div>
	);
}

function GameStatusBadge({ game }: { game: Game }) {
	if (game.status.abstractGameState === GameState.Final) {
		return (
			<Badge className="bg-muted text-muted-foreground border-0">
				Final{game.linescore && game.linescore.innings.length > 9 ? ` (${game.linescore.innings.length})` : ''}
			</Badge>
		);
	}

	if (game.status.abstractGameState === GameState.Live) {
		return (
			<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
				Live
			</Badge>
		);
	}

	return (
		<Badge className="border-0" variant="secondary">
			{game.status.startTimeTBD ? 'TBD' : formatGameTime(game.gameDate)}
		</Badge>
	);
}

function ScoreDisplay({ awayScore, awayWinner, homeScore, homeWinner, isFinal }: {
	awayScore?: number;
	awayWinner?: boolean;
	homeScore?: number;
	homeWinner?: boolean;
	isFinal: boolean;
}) {
	if (!isFinal || awayScore === undefined || homeScore === undefined) {
		return (
			<div className="text-muted-foreground text-center text-3xl font-light tracking-wider sm:text-4xl">
				vs
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3 sm:gap-4">
			<span className={cn(
				'text-4xl font-bold tabular-nums sm:text-5xl',
				awayWinner ? 'text-foreground' : 'text-muted-foreground/60',
			)}>
				{awayScore}
			</span>
			<span className="text-muted-foreground text-lg">-</span>
			<span className={cn(
				'text-4xl font-bold tabular-nums sm:text-5xl',
				homeWinner ? 'text-foreground' : 'text-muted-foreground/60',
			)}>
				{homeScore}
			</span>
		</div>
	);
}

function Linescore({ game }: { game: Game }) {
	if (!game.linescore || !game.linescore.innings.length) {
		return null;
	}

	const { innings, teams } = game.linescore;

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">Linescore</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-muted-foreground border-b">
								<th className="py-2 pr-4 text-left font-medium" />
								{innings.map((inning: GameInning) => (
									<th className="min-w-[2rem] px-1 py-2 text-center font-medium" key={inning.num}>
										{inning.num}
									</th>
								))}
								<th className="border-border border-l px-2 py-2 text-center font-bold">R</th>
								<th className="px-2 py-2 text-center font-bold">H</th>
								<th className="px-2 py-2 text-center font-bold">E</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-b">
								<td className="py-2 pr-4 font-medium">
									{teamFromRef(game.awayTeam.team)?.abbreviation ?? 'AWAY'}
								</td>
								{innings.map((inning: GameInning) => (
									<td className="px-1 py-2 text-center tabular-nums" key={inning.num}>
										{inning.away.runs ?? '-'}
									</td>
								))}
								<td className="border-border border-l px-2 py-2 text-center font-bold tabular-nums">
									{teams.away.runs}
								</td>
								<td className="px-2 py-2 text-center tabular-nums">{teams.away.hits}</td>
								<td className="px-2 py-2 text-center tabular-nums">{teams.away.errors}</td>
							</tr>
							<tr>
								<td className="py-2 pr-4 font-medium">
									{teamFromRef(game.homeTeam.team)?.abbreviation ?? 'HOME'}
								</td>
								{innings.map((inning: GameInning) => (
									<td className="px-1 py-2 text-center tabular-nums" key={inning.num}>
										{inning.home.runs ?? '-'}
									</td>
								))}
								<td className="border-border border-l px-2 py-2 text-center font-bold tabular-nums">
									{teams.home.runs}
								</td>
								<td className="px-2 py-2 text-center tabular-nums">{teams.home.hits}</td>
								<td className="px-2 py-2 text-center tabular-nums">{teams.home.errors}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}

function GameInfo({ game }: { game: Game }) {
	const awayTeam = teamFromRef(game.awayTeam.team);
	const homeTeam = teamFromRef(game.homeTeam.team);
	const gameTypeLabel = GAME_TYPE_LABELS[game.gameType] ?? game.gameType;

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
						{game.dayNight === 'night'
							? <Moon className="text-muted-foreground h-4 w-4 shrink-0" />
							: <Sun className="text-muted-foreground h-4 w-4 shrink-0" />
						}
						<span>{game.dayNight === 'night' ? 'Night game' : 'Day game'}</span>
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
}

export default async function GamePage({ params }: GamePageProps) {
	const { id } = await params;

	const game = await gameService.findByIdPopulated(id);

	if (!game) {
		notFound();
	}

	const awayTeam = teamFromRef(game.awayTeam.team);
	const homeTeam = teamFromRef(game.homeTeam.team);
	const isFinal = game.status.abstractGameState === GameState.Final;

	const awayAbbr = awayTeam?.abbreviation?.toLowerCase();
	const homeAbbr = homeTeam?.abbreviation?.toLowerCase();

	return (
		<div className="bg-background min-h-screen">
			<SiteHeader />

			<main className="mx-auto max-w-4xl px-4 py-8">
				{/* Back link */}
				<div className="mb-6">
					{homeAbbr ? (
						<Link
							className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
							href={`/teams/mlb/${homeAbbr}`}>
							<ArrowLeft className="h-4 w-4" />
							Back to {homeTeam?.city} {homeTeam?.name}
						</Link>
					) : (
						<Link
							className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
							href="/dashboard">
							<ArrowLeft className="h-4 w-4" />
							Back to dashboard
						</Link>
					)}
				</div>

				{/* Matchup hero */}
				<Card className="mb-6 overflow-hidden">
					<CardContent className="p-6 sm:p-8">
						<div className="flex flex-col items-center gap-6">
							{/* Status badge */}
							<GameStatusBadge game={game} />

							{/* Teams + Score */}
							<div className="flex w-full items-center justify-center gap-4 sm:gap-8">
								{/* Away team */}
								<div className="flex flex-1 flex-col items-center gap-2 text-center">
									<TeamLogo
										abbreviation={awayTeam?.abbreviation ?? '?'}
										colors={awayTeam?.colors}
									/>
									<div>
										<p className="text-muted-foreground text-xs">Away</p>
										<p className="text-sm font-medium sm:text-base">
											{awayTeam?.city ?? 'TBD'}
										</p>
										<p className="text-lg font-bold sm:text-xl">
											{awayTeam?.name ?? 'TBD'}
										</p>
									</div>
									{awayAbbr && (
										<Link
											className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
											href={`/teams/mlb/${awayAbbr}`}>
											Team page →
										</Link>
									)}
								</div>

								{/* Score */}
								<ScoreDisplay
									awayScore={game.awayTeam.score}
									awayWinner={game.awayTeam.isWinner}
									homeScore={game.homeTeam.score}
									homeWinner={game.homeTeam.isWinner}
									isFinal={isFinal}
								/>

								{/* Home team */}
								<div className="flex flex-1 flex-col items-center gap-2 text-center">
									<TeamLogo
										abbreviation={homeTeam?.abbreviation ?? '?'}
										colors={homeTeam?.colors}
									/>
									<div>
										<p className="text-muted-foreground text-xs">Home</p>
										<p className="text-sm font-medium sm:text-base">
											{homeTeam?.city ?? 'TBD'}
										</p>
										<p className="text-lg font-bold sm:text-xl">
											{homeTeam?.name ?? 'TBD'}
										</p>
									</div>
									{homeAbbr && (
										<Link
											className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
											href={`/teams/mlb/${homeAbbr}`}>
											Team page →
										</Link>
									)}
								</div>
							</div>

							{/* Description (e.g., postponement reason) */}
							{game.description && (
								<p className="text-muted-foreground text-center text-sm italic">
									{game.description}
								</p>
							)}
							{game.status.reason && (
								<p className="text-muted-foreground text-center text-sm italic">
									{game.status.reason}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Linescore (final games only) */}
				{isFinal && <div className="mb-6"><Linescore game={game} /></div>}

				{/* Game info */}
				<GameInfo game={game} />
			</main>
		</div>
	);
}
