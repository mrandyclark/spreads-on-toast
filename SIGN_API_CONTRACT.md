# Digital-sign API contract

This document freezes the HTTP contract consumed by the two production digital signs. The
application may change its internal sign and MLB architecture, but these routes are compatibility
adapters and must remain backward compatible until the sign clients are versioned and migrated
independently.

## Shared behavior

- Base path: `/api/external/sign`
- Authentication: `X-Api-Key` request header must exactly match `EXTERNAL_API_KEY`.
- Sign identity: `X-Sign-Id` request header contains the sign UUID.
- Content type: successful and error responses are JSON with `application/json`.
- Explicit caching: none. The application currently emits no `Cache-Control` header from either
  handler. Sign clients control their polling interval.
- CORS: the deployed Next.js configuration currently adds the shared API CORS headers documented
  in `next.config.ts`.
- Known consumers: two physical digital signs. Their source and deployment cadence are outside
  this repository.

Shared error responses:

| Condition                            | Status | Body                                       |
| ------------------------------------ | -----: | ------------------------------------------ |
| `EXTERNAL_API_KEY` missing on server |    500 | `{"error":"API not configured"}`           |
| Missing or incorrect `X-Api-Key`     |    401 | `{"error":"Unauthorized"}`                 |
| Missing `X-Sign-Id`                  |    400 | `{"error":"X-Sign-Id header is required"}` |
| Unknown sign                         |    404 | `{"error":"Sign not found"}`               |
| Unhandled server failure             |    500 | `{"error":"Internal server error"}`        |

## `GET /api/external/sign/config`

Parameters: request headers only. No query parameters are used.

Success status: `200`.

Response schema:

```json
{
	"config": {
		"content": {
			"lastGameTeamIds": ["string"],
			"nextGameTeamIds": ["string"],
			"openerCountdownTeamIds": ["string"],
			"standingsDivisions": ["AL_East"]
		},
		"display": {
			"brightness": 35,
			"rotationIntervalSeconds": 10
		},
		"schedule": {
			"enabled": true,
			"offTime": "21:00",
			"onTime": "09:00",
			"timezone": "America/Denver"
		}
	},
	"payloadVersion": 3
}
```

Field behavior:

- `brightness` is a number from 0 through 100.
- `rotationIntervalSeconds` is a number.
- `onTime` and `offTime` are `HH:mm` strings.
- `timezone` is an IANA time-zone string.
- Team ID and division arrays preserve stored ordering.
- `payloadVersion` is the numeric `SIGN_PAYLOAD_VERSION` constant. It is not an HTTP API version;
  installed signs use it to decide whether their renderer must restart or be upgraded.

Compatibility tests:
`app/api/external/sign/config/route.test.ts`.

## `GET /api/external/sign/slides`

Optional query parameter:

- `date`: strict `YYYY-MM-DD` text. It is passed to the slide builder as supplied. Other formats
  return `400` with `{"error":"Date must be in YYYY-MM-DD format"}`.

Success status: `200`, including when no slides are available.

Base response schema:

```json
{
	"generatedAt": "2026-07-24T12:00:00.000Z",
	"slides": []
}
```

`generatedAt` is a UTC ISO-8601 timestamp. Slides are ordered as:

1. selected division standings;
2. selected opening-day countdowns;
3. configured teams in configuration order, with last game then next game for each team.

Shared games are de-duplicated by MLB game ID.

Supported `slideType` values and fields:

- `standings`: `title`, then ordered `teams` containing `abbreviation`, optional `colors`,
  `gamesBack`, `losses`, `name`, `rank`, and `wins`.
- `openerCountdown`: `daysUntil`, ISO `gameDate`, `opponent`, `team`, and `venue`.
- `lastGame`: ISO `gameDate`, `awayTeam`, and `homeTeam`. Each team contains `abbreviation`,
  optional `colors`, `errors`, `hits`, `name`, and `runs`.
- `nextGame`: ISO `gameDate`, boolean `isHome`, `opponent`, `team`, and `venue`.

Missing populated team details use `"TBD"` for abbreviation and name. Missing numeric box-score
values use `0`.

When no slides are available, the base response gains one field:

- with `date`: `"message":"No data available for YYYY-MM-DD"`;
- without `date`: `"message":"No data available for current season"`.

Compatibility tests:
`app/api/external/sign/slides/route.test.ts`. Slide generation behavior is covered separately by
the server slide tests added alongside the compatibility layer.
