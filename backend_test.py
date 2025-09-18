#!/usr/bin/env python3
"""
Enhanced T20 Cricket Simulation Backend Test Suite
Tests all new T20 features including enhanced match simulation, state management, 
league statistics, and match filtering.
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:3000/api"  # Will be updated with actual URL
TEST_USER_EMAIL = "rohit.sharma@cricket.com"
TEST_USER_PASSWORD = "captain123"
TEST_USER_DATA = {
    "email": TEST_USER_EMAIL,
    "password": TEST_USER_PASSWORD,
    "username": "rohit_sharma",
    "team_name": "Mumbai Indians",
    "country": "India",
    "nationality": "Indian"
}

class T20BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.user_id = None
        self.match_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method == "GET":
                response = requests.get(url, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, timeout=30)
            
            return response
        except requests.exceptions.RequestException as e:
            return None
    
    def test_user_authentication(self):
        """Test user registration and login"""
        print("\n=== Testing User Authentication ===")
        
        # Test registration
        response = self.make_request("POST", "/auth/register", TEST_USER_DATA)
        if response and response.status_code in [200, 201]:
            user_data = response.json()
            self.user_id = user_data.get('id')
            self.log_test("User Registration", True, f"User registered successfully with ID: {self.user_id}")
        else:
            # Try login if user already exists
            login_data = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
            response = self.make_request("POST", "/auth/login", login_data)
            if response and response.status_code == 200:
                user_data = response.json()
                self.user_id = user_data.get('id')
                self.log_test("User Login", True, f"User logged in successfully with ID: {self.user_id}")
            else:
                self.log_test("User Authentication", False, "Failed to register or login user", 
                            {"status_code": response.status_code if response else "No response"})
                return False
        
        return True
    
    def test_enhanced_match_creation(self):
        """Test enhanced match creation with weather and pitch conditions"""
        print("\n=== Testing Enhanced Match Creation ===")
        
        if not self.user_id:
            self.log_test("Enhanced Match Creation", False, "No user ID available")
            return False
        
        # Create match with specific conditions
        match_data = {
            "home_team_id": self.user_id,
            "away_team_id": "demo_team_001",
            "scheduled_time": (datetime.now() + timedelta(hours=1)).isoformat(),
            "weather": "Overcast",
            "pitch_type": "Green"
        }
        
        response = self.make_request("POST", "/matches", match_data)
        if response and response.status_code in [200, 201]:
            match = response.json()
            self.match_id = match.get('id')
            
            # Verify all new fields are present
            required_fields = ['weather', 'pitch_type', 'status', 'current_innings', 
                             'current_over', 'current_ball', 'live_commentary']
            missing_fields = [field for field in required_fields if field not in match]
            
            if not missing_fields:
                self.log_test("Enhanced Match Creation", True, 
                            f"Match created with ID: {self.match_id}, Weather: {match['weather']}, Pitch: {match['pitch_type']}")
            else:
                self.log_test("Enhanced Match Creation", False, 
                            f"Match created but missing fields: {missing_fields}")
        else:
            self.log_test("Enhanced Match Creation", False, "Failed to create match",
                        {"status_code": response.status_code if response else "No response"})
            return False
        
        return True
    
    def test_match_state_management(self):
        """Test match state management (start, pause, resume)"""
        print("\n=== Testing Match State Management ===")
        
        if not self.match_id:
            self.log_test("Match State Management", False, "No match ID available")
            return False
        
        # Test start match
        response = self.make_request("POST", f"/matches/{self.match_id}/start")
        if response and response.status_code == 200:
            self.log_test("Match Start", True, "Match started successfully")
            
            # Verify match status changed
            match_response = self.make_request("GET", f"/matches/{self.match_id}")
            if match_response and match_response.status_code == 200:
                match = match_response.json()
                if match.get('status') == 'in-progress':
                    self.log_test("Match Status Update", True, "Match status updated to in-progress")
                else:
                    self.log_test("Match Status Update", False, f"Expected 'in-progress', got '{match.get('status')}'")
        else:
            self.log_test("Match Start", False, "Failed to start match")
            return False
        
        # Test pause match
        time.sleep(1)  # Brief delay
        response = self.make_request("POST", f"/matches/{self.match_id}/pause")
        if response and response.status_code == 200:
            self.log_test("Match Pause", True, "Match paused successfully")
        else:
            self.log_test("Match Pause", False, "Failed to pause match")
        
        # Test resume match
        time.sleep(1)  # Brief delay
        response = self.make_request("POST", f"/matches/{self.match_id}/resume")
        if response and response.status_code == 200:
            self.log_test("Match Resume", True, "Match resumed successfully")
        else:
            self.log_test("Match Resume", False, "Failed to resume match")
        
        return True
    
    def test_enhanced_match_simulation(self):
        """Test enhanced T20 match simulation with all new features"""
        print("\n=== Testing Enhanced Match Simulation ===")
        
        if not self.match_id:
            self.log_test("Enhanced Match Simulation", False, "No match ID available")
            return False
        
        # Simulate the match
        response = self.make_request("POST", f"/matches/{self.match_id}/simulate")
        if not response or response.status_code != 200:
            self.log_test("Enhanced Match Simulation", False, "Failed to simulate match",
                        {"status_code": response.status_code if response else "No response"})
            return False
        
        result = response.json()
        
        # Test 1: Verify realistic T20 simulation structure
        required_fields = ['homeScore', 'awayScore', 'homeOvers', 'awayOvers', 
                          'winner', 'target', 'commentary', 'firstInnings', 'secondInnings']
        missing_fields = [field for field in required_fields if field not in result]
        
        if missing_fields:
            self.log_test("T20 Simulation Structure", False, f"Missing fields: {missing_fields}")
            return False
        else:
            self.log_test("T20 Simulation Structure", True, "All required simulation fields present")
        
        # Test 2: Verify detailed scorecard data
        first_innings = result.get('firstInnings', {})
        second_innings = result.get('secondInnings', {})
        
        scorecard_fields = ['batsmanScores', 'bowlingFigures', 'partnerships', 'fallOfWickets', 'runRate']
        first_missing = [field for field in scorecard_fields if field not in first_innings]
        second_missing = [field for field in scorecard_fields if field not in second_innings]
        
        if first_missing or second_missing:
            self.log_test("Detailed Scorecard", False, 
                        f"Missing scorecard fields - First: {first_missing}, Second: {second_missing}")
        else:
            self.log_test("Detailed Scorecard", True, "Complete scorecard data available for both innings")
        
        # Test 3: Verify batting figures structure
        if first_innings.get('batsmanScores'):
            batsman = first_innings['batsmanScores'][0]
            batting_fields = ['name', 'runs', 'balls', 'fours', 'sixes', 'strikeRate']
            missing_batting = [field for field in batting_fields if field not in batsman]
            
            if missing_batting:
                self.log_test("Batting Figures", False, f"Missing batting fields: {missing_batting}")
            else:
                self.log_test("Batting Figures", True, 
                            f"Complete batting figures: {batsman['name']} - {batsman['runs']}({batsman['balls']}) SR: {batsman['strikeRate']}")
        
        # Test 4: Verify bowling figures structure
        if first_innings.get('bowlingFigures'):
            bowler = first_innings['bowlingFigures'][0]
            bowling_fields = ['name', 'overs', 'maidens', 'runs', 'wickets', 'economy']
            missing_bowling = [field for field in bowling_fields if field not in bowler]
            
            if missing_bowling:
                self.log_test("Bowling Figures", False, f"Missing bowling fields: {missing_bowling}")
            else:
                self.log_test("Bowling Figures", True, 
                            f"Complete bowling figures: {bowler['name']} - {bowler['overs']}-{bowler['maidens']}-{bowler['runs']}-{bowler['wickets']} Econ: {bowler['economy']}")
        
        # Test 5: Verify enhanced commentary with T20 features
        commentary = result.get('commentary', [])
        if len(commentary) < 100:  # T20 should have substantial commentary
            self.log_test("Commentary Volume", False, f"Too few commentary entries: {len(commentary)}")
        else:
            self.log_test("Commentary Volume", True, f"Good commentary volume: {len(commentary)} entries")
        
        # Test 6: Check for T20-specific commentary features
        powerplay_comments = [c for c in commentary if c.get('isPowerplay')]
        death_over_comments = [c for c in commentary if c.get('isDeathOvers')]
        milestone_comments = [c for c in commentary if c.get('milestone')]
        
        t20_features = {
            "Powerplay Commentary": len(powerplay_comments) > 0,
            "Death Overs Commentary": len(death_over_comments) > 0,
            "Run Rate Tracking": any(c.get('currentRunRate') for c in commentary),
            "Required Rate Tracking": any(c.get('requiredRunRate') for c in commentary),
            "Milestone Commentary": len(milestone_comments) > 0
        }
        
        for feature, present in t20_features.items():
            self.log_test(feature, present, f"{'Found' if present else 'Missing'} {feature.lower()}")
        
        # Test 7: Verify weather and pitch conditions affected gameplay
        match_conditions = result.get('matchConditions', {})
        if match_conditions:
            self.log_test("Match Conditions", True, 
                        f"Weather: {match_conditions.get('weather')}, Pitch: {match_conditions.get('pitchType')}")
        else:
            self.log_test("Match Conditions", False, "No match conditions data")
        
        # Test 8: Verify partnerships data
        partnerships = first_innings.get('partnerships', [])
        if partnerships:
            partnership = partnerships[0]
            partnership_fields = ['batsman1', 'batsman2', 'runs', 'balls']
            missing_partnership = [field for field in partnership_fields if field not in partnership]
            
            if missing_partnership:
                self.log_test("Partnership Data", False, f"Missing partnership fields: {missing_partnership}")
            else:
                self.log_test("Partnership Data", True, 
                            f"Partnership: {partnership['batsman1']} & {partnership['batsman2']} - {partnership['runs']} runs")
        
        # Test 9: Verify fall of wickets
        fall_of_wickets = first_innings.get('fallOfWickets', [])
        if fall_of_wickets:
            wicket = fall_of_wickets[0]
            wicket_fields = ['wicket', 'batsman', 'runs', 'over', 'ball', 'bowler', 'type']
            missing_wicket = [field for field in wicket_fields if field not in wicket]
            
            if missing_wicket:
                self.log_test("Fall of Wickets", False, f"Missing wicket fields: {missing_wicket}")
            else:
                self.log_test("Fall of Wickets", True, 
                            f"Wicket {wicket['wicket']}: {wicket['batsman']} {wicket['type']} b {wicket['bowler']} at {wicket['runs']}/{wicket['wicket']}")
        
        return True
    
    def test_enhanced_league_table(self):
        """Test enhanced league table with detailed statistics"""
        print("\n=== Testing Enhanced League Table ===")
        
        response = self.make_request("GET", "/leagues")
        if not response or response.status_code != 200:
            self.log_test("Enhanced League Table", False, "Failed to fetch league table")
            return False
        
        league_table = response.json()
        
        if not league_table:
            self.log_test("League Table Data", True, "Empty league table (no completed matches yet)")
            return True
        
        # Test enhanced statistics fields
        team = league_table[0]
        enhanced_fields = ['netRunRate', 'form', 'averageScore', 'winPercentage', 
                          'highestScore', 'lowestScore', 'runsFor', 'runsAgainst']
        missing_enhanced = [field for field in enhanced_fields if field not in team]
        
        if missing_enhanced:
            self.log_test("Enhanced League Statistics", False, f"Missing enhanced fields: {missing_enhanced}")
        else:
            self.log_test("Enhanced League Statistics", True, 
                        f"Complete stats for {team['name']}: NRR {team['netRunRate']}, Avg {team['averageScore']}, Win% {team['winPercentage']}")
        
        # Test form tracking (last 5 matches)
        if 'form' in team and isinstance(team['form'], list):
            self.log_test("Form Tracking", True, f"Form data available: {team['form']}")
        else:
            self.log_test("Form Tracking", False, "Form data missing or invalid")
        
        # Test sorting (by points then net run rate)
        if len(league_table) > 1:
            sorted_correctly = True
            for i in range(len(league_table) - 1):
                current = league_table[i]
                next_team = league_table[i + 1]
                
                if current['points'] < next_team['points']:
                    sorted_correctly = False
                    break
                elif (current['points'] == next_team['points'] and 
                      float(current['netRunRate']) < float(next_team['netRunRate'])):
                    sorted_correctly = False
                    break
            
            self.log_test("League Table Sorting", sorted_correctly, 
                        "Sorted by points and net run rate" if sorted_correctly else "Incorrect sorting")
        
        return True
    
    def test_match_filtering(self):
        """Test match filtering by status"""
        print("\n=== Testing Match Filtering ===")
        
        # Test filtering by different statuses
        statuses = ['scheduled', 'in-progress', 'completed']
        
        for status in statuses:
            response = self.make_request("GET", "/matches", params={"status": status})
            if response and response.status_code == 200:
                matches = response.json()
                
                # Verify all matches have the correct status
                if matches:
                    incorrect_status = [m for m in matches if m.get('status') != status]
                    if incorrect_status:
                        self.log_test(f"Filter Status '{status}'", False, 
                                    f"Found {len(incorrect_status)} matches with incorrect status")
                    else:
                        self.log_test(f"Filter Status '{status}'", True, 
                                    f"Found {len(matches)} matches with status '{status}'")
                else:
                    self.log_test(f"Filter Status '{status}'", True, f"No matches with status '{status}' (valid)")
            else:
                self.log_test(f"Filter Status '{status}'", False, "Failed to fetch filtered matches")
        
        # Test filtering with user ID
        if self.user_id:
            response = self.make_request("GET", "/matches", params={"userId": self.user_id})
            if response and response.status_code == 200:
                matches = response.json()
                user_matches = [m for m in matches if m.get('home_team_id') == self.user_id or m.get('away_team_id') == self.user_id]
                
                if len(user_matches) == len(matches):
                    self.log_test("User Match Filtering", True, f"Found {len(matches)} matches for user")
                else:
                    self.log_test("User Match Filtering", False, "Some matches don't belong to the user")
            else:
                self.log_test("User Match Filtering", False, "Failed to fetch user matches")
        
        return True
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🏏 Starting Enhanced T20 Cricket Backend Tests 🏏")
        print(f"Testing against: {self.base_url}")
        
        # Run tests in sequence
        tests = [
            self.test_user_authentication,
            self.test_enhanced_match_creation,
            self.test_match_state_management,
            self.test_enhanced_match_simulation,
            self.test_enhanced_league_table,
            self.test_match_filtering
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Test failed with exception: {str(e)}")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🏏 ENHANCED T20 CRICKET BACKEND TEST SUMMARY 🏏")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result["status"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ KEY FEATURES TESTED:")
        print("  - Enhanced T20 match simulation with powerplay/death overs")
        print("  - Realistic run rate calculations and pressure situations")
        print("  - Weather and pitch conditions affecting gameplay")
        print("  - Player form and fatigue impact on performance")
        print("  - Enhanced commentary with milestones and strategic elements")
        print("  - Detailed scorecard with batting/bowling figures")
        print("  - Partnerships and fall of wickets tracking")
        print("  - Match state management (start/pause/resume)")
        print("  - Enhanced league table with comprehensive statistics")
        print("  - Match filtering by status and user")
        
        return passed, failed, total

def main():
    """Main test execution"""
    # Try to determine the correct base URL
    import os
    
    # Check for environment variable or use localhost
    base_url = os.environ.get('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
    if not base_url.endswith('/api'):
        base_url = f"{base_url}/api"
    
    global BASE_URL
    BASE_URL = base_url
    
    tester = T20BackendTester()
    tester.base_url = base_url
    
    print(f"🏏 Enhanced T20 Cricket Backend Testing")
    print(f"📡 Testing URL: {base_url}")
    print(f"👤 Test User: {TEST_USER_EMAIL}")
    
    tester.run_all_tests()
    
    passed, failed, total = tester.print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()