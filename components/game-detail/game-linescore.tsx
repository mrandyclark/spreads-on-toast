import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveRef } from '@/lib/ref-utils';
import { Game, GameInning } from '@/types';

interface GameLinescoreProps {
	game: Game;
}

const GameLinescore = ({ game }: GameLinescoreProps) => {
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
									{resolveRef(game.awayTeam.team)?.abbreviation ?? 'AWAY'}
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
									{resolveRef(game.homeTeam.team)?.abbreviation ?? 'HOME'}
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
};

export default GameLinescore;
