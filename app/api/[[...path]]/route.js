import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase/client';
import { countryNames } from '@/lib/country-names';

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

// Helper function to generate player with realistic skills
function generatePlayer(age = null) {
  const ages = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  const playerAge = age || ages[Math.floor(Math.random() * ages.length)];
  
  // Skill levels mapping
  const skillLevels = [
    { name: 'Atrocious', min: 1, max: 10 },
    { name: 'Dreadful', min: 11, max: 20 },
    { name: 'Poor', min: 21, max: 30 },
    { name: 'Weak', min: 31, max: 40 },
    { name: 'Inadequate', min: 41, max: 50 },
    { name: 'Moderate', min: 51, max: 60 },
    { name: 'Reasonable', min: 61, max: 70 },
    { name: 'Capable', min: 71, max: 80 },
    { name: 'Quality', min: 81, max: 90 },
    { name: 'Exceptional', min: 91, max: 95 },
    { name: 'Legendary', min: 96, max: 100 }
  ];

  const generateSkill = () => Math.floor(Math.random() * 100) + 1;
  
  const batting = generateSkill();
  const bowling = generateSkill();
  const keeping = generateSkill();
  const technique = generateSkill();
  const fielding = generateSkill();
  const endurance = generateSkill();
  const power = generateSkill();
  const captaincy = generateSkill();

  // Calculate overall rating
  const overall = Math.floor((batting + bowling + keeping + technique + fielding + endurance + power + captaincy) / 8);

  const firstNames = ['James', 'Michael', 'Robert', 'John', 'David', 'William', 'Richard', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  
  const battingStyles = ['Right-handed', 'Left-handed'];
  const bowlerTypes = ['Right-arm fast', 'Left-arm fast', 'Right-arm medium', 'Left-arm medium', 'Right-arm spin', 'Left-arm spin', 'Wicket-keeper'];
  const formLevels = ['Excellent', 'Good', 'Average', 'Poor', 'Terrible'];
  const fatigueLevels = ['Fresh', 'Slightly tired', 'Tired', 'Very tired', 'Exhausted'];

  return {
    id: uuidv4(),
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    age: playerAge,
    batting,
    bowling,
    keeping,
    technique,
    fielding,
    endurance,
    power,
    captaincy,
    experience: Math.floor(Math.random() * 100),
    form: formLevels[Math.floor(Math.random() * formLevels.length)],
    fatigue: fatigueLevels[Math.floor(Math.random() * fatigueLevels.length)],
    wage: Math.floor(Math.random() * 50000) + 10000,
    rating: overall,
    nationality: 'England',
    batting_style: battingStyles[Math.floor(Math.random() * battingStyles.length)],
    bowler_type: bowlerTypes[Math.floor(Math.random() * bowlerTypes.length)],
    talents: [],
    squad_type: 'senior',
    market_value: Math.floor(overall * 1000) + Math.floor(Math.random() * 10000),
    is_for_sale: false,
    sale_price: 0
  };
}

// Enhanced T20 Match simulation functions
function simulateInnings(battingTeam, bowlingTeam, target = null, matchConditions = {}, isSecondInnings = false) {
  const maxOvers = 20;
  const { weather = 'Sunny', pitchType = 'Normal' } = matchConditions;
  
  let runs = 0;
  let wickets = 0;
  let ballCount = 0;
  let commentary = [];
  let currentBatsman1 = 0;
  let currentBatsman2 = 1;
  let currentBowler = 0;
  let bowlerOvers = {}; // Track overs bowled by each bowler
  let partnerships = [];
  let currentPartnership = { batsman1: battingTeam[0].name, batsman2: battingTeam[1].name, runs: 0, balls: 0 };
  let fallOfWickets = [];
  let bowlingFigures = {};
  let lastBowler = -1;
  
  // Initialize batting scores
  let batsmanScores = battingTeam.map(() => ({ 
    runs: 0, balls: 0, fours: 0, sixes: 0, out: false, outType: null, bowler: null, strikeRate: 0 
  }));
  
  // Weather and pitch effects
  const getWeatherEffect = () => {
    switch(weather) {
      case 'Overcast': return { bowlingBonus: 5, battingPenalty: 3 };
      case 'Rainy': return { bowlingBonus: 8, battingPenalty: 5 };
      case 'Sunny': return { bowlingBonus: 0, battingPenalty: 0 };
      default: return { bowlingBonus: 0, battingPenalty: 0 };
    }
  };
  
  const getPitchEffect = () => {
    switch(pitchType) {
      case 'Green': return { bowlingBonus: 6, battingPenalty: 4 };
      case 'Dusty': return { bowlingBonus: 3, battingPenalty: 2, spinBonus: 5 };
      case 'Flat': return { bowlingBonus: -3, battingPenalty: -3 };
      default: return { bowlingBonus: 0, battingPenalty: 0 };
    }
  };
  
  const weatherEffect = getWeatherEffect();
  const pitchEffect = getPitchEffect();
  
  for (let over = 0; over < maxOvers && wickets < 10; over++) {
    const isPowerplay = over < 6;
    const isDeathOvers = over >= 17;
    
    // Bowling restrictions - can't bowl more than 4 overs
    let availableBowlers = bowlingTeam.filter((_, index) => (bowlerOvers[index] || 0) < 4);
    if (availableBowlers.length === 0) availableBowlers = bowlingTeam; // Fallback
    
    // Select bowler (can't bowl consecutive overs)
    let bowlerIndex;
    do {
      bowlerIndex = Math.floor(Math.random() * availableBowlers.length);
      bowlerIndex = bowlingTeam.findIndex(b => b.id === availableBowlers[bowlerIndex].id);
    } while (bowlerIndex === lastBowler && availableBowlers.length > 1);
    
    const bowler = bowlingTeam[bowlerIndex];
    bowlerOvers[bowlerIndex] = (bowlerOvers[bowlerIndex] || 0) + 1;
    lastBowler = bowlerIndex;
    
    // Initialize bowling figures
    if (!bowlingFigures[bowler.id]) {
      bowlingFigures[bowler.id] = { 
        name: bowler.name, overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 
      };
    }
    
    let overRuns = 0;
    let overWickets = 0;
    
    for (let ball = 0; ball < 6 && wickets < 10; ball++) {
      ballCount++;
      currentPartnership.balls++;
      
      // Get current players
      const batsman = battingTeam[currentBatsman1];
      const nonStriker = battingTeam[currentBatsman2];
      
      // Calculate skills with form and fatigue effects
      const formMultiplier = batsman.form === 'Excellent' ? 1.15 : 
                           batsman.form === 'Good' ? 1.05 : 
                           batsman.form === 'Poor' ? 0.9 : 
                           batsman.form === 'Terrible' ? 0.8 : 1.0;
      
      const fatigueMultiplier = batsman.fatigue === 'Fresh' ? 1.0 : 
                               batsman.fatigue === 'Slightly tired' ? 0.95 : 
                               batsman.fatigue === 'Tired' ? 0.9 : 0.85;
      
      let batsmanSkill = (batsman.batting + batsman.technique + batsman.power) / 3;
      batsmanSkill = batsmanSkill * formMultiplier * fatigueMultiplier;
      
      let bowlerSkill = (bowler.bowling + bowler.technique) / 2;
      
      // Apply conditions
      bowlerSkill += weatherEffect.bowlingBonus + pitchEffect.bowlingBonus;
      batsmanSkill -= weatherEffect.battingPenalty + pitchEffect.battingPenalty;
      
      // Spin bowling bonus on dusty pitch
      if (pitchEffect.spinBonus && (bowler.bowler_type?.includes('spin') || bowler.bowler_type?.includes('Spin'))) {
        bowlerSkill += pitchEffect.spinBonus;
      }
      
      // Pressure factor for second innings
      let pressureFactor = 1.0;
      if (isSecondInnings && target) {
        const requiredRate = ((target - runs) / ((maxOvers * 6 - ballCount) / 6));
        const currentRate = runs > 0 ? (runs / (ballCount / 6)) : 0;
        
        if (requiredRate > currentRate + 2) {
          pressureFactor = 1.2; // High pressure increases chances of risky shots
        } else if (requiredRate < currentRate - 1) {
          pressureFactor = 0.8; // Low pressure, play safely
        }
      }
      
      // Match situation adjustments
      if (isPowerplay) {
        batsmanSkill += 5; // Field restrictions favor batsmen
      }
      if (isDeathOvers) {
        batsmanSkill += 3; // Batsmen more aggressive
        bowlerSkill += 2; // Bowlers under pressure
      }
      
      const outcomeRoll = Math.random() * 100;
      let ballRuns = 0;
      let isWicket = false;
      let ballCommentary = '';
      let extras = null;
      let milestone = null;
      
      // Check for extras first (5% chance)
      if (Math.random() < 0.05) {
        const extraType = Math.random();
        if (extraType < 0.6) {
          ballRuns = 1;
          extras = 'wide';
          ballCommentary = `Wide ball! ${bowler.name} strays down the leg side`;
          ball--; // Wide ball doesn't count as a legal delivery
        } else if (extraType < 0.9) {
          ballRuns = 1;
          extras = 'no-ball';
          ballCommentary = `No ball! ${bowler.name} oversteps the crease`;
          ball--; // No ball doesn't count as a legal delivery
        } else {
          ballRuns = 1;
          extras = 'bye';
          ballCommentary = `Bye! The ball beats everyone`;
        }
      } else {
        // Determine ball outcome
        const wicketChance = (bowlerSkill - batsmanSkill) / 10 + (isDeathOvers ? 8 : 5);
        
        if (outcomeRoll < wicketChance && wicketChance > 0) {
          // Wicket
          isWicket = true;
          overWickets++;
          const wicketTypes = ['bowled', 'caught', 'lbw', 'caught behind', 'run out'];
          const wicketType = wicketTypes[Math.floor(Math.random() * wicketTypes.length)];
          
          batsmanScores[currentBatsman1].out = true;
          batsmanScores[currentBatsman1].outType = wicketType;
          batsmanScores[currentBatsman1].bowler = bowler.name;
          
          fallOfWickets.push({
            wicket: wickets + 1,
            batsman: batsman.name,
            runs: runs,
            over: over + 1,
            ball: ball + 1,
            bowler: bowler.name,
            type: wicketType
          });
          
          // End current partnership
          partnerships.push({...currentPartnership});
          
          wickets++;
          ballCommentary = generateWicketCommentary(batsman, bowler, wicketType, runs, wickets);
          
          // Next batsman comes in
          if (wickets < 10 && currentBatsman1 + wickets + 1 < battingTeam.length) {
            currentBatsman1 = wickets + 1;
            currentPartnership = {
              batsman1: battingTeam[currentBatsman1].name,
              batsman2: battingTeam[currentBatsman2].name,
              runs: 0,
              balls: 0
            };
          }
        } else {
          // Runs scored
          const aggressionLevel = pressureFactor * (isPowerplay ? 1.2 : isDeathOvers ? 1.5 : 1.0);
          const runChance = Math.random() * 100;
          
          if (runChance < (batsmanSkill / 10) * aggressionLevel) {
            if (runChance < (batsmanSkill / 50) * aggressionLevel) {
              ballRuns = 6;
              batsmanScores[currentBatsman1].sixes++;
              ballCommentary = generateBoundaryCommentary(batsman, bowler, 6, runs + 6, isPowerplay, isDeathOvers);
            } else if (runChance < (batsmanSkill / 25) * aggressionLevel) {
              ballRuns = 4;
              batsmanScores[currentBatsman1].fours++;
              ballCommentary = generateBoundaryCommentary(batsman, bowler, 4, runs + 4, isPowerplay, isDeathOvers);
            } else {
              ballRuns = Math.floor(Math.random() * 3) + 1;
              ballCommentary = `${batsman.name} works it for ${ballRuns} run${ballRuns > 1 ? 's' : ''}`;
            }
          } else {
            ballRuns = 0;
            ballCommentary = generateDotBallCommentary(batsman, bowler, isPowerplay, isDeathOvers);
          }
          
          if (!extras) {
            batsmanScores[currentBatsman1].runs += ballRuns;
            batsmanScores[currentBatsman1].balls++;
            
            // Check for milestones
            if (batsmanScores[currentBatsman1].runs === 50) {
              milestone = 'fifty';
              ballCommentary += ` FIFTY for ${batsman.name}! What a knock!`;
            } else if (batsmanScores[currentBatsman1].runs === 100) {
              milestone = 'century';
              ballCommentary += ` CENTURY! ${batsman.name} reaches three figures!`;
            }
          }
          
          runs += ballRuns;
          overRuns += ballRuns;
          currentPartnership.runs += ballRuns;
          
          // Change strike on odd runs
          if (ballRuns % 2 === 1) {
            [currentBatsman1, currentBatsman2] = [currentBatsman2, currentBatsman1];
          }
        }
      }
      
      // Update bowling figures
      bowlingFigures[bowler.id].runs += ballRuns;
      if (isWicket) bowlingFigures[bowler.id].wickets++;
      
      // Calculate rates
      const currentRunRate = ballCount > 0 ? (runs / (ballCount / 6)).toFixed(2) : '0.00';
      let requiredRunRate = null;
      if (isSecondInnings && target) {
        const ballsLeft = (maxOvers * 6) - ballCount;
        requiredRunRate = ballsLeft > 0 ? ((target - runs) / (ballsLeft / 6)).toFixed(2) : '0.00';
      }
      
      commentary.push({
        over: over + 1,
        ball: ball + 1,
        runs: ballRuns,
        totalRuns: runs,
        wickets: wickets,
        batsman: batsman.name,
        bowler: bowler.name,
        commentary: ballCommentary,
        isWicket: isWicket,
        extras: extras,
        milestone: milestone,
        currentRunRate: parseFloat(currentRunRate),
        requiredRunRate: requiredRunRate ? parseFloat(requiredRunRate) : null,
        isPowerplay: isPowerplay,
        isDeathOvers: isDeathOvers,
        pressure: isSecondInnings && target ? (target - runs) : null,
        ballsLeft: isSecondInnings && target ? (maxOvers * 6) - ballCount : null
      });
      
      // Check if target achieved in second innings
      if (isSecondInnings && runs > target) {
        break;
      }
    }
    
    // Update bowling figures for the over
    bowlingFigures[bowler.id].overs++;
    if (overRuns === 0 && overWickets === 0) {
      bowlingFigures[bowler.id].maidens++;
    }
    
    // Change strike at end of over
    [currentBatsman1, currentBatsman2] = [currentBatsman2, currentBatsman1];
    
    // Check if target achieved in second innings
    if (isSecondInnings && runs > target) {
      break;
    }
  }
  
  // Finalize current partnership
  if (currentPartnership.balls > 0) {
    partnerships.push(currentPartnership);
  }
  
  // Calculate final bowling figures
  Object.keys(bowlingFigures).forEach(bowlerId => {
    const figure = bowlingFigures[bowlerId];
    figure.economy = figure.overs > 0 ? (figure.runs / figure.overs).toFixed(2) : '0.00';
  });
  
  // Calculate batting strike rates
  batsmanScores.forEach((score, index) => {
    score.strikeRate = score.balls > 0 ? ((score.runs / score.balls) * 100).toFixed(2) : '0.00';
    score.name = battingTeam[index].name;
  });
  
  return {
    runs,
    wickets,
    overs: Math.floor(ballCount / 6) + (ballCount % 6 > 0 ? (ballCount % 6) / 10 : 0),
    balls: ballCount,
    commentary,
    batsmanScores,
    bowlingFigures: Object.values(bowlingFigures),
    partnerships,
    fallOfWickets,
    runRate: ballCount > 0 ? (runs / (ballCount / 6)).toFixed(2) : '0.00'
  };
}

// Helper function to calculate league standings
function calculateLeagueStandings(allUsers, seasonMatches) {
  // Initialize all teams from users with 0 stats
  const teams = {};
  allUsers.forEach(user => {
    teams[user.id] = {
      id: user.id,
      name: user.team_name || 'Unknown Team',
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      netRunRate: 0,
      runsFor: 0,
      runsAgainst: 0,
      oversFor: 0,
      oversAgainst: 0,
      highestScore: 0,
      lowestScore: 999,
      averageScore: 0,
      winPercentage: 0,
      form: []
    };
  });

  // Calculate stats from season matches
  seasonMatches.forEach(match => {
    const homeTeam = teams[match.home_team_id];
    const awayTeam = teams[match.away_team_id];

    if (!homeTeam || !awayTeam) return; // Skip if team not found

    // Update played matches
    homeTeam.played++;
    awayTeam.played++;

    // Update runs and overs
    homeTeam.runsFor += match.home_score;
    homeTeam.runsAgainst += match.away_score;
    homeTeam.oversFor += match.home_overs || 20;
    homeTeam.oversAgainst += match.away_overs || 20;

    awayTeam.runsFor += match.away_score;
    awayTeam.runsAgainst += match.home_score;
    awayTeam.oversFor += match.away_overs || 20;
    awayTeam.oversAgainst += match.home_overs || 20;

    // Update highest/lowest scores
    homeTeam.highestScore = Math.max(homeTeam.highestScore, match.home_score);
    homeTeam.lowestScore = Math.min(homeTeam.lowestScore, match.home_score);
    awayTeam.highestScore = Math.max(awayTeam.highestScore, match.away_score);
    awayTeam.lowestScore = Math.min(awayTeam.lowestScore, match.away_score);

    // Update win/loss/tie records and form
    if (match.result === match.home_team_id) {
      homeTeam.won++;
      homeTeam.points += 4;
      awayTeam.lost++;
      homeTeam.form.unshift('W');
      awayTeam.form.unshift('L');
    } else if (match.result === match.away_team_id) {
      awayTeam.won++;
      awayTeam.points += 4;
      homeTeam.lost++;
      awayTeam.form.unshift('W');
      homeTeam.form.unshift('L');
    } else {
      homeTeam.tied++;
      awayTeam.tied++;
      homeTeam.points += 2;
      awayTeam.points += 2;
      homeTeam.form.unshift('T');
      awayTeam.form.unshift('T');
    }

    // Keep only last 5 matches in form
    if (homeTeam.form.length > 5) homeTeam.form = homeTeam.form.slice(0, 5);
    if (awayTeam.form.length > 5) awayTeam.form = awayTeam.form.slice(0, 5);
  });

  // Calculate final statistics
  const leagueTable = Object.values(teams).map(team => {
    // Net Run Rate calculation
    const runRateFor = team.oversFor > 0 ? team.runsFor / team.oversFor : 0;
    const runRateAgainst = team.oversAgainst > 0 ? team.runsAgainst / team.oversAgainst : 0;
    team.netRunRate = (runRateFor - runRateAgainst).toFixed(3);

    // Other calculations
    team.averageScore = team.played > 0 ? (team.runsFor / team.played).toFixed(1) : '0.0';
    team.winPercentage = team.played > 0 ? ((team.won / team.played) * 100).toFixed(1) : '0.0';

    // Handle lowest score for teams that haven't played
    if (team.lowestScore === 999) team.lowestScore = 0;

    return team;
  });

  // Sort by points (descending), then by net run rate (descending)
  leagueTable.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return parseFloat(b.netRunRate) - parseFloat(a.netRunRate);
  });

  return leagueTable;
}

