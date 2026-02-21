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
- Use `populatedToId(ref)` and `populatedArrayToId(refs)` from `lib/mongo-utils.ts` to extract IDs — never inline `typeof ref === 'string' ? ref : ref.id` or `String(ref)`
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

## Auth

- `lib/auth.ts` → `getAuthUser()` — checks Bearer token first, falls back to Kinde session cookie
- `lib/with-auth-action.ts` → `withAuth()` wrapper for server actions
- `server/http/responses.ts` → `withAuth()` wrapper for API routes
