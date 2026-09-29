// Pure export calculation. Missing data must never silently become zero wins.
export function buildLeagueExport(source) {
	const { group, lines, season, sheets, standings, teams, users } = source;
	const byId = (items) => new Map(items.map((item) => [item._id, item]));
	const teamMap = byId(teams);
	const userMap = byId(users);
	const standingMap = new Map(standings.map((standing) => [standing.team, standing]));
	const lineMap = new Map(lines.map((line) => [line.team, line.line]));
	const dates = new Set(standings.map((standing) => standing.date));

	if (dates.size !== 1 || standingMap.size !== standings.length) {
		throw new Error('Standings must contain one consistent snapshot with unique teams.');
	}

	const resultFor = (pick, line, wins) =>
		wins === line ? 'push' : wins > line === (pick === 'over') ? 'win' : 'loss';

	const teamName = (id) => {
		if (!id) {
			return null;
		}

		const team = teamMap.get(id);

		if (!team) {
			throw new Error(`Unknown team ${id}`);
		}
		return team.abbreviation;
	};

	const members = group.members
		.map((member) => {
			const user = userMap.get(member.user);
			const memberSheets = sheets.filter((sheet) => sheet.user === member.user);

			if (!user || memberSheets.length !== 1) {
				throw new Error(`Expected one user and one sheet for member ${member.user}`);
			}

			const sheet = memberSheets[0];
			const pickedTeams = new Set(sheet.teamPicks.map((pick) => pick.team));

			if (pickedTeams.size !== sheet.teamPicks.length || pickedTeams.size !== lineMap.size) {
				throw new Error(`Incomplete or duplicate team picks for ${member.user}`);
			}

			const picks = sheet.teamPicks
				.map((pick) => {
					const team = teamMap.get(pick.team);
					const standing = standingMap.get(pick.team);
					const line = pick.line ?? lineMap.get(pick.team);

					if (
						!team ||
						!standing ||
						!Number.isFinite(line) ||
						!['over', 'under'].includes(pick.pick) ||
						!Number.isInteger(standing.wins) ||
						standing.wins < 0 ||
						!Number.isInteger(standing.losses) ||
						standing.losses < 0 ||
						standing.wins + standing.losses !== standing.gamesPlayed
					) {
						throw new Error(
							`Missing or invalid pick, line, or standing: ${member.user}/${pick.team}`,
						);
					}

					const estimatedWins = standing.pythagoreanWins ?? standing.projectedWins;
					return {
						actualLosses: standing.losses,
						actualWins: standing.wins,
						estimatedResult: Number.isFinite(estimatedWins)
							? resultFor(pick.pick, line, estimatedWins)
							: null,
						estimatedWins: estimatedWins ?? null,
						gamesPlayed: standing.gamesPlayed,
						line,
						lineSource:
							pick.line === undefined ? 'season-line (legacy fallback)' : 'sheet snapshot',
						pick: pick.pick,
						result: resultFor(pick.pick, line, standing.wins),
						team: team.abbreviation,
						teamName: `${team.city} ${team.name}`,
					};
				})
				.sort((a, b) => a.team.localeCompare(b.team));
			const wins = picks.filter((pick) => pick.result === 'win').length;
			return {
				estimatedCorrect: picks.filter((pick) => pick.estimatedResult === 'win').length,
				losses: picks.filter((pick) => pick.result === 'loss').length,
				name: `${user.nameFirst ?? ''} ${user.nameLast ?? ''}`.trim() || 'Member',
				picks,
				postseason: {
					al: (sheet.postseasonPicks?.al ?? []).map(teamName),
					nl: (sheet.postseasonPicks?.nl ?? []).map(teamName),
				},
				pushes: picks.filter((pick) => pick.result === 'push').length,
				total: picks.length,
				userId: member.user,
				winPct: Math.round((wins / picks.length) * 100),
				wins,
				worldSeries: {
					alChampion: teamName(sheet.worldSeriesPicks?.alChampion),
					nlChampion: teamName(sheet.worldSeriesPicks?.nlChampion),
					winner: sheet.worldSeriesPicks?.winner ?? null,
				},
			};
		})
		.sort((a, b) => b.wins - a.wins || b.winPct - a.winPct || a.name.localeCompare(b.name));

	if (!members.length) {
		throw new Error('The league has no members.');
	}

	members.forEach((member, index) => {
		const previous = members[index - 1];
		member.rank =
			previous && previous.wins === member.wins && previous.winPct === member.winPct
				? previous.rank
				: index + 1;
	});
	const legacyLines = members
		.flatMap((member) => member.picks)
		.filter((pick) => pick.lineSource !== 'sheet snapshot').length;
	return {
		exportedAt: source.exportedAt,
		league: { id: group._id, name: group.name, season: group.season },
		members,
		scoringBasis:
			'Stored actual regular-season wins; no projections or postseason points included.',
		sourceFetchedAt: [...new Set(standings.map((standing) => standing.sourceFetchedAt ?? null))],
		standingsDate: [...dates][0],
		storedSeasonEndDate: season.endDate,
		storedSeasonStatus: season.status,
		warnings: legacyLines
			? [
					`${legacyLines} picks have no saved line snapshot; using configured season lines, matching the app's legacy fallback.`,
				]
			: [],
	};
}

