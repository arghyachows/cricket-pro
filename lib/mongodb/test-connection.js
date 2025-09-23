/**
 * Database Connection Test
 * Test script to verify MongoDB connection and basic operations
 */

const { initializeDatabase, testConnection, getDatabaseStats, TeamModel, MatchModel, LeagueModel } = require('./index');

async function testDatabaseConnection() {
  console.log('🧪 Testing MongoDB Database Connection...\n');

  try {
    // Test 1: Initialize database connection
    console.log('1️⃣  Testing database initialization...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully\n');

    // Test 2: Test basic connection
    console.log('2️⃣  Testing basic connection...');
    const isConnected = await testConnection();
    console.log(`✅ Connection test: ${isConnected ? 'PASSED' : 'FAILED'}\n`);

    // Test 3: Get database statistics
    console.log('3️⃣  Getting database statistics...');
    const stats = await getDatabaseStats();
    console.log('✅ Database Stats:', JSON.stringify(stats, null, 2), '\n');

    // Test 4: Test model operations
    console.log('4️⃣  Testing model operations...');

    // Create a test league
    console.log('   Creating test league...');
    const testLeague = await LeagueModel.createLeague({
      name: 'Test Premier League',
      season: '2024',
      format: 't20',
      description: 'Test league for database testing'
    });
    console.log(`   ✅ Created league: ${testLeague.name} (${testLeague._id})\n`);

    // Create test teams
    console.log('   Creating test teams...');
    const testTeam1 = await TeamModel.createTeam({
      name: 'Test Team Alpha',
      league: 'Test Premier League',
      captain: 'Captain Alpha',
      homeGround: 'Alpha Stadium'
    });
    console.log(`   ✅ Created team: ${testTeam1.name} (${testTeam1._id})`);

    const testTeam2 = await TeamModel.createTeam({
      name: 'Test Team Beta',
      league: 'Test Premier League',
      captain: 'Captain Beta',
      homeGround: 'Beta Stadium'
    });
    console.log(`   ✅ Created team: ${testTeam2.name} (${testTeam2._id})\n`);

    // Create a test match
    console.log('   Creating test match...');
    const testMatch = await MatchModel.createMatch({
      homeTeam: testTeam1._id,
      awayTeam: testTeam2._id,
      league: 'Test Premier League',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      venue: 'Test Stadium'
    });
    console.log(`   ✅ Created match: ${testTeam1.name} vs ${testTeam2.name} (${testMatch._id})\n`);

    // Test 5: Query operations
    console.log('5️⃣  Testing query operations...');

    // Get all teams
    const teams = await TeamModel.getAllTeams();
    console.log(`   ✅ Found ${teams.length} teams`);

    // Get all leagues
    const leagues = await LeagueModel.getAllLeagues();
    console.log(`   ✅ Found ${leagues.length} leagues`);

    // Get all matches
    const matches = await MatchModel.getAllMatches();
    console.log(`   ✅ Found ${matches.length} matches\n`);

    // Test 6: Update operations
    console.log('6️⃣  Testing update operations...');

    // Update match result
    const updatedMatch = await MatchModel.updateMatchResult(testMatch._id, {
      winner: testTeam1._id,
      homeScore: 185,
      awayScore: 172
    });
    console.log(`   ✅ Updated match result: ${updatedMatch.result.homeScore}-${updatedMatch.result.awayScore}\n`);

    // Test 7: Get league standings
    console.log('7️⃣  Testing league standings...');
    const standings = await LeagueModel.getLeagueStandings(testLeague._id);
    console.log(`   ✅ League standings calculated: ${standings.length} teams\n`);

    // Test 8: Cleanup (optional - comment out if you want to keep test data)
    console.log('8️⃣  Cleaning up test data...');
    await MatchModel.deleteMatch(testMatch._id);
    await TeamModel.deleteTeam(testTeam1._id);
    await TeamModel.deleteTeam(testTeam2._id);
    await LeagueModel.deleteLeague(testLeague._id);
    console.log('   ✅ Test data cleaned up\n');

    console.log('🎉 All database tests passed successfully!');
    console.log('✅ MongoDB connection and operations are working correctly');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('\n🏁 Database test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
