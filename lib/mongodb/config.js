/**
 * MongoDB Configuration
 * Centralized configuration for MongoDB connections and database settings
 */

const config = {
  // Database connection settings
  mongodb: {
    // Connection URI - supports both local and cloud MongoDB
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-pro',

    // Database name
    databaseName: process.env.DB_NAME || 'cricket-pro',

    // Connection options for optimal performance and reliability
    options: {

      // Connection pool settings
      maxPoolSize: 10,          // Maximum number of connections in the pool
      minPoolSize: 2,           // Minimum number of connections in the pool
      maxIdleTimeMS: 30000,     // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000,  // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000,   // Close sockets after 45 seconds of inactivity

      // Retry settings
      retryWrites: true,
      retryReads: true,

      // TLS/SSL settings (for production)
      ...(process.env.NODE_ENV === 'production' && {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
      }),
    },
  },

  // Collection names for consistent referencing
  collections: {
    TEAMS: 'teams',
    MATCHES: 'matches',
    LEAGUES: 'leagues',
    PLAYERS: 'players',
    LINEUPS: 'lineups',
    SCORES: 'scores',
    TOURNAMENTS: 'tournaments',
    USERS: 'users',
  },

  // Index configurations for optimal query performance
  indexes: {
    teams: [
      { name: 1 },           // Team name index
      { league: 1 },         // League reference index
      { createdAt: -1 },     // Sort by creation date
    ],
    matches: [
      { date: -1 },          // Match date index for sorting
      { league: 1 },         // League reference index
      { status: 1 },         // Match status index
      { homeTeam: 1, awayTeam: 1 }, // Team matchup index
    ],
    leagues: [
      { name: 1 },           // League name index
      { status: 1 },         // League status index
      { season: 1 },         // Season index
    ],
    players: [
      { name: 1 },           // Player name index
      { team: 1 },           // Team reference index
      { position: 1 },       // Player position index
    ],
  },

  // Validation schemas (can be extended with mongoose schemas)
  schemas: {
    team: {
      name: { type: String, required: true, unique: true },
      league: { type: String, required: true },
      players: [{ type: String }], // Array of player IDs
      captain: { type: String },
      coach: { type: String },
      founded: { type: Date },
      homeGround: { type: String },
      logo: { type: String },
    },
    match: {
      homeTeam: { type: String, required: true },
      awayTeam: { type: String, required: true },
      league: { type: String, required: true },
      date: { type: Date, required: true },
      venue: { type: String, required: true },
      status: {
        type: String,
        enum: ['scheduled', 'live', 'completed', 'cancelled'],
        default: 'scheduled'
      },
      result: {
        winner: { type: String },
        homeScore: { type: Number, default: 0 },
        awayScore: { type: Number, default: 0 },
      },
    },
    league: {
      name: { type: String, required: true, unique: true },
      season: { type: String, required: true },
      teams: [{ type: String }], // Array of team IDs
      status: {
        type: String,
        enum: ['active', 'completed', 'upcoming'],
        default: 'active'
      },
      startDate: { type: Date },
      endDate: { type: Date },
    },
  },
};

module.exports = config;