// Enhanced commentary generation functions
function generateWicketCommentary(batsman, bowler, wicketType, runs, wicketNumber) {
  const wicketComments = {
    bowled: [
      `BOWLED! ${bowler.name} crashes through the defenses of ${batsman.name}!`,
      `Timber! ${batsman.name} is clean bowled by a beauty from ${bowler.name}!`,
      `What a delivery! ${bowler.name} rattles the stumps and ${batsman.name} has to go!`
    ],
    caught: [
      `CAUGHT! ${batsman.name} finds the fielder and ${bowler.name} gets his reward!`,
      `Gone! ${batsman.name} tries to go big but holes out to the fielder!`,
      `Excellent catch! ${batsman.name} is dismissed and ${bowler.name} is delighted!`
    ],
    lbw: [
      `LBW! ${batsman.name} is trapped in front by ${bowler.name}!`,
      `Plumb! ${batsman.name} is caught dead in front of the stumps!`,
      `That looked stone dead! ${batsman.name} has to walk back!`
    ],
    'caught behind': [
      `CAUGHT BEHIND! ${batsman.name} edges it to the keeper!`,
      `Gone! The keeper takes a sharp catch behind the stumps!`,
      `Thin edge! ${batsman.name} nicks it and the keeper does the rest!`
    ],
    'run out': [
      `RUN OUT! Poor communication and ${batsman.name} has to go!`,
      `Direct hit! ${batsman.name} is short of the crease!`,
      `Brilliant fielding! ${batsman.name} is caught well short!`
    ]
  };
  
  const comments = wicketComments[wicketType] || [`OUT! ${batsman.name} is dismissed by ${bowler.name}`];
  let comment = comments[Math.floor(Math.random() * comments.length)];
  
  if (wicketNumber <= 3) {
    comment += ` Early breakthrough for the bowling side!`;
  } else if (wicketNumber >= 8) {
    comment += ` The tail is crumbling now!`;
  }
  
  return comment;
}

