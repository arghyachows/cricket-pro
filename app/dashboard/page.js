'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import {
  Users,
  Trophy,
  Calendar,
  TrendingUp,
  Play,
  Coins,
  Globe,
  Target,
  Activity,
  AlertCircle,
  Clock,
  Star,
  Award,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(savedUser));
    fetchUserData();
  }, [router]);

  const fetchUserData = async () => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (!savedUser) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      // Fetch players
      const playersResponse = await fetch(`${baseUrl}/api/players?userId=${savedUser.id}`);
      const playersData = await playersResponse.json();
      setPlayers(playersData);

      // Fetch matches
      const matchesResponse = await fetch(`${baseUrl}/api/matches?userId=${savedUser.id}`);
      const matchesData = await matchesResponse.json();
      setMatches(matchesData);

      // Fetch league table
      const leagueResponse = await fetch(`${baseUrl}/api/leagues`);
      const leagueData = await leagueResponse.json();
      setLeagueTable(leagueData);

      // Fetch lineups
      const lineupsResponse = await fetch(`${baseUrl}/api/lineups?userId=${savedUser.id}`);
      const lineupsData = await lineupsResponse.json();
      setLineups(lineupsData);

      // Fetch marketplace
      const marketResponse = await fetch(`${baseUrl}/api/marketplace`);
      const marketData = await marketResponse.json();
      setMarketplace(marketData);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateMatch = (matchId) => {
    router.push(`/match/${matchId}`);
  };

  const createFriendlyMatch = async () => {
    if (!user || players.length < 11) {
      toast({
        title: "Error",
        description: "You need at least 11 players to create a match",
        variant: "destructive",
      });
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';
      const response = await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          home_team_id: user.id,
          away_team_id: 'demo-opponent',
          scheduled_time: new Date().toISOString(),
          pitch_type: 'Normal',
          weather: 'Sunny'
        }),
      });

      const match = await response.json();

      if (response.ok) {
        setMatches([...matches, match]);
        toast({
          title: "Match Created!",
          description: "Your T20 match has been scheduled",
        });
      } else {
        toast({
          title: "Error",
          description: match.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const inProgressMatches = matches.filter(m => m.status === 'in-progress' || m.status === 'paused');
  const mainLineup = lineups.find(l => l.is_main);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Trophy className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate">Cricket Manager Pro</h1>
                <p className="text-sm text-muted-foreground truncate">{user.team_name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Badge variant="outline" className="hidden sm:flex items-center space-x-1">
                <Coins className="w-4 h-4" />
                <span>{user.coins?.toLocaleString() || '0'}</span>
              </Badge>
              <Badge variant="outline" className="hidden md:flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>{user.country}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">×</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            <Button
              variant="ghost"
              className="bg-primary text-primary-foreground flex-shrink-0"
              onClick={() => router.push('/dashboard')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              className="flex-shrink-0"
              onClick={() => router.push('/squad')}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Squad</span>
            </Button>
            <Button
              variant="ghost"
              className="flex-shrink-0"
              onClick={() => router.push('/lineups')}
            >
              <Play className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Lineups</span>
            </Button>
            <Button
              variant="ghost"
              className="flex-shrink-0"
              onClick={() => router.push('/journey')}
            >
              <Trophy className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">My Journey</span>
            </Button>
            <Button
              variant="ghost"
              className="flex-shrink-0"
              onClick={() => router.push('/marketplace')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Market</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Next Match Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>NEXT MATCH</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMatches.slice(0, 1).map((match) => (
                    <div key={match.id} className="text-center">
                      <div className="text-sm text-muted-foreground mb-2">
                        Saturday, October 28th 2023 (3 days)
                      </div>
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mb-2">
                            {user.team_name.charAt(0)}
                          </div>
                          <div className="font-medium">{user.team_name}</div>
                        </div>
                        <div className="text-2xl font-bold">vs</div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mb-2">
                            O
                          </div>
                          <div className="font-medium">Opponent Team</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Indian Premier League • Wankhede Stadium • T20
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No upcoming matches</p>
                  <Button onClick={createFriendlyMatch}>
                    Create T20 Match
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - League Table */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>LEAGUE TABLE</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leagueTable.leagueTable && leagueTable.leagueTable.slice(0, 10).map((team, index) => (
                      <div key={team.id} className={`flex items-center justify-between p-2 rounded ${index < 3 ? 'bg-green-50' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium w-6">{index + 1}</span>
                          <span className="text-sm">{team.name}</span>
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <span>{team.played}</span>
                          <span>{team.won}</span>
                          <span>{team.points}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Team Stats & Player Stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>TEAM STATS</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">10 matches played</span>
                      <Badge variant="outline">Indian Premier League</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">185</div>
                        <div className="text-xs text-muted-foreground">Runs Scored</div>
                        <div className="text-xs">2nd best</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">165</div>
                        <div className="text-xs text-muted-foreground">Runs Conceded</div>
                        <div className="text-xs">3rd best</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">12</div>
                        <div className="text-xs text-muted-foreground">Wickets Taken</div>
                        <div className="text-xs">1st best</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">7.85</div>
                        <div className="text-xs text-muted-foreground">Economy Rate</div>
                        <div className="text-xs">2nd best</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">8.5</div>
                      <div className="text-xs text-muted-foreground">Strike Rate</div>
                      <div className="text-xs">1st best</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5" />
                    <span>PLAYER STATS</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        1
                      </div>
                      <div>
                        <div className="font-medium">Top Run Scorer</div>
                        <div className="text-sm text-muted-foreground">Virat Kohli</div>
                        <div className="text-xs">485 runs</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        2
                      </div>
                      <div>
                        <div className="font-medium">Highest Wicket Taker</div>
                        <div className="text-sm text-muted-foreground">Jasprit Bumrah</div>
                        <div className="text-xs">18 wickets</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        3
                      </div>
                      <div>
                        <div className="font-medium">Best Strike Rate</div>
                        <div className="text-sm text-muted-foreground">AB de Villiers</div>
                        <div className="text-xs">165.2</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Training, News, Fixtures */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>TRAINING</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm font-medium mb-2">THIS WEEK</div>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        <div className="p-2 bg-orange-100 rounded">Mon</div>
                        <div className="p-2 bg-orange-100 rounded">Tue</div>
                        <div className="p-2 bg-orange-100 rounded">Wed</div>
                        <div className="p-2 bg-orange-100 rounded">Thu</div>
                        <div className="p-2 bg-orange-100 rounded">Fri</div>
                        <div className="p-2 bg-orange-100 rounded">Sat</div>
                        <div className="p-2 bg-orange-100 rounded">Sun</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-orange-600 mb-2">TACTICAL STYLE - POWER PLAY</div>
                      <div className="text-xs text-muted-foreground">You have no outstanding promises at this time.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>TEAM NEWS</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="font-medium text-green-600">Mumbai Indians team news</div>
                      <div className="text-xs text-muted-foreground">Rohit Sharma (out: hamstring injury)</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-blue-600">Chennai Super Kings team news</div>
                      <div className="text-xs text-muted-foreground">No team news</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>PARMA FIXTURES</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>10/07</span>
                      <span>Royal Challengers</span>
                      <span className="text-green-600">185-165</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>10/22</span>
                      <span>Mumbai Indians</span>
                      <span className="text-green-600">195-175</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>10/28</span>
                      <span>Chennai Super Kings</span>
                      <span className="text-blue-600">A</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>11/04</span>
                      <span>Kolkata Knight Riders</span>
                      <span className="text-blue-600">H</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>11/11</span>
                      <span>Delhi Capitals</span>
                      <span className="text-blue-600">A</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>11/25</span>
                      <span>Sunrisers Hyderabad</span>
                      <span className="text-blue-600">H</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section - Team Injuries & Competitions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>TEAM INJURIES</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xs">1</span>
                    </div>
                    <div>
                      <div className="font-medium">Virat Kohli</div>
                      <div className="text-sm text-muted-foreground">Hamstring strain</div>
                      <div className="text-xs text-muted-foreground">1 - 2 days</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-xs">2</span>
                    </div>
                    <div>
                      <div className="font-medium">Jasprit Bumrah</div>
                      <div className="text-sm text-muted-foreground">Shoulder soreness</div>
                      <div className="text-xs text-muted-foreground">3 - 5 days</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xs">3</span>
                    </div>
                    <div>
                      <div className="font-medium">Rohit Sharma</div>
                      <div className="text-sm text-muted-foreground">Finger fracture</div>
                      <div className="text-xs text-muted-foreground">2 - 3 weeks</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>TEAM COMPETITIONS</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium">Indian Premier League (2024/25)</div>
                      <div className="text-sm text-muted-foreground">T20 Championship (1st - 10th)</div>
                      <div className="text-xs text-muted-foreground">Playoffs: 1st - 4th</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600">Champions Trophy</div>
                      <div className="text-sm text-muted-foreground">Group Stage (v Australia)</div>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Contract Expiry Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>CONTRACT EXPIRY DATES</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="font-medium">Virat Kohli</div>
                  <div className="text-sm text-muted-foreground">Batsman</div>
                  <div className="text-xs text-red-600">2024/5/30</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="font-medium">Jasprit Bumrah</div>
                  <div className="text-sm text-muted-foreground">Bowler</div>
                  <div className="text-xs text-red-600">2024/5/30</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="font-medium">Rohit Sharma</div>
                  <div className="text-sm text-muted-foreground">Batsman</div>
                  <div className="text-xs text-red-600">2024/5/30</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="font-medium">MS Dhoni</div>
                  <div className="text-sm text-muted-foreground">Wicketkeeper</div>
                  <div className="text-xs text-red-600">2024/5/30</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="font-medium">Hardik Pandya</div>
                  <div className="text-sm text-muted-foreground">All-rounder</div>
                  <div className="text-xs text-red-600">2024/5/30</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="font-medium">KL Rahul</div>
                  <div className="text-sm text-muted-foreground">Batsman</div>
                  <div className="text-xs text-red-600">2024/5/30</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Matches Section */}
            {inProgressMatches.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Live Matches</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inProgressMatches.map((match) => (
                      <div key={match.id} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-red-500 text-white">
                              {match.status === 'paused' ? 'PAUSED' : 'LIVE'}
                            </Badge>
                            <span className="text-sm font-medium">T20 Match</span>
                          </div>
                          <Badge variant="secondary">
                            {match.weather} • {match.pitch_type}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{user.team_name}</span>
                            <span className="font-bold">{match.current_runs || 0}/{match.current_wickets || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Overs: {match.current_over || 0}.{match.current_ball || 0}</span>
                            {match.current_runs && match.current_over && (
                              <span>RR: {((match.current_runs / ((match.current_over * 6 + match.current_ball) / 6)) || 0).toFixed(2)}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => simulateMatch(match.id)}
                            className="flex-1"
                          >
                            Resume Match
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/match/${match.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Upcoming T20 Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No upcoming matches</p>
                    <Button onClick={createFriendlyMatch}>
                      Create T20 Match
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">T20 Match</p>
                          <p className="text-sm text-muted-foreground">
                            vs {match.away_team_id === user.id ? 'Home Team' : 'Away Team'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {match.weather} • {match.pitch_type}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => simulateMatch(match.id)}
                          disabled={loading}
                        >
                          Simulate
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                {completedMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No matches played yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedMatches.slice(-3).map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">T20 Match</p>
                          <p className="text-sm text-muted-foreground">
                            {match.home_score} - {match.away_score}
                          </p>
                        </div>
                        <Badge variant={match.result === user.id ? 'default' : 'secondary'}>
                          {match.result === user.id ? 'Won' : 'Lost'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
