# Progressive Web App

## Manifest

`public/site.webmanifest` defines:

- stable app identity, `/` scope, and `/dashboard?source=pwa` start URL;
- standalone display with desktop overlay preference;
- toast-colored theme and warm background;
- 192px and 512px `any` icons;
- separate 192px and 512px maskable icons with an intentional safe zone;
- iOS touch icon and app metadata;
- shortcuts to games and groups.

The maskable and Apple assets are derived from the product’s existing toast mark, not framework
placeholder branding.

## Service worker

`public/sw.js` is registered by `components/pwa/pwa-controller.tsx` only in a production build on a
secure context. Cache names include an explicit release version.

In development, the controller unregisters a previous Spreads on Toast worker and removes its
versioned caches. This prevents a production worker on the same localhost origin from serving stale
assets or interfering with Next.js hot reload.

| Resource                                               | Strategy                             | Reason                                   |
| ------------------------------------------------------ | ------------------------------------ | ---------------------------------------- |
| Next.js versioned static assets and local images/fonts | cache first                          | immutable or safely URL-versioned        |
| Landing page and offline page                          | network first, public-cache fallback | useful public shell without private data |
| Authenticated navigation                               | network only, offline-page fallback  | prevents private cross-user/stale HTML   |
| `/api/*`, server actions, auth, sign/admin data        | network only                         | authoritative or sensitive               |
| Non-GET requests                                       | untouched/network only               | no offline mutation queue                |
| Cross-origin resources                                 | untouched                            | no unreviewed third-party cache          |

Old `spreads-on-toast-*` caches are removed on activation.

## Offline and degraded behavior

- Connection status comes from a non-cached `/api/health` probe, not `navigator.onLine`. Browser
  online/offline events, focus, visibility changes, and a 30-second interval trigger rechecks.
- A failed probe displays a persistent server-unavailable status with an explicit retry; a
  successful probe clears it automatically.
- Failed navigation shows `/offline`.
- Scores, standings, and locked picks are not promised offline because the current browser
  architecture does not expose safe public read models.
- Pick controls may remain visible on an already rendered page, but Save refuses immediately when
  offline and never displays success.
- No deadline-sensitive operation is queued for later.
- Authentication and administrative functions require the network.
- Reconnection leaves edits in memory and permits an explicit retry while the page remains open.

This is deliberately honest degradation. A future encrypted per-user read cache would require a
threat model, logout purge, and versioned data schemas.

## Update lifecycle

The worker does not call `skipWaiting` during install. When an update reaches `waiting`, the UI:

1. detects it;
2. checks the global dirty-picks signal;
3. prompts the user;
4. disables update while changes are unsaved;
5. sends `SKIP_WAITING` only after consent;
6. reloads once on `controllerchange`.

Visibility changes trigger an update check. Cache cleanup is version scoped, and the reload guard
prevents loops.

## Installation testing

Use a production build over HTTPS, or localhost:

1. Open Chromium DevTools → Application.
2. Confirm manifest identity, standalone mode, both icon purposes, start URL, and no warnings.
3. Confirm `/sw.js` controls `/`.
4. Install, launch standalone, and exercise the Games and Groups shortcuts.
5. Toggle offline and navigate from a private page; verify the offline screen.
6. Edit a pick, install a changed worker version, and verify Update is disabled until a confirmed
   save.
7. Test 320px, 390px, 768px, and desktop viewports; verify safe areas and 44px coarse-pointer
   targets.

On iPhone/iPad Safari, use Share → Add to Home Screen. Confirm the opaque touch icon, standalone
launch, status-bar safe area, offline page, and that no browser install prompt is expected. On
Android Chrome and desktop Chromium, validate the native install prompt. Firefox support varies
and should be treated as browser-dependent rather than guaranteed.

## Automated checks

`pnpm test:pwa` validates manifest fields, icon presence/size, mutation/API exclusions, offline
fallback, cache reset, and waiting-worker code paths.

The final production build was also checked in headless Chromium at desktop and 390px mobile
viewports. Chromium reported no manifest/installability errors, the worker controlled `/`, the
mobile document had no horizontal overflow, a stopped server produced the complete cached offline
screen, the page emitted no console/page errors, and an axe WCAG A/AA/2.1 AA scan reported zero
public-page violations. This does not replace physical iOS/iPadOS, Android, or authenticated-flow
testing.

## Cache reset

The offline page’s “Reset offline data” action deletes Cache Storage entries, unregisters service
workers, and returns to `/`. Manually, use browser site settings or DevTools Application → Storage
→ Clear site data, then reload.

## Limitations

- iOS controls installation and does not expose `beforeinstallprompt`.
- iOS splash screens are generated from current manifest/touch metadata; device-specific legacy
  launch images are intentionally not maintained.
- Background Sync and push are not enabled because pick writes are deadline-sensitive and the
  product has not defined a notification policy.
- Previously loaded private pages are intentionally not available after a cold offline launch.
