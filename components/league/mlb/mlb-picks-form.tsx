'use client';

import { MlbPostseasonPicks } from './mlb-postseason-picks';
import { MlbTeamPicks } from './mlb-team-picks';
import { MlbWorldSeriesPicks } from './mlb-world-series-picks';

/**
 * Combined MLB picks form for the pre-lock state
 * Contains all pick sections: team win totals, postseason, and World Series
 */
export function MlbPicksForm() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-xl font-semibold">Team Win Totals</h2>
        <MlbTeamPicks />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Postseason Predictions</h2>
        <MlbPostseasonPicks />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">World Series</h2>
        <MlbWorldSeriesPicks />
      </section>
    </div>
  );
}
