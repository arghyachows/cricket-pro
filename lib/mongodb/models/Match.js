/**
 * Match Model
 * Handles all match-related database operations
 */

const dbConnection = require('../connection');
const config = require('../config');

class MatchModel {
  constructor() {
    this.collectionName = config.collections.MATCHES;
  }

  /**
   * Get all matches with optional filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} Array of matches
   */
  async getAllMatches(filters = {}, options = {}) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const query = {};

      // Apply filters
      if (filters.league) query.league = filters.league;
      if (filters.status) query.status = filters.status;
      if (filters.homeTeam) query.homeTeam = filters.homeTeam;
      if (filters.awayTeam) query.awayTeam = filters.awayTeam;
      if (filters.venue) query.venue = { $regex: filters.venue, $options: 'i' };

      // Date range filters
      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) query.date.$lte = new Date(filters.endDate);
      }

      // Build aggregation pipeline
      const pipeline = [{ $match: query }];

      // Add sorting (default by date descending)
      const sortOption = options.sort || { date: -1 };
      pipeline.push({ $sort: sortOption });

      // Add pagination
      if (options.skip) pipeline.push({ $skip: options.skip });
      if (options.limit) pipeline.push({ $limit: options.limit });

      const matches = await collection.aggregate(pipeline).toArray();
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  /**
   * Get match by ID
   * @param {string} matchId - Match ID
   * @returns {Promise<Object|null>} Match object or null
   */
  async getMatchById(matchId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);
      const match = await collection.findOne({ _id: matchId });
      return match;
    } catch (error) {
      console.error('Error fetching match by ID:', error);
      throw error;
    }
  }

  /**
   * Get matches by team
   * @param {string} teamId - Team ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of matches involving the team
   */
  async getMatchesByTeam(teamId, options = {}) {
    return this.getAllMatches(
      { $or: [{ homeTeam: teamId }, { awayTeam: teamId }] },
      { sort: { date: -1 }, ...options }
    );
  }

  /**
   * Get matches by league
   * @param {string} league - League name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of matches in the league
   */
  async getMatchesByLeague(league, options = {}) {
    return this.getAllMatches({ league }, { sort: { date: -1 }, ...options });
  }

  /**
   * Create new match
   * @param {Object} matchData - Match data
   * @returns {Promise<Object>} Created match object
   */
  async createMatch(matchData) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Validate required fields
      if (!matchData.homeTeam || !matchData.awayTeam || !matchData.league || !matchData.date) {
        throw new Error('Home team, away team, league, and date are required');
      }

      // Check if teams exist (basic validation)
      const teamCollection = dbConnection.getCollection(config.collections.TEAMS);
      const [homeTeam, awayTeam] = await Promise.all([
        teamCollection.findOne({ _id: matchData.homeTeam }),
        teamCollection.findOne({ _id: matchData.awayTeam })
      ]);

      if (!homeTeam) throw new Error('Home team not found');
      if (!awayTeam) throw new Error('Away team not found');

      const newMatch = {
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        league: matchData.league,
        date: new Date(matchData.date),
        venue: matchData.venue,
        status: matchData.status || 'scheduled',
        result: matchData.result || {
          winner: null,
          homeScore: 0,
          awayScore: 0,
        },
        weather: matchData.weather,
        toss: matchData.toss,
        umpires: matchData.umpires || [],
        commentary: matchData.commentary || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(newMatch);
      return { ...newMatch, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  /**
   * Update match
   * @param {string} matchId - Match ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated match object
   */
  async updateMatch(matchId, updateData) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Check if match exists
      const existingMatch = await this.getMatchById(matchId);
      if (!existingMatch) {
        throw new Error('Match not found');
      }

      // Prepare update object
      const update = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Handle special cases
      if (updateData.date) update.date = new Date(updateData.date);
      if (updateData.result) {
        update.result = { ...existingMatch.result, ...updateData.result };
      }

      // Remove undefined values
      Object.keys(update).forEach(key =>
        update[key] === undefined && delete update[key]
      );

      const result = await collection.findOneAndUpdate(
        { _id: matchId },
        { $set: update },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }

  /**
   * Update match result
   * @param {string} matchId - Match ID
   * @param {Object} resultData - Result data
   * @returns {Promise<Object>} Updated match object
   */
  async updateMatchResult(matchId, resultData) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const update = {
        'result.winner': resultData.winner,
        'result.homeScore': resultData.homeScore || 0,
        'result.awayScore': resultData.awayScore || 0,
        status: 'completed',
        updatedAt: new Date(),
      };

      const result = await collection.findOneAndUpdate(
        { _id: matchId },
        { $set: update },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
  }

  /**
   * Delete match
   * @param {string} matchId - Match ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteMatch(matchId) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      // Check if match exists
      const existingMatch = await this.getMatchById(matchId);
      if (!existingMatch) {
        throw new Error('Match not found');
      }

      const result = await collection.deleteOne({ _id: matchId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }

  /**
   * Add commentary to match
   * @param {string} matchId - Match ID
   * @param {Object} commentaryData - Commentary data
   * @returns {Promise<Object>} Updated match object
   */
  async addCommentary(matchId, commentaryData) {
    try {
      const collection = dbConnection.getCollection(this.collectionName);

      const commentary = {
        text: commentaryData.text,
        over: commentaryData.over,
        timestamp: new Date(),
        type: commentaryData.type || 'general', // 'wicket', 'boundary', 'general'
      };

      const result = await collection.findOneAndUpdate(
        { _id: matchId },
        {
          $push: { commentary: commentary },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      console.error('Error adding commentary:', error);
      throw error;
    }
  }

  /**
   * Get upcoming matches
   * @param {number} limit - Number of matches to return
   * @returns {Promise<Array>} Array of upcoming matches
   */
  async getUpcomingMatches(limit = 10) {
    const now = new Date();
    return this.getAllMatches(
      {
        date: { $gte: now },
        status: { $in: ['scheduled', 'live'] }
      },
      { limit, sort: { date: 1 } }
    );
  }

  /**
   * Get recent matches
   * @param {number} limit - Number of matches to return
   * @returns {Promise<Array>} Array of recent matches
   */
  async getRecentMatches(limit = 10) {
    const now = new Date();
    return this.getAllMatches(
      {
        date: { $lt: now },
        status: 'completed'
      },
      { limit, sort: { date: -1 } }
    );
  }

  /**
   * Get live matches
   * @returns {Promise<Array>} Array of live matches
   */
  async getLiveMatches() {
    return this.getAllMatches({ status: 'live' }, { sort: { date: -1 } });
  }

  /**
   * Get match statistics
   * @param {string} matchId - Match ID
   * @returns {Promise<Object>} Match statistics
   */
  async getMatchStats(matchId) {
    try {
      const match = await this.getMatchById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const collection = dbConnection.getCollection(this.collectionName);

      // Get basic match info
      const stats = {
        matchId,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        date: match.date,
        venue: match.venue,
        status: match.status,
        result: match.result,
        commentaryCount: match.commentary ? match.commentary.length : 0,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      };

      // Add weather info if available
      if (match.weather) {
        stats.weather = match.weather;
      }

      // Add toss info if available
      if (match.toss) {
        stats.toss = match.toss;
      }

      return stats;
    } catch (error) {
      console.error('Error getting match statistics:', error);
      throw error;
    }
  }
}

module.exports = new MatchModel();
