# Architectural decisions

## ADR-001: MLB-first, modest sport discrimination

Status: accepted.

MLB is the only committed product. The existing `Sport` discriminator remains useful in seasons,
teams, groups, and lines, but league rules stay explicit. No generic sports provider or universal
game model is introduced. This keeps the current system legible while avoiding identifiers or
schemas that make another sport impossible.

## ADR-002: Digital-sign routes are compatibility adapters

Status: accepted.

The two physical signs cannot be atomically deployed with the web application. Their routes,
headers, statuses, payload shapes, ordering, defaults, empty messages, and current cache behavior
are frozen by route-level characterization tests and `SIGN_API_CONTRACT.md`. Cleaner normalized
services sit behind the adapters.

## ADR-003: Deadlines and lines are sheet snapshots

Status: accepted.

Mutable group deadlines and season line reference data cannot define historical picks safely.
Every new sheet stores `lockAt`, `lineSnapshotAt`, and a line on each eligible team pick. Legacy
data uses an idempotent backfill. The database mutation itself filters on `lockAt > serverNow`,
closing the read-then-write deadline race.

## ADR-004: Partial pick entry, strict runtime eligibility

Status: accepted.

Users may save incomplete preseason work, so the server permits unselected teams and fewer than
five postseason choices. It rejects unknown teams, invalid directions, duplicates, wrong-league
choices, excessive selections, and inconsistent champion/winner choices. Completion remains a UX
signal rather than an unsafe client-only constraint.

## ADR-005: Actual wins are final; normalized projection is live

Status: accepted.

During a season, Pythagorean wins (then pace projection) powers the social tracking view. Completed
seasons and dates after configured season end use actual wins. Both leaderboard and individual
results share this rule and compare against the snapshotted line.

## ADR-006: Validate and normalize MLB data at one boundary

Status: accepted.

The MLB HTTP client uses timeouts, bounded retry for transient failures, response-shape checks, and
explicit transformations. Persisted games and standings use internal IDs and source timestamps.
The full-season schedule uses one upstream request and bulk persistence instead of per-team
duplicate fetching.

## ADR-007: Conservative PWA caching

Status: accepted.

Installability does not justify caching authoritative state. The service worker caches immutable
assets and public offline UI. It never caches APIs, mutations, authentication, sign/admin responses,
or authenticated HTML. This provides a reliable launch/degraded state without leaking private data
or presenting stale deadlines as truth.

## ADR-008: Explicit PWA update consent

Status: accepted.

A waiting worker prompts the user. While pick state is dirty, the update action is disabled and
explains why. Applying an update sends `SKIP_WAITING`; `controllerchange` reloads once. Cache names
are versioned and old application caches are deleted during activation.

## ADR-009: Keep a deployable monolith

Status: accepted.

Current scale does not justify queues, Redis, microservices, or distributed locks. Vercel cron,
MongoDB bulk upserts, domain modules, and structured logs are sufficient. External durable job
orchestration becomes appropriate only if missed imports, rate limits, or execution duration show
that the present model is inadequate.
