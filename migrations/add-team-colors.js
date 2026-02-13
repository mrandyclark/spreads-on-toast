/**
 * Studio 3T Migration: Add colors (primary, secondary) to all MLB teams
 *
 * Run this in Studio 3T's IntelliShell against your database.
 * Each update matches by abbreviation (unique field) for reliability.
 */

const teamColors = [
	{ abbreviation: 'ARI', colors: { primary: '#A71930', secondary: '#E3D4AD' } },
	{ abbreviation: 'ATL', colors: { primary: '#CE1141', secondary: '#13274F' } },
	{ abbreviation: 'BAL', colors: { primary: '#DF4601', secondary: '#000000' } },
	{ abbreviation: 'BOS', colors: { primary: '#BD3039', secondary: '#0C2340' } },
	{ abbreviation: 'CHC', colors: { primary: '#0E3386', secondary: '#CC3433' } },
	{ abbreviation: 'CWS', colors: { primary: '#000000', secondary: '#C4CED4' } },
	{ abbreviation: 'CIN', colors: { primary: '#C6011F', secondary: '#000000' } },
	{ abbreviation: 'CLE', colors: { primary: '#0C2340', secondary: '#E31937' } },
	{ abbreviation: 'COL', colors: { primary: '#333366', secondary: '#C4CED4' } },
	{ abbreviation: 'DET', colors: { primary: '#0C2340', secondary: '#FA4616' } },
	{ abbreviation: 'HOU', colors: { primary: '#EB6E1F', secondary: '#002D62' } },
	{ abbreviation: 'KC',  colors: { primary: '#004687', secondary: '#BD9B60' } },
	{ abbreviation: 'LAA', colors: { primary: '#BA0021', secondary: '#003263' } },
	{ abbreviation: 'LAD', colors: { primary: '#005A9C', secondary: '#FFFFFF' } },
	{ abbreviation: 'MIA', colors: { primary: '#00A3E0', secondary: '#EF3340' } },
	{ abbreviation: 'MIL', colors: { primary: '#12284B', secondary: '#FFC52F' } },
	{ abbreviation: 'MIN', colors: { primary: '#002B5C', secondary: '#D31145' } },
	{ abbreviation: 'NYM', colors: { primary: '#002D72', secondary: '#FF5910' } },
	{ abbreviation: 'NYY', colors: { primary: '#0C2340', secondary: '#FFFFFF' } },
	{ abbreviation: 'OAK', colors: { primary: '#003831', secondary: '#EFB21E' } },
	{ abbreviation: 'PHI', colors: { primary: '#E81828', secondary: '#002D72' } },
	{ abbreviation: 'PIT', colors: { primary: '#FDB827', secondary: '#000000' } },
	{ abbreviation: 'SD',  colors: { primary: '#2F241D', secondary: '#FFC425' } },
	{ abbreviation: 'SF',  colors: { primary: '#FD5A1E', secondary: '#27251F' } },
	{ abbreviation: 'SEA', colors: { primary: '#0C2C56', secondary: '#005C5C' } },
	{ abbreviation: 'STL', colors: { primary: '#C41E3A', secondary: '#0C2340' } },
	{ abbreviation: 'TB',  colors: { primary: '#092C5C', secondary: '#8FBCE6' } },
	{ abbreviation: 'TEX', colors: { primary: '#003278', secondary: '#C0111F' } },
	{ abbreviation: 'TOR', colors: { primary: '#134A8E', secondary: '#E8291C' } },
	{ abbreviation: 'WSH', colors: { primary: '#AB0003', secondary: '#14225A' } },
];

let updated = 0;

teamColors.forEach(function (team) {
	const result = db.teams.updateOne(
		{ abbreviation: team.abbreviation },
		{ $set: { colors: team.colors } }
	);

	if (result.modifiedCount > 0) {
		updated++;
		print('✓ Updated ' + team.abbreviation);
	} else {
		print('✗ No match for ' + team.abbreviation);
	}
});

print('\nDone! Updated ' + updated + ' of ' + teamColors.length + ' teams.');
