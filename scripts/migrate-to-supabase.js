const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const mongoUrl = process.env.MONGO_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!mongoUrl || !supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  let mongoClient;

  try {
    console.log('🔄 Starting migration from MongoDB to Supabase...');

    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');

    const db = mongoClient.db(process.env.DB_NAME);

    // Migrate users (teams)
    console.log('📦 Migrating users...');
    const users = await db.collection('users').find({}).toArray();
    if (users.length > 0) {
      const { error } = await supabase
        .from('users')
        .upsert(users.map(user => ({
          id: user.id || user._id.toString(),
          team_name: user.team_name,
          created_at: user.created_at,
          updated_at: user.updated_at
        })));
      if (error) throw error;
      console.log(`✅ Migrated ${users.length} users`);
    }

    // Migrate league seasons
    console.log('📦 Migrating league seasons...');
    const leagueSeasons = await db.collection('league_seasons').find({}).toArray();
    if (leagueSeasons.length > 0) {
      const { error } = await supabase
        .from('league_seasons')
        .upsert(leagueSeasons.map(season => ({
          id: season._id.toString(),
          league_id: season.league_id,
          season: season.season,
          status: season.status,
          teams: season.teams,
          created_at: season.created_at,
          started_at: season.started_at,
          completed_at: season.completed_at
        })));
      if (error) throw error;
      console.log(`✅ Migrated ${leagueSeasons.length} league seasons`);
    }

    // Migrate matches
    console.log('📦 Migrating matches...');
    const matches = await db.collection('matches').find({}).toArray();
    if (matches.length > 0) {
      const { error } = await supabase
        .from('matches')
        .upsert(matches.map(match => ({
          id: match.id || match._id.toString(),
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          league: match.league,
          season: match.season,
          match_type: match.match_type || 'T20',
          scheduled_time: match.scheduled_time,
          pitch_type: match.pitch_type || 'Normal',
          weather: match.weather || 'Sunny',
          venue: match.venue,
          status: match.status,
          home_score: match.home_score || 0,
          away_score: match.away_score || 0,
          home_wickets: match.home_wickets || 0,
          away_wickets: match.away_wickets || 0,
          home_overs: match.home_overs || 0,
          away_overs: match.away_overs || 0,
          result: match.result || { winner: null, homeScore: 0, awayScore: 0 },
          win_margin: match.win_margin,
          win_type: match.win_type,
          target: match.target,
          commentary: match.commentary || [],
          current_innings: match.current_innings,
          current_over: match.current_over || 0,
          current_ball: match.current_ball || 0,
          current_runs: match.current_runs || 0,
          current_wickets: match.current_wickets || 0,
          live_commentary: match.live_commentary || [],
          match_data: match.match_data,
          round: match.round,
          match_number: match.match_number,
          created_at: match.created_at,
          updated_at: match.updated_at
        })));
      if (error) throw error;
      console.log(`✅ Migrated ${matches.length} matches`);
    }

    // Migrate leagues (if they exist in the old format)
    console.log('📦 Migrating leagues...');
    const leagues = await db.collection('leagues').find({}).toArray();
    if (leagues.length > 0) {
      const { error } = await supabase
        .from('leagues')
        .upsert(leagues.map(league => ({
          id: league._id.toString(),
          name: league.name,
          season: league.season,
          teams: league.teams || [],
          status: league.status || 'active',
          format: league.format || 't20',
          start_date: league.startDate,
          end_date: league.endDate,
          rules: league.rules || {},
          prize_money: league.prizeMoney,
          sponsor: league.sponsor,
          description: league.description,
          created_at: league.createdAt,
          updated_at: league.updatedAt
        })));
      if (error) throw error;
      console.log(`✅ Migrated ${leagues.length} leagues`);
    }

    // Migrate teams (if they exist in the old format)
    console.log('📦 Migrating teams...');
    const teams = await db.collection('teams').find({}).toArray();
    if (teams.length > 0) {
      const { error } = await supabase
        .from('teams')
        .upsert(teams.map(team => ({
          id: team._id.toString(),
          name: team.name,
          league: team.league,
          players: team.players || [],
          captain: team.captain,
          coach: team.coach,
          founded: team.founded,
          home_ground: team.homeGround,
          logo: team.logo,
          status: team.status || 'active',
          created_at: team.createdAt,
          updated_at: team.updatedAt
        })));
      if (error) throw error;
      console.log(`✅ Migrated ${teams.length} teams`);
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run migration
migrateData();
