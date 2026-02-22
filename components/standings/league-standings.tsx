import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StandingsBoardData } from '@/types';

import DivisionRows from './division-rows';

interface LeagueStandingsProps {
	divisions: string[];
	standings: StandingsBoardData[];
	title: string;
}

const LeagueStandings = ({ divisions, standings, title }: LeagueStandingsProps) => {
	return (
		<Card className="min-w-0 overflow-hidden">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-border border-b">
								<th className="text-muted-foreground bg-card sticky left-0 z-10 w-[50px] px-2 py-3 text-center font-medium"></th>
								<th className="text-muted-foreground px-2 py-3 text-left font-medium">Team</th>
								<th className="text-muted-foreground w-[50px] px-2 py-3 text-center font-medium">W</th>
								<th className="text-muted-foreground w-[50px] px-2 py-3 text-center font-medium">L</th>
								<th className="text-muted-foreground w-[60px] px-2 py-3 text-center font-medium">Line</th>
								<th className="text-muted-foreground w-[70px] px-2 py-3 text-center font-medium">Proj W</th>
								<th className="text-muted-foreground w-[80px] px-2 py-3 text-center font-medium">O/U</th>
							</tr>
						</thead>
						<tbody>
							{divisions.map((division) => {
								const divisionStandings = standings.filter((t) => t.division === division);

								return (
									<DivisionRows
										division={division}
										key={division}
										standings={divisionStandings}
									/>
								);
							})}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
};

export default LeagueStandings;
