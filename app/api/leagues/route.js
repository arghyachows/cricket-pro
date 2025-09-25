import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const history = searchParams.get('history');

    if (history === 'true') {
      // Return season history
      return await getSeasonHistory();
    }

    // Get current league table
    const leagueTable = await getLeagueTable();

    return NextResponse.json(leagueTable);

  } catch (error) {
    console.error('Error fetching league data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league data' },
      { status: 500 }
    );
  }
}

async function getLeagueTable() {
  try {
    // Get all completed matches
    const { data: completedMatches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('status', 'completed')
      .eq('league', 'default');

    if (matchesError) throw matchesError;

    // Get current active season
    const { data: activeSeason, error: seasonError } = await supabaseAdmin
      .from('league_seasons')
      .select('*')
      .eq('league_id', 'default')
      .eq('status', 'active')
      .single();

    if (seasonError && seasonError.code !== 'PGRST116') throw seasonError;

    // Get all teams
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('users')
      .select('id, team_name');

    if (teamsError) throw teamsError;

    // Calculate league standings
    const standings = {};

    // Initialize standings for all teams
    teams.forEach(team => {
      standings[team.team_name] = {
        id: team.id,
        name: team.team_name,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        points: 0,
        netRunRate: 0,
        totalRunsScored: 0,
        totalRunsConceded: 0,
        highestScore: 0,
        lowestScore: 999,
        averageScore: 0,
        form: []
      };
    });

    if (completedMatches) {
      completedMatches.forEach(match => {
        // Get team names from IDs
        const homeTeam = teams.find(t => t.id === match.home_team_id);
        const awayTeam = teams.find(t => t.id === match.away_team_id);

        if (!homeTeam || !awayTeam) return; // Skip if team data is missing

        const homeTeamName = homeTeam.team_name;
        const awayTeamName = awayTeam.team_name;

        // Update match statistics
        standings[homeTeamName].played++;
        standings[awayTeamName].played++;

        standings[homeTeamName].totalRunsScored += match.home_score;
        standings[homeTeamName].totalRunsConceded += match.away_score;
        standings[awayTeamName].totalRunsScored += match.away_score;
        standings[awayTeamName].totalRunsConceded += match.home_score;

        // Update highest/lowest scores
        standings[homeTeamName].highestScore = Math.max(standings[homeTeamName].highestScore, match.home_score);
        standings[homeTeamName].lowestScore = Math.min(standings[homeTeamName].lowestScore, match.home_score);
        standings[awayTeamName].highestScore = Math.max(standings[awayTeamName].highestScore, match.away_score);
        standings[awayTeamName].lowestScore = Math.min(standings[awayTeamName].lowestScore, match.away_score);

        // Determine winner and update form
        if (match.home_score > match.away_score) {
          standings[homeTeamName].won++;
          standings[awayTeamName].lost++;
          standings[homeTeamName].points += 2;
          standings[homeTeamName].form.push('W');
          standings[awayTeamName].form.push('L');
        } else if (match.away_score > match.home_score) {
          standings[awayTeamName].won++;
          standings[homeTeamName].lost++;
          standings[awayTeamName].points += 2;
          standings[homeTeamName].form.push('L');
          standings[awayTeamName].form.push('W');
        } else {
          standings[homeTeamName].tied++;
          standings[awayTeamName].tied++;
          standings[homeTeamName].points += 1;
          standings[awayTeamName].points += 1;
          standings[homeTeamName].form.push('T');
          standings[awayTeamName].form.push('T');
        }
      });
    }

    // Calculate net run rates and averages
    Object.values(standings).forEach(team => {
      const runsScored = team.totalRunsScored;
      const runsConceded = team.totalRunsConceded;
      const ballsFaced = team.played * 120; // Assuming 20 overs = 120 balls
      const ballsBowled = team.played * 120;

      team.netRunRate = runsConceded > 0 ? ((runsScored / ballsFaced) - (runsConceded / ballsBowled)) * 6 : 0;
      team.averageScore = team.played > 0 ? runsScored / team.played : 0;

      // Keep only last 5 form results
      team.form = team.form.slice(-5);
    });

    // Convert to array and sort by points, then net run rate
    const leagueTable = Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.netRunRate - a.netRunRate;
    });

    return {
      leagueTable,
      season: activeSeason?.season || '1',
      totalMatches: completedMatches?.length || 0
    };

  } catch (error) {
    console.error('Error calculating league table:', error);
    throw error;
  }
}

async function getSeasonHistory() {
  try {
    // Get all completed seasons
    const { data: completedSeasons, error: seasonsError } = await supabaseAdmin
      .from('league_seasons')
      .select('*')
      .eq('league_id', 'default')
      .eq('status', 'completed')
      .order('season', { ascending: false });

    if (seasonsError) throw seasonsError;

    const history = [];

    for (const season of completedSeasons || []) {
      // Get final standings for this season
      const { data: seasonMatches, error: matchesError } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('league', 'default')
        .eq('season', season.season)
        .eq('status', 'completed');

      if (matchesError) continue;

      const standings = {};

      seasonMatches.forEach(match => {
        // Get team names from IDs
        const homeTeam = teams.find(t => t.id === match.home_team_id);
        const awayTeam = teams.find(t => t.id === match.away_team_id);

        if (!homeTeam || !awayTeam) return;

        const homeTeamName = homeTeam.team_name;
        const awayTeamName = awayTeam.team_name;

        if (!standings[homeTeamName]) {
          standings[homeTeamName] = {
            id: homeTeam.id,
            name: homeTeamName,
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            points: 0,
            netRunRate: 0,
            totalRunsScored: 0,
            totalRunsConceded: 0
          };
        }

        if (!standings[awayTeamName]) {
          standings[awayTeamName] = {
            id: awayTeam.id,
            name: awayTeamName,
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            points: 0,
            netRunRate: 0,
            totalRunsScored: 0,
            totalRunsConceded: 0
          };
        }

        standings[homeTeamName].played++;
        standings[awayTeamName].played++;

        standings[homeTeamName].totalRunsScored += match.home_score;
        standings[homeTeamName].totalRunsConceded += match.away_score;
        standings[awayTeamName].totalRunsScored += match.away_score;
        standings[awayTeamName].totalRunsConceded += match.home_score;

        if (match.home_score > match.away_score) {
          standings[homeTeamName].won++;
          standings[awayTeamName].lost++;
          standings[homeTeamName].points += 2;
        } else if (match.away_score > match.home_score) {
          standings[awayTeamName].won++;
          standings[homeTeamName].lost++;
          standings[awayTeamName].points += 2;
        } else {
          standings[homeTeamName].tied++;
          standings[awayTeamName].tied++;
          standings[homeTeamName].points += 1;
          standings[awayTeamName].points += 1;
        }
      });

      // Calculate net run rates
      Object.values(standings).forEach(team => {
        const runsScored = team.totalRunsScored;
        const runsConceded = team.totalRunsConceded;
        const ballsFaced = team.played * 120;
        const ballsBowled = team.played * 120;

        team.netRunRate = runsConceded > 0 ? ((runsScored / ballsFaced) - (runsConceded / ballsBowled)) * 6 : 0;
      });

      // Sort by points, then net run rate
      const finalStandings = Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.netRunRate - a.netRunRate;
      });

      history.push({
        season: season.season,
        totalMatches: seasonMatches.length,
        standings: finalStandings
      });
    }

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Error fetching season history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch season history' },
      { status: 500 }
    );
  }
}
