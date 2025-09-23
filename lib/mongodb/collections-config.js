/**
 * MongoDB Collections Configuration
 * Collection names and schema definitions for MongoDB
 */

const collectionsConfig = {
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

module.exports = collectionsConfig;
