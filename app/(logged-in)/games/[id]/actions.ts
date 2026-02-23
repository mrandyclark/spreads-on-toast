'use server';

import { ballparkService } from '@/server/ballparks/ballpark.service';
import { gameService } from '@/server/schedule/game.service';
import { Ballpark, Game } from '@/types';

/**
 * Get game detail with populated teams and ballpark data
 */
export async function getGameDetail(gameId: string): Promise<{
	ballpark: Ballpark | null;
	game: Game | null;
}> {
	const game = await gameService.findByIdPopulated(gameId);

	if (!game) {
		return { ballpark: null, game: null };
	}

	const ballpark = await ballparkService.findByMlbVenueId(game.venue.mlbId);

	return { ballpark, game };
}
