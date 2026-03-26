import { BaseDocument, Ref } from './mongo';
import { Sport } from './sport';
import { Team } from './team';

/**
 * GPS coordinate pair
 */
export interface GpsCoord {
	lat: number;
	lng: number;
}

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
	postalCode: string;
	state: string;
	street: string;
}

/**
 * A ballpark / stadium
 * Maps to Game.venue.mlbId for venue data lookups
 */
export interface Ballpark extends BaseDocument {
	elevation: number; // Feet above sea level
	fieldOrientation: number; // Compass degrees from home plate to center field (0=N, 90=E)
	homePlate?: GpsCoord; // GPS coords of home plate
	location: BallparkLocation;
	mlbVenueId: number; // Maps to Game.venue.mlbId
	name: string;
	pitchersMound?: GpsCoord; // GPS coords of pitcher's mound
	roofType: RoofType;
	sport: Sport;
	team: Ref<Team>;
	timezone?: string; // IANA timezone e.g. 'America/New_York'
}
