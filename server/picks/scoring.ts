import { Season, SeasonStatus } from '@/types';

export const isSeasonFinalForScoring = (
	season: null | Season,
	asOfDate?: string,
	now = new Date(),
): boolean => {
	if (!season) {
		return false;
	}

	if (season.status === SeasonStatus.Completed) {
		return true;
	}

	const referenceDate = asOfDate ? new Date(`${asOfDate}T23:59:59.999Z`) : now;
	return referenceDate.getTime() > new Date(season.endDate).getTime();
};

export const selectWinsForScoring = (
	standing: {
		projectedWins?: number;
		pythagoreanWins?: number;
		wins?: number;
	},
	isFinal: boolean,
): number => {
	if (isFinal) {
		return standing.wins ?? 0;
	}

	return standing.pythagoreanWins ?? standing.projectedWins ?? 0;
};
