/**
 * MongoDB Connection Manager
 * Handles database connections with proper error handling and connection pooling
 */

const { MongoClient } = require('mongodb');
const { connectionConfig, indexesConfig } = require('./config');

class DatabaseConnection {
  constructor() {
    this.client = null;
    this.database = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      if (this.isConnected) {
        console.log('Database already connected');
        return;
      }

      console.log('Connecting to MongoDB...');

      // Create MongoDB client with configuration
      this.client = new MongoClient(connectionConfig.mongodb.uri, connectionConfig.mongodb.options);

      // Connect to MongoDB
      await this.client.connect();

      // Get database reference
      this.database = this.client.db(connectionConfig.mongodb.databaseName);

      // Test the connection
      await this.database.admin().ping();

      this.isConnected = true;
      console.log(`✅ Connected to MongoDB: ${connectionConfig.mongodb.databaseName}`);

      // Set up connection event listeners
      this.setupEventListeners();

      // Create indexes for better performance
      await this.createIndexes();

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Set up connection event listeners
   */
  setupEventListeners() {
    if (!this.client) return;

    // Handle connection events
    this.client.on('connectionReady', () => {
      console.log('MongoDB connection ready');
    });

    this.client.on('connectionClosed', (event) => {
      console.log('MongoDB connection closed:', event.reason);
      this.isConnected = false;
    });

    this.client.on('serverHeartbeatFailed', (event) => {
      console.warn('MongoDB server heartbeat failed:', event);
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Create database indexes for optimal performance
   */
  async createIndexes() {
    try {
      console.log('Creating database indexes...');

      // Create indexes for each collection
      for (const [collectionName, indexes] of Object.entries(indexesConfig.indexes)) {
        const collection = this.database.collection(collectionName);

        for (const index of indexes) {
          try {
            await collection.createIndex(index);
          } catch (error) {
            // Index might already exist, which is fine
            if (error.code !== 11000) {
              console.warn(`Failed to create index on ${collectionName}:`, error.message);
            }
          }
        }
      }

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.warn('⚠️  Failed to create some indexes:', error.message);
    }
  }

  /**
   * Get database instance
   * @returns {Db} MongoDB database instance
   */
  getDatabase() {
    if (!this.isConnected || !this.database) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.database;
  }

  /**
   * Get collection instance
   * @param {string} collectionName - Name of the collection
   * @returns {Collection} MongoDB collection instance
   */
  getCollection(collectionName) {
    if (!this.isConnected || !this.database) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.database.collection(collectionName);
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      if (!this.isConnected || !this.database) {
        return false;
      }

      await this.database.admin().ping();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    try {
      if (!this.isConnected || !this.database) {
        throw new Error('Database not connected');
      }

      const stats = await this.database.stats();
      return {
        databaseName: connectionConfig.mongodb.databaseName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        console.log('Disconnecting from MongoDB...');
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        this.database = null;
        console.log('✅ Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Health check for the database connection
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    const isConnected = await this.testConnection();

    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: connectionConfig.mongodb.databaseName,
      connectionString: connectionConfig.mongodb.uri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
    };
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
