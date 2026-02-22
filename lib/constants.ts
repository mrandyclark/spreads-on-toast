import { Division } from '@/types';

/**
 * Full division labels: "AL East", "NL Central", etc.
 */
export const DIVISION_LABELS: Record<string, string> = {
	AL_Central: 'AL Central',
	AL_East: 'AL East',
	AL_West: 'AL West',
	NL_Central: 'NL Central',
	NL_East: 'NL East',
	NL_West: 'NL West',
};

/**
 * Standard division display order (NL first, then AL)
 */
export const DIVISION_ORDER: Division[] = [
	Division.NL_East, Division.NL_Central, Division.NL_West,
	Division.AL_East, Division.AL_Central, Division.AL_West,
];

export const NL_DIVISIONS: Division[] = [Division.NL_East, Division.NL_Central, Division.NL_West];
export const AL_DIVISIONS: Division[] = [Division.AL_East, Division.AL_Central, Division.AL_West];

