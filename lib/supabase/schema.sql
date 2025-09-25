-- Supabase Database Schema for Cricket Pro

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for teams/users)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  team_name TEXT NOT NULL,
  country TEXT,
  nationality TEXT,
  membership_type TEXT DEFAULT 'free',
  coins INTEGER DEFAULT 50000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  teams UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming', 'cancelled')),
  format TEXT DEFAULT 't20' CHECK (format IN ('t20', 'odi', 'test')),
  start_date DATE,
  end_date DATE,
  rules JSONB DEFAULT '{}',
  prize_money DECIMAL,
  sponsor TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, season)
);

-- League seasons table
CREATE TABLE league_seasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming', 'cancelled')),
  teams TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(league_id, season)
);

-- Teams table
CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  league UUID REFERENCES leagues(id),
  players TEXT[] DEFAULT '{}',
  captain TEXT,
  coach TEXT,
  founded DATE DEFAULT NOW(),
  home_ground TEXT,
  logo TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, league)
);

-- Matches table
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  league TEXT NOT NULL,
  season TEXT NOT NULL,
  match_type TEXT DEFAULT 'T20' CHECK (match_type IN ('T20', 'ODI', 'Test')),
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  pitch_type TEXT DEFAULT 'Normal',
  weather TEXT DEFAULT 'Sunny',
  venue TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'live', 'completed', 'cancelled', 'paused')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  home_wickets INTEGER DEFAULT 0,
  away_wickets INTEGER DEFAULT 0,
  home_overs DECIMAL DEFAULT 0,
  away_overs DECIMAL DEFAULT 0,
  result JSONB DEFAULT '{"winner": null, "homeScore": 0, "awayScore": 0}',
  win_margin TEXT,
  win_type TEXT,
  target INTEGER,
  commentary JSONB DEFAULT '[]',
  current_innings TEXT,
  current_over INTEGER DEFAULT 0,
  current_ball INTEGER DEFAULT 0,
  current_runs INTEGER DEFAULT 0,
  current_wickets INTEGER DEFAULT 0,
  live_commentary JSONB DEFAULT '[]',
  match_data JSONB,
  round INTEGER,
  match_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  batting INTEGER DEFAULT 50,
  bowling INTEGER DEFAULT 50,
  keeping INTEGER DEFAULT 50,
  technique INTEGER DEFAULT 50,
  fielding INTEGER DEFAULT 50,
  endurance INTEGER DEFAULT 50,
  power INTEGER DEFAULT 50,
  captaincy INTEGER DEFAULT 50,
  experience INTEGER DEFAULT 0,
  form TEXT DEFAULT 'Average',
  fatigue TEXT DEFAULT 'Fresh',
  wage INTEGER DEFAULT 10000,
  rating INTEGER DEFAULT 50,
  nationality TEXT DEFAULT 'England',
  batting_style TEXT DEFAULT 'Right-handed',
  bowler_type TEXT DEFAULT 'Right-arm medium',
  talents TEXT[] DEFAULT '{}',
  squad_type TEXT DEFAULT 'senior',
  market_value INTEGER DEFAULT 10000,
  is_for_sale BOOLEAN DEFAULT false,
  sale_price INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lineups table
CREATE TABLE lineups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT DEFAULT 'Main Lineup',
  players TEXT[] DEFAULT '{}',
  formation TEXT DEFAULT '4-4-2',
  captain_id TEXT,
  wicketkeeper_id TEXT,
  first_bowler_id TEXT,
  second_bowler_id TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_matches_league_season ON matches(league, season);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_time ON matches(scheduled_time);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_leagues_status ON leagues(status);
CREATE INDEX idx_league_seasons_league_id ON league_seasons(league_id);
CREATE INDEX idx_teams_league ON teams(league);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_squad_type ON players(squad_type);
CREATE INDEX idx_players_is_for_sale ON players(is_for_sale);
CREATE INDEX idx_lineups_user_id ON lineups(user_id);
CREATE INDEX idx_lineups_is_main ON lineups(is_main);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON leagues FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON league_seasons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON teams FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON matches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON lineups FOR ALL USING (auth.role() = 'authenticated');

-- Allow read operations for anonymous users
CREATE POLICY "Allow read operations for anonymous users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON leagues FOR SELECT USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON league_seasons FOR SELECT USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON players FOR SELECT USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON lineups FOR SELECT USING (true);
