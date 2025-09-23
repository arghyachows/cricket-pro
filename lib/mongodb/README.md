# MongoDB Database Configuration

This directory contains the complete MongoDB database configuration for the Cricket Pro application, featuring a well-structured, reusable, and scalable database layer.

## 🏗️ Architecture

The database layer follows a modular architecture with clear separation of concerns:

```
lib/mongodb/
├── config.js          # Database configuration and settings
├── connection.js      # Database connection manager
├── models/            # Data models and business logic
│   ├── Team.js       # Team-related operations
│   ├── Match.js      # Match-related operations
│   └── League.js     # League-related operations
├── index.js          # Main entry point
└── test-connection.js # Database testing utilities
```

## 🚀 Features

### ✅ Connection Management
- **Connection Pooling**: Optimized connection pooling with configurable limits
- **Auto-reconnection**: Automatic reconnection on connection failures
- **Health Monitoring**: Built-in health checks and connection status monitoring
- **Graceful Shutdown**: Proper connection cleanup on application termination

### ✅ Performance Optimizations
- **Database Indexes**: Pre-configured indexes for optimal query performance
- **Aggregation Pipelines**: Efficient data aggregation for complex queries
- **Connection Options**: Optimized MongoDB driver settings
- **Query Optimization**: Efficient query patterns and filtering

### ✅ Data Models
- **Team Model**: Complete team management with statistics
- **Match Model**: Match scheduling, results, and commentary
- **League Model**: League management with standings calculation

### ✅ Error Handling
- **Comprehensive Error Handling**: Robust error handling throughout
- **Input Validation**: Data validation and sanitization
- **Transaction Support**: Safe database operations
- **Logging**: Detailed logging for debugging

## 📋 Configuration

### Environment Variables

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cricket-pro
DB_NAME=cricket-pro
NODE_ENV=development
```

### Connection Options

The configuration includes optimized settings for:
- Connection pooling (maxPoolSize, minPoolSize)
- Timeout settings (serverSelectionTimeoutMS, socketTimeoutMS)
- Retry mechanisms (retryWrites, retryReads)
- TLS/SSL for production environments

## 🛠️ Usage

### Basic Usage

```javascript
const { initializeDatabase, TeamModel, MatchModel, LeagueModel } = require('./lib/mongodb');

// Initialize database connection
await initializeDatabase();

// Use models
const teams = await TeamModel.getAllTeams();
const matches = await MatchModel.getUpcomingMatches();
const leagues = await LeagueModel.getActiveLeagues();
```

### Advanced Usage

```javascript
const { dbConnection } = require('./lib/mongodb');

// Direct database operations
const db = dbConnection.getDatabase();
const collection = dbConnection.getCollection('teams');

// Health check
const health = await dbConnection.healthCheck();

// Statistics
const stats = await dbConnection.getStats();
```

## 🧪 Testing

Run the database test suite to verify everything is working:

```bash
node lib/mongodb/test-connection.js
```

The test suite includes:
- Connection initialization
- Model operations (CRUD)
- Query operations
- Update operations
- Data cleanup

## 📊 Database Schema

### Collections

- **teams**: Team information and player rosters
- **matches**: Match details, results, and commentary
- **leagues**: League configuration and settings

### Indexes

Pre-configured indexes for optimal performance:
- Team name and league indexes
- Match date and status indexes
- League name and season indexes

## 🔧 Best Practices

### Connection Management
- Always initialize the database connection before use
- Use the singleton connection instance
- Handle connection errors gracefully
- Monitor connection health regularly

### Data Operations
- Use the model methods instead of direct collection access
- Implement proper error handling
- Use transactions for multi-document operations
- Validate data before insertion

### Performance
- Use aggregation pipelines for complex queries
- Implement pagination for large datasets
- Monitor query performance
- Use indexes effectively

## 🔒 Security

- Environment variable configuration
- Input validation and sanitization
- Connection encryption for production
- Credential management

## 📈 Monitoring

The database layer includes built-in monitoring:
- Connection health checks
- Performance statistics
- Error logging
- Query performance tracking

## 🤝 Contributing

When adding new models or features:
1. Follow the existing pattern in the models directory
2. Add appropriate indexes in the configuration
3. Include comprehensive error handling
4. Add tests for new functionality
5. Update this documentation

## 📝 Notes

- The database layer is designed to be scalable and maintainable
- All models include comprehensive error handling
- Configuration is centralized and environment-aware
- The test suite ensures reliability and correctness
