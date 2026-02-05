// npx tsx --env-file=.env.local scripts/seed-2026-mlb.ts

import { dbConnect } from '@/lib/mongoose';
import { SeasonModel } from '@/models/season.model';
import { TeamLineModel } from '@/models/team-line.model';
import { TeamModel } from '@/models/team.model';
import { Conference, Division, SeasonStatus, Sport } from '@/types';

const MLB_TEAMS = [
  { abbreviation: 'LAD', city: 'Los Angeles', conference: Conference.NL, division: Division.NL_West, name: 'Dodgers' },
  { abbreviation: 'NYY', city: 'New York', conference: Conference.AL, division: Division.AL_East, name: 'Yankees' },
  { abbreviation: 'PHI', city: 'Philadelphia', conference: Conference.NL, division: Division.NL_East, name: 'Phillies' },
  { abbreviation: 'SEA', city: 'Seattle', conference: Conference.AL, division: Division.AL_West, name: 'Mariners' },
  { abbreviation: 'NYM', city: 'New York', conference: Conference.NL, division: Division.NL_East, name: 'Mets' },
  { abbreviation: 'CHC', city: 'Chicago', conference: Conference.NL, division: Division.NL_Central, name: 'Cubs' },
  { abbreviation: 'ATL', city: 'Atlanta', conference: Conference.NL, division: Division.NL_East, name: 'Braves' },
  { abbreviation: 'TOR', city: 'Toronto', conference: Conference.AL, division: Division.AL_East, name: 'Blue Jays' },
  { abbreviation: 'BOS', city: 'Boston', conference: Conference.AL, division: Division.AL_East, name: 'Red Sox' },
  { abbreviation: 'HOU', city: 'Houston', conference: Conference.AL, division: Division.AL_West, name: 'Astros' },
  { abbreviation: 'SD', city: 'San Diego', conference: Conference.NL, division: Division.NL_West, name: 'Padres' },
  { abbreviation: 'DET', city: 'Detroit', conference: Conference.AL, division: Division.AL_Central, name: 'Tigers' },
  { abbreviation: 'BAL', city: 'Baltimore', conference: Conference.AL, division: Division.AL_East, name: 'Orioles' },
  { abbreviation: 'MIL', city: 'Milwaukee', conference: Conference.NL, division: Division.NL_Central, name: 'Brewers' },
  { abbreviation: 'TEX', city: 'Texas', conference: Conference.AL, division: Division.AL_West, name: 'Rangers' },
  { abbreviation: 'CIN', city: 'Cincinnati', conference: Conference.NL, division: Division.NL_Central, name: 'Reds' },
  { abbreviation: 'KC', city: 'Kansas City', conference: Conference.AL, division: Division.AL_Central, name: 'Royals' },
  { abbreviation: 'SF', city: 'San Francisco', conference: Conference.NL, division: Division.NL_West, name: 'Giants' },
  { abbreviation: 'CLE', city: 'Cleveland', conference: Conference.AL, division: Division.AL_Central, name: 'Guardians' },
  { abbreviation: 'ARI', city: 'Arizona', conference: Conference.NL, division: Division.NL_West, name: 'Diamondbacks' },
  { abbreviation: 'TB', city: 'Tampa Bay', conference: Conference.AL, division: Division.AL_East, name: 'Rays' },
  { abbreviation: 'PIT', city: 'Pittsburgh', conference: Conference.NL, division: Division.NL_Central, name: 'Pirates' },
  { abbreviation: 'OAK', city: 'Oakland', conference: Conference.AL, division: Division.AL_West, name: 'Athletics' },
  { abbreviation: 'MIN', city: 'Minnesota', conference: Conference.AL, division: Division.AL_Central, name: 'Twins' },
  { abbreviation: 'MIA', city: 'Miami', conference: Conference.NL, division: Division.NL_East, name: 'Marlins' },
  { abbreviation: 'LAA', city: 'Los Angeles', conference: Conference.AL, division: Division.AL_West, name: 'Angels' },
  { abbreviation: 'STL', city: 'St. Louis', conference: Conference.NL, division: Division.NL_Central, name: 'Cardinals' },
  { abbreviation: 'CWS', city: 'Chicago', conference: Conference.AL, division: Division.AL_Central, name: 'White Sox' },
  { abbreviation: 'WSH', city: 'Washington', conference: Conference.NL, division: Division.NL_East, name: 'Nationals' },
  { abbreviation: 'COL', city: 'Colorado', conference: Conference.NL, division: Division.NL_West, name: 'Rockies' },
];

const DRAFTKINGS_LINES_2026: Record<string, number> = {
  ARI: 79.5,
  ATL: 88.5,
  BAL: 84.5,
  BOS: 87.5,
  CHC: 88.5,
  CIN: 82.5,
  CLE: 80.5,
  COL: 52.5,
  CWS: 66.5,
  DET: 85.5,
  HOU: 86.5,
  KC: 81.5,
  LAA: 70.5,
  LAD: 102.5,
  MIA: 72.5,
  MIL: 84.5,
  MIN: 73.5,
  NYM: 89.5,
  NYY: 91.5,
  OAK: 75.5,
  PHI: 90.5,
  PIT: 76.5,
  SD: 85.5,
  SEA: 89.5,
  SF: 80.5,
  STL: 69.5,
  TB: 77.5,
  TEX: 83.5,
  TOR: 88.5,
  WSH: 65.5,
};

async function seed() {
  await dbConnect();

  console.log('Seeding 2026 MLB data...');

  // 1. Create or update the 2026 MLB Season
  const existingSeason = await SeasonModel.findOne({ season: '2026', sport: Sport.MLB });

  if (existingSeason) {
    console.log('2026 MLB Season already exists, skipping...');
  } else {
    await SeasonModel.create({
      endDate: new Date('2026-10-01'),
      lockDate: new Date('2026-03-26'),
      name: '2026 MLB Season',
      season: '2026',
      sport: Sport.MLB,
      startDate: new Date('2026-03-26'),
      status: SeasonStatus.Upcoming,
    });
    console.log('Created 2026 MLB Season');
  }

  // 2. Create teams (upsert by abbreviation)
  const teamIds: Record<string, string> = {};

  for (const team of MLB_TEAMS) {
    const existing = await TeamModel.findOne({ abbreviation: team.abbreviation });

    if (existing) {
      teamIds[team.abbreviation] = existing._id.toString();
      console.log(`Team ${team.abbreviation} already exists`);
    } else {
      const created = await TeamModel.create({ ...team, sport: Sport.MLB });
      teamIds[team.abbreviation] = created._id.toString();
      console.log(`Created team ${team.abbreviation}`);
    }
  }

  // 3. Create team lines for 2026
  for (const [abbr, line] of Object.entries(DRAFTKINGS_LINES_2026)) {
    const teamId = teamIds[abbr];

    if (!teamId) {
      console.error(`No team found for ${abbr}`);
      continue;
    }

    const existing = await TeamLineModel.findOne({
      season: '2026',
      sport: Sport.MLB,
      team: teamId,
    });

    if (existing) {
      console.log(`Team line for ${abbr} 2026 already exists`);
    } else {
      await TeamLineModel.create({
        line,
        season: '2026',
        sport: Sport.MLB,
        team: teamId,
      });
      console.log(`Created team line for ${abbr}: ${line}`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
