#!/usr/bin/env python3
"""
Test match simulation with two real users
"""

import requests
import json
import uuid

BASE_URL = "http://localhost:3000/api"

def create_user(email, username, team_name):
    """Create a user and return user ID"""
    data = {
        "email": email,
        "password": "testpass123",
        "username": username,
        "team_name": team_name,
        "country": "England",
        "nationality": "English"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    if response.status_code == 201:
        return response.json()["id"]
    return None

def test_match_simulation():
    print("🏏 Testing Match Simulation with Two Real Teams...")
    
    # Create two users
    user1_id = create_user("team1@cricket.com", "team1manager", "Lions Cricket Club")
    user2_id = create_user("team2@cricket.com", "team2manager", "Tigers Cricket Club")
    
    if not user1_id or not user2_id:
        print("❌ Failed to create test users")
        return False
        
    print(f"✅ Created User 1: {user1_id}")
    print(f"✅ Created User 2: {user2_id}")
    
    # Create a match between the two teams
    match_data = {
        "home_team_id": user1_id,
        "away_team_id": user2_id,
        "match_type": "SOD",
        "scheduled_time": "2024-01-15T14:00:00Z",
        "pitch_type": "Normal",
        "weather": "Sunny"
    }
    
    response = requests.post(f"{BASE_URL}/matches", json=match_data)
    if response.status_code != 201:
        print("❌ Failed to create match")
        return False
        
    match_id = response.json()["id"]
    print(f"✅ Created Match: {match_id}")
    
    # Simulate the match
    response = requests.get(f"{BASE_URL}/matches/{match_id}/simulate")
    
    if response.status_code == 200:
        simulation = response.json()
        print(f"✅ Match Simulation Successful!")
        print(f"   Home Score: {simulation['homeScore']}")
        print(f"   Away Score: {simulation['awayScore']}")
        print(f"   Winner: {simulation['winner']}")
        print(f"   Commentary Entries: {len(simulation['commentary'])}")
        
        # Show some sample commentary
        if simulation['commentary']:
            print("\n📝 Sample Commentary:")
            for i, comment in enumerate(simulation['commentary'][:5]):
                print(f"   {comment['over']}.{comment['ball']}: {comment['commentary']}")
                
        return True
    else:
        print(f"❌ Match Simulation Failed: {response.status_code}")
        print(f"   Error: {response.json()}")
        return False

if __name__ == "__main__":
    success = test_match_simulation()
    print(f"\n🎯 Match Simulation Test: {'PASSED' if success else 'FAILED'}")