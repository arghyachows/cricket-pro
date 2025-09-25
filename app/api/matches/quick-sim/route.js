import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all scheduled matches that are ready to be simulated
    const { data: scheduledMatches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .order('scheduled_time', { ascending: true })
      .limit(5); // Simulate up to 5 matches at once

    if (matchesError) throw matchesError;

    if (!scheduledMatches || scheduledMatches.length === 0) {
      return NextResponse.json(
        { error: 'No scheduled matches available for simulation' },
        { status: 400 }
      );
    }

    const simulatedResults = [];
    let simulatedCount = 0;

    // Simulate each match
    for (const match of scheduledMatches) {
      try {
        const result = await simulateMatch(match);
        simulatedResults.push(result);
        simulatedCount++;
      } catch (error) {
        console.error(`Error simulating match ${match.id}:`, error);
        // Continue with other matches even if one fails
      }
    }

    if (simulatedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to simulate any matches' },
        { status: 500 }
      );
    }

    // Update league table if we have simulated matches
    if (simulatedResults.length > 0) {
      await updateLeagueTable();
    }

    return NextResponse.json({
      message: `Successfully simulated ${simulatedCount} matches`,
      simulated: simulatedCount,
      results: simulatedResults
    });

  } catch (error) {
    console.error('Error in quick simulation:', error);
    return NextResponse.json(
      { error: 'Failed to perform quick simulation' },
      { status: 500 }
    );
  }
}

async function simulateMatch(match) {
  // Get team information
  const { data: homeTeam, error: homeTeamError } = await supabaseAdmin
    .from('users')
    .select('team_name, country')
    .eq('id', match.home_team_id)
    .single();

  const { data: awayTeam, error: awayTeamError } = await supabaseAdmin
    .from('users')
    .select('team_name, country')
    .eq('id', match.away_team_id)
    .single();

  if (homeTeamError || awayTeamError) {
    throw new Error('Could not find team information');
  }

  // Get lineups for both teams
  const { data: homeLineup, error: homeLineupError } = await supabaseAdmin
    .from('lineups')
    .select('*')
    .eq('user_id', match.home_team_id)
    .eq('is_main', true)
    .single();

  const { data: awayLineup, error: awayLineupError } = await supabaseAdmin
    .from('lineups')
    .select('*')
    .eq('user_id', match.away_team_id)
    .eq('is_main', true)
    .single();

  // Get players for home team
  let homePlayers = [];
  if (homeLineup) {
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('*')
      .in('id', homeLineup.players || []);
    homePlayers = players || [];
  }

  // Get players for away team
  let awayPlayers = [];
  if (awayLineup) {
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('*')
      .in('id', awayLineup.players || []);
    awayPlayers = players || [];
  }

  // Generate scores based on team strength and player attributes
  const homeScore = generateTeamScore(homePlayers, 'home');
  const awayScore = generateTeamScore(awayPlayers, 'away');

  // Determine winner
  let result, winner, winMargin, winType;

  if (homeScore > awayScore) {
    winner = homeTeam.team_name;
    result = 'Home team won';
    winMargin = homeScore - awayScore;
    winType = 'runs';
  } else if (awayScore > homeScore) {
    winner = awayTeam.team_name;
    result = 'Away team won';
    winMargin = awayScore - homeScore;
    winType = 'runs';
  } else {
    winner = 'Draw';
    result = 'Match tied';
    winMargin = 0;
    winType = 'tie';
  }

  // Update match in database
  const { error: updateError } = await supabaseAdmin
    .from('matches')
    .update({
      status: 'completed',
      home_score: homeScore,
      away_score: awayScore,
      home_wickets: Math.floor(Math.random() * 10),
      away_wickets: Math.floor(Math.random() * 10),
      home_overs: 20,
      away_overs: 20,
      result: {
        winner: winner,
        homeScore: homeScore,
        awayScore: awayScore,
        result: result,
        winMargin: winMargin,
        winType: winType
      },
      win_margin: winMargin,
      win_type: winType,
      match_data: {
        homeScore: homeScore,
        awayScore: awayScore,
        winner: winner,
        result: result,
        completedAt: new Date().toISOString()
      }
    })
    .eq('id', match.id);

  if (updateError) throw updateError;

  return {
    matchId: match.id,
    homeTeam: {
      id: match.home_team_id,
      name: homeTeam.team_name,
      country: homeTeam.country
    },
    awayTeam: {
      id: match.away_team_id,
      name: awayTeam.team_name,
      country: awayTeam.country
    },
    homeScore: homeScore,
    awayScore: awayScore,
    homeOvers: 20,
    awayOvers: 20,
    winner: winner,
    winMargin: winMargin,
    winType: winType,
    target: null,
    firstInnings: {
      runs: homeScore,
      wickets: Math.floor(Math.random() * 10),
      overs: 20,
      batsmanScores: generateBatsmanScores(homeScore, homePlayers),
      bowlingFigures: generateBowlingFigures(homeScore, awayPlayers),
      fallOfWickets: generateFallOfWickets(homeScore)
    },
    secondInnings: {
      runs: awayScore,
      wickets: Math.floor(Math.random() * 10),
      overs: 20,
      batsmanScores: generateBatsmanScores(awayScore, awayPlayers),
      bowlingFigures: generateBowlingFigures(awayScore, homePlayers),
      fallOfWickets: generateFallOfWickets(awayScore)
    },
    matchConditions: {
      weather: match.weather || 'Sunny',
      pitchType: match.pitch_type || 'Normal'
    },
    commentary: generateCommentary(homeScore, awayScore, homeTeam.team_name, awayTeam.team_name)
  };
}

