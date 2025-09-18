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
function generatePlayer(age = null, squad_type = 'senior') {
  const ages = squad_type === 'senior' ? [21, 22, 23, 24, 25, 26, 27, 28, 29, 30] : [16, 17, 18, 19, 20];
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
    squad_type: squad_type
  };
}

// Match simulation functions
function simulateInnings(battingTeam, bowlingTeam, overs = 50, matchType = 'SOD') {
  const maxOvers = matchType === 'ST20' || matchType === 'YT20' ? 20 : 50;
  const targetOvers = Math.min(overs, maxOvers);
  
  let runs = 0;
  let wickets = 0;
  let ballCount = 0;
  let commentary = [];
  let currentBatsman1 = 0;
  let currentBatsman2 = 1;
  let currentBowler = 0;
  let batsmanScores = battingTeam.map(() => ({ runs: 0, balls: 0, fours: 0, sixes: 0, out: false }));
  
  for (let over = 0; over < targetOvers && wickets < 10; over++) {
    for (let ball = 0; ball < 6 && wickets < 10; ball++) {
      ballCount++;
      
      // Get current players
      const batsman = battingTeam[currentBatsman1];
      const bowler = bowlingTeam[currentBowler % 5]; // Rotate through 5 bowlers
      
      // Calculate outcome based on player skills
      const batsmanSkill = (batsman.batting + batsman.technique + batsman.power) / 3;
      const bowlerSkill = (bowler.bowling + bowler.technique) / 2;
      
      const outcomeRoll = Math.random() * 100;
      let ballRuns = 0;
      let isWicket = false;
      let ballCommentary = '';
      
      // Determine ball outcome
      if (outcomeRoll < (bowlerSkill - batsmanSkill) / 10 + 5) {
        // Wicket
        isWicket = true;
        batsmanScores[currentBatsman1].out = true;
        wickets++;
        ballCommentary = `OUT! ${batsman.name} is dismissed by ${bowler.name}`;
        
        // Next batsman comes in
        currentBatsman1 = wickets + 1;
        if (currentBatsman1 >= battingTeam.length) currentBatsman1 = currentBatsman2;
      } else {
        // Runs scored
        const runChance = Math.random() * 100;
        if (runChance < batsmanSkill / 10) {
          if (runChance < batsmanSkill / 50) {
            ballRuns = 6;
            batsmanScores[currentBatsman1].sixes++;
            ballCommentary = `SIX! ${batsman.name} smashes it out of the park!`;
          } else if (runChance < batsmanSkill / 25) {
            ballRuns = 4;
            batsmanScores[currentBatsman1].fours++;
            ballCommentary = `FOUR! Beautiful shot from ${batsman.name}`;
          } else {
            ballRuns = Math.floor(Math.random() * 3) + 1;
            ballCommentary = `${batsman.name} scores ${ballRuns} run${ballRuns > 1 ? 's' : ''}`;
          }
        } else {
          ballRuns = 0;
          ballCommentary = `Dot ball. Good bowling from ${bowler.name}`;
        }
        
        batsmanScores[currentBatsman1].runs += ballRuns;
        batsmanScores[currentBatsman1].balls++;
        runs += ballRuns;
        
        // Change strike on odd runs
        if (ballRuns % 2 === 1) {
          [currentBatsman1, currentBatsman2] = [currentBatsman2, currentBatsman1];
        }
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
        isWicket: isWicket
      });
    }
    
    // Change strike at end of over
    [currentBatsman1, currentBatsman2] = [currentBatsman2, currentBatsman1];
    // Change bowler (rotate through bowling attack)
    currentBowler = (currentBowler + 1) % 5;
  }
  
  return {
    runs,
    wickets,
    overs: Math.floor(ballCount / 6) + (ballCount % 6 > 0 ? (ballCount % 6) / 10 : 0),
    commentary,
    batsmanScores
  };
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

        // Get teams and players
        const homeTeam = await db.collection('players').find({ 
          user_id: match.home_team_id,
          squad_type: match.match_type.includes('Y') ? 'youth' : 'senior'
        }).limit(11).toArray();
        
        let awayTeam = await db.collection('players').find({ 
          user_id: match.away_team_id,
          squad_type: match.match_type.includes('Y') ? 'youth' : 'senior'
        }).limit(11).toArray();
        
        // If away team has no players (demo opponent), generate them
        if (awayTeam.length === 0) {
          awayTeam = [];
          for (let i = 0; i < 11; i++) {
            const player = generatePlayer(null, match.match_type.includes('Y') ? 'youth' : 'senior');
            player.user_id = match.away_team_id;
            awayTeam.push(player);
          }
        }

        // Simulate innings
        const firstInnings = simulateInnings(homeTeam, awayTeam, 50, match.match_type);
        const secondInnings = simulateInnings(awayTeam, homeTeam, 50, match.match_type);

        const result = {
          homeScore: `${firstInnings.runs}/${firstInnings.wickets}`,
          awayScore: `${secondInnings.runs}/${secondInnings.wickets}`,
          winner: firstInnings.runs > secondInnings.runs ? match.home_team_id : match.away_team_id,
          commentary: [...firstInnings.commentary, ...secondInnings.commentary],
          firstInnings,
          secondInnings
        };

        // Update match with result
        await db.collection('matches').updateOne(
          { id: path[1] },
          { 
            $set: { 
              status: 'completed',
              home_score: firstInnings.runs,
              away_score: secondInnings.runs,
              result: result.winner,
              commentary: result.commentary
            }
          }
        );

        return NextResponse.json(result);
      }
      
      if (path[1]) {
        // Get specific match
        const match = await db.collection('matches').findOne({ id: path[1] });
        if (!match) {
          return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }
        return NextResponse.json(match);
      } else {
        // Get all matches
        const userId = searchParams.get('userId');
        let filter = {};
        if (userId) {
          filter = { $or: [{ home_team_id: userId }, { away_team_id: userId }] };
        }
        
        const matches = await db.collection('matches').find(filter).toArray();
        return NextResponse.json(matches);
      }
    }

    if (path[0] === 'leagues') {
      // Get league table
      const matchType = searchParams.get('type') || 'SOD';
      
      // Aggregate match results to create league table
      const matches = await db.collection('matches').find({ 
        match_type: matchType,
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
          membership_type: 'free'
        };
        
        await db.collection('users').insertOne(user);
        
        // Generate starting squad (15 senior players, 10 youth players)
        const seniorPlayers = [];
        const youthPlayers = [];
        
        for (let i = 0; i < 15; i++) {
          const player = generatePlayer(null, 'senior');
          player.user_id = userId;
          seniorPlayers.push(player);
        }
        
        for (let i = 0; i < 10; i++) {
          const player = generatePlayer(null, 'youth');
          player.user_id = userId;
          youthPlayers.push(player);
        }
        
        await db.collection('players').insertMany([...seniorPlayers, ...youthPlayers]);
        
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

    if (path[0] === 'matches') {
      const matchId = uuidv4();
      
      const match = {
        id: matchId,
        home_team_id: body.home_team_id,
        away_team_id: body.away_team_id,
        match_type: body.match_type || 'SOD',
        scheduled_time: new Date(body.scheduled_time || Date.now()),
        pitch_type: body.pitch_type || 'Normal',
        weather: body.weather || 'Sunny',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        result: null,
        commentary: [],
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