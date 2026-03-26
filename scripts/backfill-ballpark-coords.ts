/**
 * Backfill GPS coords, addresses, and field orientation on ballpark documents.
 * Bearing from home plate → pitcher's mound = direction to center field.
 * Usage: npx tsx --env-file=.env.local scripts/backfill-ballpark-coords.ts
 */
import { dbConnect } from '@/lib/mongoose';
import { BallparkModel } from '@/models/ballpark.model';

interface Coord {
	lat: number;
	lng: number;
}

interface ParkData {
	homePlate?: Coord;
	lat: number;
	lng: number;
	pitchersMound?: Coord;
	postalCode: string;
	street: string;
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const toRad = (d: number) => d * Math.PI / 180;
	const toDeg = (r: number) => r * 180 / Math.PI;

	const φ1 = toRad(lat1);
	const φ2 = toRad(lat2);
	const Δλ = toRad(lon2 - lon1);

	const y = Math.sin(Δλ) * Math.cos(φ2);
	const x =
		Math.cos(φ1) * Math.sin(φ2) -
		Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

	const θ = toDeg(Math.atan2(y, x));
	return Math.round((θ + 360) % 360);
}

 
const PARK_DATA: Record<number, ParkData> = {
	// Angel Stadium of Anaheim
	1: {
		homePlate: { lat: 33.799954053230046, lng: -117.88312173718604 },
		lat: 33.799954053230046,
		lng: -117.88312173718604,
		pitchersMound: { lat: 33.800137426401484, lng: -117.88286479278322 },
		postalCode: '92806',
		street: '2000 E Gene Autry Way',
	},
	// Oriole Park at Camden Yards
	2: {
		homePlate: { lat: 39.28351159199526, lng: -76.62190820186834 },
		lat: 39.28351159199526,
		lng: -76.62190820186834,
		pitchersMound: { lat: 39.28364716086538, lng: -76.62180083104346 },
		postalCode: '21201',
		street: '333 W Camden St',
	},
	// Fenway Park
	3: {
		homePlate: { lat: 42.34624419744354, lng: -71.09776898679303 },
		lat: 42.34624419744354,
		lng: -71.09776898679303,
		pitchersMound: { lat: 42.34635871895549, lng: -71.09761806149834 },
		postalCode: '02215',
		street: '4 Jersey St',
	},
	// Rate Field (White Sox)
	4: {
		homePlate: { lat: 41.83018317142195, lng: -87.63423694149309 },
		lat: 41.83018317142195,
		lng: -87.63423694149309,
		pitchersMound: { lat: 41.83008673984811, lng: -87.63406796233822 },
		postalCode: '60616',
		street: '333 W 35th St',
	},
	// Progressive Field
	5: {
		homePlate: { lat: 41.495544493195105, lng: -81.68529149829965 },
		lat: 41.495544493195105,
		lng: -81.68529149829965,
		pitchersMound: { lat: 41.49570360496499, lng: -81.68529982890603 },
		postalCode: '44115',
		street: '2401 Ontario St',
	},
	// Kauffman Stadium
	7: {
		homePlate: { lat: 39.05124542913385, lng: -94.48081705835034 },
		lat: 39.05124542913385,
		lng: -94.48081705835034,
		pitchersMound: { lat: 39.05135846825753, lng: -94.48066025702462 },
		postalCode: '64129',
		street: '1 Royal Way',
	},
	// Tropicana Field (dome)
	12: {
		lat: 27.768116658304397,
		lng: -82.6532992831155,
		postalCode: '33705',
		street: '1 Tropicana Dr',
	},
	// Rogers Centre (dome)
	14: {
		lat: 43.641544461181425,
		lng: -79.3892388835376,
		postalCode: 'M5V 1J4',
		street: '1 Blue Jays Way',
	},
	// Chase Field (retractable)
	15: {
		lat: 33.445381223780096,
		lng: -112.06694330010484,
		postalCode: '85004',
		street: '401 E Jefferson St',
	},
	// Wrigley Field
	17: {
		homePlate: { lat: 41.94792062256397, lng: -87.65582854543123 },
		lat: 41.94792062256397,
		lng: -87.65582854543123,
		pitchersMound: { lat: 41.9480448049827, lng: -87.65569376443867 },
		postalCode: '60613',
		street: '1060 W Addison St',
	},
	// Coors Field
	19: {
		homePlate: { lat: 39.7557105285858, lng: -104.99419509818014 },
		lat: 39.7557105285858,
		lng: -104.99419509818014,
		pitchersMound: { lat: 39.755872239604955, lng: -104.99417934522046 },
		postalCode: '80205',
		street: '2001 Blake St',
	},
	// Dodger Stadium
	22: {
		homePlate: { lat: 34.07341112759034, lng: -118.24022272415473 },
		lat: 34.07341112759034,
		lng: -118.24022272415473,
		pitchersMound: { lat: 34.073554292771455, lng: -118.24013721479886 },
		postalCode: '90012',
		street: '1000 Vin Scully Ave',
	},
	// PNC Park
	31: {
		homePlate: { lat: 40.44706130063233, lng: -80.00618504408408 },
		lat: 40.44706130063233,
		lng: -80.00618504408408,
		pitchersMound: { lat: 40.44699164474107, lng: -80.00599480253136 },
		postalCode: '15212',
		street: '115 Federal St',
	},
	// American Family Field (retractable)
	32: {
		homePlate: { lat: 43.02841842401274, lng: -87.97164298142515 },
		lat: 43.02841842401274,
		lng: -87.97164298142515,
		pitchersMound: { lat: 43.028315196262184, lng: -87.971467879361 },
		postalCode: '53214',
		street: '1 Brewers Way',
	},
	// T-Mobile Park
	680: {
		homePlate: { lat: 47.59111024766099, lng: -122.33291041890989 },
		lat: 47.59111024766099,
		lng: -122.33291041890989,
		pitchersMound: { lat: 47.591218358619265, lng: -122.33272999419015 },
		postalCode: '98134',
		street: '1250 1st Ave S',
	},
	// Minute Maid Park / Daikin Park (retractable)
	2392: {
		lat: 29.756891866369738,
		lng: -95.35543462004576,
		postalCode: '77002',
		street: '501 Crawford St',
	},
	// Comerica Park
	2394: {
		homePlate: { lat: 42.339445077237926, lng: -83.04896781875854 },
		lat: 42.339445077237926,
		lng: -83.04896781875854,
		pitchersMound: { lat: 42.33931219078289, lng: -83.04887122145229 },
		postalCode: '48201',
		street: '2100 Woodward Ave',
	},
	// Oracle Park
	2395: {
		homePlate: { lat: 37.77836350387399, lng: -122.38990493318728 },
		lat: 37.77836350387399,
		lng: -122.38990493318728,
		pitchersMound: { lat: 37.778374293063024, lng: -122.389713825841 },
		postalCode: '94107',
		street: '24 Willie Mays Plaza',
	},
	// Sutter Health Park
	2529: {
		homePlate: { lat: 38.58020210891347, lng: -121.51405958704731 },
		lat: 38.58020210891347,
		lng: -121.51405958704731,
		pitchersMound: { lat: 38.58031436367583, lng: -121.51391330612259 },
		postalCode: '95691',
		street: '400 Ballpark Dr',
	},
	// Great American Ball Park
	2602: {
		homePlate: { lat: 39.09747267492461, lng: -84.50704051962293 },
		lat: 39.09747267492461,
		lng: -84.50704051962293,
		pitchersMound: { lat: 39.097380182799945, lng: -84.50686776416592 },
		postalCode: '45202',
		street: '100 Joe Nuxhall Wy',
	},
	// Petco Park
	2680: {
		homePlate: { lat: 32.707047142380915, lng: -117.15706532146554 },
		lat: 32.707047142380915,
		lng: -117.15706532146554,
		pitchersMound: { lat: 32.707207887184, lng: -117.157068050424 },
		postalCode: '92101',
		street: '100 Park Blvd',
	},
	// Citizens Bank Park
	2681: {
		homePlate: { lat: 39.90557253661673, lng: -75.16660715807734 },
		lat: 39.90557253661673,
		lng: -75.16660715807734,
		pitchersMound: { lat: 39.90573482029196, lng: -75.1665662628298 },
		postalCode: '19148',
		street: '1 Citizens Bank Way',
	},
	// Busch Stadium
	2889: {
		homePlate: { lat: 38.622405106725914, lng: -90.1933809302625 },
		lat: 38.622405106725914,
		lng: -90.1933809302625,
		pitchersMound: { lat: 38.62248211157056, lng: -90.19320757138264 },
		postalCode: '63102',
		street: '700 Clark Ave',
	},
	// Citi Field
	3289: {
		homePlate: { lat: 40.75658320908351, lng: -73.84603256752281 },
		lat: 40.75658320908351,
		lng: -73.84603256752281,
		pitchersMound: { lat: 40.75673921690272, lng: -73.84598184753966 },
		postalCode: '11368',
		street: '41 Seaver Wy',
	},
	// Nationals Park
	3309: {
		homePlate: { lat: 38.87256756869455, lng: -77.0077363368482 },
		lat: 38.87256756869455,
		lng: -77.0077363368482,
		pitchersMound: { lat: 38.87270705889519, lng: -77.00763433843369 },
		postalCode: '20003',
		street: '1500 South Capitol St SE',
	},
	// Target Field
	3312: {
		homePlate: { lat: 44.98171169502231, lng: -93.27829366958568 },
		lat: 44.98171169502231,
		lng: -93.27829366958568,
		pitchersMound: { lat: 44.98171074625545, lng: -93.27807100867233 },
		postalCode: '55403',
		street: '1 Twins Way',
	},
	// Yankee Stadium
	3313: {
		homePlate: { lat: 40.82948706020753, lng: -73.92695143306591 },
		lat: 40.82948706020753,
		lng: -73.92695143306591,
		pitchersMound: { lat: 40.82952714314984, lng: -73.92675093795755 },
		postalCode: '10451',
		street: '1 E 161st St',
	},
	// loanDepot Park (dome)
	4169: {
		lat: 25.778277363781825,
		lng: -80.21958779054891,
		postalCode: '33125',
		street: '501 Marlins Way',
	},
	// Truist Park
	4705: {
		homePlate: { lat: 33.89112410017643, lng: -84.46788803176642 },
		lat: 33.89112410017643,
		lng: -84.46788803176642,
		pitchersMound: { lat: 33.89097371270659, lng: -84.46781086761246 },
		postalCode: '30339',
		street: '755 Battery Ave SE',
	},
	// Globe Life Field (dome)
	5325: {
		lat: 32.747311547800166,
		lng: -97.08412555155466,
		postalCode: '76011',
		street: '734 Stadium Dr',
	},
};

