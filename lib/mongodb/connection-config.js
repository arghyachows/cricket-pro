/**
 * MongoDB Connection Configuration
 * Connection-specific settings for MongoDB
 */

const connectionConfig = {
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
};

module.exports = connectionConfig;
