# Spreads on Toast — Principal Engineer Technical Audit, Modernization, and PWA Build

You are acting as a principal software engineer, application architect, security reviewer, product-minded technical lead, and senior product designer.

Perform a comprehensive technical audit and modernization of **Spreads on Toast**.

This is not intended to be a superficial linting pass or a collection of minor cleanup suggestions. Review the application as though you are taking technical ownership of it and preparing it for several more years of reliable development.

You may make substantial changes to the architecture, APIs, data model, application structure, user interface, and frontend delivery model when those changes materially improve the product.

The completed application must be a polished, installable **Progressive Web App (PWA)**.

---

## Product Context

Spreads on Toast supports a year-long sports prediction game.

The primary game currently focuses on Major League Baseball.

Participants:

- Pick the over or under on the Las Vegas season win total line for every MLB team.
- Lock their picks before the season begins.
- Track actual team performance throughout the season.
- See standings and final results at the end of the season.
- Make additional preseason predictions, including postseason teams and other season outcomes.

The application also:

- Retrieves MLB schedules, scores, standings, matchups, and related data from MLB data sources.
- Displays daily game information.
- Provides APIs used by digital signs.
- Currently powers two physical digital signs in production.
- Contains early architectural work intended to support additional sports.

The MLB experience is the primary product and should remain the focus.

The application may eventually support:

- NBA
- NFL
- NHL
- Soccer
- Other leagues or sports

There is no current commitment to building those experiences. Do not over-engineer a generic sports platform, but avoid architectural decisions that unnecessarily make future multi-sport support impossible.

---

## Current Product Maturity

The existing application contains useful foundational work, but it should not be treated as a complete or final implementation.

Planned future functionality may include:

- More comprehensive daily game data
- Internally calculated odds or projections
- Weather
- Confirmed and projected lineups
- Starting pitchers
- Team and player trends
- Historical matchup data
- Betting-market movement
- More detailed game previews
- Additional predictive analytics

Do not implement all of these speculative features unless they are already naturally within the scope of a necessary refactor.

However, the architecture should leave clear extension points for these capabilities.

---

## Primary Objectives

Review and improve the application across the following areas:

1. Architecture
2. API design
3. Security
4. Data integrity
5. Performance and efficiency
6. Maintainability
7. DRYness and consistency
8. Testing
9. Observability
10. Deployment safety
11. UI and UX
12. Accessibility
13. Mobile usability
14. Progressive Web App capabilities
15. MLB data ingestion and normalization
16. Digital-sign API reliability
17. Future extensibility

The result should be a materially better application, not merely a written audit.

---

## Authority to Change the Application

You have broad authority to:

- Redesign the UI and UX.
- Reorganize the repository.
- Refactor or replace application architecture.
- Change internal APIs.
- Change public browser-facing APIs used only by this application.
- Change database schemas when justified.
- Add migrations.
- Rename confusing concepts.
- Remove obsolete code.
- Consolidate duplicate code.
- Replace outdated libraries.
- Improve authentication and authorization.
- Rewrite inefficient or unsafe implementations.
- Introduce clearer service boundaries.
- Improve error handling and validation.
- Add or revise tests.
- Improve developer documentation.
- Change frontend state-management or data-fetching patterns.
- Change the MLB data integration.
- Introduce caching or background jobs where appropriate.
- Build or replace the existing frontend delivery model to create a high-quality PWA.

Do not preserve poor architecture merely because it already exists.

Maintain existing product data whenever reasonably possible. If a destructive migration is truly necessary, document the reason and provide a safe migration plan.

---

## Critical Compatibility Constraint: Digital-Sign APIs

The application currently provides APIs consumed by two physical digital signs in production.

These integrations must continue to work after this effort.

The existing sign-facing endpoints must preserve their externally observable contract, including where applicable:

- URL and route
- HTTP method
- Authentication behavior
- Status codes
- Response body shape
- Field names
- Field types
- Nullability
- Date and time formats
- Ordering
- Default values
- Error responses
- Caching behavior when relied upon
- Any other behavior required by the existing sign clients

Do not assume the digital-sign clients can be deployed at the same time as this application.

Before changing sign-related code:

1. Identify every endpoint used by the sign hardware.
2. Document its current contract.
3. Add characterization or contract tests around the existing behavior.
4. Preserve that behavior during the refactor.
5. Clearly isolate sign-facing compatibility code from improved internal domain logic.

