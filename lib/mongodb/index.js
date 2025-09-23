/**
 * MongoDB Database Module
 * Main entry point for all database operations
 */

// Export database connection
const dbConnection = require('./connection');

// Export models
const TeamModel = require('./models/Team');
const MatchModel = require('./models/Match');
const LeagueModel = require('./models/League');

// Export configuration
const config = require('./config');

// Initialize database connection
async function initializeDatabase() {
  try {
    await dbConnection.connect();
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Health check function
async function healthCheck() {
  return await dbConnection.healthCheck();
}

// Get database statistics
async function getDatabaseStats() {
  return await dbConnection.getStats();
}

// Test database connection
async function testConnection() {
  return await dbConnection.testConnection();
}

// Close database connection
async function closeConnection() {
  return await dbConnection.disconnect();
}

// Export everything
module.exports = {
  // Connection
  dbConnection,
  initializeDatabase,
  healthCheck,
  getDatabaseStats,
  testConnection,
  closeConnection,

  // Models
  TeamModel,
  MatchModel,
  LeagueModel,

  // Configuration
  config,
};
