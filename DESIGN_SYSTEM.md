# Spreads on Toast Design System

## Foundations

### Typography

The system uses device-native faces to remain fast and reliable as an installed PWA.

- **Display:** `Arial Narrow`, `Avenir Next Condensed`, then the system sans stack. Uppercase,
  compressed, and used for score-like headlines only.
- **Sans:** `Avenir Next`, `Segoe UI`, and the system stack for interface and reading.
- **Serif:** `Iowan Old Style`, Palatino, and Georgia for selective editorial moments.
- Numeric scores, lines, countdowns, and standings always use `font-variant-numeric: tabular-nums`.

Type scale: 12, 13, 14, 16, 18, 22, 28, 40, 56, and 72px. Body copy defaults to 16px on mobile.

### Color

| Token        | Light     | Dark      | Use                              |
| ------------ | --------- | --------- | -------------------------------- |
| Ink          | `#101E2A` | `#F5EEDF` | Primary text and night-sky base  |
| Scorebook    | `#F6F0E3` | `#09141E` | App background                   |
| Paper        | `#FFFDF7` | `#10212E` | Elevated surfaces                |
| Hot stove    | `#E6492D` | `#FF6548` | Primary action and live state    |
| Toast        | `#F2B84B` | `#F5BF56` | Progress, winner, warm highlight |
| Outfield     | `#1E7662` | `#50C7A2` | Success and over                 |
| Bullpen blue | `#2D5BFF` | `#6F91FF` | Information and under            |

Color is never the only carrier of meaning. Result states include words or icons.

### Grid and spacing

- Base unit: 4px.
- Common spacing: 8, 12, 16, 20, 24, 32, 48, 64, 96px.
- Mobile gutter: 16px; tablet: 24px; desktop: 32px.
- Reading width: 720px. Application width: 1120px. Marketing width: 1200px.
- Cards use 16–20px internal padding on phones, 24px on larger screens.
- Minimum interactive target: 44×44px; primary mobile actions are 52–56px high.

### Shape and elevation

Primary cards use 18–24px radii. Small controls use 10–14px. Pills are reserved for statuses,
filters, and compact metadata. Borders do most separation work; shadows signal interactive or
floating layers only.

## Components

### Navigation

The installed experience has a persistent mobile tab bar for Clubhouse, Scores, and Signs. Desktop
uses a compact top navigation with the same information architecture. Safe-area insets are included
in both top and bottom chrome.

### Buttons

- **Primary:** hot-stove fill; one dominant action per region.
- **Secondary:** ink fill for strong but non-primary actions.
- **Outline:** paper surface with a visible border.
- **Ghost:** chrome and low-emphasis actions only.
- Labels begin with verbs. Loading labels describe the active operation.

### Cards

Cards are content groupings, not a default wrapper for every block. Interactive cards lift 2px and
strengthen their border on hover. Live cards gain a red leading edge. Score cards prioritize teams
and score over venue metadata.

### Pick selector

Each team row shows brand initial, team name, line, and a two-way Over/Under control. Both targets
remain visible and thumb-sized. Selection uses fill, icon, copy, and a subtle spring response.

### Feedback

- Save feedback remains next to the save action and explicitly says whether the server confirmed it.
- Toasts are for transient cross-screen feedback, not form errors.
- Skeletons preserve the final geometry and use a low-contrast shimmer.
- Empty states use baseball-aware language followed by a plain explanation and action.

## Motion language

Motion is quick, purposeful, and slightly springy:

- 120ms for press and hover.
- 180ms for color and local state.
- 280ms for sheets, cards, and route-level entrances.
- Progress fills and rank movement may use 450ms.

No looping decorative animation. A live dot may pulse. All motion collapses under
`prefers-reduced-motion`.

## Iconography

Use Lucide icons at 1.75–2px stroke, normally 16, 20, or 24px. Icons support labels rather than
replace unfamiliar actions. The custom toast/home-plate mark is the only illustrative interface
icon.

## Accessibility

- WCAG 2.2 AA contrast is the baseline.
- Focus rings are 3px and never removed.
- 44px minimum targets and sufficient separation for coarse pointers.
- Dynamic scores use polite live regions where appropriate; decorative motion is hidden.
- Safe areas and 200% text zoom must not obscure primary navigation or saving.
- Dark mode follows system preference by default and can later support an explicit user setting.
- Tables retain semantic markup and usable horizontal scrolling on narrow screens.