It is acceptable to build cleaner internal APIs and place a compatibility adapter in front of them.

Do not silently change the sign API because the current implementation appears inconsistent or inelegant.

After this application work is complete, the sign project will be reviewed separately.

---

# Phase 1: Repository and System Discovery

Before making large changes, inspect the full repository.

Identify:

- Application framework and runtime
- Frontend architecture
- Backend architecture
- Database and persistence model
- Authentication and authorization
- User and game-management flows
- MLB data integrations
- Background tasks and scheduled jobs
- Caching
- Hosting and infrastructure
- Environment configuration
- Sign-facing endpoints
- Public and private APIs
- Build and deployment process
- Testing strategy
- Logging and monitoring
- Third-party dependencies
- Existing PWA code, manifests, service workers, or install behavior
- Areas of abandoned or incomplete multi-sport work
- Dead code
- Duplicated domain logic
- Tight coupling
- Security-sensitive code paths

Read existing documentation, environment examples, migrations, infrastructure configuration, and tests before deciding that functionality is unused.

Trace the major workflows end to end rather than reviewing files in isolation.

---

# Phase 2: Technical Audit

Evaluate the system as a principal engineer.

## Architecture

Review:

- Separation of concerns
- Domain boundaries
- Coupling between UI, API, database, and external MLB data
- Organization of business logic
- Server and client responsibilities
- Repository structure
- Dependency direction
- Reusability without premature abstraction
- Whether incomplete multi-sport abstractions are helping or harming the MLB product
- Whether league-specific logic is explicit and understandable
- Ease of adding future game types or prediction categories
- Ease of adding future daily-game intelligence

Prefer simple, explicit architecture over speculative frameworks.

A reasonable design may use a strong MLB implementation behind modest league or sport interfaces, rather than forcing every concept into a generic sports abstraction.

## API Design

Audit all APIs for:

- Consistency
- Resource naming
- HTTP semantics
- Validation
- Authentication
- Authorization
- Error structures
- Pagination
- Filtering
- Sorting
- Idempotency
- Rate limiting
- Versioning
- Caching
- Data leakage
- Over-fetching
- Under-fetching
- N+1 behavior
- Duplicate business logic
- Internal versus external contracts
- Date and time handling
- Stable identifiers
- Backward compatibility

Classify APIs as:

- Internal server APIs
- Application frontend APIs
- Administrative APIs
- Public APIs
- Webhook or integration endpoints
- Digital-sign compatibility APIs

The digital-sign APIs should be treated as stable external contracts.

Other APIs may be redesigned when doing so improves the system.

## Security

Perform a serious security review.

Inspect for:

- Broken authentication
- Broken authorization
- Missing object-level authorization
- Administrative route exposure
- Insecure direct object references
- Injection vulnerabilities
- Cross-site scripting
- Cross-site request forgery
- Server-side request forgery
- Unsafe redirects
- Weak session handling
- Secret leakage
- Sensitive values sent to the browser
- Unsafe logging
- Unvalidated request bodies
- Unvalidated query parameters
- Insecure file or URL handling
- Missing rate limiting
- Abuse-prone public endpoints
- Dependency vulnerabilities
- Overly permissive CORS
- Security-header gaps
- Production debug behavior
- Environment-variable misuse
- Unprotected scheduled-task endpoints
- Trusting client-calculated results
- Race conditions around pick locking
- Ability to modify picks after deadlines
- Privilege escalation
- Exposure of private player information

Pay particular attention to the integrity of locked picks.

The server must be authoritative for:

- Lock deadlines
- Pick eligibility
- Submitted selections
- Post-lock modification rules
- Administrative overrides
- Scoring
- Final results

Do not rely on hidden UI controls or client clocks for enforcement.

## Data Model and Integrity

Review the representation of:

- Seasons
- Leagues
- Sports
- Teams
- Participants
- Games or contests
- Pick categories
- Team win-total lines
- Over/under selections
- Postseason selections
- Pick deadlines
- Locked picks
- Results
- Scoring
- MLB games
- MLB standings
- External identifiers
- Imported data
- Sign display data

Identify:

