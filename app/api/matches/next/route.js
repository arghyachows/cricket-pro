import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const leagueId = searchParams.get('leagueId') || 'default';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current active season
    const { data: activeSeason, error: activeSeasonError } = await supabaseAdmin
      .from('league_seasons')
      .select('*')
      .eq('league_id', leagueId)
      .eq('status', 'active')
      .single();

    if (activeSeasonError && activeSeasonError.code !== 'PGRST116') throw activeSeasonError;

    if (!activeSeason) {
      return NextResponse.json({
        status: 'no_active_season',
        message: 'No active season found'
      });
    }

    // Get current match (in progress or live) for the active season
    const { data: currentMatch, error: currentMatchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('league', leagueId)
      .eq('season', activeSeason.season)
      .in('status', ['in-progress', 'live'])
      .single();

    if (currentMatch && !currentMatchError) {
      // There's a match currently in progress
      const isUserInvolved = currentMatch.home_team_id === userId || currentMatch.away_team_id === userId;

      const { data: homeTeam } = await supabaseAdmin
        .from('users')
        .select('team_name')
        .eq('id', currentMatch.home_team_id)
        .single();

      const { data: awayTeam } = await supabaseAdmin
        .from('users')
        .select('team_name')
        .eq('id', currentMatch.away_team_id)
        .single();

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
    const { data: nextMatch, error: nextMatchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('league', leagueId)
      .eq('season', activeSeason.season)
      .eq('status', 'scheduled')
      .order('match_number', { ascending: true })
      .limit(1)
      .single();

    if (nextMatch && !nextMatchError) {
      const isUserInvolved = nextMatch.home_team_id === userId || nextMatch.away_team_id === userId;

      const { data: homeTeam } = await supabaseAdmin
        .from('users')
        .select('team_name')
        .eq('id', nextMatch.home_team_id)
        .single();

      const { data: awayTeam } = await supabaseAdmin
        .from('users')
        .select('team_name')
        .eq('id', nextMatch.away_team_id)
        .single();

      // Check if previous matches are completed in the current season
      const { count: previousMatches, error: countError } = await supabaseAdmin
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('league', leagueId)
        .eq('season', activeSeason.season)
        .lt('match_number', nextMatch.match_number)
        .neq('status', 'completed');

      if (countError) throw countError;

      const canProceed = (previousMatches || 0) === 0;

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
        previousMatchesPending: previousMatches || 0
      });
    }

    // No more matches in the current season
    const { count: totalMatches, error: totalError } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('league', leagueId)
      .eq('season', activeSeason.season);

    if (totalError) throw totalError;

    const { count: completedMatches, error: completedError } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('league', leagueId)
      .eq('season', activeSeason.season)
      .eq('status', 'completed');

    if (completedError) throw completedError;

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
