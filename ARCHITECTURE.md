# Architecture

## System shape

Spreads on Toast is a Next.js monolith deployed to Vercel. That is an intentional fit for the
current traffic and team size: domain boundaries are explicit in code, but deployment remains
operationally simple.

```text
Browser / installed PWA
  -> App Router pages and authenticated server actions
     -> domain actions
        -> Mongoose services -> MongoDB Atlas

Vercel Cron
  -> authenticated cron routes
     -> MLB client -> validation/normalization -> bulk persistence

Physical signs
  -> frozen /api/external/sign/* compatibility routes
     -> sign config + normalized standings/games -> slide adapter
```

## Components and boundaries

- `app/`: routes, layouts, page orchestration, thin authenticated server actions, and HTTP adapters.
- `components/`: client and server presentation organized by product area.
- `server/groups` and `server/sheets`: participant groups, membership, sheet ownership, and
  persistence.
- `server/picks`: runtime eligibility validation, deadline-independent domain rules, and scoring
  source selection.
- `server/seasons`: configured MLB seasons and preseason team lines.
- `server/mlb-api`: the only upstream MLB HTTP client and external response normalization boundary.
- `server/schedule` and `server/standings`: imported MLB persistence and query services.
- `server/signs` and `server/slides`: managed sign configuration, sign membership, and presentation
  adapters.
- `server/http`: HTTP authentication and response helpers.
- `server/observability`: structured operational logging.
- `models/` and `types/`: Mongoose persistence schemas and shared domain contracts.

The application retains the existing `Sport` discriminator, but only MLB behavior is implemented.
There is no generic provider framework. A future sport can add an explicit implementation behind
the same modest season/group concepts.

## Authentication and authorization

Kinde supplies cookie sessions for browsers. `getAuthUser()` also accepts verified bearer tokens,
checking issuer and the optional configured audience. Authenticated server actions are wrapped by
`withAuth`.

Authorization is resource-scoped:

- group reads require membership;
- group metadata changes require owner or admin role;
- another participant’s sheet, results, and the leaderboard are unavailable before the deadline;
- sign management reads require sign membership;
- sign configuration writes require ownership;
- cron and sign HTTP APIs use separate secrets.

Kinde webhooks verify an RS256 signature and issuer before updating users.

## Persistence model

- `Season`: sport/year, official start/end, default immutable pick deadline, and lifecycle status.
- `Team`: stable internal UUID plus MLB external ID and league/division identity.
- `TeamLine`: configured preseason line for a team/sport/season.
- `Group`: private competition, members, roles, invite code, and its deadline.
- `Sheet`: unique per group/user. Holds eligible team picks, line snapshots, lock snapshot, saved
  timestamp, postseason selections, and World Series selections.
- `TeamStanding`: daily normalized/provenance-stamped record snapshot.
- `Game`: normalized/provenance-stamped MLB scheduled game and live linescore.
- `Sign`: owners/members and display, schedule, and content configuration.

Unique indexes protect season identity, line identity, one sheet per group/user, MLB game identity,
and one standing per team/date/season. Query-specific indexes cover deadlines, memberships, game
dates, teams, and standings dates.

## Pick creation and locking flow

1. The server validates the requested MLB season.
2. The group receives the season’s configured deadline; the browser cannot choose it.
3. Owner and joining-member sheets copy every eligible team and current line.
4. `Sheet.lockAt` and `teamPicks[].line` become historical snapshots.
5. Every save is runtime-validated against the server-owned sheet.
6. The database update filters by sheet owner and `lockAt > serverNow` in the same atomic operation.
7. A deadline race therefore returns a locked result instead of writing after the deadline.
8. The browser shows success only after the updated sheet is returned.

Legacy sheets are upgraded by `scripts/backfill-sheet-snapshots.ts`. The online write path can also
repair a missing snapshot before performing the atomic deadline-filtered write.

There is no silent offline mutation queue.

## Scoring flow

Standings are queried for the requested date. Live-season displays use normalized Pythagorean wins
with projected wins as fallback. Completed seasons, or dates after the configured season end, use
actual wins. Every comparison uses the sheet’s snapshotted line, falling back to `TeamLine` only for
unmigrated legacy data.

The same scoring helpers serve individual results and group leaderboards.

## MLB ingestion flow

```text
Vercel schedule
  -> cron bearer verification
  -> bounded MLB fetch with timeout/retry
  -> structural response validation
  -> explicit MLB-to-domain transformation
  -> internal team UUID resolution
  -> unordered bulk upsert
  -> source + sourceFetchedAt provenance
  -> structured error/result logs
```

The season schedule refresh uses one upstream request. Team-specific retrieval remains a targeted
repair path. Live sync fetches a single day only when stored games indicate work is needed.
Postponed, suspended, doubleheader, rescheduled, postseason, probable-pitcher, and status fields are
stored from normalized MLB values rather than exposed as raw API objects.

Future weather, lineup, odds, or trend integrations should produce a small normalized module keyed
by internal game/team IDs. They should not add provider payloads directly to page props or the
`Game` model without a product need.

## Sign compatibility layer

`app/api/external/sign/config` and `slides` are stable external adapters. They authenticate, load the
stored sign, invoke internal normalized logic, and return the frozen sign representation. Internal
APIs may evolve without changing these adapters. See [SIGN_API_CONTRACT.md](./SIGN_API_CONTRACT.md).

## PWA architecture

The root layout registers a production-only service worker on secure contexts. The worker caches
versioned static assets and the public offline shell. Auth APIs, server actions, sign/admin data,
authenticated navigation responses, and all mutations are never cached. A waiting worker prompts
for an update; unsaved pick state disables reload. See [PWA.md](./PWA.md).

## Background jobs and deployment

`vercel.json` defines standings, schedule, and live-game cron schedules. All jobs are idempotent
upserts and require `CRON_SECRET`. The application runs as Vercel functions with a cached,
bounded MongoDB pool.

Deployment order for the snapshot schema is expand/migrate/verify: deploy code that reads legacy
and new fields, back up and run the idempotent migration, verify, then rely on snapshots. No
destructive migration is included.

## Extension points

- Daily intelligence: a game enrichment service keyed by `mlbGameId`, with independent freshness
  and provenance per weather/lineup/odds/trend source.
- Additional prediction categories: add validated category data and scoring beside `server/picks`,
  without turning `TeamPick` into an untyped property bag.
- Additional sports: implement sport-specific teams, ingestion, pick validation, and scoring while
  reusing authentication, groups, sheets, and PWA delivery only where semantics genuinely match.
