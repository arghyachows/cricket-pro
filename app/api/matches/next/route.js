import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/mongodb/index';

export async function GET(request) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const leagueId = searchParams.get('leagueId') || 'default';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'cricket-pro');

    // Get current active season
    const activeSeason = await db.collection('league_seasons').findOne({
      league_id: leagueId,
      status: 'active'
    });

    if (!activeSeason) {
      await client.close();
      return NextResponse.json({
        status: 'no_active_season',
        message: 'No active season found'
      });
    }

    // Get current match (in progress or live) for the active season
    const currentMatch = await db.collection('matches').findOne({
      league: leagueId,
      season: activeSeason.season,
      status: { $in: ['in-progress', 'live'] }
    });

    if (currentMatch) {
      // There's a match currently in progress
      const isUserInvolved = currentMatch.home_team_id === userId || currentMatch.away_team_id === userId;

      const homeTeam = await db.collection('users').findOne({ id: currentMatch.home_team_id });
      const awayTeam = await db.collection('users').findOne({ id: currentMatch.away_team_id });

      return NextResponse.json({
        status: 'match_in_progress',
        match: {
          ...currentMatch,
          home_team_name: homeTeam?.team_name || 'Unknown',
          away_team_name: awayTeam?.team_name || 'Unknown'
        },
        userInvolved: isUserInvolved,
        canPlay: isUserInvolved,
        canSimulate: !isUserInvolved
      });
    }

    // No match in progress, get next scheduled match for the active season (by match number for sequential play)
    const nextMatch = await db.collection('matches').findOne(
      {
        league: leagueId,
        season: activeSeason.season,
        status: 'scheduled'
      },
      { sort: { match_number: 1 } }
    );

    if (nextMatch) {
      const isUserInvolved = nextMatch.home_team_id === userId || nextMatch.away_team_id === userId;

      const homeTeam = await db.collection('users').findOne({ id: nextMatch.home_team_id });
      const awayTeam = await db.collection('users').findOne({ id: nextMatch.away_team_id });

      // Check if previous matches are completed in the current season
      const previousMatches = await db.collection('matches').countDocuments({
        league: leagueId,
        season: activeSeason.season,
        match_number: { $lt: nextMatch.match_number },
        status: { $ne: 'completed' }
      });

      const canProceed = previousMatches === 0;

      return NextResponse.json({
        status: 'next_match_available',
        match: {
          ...nextMatch,
          home_team_name: homeTeam?.team_name || 'Unknown',
          away_team_name: awayTeam?.team_name || 'Unknown'
        },
        userInvolved: isUserInvolved,
        canPlay: isUserInvolved && canProceed,
        canSimulate: !isUserInvolved && canProceed,
        canProceed,
        previousMatchesPending: previousMatches
      });
    }

    // No more matches in the current season
    const totalMatches = await db.collection('matches').countDocuments({
      league: leagueId,
      season: activeSeason.season
    });

    const completedMatches = await db.collection('matches').countDocuments({
      league: leagueId,
      season: activeSeason.season,
      status: 'completed'
    });

    await client.close();

    return NextResponse.json({
      status: 'league_complete',
      totalMatches,
      completedMatches,
      canProceed: false
    });

  } catch (error) {
    console.error('Error getting next match:', error);
    return NextResponse.json(
      { error: 'Failed to get next match' },
      { status: 500 }
    );
  }
}
