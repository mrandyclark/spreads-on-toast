# Types Directory

This directory contains all TypeScript type definitions for the Spreads on Toast application.

## Directory Structure

```
types/
  index.ts          # Barrel export (import from '@types')
  mongo.ts          # Base document types, ModelName enum
  user.ts           # User account type
  sport.ts          # Sport, Division, Conference enums
  team.ts           # Team, TeamLine, TeamWithLine types
  group.ts          # Group, GroupMember, GroupSummary types
  sheet.ts          # Sheet, TeamPick, PostseasonPicks, WorldSeriesPicks
  invitation.ts     # Invitation types
  season.ts         # Season reference data
```

## Data Model Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REFERENCE DATA                                     │
│                    (Seeded/Admin-managed, rarely changes)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐         │
│  │    Team      │         │   Season     │         │  TeamLine    │         │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤         │
│  │ abbreviation │         │ sport        │         │ team ────────┼────┐    │
│  │ city         │         │ season       │         │ season       │    │    │
│  │ name         │         │ lockDate     │         │ sport        │    │    │
│  │ sport        │         │ startDate    │         │ line (91.5)  │    │    │
│  │ conference   │         │ endDate      │         └──────────────┘    │    │
│  │ division     │         │ status       │                             │    │
│  └──────────────┘         └──────────────┘                             │    │
│         ▲                                                              │    │
│         └──────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER DATA                                       │
│                      (Created by users, changes often)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                           │
│  │    User      │                                                           │
│  ├──────────────┤                                                           │
│  │ kindeId      │◄─────────────────────────────────────────┐                │
│  │ email        │                                          │                │
│  │ nameFirst    │                                          │                │
│  │ nameLast     │                                          │                │
│  └──────────────┘                                          │                │
│         │                                                  │                │
│         │ owns/members                                     │                │
│         ▼                                                  │                │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │    Group     │         │    Sheet     │         │  Invitation  │        │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤        │
│  │ name         │◄────────┤ group        │         │ email        │        │
│  │ sport        │         │ user ────────┼────────►│ group        │        │
│  │ season       │         │ teamPicks[]  │         │ invitedBy ───┼────────┘
│  │ lockDate     │         │ postseason   │         │ status       │
│  │ inviteCode   │         │ worldSeries  │         └──────────────┘
│  │ owner ───────┼─────┐   │ submittedAt  │
│  │ members[] ───┼─────┤   └──────────────┘
│  └──────────────┘     │
│                       │
│                       └──► User
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Entity Relationships

### Reference Data (rarely changes, seeded by admin)

| Collection | Purpose | Notes |
|------------|---------|-------|
| `Team` | Team info (NYY, LAD, etc.) | Seed once per sport, update rarely |
| `Season` | Season metadata & dates | Created yearly by admin |
| `TeamLine` | Win total lines per team/season | Set before each season starts |

### User Data (changes frequently)

| Collection | Purpose | Notes |
|------------|---------|-------|
| `User` | User accounts from Kinde | Created on first login |
| `Group` | Competition groups | Created by users, has embedded members |
| `Sheet` | User's picks for a group | One per user per group |
| `Invitation` | Pending group invites | Email-based (works before signup) |

## Key Design Decisions

1. **"Group" not "League"** — We use "Group" for competition groups to avoid confusion with sports leagues (MLB, NFL, etc.)

2. **TeamLine is separate from Team** — Lines change each season, team info doesn't. This allows historical tracking.

3. **Sheet stores the line at pick time** — If lines are adjusted, the user's original pick context is preserved.

4. **Group has embedded members array** — Fast reads for small groups. Members include role and join date.

5. **Invitation uses email** — Works for inviting users who don't have accounts yet (like gift-zeus pattern).

6. **Sport enum, not string** — Type-safe sport references, easy to add new sports later.

## Usage

Import types from the barrel file:

```typescript
import { Group, Sheet, Sport, TeamPick } from '@types';
```

Or import specific files:

```typescript
import { Group, GroupSummary } from '@types/group';
```