export function renderLeagueReport(report) {
	const cell = (value) =>
		String(value ?? '')
			.replaceAll('|', '\\|')
			.replaceAll('\n', ' ');
	const table = (headers, rows) =>
		[headers, headers.map(() => '---'), ...rows]
			.map((row) => `| ${row.map(cell).join(' | ')} |`)
			.join('\n');
	const { members } = report;
	const recap = table(
		['Rank', 'Member', 'Correct', 'Incorrect', 'Push', 'Accuracy', 'Estimated correct'],
		members.map((m) => [
			m.rank,
			m.name,
			m.wins,
			m.losses,
			m.pushes,
			`${m.winPct}%`,
			m.estimatedCorrect,
		]),
	);
	const picks = table(
		['Team', 'Actual W–L', ...members.map((m) => m.name)],
		members[0].picks.map((pick) => [
			pick.team,
			`${pick.actualWins}–${pick.actualLosses}`,
			...members.map((m) => {
				const p = m.picks.find((entry) => entry.team === pick.team);

				if (!p) {
					throw new Error(`Missing team ${pick.team}`);
				}
				return `${p.pick.toUpperCase()} ${p.line}: ${p.result.toUpperCase()}`;
			}),
		]),
	);
	const changes = members
		.map(
			(m) =>
				`${m.name}: ${
					m.picks
						.filter((p) => p.estimatedResult && p.result !== p.estimatedResult)
						.map(
							(p) =>
								`${p.team} ${p.estimatedResult} → ${p.result} (${p.estimatedWins} estimated / ${p.actualWins} actual)`,
						)
						.join('; ') || 'no changes'
				}.`,
		)
		.join('\n\n');
	const postseason = table(
		[
			'Member',
			'AL playoff picks',
			'NL playoff picks',
			'AL champion',
			'NL champion',
			'WS winner side',
		],
		members.map((m) => [
			m.name,
			m.postseason.al.join(', '),
			m.postseason.nl.join(', '),
			m.worldSeries.alChampion,
			m.worldSeries.nlChampion,
			m.worldSeries.winner ?? 'Not picked',
		]),
	);
	return `# ${report.league.name} — actual-win results\n\nStandings snapshot: ${report.standingsDate}. Exported: ${report.exportedAt}.\n\n${report.scoringBasis}\n\n## Standings\n\n${recap}\n\nTies share rank; no postseason tiebreaker has been applied. Accuracy = correct / all picks, rounded to a whole percent, matching the app.\n\n## All team picks\n\n${picks}\n\n## Changes from the app's estimates\n\n${changes}\n\n## Saved postseason selections\n\n${postseason}\n\nThese selections are included for your recap and are not included in the over/under standings.\n\n## Data notes\n\nStored season status: ${report.storedSeasonStatus}. Configured end: ${report.storedSeasonEndDate}.\n\n${report.warnings.join('\n\n') || 'All picks use saved line snapshots.'}\n\nTeams finishing below 162 games retain their actual totals; wins are never extrapolated in this export.\n`;
}