function generateBoundaryCommentary(batsman, bowler, runs, totalRuns, isPowerplay, isDeathOvers) {
  const sixComments = [
    `SIX! ${batsman.name} sends it sailing over the ropes!`,
    `Maximum! What a strike from ${batsman.name}!`,
    `Gone all the way! ${batsman.name} absolutely crunches that one!`,
    `Into the crowd! ${batsman.name} connects beautifully!`,
    `Massive hit! ${batsman.name} clears the boundary with ease!`
  ];
  
  const fourComments = [
    `FOUR! ${batsman.name} finds the gap beautifully!`,
    `Cracking shot! ${batsman.name} pierces the field!`,
    `Exquisite timing! ${batsman.name} guides it to the fence!`,
    `Brilliant stroke! ${batsman.name} finds the boundary!`,
    `Perfect placement! ${batsman.name} beats the field!`
  ];
  
  let comments = runs === 6 ? sixComments : fourComments;
  let comment = comments[Math.floor(Math.random() * comments.length)];
  
  if (isPowerplay) {
    comment += ` Making the most of the powerplay restrictions!`;
  } else if (isDeathOvers) {
    comment += ` Crucial runs in the death overs!`;
  }
  
  return comment;
}

function generateDotBallCommentary(batsman, bowler, isPowerplay, isDeathOvers) {
  const dotComments = [
    `Dot ball. ${bowler.name} keeps it tight.`,
    `Good length from ${bowler.name}, ${batsman.name} defends.`,
    `${batsman.name} can't get it away, excellent bowling.`,
    `${bowler.name} hits the right length, no runs.`,
    `Solid defense from ${batsman.name}.`
  ];
  
  let comment = dotComments[Math.floor(Math.random() * dotComments.length)];
  
  if (isDeathOvers) {
    comment += ` Pressure building in the death overs!`;
  } else if (isPowerplay) {
    comment += ` Good tight bowling despite the field restrictions.`;
  }
  
  return comment;
}

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const path = params.path || [];

    console.log('GET Request Path:', path);

    if (path[0] === 'users') {
      if (path[1]) {
        // Get specific user
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', path[1])
          .single();

        if (error || !user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user);
      } else {
        // Get all users
        const { data: users, error } = await supabaseAdmin
          .from('users')
          .select('*');

        if (error) throw error;
        return NextResponse.json(users || []);
      }
    }

    if (path[0] === 'players') {
      const userId = searchParams.get('userId');
      const squadType = searchParams.get('squadType');

      if (path[1]) {
        // Get specific player
        const { data: player, error } = await supabaseAdmin
          .from('players')
          .select('*')
          .eq('id', path[1])
          .single();

        if (error || !player) {
          return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }
        return NextResponse.json(player);
      } else {
        // Get players with filters
        let query = supabaseAdmin
          .from('players')
          .select('*');

        if (userId) {
          query = query.eq('user_id', userId);
        }

        if (squadType) {
          query = query.eq('squad_type', squadType);
        }

        const { data: players, error } = await query;

        if (error) throw error;
        return NextResponse.json(players || []);
      }
    }

    if (path[0] === 'matches') {
      if (path[1] && path[2] === 'start') {
        // Start live match simulation
        const { data: match, error } = await supabaseAdmin
          .from('matches')
          .select('*')
          .eq('id', path[1])
          .single();

        if (error || !match) {
          return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Update match status to in-progress
        const { error: updateError } = await supabaseAdmin
          .from('matches')
          .update({
            status: 'in-progress',
            current_innings: 1,
            current_over: 0,
            current_ball: 0,
            current_runs: 0,
            current_wickets: 0,
            live_commentary: [],
            started_at: new Date().toISOString()
          })
          .eq('id', path[1]);

        if (updateError) throw updateError;

        return NextResponse.json({ message: 'Match started successfully', matchId: path[1] });
      }

      if (path[1] && path[2] === 'pause') {
        // Pause live match
        const { error } = await supabaseAdmin
          .from('matches')
          .update({
            status: 'paused',
            paused_at: new Date().toISOString()
          })
          .eq('id', path[1]);

        if (error) throw error;

        return NextResponse.json({ message: 'Match paused successfully' });
      }

      if (path[1] && path[2] === 'resume') {
        // Resume paused match
        const { error } = await supabaseAdmin
          .from('matches')
          .update({
            status: 'in-progress',
            resumed_at: new Date().toISOString()
          })
          .eq('id', path[1]);

        if (error) throw error;

        return NextResponse.json({ message: 'Match resumed successfully' });
      }

      if (path[1]) {
        // Get specific match
        const { data: match, error } = await supabaseAdmin
          .from('matches')
          .select('*')
          .eq('id', path[1])
          .single();

        if (error || !match) {
          return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }
        return NextResponse.json(match);
      } else {
        // Get all matches with enhanced filtering
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit')) || 50;

        let query = supabaseAdmin
          .from('matches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (userId) {
          query = query.or(`home_team_id.eq.${userId},away_team_id.eq.${userId}`);
        }

        if (status) {
          query = query.eq('status', status);
        }

        const { data: matches, error } = await query;

        if (error) throw error;

        // Populate team names
        const populatedMatches = await Promise.all(matches.map(async (match) => {
          const { data: homeTeam } = await supabaseAdmin
            .from('users')
            .select('team_name')
            .eq('id', match.home_team_id)
            .single();

          const { data: awayTeam } = await supabaseAdmin
            .from('users')
            .select('team_name')
            .eq('id', match.away_team_id)
            .single();

          return {
            ...match,
            home_team_name: homeTeam ? homeTeam.team_name : 'Unknown Team',
            away_team_name: awayTeam ? awayTeam.team_name : 'Unknown Team'
          };
        }));

        return NextResponse.json(populatedMatches);
      }
    }

    if (path[0] === 'lineups') {
      const userId = searchParams.get('userId');

      if (path[1]) {
        // Get specific lineup
        const { data: lineup, error } = await supabaseAdmin
          .from('lineups')
          .select('*')
          .eq('id', path[1])
          .single();

        if (error || !lineup) {
          return NextResponse.json({ error: 'Lineup not found' }, { status: 404 });
        }
        return NextResponse.json(lineup);
      } else {
        // Get all lineups for user
        const { data: lineups, error } = await supabaseAdmin
          .from('lineups')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        return NextResponse.json(lineups || []);
      }
    }

    if (path[0] === 'marketplace') {
      if (path[1] === 'buy' && path[2]) {
        // Buy a player from marketplace
        const playerId = path[2];
        const { buyerId } = await request.json();

        const { data: player, error: playerError } = await supabaseAdmin
          .from('players')
          .select('*')
          .eq('id', playerId)
          .eq('is_for_sale', true)
          .single();

        if (playerError || !player) {
          return NextResponse.json({ error: 'Player not available' }, { status: 404 });
        }

        const { data: buyer, error: buyerError } = await supabaseAdmin
          .from('users')
          .select('coins')
          .eq('id', buyerId)
          .single();

        if (buyerError || !buyer || buyer.coins < player.sale_price) {
          return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
        }

        // Transfer player and coins
        const { error: updatePlayerError } = await supabaseAdmin
          .from('players')
          .update({
            user_id: buyerId,
            is_for_sale: false,
            sale_price: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', playerId);

        if (updatePlayerError) throw updatePlayerError;

        const { error: updateBuyerError } = await supabaseAdmin
          .from('users')
          .update({
            coins: buyer.coins - player.sale_price,
            updated_at: new Date().toISOString()
          })
          .eq('id', buyerId);

        if (updateBuyerError) throw updateBuyerError;

        // Get seller's current coins and update
        const { data: seller, error: sellerError } = await supabaseAdmin
          .from('users')
          .select('coins')
          .eq('id', player.user_id)
          .single();

        if (sellerError || !seller) {
          return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
        }

        const { error: updateSellerError } = await supabaseAdmin
          .from('users')
          .update({
            coins: seller.coins + player.sale_price,
            updated_at: new Date().toISOString()
          })
          .eq('id', player.user_id);

        if (updateSellerError) throw updateSellerError;

        return NextResponse.json({ message: 'Player purchased successfully' });
      }

      // Get marketplace listings
      const { data: players, error } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('is_for_sale', true);

      if (error) throw error;
      return NextResponse.json(players || []);
    }

    if (path[0] === 'leagues') {
      const requestedSeason = searchParams.get('season');
      const showHistory = searchParams.get('history') === 'true';

      // Get all users (teams)
      const { data: allUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      // Get league seasons to determine current season
      const { data: leagueSeasons, error: seasonsError } = await supabaseAdmin
        .from('league_seasons')
        .select('*')
        .eq('league_id', 'default')
        .order('season', { ascending: false });

      if (seasonsError) throw seasonsError;

      let activeSeason = null;
      if (leagueSeasons.length > 0) {
        // Find the most recent active season
        const activeSeasonDoc = leagueSeasons.find(s => s.status === 'active');
        if (activeSeasonDoc) {
          activeSeason = activeSeasonDoc.season;
        } else {
          // If no active season, use the most recent completed season
          activeSeason = leagueSeasons[0].season;
        }
      }

      // Use requested season or active season
      const currentSeason = requestedSeason || activeSeason;

      // Get completed matches for the requested season
      let matchesQuery = supabaseAdmin
        .from('matches')
        .select('*')
        .eq('league', 'default')
        .eq('status', 'completed');

      if (showHistory && activeSeason) {
        matchesQuery = matchesQuery.neq('season', activeSeason);
      } else if (!showHistory && currentSeason) {
        matchesQuery = matchesQuery.eq('season', currentSeason);
      }

      const { data: seasonMatches, error: matchesError } = await matchesQuery;
      if (matchesError) throw matchesError;

      // If showing history, group by season
      if (showHistory) {
        const seasonsData = {};

        // Group matches by season
        for (const match of seasonMatches) {
          if (!seasonsData[match.season]) {
            seasonsData[match.season] = [];
          }
          seasonsData[match.season].push(match);
        }

        // Calculate standings for each season
        const history = [];
        for (const [season, matches] of Object.entries(seasonsData)) {
          const seasonStandings = calculateLeagueStandings(allUsers, matches);
          history.push({
            season,
            standings: seasonStandings,
            totalMatches: matches.length,
            completedMatches: matches.length
          });
        }

        // Sort by season (most recent first)
        history.sort((a, b) => b.season.localeCompare(a.season));

        return NextResponse.json({
          history,
          currentSeason: activeSeason
        });
      }

      // Initialize all teams from users with 0 stats
      const teams = {};
      allUsers.forEach(user => {
        teams[user.id] = {
          id: user.id,
          name: user.team_name || 'Unknown Team',
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          points: 0,
          netRunRate: 0,
          runsFor: 0,
          runsAgainst: 0,
          oversFor: 0,
          oversAgainst: 0,
          highestScore: 0,
          lowestScore: 999,
          averageScore: 0,
          winPercentage: 0,
          form: []
        };
      });

      // Calculate stats from season matches
      seasonMatches.forEach(match => {
        const homeTeam = teams[match.home_team_id];
        const awayTeam = teams[match.away_team_id];

        if (!homeTeam || !awayTeam) return; // Skip if team not found

        // Update played matches
        homeTeam.played++;
        awayTeam.played++;

        // Update runs and overs
        homeTeam.runsFor += match.home_score;
        homeTeam.runsAgainst += match.away_score;
        homeTeam.oversFor += match.home_overs || 20;
        homeTeam.oversAgainst += match.away_overs || 20;

        awayTeam.runsFor += match.away_score;
        awayTeam.runsAgainst += match.home_score;
        awayTeam.oversFor += match.away_overs || 20;
        awayTeam.oversAgainst += match.home_overs || 20;

        // Update highest/lowest scores
        homeTeam.highestScore = Math.max(homeTeam.highestScore, match.home_score);
        homeTeam.lowestScore = Math.min(homeTeam.lowestScore, match.home_score);
        awayTeam.highestScore = Math.max(awayTeam.highestScore, match.away_score);
        awayTeam.lowestScore = Math.min(awayTeam.lowestScore, match.away_score);

        // Update win/loss/tie records and form
        if (match.result === match.home_team_id) {
          homeTeam.won++;
          homeTeam.points += 4;
          awayTeam.lost++;
          homeTeam.form.unshift('W');
          awayTeam.form.unshift('L');
        } else if (match.result === match.away_team_id) {
          awayTeam.won++;
          awayTeam.points += 4;
          homeTeam.lost++;
          awayTeam.form.unshift('W');
          homeTeam.form.unshift('L');
        } else {
          homeTeam.tied++;
          awayTeam.tied++;
          homeTeam.points += 2;
          awayTeam.points += 2;
          homeTeam.form.unshift('T');
          awayTeam.form.unshift('T');
        }

        // Keep only last 5 matches in form
        if (homeTeam.form.length > 5) homeTeam.form = homeTeam.form.slice(0, 5);
        if (awayTeam.form.length > 5) awayTeam.form = awayTeam.form.slice(0, 5);
      });

      // Calculate final statistics
      const leagueTable = Object.values(teams).map(team => {
        // Net Run Rate calculation
        const runRateFor = team.oversFor > 0 ? team.runsFor / team.oversFor : 0;
        const runRateAgainst = team.oversAgainst > 0 ? team.runsAgainst / team.oversAgainst : 0;
        team.netRunRate = (runRateFor - runRateAgainst).toFixed(3);

        // Other calculations
        team.averageScore = team.played > 0 ? (team.runsFor / team.played).toFixed(1) : '0.0';
        team.winPercentage = team.played > 0 ? ((team.won / team.played) * 100).toFixed(1) : '0.0';

        // Handle lowest score for teams that haven't played
        if (team.lowestScore === 999) team.lowestScore = 0;

        return team;
      });

      // Sort by points (descending), then by net run rate (descending)
      leagueTable.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return parseFloat(b.netRunRate) - parseFloat(a.netRunRate);
      });

      return NextResponse.json({
        season: currentSeason,
        leagueTable,
        totalMatches: seasonMatches.length,
        completedMatches: seasonMatches.length
      });
    }

    return NextResponse.json({ message: 'Cricket Pavilion API' });

  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const path = params.path || [];

    console.log('POST Request Path:', path);

    if (path[0] === 'auth') {
      if (path[1] === 'register') {
        try {
          const body = await request.json();
          console.log('Registration body:', body);

          const { email, password, username, team_name, country, nationality } = body;

          // Validate required fields
          if (!email || !password || !username || !team_name || !country) {
            return NextResponse.json(
              { error: 'Missing required fields: email, password, username, team_name, and country are required' },
              { status: 400 }
            );
          }

          // Check if user exists
          const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('id')
            .or(`email.eq.${email},username.eq.${username}`)
            .single();

          if (existingUser) {
            return NextResponse.json(
              { error: 'User with this email or username already exists' },
              { status: 400 }
            );
          }

          const userId = uuidv4();

          // Create user
          const user = {
            id: userId,
            email,
            username,
            team_name,
            country,
            nationality,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            membership_type: 'free',
            coins: 50000 // Starting virtual currency
          };

          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert(user);

          if (insertError) throw insertError;

          // Generate starting squad for new user (20 players with globally unique names based on selected country)
          const startingPlayers = [];

          // Get names for the selected country, fallback to England if not found
          const selectedCountry = body.country || 'England';
          const countryData = countryNames[selectedCountry] || countryNames['England'];
          const firstNames = countryData.firstNames;
          const lastNames = countryData.lastNames;

          // Generate unique names by checking database individually to avoid URI too large error
          const usedNames = new Set();
          let attempts = 0;
          const maxAttempts = 1000; // Safety limit

          while (startingPlayers.length < 20 && attempts < maxAttempts) {
            attempts++;

            // Generate a random name combination
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${firstName} ${lastName}`;

            // Skip if we already generated this name in this session
            if (usedNames.has(fullName)) continue;

            // Check if this name already exists in the database
            const { data: existingPlayer, error: checkError } = await supabaseAdmin
              .from('players')
              .select('id')
              .eq('name', fullName)
              .single();

            // If no error and no existing player found, this name is available
            if (checkError && checkError.code === 'PGRST116') { // PGRST116 = no rows returned
              // Name is available, create player
              usedNames.add(fullName);
              const player = generatePlayer();
              player.name = fullName;
              player.nationality = selectedCountry;
              player.user_id = userId;
              player.squad_type = 'senior';
              startingPlayers.push(player);
            } else if (checkError) {
              // Some other error occurred, throw it
              throw checkError;
            }
            // If existingPlayer exists, name is taken, continue to next attempt
          }

          // If we still don't have 20 players after max attempts, fill with generic names
          while (startingPlayers.length < 20) {
            const player = generatePlayer();
            player.name = `Player ${startingPlayers.length + 1}`;
            player.nationality = selectedCountry;
            player.user_id = userId;
            player.squad_type = 'senior';
            startingPlayers.push(player);
          }

          const { error: playersError } = await supabaseAdmin
            .from('players')
            .insert(startingPlayers);

          if (playersError) throw playersError;

          // Create default lineup for new user
          const defaultLineupId = uuidv4();
          const defaultLineup = {
            id: defaultLineupId,
            user_id: userId,
            name: 'Main Lineup',
            players: startingPlayers.map(p => p.id),
            formation: '4-4-2',
            is_main: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: lineupError } = await supabaseAdmin
            .from('lineups')
            .insert(defaultLineup);

          if (lineupError) throw lineupError;

          // Remove password from response
          const { password: _, ...userResponse } = user;
          return NextResponse.json(userResponse, { status: 201 });
        } catch (registrationError) {
          console.error('Registration error:', registrationError);
          return NextResponse.json(
            { error: 'Registration failed', details: registrationError.message },
            { status: 500 }
          );
        }
      }

      if (path[1] === 'login') {
        const body = await request.json();
        const { email, password } = body;

        // In a real app, you'd verify the password hash
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !user) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        }

        // Update last login
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) throw updateError;

        const { password: _, ...userResponse } = user;
        return NextResponse.json(userResponse);
      }
    }

    if (path[0] === 'players') {
      const body = await request.json();
      const playerId = uuidv4();

      const player = {
        id: playerId,
        user_id: body.user_id,
        name: body.name,
        age: body.age || 25,
        batting: body.batting || Math.floor(Math.random() * 100) + 1,
        bowling: body.bowling || Math.floor(Math.random() * 100) + 1,
        keeping: body.keeping || Math.floor(Math.random() * 100) + 1,
        technique: body.technique || Math.floor(Math.random() * 100) + 1,
        fielding: body.fielding || Math.floor(Math.random() * 100) + 1,
        endurance: body.endurance || Math.floor(Math.random() * 100) + 1,
        power: body.power || Math.floor(Math.random() * 100) + 1,
        captaincy: body.captaincy || Math.floor(Math.random() * 100) + 1,
        experience: body.experience || 0,
        form: body.form || 'Average',
        fatigue: body.fatigue || 'Fresh',
        wage: body.wage || 10000,
        rating: body.rating || Math.floor((body.batting + body.bowling + body.keeping + body.technique + body.fielding + body.endurance + body.power + body.captaincy) / 8),
        nationality: body.nationality || 'England',
        batting_style: body.batting_style || 'Right-handed',
        bowler_type: body.bowler_type || 'Right-arm medium',
        talents: body.talents || [],
        squad_type: body.squad_type || 'senior',
        market_value: body.market_value || 10000,
        is_for_sale: body.is_for_sale || false,
        sale_price: body.sale_price || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('players')
        .insert(player);

      if (error) throw error;
      return NextResponse.json(player, { status: 201 });
    }

    if (path[0] === 'lineups') {
      const body = await request.json();
      const lineupId = uuidv4();

      const lineup = {
        id: lineupId,
        user_id: body.user_id,
        name: body.name || 'Main Lineup',
        players: body.players || [],
        formation: body.formation || '4-4-2',
        is_main: body.is_main || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('lineups')
        .insert(lineup);

      if (error) throw error;
      return NextResponse.json(lineup, { status: 201 });
    }

    if (path[0] === 'marketplace') {
      // Marketplace POST not implemented - only GET for listings
      return NextResponse.json({ error: 'Marketplace POST not implemented' }, { status: 501 });
    }

    if (path[0] === 'matches') {
      if (path[1] && path[2] === 'simulate') {
        // Simulate individual match - Note: Players table not implemented yet
        return NextResponse.json({ error: 'Match simulation not implemented yet - requires players table' }, { status: 501 });
      }

      if (path[1] === 'quick-sim') {
        // Quick sim targeted matches - Note: Players table not implemented yet
        return NextResponse.json({ error: 'Quick simulation not implemented yet - requires players table' }, { status: 501 });
      }

      const body = await request.json();
      const matchId = uuidv4();

      // Random weather and pitch conditions if not specified
      const weatherOptions = ['Sunny', 'Overcast', 'Partly Cloudy'];
      const pitchOptions = ['Normal', 'Green', 'Dusty', 'Flat'];

      const match = {
        id: matchId,
        home_team_id: body.home_team_id,
        away_team_id: body.away_team_id,
        league: body.league || 'default',
        season: body.season || '2025',
        match_type: 'T20',
        scheduled_time: new Date(body.scheduled_time || Date.now()).toISOString(),
        pitch_type: body.pitch_type || pitchOptions[Math.floor(Math.random() * pitchOptions.length)],
        weather: body.weather || weatherOptions[Math.floor(Math.random() * weatherOptions.length)],
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
        round: body.round || 1,
        match_number: body.match_number || 1
      };

      const { error } = await supabaseAdmin
        .from('matches')
        .insert(match);

      if (error) throw error;
      return NextResponse.json(match, { status: 201 });
    }

    if (path[0] === 'match-orders') {
      // Match orders table not implemented yet
      return NextResponse.json({ error: 'Match orders endpoint not implemented yet' }, { status: 501 });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const path = params.path || [];
    const body = await request.json();

    console.log('PUT Request Path:', path, 'Body:', body);

    if (path[0] === 'players' && path[1]) {
      const { error } = await supabaseAdmin
        .from('players')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', path[1]);

      if (error) throw error;

      const { data: updatedPlayer, error: fetchError } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('id', path[1])
        .single();

      if (fetchError || !updatedPlayer) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      return NextResponse.json(updatedPlayer);
    }

    if (path[0] === 'lineups' && path[1]) {
      // Lineups table not implemented yet
      return NextResponse.json({ error: 'Lineup endpoint not implemented yet' }, { status: 501 });
    }

    if (path[0] === 'matches' && path[1]) {
      const { error } = await supabaseAdmin
        .from('matches')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', path[1]);

      if (error) throw error;

      const { data: updatedMatch, error: fetchError } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('id', path[1])
        .single();

      if (fetchError || !updatedMatch) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      return NextResponse.json(updatedMatch);
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const path = params.path || [];

    console.log('DELETE Request Path:', path);

    if (path[0] === 'players' && path[1]) {
      const { error } = await supabaseAdmin
        .from('players')
        .delete()
        .eq('id', path[1]);

      if (error) throw error;

      return NextResponse.json({ message: 'Player deleted successfully' });
    }

    if (path[0] === 'matches' && path[1]) {
      const { error } = await supabaseAdmin
        .from('matches')
        .delete()
        .eq('id', path[1]);

      if (error) throw error;

      return NextResponse.json({ message: 'Match deleted successfully' });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
