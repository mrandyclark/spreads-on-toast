// npx tsx --env-file=.env.local scripts/seed-2025-mlb.ts
//
// Seeds the 2025 MLB season with lines and creates a test league

import { dbConnect } from '@/lib/mongoose';
import { SeasonModel } from '@/models/season.model';
import { TeamLineModel } from '@/models/team-line.model';
import { TeamModel } from '@/models/team.model';
import { SeasonStatus, Sport } from '@/types';

const LINES_2025: Record<string, number> = {
  ARI: 86.5,
  ATL: 93.5,
  BAL: 86.5,
  BOS: 86.5,
  CHC: 85.5,
  CIN: 78.5,
  CLE: 82.5,
  COL: 58.5,
  CWS: 53.5,
  DET: 83.5,
  HOU: 87.5,
  KC: 83.5,
  LAA: 71.5,
  LAD: 104.5,
  MIA: 63.5,
  MIL: 83.5,
  MIN: 84.5,
  NYM: 90.5,
  NYY: 91.5,
  OAK: 71.5,
  PHI: 91.5,
  PIT: 77.5,
  SD: 88.5,
  SEA: 84.5,
  SF: 80.5,
  STL: 77.5,
  TB: 81.5,
  TEX: 85.5,
  TOR: 78.5,
  WSH: 72.5,
};

async function seed() {
  await dbConnect();

  console.log('Seeding 2025 MLB data...');

  // 1. Create the 2025 MLB Season (locked/completed)
  const existingSeason = await SeasonModel.findOne({ season: '2025', sport: Sport.MLB });

  if (existingSeason) {
    console.log('2025 MLB Season already exists, skipping...');
  } else {
    await SeasonModel.create({
      endDate: new Date('2025-09-28'),
      lockDate: new Date('2025-03-27'), // Opening Day
      name: '2025 MLB Season',
      season: '2025',
      sport: Sport.MLB,
      startDate: new Date('2025-03-27'),
      status: SeasonStatus.Completed,
    });
    console.log('Created 2025 MLB Season (Completed)');
  }

  // 2. Get all teams
  const teams = await TeamModel.find({ sport: Sport.MLB });
  const teamsByAbbr = new Map(teams.map((t) => [t.abbreviation, t]));

  // 3. Create team lines for 2025
  for (const [abbr, line] of Object.entries(LINES_2025)) {
    const team = teamsByAbbr.get(abbr);

    if (!team) {
      console.error(`No team found for ${abbr}`);
      continue;
    }

    const existing = await TeamLineModel.findOne({
      season: '2025',
      sport: Sport.MLB,
      team: team._id,
    });

    if (existing) {
      console.log(`Team line for ${abbr} 2025 already exists`);
    } else {
      await TeamLineModel.create({
        line,
        season: '2025',
        sport: Sport.MLB,
        team: team._id,
      });
      console.log(`Created team line for ${abbr}: ${line}`);
    }
  }

  console.log('\nDone seeding 2025 season and lines!');
  console.log('\nNext: Share your 2025 picks and I\'ll create the league + sheet.');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
