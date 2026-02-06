'use client';

import { PickChoice, PostseasonPicks, Sheet, WorldSeriesPicks } from '@/types';

import { MlbPostseasonPicks } from './mlb-postseason-picks';
import { MlbTeamPicks } from './mlb-team-picks';
import { MlbWorldSeriesPicks } from './mlb-world-series-picks';

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
export function MlbPicksForm({ onPostseasonPicksChange, onTeamPicksChange, onWorldSeriesPicksChange, sheet }: MlbPicksFormProps) {
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
          onPicksChange={onPostseasonPicksChange}
          teamPicks={sheet.teamPicks}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">World Series</h2>
        <MlbWorldSeriesPicks
          initialPicks={sheet.worldSeriesPicks}
          onPicksChange={onWorldSeriesPicksChange}
          teamPicks={sheet.teamPicks}
        />
      </section>
    </div>
  );
}
