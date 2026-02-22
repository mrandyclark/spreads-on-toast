import Link from 'next/link';

import { DIVISION_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { StandingsBoardData } from '@/types';

import OverUnderIndicator from './over-under-indicator';

interface DivisionRowsProps {
	division: string;
	standings: StandingsBoardData[];
}

const DivisionRows = ({ division, standings }: DivisionRowsProps) => {
	const sortedStandings = [...standings].sort((a, b) => b.pythagoreanWins - a.pythagoreanWins);

	return (
		<>
			<tr>
				<td
					className="bg-foreground/80 px-4 py-2 text-sm font-semibold text-white dark:bg-foreground/60"
					colSpan={7}>
					{DIVISION_LABELS[division] ?? division}
				</td>
			</tr>
			{sortedStandings.map((team) => (
				<tr className="border-border border-b" key={team.abbreviation}>
					<td className="text-muted-foreground bg-card sticky left-0 z-10 w-[50px] px-2 py-2 text-center text-xs">{team.abbreviation}</td>
					<td className="px-2 py-2 font-medium">
						<Link
							className="hover:text-primary hover:underline"
							href={`/teams/mlb/${team.abbreviation.toLowerCase()}`}>
							{team.name}
						</Link>
					</td>
					<td className="px-2 py-2 text-center">{team.wins}</td>
					<td className="px-2 py-2 text-center">{team.losses}</td>
					<td className="px-2 py-2 text-center">{team.line}</td>
					<td
						className={cn(
							'px-2 py-2 text-center font-medium',
							team.pythagoreanWins > team.line && 'text-green-600 dark:text-green-400',
							team.pythagoreanWins < team.line && 'text-red-600 dark:text-red-400',
						)}>
						{team.pythagoreanWins.toFixed(1)}
					</td>
					<td className="px-2 py-2 text-center">
						<OverUnderIndicator line={team.line} pythagoreanWins={team.pythagoreanWins} />
					</td>
				</tr>
			))}
		</>
	);
};

export default DivisionRows;
