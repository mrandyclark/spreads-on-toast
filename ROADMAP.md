# Roadmap

Ideas and planned features for Spreads on Toast.

## Sign Hardware

- [ ] **Live game scores** — Add a live game sync (MLB API every 30-60s during game hours), then push updates to signs via Pusher/Ably. Prerequisite: data currently only updates daily via cron.
- [ ] **Pre-built slides payload** — Build and cache the slides response on sync instead of computing on every sign request. Makes aggressive polling cheap (single document read).
- [ ] **Two-tier polling** — Sign polls `/config` frequently (1-2 min, cheap) and `/slides` less often (15-30 min, heavy). Config version bump triggers immediate slides refetch.

## Game Day Page

- [ ] **Odds API integration** — Run line, over/under, moneyline from The Odds API. Display on game cards and game detail page.
- [ ] **Sorting & filtering** — Sort games by time, status, division. Filter by team or division.
- [ ] **Mobile polish** — Responsive refinements for game cards and game detail.

## General

- [ ] **Weather integration** — NWS or OpenWeatherMap forecast for game venues. Was started and removed — revisit when we have a reliable API approach.
- [ ] **Historical accuracy tracking** — Track pick accuracy over time for the league/picks feature.