- Weak or missing constraints
- Duplicate records
- Ambiguous ownership
- Denormalization without purpose
- Incorrect normalization
- Fragile string matching
- Missing indexes
- Inconsistent identifiers
- Time-zone problems
- Missing auditability
- Race conditions
- Unsafe cascading deletes
- Lack of source timestamps
- Lack of import provenance
- Lack of historical snapshots

Season-long predictions must remain historically reproducible.

Do not allow current MLB data or changed preseason lines to retroactively alter the meaning of a locked historical pick.

Consider whether important source values should be snapshotted at lock time.

## MLB Data Integration

Review how MLB data is acquired, transformed, stored, cached, and served.

Inspect:

- Source endpoints
- Retry behavior
- Timeouts
- Rate limits
- Error handling
- Data freshness
- Scheduled refreshes
- Duplicate imports
- Partial failures
- Changed external schemas
- External identifiers
- Time zones
- Postponed games
- Suspended games
- Doubleheaders
- Rescheduled games
- Completed games
- Spring training
- All-Star events
- Postseason games
- Standings calculations
- Team name and abbreviation changes
- Starting pitcher availability
- Missing or delayed information

External MLB responses should not leak unchecked throughout the application.

Prefer a clear boundary that:

1. Fetches external data.
2. Validates it.
3. Normalizes it into internal domain types.
4. Stores or caches it appropriately.
5. Exposes stable application-facing models.

Preserve raw source data only where it provides debugging, audit, or reprocessing value.

Clearly separate:

- External-source data
- Normalized internal data
- User-generated predictions
- Derived statistics
- Display-specific projections

Design extension points for future weather, lineup, odds, and trends providers without building an unnecessary provider framework.

## Performance and Efficiency

Look for:

- Excessive database calls
- N+1 queries
- Repeated MLB API calls
- Duplicate transformations
- Unbounded result sets
- Wasteful server rendering
- Excessive client JavaScript
- Large payloads
- Poor caching
- Incorrect cache invalidation
- Blocking external requests
- Recalculation of stable season data
- Expensive work performed on every sign request
- Inefficient cron jobs
- Missing indexes
- Slow leaderboard calculations
- Repeated scoring calculations
- Poor image or asset delivery

Optimize based on likely usage and operational simplicity.

Do not introduce distributed infrastructure unless the application genuinely needs it.

## DRYness and Code Quality

Identify:

- Duplicated domain rules
- Duplicated API validation
- Duplicated formatting
- Duplicated MLB transformations
- Duplicated scoring logic
- Duplicated date logic
- Inconsistent naming
- Giant modules
- Utility dumping grounds
- Hidden side effects
- Boolean-parameter APIs
- Weak type safety
- Excessive `any` usage
- Dead abstractions
- Premature abstractions
- Repeated UI patterns
- Inconsistent loading and error states
- Inconsistent response contracts

Consolidate genuine repetition, but do not create abstract frameworks merely to reduce a small number of explicit lines.

## Testing

Assess current coverage and add meaningful tests.

Prioritize:

- Pick submission
- Pick validation
- Pick locking
- Lock deadlines
- Authorization
- Administrative overrides
- Scoring
- Leaderboards
- Season rollover
- MLB data normalization
- Postponed and doubleheader handling
- Sign API contracts
- API validation
- Error handling
- Database migrations
- Critical UI flows
- PWA installation and update behavior
- Offline and degraded-network behavior

Use a balanced testing strategy:

- Unit tests for domain logic
- Integration tests for APIs and persistence
- Contract tests for sign endpoints
- A small number of end-to-end tests for critical user journeys
- Browser-based validation for PWA capabilities

Do not chase arbitrary line-coverage numbers.

## Observability and Operations

Review:

- Structured logging
- Error reporting
- Request correlation
- Background-job visibility
- MLB import failures
- Sign API failures
- Slow endpoints
- Deployment health
- Health checks
- Readiness checks
- Metrics
- Alerting opportunities
- Secret rotation
- Backups
- Restore procedures
- Migration safety

Failures in MLB imports or sign data generation should be diagnosable without recreating them locally.

Avoid logging sensitive data or full authentication material.

## Dependencies and Platform Currency

Review:

- Framework versions
- Runtime versions
- Database libraries
- Authentication libraries
- MLB client libraries
- Styling frameworks
- Build tools
- Testing libraries
- PWA and service-worker tooling
- Deprecated APIs
- Abandoned packages
- Known vulnerabilities
- Libraries used for trivial functionality
- Duplicate libraries serving the same purpose

