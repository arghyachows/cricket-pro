import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/mongodb/index';

export async function POST(request) {
  try {
    await initializeDatabase();

    const { leagueId = 'default' } = await request.json();

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

    // Check if there's an active season and archive it if all matches are complete
    const activeSeason = await db.collection('league_seasons').findOne({
      league_id: leagueId,
      status: 'active'
    });

    if (activeSeason) {
      // Check if all matches in the active season are completed
      const activeMatches = await db.collection('matches').find({
        league: leagueId,
        season: activeSeason.season,
        status: { $in: ['scheduled', 'in-progress', 'paused'] }
      }).toArray();

      if (activeMatches.length === 0) {
        // All matches completed, archive the season
        await db.collection('league_seasons').updateOne(
          { _id: activeSeason._id },
          { $set: { status: 'completed', completed_at: new Date() } }
        );
      } else {
        return NextResponse.json(
          { error: 'Cannot start new season while current season has pending matches' },
          { status: 400 }
        );
      }
    }

    // Get the next season number (incremental)
    const lastSeason = await db.collection('league_seasons').find({
      league_id: leagueId
    }).sort({ season: -1 }).limit(1).toArray();

    const nextSeasonNumber = lastSeason.length > 0 ? parseInt(lastSeason[0].season) + 1 : 1;
    const currentSeason = nextSeasonNumber.toString();

    // Create new season
    const newSeason = {
      league_id: leagueId,
      season: currentSeason,
      status: 'active',
      teams: teams.map(t => t.id),
      created_at: new Date(),
      started_at: new Date()
    };

    await db.collection('league_seasons').insertOne(newSeason);

    // Check if there are any scheduled matches for this season
    const existingScheduledMatches = await db.collection('matches').find({
      league: leagueId,
      season: currentSeason,
      status: 'scheduled'
    }).toArray();

    let matchesToCreate = [];

    if (existingScheduledMatches.length === 0) {
      // No scheduled matches, create ALL rounds for the full season
      const fixtures = generateRoundRobinFixtures(teams);

      // Schedule ALL rounds at once for complete season visibility
      let matchNumber = 1;

      for (const round of fixtures) {
        for (const fixture of round) {
          const matchId = `match_${leagueId}_${currentSeason}_${matchNumber}`;
          const match = {
            id: matchId,
            home_team_id: fixture.home.id,
            away_team_id: fixture.away.id,
            league: leagueId,
            season: currentSeason,
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

          matchesToCreate.push(match);
          matchNumber++;
        }
      }
    } else {
      // Check if current round is complete, if so, schedule next round
      const currentRound = Math.max(...existingScheduledMatches.map(m => m.round));
      const currentRoundMatches = await db.collection('matches').find({
        league: leagueId,
        season: currentSeason,
        round: currentRound
      }).toArray();

      const completedMatches = currentRoundMatches.filter(m => m.status === 'completed').length;
      const totalCurrentRoundMatches = currentRoundMatches.length;

      if (completedMatches === totalCurrentRoundMatches) {
        // Current round is complete, schedule next round
        const fixtures = generateRoundRobinFixtures(teams);
        const nextRoundIndex = currentRound; // fixtures is 0-indexed, round is 1-indexed

        if (nextRoundIndex < fixtures.length) {
          const nextRound = fixtures[nextRoundIndex];
          let matchNumber = existingScheduledMatches.length + 1;

          for (const fixture of nextRound) {
            const matchId = `match_${leagueId}_${currentSeason}_${matchNumber}`;
            const match = {
              id: matchId,
              home_team_id: fixture.home.id,
              away_team_id: fixture.away.id,
              league: leagueId,
              season: currentSeason,
              match_type: 'T20',
              scheduled_time: new Date(Date.now() + (matchNumber * 24 * 60 * 60 * 1000)),
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

            matchesToCreate.push(match);
            matchNumber++;
          }
        }
      }
    }

    if (matchesToCreate.length > 0) {
      // Insert new matches
      await db.collection('matches').insertMany(matchesToCreate);
    } else {
      return NextResponse.json(
        { error: 'No new matches to schedule at this time' },
        { status: 400 }
      );
    }

    await client.close();

    return NextResponse.json({
      message: `Scheduled ${matchesToCreate.length} matches for ${teams.length} teams`,
      totalMatches: matchesToCreate.length,
      season: currentSeason,
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

// Generate double round-robin fixtures (each team plays every other team twice)
function generateRoundRobinFixtures(teams) {
  const fixtures = [];
  const numTeams = teams.length;

  // If odd number of teams, add a bye
  const hasBye = numTeams % 2 !== 0;
  const effectiveTeams = hasBye ? [...teams, { id: 'bye', team_name: 'Bye' }] : teams;
  const numRounds = effectiveTeams.length - 1;

  // First half: Standard round-robin
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

  // Second half: Reverse fixtures (away becomes home)
  for (let round = 0; round < numRounds; round++) {
    const roundFixtures = [];

    for (let i = 0; i < effectiveTeams.length / 2; i++) {
      const home = effectiveTeams[i];
      const away = effectiveTeams[effectiveTeams.length - 1 - i];

      if (home.id !== 'bye' && away.id !== 'bye') {
        // Swap home and away for reverse fixtures
        roundFixtures.push({
          home: away,
          away: home,
          round: round + numRounds + 1
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
