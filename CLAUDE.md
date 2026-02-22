# CLAUDE.md

## Project

Spreads on Toast — Next.js app for MLB over/under betting with digital sign displays. MongoDB (Mongoose), Tailwind CSS v4, TypeScript.

## Rules

- Indentation: **tabs**
- ESLint with **perfectionist** plugin enforces sorted imports and object keys
- Use `// eslint-disable-next-line perfectionist/sort-objects` when key order matters (e.g., MongoDB `.sort()` where `sortField` must precede `_id`)
- Path alias: `@/` maps to project root
- Never add comments or documentation unless asked
- Prefer minimal edits — single-line fixes over refactors when possible
- **Always use curly braces** for `if`/`else`/`for`/`while` — no braceless single-line bodies (enforced by `curly: ['error', 'all']`)
- **Multi-line blocks** — opening brace on same line, body on next line (enforced by `brace-style: ['error', '1tbs']`). No single-line `if (x) {return y;}`.

## Architecture

- **`models/*.model.ts`** — Mongoose schemas + models. Use `configureSchema()` from `lib/mongo-utils.ts`.
- **`server/<domain>/<domain>.service.ts`** — Extends `BaseService<T>` from `server/base.service.ts`. Handles `dbConnect`, `.lean()`, `cleanMongoDoc` automatically. Exported as singleton (e.g., `export const signService = new SignService()`).
- **`server/<domain>/<domain>.actions.ts`** — Business logic orchestrating multiple services. No auth here.
- **`app/**/actions.ts`** — Thin Next.js server actions: auth check → call action → `revalidatePath` → return.
- **`app/api/**/route.ts`** — Thin API routes: auth check → call action/service → return.
- **`server/<domain>/sync.ts`** — CRON sync logic (MLB API → DB). These and services are the only files that import models directly.
- Reference: `server/signs/` is the cleanest example of the full pattern.

### Import rules

- **Models are only imported in `*.service.ts` and `sync.ts` files.** Never in `app/`, `actions.ts`, or `route.ts`.
- Actions/routes access data exclusively through services.

### Ref handling

- `Ref<T> = string | T` — used for populated/unpopulated Mongoose fields (defined in `types/mongo.ts`)
- Use `resolveRefId(ref)` to get the ID string (works with both populated and unpopulated refs, accepts optional refs returning `string | undefined`)
- Use `resolveRef<T>(ref)` to get the populated object (returns `T | null`)
- Use `resolveRefIds(refs)` for arrays of refs
- Never inline `typeof ref === 'object'` or `typeof ref === 'string'` checks
- When a service method returns populated docs, pass `{ populate: 'path' }` to BaseService methods — they handle `dbConnect`, `lean`, and `cleanMongoDocs` automatically. Return the domain type (e.g., `TeamStanding[]`) — `Ref<T>` handles both shapes

### BaseService methods

`create`, `findById`, `findOne`, `find`, `findByIdAndUpdate`, `findOneAndUpdate`, `deleteById`, `count`, `search` (paginated with cursor), `aggregate`

`find`, `findOne`, and `findById` accept an options object with `populate`, `sort`, `select`, and `limit`:
```ts
this.find({ group }, { populate: 'teamPicks.team', sort: { date: -1 }, limit: 10 });
this.findOne({ _id: id, 'members.user': userId }, { populate: 'members.user' });
```
Populate accepts `string | string[]` for multiple paths. **Never call `model.find().populate()` directly** — use BaseService options instead.

## Database

- Free MongoDB Atlas tier — **minimize round trips**
- Use `.select()` projections on large documents (e.g., `TeamStanding` has fat `splits` objects)
- Use `Promise.all` for independent queries
- Avoid N+1 loops — bulk query + in-memory partitioning (see `server/schedule/schedule-difficulty.ts`)
- Mongoose v8 uses `QueryFilter<T>` not `FilterQuery<T>`
- Index key order matters — use `eslint-disable-next-line perfectionist/sort-objects` on `.index()` calls where key order is intentional
- Every compound index should have a comment explaining which query pattern it supports

## Frontend

- **Tailwind v4** with `@theme` block in `app/globals.css` for custom colors
- AL Red: `bg-al` / `text-al` — NL Blue: `bg-nl` / `text-nl`
- If custom theme colors disappear, delete `.next` and rebuild
- Use `Suspense` boundaries for slow independent data sections (see team detail page)
- Client-side date/season changes use `router.push()` — keep page-level fetches fast, only wrap truly slow sections in Suspense

### File structure

- **`app/`** — routing and page-level orchestration only. Only `page.tsx`, `layout.tsx`, `actions.ts`, and server components that do data fetching. No client components.
- **`components/`** — all UI components, organized by feature. Max one directory level deep.
- **`lib/`** — shared utilities, constants, and helpers (no React, no server-only code).

### Data fetching

- **Initial data loads happen in server `page.tsx` files** and are passed as `initialFoo` props to client components. Never use `useEffect` + server action for initial page data.
- **Reactive fetches** (user changes a dropdown, date picker, etc.) use server actions called from `useEffect` in client components — this is fine.
- **Never use `fetch('/api/...')` in client components.** Use server actions instead. API routes exist only for external consumers (e.g., sign displays).
- Client components accept `initialFoo` props and manage local state with `useState(initialFoo)`.

### Component directory layout (`components/`)

