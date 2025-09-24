/**
 * MongoDB Connection Configuration
 * Connection-specific settings for MongoDB
 */

// Load environment variables
require('dotenv').config();

const connectionConfig = {
  // Database connection settings
  mongodb: {
    // Connection URI - supports both local and cloud MongoDB
    uri: process.env.MONGO_URL,

    // Database name
    databaseName: process.env.DB_NAME || 'cricket-pro',

    // Connection options for optimal performance and reliability
    options: {
      // Connection pool settings - optimized for Next.js applications
      maxPoolSize: 20,          // Increased for better concurrent request handling
      minPoolSize: 5,           // Maintain more connections to reduce connection overhead
      maxIdleTimeMS: 60000,     // Increased idle time for connection reuse
      serverSelectionTimeoutMS: 10000,  // Increased timeout for better reliability
      socketTimeoutMS: 60000,   // Increased socket timeout for long-running operations

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
