import { DIVISION_LABELS, DIVISION_ORDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Team } from '@/types';

interface TeamPickerProps {
	onToggle: (teamId: string) => void;
	selectedTeamIds: string[];
	teamsByDivision: Record<string, Team[]>;
}

const TeamPicker = ({ onToggle, selectedTeamIds, teamsByDivision }: TeamPickerProps) => {
	return (
		<div className="space-y-3">
			{DIVISION_ORDER.map((div) => {
				const divTeams = teamsByDivision[div];

				if (!divTeams || divTeams.length === 0) {
					return null;
				}

				return (
					<div key={div}>
						<p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">
							{DIVISION_LABELS[div] ?? div}
						</p>
						<div className="flex flex-wrap gap-1.5">
							{divTeams.map((team) => (
								<button
									className={cn(
										'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
										selectedTeamIds.includes(team.id)
											? 'border-primary bg-primary/10 text-primary'
											: 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
									)}
									key={team.id}
									onClick={() => onToggle(team.id)}
									type="button">
									{team.abbreviation}
								</button>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default TeamPicker;
