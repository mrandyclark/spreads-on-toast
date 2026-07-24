# Install App Experience Requirements

## 1. Purpose

Provide a clear, trustworthy way for users to install a web application on supported mobile and
desktop devices.

The experience must:

- appear only when installation is relevant;
- use the browser’s native installation flow where available;
- explain manual installation where browsers do not expose a native prompt;
- disappear after installation;
- avoid interrupting important work;
- remain accessible and responsive;
- never claim the app is installable when its PWA requirements are not satisfied.

This document is implementation-neutral and can be adapted to any installable Progressive Web App.

## 2. Terminology

- **Install affordance:** The application-owned button or menu item that begins or explains
  installation.
- **Native prompt:** The browser- or operating-system-owned installation confirmation UI.
- **Installed mode:** The application is running as an installed PWA, normally in standalone or
  window-controls-overlay display mode.
- **Eligible browser:** A browser that determines the current application can be installed.
- **Deferred install event:** A browser event, such as Chromium’s `beforeinstallprompt`, retained
  until the user intentionally chooses Install.

## 3. Goals

1. Make installation discoverable without dominating the primary task.
2. Preserve user agency: installation begins only after an explicit user action.
3. Use accurate language and platform-appropriate instructions.
4. Prevent duplicate prompts after installation.
5. Support mobile safe areas, touch input, keyboard input, and assistive technology.
6. Measure the funnel without collecting sensitive browsing or authentication data.

## 4. Non-goals

- Automatically opening a native prompt without user intent.
- Repeatedly pressuring users who dismiss installation.
- Treating installation as necessary to use the application.
- Faking a browser prompt with application-owned UI.
- Supporting offline mutations merely because the application is installable.
- Detecting installation through invasive device fingerprinting.

## 5. Prerequisites

The install affordance may be enabled only after the application has a production-quality PWA
foundation:

- valid web app manifest;
- stable application name, short name, ID, start URL, and scope;
- appropriate `display` mode;
- 192px and 512px icons;
- maskable icons where supported;
- theme and background colors;
- service worker registered on a secure production context;
- intentional offline or degraded-network behavior;
- versioned cache lifecycle and obsolete-cache cleanup;
- safe frontend update behavior;
- HTTPS in production;
- no manifest or browser installability errors.

Icons must use real application branding rather than framework or placeholder artwork.

## 6. Functional requirements

### 6.1 Native-prompt platforms

On browsers that expose a deferred native install event:

1. The application must intercept and retain the event without immediately opening it.
2. The Install button must become visible only while a valid deferred event is available.
3. Selecting Install must call the native prompt from the user-initiated event handler.
4. The application must await the browser’s user-choice result.
5. The retained event must be discarded after it is used because it cannot safely be reused.
6. The button must disappear after acceptance or dismissal of that prompt instance.
7. A future browser event may make the button eligible again according to the dismissal policy.

The application must not infer successful installation merely because the prompt was opened.

### 6.2 iPhone and iPad

Safari on iOS and iPadOS does not expose Chromium’s native install event.

When installation education is included:

1. Show an install affordance only in supported Safari contexts that are not already standalone.
2. Selecting it must open concise instructions rather than a simulated native prompt.
3. Instructions should describe the current platform flow, normally:
   - open the Share menu;
   - select **Add to Home Screen**;
   - confirm **Add**.
4. The instructions must be dismissible and keyboard/screen-reader accessible.
5. Do not show iOS instructions in an installed standalone session.
6. Avoid claiming that every embedded browser supports installation. If the current browser cannot
   install, explain that the page should be opened in Safari.

Platform detection should remain conservative. Prefer capability and display-mode checks over
detailed user-agent parsing.

### 6.3 Already-installed behavior

The install affordance must be hidden when any reliable signal indicates installed use:

- the application is running in `display-mode: standalone`;
- the application is running in another installed display mode supported by the product;
- iOS reports standalone home-screen use;
- the browser emits `appinstalled` during the current session.

The browser remains authoritative. Do not maintain a permanent “installed” flag that could survive
uninstallation and incorrectly suppress the affordance.

### 6.4 Button behavior

The button must:

- use a concise label such as **Install app**;
- include an optional download/device icon that is hidden from assistive technology;
- have at least a 44×44 CSS-pixel touch target on coarse-pointer devices;
- show a visible keyboard focus state;
- use a native `button` element unless another semantic control is required;
- be disabled while a native prompt or instruction action is already processing;
- avoid obscuring primary controls, navigation, validation errors, or important notices;
- respect left, right, and bottom safe-area insets;
- remain usable at 320px viewport width and at increased text zoom.

The application should place the affordance in a stable secondary location, such as:

- a compact fixed button near a safe-area-aware screen edge;
- an account/application menu;
- a settings or onboarding panel.

It should not appear as a blocking modal on initial page load.

### 6.5 Priority with other notices

Only one global bottom-of-screen notice should occupy the same space at a time.

Recommended priority:

1. Connection/server-unavailable notice.
2. Required or available application update.
3. Install affordance.

An install button must not hide a connection failure or an update required for compatibility.

### 6.6 Dismissal policy

The product must define a respectful redisplay policy.

Recommended behavior:

- Native prompt dismissed: hide the button for the current page lifecycle.
- Application-owned iOS instructions dismissed: suppress for a configurable cooling-off period,
  such as 14 or 30 days.
- Explicit “Do not show again”: persist that preference until the user clears site data or changes
  it in settings.
- Never reopen a prompt repeatedly during navigation in the same session.

The product may omit a manual dismissal control when the install button itself is compact and
non-blocking.

## 7. State model

The implementation should model installation as explicit states rather than loosely related
booleans:

