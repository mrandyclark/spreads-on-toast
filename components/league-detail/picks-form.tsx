'use client';

import { useState } from 'react';

import { PickChoice, PostseasonPicks, Sheet, WorldSeriesPicks } from '@/types';

import MlbPostseasonPicks from './postseason-picks';
import MlbTeamPicks from './team-picks';
import MlbWorldSeriesPicks from './world-series-picks';

interface MlbPicksFormProps {
	onPostseasonPicksChange?: (picks: PostseasonPicks) => void;
	onTeamPicksChange?: (picks: Record<string, PickChoice>) => void;
	onWorldSeriesPicksChange?: (picks: WorldSeriesPicks) => void;
	sheet: Sheet;
}

/**
 * Combined MLB picks form for the pre-lock state
 * Contains all pick sections: team win totals, postseason, and World Series
 */
const MlbPicksForm = ({
	onPostseasonPicksChange,
	onTeamPicksChange,
	onWorldSeriesPicksChange,
	sheet,
}: MlbPicksFormProps) => {
	const [postseasonPicks, setPostseasonPicks] = useState<PostseasonPicks>(
		sheet.postseasonPicks ?? { al: [], nl: [] },
	);

	const handlePostseasonPicksChange = (picks: PostseasonPicks) => {
		setPostseasonPicks(picks);
		onPostseasonPicksChange?.(picks);
	};

	return (
		<div className="space-y-8">
			<section>
				<h2 className="mb-4 text-xl font-semibold">Team Win Totals</h2>
				<MlbTeamPicks onPicksChange={onTeamPicksChange} teamPicks={sheet.teamPicks} />
			</section>

			<section>
				<h2 className="mb-4 text-xl font-semibold">Postseason Predictions</h2>
				<MlbPostseasonPicks
					initialPicks={sheet.postseasonPicks}
					onPicksChange={handlePostseasonPicksChange}
					teamPicks={sheet.teamPicks}
				/>
			</section>

			<section>
				<h2 className="mb-4 text-xl font-semibold">World Series</h2>
				<MlbWorldSeriesPicks
					initialPicks={sheet.worldSeriesPicks}
					onPicksChange={onWorldSeriesPicksChange}
					postseasonPicks={postseasonPicks}
					teamPicks={sheet.teamPicks}
				/>
			</section>
		</div>
	);
}

export default MlbPicksForm;
