import PageShell from '@/components/layout/page-shell';
import { todayET } from '@/lib/date-utils';

import GameDayClient from './game-day-client';

interface GamesPageProps {
	searchParams: Promise<{
		date?: string;
	}>;
}

const GamesPage = async ({ searchParams }: GamesPageProps) => {
	const { date: dateParam } = await searchParams;
	const selectedDate = dateParam ?? todayET();

	return (
		<PageShell>
			<GameDayClient selectedDate={selectedDate} />
		</PageShell>
	);
};

export default GamesPage;
