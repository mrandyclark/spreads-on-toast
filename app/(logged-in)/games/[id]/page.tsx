import Link from 'next/link';
import { notFound } from 'next/navigation';

import GameInfo from '@/components/game-detail/game-info';
import GameLinescore from '@/components/game-detail/game-linescore';
import GameStatusBadge from '@/components/game-detail/game-status-badge';
import ScoreDisplay from '@/components/game-detail/score-display';
import TeamLogo from '@/components/game-detail/team-logo';
import BackLink from '@/components/layout/back-link';
import PageShell from '@/components/layout/page-shell';
import { Card, CardContent } from '@/components/ui/card';
import { resolveRef } from '@/lib/ref-utils';
import { gameService } from '@/server/schedule/game.service';
import { GameState } from '@/types';

interface GamePageProps {
	params: Promise<{ id: string }>;
}

const GamePage = async ({ params }: GamePageProps) => {
	const { id } = await params;

	const game = await gameService.findByIdPopulated(id);

	if (!game) {
		notFound();
	}

	const awayTeam = resolveRef(game.awayTeam.team);
	const homeTeam = resolveRef(game.homeTeam.team);
	const isFinal = game.status.abstractGameState === GameState.Final;

	const awayAbbr = awayTeam?.abbreviation?.toLowerCase();
	const homeAbbr = homeTeam?.abbreviation?.toLowerCase();

	return (
		<PageShell maxWidth="4xl">
			{/* Back link */}
			<div className="mb-6">
				<BackLink
					href={homeAbbr ? `/teams/mlb/${homeAbbr}` : '/dashboard'}
					label={homeAbbr ? `Back to ${homeTeam?.city} ${homeTeam?.name}` : 'Back to dashboard'}
				/>
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
			{isFinal && <div className="mb-6"><GameLinescore game={game} /></div>}

			{/* Game info */}
			<GameInfo game={game} />
		</PageShell>
	);
};

export default GamePage;
