import ScheduleDifficulty from '@/components/team-schedule/schedule-difficulty';
import UpcomingSchedule from '@/components/team-schedule/upcoming-schedule';
import { gameService } from '@/server/schedule/game.service';
import { getScheduleDifficultyByTeamId } from '@/server/schedule/schedule-difficulty';

interface TeamScheduleSectionProps {
	season: string;
	selectedDate: string;
	teamAbbreviation: string;
	teamId: string;
}

export async function TeamScheduleSection({
	season,
	selectedDate,
	teamAbbreviation,
	teamId,
}: TeamScheduleSectionProps) {
	const [scheduleDifficulty, upcomingGames] = await Promise.all([
		getScheduleDifficultyByTeamId(teamId, season, selectedDate),
		gameService.getUpcomingGames(teamId, selectedDate, 5),
	]);

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			{scheduleDifficulty && <ScheduleDifficulty data={scheduleDifficulty} />}
			<UpcomingSchedule games={upcomingGames} teamAbbreviation={teamAbbreviation} />
		</div>
	);
}