- **`ui/`** — shadcn primitives (button, card, dialog, etc.)
- **`layout/`** — `PageShell`, `PageHeader`, `BackLink`, `SiteHeader`
- **`marketing/`** — landing page sections (hero, features, FAQ, etc.)
- **`dashboard/`** — dashboard-client, signs-client
- **`game-detail/`** — game page components (game-info, linescore, score-display, etc.)
- **`team-detail/`** — team page components (team-header, team-stats-client, stat-card, etc.)
- **`team-schedule/`** — schedule-difficulty, upcoming-schedule, sos-card, game-row
- **`team-chip/`** — team-chip + team-chip-badge
- **`win-profile/`** — win-profile + situational-bar, contribution-bar
- **`standings/`** — standings-board, league-standings, division-rows, standings-chart
- **`league-detail/`** — leaderboard, locked-results, member-sheet, picks-form, team-picks, etc.
- **`sign-detail/`** — sign-detail-client, team-picker
- Standalone files at root: `leaderboard-mockup.tsx`, `toast-icon.tsx`

**Rules:** Use a directory when a component has private sub-components. Never nest more than one level deep. No barrel `index.ts` files — always import directly from the component file. When adding a new component, place it in the directory of its parent consumer (or create a new directory if it's a new feature area).

### Utility libraries (`lib/`)

- **`lib/format-utils.ts`** — `pluralize(noun, count)` (regex-based English pluralization), `countAndPluralize(count, noun)` (prepends count), `formatMoney`, `getOrdinalSuffix`, `ordinal`
- **`lib/state-utils.ts`** — immutable state helpers for React: `toggleValue`, `safeArray`, `safePush`, `safeJoin`, `safeToggle`, `safeUpdate`, `safeUpdateMultiple`, `handleRemoveByKey/Index/Function`, `safeReplaceByIndex`, `handleReplaceByIndex`, `reorderArrayByDragDrop`
- **`lib/date-utils.ts`** — `toDateString`, `formatDateDisplay`, `formatGameDate`, `formatGameTime`, `formatShortDate`
- **`lib/constants.ts`** — `DIVISION_LABELS`, `DIVISION_ORDER` (NL first, then AL), `NL_DIVISIONS`, `AL_DIVISIONS` — all typed with `Division` enum. Never define inline division order arrays.
- **`lib/ref-utils.ts`** — `resolveRef`, `resolveRefId`, `resolveRefIds` — **app/ files must import from here**, not `mongo-utils` (avoids Mongoose in client bundle)
- **`lib/sheet-utils.ts`** — `getTeamId`, `getTeamFromPick`, `toTeamsWithLines`, `getFullTeamName`, `getTeamsByConference` — team/pick data helpers that delegate to `resolveRef`/`resolveRefId`

### Component style

- **Arrow function + `export default`** for all components: `const MyComponent = () => { ... }; export default MyComponent;`
- **One component per file.** Internal helper components go in separate files in the same directory.
- **No ternary conditional rendering** in JSX. Use `{condition && (...)}` / `{!condition && (...)}` patterns instead.
- Ternaries are fine for inline values (e.g., button text: `{isSaving ? 'Saving...' : 'Save'}`), just not for rendering different JSX blocks.
- **Always use `cn()` for dynamic classNames.** Never use template literals for className — use `cn('base-classes', condition && 'conditional-class')` instead of `` className={`base ${condition ? 'a' : 'b'}`} ``.
- **All shared types live in `types/`.** Only `interface FooProps` (component props) may be defined in component files. Everything else goes in the appropriate `types/*.ts` file so it can be imported from `@/types`.

### Conventions

- Use `countAndPluralize(count, 'member')` instead of `{count} member{count !== 1 ? 's' : ''}`
- Use `toggleValue(arr, value)` instead of inline `arr.includes(v) ? arr.filter(...) : [...arr, v]`
- Use `ordinal(n)` instead of inline ordinal suffix logic
- Division labels always use `DIVISION_LABELS` from `lib/constants.ts` — never define inline `Record<string, string>` maps
- Division ordering always uses `DIVISION_ORDER` (or `NL_DIVISIONS`/`AL_DIVISIONS`) from `lib/constants.ts` — never define inline division order arrays
- Ref resolution always uses `resolveRef`/`resolveRefId` from `lib/ref-utils.ts` — never inline `typeof ref === 'object'` checks
- Date formatting functions live in `lib/date-utils.ts` — never define inline `toLocaleDateString` wrappers in page files

## Auth

- `lib/auth.ts` → `getAuthUser()` — checks Bearer token first, falls back to Kinde session cookie
- `lib/with-auth-action.ts` → `withAuth()` wrapper for server actions
- `server/http/responses.ts` → `withAuth()` wrapper for API routes

### Server action error handling

All server actions use structured errors from `lib/action-errors.ts`. Every error has three fields:
- **`error`** — machine-readable code (`'not-found'`, `'unauthorized'`, `'validation'`, `'forbidden'`, `'locked'`, `'server-error'`)
- **`errorCode`** — HTTP-style status code (404, 401, 400, 403, 423, 500)
- **`errorMessage`** — human-readable string for UI display

Use the factory helpers — never inline `{ error: '...' }`:
```ts
return notFound('Group');      // { error: 'not-found', errorCode: 404, errorMessage: 'Group not found' }
return forbidden('edit group'); // { error: 'forbidden', errorCode: 403, errorMessage: 'Not authorized to edit group' }
return validation('Name is required');
return locked('Picks');
return serverError('save picks');
```

Clients check `result.error` for error presence and display `result.errorMessage` to users.