Upgrade outdated dependencies when the upgrade is safe and valuable.

Do not perform broad version upgrades without updating affected code and tests.

---

# Phase 3: Product and UI/UX Review

The UI and UX may be completely redesigned.

The new experience should make the product understandable to someone who did not build it.

Prioritize the MLB use case.

Evaluate and improve:

- First-time user comprehension
- Season selection
- Participant identity
- Pick entry
- Pick completion status
- Lock deadlines
- Locked-state clarity
- Ability to review picks
- Prevention of accidental changes
- Team organization
- Over/under line presentation
- Postseason predictions
- Season standings
- Player standings
- Daily schedule and scores
- Matchup presentation
- Mobile usability
- Accessibility
- Loading states
- Empty states
- Error states
- Administrative workflows
- Historical seasons
- Navigation
- Visual hierarchy
- Responsive behavior
- Sign-preview or display-management workflows, if present
- Installed PWA experience

The application should clearly distinguish:

- Preseason prediction-game functionality
- Live season tracking
- Daily MLB information
- Administrative functionality

Do not overload one page with all product concepts.

## Pick Entry

The pick-entry experience is central.

It should clearly communicate:

- Team
- Vegas line
- Over selection
- Under selection
- Unselected state
- Completion progress
- Lock date and time
- Whether picks are editable
- Whether picks are saved
- Validation errors
- Additional prediction categories

Design for fast entry across all MLB teams without making mistakes easy.

Consider grouping, filtering, compact layouts, and clear persistent progress.

## Locked Picks

Once locked, the UI should make the state unmistakable.

Avoid controls that appear interactive when the server will reject them.

Show relevant metadata such as:

- Lock timestamp
- Season
- Participant
- Completion state
- Administrative override history, where appropriate

## Daily MLB Experience

The current daily-game functionality may be redesigned with future growth in mind.

Establish a clean hierarchy for:

- Date
- Game status
- Away and home teams
- Scores
- Start time
- Broadcast or venue information, if available
- Starting pitchers
- Records
- Series status
- Postponements
- Doubleheaders
- Additional future insights

Do not create empty placeholders for features that do not exist.

Create a layout that can naturally accommodate future modules such as weather, odds, lineups, and trends.

## Design Direction

Create a cohesive and distinctive visual system appropriate for a social sports game.

The design may reference sports, baseball, betting sheets, scoreboards, or toasted-breakfast personality, but it should not feel like a novelty app.

Prioritize:

- Legibility
- Dense but understandable sports data
- Strong hierarchy
- Mobile usability
- Consistency
- Accessible contrast
- Clear interactive states
- Restraint

Preserve the existing visual identity only when it remains useful.

---

# Phase 4: Progressive Web App Requirements

A production-quality PWA is a required deliverable, not an optional enhancement.

The PWA should feel intentional on iPhone, iPad, Android, and desktop rather than merely passing an automated installability check.

## Core PWA Requirements

Implement and validate:

- A valid web app manifest
- Appropriate application name and short name
- App icons in all required sizes
- Maskable icons where supported
- Theme color
- Background color
- Standalone display behavior
- Correct start URL and scope
- HTTPS-compatible service-worker registration
- Reliable production service-worker behavior
- An intentional offline or degraded-network experience
- Installability on supported browsers
- Safe application updates
- Cache invalidation
- Responsive layouts
- Mobile safe-area handling
- Touch-friendly controls
- Appropriate viewport configuration
- iOS home-screen metadata where still useful
- Desktop installation support where available

Do not ship placeholder icons or framework-default PWA branding.

Create a cohesive icon and splash-screen treatment consistent with the redesigned product.

## Offline and Degraded-Network Behavior

Do not pretend the entire product can function offline if it depends on live MLB data and server-authoritative picks.

Define intentional behavior for:

- App shell
- Previously loaded daily schedules and scores
- Previously loaded standings
- Previously loaded locked picks
- Pick-entry screens
- Authentication state
- Administrative screens
- Failed mutations
- Reconnection

The application must not imply that a pick was saved or locked when the server did not confirm it.

Do not queue deadline-sensitive pick submissions silently unless that behavior is explicitly safe and clearly communicated.

Prefer:

