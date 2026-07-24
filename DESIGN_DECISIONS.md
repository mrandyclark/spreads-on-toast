# Design Decisions

## 1. Organize the product around baseball moments

The old structure exposed features as utilities. The new structure names three recurring jobs:
**Draft** (make the card), **Scores** (follow today), and **League** (measure the competition).
Clubhouse is the cross-season landing point. This mirrors how usage changes over the year without
changing underlying business rules.

## 2. Make mobile navigation persistent

Ninety percent mobile usage makes a hamburger menu too costly for daily switching. A safe-area-aware
bottom bar keeps Clubhouse, Scores, and Signs one tap away. Desktop retains the same destinations in
the header so information architecture does not change by viewport.

## 3. Move from “warm SaaS” to “night game scorebook”

The previous cream and rust palette was pleasant but visually interchangeable with lifestyle
software. Deep ink, scorebook paper, hot-stove red, toast gold, ruled textures, and scoreboard
typography make the product recognizably baseball while preserving warmth.

## 4. Treat picks as the hero interaction

Team picks are no longer generic bordered form rows. Team identity, Vegas line, and the two choices
share one strong horizontal unit. Progress and deadline stay visible. Saving remains
server-confirmed and the lock interaction is framed as a meaningful commitment.

## 5. Give scores broadcast hierarchy

Game cards lead with state, teams, and score. Venue and pitcher data become secondary. Live games
receive a visible edge and status treatment, allowing a fast scan without relying on color alone.

## 6. Turn standings into a story

League ranking emphasizes position, personal row, accuracy, and movement. The design creates room
for later insights—biggest climb, best call, worst miss—without inventing data today.

## 7. Keep personality in microcopy, not gimmicks

Toast language appears at high-emotion moments and in brand storytelling. Core controls retain
literal terms such as Over, Under, Save, and Final. This keeps the joke memorable and the product
credible.

## 8. Build the evolution into primitives

Color, type, radii, card treatment, button behavior, page shell, and navigation are updated at the
system level so existing detail pages inherit the new experience. Focused screen changes then add
the appropriate content hierarchy without an architectural rewrite.

## 9. Preserve operational contracts

No database models, score rules, authentication behavior, cron routes, or digital-sign API response
shapes are changed. The redesign is deliberately a presentation-layer evolution.
