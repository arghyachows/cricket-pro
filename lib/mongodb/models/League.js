/**
 * League Model
 * Handles all league-related database operations
 */

const dbConnection = require('../connection');
const config = require('../config');

class LeagueModel {
  constructor() {
    this.collectionName = config.collections.LEAGUES;
  }

  /**
   * Get all leagues with optional filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} Array of leagues
   */
  async getAllLeagues(filters = {}, options = {}) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const query = {};

      // Apply filters
      if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
      if (filters.status) query.status = filters.status;
      if (filters.season) query.season = filters.season;

      // Build aggregation pipeline
      const pipeline = [{ $match: query }];

      // Add sorting (default by name)
      const sortOption = options.sort || { name: 1 };
      pipeline.push({ $sort: sortOption });

      // Add pagination
      if (options.skip) pipeline.push({ $skip: options.skip });
      if (options.limit) pipeline.push({ $limit: options.limit });

      const leagues = await collection.aggregate(pipeline).toArray();
      return leagues;
    } catch (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }
  }

  /**
   * Get league by ID
   * @param {string} leagueId - League ID
   * @returns {Promise<Object|null>} League object or null
   */
  async getLeagueById(leagueId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);
      const league = await collection.findOne({ _id: leagueId });
      return league;
    } catch (error) {
      console.error('Error fetching league by ID:', error);
      throw error;
    }
  }

  /**
   * Get league by name
   * @param {string} leagueName - League name
   * @returns {Promise<Object|null>} League object or null
   */
  async getLeagueByName(leagueName) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);
      const league = await collection.findOne({
        name: { $regex: new RegExp(`^${leagueName}$`, 'i') }
      });
      return league;
    } catch (error) {
      console.error('Error fetching league by name:', error);
      throw error;
    }
  }

  /**
   * Get leagues by season
   * @param {string} season - Season name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of leagues in the season
   */
  async getLeaguesBySeason(season, options = {}) {
    return this.getAllLeagues({ season }, { sort: { name: 1 }, ...options });
  }

  /**
   * Create new league
   * @param {Object} leagueData - League data
   * @returns {Promise<Object>} Created league object
   */
  async createLeague(leagueData) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Validate required fields
      if (!leagueData.name || !leagueData.season) {
        throw new Error('League name and season are required');
      }

      // Check if league already exists
      const existingLeague = await this.getLeagueByName(leagueData.name);
      if (existingLeague) {
        throw new Error('League with this name already exists');
      }

      const newLeague = {
        name: leagueData.name,
        season: leagueData.season,
        teams: leagueData.teams || [],
        status: leagueData.status || 'active',
        format: leagueData.format || 't20', // t20, odi, test
        startDate: leagueData.startDate ? new Date(leagueData.startDate) : null,
        endDate: leagueData.endDate ? new Date(leagueData.endDate) : null,
        rules: leagueData.rules || {},
        prizeMoney: leagueData.prizeMoney,
        sponsor: leagueData.sponsor,
        description: leagueData.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(newLeague);
      return { ...newLeague, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  }

  /**
   * Update league
   * @param {string} leagueId - League ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated league object
   */
  async updateLeague(leagueId, updateData) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Check if league exists
      const existingLeague = await this.getLeagueById(leagueId);
      if (!existingLeague) {
        throw new Error('League not found');
      }

      // Prepare update object
      const update = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Handle special cases
      if (updateData.startDate) update.startDate = new Date(updateData.startDate);
      if (updateData.endDate) update.endDate = new Date(updateData.endDate);

      // Remove undefined values
      Object.keys(update).forEach(key =>
        update[key] === undefined && delete update[key]
      );

      const result = await collection.findOneAndUpdate(
        { _id: leagueId },
        { $set: update },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error updating league:', error);
      throw error;
    }
  }

  /**
   * Delete league
   * @param {string} leagueId - League ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteLeague(leagueId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Check if league exists
      const existingLeague = await this.getLeagueById(leagueId);
      if (!existingLeague) {
        throw new Error('League not found');
      }

      const result = await collection.deleteOne({ _id: leagueId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting league:', error);
      throw error;
    }
  }

  /**
   * Add team to league
   * @param {string} leagueId - League ID
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Updated league object
   */
  async addTeam(leagueId, teamId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const result = await collection.findOneAndUpdate(
        { _id: leagueId },
        {
          $addToSet: { teams: teamId },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error adding team to league:', error);
      throw error;
    }
  }

  /**
   * Remove team from league
   * @param {string} leagueId - League ID
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Updated league object
   */
  async removeTeam(leagueId, teamId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const result = await collection.findOneAndUpdate(
        { _id: leagueId },
        {
          $pull: { teams: teamId },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error removing team from league:', error);
      throw error;
    }
  }

  /**
   * Get league standings
   * @param {string} leagueId - League ID
   * @returns {Promise<Array>} League standings
   */
  async getLeagueStandings(leagueId) {
    try {
      const league = await this.getLeagueById(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      const matchesCollection = dbConnection.getCollection(config.collections.MATCHES);
      const teamsCollection = dbConnection.getCollection(config.collections.TEAMS);

      // Get all teams in the league
      const teams = await teamsCollection.find({ _id: { $in: league.teams } }).toArray();

      // Calculate standings for each team
      const standings = await Promise.all(
        teams.map(async (team) => {
          const matches = await matchesCollection.find({
            league: leagueId,
            $or: [{ homeTeam: team._id }, { awayTeam: team._id }],
            status: 'completed'
          }).toArray();

          let wins = 0, losses = 0, draws = 0, points = 0;

          matches.forEach(match => {
            const isHomeTeam = match.homeTeam.toString() === team._id.toString();
            const isAwayTeam = match.awayTeam.toString() === team._id.toString();

            if (match.result.winner) {
              if (match.result.winner.toString() === team._id.toString()) {
                wins++;
                points += 2; // Assuming 2 points for a win
              } else {
                losses++;
              }
            } else {
              draws++;
              points += 1; // Assuming 1 point for a draw
            }
          });

          return {
            teamId: team._id,
            teamName: team.name,
            played: wins + losses + draws,
            wins,
            losses,
            draws,
            points,
            netRunRate: 0, // This would need more complex calculation
          };
        })
      );

      // Sort by points (descending)
      return standings.sort((a, b) => b.points - a.points);
    } catch (error) {
      console.error('Error getting league standings:', error);
      throw error;
    }
  }

  /**
   * Get active leagues
   * @returns {Promise<Array>} Array of active leagues
   */
  async getActiveLeagues() {
    return this.getAllLeagues({ status: 'active' }, { sort: { name: 1 } });
  }

  /**
   * Get league statistics
   * @param {string} leagueId - League ID
   * @returns {Promise<Object>} League statistics
   */
  async getLeagueStats(leagueId) {
    try {
      const league = await this.getLeagueById(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      const matchesCollection = dbConnection.getCollection(config.collections.MATCHES);

      // Get match statistics
      const [totalMatches, completedMatches, scheduledMatches, liveMatches] = await Promise.all([
        matchesCollection.countDocuments({ league: leagueId }),
        matchesCollection.countDocuments({ league: leagueId, status: 'completed' }),
        matchesCollection.countDocuments({ league: leagueId, status: 'scheduled' }),
        matchesCollection.countDocuments({ league: leagueId, status: 'live' })
      ]);

      // Get team count
      const teamCount = league.teams ? league.teams.length : 0;

      return {
        leagueId,
        leagueName: league.name,
        season: league.season,
        status: league.status,
        totalMatches,
        completedMatches,
        scheduledMatches,
        liveMatches,
        teamCount,
        startDate: league.startDate,
        endDate: league.endDate,
        format: league.format,
        createdAt: league.createdAt,
        updatedAt: league.updatedAt,
      };
    } catch (error) {
      console.error('Error getting league statistics:', error);
      throw error;
    }
  }

  /**
   * Update league status
   * @param {string} leagueId - League ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated league object
   */
  async updateLeagueStatus(leagueId, status) {
    try {
      const validStatuses = ['active', 'completed', 'upcoming', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid league status');
      }

      return this.updateLeague(leagueId, { status });
    } catch (error) {
      console.error('Error updating league status:', error);
      throw error;
    }
  }
}

module.exports = new LeagueModel();
