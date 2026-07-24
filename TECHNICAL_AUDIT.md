# Technical audit

## Executive summary

The application began as a useful, current Next.js/Mongoose foundation with a coherent MLB feature
set and a healthy unit-test baseline. It was not ready for long-term ownership: the README still
described a starter, digital-sign contracts were undocumented, group owners did not receive a pick
sheet, lock enforcement had a read/write race, runtime payloads could convert arbitrary values into
under picks, other participants’ picks were callable before lock, sign detail had an object-level
authorization gap, historical scoring depended on mutable lines, MLB refreshes duplicated upstream
requests, and the manifest had no service worker.

The modernization establishes server-authoritative, atomic pick writes; historical sheet snapshots;
resource-level authorization; validated sign administration; a bounded MLB normalization boundary;
bulk ingestion; sign contract protection; structured operational events; security headers; and an
intentional installable PWA architecture. MLB remains explicit. No speculative multi-sport or
provider framework was added.

## Current-state architecture

The system is a Vercel-hosted Next.js 16 monolith using React 19 server/client components, Kinde,
MongoDB Atlas through Mongoose, server actions for browser mutations, route handlers for Kinde,
cron, health, and signs, and Vitest. MLB schedules and standings are normalized into `Game` and
`TeamStanding`. Vercel cron refreshes data. Two signs poll API-key-protected compatibility routes.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for current flows.

## Major strengths

- Current framework, language, styling, database, and test tooling.
- Existing service/action separation and typed internal models.
- Unique constraints for major natural keys.
- Daily historical standings snapshots.
- Bulk game persistence and a lightweight live-game path.
- Existing responsive component library and recognizable toast visual identity.
- A passing 188-test baseline before changes.

## Findings

Severity reflects product/data impact, not implementation effort.

### Critical

| Problem and evidence                                                                                                            | Risk                                                      | Recommendation / disposition                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Pick save checked `Group.lockDate` and later updated `Sheet` in separate operations (`app/(logged-in)/league/[id]/actions.ts`). | A request crossing the deadline could write after lock.   | **Fixed.** `Sheet.lockAt` is snapshotted and the owner/deadline are predicates in one atomic update.                                 |
| Runtime `teamPicks` was trusted; any non-empty value other than `"over"` became Under.                                          | Tampered requests silently changed game data.             | **Fixed.** `server/picks/pick-rules.ts` validates directions, eligible teams, leagues, duplicates, counts, and champion consistency. |
| Another member’s sheet/results/leaderboard could be called before lock although the UI hid controls.                            | Prediction disclosure undermined the game.                | **Fixed.** Server actions now enforce deadline visibility.                                                                           |
| Sign detail loaded any sign by ID for any authenticated user.                                                                   | Object-level authorization failure exposed configuration. | **Fixed.** Management reads use a membership-scoped query; external hardware routes retain API-key behavior.                         |

### High

| Problem and evidence                                                                                | Risk                                                                                     | Recommendation / disposition                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Team lines were read from mutable `TeamLine` records and save rewrote picks without the old `line`. | Historical picks and scores could change retroactively.                                  | **Fixed.** New sheets snapshot lines; scoring prefers snapshots; repeatable legacy migration added.                                                                                                                                       |
| Group creation trusted a browser-supplied deadline and did not create the owner sheet.              | Users could bypass season rules; core pick flow could be empty.                          | **Fixed.** The server loads the configured season deadline and creates the owner sheet, rolling back a newly created group on failure.                                                                                                    |
| Sign configuration updates had no runtime checks and Mongoose update validators were not enabled.   | Invalid brightness, schedules, arrays, or unknown sections could reach production signs. | **Fixed.** Strict partial-config validation added before owner-authorized writes.                                                                                                                                                         |
| Full schedule sync fetched each team and received every game twice.                                 | Unnecessary latency, rate-limit exposure, and partial imports.                           | **Fixed.** One season request plus normalized bulk persistence.                                                                                                                                                                           |
| No service worker or controlled offline/update behavior existed.                                    | Manifest-only PWA was not a PWA; stale clients and false offline confidence.             | **Fixed and browser-validated.** Chromium reports no manifest/installability errors, takes service-worker control, and serves the offline shell during an actual server outage. Physical iOS/Android verification remains a release gate. |
| Group join membership and sheet creation are not a MongoDB transaction.                             | A DB failure can temporarily leave membership without a sheet.                           | **Mitigated.** Join is idempotent and repairs an existing member’s sheet on retry. A transaction remains recommended if failures appear.                                                                                                  |

### Medium