- Read-only cached data where useful
- Clear stale-data timestamps
- Clear offline messaging
- Explicit retry behavior
- Server confirmation for all mutations
- Graceful empty states when no cache is available

## Service Worker and Caching Strategy

Choose caching strategies based on data behavior rather than applying one strategy globally.

Consider:

- Cache-first for immutable versioned assets
- Stale-while-revalidate for appropriate read-only content
- Network-first for frequently changing sports data
- Network-only or carefully controlled handling for authentication and mutations
- Explicit cache versioning
- Cleanup of obsolete caches
- Avoidance of caching sensitive responses
- Avoidance of caching administrative data in shared contexts
- Avoidance of serving stale pick-lock state as authoritative

Document the selected strategy and its tradeoffs.

## PWA Update Experience

Prevent users from remaining indefinitely on an obsolete frontend that no longer matches the backend.

Implement an update strategy that:

- Detects a waiting service worker
- Avoids destructive reloads during active pick entry
- Clearly prompts the user when an update is ready, where appropriate
- Applies updates safely
- Recovers from incompatible cached assets
- Provides a path to clear corrupted caches
- Does not create reload loops

## PWA Quality Validation

Validate the production build using appropriate browser tooling.

Include:

- Manifest validation
- Service-worker validation
- Installability validation
- Offline/degraded-network tests
- Mobile viewport tests
- iOS Safari review
- Android Chrome review
- Desktop Chromium review
- Accessibility review
- Performance review
- Lighthouse or equivalent results where practical

Do not optimize solely for a Lighthouse score. Fix the underlying user experience.

---

# Phase 5: Recommended Architecture

After understanding the repository, define an architecture appropriate for the real product.

Do not blindly adopt the following, but consider clear boundaries such as:

- Authentication and participants
- Seasons and leagues
- Prediction-game configuration
- Picks and locking
- Scoring and leaderboards
- MLB data ingestion
- Daily game presentation
- PWA delivery and caching
- Sign compatibility
- Administration

Prefer domain-oriented modules over directories organized solely by technical file type.

Potential domain concepts may include:

- `Sport`
- `League`
- `Season`
- `Team`
- `Participant`
- `PredictionGame`
- `PredictionCategory`
- `Pick`
- `PickSet`
- `LockWindow`
- `Result`
- `Leaderboard`
- `ScheduledGame`
- `TeamSeasonRecord`
- `ExternalDataSnapshot`

Do not introduce these exact entities unless they fit the existing product.

Keep MLB-specific rules explicit when making them generic would make the code harder to understand.

---

# Phase 6: Implementation

After completing the discovery and audit, implement the highest-value improvements.

Do not stop after producing an audit document unless a repository limitation makes implementation impossible.

Prioritize work in this order:

1. Critical security vulnerabilities
2. Pick and scoring integrity
3. Sign API contract protection
4. Data-loss or data-corruption risks
5. Broken production behavior
6. Unsafe or obsolete platform usage
7. Architectural blockers
8. API consistency
9. MLB integration reliability
10. Performance bottlenecks
11. Test coverage for critical workflows
12. PWA foundation and installability
13. UI and UX improvements
14. Maintainability and cleanup
15. Future extension points

Make coherent changes rather than scattering partial refactors throughout the repository.

Avoid leaving two competing architectures in place.

---

# Migration and Compatibility Strategy

For significant changes:

- Add explicit migrations.
- Make migrations repeatable where practical.
- Back up or preserve existing data.
- Validate migrated records.
- Document rollback considerations.
- Preserve historical seasons.
- Preserve locked picks.
- Preserve scoring results.
- Preserve sign API behavior.
- Avoid changing external identifiers without a mapping strategy.

Where an internal API is replaced, migrate all application callers to the new API.

Do not leave unused legacy endpoints unless they are required for sign compatibility or a documented transition.

---

# Documentation Deliverables

Create or update the following documentation.

## `TECHNICAL_AUDIT.md`

Include:

- Executive summary
- Current-state architecture
- Major strengths
- Critical issues
- Security findings
- Data-integrity findings
- API findings
- MLB integration findings
- Performance findings
- PWA findings
- UI/UX findings
- Testing findings
- Observability findings
- Dependency findings
- Recommended architecture
- Prioritized remediation plan
- Work completed
- Remaining risks
- Future opportunities

Rank findings as:

- Critical
- High
- Medium
- Low

For each significant issue, include:

