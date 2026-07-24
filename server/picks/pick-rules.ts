import { resolveRef, resolveRefId } from '@/lib/ref-utils';
import {
	Conference,
	PickDirection,
	PostseasonPicks,
	SavePicksInput,
	Team,
	TeamPick,
	WorldSeriesPicks,
} from '@/types';

const MAX_POSTSEASON_PICKS_PER_LEAGUE = 5;

type ValidationResult =
	| {
			error: string;
			value?: never;
	  }
	| {
			error?: never;
			value: SavePicksInput;
	  };

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const uniqueStrings = (value: unknown): value is string[] =>
	Array.isArray(value) &&
	value.every((entry) => typeof entry === 'string') &&
	new Set(value).size === value.length;

const validatePostseasonPicks = (
	value: unknown,
	teamsById: Map<string, Team>,
): { error?: string; value?: PostseasonPicks } => {
	if (!isRecord(value) || !uniqueStrings(value.al) || !uniqueStrings(value.nl)) {
		return { error: 'Postseason picks must contain unique AL and NL team IDs' };
	}

	if (
		value.al.length > MAX_POSTSEASON_PICKS_PER_LEAGUE ||
		value.nl.length > MAX_POSTSEASON_PICKS_PER_LEAGUE
	) {
		return { error: 'Select no more than 5 postseason teams from each league' };
	}

	if (value.al.some((teamId) => teamsById.get(teamId)?.conference !== Conference.AL)) {
		return { error: 'American League postseason picks contain an ineligible team' };
	}

	if (value.nl.some((teamId) => teamsById.get(teamId)?.conference !== Conference.NL)) {
		return { error: 'National League postseason picks contain an ineligible team' };
	}

	return {
		value: {
			al: value.al,
			nl: value.nl,
		},
	};
};

const validateWorldSeriesPicks = (
	value: unknown,
	teamsById: Map<string, Team>,
	postseasonPicks?: PostseasonPicks,
): { error?: string; value?: WorldSeriesPicks } => {
	if (
		!isRecord(value) ||
		typeof value.alChampion !== 'string' ||
		typeof value.nlChampion !== 'string' ||
		(value.winner !== undefined && !Object.values(Conference).includes(value.winner as Conference))
	) {
		return { error: 'World Series picks are invalid' };
	}

	const alChampion = value.alChampion;
	const nlChampion = value.nlChampion;

	if (alChampion && teamsById.get(alChampion)?.conference !== Conference.AL) {
		return { error: 'The AL champion must be an eligible American League team' };
	}

	if (nlChampion && teamsById.get(nlChampion)?.conference !== Conference.NL) {
		return { error: 'The NL champion must be an eligible National League team' };
	}

	if (postseasonPicks?.al.length && alChampion && !postseasonPicks.al.includes(alChampion)) {
		return { error: 'The AL champion must be one of the selected postseason teams' };
	}

	if (postseasonPicks?.nl.length && nlChampion && !postseasonPicks.nl.includes(nlChampion)) {
		return { error: 'The NL champion must be one of the selected postseason teams' };
	}

	if (value.winner !== undefined && (!alChampion || !nlChampion)) {
		return { error: 'Select both league champions before selecting a World Series winner' };
	}

	return {
		value: {
			alChampion,
			nlChampion,
			winner: value.winner as Conference | undefined,
		},
	};
};

export const validateSavePicksInput = (
	input: unknown,
	eligibleTeamPicks: TeamPick[],
): ValidationResult => {
	if (!isRecord(input) || !isRecord(input.teamPicks)) {
		return { error: 'Team picks are required' };
	}

	const eligibleTeamIds = new Set(
		eligibleTeamPicks.map((teamPick) => resolveRefId(teamPick.team)).filter(Boolean),
	);
	const teamsById = new Map<string, Team>();

	for (const teamPick of eligibleTeamPicks) {
		const team = resolveRef<Team>(teamPick.team);

		if (team) {
			teamsById.set(team.id, team);
		}
	}

	const teamPicks: SavePicksInput['teamPicks'] = {};

	for (const [teamId, pick] of Object.entries(input.teamPicks)) {
		if (!eligibleTeamIds.has(teamId)) {
			return { error: 'Team picks contain an ineligible team' };
		}

		if (pick !== null && pick !== PickDirection.Over && pick !== PickDirection.Under) {
			return { error: 'Each team pick must be over, under, or unselected' };
		}

		teamPicks[teamId] = pick;
	}

	let postseasonPicks: PostseasonPicks | undefined;

	if (input.postseasonPicks !== undefined) {
		const result = validatePostseasonPicks(input.postseasonPicks, teamsById);

		if (result.error) {
			return { error: result.error };
		}

		postseasonPicks = result.value;
	}

	let worldSeriesPicks: undefined | WorldSeriesPicks;

	if (input.worldSeriesPicks !== undefined) {
		const result = validateWorldSeriesPicks(input.worldSeriesPicks, teamsById, postseasonPicks);

		if (result.error) {
			return { error: result.error };
		}

		worldSeriesPicks = result.value;
	}

	return {
		value: {
			postseasonPicks,
			teamPicks,
			worldSeriesPicks,
		},
	};
};