| Problem and evidence                                                                     | Risk                                                                        | Recommendation / disposition                                                                                                  |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Sign routes had no characterization tests or contract document.                          | Refactors could brick two physical signs.                                   | **Fixed.** Twelve route contract tests plus slide-order tests and `SIGN_API_CONTRACT.md`.                                     |
| MLB fetches had no timeout/retry and cast JSON directly to interfaces.                   | Hung functions and changed upstream schemas caused opaque partial failures. | **Fixed.** Timeout, bounded transient retry, structural checks, explicit normalization, and provenance.                       |
| Standings import wrote one team at a time.                                               | Extra Atlas round trips and inconsistent partial duration.                  | **Fixed.** Existing-key lookup and unordered bulk upsert.                                                                     |
| Webhook verification omitted issuer/algorithm constraints; bearer auth omitted audience. | Broader token acceptance than intended.                                     | **Fixed/conditional.** Webhooks require RS256 issuer; bearer audience is enforced when `KINDE_AUDIENCE` is set.               |
| Global wildcard API CORS and arbitrary remote Next image hosts.                          | Unnecessary cross-origin exposure and image-proxy fetch surface.            | **Fixed.** Existing CORS behavior is scoped to sign routes; unused remote image wildcard removed.                             |
| Errors/logs were mostly ad hoc console strings; no health endpoint.                      | Production failures were hard to query consistently.                        | **Partially fixed.** Structured sign events and non-cached liveness added. Persistent metrics/alerts remain operational work. |
| Scoring always used projection, including completed seasons.                             | “Final” results could disagree with actual record.                          | **Fixed.** Shared scoring selects actual wins after completion/end and projections while live.                                |
| Kinde-populated group member objects included private user fields in page data.          | Avoidable email/identity-provider identifier disclosure to group members.   | **Fixed.** Member objects are sanitized before presentation.                                                                  |

### Low

| Problem and evidence                                                          | Risk                                                    | Recommendation / disposition                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Package name and README still described a generic starter.                    | Poor onboarding and unsafe operations.                  | **Fixed.** Product-specific setup, migration, PWA, deployment, and troubleshooting docs added.               |
| Coarse-pointer controls and pick-save hierarchy were inconsistent.            | Mobile errors and unclear save state.                   | **Fixed.** 44px targets, persistent completion, dirty state, exact deadline, and server-confirmed messaging. |
| `MONGO_URI` connection rejection stayed cached and pool limits were comments. | A transient selection failure could poison the process. | **Fixed.** Bounded pool/selection timeout and rejected-promise reset.                                        |

## Security findings

The server is authoritative for season selection, deadline, eligible teams, values, visibility, and
scoring. Critical IDOR and pre-lock disclosure paths were removed. Sign secrets use timing-safe
comparison. Cron remains separately authenticated. Kinde webhook payload size, signature
algorithm, issuer, and minimum shape are checked. Security headers deny framing/sniffing and narrow
browser features. A restrictive application CSP limits script, style, image, connection, worker,
form, frame, and object sources.

Remaining: no distributed rate limiter exists; sign credentials are shared rather than per-device;
there is no administrative override feature or audit log to review; production secret rotation and
session policy were not observable from the repository.

## Data-integrity findings

Snapshots and unique indexes now preserve historical pick meaning. The migration refuses incomplete
records. Import provenance is stored. Group joins are repairable. The largest remaining integrity
risk is operational: the migration has not been run against production here, backups were not
verified, and group/sheet creation is compensating rather than transactional.

No destructive migration was performed.

## API findings

Browser mutations remain typed server actions. Runtime validators now cover high-risk pick and sign
inputs, date parameters, sport/season selection, and names. External sign APIs remain isolated and
frozen. Cron and health routes have explicit purposes. There is no general public API requiring
pagination/versioning today.

## MLB integration findings

External responses terminate at `server/mlb-api`. The client adds an 8-second timeout, three
attempts for transient responses, JSON checks, and normalized internal models. Season schedule and
standings use bulk operations. Games model MLB status, postponed reasons, doubleheaders, game
number, rescheduling dates, postseason types, venue, probable pitchers, and linescore.

Remaining edge cases require fixture tests from real upstream payloads: suspended-resumption
identity, unusual `ifNecessary` postseason entries, delayed probable pitchers, and franchise
branding changes. Raw payload retention was not added because current debugging value did not
justify storage volume.

## Performance findings

Full schedule ingestion dropped from approximately 30 upstream calls to one. Standings writes
dropped from approximately 30 update round trips to a lookup plus one bulk write. Existing query
indexes and page-level parallel fetches are retained. Sign slides are still generated on request;
with two signs this is acceptable, but precomputed payloads become worthwhile if polling or slide
complexity grows.

No distributed cache was introduced.

## PWA findings

The former manifest had basic icons and standalone display but no start scope, maskable assets,
service worker, offline page, cache policy, or update UX. The new implementation adds those
elements and protects authoritative state by exclusion. Automated source/asset checks pass.

The production build was exercised in headless desktop and 390px Chromium. DevTools protocol
reported no manifest or installability errors; the worker controlled the root scope; cache
versioning and cleanup were present; there was no horizontal mobile overflow; and a stopped-server
test returned the complete offline screen without chunk errors. Physical iOS/iPadOS and Android
installation, standalone chrome, safe areas, and production-origin performance remain release
validation.