const METERS_TO_FEET = 3.28084;

async function fetchElevation(lat: number, lng: number): Promise<number> {
	const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat.toFixed(6)},${lng.toFixed(6)}`;
	const res = await fetch(url);
	const json = await res.json() as { results: { elevation: number }[] };
	const meters = json.results[0].elevation;
	return Math.round(meters * METERS_TO_FEET);
}

async function main() {
	await dbConnect();

	const ballparks = await BallparkModel.find({});

	console.log(`Found ${ballparks.length} ballparks\n`);

	let updated = 0;

	for (const bp of ballparks) {
		const data = PARK_DATA[bp.mlbVenueId];

		if (!data) {
			console.log(`  ✗ ${bp.name} (venue ${bp.mlbVenueId}) — no data`);
			continue;
		}

		// Calculate field orientation from home plate → pitcher's mound bearing
		let fieldOrientation = bp.fieldOrientation;

		if (data.homePlate && data.pitchersMound) {
			fieldOrientation = getBearing(
				data.homePlate.lat,
				data.homePlate.lng,
				data.pitchersMound.lat,
				data.pitchersMound.lng,
			);
		}

		// Fetch elevation from open-elevation API
		const elevation = await fetchElevation(data.lat, data.lng);

		await BallparkModel.updateOne(
			{ _id: bp._id },
			{
				$set: {
					elevation,
					fieldOrientation,
					homePlate: data.homePlate ?? undefined,
					'location.lat': data.lat,
					'location.lng': data.lng,
					'location.postalCode': data.postalCode,
					'location.street': data.street,
					pitchersMound: data.pitchersMound ?? undefined,
				},
			},
		);

		const hasBearing = data.homePlate && data.pitchersMound;
		console.log(`  ✓ ${bp.name} → ${data.street}, ${bp.location.city} (${elevation} ft)${hasBearing ? ` [orientation: ${fieldOrientation}°]` : ' [dome]'}`);
		updated++;
	}

	console.log(`\nUpdated ${updated}/${ballparks.length} ballparks`);
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
