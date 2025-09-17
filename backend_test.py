#!/usr/bin/env python3
"""
Backend API Testing for Cricket Pavilion Management Game
Tests all core API endpoints including authentication, player management, 
match simulation, and league systems.
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://cricket-pavilion.preview.emergentagent.com/api"
TEST_USER_EMAIL = "test.manager@cricketclub.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USERNAME = "testmanager"
TEST_TEAM_NAME = "Test Cricket Club"
TEST_COUNTRY = "England"
TEST_NATIONALITY = "English"

class CricketAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.user_id = None
        self.test_results = {
            "authentication": {"passed": 0, "failed": 0, "details": []},
            "player_management": {"passed": 0, "failed": 0, "details": []},
            "match_system": {"passed": 0, "failed": 0, "details": []},
            "league_system": {"passed": 0, "failed": 0, "details": []},
        }
        
    def log_result(self, category: str, test_name: str, success: bool, details: str):
        """Log test result"""
        if success:
            self.test_results[category]["passed"] += 1
            status = "✅ PASS"
        else:
            self.test_results[category]["failed"] += 1
            status = "❌ FAIL"
            
        self.test_results[category]["details"].append({
            "test": test_name,
            "status": status,
            "details": details
        })
        print(f"{status}: {test_name} - {details}")
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, timeout=30)
            else:
                return {"error": f"Unsupported method: {method}", "status_code": 400}
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status_code": 0, "success": False}
        except json.JSONDecodeError as e:
            return {"error": f"JSON decode error: {str(e)}", "status_code": response.status_code, "success": False}
            
    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test user registration
        register_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "username": TEST_USERNAME,
            "team_name": TEST_TEAM_NAME,
            "country": TEST_COUNTRY,
            "nationality": TEST_NATIONALITY
        }
        
        result = self.make_request("POST", "/auth/register", register_data)
        
        if result["success"] and result["status_code"] == 201:
            user_data = result["data"]
            self.user_id = user_data.get("id")
            
            # Verify user data structure
            required_fields = ["id", "email", "username", "team_name", "country", "nationality"]
            missing_fields = [field for field in required_fields if field not in user_data]
            
            if not missing_fields and self.user_id:
                self.log_result("authentication", "User Registration", True, 
                              f"User created successfully with ID: {self.user_id}")
            else:
                self.log_result("authentication", "User Registration", False, 
                              f"Missing fields in response: {missing_fields}")
        else:
            self.log_result("authentication", "User Registration", False, 
                          f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
            
        # Test user login
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        result = self.make_request("POST", "/auth/login", login_data)
        
        if result["success"]:
            user_data = result["data"]
            if user_data.get("id") == self.user_id:
                self.log_result("authentication", "User Login", True, 
                              f"Login successful for user: {user_data.get('username')}")
            else:
                self.log_result("authentication", "User Login", False, 
                              "User ID mismatch between registration and login")
        else:
            self.log_result("authentication", "User Login", False, 
                          f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
            
    def test_player_management(self):
        """Test player management endpoints"""
        print("\n👥 Testing Player Management Endpoints...")
        
        if not self.user_id:
            self.log_result("player_management", "Player Tests", False, "No user ID available from authentication")
            return
            
        # Test getting all players for user
        result = self.make_request("GET", "/players", params={"userId": self.user_id})
        
        if result["success"]:
            players = result["data"]
            if isinstance(players, list) and len(players) >= 25:  # Should have 15 senior + 10 youth
                self.log_result("player_management", "Get All Players", True, 
                              f"Retrieved {len(players)} players for user")
                
                # Verify player structure and skills
                sample_player = players[0]
                required_skills = ["batting", "bowling", "keeping", "technique", "fielding", "endurance", "power", "captaincy"]
                missing_skills = [skill for skill in required_skills if skill not in sample_player]
                
                if not missing_skills:
                    # Check skill ranges (1-100)
                    skill_values = [sample_player[skill] for skill in required_skills]
                    valid_skills = all(1 <= skill <= 100 for skill in skill_values)
                    
                    if valid_skills:
                        self.log_result("player_management", "Player Skills Validation", True, 
                                      f"All 9 skills present with valid ranges (1-100)")
                    else:
                        self.log_result("player_management", "Player Skills Validation", False, 
                                      f"Invalid skill values found: {skill_values}")
                else:
                    self.log_result("player_management", "Player Skills Validation", False, 
                                  f"Missing skills: {missing_skills}")
                    
            else:
                self.log_result("player_management", "Get All Players", False, 
                              f"Expected 25+ players, got {len(players) if isinstance(players, list) else 'non-list'}")
        else:
            self.log_result("player_management", "Get All Players", False, 
                          f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
            
        # Test getting senior squad
        result = self.make_request("GET", "/players", params={"userId": self.user_id, "squadType": "senior"})
        
        if result["success"]:
            senior_players = result["data"]
            if isinstance(senior_players, list) and len(senior_players) >= 15:
                self.log_result("player_management", "Get Senior Squad", True, 
                              f"Retrieved {len(senior_players)} senior players")
            else:
                self.log_result("player_management", "Get Senior Squad", False, 
                              f"Expected 15+ senior players, got {len(senior_players) if isinstance(senior_players, list) else 'non-list'}")
        else:
            self.log_result("player_management", "Get Senior Squad", False, 
                          f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
            
        # Test getting youth squad
        result = self.make_request("GET", "/players", params={"userId": self.user_id, "squadType": "youth"})
        
        if result["success"]:
            youth_players = result["data"]
            if isinstance(youth_players, list) and len(youth_players) >= 10:
                self.log_result("player_management", "Get Youth Squad", True, 
                              f"Retrieved {len(youth_players)} youth players")
                
                # Test getting specific player
                if youth_players:
                    player_id = youth_players[0]["id"]
                    result = self.make_request("GET", f"/players/{player_id}")
                    
                    if result["success"]:
                        player = result["data"]
                        if player.get("id") == player_id:
                            self.log_result("player_management", "Get Specific Player", True, 
                                          f"Retrieved player: {player.get('name')}")
                        else:
                            self.log_result("player_management", "Get Specific Player", False, 
                                          "Player ID mismatch")
                    else:
                        self.log_result("player_management", "Get Specific Player", False, 
                                      f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
                        
            else:
                self.log_result("player_management", "Get Youth Squad", False, 
                              f"Expected 10+ youth players, got {len(youth_players) if isinstance(youth_players, list) else 'non-list'}")
        else:
            self.log_result("player_management", "Get Youth Squad", False, 
                          f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
            
    def test_match_system(self):
        """Test match system endpoints"""
        print("\n⚽ Testing Match System Endpoints...")
        
        if not self.user_id:
            self.log_result("match_system", "Match Tests", False, "No user ID available from authentication")
            return
            
        # Create a dummy opponent user for testing
        opponent_id = str(uuid.uuid4())
        
        # Test creating a match
        match_data = {
            "home_team_id": self.user_id,
            "away_team_id": opponent_id,
            "match_type": "SOD",  # Senior One Day
            "scheduled_time": "2024-01-15T14:00:00Z",
            "pitch_type": "Normal",
            "weather": "Sunny"
        }
        
        result = self.make_request("POST", "/matches", match_data)
        match_id = None
        
        if result["success"] and result["status_code"] == 201:
            match = result["data"]
            match_id = match.get("id")
            
            if match_id and match.get("home_team_id") == self.user_id:
                self.log_result("match_system", "Create Match", True, 
                              f"Match created successfully with ID: {match_id}")
            else:
                self.log_result("match_system", "Create Match", False, 
                              "Invalid match data in response")
        else:
            self.log_result("match_system", "Create Match", False, 
                          f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
            
        # Test getting matches for user
        result = self.make_request("GET", "/matches", params={"userId": self.user_id})
        
        if result["success"]:
            matches = result["data"]
            if isinstance(matches, list) and len(matches) > 0:
                self.log_result("match_system", "Get User Matches", True, 
                              f"Retrieved {len(matches)} matches for user")
            else:
                self.log_result("match_system", "Get User Matches", False, 
                              f"Expected matches list, got {type(matches)} with {len(matches) if isinstance(matches, list) else 'unknown'} items")
        else:
            self.log_result("match_system", "Get User Matches", False, 
                          f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
            
        # Test getting specific match
        if match_id:
            result = self.make_request("GET", f"/matches/{match_id}")
            
            if result["success"]:
                match = result["data"]
                if match.get("id") == match_id:
                    self.log_result("match_system", "Get Specific Match", True, 
                                  f"Retrieved match: {match.get('match_type')}")
                else:
                    self.log_result("match_system", "Get Specific Match", False, 
                                  "Match ID mismatch")
            else:
                self.log_result("match_system", "Get Specific Match", False, 
                              f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
                
            # Test match simulation (this might fail due to insufficient players for opponent)
            print("⚠️  Note: Match simulation may fail due to missing opponent players - this is expected")
            result = self.make_request("GET", f"/matches/{match_id}/simulate")
            
            if result["success"]:
                simulation = result["data"]
                required_fields = ["homeScore", "awayScore", "winner", "commentary"]
                missing_fields = [field for field in required_fields if field not in simulation]
                
                if not missing_fields and isinstance(simulation.get("commentary"), list):
                    commentary_count = len(simulation["commentary"])
                    self.log_result("match_system", "Match Simulation", True, 
                                  f"Simulation completed with {commentary_count} commentary entries")
                else:
                    self.log_result("match_system", "Match Simulation", False, 
                                  f"Missing simulation fields: {missing_fields}")
            else:
                # This is expected to fail due to missing opponent players
                self.log_result("match_system", "Match Simulation", False, 
                              f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))} (Expected due to missing opponent players)")
                
    def test_league_system(self):
        """Test league system endpoints"""
        print("\n🏆 Testing League System Endpoints...")
        
        # Test getting league table
        result = self.make_request("GET", "/leagues", params={"type": "SOD"})
        
        if result["success"]:
            league_table = result["data"]
            if isinstance(league_table, list):
                self.log_result("league_system", "Get League Table", True, 
                              f"Retrieved league table with {len(league_table)} teams")
                
                # If there are teams, verify structure
                if league_table:
                    sample_team = league_table[0]
                    required_fields = ["id", "name", "played", "won", "lost", "tied", "points", "runRate"]
                    missing_fields = [field for field in required_fields if field not in sample_team]
                    
                    if not missing_fields:
                        self.log_result("league_system", "League Table Structure", True, 
                                      "League table has correct structure with all required fields")
                    else:
                        self.log_result("league_system", "League Table Structure", False, 
                                      f"Missing fields in league table: {missing_fields}")
                else:
                    self.log_result("league_system", "League Table Structure", True, 
                                  "Empty league table (no completed matches yet)")
            else:
                self.log_result("league_system", "Get League Table", False, 
                              f"Expected list, got {type(league_table)}")
        else:
            self.log_result("league_system", "Get League Table", False, 
                          f"Status: {result['status_code']}, Error: {result.get('error', result.get('data', {}))}")
            
    def run_all_tests(self):
        """Run all test suites"""
        print("🏏 Starting Cricket Pavilion Backend API Tests...")
        print(f"🌐 Base URL: {self.base_url}")
        
        start_time = time.time()
        
        # Run test suites
        self.test_authentication()
        self.test_player_management()
        self.test_match_system()
        self.test_league_system()
        
        end_time = time.time()
        
        # Print summary
        print("\n" + "="*80)
        print("🏏 CRICKET PAVILION API TEST SUMMARY")
        print("="*80)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            print(f"\n📊 {category.upper().replace('_', ' ')}:")
            print(f"   ✅ Passed: {passed}")
            print(f"   ❌ Failed: {failed}")
            
            for detail in results["details"]:
                print(f"   {detail['status']}: {detail['test']}")
                if "FAIL" in detail['status']:
                    print(f"      └─ {detail['details']}")
                    
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"   ✅ Total Passed: {total_passed}")
        print(f"   ❌ Total Failed: {total_failed}")
        print(f"   ⏱️  Test Duration: {end_time - start_time:.2f} seconds")
        
        success_rate = (total_passed / (total_passed + total_failed)) * 100 if (total_passed + total_failed) > 0 else 0
        print(f"   📈 Success Rate: {success_rate:.1f}%")
        
        if total_failed == 0:
            print("\n🎉 ALL TESTS PASSED! The Cricket Pavilion API is working correctly.")
        else:
            print(f"\n⚠️  {total_failed} test(s) failed. Please review the issues above.")
            
        return total_failed == 0

if __name__ == "__main__":
    tester = CricketAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)