## UI/UX and accessibility findings

The application already had a warm, restrained identity and a useful searchable/team-filtered pick
list. Improvements clarify deadline time, progress across all prediction categories, dirty/saved
state, offline failures, installed updates, mobile navigation, touch targets, safe areas, focus,
and reduced motion. Public-page contrast failures found by axe were corrected. The main product
areas remain separate: Groups, Games, team detail, and Signs.

The public production page passes automated WCAG A/AA/2.1 AA axe rules with zero violations at the
tested desktop viewport. Authenticated data-backed pages still require automated and manual
keyboard/screen-reader review with production-like data.

## Testing findings

The baseline was 188 passing tests; the final suite has 231 passing tests across 24 files. New
coverage targets sign HTTP contracts, sign config,
timing-safe secrets, pick runtime rules, final/live scoring, MLB client validation, slide ordering,
health, and PWA assets/cache boundaries. Existing action tests were updated to assert the new
server-owned season and atomic write flow.

There is no database-container integration suite or committed authenticated Playwright suite.
Mocked service tests cannot prove MongoDB UUID casting, migration behavior on production-shaped
data, Kinde login, or physical sign rendering. A one-off production-browser audit covered the
public page, manifest, worker control, stopped-server fallback, mobile overflow, security headers,
console errors, and axe.

## Observability and operations findings

Sign requests/failures emit JSON events without auth material. Cron results are visible in function
logs, and `/api/health` provides liveness. Import models retain source timestamps.

Remaining operational work: durable job-run records, error reporting, latency metrics, alert rules,
database readiness, backup/restore drills, and a documented on-call owner. These require production
accounts and policy, not only repository changes.

## Dependency findings

The primary stack is current as audited locally: Next 16.2.11, React 19, Mongoose 9, TypeScript 5.9,
Tailwind 4, ESLint 9, and Vitest 4. Kinde was upgraded to 2.13.0 and PostCSS to 8.5.22. These
targeted updates removed a critical transitive JWT-library advisory and high-severity Next/build
chain advisories. `pnpm audit --prod` reports zero known vulnerabilities. No PWA dependency was
added, and arbitrary remote image support was removed.

## Recommended architecture

Continue the documented domain-oriented monolith. Keep MLB explicit, preserve sheet snapshots,
route all upstream data through normalization, treat sign routes as adapters, and add enrichment
modules keyed by internal identifiers. Introduce a durable job runner, distributed cache, or
microservice only in response to measured failure/duration/scale.

## Prioritized remediation plan

1. Release gate: backup production, run and validate sheet snapshot migration.
2. Release gate: run physical Android, iOS/iPadOS, authenticated accessibility, and sign hardware
   checks against the production origin.
3. Add database-backed integration tests for atomic deadline writes and migration fixtures.
4. Add durable import-run records, error reporting, and alerts.
5. Add administrative override only with immutable actor/reason/before/after audit events.
6. Add a per-device sign credential/version migration in the separate sign project.

## Work completed

- Frozen sign contracts and compatibility tests.
- Server-owned group deadlines and owner sheet creation.
- Atomic pick lock enforcement and strict runtime eligibility.
- Line/deadline snapshots and repeatable migration.
- Pre-lock disclosure and sign IDOR fixes.
- Sanitized member presentation.
- Correct final/live scoring selection.
- Sign configuration validation and security hardening.
- MLB timeout/retry/validation, one-request schedule sync, bulk standings, and provenance.
- CSP and security headers, scoped CORS, bounded Mongo connection, and health endpoint.
- Installable PWA assets, manifest, service worker, offline page, safe update flow, and cache reset.
- Probe-based connection status that recovers from unreliable browser online/offline events.
- Pick-entry mobile/accessibility/save-state improvements.
- Product, architecture, PWA, contract, decision, migration, and deployment documentation.

## Remaining risks

No unresolved repository-confirmed Critical issue remains. High release risks are the unexecuted
production migration and unverified physical device/sign behavior. Other risks are lack of database
integration tests, non-transactional group/sheet creation, absent persistent import metrics/alerts,
no production backup evidence, shared sign credential, no distributed rate limiting, and untested
production Kinde configuration.

## Future opportunities

- Weather: normalize forecast/observation snapshots by venue and game time with explicit freshness.
- Lineups: store projected/confirmed state and provider timestamp; do not overwrite confirmed data
  with later projections.
- Trends: derive reproducible features from stored games/standings and version formulas.
- Odds/projections: separate market observations from internal models, snapshot movement, and show
  provenance.
- Additional sports: add explicit sport-specific ingestion and prediction rules behind existing
  season/group identity.
- Push: consider opt-in deadline and final-result notifications only after a permission/value
  design.
- Background sync: suitable for non-authoritative read refreshes, not deadline pick writes.
- Signs: move to per-device credentials, prebuilt payloads, telemetry, staged payload versions, and
  independent client contract tests.
