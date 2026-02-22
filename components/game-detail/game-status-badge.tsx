import { Badge } from '@/components/ui/badge';
import { formatGameTime } from '@/lib/date-utils';
import { Game, GameState } from '@/types';

interface GameStatusBadgeProps {
	game: Game;
}

const GameStatusBadge = ({ game }: GameStatusBadgeProps) => {
	if (game.status.abstractGameState === GameState.Final) {
		return (
			<Badge className="bg-muted text-muted-foreground border-0">
				Final{game.linescore && game.linescore.innings.length > 9 && ` (${game.linescore.innings.length})`}
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
};

export default GameStatusBadge;
