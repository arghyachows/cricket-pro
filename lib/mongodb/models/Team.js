/**
 * Team Model
 * Handles all team-related database operations
 */

const dbConnection = require('../connection');
const config = require('../config');

class TeamModel {
  constructor() {
    this.collectionName = config.collections.TEAMS;
  }

  /**
   * Get all teams with optional filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} Array of teams
   */
  async getAllTeams(filters = {}, options = {}) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const query = {};

      // Apply filters
      if (filters.league) query.league = filters.league;
      if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
      if (filters.status) query.status = filters.status;

      // Build aggregation pipeline for better performance
      const pipeline = [{ $match: query }];

      // Add sorting
      const sortOption = options.sort || { name: 1 };
      pipeline.push({ $sort: sortOption });

      // Add pagination
      if (options.skip) pipeline.push({ $skip: options.skip });
      if (options.limit) pipeline.push({ $limit: options.limit });

      const teams = await collection.aggregate(pipeline).toArray();
      return teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  /**
   * Get team by ID
   * @param {string} teamId - Team ID
   * @returns {Promise<Object|null>} Team object or null
   */
  async getTeamById(teamId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);
      const team = await collection.findOne({ _id: teamId });
      return team;
    } catch (error) {
      console.error('Error fetching team by ID:', error);
      throw error;
    }
  }

  /**
   * Get team by name
   * @param {string} teamName - Team name
   * @returns {Promise<Object|null>} Team object or null
   */
  async getTeamByName(teamName) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);
      const team = await collection.findOne({
        name: { $regex: new RegExp(`^${teamName}$`, 'i') }
      });
      return team;
    } catch (error) {
      console.error('Error fetching team by name:', error);
      throw error;
    }
  }

  /**
   * Create new team
   * @param {Object} teamData - Team data
   * @returns {Promise<Object>} Created team object
   */
  async createTeam(teamData) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Validate required fields
      if (!teamData.name || !teamData.league) {
        throw new Error('Team name and league are required');
      }

      // Check if team already exists
      const existingTeam = await this.getTeamByName(teamData.name);
      if (existingTeam) {
        throw new Error('Team with this name already exists');
      }

      const newTeam = {
        name: teamData.name,
        league: teamData.league,
        players: teamData.players || [],
        captain: teamData.captain,
        coach: teamData.coach,
        founded: teamData.founded || new Date(),
        homeGround: teamData.homeGround,
        logo: teamData.logo,
        status: teamData.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(newTeam);
      return { ...newTeam, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  /**
   * Update team
   * @param {string} teamId - Team ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated team object
   */
  async updateTeam(teamId, updateData) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Check if team exists
      const existingTeam = await this.getTeamById(teamId);
      if (!existingTeam) {
        throw new Error('Team not found');
      }

      // Prepare update object
      const update = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Remove undefined values
      Object.keys(update).forEach(key =>
        update[key] === undefined && delete update[key]
      );

      const result = await collection.findOneAndUpdate(
        { _id: teamId },
        { $set: update },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  /**
   * Delete team
   * @param {string} teamId - Team ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTeam(teamId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Check if team exists
      const existingTeam = await this.getTeamById(teamId);
      if (!existingTeam) {
        throw new Error('Team not found');
      }

      const result = await collection.deleteOne({ _id: teamId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  /**
   * Add player to team
   * @param {string} teamId - Team ID
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} Updated team object
   */
  async addPlayer(teamId, playerId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const result = await collection.findOneAndUpdate(
        { _id: teamId },
        {
          $addToSet: { players: playerId },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error adding player to team:', error);
      throw error;
    }
  }

  /**
   * Remove player from team
   * @param {string} teamId - Team ID
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} Updated team object
   */
  async removePlayer(teamId, playerId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const result = await collection.findOneAndUpdate(
        { _id: teamId },
        {
          $pull: { players: playerId },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error removing player from team:', error);
      throw error;
    }
  }

  /**
   * Get teams by league
   * @param {string} league - League name
   * @returns {Promise<Array>} Array of teams in the league
   */
  async getTeamsByLeague(league) {
    return this.getAllTeams({ league }, { sort: { name: 1 } });
  }

  /**
   * Get team statistics
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Team statistics
   */
  async getTeamStats(teamId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);
      const team = await this.getTeamById(teamId);

      if (!team) {
        throw new Error('Team not found');
      }

      // Get match statistics from matches collection
      const matchesCollection = dbConnection.getCollection(config.collections.MATCHES);

      const [wins, losses, draws] = await Promise.all([
        matchesCollection.countDocuments({
          $or: [
            { homeTeam: teamId, 'result.winner': teamId },
            { awayTeam: teamId, 'result.winner': teamId }
          ]
        }),
        matchesCollection.countDocuments({
          $or: [
            { homeTeam: teamId, 'result.winner': { $ne: teamId, $exists: true } },
            { awayTeam: teamId, 'result.winner': { $ne: teamId, $exists: true } }
          ]
        }),
        matchesCollection.countDocuments({
          $or: [{ homeTeam: teamId }, { awayTeam: teamId }],
          'result.winner': { $exists: false }
        })
      ]);

      return {
        teamId,
        teamName: team.name,
        totalMatches: wins + losses + draws,
        wins,
        losses,
        draws,
        winPercentage: ((wins / (wins + losses + draws)) * 100).toFixed(1)
      };
    } catch (error) {
      console.error('Error getting team statistics:', error);
      throw error;
    }
  }
}

module.exports = new TeamModel();
