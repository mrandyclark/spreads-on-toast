import { TeamPickResult } from '@/types';

import TeamPickCard from './team-pick-card';

interface TeamPicksResultsProps {
	picks: TeamPickResult[];
}

const TeamPicksResults = ({ picks }: TeamPicksResultsProps) => {
	return (
		<div className="space-y-3">
			{picks.map((pick: TeamPickResult) => (
				<TeamPickCard
					abbreviation={pick.team.abbreviation}
					gamesPlayed={pick.gamesPlayed}
					key={pick.team.id}
					line={pick.line}
					pick={pick.pick}
					projectedWins={pick.projectedWins}
					result={pick.result}
					teamName={`${pick.team.city} ${pick.team.name}`}
				/>
			))}
		</div>
	);
};

export default TeamPicksResults;
