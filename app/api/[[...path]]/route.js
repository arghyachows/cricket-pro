import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

let client = null;

async function getDatabase() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
  }
  return client.db(process.env.DB_NAME || 'cricket_pavilion');
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
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const path = params.path || [];
    
    console.log('GET Request Path:', path);

    if (path[0] === 'users') {
      if (path[1]) {
        // Get specific user
        const user = await db.collection('users').findOne({ id: path[1] });
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user);
      } else {
        // Get all users
        const users = await db.collection('users').find({}).toArray();
        return NextResponse.json(users);
      }
    }

    if (path[0] === 'players') {
      const userId = searchParams.get('userId');
      const squadType = searchParams.get('squadType');
      
      if (path[1]) {
        // Get specific player
        const player = await db.collection('players').findOne({ id: path[1] });
        if (!player) {
          return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }
        return NextResponse.json(player);
      } else {
        // Get players with filters
        let filter = {};
        if (userId) filter.user_id = userId;
        if (squadType) filter.squad_type = squadType;
        
        const players = await db.collection('players').find(filter).toArray();
        return NextResponse.json(players);
      }
    }

    if (path[0] === 'matches') {
      if (path[1] && path[2] === 'simulate') {
        // Simulate match
        const match = await db.collection('matches').findOne({ id: path[1] });
        if (!match) {
          return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Get teams and players (T20 only now)
        const homeTeam = await db.collection('players').find({ 
          user_id: match.home_team_id,
          squad_type: 'senior'
        }).limit(11).toArray();
        
        let awayTeam = await db.collection('players').find({ 
          user_id: match.away_team_id,
          squad_type: 'senior'
        }).limit(11).toArray();
        
        // If away team has no players (demo opponent), generate them
        if (awayTeam.length === 0) {
          awayTeam = [];
          for (let i = 0; i < 11; i++) {
            const player = generatePlayer();
            player.user_id = match.away_team_id;
            awayTeam.push(player);
          }
        }

        // Match conditions
        const matchConditions = {
          weather: match.weather || 'Sunny',
          pitchType: match.pitch_type || 'Normal'
        };

        // Simulate first innings
        const firstInnings = simulateInnings(homeTeam, awayTeam, null, matchConditions, false);
        
        // Simulate second innings with target
        const target = firstInnings.runs + 1;
        const secondInnings = simulateInnings(awayTeam, homeTeam, target, matchConditions, true);

        // Determine winner
        let winner, winMargin, winType;
        if (secondInnings.runs > firstInnings.runs) {
          winner = match.away_team_id;
          winMargin = 10 - secondInnings.wickets;
          winType = 'wickets';
        } else if (firstInnings.runs > secondInnings.runs) {
          winner = match.home_team_id;
          winMargin = firstInnings.runs - secondInnings.runs;
          winType = 'runs';
        } else {
          winner = 'tie';
          winMargin = 0;
          winType = 'tie';
        }

        const result = {
          homeScore: `${firstInnings.runs}/${firstInnings.wickets}`,
          awayScore: `${secondInnings.runs}/${secondInnings.wickets}`,
          homeOvers: firstInnings.overs,
          awayOvers: secondInnings.overs,
          winner,
          winMargin,
          winType,
          target,
          commentary: [...firstInnings.commentary, ...secondInnings.commentary],
          firstInnings,
          secondInnings,
          matchConditions
        };

        // Update match with complete result
        await db.collection('matches').updateOne(
          { id: path[1] },
          { 
            $set: { 
              status: 'completed',
              home_score: firstInnings.runs,
              away_score: secondInnings.runs,
              home_overs: firstInnings.overs,
              away_overs: secondInnings.overs,
              home_wickets: firstInnings.wickets,
              away_wickets: secondInnings.wickets,
              result: winner,
              win_margin: winMargin,
              win_type: winType,
              target: target,
              commentary: result.commentary,
              match_data: {
                firstInnings: {
                  runs: firstInnings.runs,
                  wickets: firstInnings.wickets,
                  overs: firstInnings.overs,
                  runRate: firstInnings.runRate,
                  batsmanScores: firstInnings.batsmanScores,
                  bowlingFigures: firstInnings.bowlingFigures,
                  partnerships: firstInnings.partnerships,
                  fallOfWickets: firstInnings.fallOfWickets
                },
                secondInnings: {
                  runs: secondInnings.runs,
                  wickets: secondInnings.wickets,
                  overs: secondInnings.overs,
                  runRate: secondInnings.runRate,
                  batsmanScores: secondInnings.batsmanScores,
                  bowlingFigures: secondInnings.bowlingFigures,
                  partnerships: secondInnings.partnerships,
                  fallOfWickets: secondInnings.fallOfWickets
                }
              },
              completed_at: new Date()
            }
          }
        );

        return NextResponse.json(result);
      }

      if (path[1] && path[2] === 'start') {
        // Start live match simulation
        const match = await db.collection('matches').findOne({ id: path[1] });
        if (!match) {
          return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Update match status to in-progress
        await db.collection('matches').updateOne(
          { id: path[1] },
          { 
            $set: { 
              status: 'in-progress',
              current_innings: 1,
              current_over: 0,
              current_ball: 0,
              current_runs: 0,
              current_wickets: 0,
              live_commentary: [],
              started_at: new Date()
            }
          }
        );

        return NextResponse.json({ message: 'Match started successfully', matchId: path[1] });
      }

      if (path[1] && path[2] === 'pause') {
        // Pause live match
        await db.collection('matches').updateOne(
          { id: path[1] },
          { $set: { status: 'paused', paused_at: new Date() } }
        );

        return NextResponse.json({ message: 'Match paused successfully' });
      }

      if (path[1] && path[2] === 'resume') {
        // Resume paused match
        await db.collection('matches').updateOne(
          { id: path[1] },
          { $set: { status: 'in-progress', resumed_at: new Date() } }
        );

        return NextResponse.json({ message: 'Match resumed successfully' });
      }
      
      if (path[1]) {
        // Get specific match
        const match = await db.collection('matches').findOne({ id: path[1] });
        if (!match) {
          return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }
        return NextResponse.json(match);
      } else {
        // Get all matches with enhanced filtering
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');
        let filter = {};
        
        if (userId) {
          filter = { $or: [{ home_team_id: userId }, { away_team_id: userId }] };
        }
        
        if (status) {
          filter.status = status;
        }
        
        const matches = await db.collection('matches').find(filter).sort({ created_at: -1 }).toArray();
        return NextResponse.json(matches);
      }
    }

    if (path[0] === 'lineups') {
      const userId = searchParams.get('userId');
      
      if (path[1]) {
        // Get specific lineup
        const lineup = await db.collection('lineups').findOne({ id: path[1] });
        if (!lineup) {
          return NextResponse.json({ error: 'Lineup not found' }, { status: 404 });
        }
        return NextResponse.json(lineup);
      } else {
        // Get all lineups for user
        const lineups = await db.collection('lineups').find({ user_id: userId }).toArray();
        return NextResponse.json(lineups);
      }
    }

    if (path[0] === 'marketplace') {
      if (path[1] === 'buy' && path[2]) {
        // Buy a player from marketplace
        const playerId = path[2];
        const { buyerId } = await request.json();
        
        const player = await db.collection('players').findOne({ id: playerId, is_for_sale: true });
        if (!player) {
          return NextResponse.json({ error: 'Player not available' }, { status: 404 });
        }
        
        const buyer = await db.collection('users').findOne({ id: buyerId });
        if (!buyer || buyer.coins < player.sale_price) {
          return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
        }
        
        // Transfer player and coins
        await db.collection('players').updateOne(
          { id: playerId },
          { $set: { user_id: buyerId, is_for_sale: false, sale_price: 0 } }
        );
        
        await db.collection('users').updateOne(
          { id: buyerId },
          { $inc: { coins: -player.sale_price } }
        );
        
        await db.collection('users').updateOne(
          { id: player.user_id },
          { $inc: { coins: player.sale_price } }
        );
        
        return NextResponse.json({ message: 'Player purchased successfully' });
      }
      
      // Get marketplace listings
      const players = await db.collection('players').find({ is_for_sale: true }).toArray();
      return NextResponse.json(players);
    }

    if (path[0] === 'leagues') {
      // Get league table (T20 only now)
      const matchType = 'T20';
      
      // Aggregate match results to create league table
      const matches = await db.collection('matches').find({ 
        match_type: 'T20',
        status: 'completed'
      }).toArray();
      
      const teams = {};
      
      for (const match of matches) {
        // Initialize teams
        if (!teams[match.home_team_id]) {
          const user = await db.collection('users').findOne({ id: match.home_team_id });
          teams[match.home_team_id] = {
            id: match.home_team_id,
            name: user?.team_name || 'Unknown Team',
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            points: 0,
            runRate: 0,
            runsFor: 0,
            runsAgainst: 0,
            ballsFaced: 0,
            ballsBowled: 0
          };
        }
        
        if (!teams[match.away_team_id]) {
          const user = await db.collection('users').findOne({ id: match.away_team_id });
          teams[match.away_team_id] = {
            id: match.away_team_id,
            name: user?.team_name || 'Unknown Team',
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            points: 0,
            runRate: 0,
            runsFor: 0,
            runsAgainst: 0,
            ballsFaced: 0,
            ballsBowled: 0
          };
        }
        
        // Update stats
        teams[match.home_team_id].played++;
        teams[match.away_team_id].played++;
        teams[match.home_team_id].runsFor += match.home_score;
        teams[match.home_team_id].runsAgainst += match.away_score;
        teams[match.away_team_id].runsFor += match.away_score;
        teams[match.away_team_id].runsAgainst += match.home_score;
        
        if (match.home_score > match.away_score) {
          teams[match.home_team_id].won++;
          teams[match.home_team_id].points += 4;
          teams[match.away_team_id].lost++;
        } else if (match.away_score > match.home_score) {
          teams[match.away_team_id].won++;
          teams[match.away_team_id].points += 4;
          teams[match.home_team_id].lost++;
        } else {
          teams[match.home_team_id].tied++;
          teams[match.away_team_id].tied++;
          teams[match.home_team_id].points += 2;
          teams[match.away_team_id].points += 2;
        }
      }
      
      // Calculate net run rate and sort
      const leagueTable = Object.values(teams).map(team => {
        team.runRate = team.played > 0 ? 
          ((team.runsFor - team.runsAgainst) / team.played).toFixed(2) : 0;
        return team;
      }).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return parseFloat(b.runRate) - parseFloat(a.runRate);
      });
      
      return NextResponse.json(leagueTable);
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
    const db = await getDatabase();
    const path = params.path || [];
    const body = await request.json();
    
    console.log('POST Request Path:', path, 'Body:', body);

    if (path[0] === 'auth') {
      if (path[1] === 'register') {
        const { email, password, username, team_name, country, nationality } = body;
        
        // Check if user exists
        const existingUser = await db.collection('users').findOne({ 
          $or: [{ email }, { username }] 
        });
        
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
          created_at: new Date(),
          last_login: new Date(),
          membership_type: 'free',
          coins: 50000 // Starting virtual currency
        };
        
        await db.collection('users').insertOne(user);
        
        // Generate starting squad (15 senior players only)
        const seniorPlayers = [];
        
        for (let i = 0; i < 15; i++) {
          const player = generatePlayer();
          player.user_id = userId;
          seniorPlayers.push(player);
        }
        
        await db.collection('players').insertMany(seniorPlayers);
        
        // Remove password from response
        const { password: _, ...userResponse } = user;
        return NextResponse.json(userResponse, { status: 201 });
      }
      
      if (path[1] === 'login') {
        const { email, password } = body;
        
        // In a real app, you'd verify the password hash
        const user = await db.collection('users').findOne({ email });
        
        if (!user) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        }
        
        // Update last login
        await db.collection('users').updateOne(
          { id: user.id },
          { $set: { last_login: new Date() } }
        );
        
        const { password: _, ...userResponse } = user;
        return NextResponse.json(userResponse);
      }
    }

    if (path[0] === 'players') {
      const { user_id, ...playerData } = body;
      
      const player = {
        id: uuidv4(),
        user_id,
        ...playerData,
        created_at: new Date()
      };
      
      await db.collection('players').insertOne(player);
      return NextResponse.json(player, { status: 201 });
    }

    if (path[0] === 'lineups') {
      const lineupId = uuidv4();
      
      const lineup = {
        id: lineupId,
        user_id: body.user_id,
        name: body.name,
        players: body.players, // Array of 11 player IDs
        captain_id: body.captain_id,
        wicketkeeper_id: body.wicketkeeper_id,
        first_bowler_id: body.first_bowler_id,
        second_bowler_id: body.second_bowler_id,
        is_main: body.is_main || false,
        created_at: new Date()
      };
      
      // If this is set as main lineup, unset others
      if (lineup.is_main) {
        await db.collection('lineups').updateMany(
          { user_id: body.user_id },
          { $set: { is_main: false } }
        );
      }
      
      await db.collection('lineups').insertOne(lineup);
      return NextResponse.json(lineup, { status: 201 });
    }

    if (path[0] === 'marketplace') {
      if (path[1] === 'list') {
        // List a player for sale
        const { player_id, sale_price } = body;
        
        const result = await db.collection('players').updateOne(
          { id: player_id },
          { $set: { is_for_sale: true, sale_price: sale_price } }
        );
        
        if (result.matchedCount === 0) {
          return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Player listed for sale' });
      }
      
      if (path[1] === 'unlist') {
        // Remove player from sale
        const { player_id } = body;
        
        const result = await db.collection('players').updateOne(
          { id: player_id },
          { $set: { is_for_sale: false, sale_price: 0 } }
        );
        
        if (result.matchedCount === 0) {
          return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Player removed from sale' });
      }
    }

    if (path[0] === 'matches') {
      const matchId = uuidv4();
      
      // Random weather and pitch conditions if not specified
      const weatherOptions = ['Sunny', 'Overcast', 'Partly Cloudy'];
      const pitchOptions = ['Normal', 'Green', 'Dusty', 'Flat'];
      
      const match = {
        id: matchId,
        home_team_id: body.home_team_id,
        away_team_id: body.away_team_id,
        match_type: 'T20',
        scheduled_time: new Date(body.scheduled_time || Date.now()),
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
        created_at: new Date()
      };
      
      await db.collection('matches').insertOne(match);
      return NextResponse.json(match, { status: 201 });
    }

    if (path[0] === 'match-orders') {
      const order = {
        id: uuidv4(),
        match_id: body.match_id,
        user_id: body.user_id,
        lineup: body.lineup || [],
        captain_id: body.captain_id,
        keeper_id: body.keeper_id,
        bowling_order: body.bowling_order || [],
        tactics: body.tactics || {},
        toss_call: body.toss_call,
        created_at: new Date()
      };
      
      await db.collection('match_orders').insertOne(order);
      return NextResponse.json(order, { status: 201 });
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
    const db = await getDatabase();
    const path = params.path || [];
    const body = await request.json();
    
    console.log('PUT Request Path:', path, 'Body:', body);

    if (path[0] === 'players' && path[1]) {
      const result = await db.collection('players').updateOne(
        { id: path[1] },
        { $set: { ...body, updated_at: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      
      const updatedPlayer = await db.collection('players').findOne({ id: path[1] });
      return NextResponse.json(updatedPlayer);
    }

    if (path[0] === 'matches' && path[1]) {
      const result = await db.collection('matches').updateOne(
        { id: path[1] },
        { $set: { ...body, updated_at: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }
      
      const updatedMatch = await db.collection('matches').findOne({ id: path[1] });
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
    const db = await getDatabase();
    const path = params.path || [];
    
    console.log('DELETE Request Path:', path);

    if (path[0] === 'players' && path[1]) {
      const result = await db.collection('players').deleteOne({ id: path[1] });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      
      return NextResponse.json({ message: 'Player deleted successfully' });
    }

    if (path[0] === 'matches' && path[1]) {
      const result = await db.collection('matches').deleteOne({ id: path[1] });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }
      
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