- Problem
- Evidence
- Risk
- Recommendation
- Whether it was fixed
- Relevant files or modules

## `ARCHITECTURE.md`

Document:

- Major system components
- Domain boundaries
- Request flows
- Persistence model
- MLB ingestion flow
- Scoring flow
- Pick-locking flow
- PWA architecture and caching boundaries
- Sign API compatibility layer
- Authentication and authorization
- Background jobs
- Deployment architecture
- Extension points for future daily-game data
- Extension points for future sports

## `SIGN_API_CONTRACT.md`

Document every sign-facing endpoint:

- Route
- Method
- Authentication
- Parameters
- Response schema
- Status codes
- Example response
- Error behavior
- Caching expectations
- Known consumers
- Compatibility tests

## `PWA.md`

Document:

- Manifest configuration
- Icon strategy
- Service-worker implementation
- Cache strategies by resource type
- Offline behavior
- Mutation behavior while offline
- Update lifecycle
- Install testing
- Browser limitations
- Troubleshooting
- Cache-reset procedure

## `DECISIONS.md`

Record material architectural decisions and tradeoffs.

Examples:

- Why MLB remains the primary implementation
- How future sports are accommodated without over-generalizing
- Why sign APIs use a compatibility adapter
- Whether external MLB data is cached or persisted
- How locked picks are snapshotted
- How scoring is calculated
- How administrative overrides are audited
- How PWA caching avoids stale authoritative state

## `README.md`

Update setup and development instructions, including:

- Prerequisites
- Environment variables
- Local development
- Database setup
- Migrations
- Seed data
- Tests
- Background jobs
- MLB data refreshes
- PWA development and testing
- Sign API testing
- Production build
- Deployment
- Troubleshooting

Provide a sanitized `.env.example` where appropriate.

---

# Required Final Summary

At the end of the work, provide a concise summary containing the following.

## Overall Assessment

- The condition of the application before the work
- The most important architectural findings
- The most important product findings

## Changes Made

Group completed work by:

- Security
- Architecture
- APIs
- Data model
- MLB integration
- Sign compatibility
- Performance
- Testing
- PWA
- UI/UX
- Documentation

## Compatibility

Explicitly confirm:

- Which sign endpoints were identified
- How their contracts were protected
- Whether their outputs remain compatible
- Which tests demonstrate compatibility

Do not claim compatibility unless it has been verified.

## PWA Completion

Explicitly report:

- Whether the app is installable
- Which platforms and browsers were tested
- Manifest status
- Service-worker status
- Offline behavior
- Cache strategy
- Update behavior
- Icon and branding completion
- Known platform limitations

Do not claim PWA completion based only on the presence of a manifest file.

## Remaining Risks

List:

- Unresolved critical or high-risk issues
- Deferred migrations
- Areas requiring production credentials or access
- Assumptions that could not be verified
- Operational risks
- Technical debt intentionally retained

## Future Opportunities

Separate future opportunities from current requirements.

Include reasonable next steps for:

- Weather
- Lineups
- Trends
- Odds or projections
- Additional sports
- Push notifications, if product-appropriate
- Background synchronization, if safe and justified
- Sign-project modernization

## Validation

Report the result of:

- Type checking
- Linting
- Unit tests
- Integration tests
- Contract tests
- End-to-end tests
- PWA installability checks
- Offline/degraded-network checks
- Accessibility checks
- Production build
- Migration validation

Include exact failures rather than saying that everything passed when it did not.

---

# Working Principles

- Understand before rewriting.
- Protect production contracts before refactoring.
- Fix root causes rather than symptoms.
- Keep the server authoritative for game integrity.
- Prefer explicit domain logic over clever abstraction.
- Optimize for MLB without permanently blocking other sports.
- Preserve historical correctness.
- Do not expose external MLB schemas as the application domain model.
- Do not trust client-side validation.
- Do not hide failures.
- Do not leave major security findings as comments when they can be fixed.
- Do not redesign only the frontend while ignoring backend weaknesses.
- Do not build a nominal PWA that merely passes a checklist.
- Do not serve stale cached data as authoritative pick or lock state.
- Do not rewrite functioning code without a clear benefit.
- Do not preserve obsolete code solely because it exists.
- Do not claim work was completed unless it was tested.
- Leave the repository cleaner, safer, more coherent, installable, and easier to operate.
