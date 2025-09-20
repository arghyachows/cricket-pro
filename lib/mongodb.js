import { MongoClient } from 'mongodb';



/**
 * MongoDB configuration and connection management
 */
class MongoDBConfig {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Get MongoDB connection string from environment variables
   */
  getConnectionString() {
    const url = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!url) {
      throw new Error('MongoDB connection string not found. Please set MONGO_URL or MONGODB_URI environment variable.');
    }
    return url;
  }

  /**
   * Get database name from environment variables
   */
  getDatabaseName() {
    return process.env.DB_NAME || process.env.MONGODB_DB || 'cricket_pavilion';
  }

  /**
   * Get MongoDB client options
   */
  getClientOptions() {
    return {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
      connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT) || 10000,
      retryWrites: process.env.MONGO_RETRY_WRITES !== 'false',
      retryReads: process.env.MONGO_RETRY_READS !== 'false',
      // Add more options as needed
    };
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    if (this.isConnected && this.client) {
      return this.db;
    }

    try {
      const connectionString = this.getConnectionString();
      const dbName = this.getDatabaseName();
      const options = this.getClientOptions();

      console.log('Connecting to MongoDB...');
      this.client = new MongoClient(connectionString, options);
      await this.client.connect();

      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log(`Connected to MongoDB database: ${dbName}`);

      // Handle connection events
      this.client.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('MongoDB connection closed');
        this.isConnected = false;
      });

      return this.db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Get database instance
   */
  async getDatabase() {
    if (!this.isConnected || !this.db) {
      await this.connect();
    }
    return this.db;
  }

  /**
   * Get MongoDB client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Close MongoDB connection
   */
  async close() {
    if (this.client) {
      console.log('Closing MongoDB connection...');
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('MongoDB connection closed');
    }
  }

  /**
   * Check if connected to MongoDB
   */
  isDbConnected() {
    return this.isConnected;
  }

  /**
   * Ping MongoDB to check connection health
   */
  async ping() {
    try {
      const database = await this.getDatabase();
      await database.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB ping failed:', error);
      this.isConnected = false;
      return false;
    }
  }
}

// Create singleton instance
const mongoConfig = new MongoDBConfig();

// Export the configuration instance and utility functions
export default mongoConfig;

/**
 * Get database instance (convenience function)
 */
export async function getDatabase() {
  return await mongoConfig.getDatabase();
}

/**
 * Get MongoDB client instance (convenience function)
 */
export function getClient() {
  return mongoConfig.getClient();
}

/**
 * Close MongoDB connection (convenience function)
 */
export async function closeConnection() {
  return await mongoConfig.close();
}

/**
 * Check connection status (convenience function)
 */
export function isConnected() {
  return mongoConfig.isDbConnected();
}

/**
 * Ping database (convenience function)
 */
export async function pingDatabase() {
  return await mongoConfig.ping();
}
