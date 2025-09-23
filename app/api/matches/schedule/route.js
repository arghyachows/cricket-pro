import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/mongodb/index';

export async function POST(request) {
  try {
    await initializeDatabase();

    const { leagueId = 'default', season } = await request.json();
    const currentSeason = season || new Date().getFullYear().toString();

    // Get all users/teams
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'cricket-pro');

    const teams = await db.collection('users').find({}).toArray();

    if (teams.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 teams to schedule matches' },
        { status: 400 }
      );
    }

    // Clear existing scheduled matches for this league
    await db.collection('matches').deleteMany({
      league: leagueId,
      status: 'scheduled'
    });

    // Generate round-robin schedule
    const fixtures = generateRoundRobinFixtures(teams);

    // Create match documents
    const matches = [];
    let matchNumber = 1;

    for (const round of fixtures) {
      for (const fixture of round) {
        const matchId = `match_${leagueId}_${matchNumber}`;
        const match = {
          id: matchId,
          home_team_id: fixture.home.id,
          away_team_id: fixture.away.id,
          league: leagueId,
          match_type: 'T20',
          scheduled_time: new Date(Date.now() + (matchNumber * 24 * 60 * 60 * 1000)), // Space matches 1 day apart
          pitch_type: 'Normal',
          weather: 'Sunny',
          status: 'scheduled',
          home_score: 0,
          away_score: 0,
          home_wickets: 0,
          away_wickets: 0,
          home_overs: 0,
          away_overs: 0,
          result: null,
          win_margin: null,
          win_type: null,
          target: null,
          commentary: [],
          current_innings: null,
          current_over: 0,
          current_ball: 0,
          current_runs: 0,
          current_wickets: 0,
          live_commentary: [],
          match_data: null,
          created_at: new Date(),
          round: fixture.round,
          match_number: matchNumber
        };

        matches.push(match);
        matchNumber++;
      }
    }

    // Insert all matches
    await db.collection('matches').insertMany(matches);

    await client.close();

    return NextResponse.json({
      message: `Scheduled ${matches.length} matches for ${teams.length} teams`,
      totalMatches: matches.length,
      totalRounds: fixtures.length,
      teamsCount: teams.length
    });

  } catch (error) {
    console.error('Error scheduling matches:', error);
    return NextResponse.json(
      { error: 'Failed to schedule matches' },
      { status: 500 }
    );
  }
}

// Generate round-robin fixtures
function generateRoundRobinFixtures(teams) {
  const fixtures = [];
  const numTeams = teams.length;

  // If odd number of teams, add a bye
  const hasBye = numTeams % 2 !== 0;
  const effectiveTeams = hasBye ? [...teams, { id: 'bye', team_name: 'Bye' }] : teams;
  const numRounds = effectiveTeams.length - 1;

  for (let round = 0; round < numRounds; round++) {
    const roundFixtures = [];

    for (let i = 0; i < effectiveTeams.length / 2; i++) {
      const home = effectiveTeams[i];
      const away = effectiveTeams[effectiveTeams.length - 1 - i];

      if (home.id !== 'bye' && away.id !== 'bye') {
        roundFixtures.push({
          home,
          away,
          round: round + 1
        });
      }
    }

    fixtures.push(roundFixtures);

    // Rotate teams (keep first team fixed, rotate others)
    const first = effectiveTeams.shift();
    effectiveTeams.push(first);
  }

  return fixtures;
}
