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

    // Get current match (in progress or live)
    const currentMatch = await db.collection('matches').findOne({
      league: leagueId,
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

    // No match in progress, get next scheduled match
    const nextMatch = await db.collection('matches').findOne(
      {
        league: leagueId,
        status: 'scheduled'
      },
      { sort: { scheduled_time: 1 } }
    );

    if (nextMatch) {
      const isUserInvolved = nextMatch.home_team_id === userId || nextMatch.away_team_id === userId;

      const homeTeam = await db.collection('users').findOne({ id: nextMatch.home_team_id });
      const awayTeam = await db.collection('users').findOne({ id: nextMatch.away_team_id });

      // Check if previous matches are completed
      const previousMatches = await db.collection('matches').countDocuments({
        league: leagueId,
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

    // No more matches
    const totalMatches = await db.collection('matches').countDocuments({
      league: leagueId
    });

    const completedMatches = await db.collection('matches').countDocuments({
      league: leagueId,
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
