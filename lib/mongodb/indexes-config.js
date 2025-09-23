/**
 * MongoDB Indexes Configuration
 * Index definitions for optimal query performance
 */

const indexesConfig = {
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
};

module.exports = indexesConfig;