| State         | Meaning                                                | UI                                      |
| ------------- | ------------------------------------------------------ | --------------------------------------- |
| `unsupported` | No supported native or manual installation flow exists | No install affordance                   |
| `ineligible`  | Browser has not declared the app installable           | No install affordance                   |
| `eligible`    | A native prompt or supported manual flow is available  | Show Install app                        |
| `prompting`   | Native prompt or instruction UI is active              | Disable duplicate actions               |
| `dismissed`   | User declined the current opportunity                  | Hide according to dismissal policy      |
| `installed`   | Installed mode or `appinstalled` is confirmed          | Hide install affordance                 |
| `error`       | Prompt could not be opened                             | Hide or provide a restrained retry path |

State must reset correctly after navigation, browser updates, site-data clearing, and uninstallation.

## 8. Error handling

- A missing or expired deferred event must not throw an uncaught error.
- Prompt failures should be logged without authentication tokens, complete URLs containing secrets,
  or personal data.
- The UI must not report “Installed” unless installation was confirmed.
- If installation becomes unavailable between rendering and selection, remove the affordance and
  allow normal application use.
- Errors must not enter retry or reload loops.

## 9. Accessibility requirements

- Button accessible name: **Install app**, or an equally clear localized equivalent.
- Decorative icons must use `aria-hidden="true"`.
- Instruction dialogs must have an accessible title and description.
- Focus must move into an opened instruction dialog and return to the invoking control when closed.
- All actions must work with keyboard-only input.
- Text and controls must satisfy WCAG 2.2 AA contrast requirements.
- Status changes should use restrained `aria-live="polite"` announcements when they materially
  affect the user.
- Reduced-motion preferences must be respected.
- The design must remain usable at 200% text zoom.

## 10. Security and privacy requirements

- Register service workers only in secure production contexts or on localhost during intentional
  PWA testing.
- Do not use install analytics to fingerprint devices.
- Do not record manifest identifiers, full user-agent strings, authentication credentials, or
  personal data unless separately justified.
- Installation must not weaken CSP, authentication, authorization, or mutation validation.
- Development should unregister production service workers and clear application-owned PWA caches
  when both modes share a localhost origin.

## 11. Analytics

Analytics are optional. If enabled, use coarse events:

- `install_affordance_shown`
- `install_affordance_selected`
- `install_prompt_accepted`
- `install_prompt_dismissed`
- `install_instructions_opened`
- `appinstalled`
- `install_prompt_error`

Recommended properties:

- broad platform family;
- broad browser family;
- entry surface, such as `floating_button` or `settings`;
- installed display mode when known.

Do not treat `install_prompt_accepted` as equivalent to long-term retention. The `appinstalled`
event is stronger but is still not universally available.

## 12. Localization and content

- All labels and instructions must be localizable.
- Do not use browser-specific terminology on unrelated platforms.
- Avoid exaggerated claims such as “Works fully offline” unless that is true.
- If the application has server-authoritative features, clearly state that installation does not
  make those mutations available offline.

Recommended default copy:

- Button: **Install app**
- iOS dialog title: **Add this app to your Home Screen**
- Unsupported embedded browser: **Open this page in Safari to add it to your Home Screen.**

## 13. Testing requirements

### 13.1 Automated

Test:

- affordance hidden without an eligible install event;
- affordance shown after a valid deferred event;
- native `prompt()` called only after selection;
- accepted and dismissed outcomes;
- event cleared after use;
- `appinstalled` hides the affordance;
- installed display mode hides the affordance;
- prompt rejection does not create an uncaught error;
- priority rules with offline and update notices;
- manifest validity and required icons;
- production service-worker registration;
- development service-worker cleanup.

### 13.2 Browser and device

Validate the production build on:

- desktop Chrome or Edge;
- Android Chrome;
- iPhone Safari;
- iPad Safari;
- at least one non-installing or differently supporting browser, such as Firefox;
- standalone launch after installation;
- mobile viewports including 320px and 390px;
- keyboard-only navigation;
- screen-reader spot checks;
- slow and disconnected networks;
- application update while an install affordance would otherwise be visible.

Where automation is available, confirm that browser tooling reports no manifest or installability
errors. A manifest file alone is not sufficient evidence.

## 14. Acceptance criteria

The feature is complete when:

1. Eligible Chromium users see a non-blocking Install app button.
2. Selecting it opens the browser’s native prompt exactly once for that deferred event.
3. The button disappears after prompt completion and after `appinstalled`.
4. Installed sessions never show the button.
5. Supported iOS users receive accurate manual instructions, if iOS education is in scope.
6. Unsupported users see no broken or ineffective install control.
7. Offline and update notices take priority over installation.
8. The control meets touch, keyboard, focus, contrast, zoom, and safe-area requirements.
9. Production browser tooling reports no manifest or installability errors.
10. No sensitive mutation is cached, queued, or presented as successful because the app was
    installed.
11. Automated tests cover eligibility, prompt outcomes, installed state, and error handling.
12. The experience has been verified in a production build, not only in development.

## 15. Reference implementation outline

A typical implementation:

1. Subscribe to the browser’s install-eligibility event.
2. Prevent the browser’s automatic mini-infobar where applicable.
3. Retain the event in component/application state.
4. Render Install app only while that event is valid.
5. Invoke `prompt()` from the button’s click handler.
6. Await `userChoice`, record only coarse analytics, and clear the retained event.
7. Subscribe to `appinstalled` and clear the affordance.
8. Check installed display modes on initialization and display-mode changes.
9. Provide a separate, capability-gated iOS instruction flow when required.
10. Coordinate the install state with higher-priority connection and update notices.
