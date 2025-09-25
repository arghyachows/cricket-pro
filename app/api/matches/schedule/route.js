import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request) {
  try {
    const { leagueId = 'default' } = await request.json();

    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (teamsError) throw teamsError;

    if (!teams || teams.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 teams to schedule matches' },
        { status: 400 }
      );
    }

    // Check if there's an active season and archive it if all matches are complete
    const { data: activeSeason, error: activeSeasonError } = await supabaseAdmin
      .from('league_seasons')
      .select('*')
      .eq('league_id', leagueId)
      .eq('status', 'active')
      .single();

    if (activeSeasonError && activeSeasonError.code !== 'PGRST116') throw activeSeasonError;

    if (activeSeason) {
      // Check if all matches in the active season are completed
      const { data: activeMatches, error: activeMatchesError } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('league', leagueId)
        .eq('season', activeSeason.season)
        .in('status', ['scheduled', 'in-progress', 'paused']);

      if (activeMatchesError) throw activeMatchesError;

      if (!activeMatches || activeMatches.length === 0) {
        // All matches completed, archive the season
        const { error: updateError } = await supabaseAdmin
          .from('league_seasons')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', activeSeason.id);

        if (updateError) throw updateError;
      } else {
        return NextResponse.json(
          { error: 'Cannot start new season while current season has pending matches' },
          { status: 400 }
        );
      }
    }

    // Get the next season number (incremental)
    const { data: lastSeason, error: lastSeasonError } = await supabaseAdmin
      .from('league_seasons')
      .select('season')
      .eq('league_id', leagueId)
      .order('season', { ascending: false })
      .limit(1);

    if (lastSeasonError) throw lastSeasonError;

    const nextSeasonNumber = lastSeason && lastSeason.length > 0 ? parseInt(lastSeason[0].season) + 1 : 1;
    const currentSeason = nextSeasonNumber.toString();

    // Create new season
    const newSeason = {
      league_id: leagueId,
      season: currentSeason,
      status: 'active',
      teams: teams.map(t => t.id),
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString()
    };

    const { error: insertSeasonError } = await supabaseAdmin
      .from('league_seasons')
      .insert(newSeason);

    if (insertSeasonError) throw insertSeasonError;

    // Check if there are any scheduled matches for this season
    const { data: existingScheduledMatches, error: existingMatchesError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('league', leagueId)
      .eq('season', currentSeason)
      .eq('status', 'scheduled');

    if (existingMatchesError) throw existingMatchesError;

    let matchesToCreate = [];

    if (!existingScheduledMatches || existingScheduledMatches.length === 0) {
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

      const { data: currentRoundMatches, error: currentRoundError } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('league', leagueId)
        .eq('season', currentSeason)
        .eq('round', currentRound);

      if (currentRoundError) throw currentRoundError;

      const completedMatches = currentRoundMatches ? currentRoundMatches.filter(m => m.status === 'completed').length : 0;
      const totalCurrentRoundMatches = currentRoundMatches ? currentRoundMatches.length : 0;

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
              scheduled_time: new Date(Date.now() + (matchNumber * 24 * 60 * 60 * 1000)).toISOString(),
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
              created_at: new Date().toISOString(),
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
      const { error: insertMatchesError } = await supabaseAdmin
        .from('matches')
        .insert(matchesToCreate);

      if (insertMatchesError) throw insertMatchesError;
    } else {
      return NextResponse.json(
        { error: 'No new matches to schedule at this time' },
        { status: 400 }
      );
    }

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
