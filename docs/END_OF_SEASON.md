# End-of-season scoring and export

## How the app works

The Next.js app reads private groups and pick sheets from MongoDB. Daily MLB standings
syncs store actual wins/losses alongside pace and Pythagorean estimates. League results
and leaderboards share `server/picks/scoring.ts`: they use Pythagorean wins (pace as a
fallback) until `Season.status` is `completed` or the scoring date is after `Season.endDate`.
They then use `standing.wins`. No recalculation or overwrite of saved picks is required.

Only over/under picks count toward the current leaderboard. Postseason and World Series
selections are stored but are not scored. Agree on any extra points or tiebreaker before
declaring an overall winner. The export preserves tied ranks.

## Findings on September 28, 2026

- At inspection, the 2026 season was `upcoming`, with `endDate = 2026-10-01T00:00:00.000Z`.
  The seed set these values and no lifecycle job advances status.
- The four-member 2026 league has 120 selected picks and a complete 30-team standings
  snapshot dated September 28, fetched at 11:00:35 UTC. This is not a stale-feed problem.
- All 120 legacy picks lack line snapshots. The app falls back to configured 2026 lines.
  Those line records have February 5 update timestamps. Preserve the exported source as
  the audit record; do not rerun a seed to repair season status.
- Actual wins change the grade for Boston, Detroit, the Angels, and San Diego versus the
  stored Pythagorean estimates. Other large projection errors do not necessarily cross a line.
- The previous card label used `gamesPlayed < 162`, independent of the scoring source.
  It could call an estimate final after 162 games, or actual results estimated after 161.
  The card now receives the server's `isFinal` decision instead.

MLB scheduled the finale for September 27:
[MLB schedule announcement](https://www.mlb.com/amp/press-release/press-release-mlb-announces-2026-regular-season-schedule.html).
NYY and BAL legitimately finished with 161 games after the cancellation:
[MLB cancellation notice](https://www.mlb.com/news/orioles-yankees-september-27-game-canceled-due-to-weather).

## Immediate closeout procedure

On September 29, the owner reported updating the 2026 season status to `completed`.
The original inspection and export above predate that manual update.

1. Preserve the read-only export and verify final standings, complete picks, and the
   configured betting lines. The export in `exports/2026-fiso-boyz` records these inputs.
2. The minimal live scoring change is one season record:
   `_id = d0cb2ec3-d425-4504-bc27-eea3f675bb5c`, sport `MLB`, season `2026`,
   `status: upcoming → completed`. This switches every 2026 MLB group to actual wins,
   not just one group. Only one 2026 group existed at inspection time. Keep the old
   status and update timestamp for rollback; use a conditional update against the old
   status and require exactly one matched record.
3. Deploy the card-label patch after normal project deployment checks. Verify the live
   latest leaderboard and member sheets against the export; specifically check Boston,
   Detroit, the Angels, San Diego, and NYY/BAL labels. The local checkout's scoring code
   supports the status switch; the deployed version has not been independently verified.
4. Confirm any postseason scoring/tiebreaker and use the recap to write the league email.

The investigation/export did **not** change production records, deploy, or send email.
Setting status completed finalizes over/under scoring; it does not invent results for the
upcoming postseason.

## Follow-up for reliable annual closeout

- Separate regular-season scoring completion from postseason completion. Store an explicit
  final standings snapshot/date once all games that count are resolved. Do not infer this
  from every team playing 162 games or merely the calendar crossing an expected date.
- Allow a final standings refresh after the season boundary: the current cron skips once
  `now > endDate`, which can miss the last night's results with a midnight cutoff.
- Correct season dates from the official schedule and add a deliberate lifecycle transition.
- Keep historical date views historical: currently a completed status selects actual wins
  even for a July snapshot, and a missing requested date can fall back to the latest snapshot.
   Those are existing behaviors, not addressed by the card-label patch.
- Run the documented sheet snapshot migration before future seasons and preserve final
  inputs for reproducibility. Do not silently substitute zero for missing standings/lines.
- The app currently displays sequential leaderboard positions for ties. The export shares
  ranks and leaves tiebreakers unapplied.

## Reusable read-only export

```bash
node --env-file=.env.local scripts/export-league.mjs LEAGUE_UUID exports/league-recap
```

This uses the native MongoDB client without model initialization/index writes. It reads
only the chosen league's members/picks plus its season's teams, lines, and latest standings.
Names are included; account emails, Kinde IDs, and invite codes are omitted.

Outputs: `source.json` (audit inputs), `results.json` (actual-win calculations), and
`season-recap.md` (standings, all picks, estimate differences, postseason selections).
Generated files are ignored by git. The export deliberately uses actual wins regardless
of season status: during a live season these are **current actuals**, not certified finals.

Recreate a report without database access:

```bash
node scripts/export-league.mjs --source exports/league-recap/source.json exports/recreated
```

The exporter refuses missing/duplicate picks, missing lines/standings, inconsistent records,
and mixed standings dates. It applies saved line snapshots ahead of legacy season lines,
preserves pushes, and grades solely against actual wins.
