import { BaseDocument, Ref } from './mongo';
import { Sport } from './sport';
import { Team } from './team';

/**
 * Roof type for a ballpark
 */
export type RoofType = 'dome' | 'open' | 'retractable';

/**
 * Geographic location
 */
export interface BallparkLocation {
	city: string;
	lat: number;
	lng: number;
	state: string;
}

/**
 * A ballpark / stadium
 * Maps to Game.venue.mlbId for weather lookups
 */
export interface Ballpark extends BaseDocument {
	elevation: number; // Feet above sea level
	fieldOrientation: number; // Compass degrees from home plate to center field (0=N, 90=E)
	location: BallparkLocation;
	mlbVenueId: number; // Maps to Game.venue.mlbId
	name: string;
	roofType: RoofType;
	sport: Sport;
	team: Ref<Team>;
}