async function updateLeagueTable() {
  try {
    // Get all completed matches
    const { data: completedMatches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('status', 'completed')
      .eq('league', 'default');

    if (matchesError) throw matchesError;

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

    return leagueTable;

  } catch (error) {
    console.error('Error updating league table:', error);
    throw error;
  }
}

// Helper functions to generate detailed match data
function generateBatsmanScores(totalRuns, players) {
  const scores = [];
  let remainingRuns = totalRuns;
  let remainingWickets = 10;

  // Use actual players if available, otherwise generate fallback names
  let batsmen = [];
  if (players && players.length > 0) {
    // Sort players by batting ability (higher batting skill first)
    batsmen = players
      .filter(p => p.batting > 30) // Only players with decent batting
      .sort((a, b) => b.batting - a.batting)
      .slice(0, 11);
  } else {
    // Fallback: generate generic player names
    batsmen = Array.from({ length: 11 }, (_, i) => ({
      name: `Batsman ${i + 1}`,
      batting: Math.floor(Math.random() * 50) + 50 // Random batting skill 50-100
    }));
  }

  for (let i = 0; i < batsmen.length && remainingRuns > 0; i++) {
    const player = batsmen[i];
    const isOut = Math.random() > 0.4 && remainingWickets > 1; // 60% chance of being out
    const baseRuns = Math.floor((player.batting || 50) / 10); // Base runs from batting skill
    const runs = isOut ?
      Math.min(Math.floor(Math.random() * (baseRuns * 3)) + baseRuns, remainingRuns) :
      Math.floor(Math.random() * (baseRuns * 2)) + baseRuns;
    const balls = Math.floor(Math.random() * 25) + 5;
    const fours = Math.floor(runs / 25);
    const sixes = Math.floor(runs / 40);
    const strikeRate = ((runs / balls) * 100).toFixed(1);

    scores.push({
      name: player.name,
      runs: runs,
      balls: balls,
      fours: fours,
      sixes: sixes,
      strikeRate: strikeRate,
      out: isOut,
      outType: isOut ? ['bowled', 'caught', 'lbw', 'run out', 'stumped'][Math.floor(Math.random() * 5)] : null,
      bowler: isOut ? `Bowler ${Math.floor(Math.random() * 5) + 1}` : null
    });

    remainingRuns -= runs;
    if (isOut) remainingWickets--;
  }

  return scores;
}

function generateBowlingFigures(runsConceded, players) {
  const figures = [];
  let remainingRuns = runsConceded;

  // Use actual players if available, otherwise generate fallback names
  let bowlers = [];
  if (players && players.length > 0) {
    // Sort players by bowling ability (higher bowling skill first)
    bowlers = players
      .filter(p => p.bowling > 30) // Only players with decent bowling
      .sort((a, b) => b.bowling - a.bowling)
      .slice(0, 6);
  } else {
    // Fallback: generate generic player names
    bowlers = Array.from({ length: 6 }, (_, i) => ({
      name: `Bowler ${i + 1}`,
      bowling: Math.floor(Math.random() * 50) + 50 // Random bowling skill 50-100
    }));
  }

  for (let i = 0; i < bowlers.length && remainingRuns > 0; i++) {
    const player = bowlers[i];
    const overs = Math.floor(Math.random() * 4) + 1;
    const baseRuns = Math.floor((player.bowling || 50) / 15); // Base runs from bowling skill
    const runs = Math.min(Math.floor(Math.random() * (baseRuns * 2)) + baseRuns, remainingRuns);
    const wickets = Math.floor(Math.random() * ((player.bowling || 50) / 25)) + 1; // More wickets for better bowlers
    const maidens = Math.random() > 0.7 ? 1 : 0;
    const economy = (runs / overs).toFixed(2);

    figures.push({
      name: player.name,
      overs: overs,
      maidens: maidens,
      runs: runs,
      wickets: wickets,
      economy: economy
    });

    remainingRuns -= runs;
  }

  return figures;
}

function generateTeamScore(players, teamType) {
  // Handle empty players array with fallback
  if (!players || players.length === 0) {
    // Generate random score for teams without lineup data
    const baseScore = 120;
    const randomFactor = Math.random() * 40 - 20; // -20 to +20 runs
    return Math.max(80, Math.min(220, Math.floor(baseScore + randomFactor)));
  }

  // Calculate team score based on player attributes
  const battingStrength = players.reduce((sum, p) => sum + (p.batting || 50), 0) / players.length;
  const bowlingStrength = players.reduce((sum, p) => sum + (p.bowling || 50), 0) / players.length;
  const power = players.reduce((sum, p) => sum + (p.power || 50), 0) / players.length;
  const technique = players.reduce((sum, p) => sum + (p.technique || 50), 0) / players.length;

  // Base score calculation
  let baseScore = 120;

  // Adjust based on team strength
  if (teamType === 'home') {
    baseScore += (battingStrength - 50) * 0.8; // Home team gets slight advantage
    baseScore += (power - 50) * 0.5;
    baseScore += (technique - 50) * 0.3;
  } else {
    baseScore += (battingStrength - 50) * 0.6; // Away team gets less advantage
    baseScore += (power - 50) * 0.4;
    baseScore += (technique - 50) * 0.2;
  }

  // Add randomness
  const randomFactor = Math.random() * 40 - 20; // -20 to +20 runs

  // Ensure minimum and maximum scores
  const finalScore = Math.max(80, Math.min(220, Math.floor(baseScore + randomFactor)));

  return finalScore;
}

function generateFallOfWickets(totalRuns) {
  const wickets = [];
  let currentRuns = 0;
  let currentWickets = 0;

  while (currentWickets < 10 && currentRuns < totalRuns) {
    const wicketRuns = Math.floor(Math.random() * 20) + 5;
    currentRuns += wicketRuns;
    currentWickets++;

    if (currentRuns <= totalRuns) {
      wickets.push({
        wickets: currentWickets,
        runs: currentRuns,
        batsman: `Batsman ${currentWickets}`,
        over: Math.floor(currentRuns / 6) + 1,
        ball: (currentRuns % 6) + 1
      });
    }
  }

  return wickets;
}

function generateCommentary(homeScore, awayScore, homeTeam, awayTeam) {
  const commentary = [];
  const keyEvents = [
    `${homeTeam} won the toss and elected to bat first`,
    `Powerplay overs: ${homeTeam} scored ${(homeScore * 0.3).toFixed(0)} runs`,
    `Middle overs: ${homeTeam} accelerated to ${(homeScore * 0.4).toFixed(0)} runs`,
    `Death overs: ${homeTeam} scored ${(homeScore * 0.3).toFixed(0)} runs`,
    `${awayTeam} started their chase cautiously`,
    `${awayTeam} lost early wickets but recovered`,
    `${awayTeam} kept the required run rate under control`,
    `Final overs: ${awayTeam} needed ${(awayScore - homeScore).toFixed(0)} runs`
  ];

  keyEvents.forEach((event, index) => {
    commentary.push({
      over: Math.floor(index * 20 / keyEvents.length) + 1,
      ball: Math.floor(Math.random() * 6) + 1,
      commentary: event
    });
  });

  return commentary;
}
