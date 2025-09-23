/**
 * MongoDB Configuration Provider
 * Centralized configuration provider that combines all MongoDB configurations
 */

const connectionConfig = require('./connection-config');
const collectionsConfig = require('./collections-config');
const indexesConfig = require('./indexes-config');

// Combine all configurations into a single, centralized config object
const config = {
  ...connectionConfig,
  ...collectionsConfig,
  ...indexesConfig,
};

// Export individual configs for specific use cases
module.exports = config;

// Also export individual configs for direct access when needed
module.exports.connectionConfig = connectionConfig;
module.exports.collectionsConfig = collectionsConfig;
module.exports.indexesConfig = indexesConfig;
