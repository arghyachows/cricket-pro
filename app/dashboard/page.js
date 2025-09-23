'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/Navigation';
import TournamentMatchSection from '@/components/TournamentMatchSection';
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
  const [tournamentStatus, setTournamentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickSimLoading, setQuickSimLoading] = useState(false);
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

  useEffect(() => {
    // Fetch tournament status when user is available
    if (user) {
      fetchTournamentStatus();
    }
  }, [user]);

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

  const fetchTournamentStatus = async () => {
    if (!user) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/matches/next?userId=${user.id}`);
      const status = await response.json();
      setTournamentStatus(status);
    } catch (error) {
      console.error('Error fetching tournament status:', error);
    }
  };

  const handlePlayMatch = async () => {
    if (!tournamentStatus?.match) return;
    router.push(`/match/${tournamentStatus.match.id}`);
  };



  const handleQuickSim = async () => {
    if (!user) return;

    setQuickSimLoading(true);
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/matches/quick-sim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Quick Simulation Complete",
          description: `Simulated ${result.simulated} matches`,
        });
        fetchUserData();
        fetchTournamentStatus();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to perform quick simulation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error performing quick simulation:', error);
      toast({
        title: "Error",
        description: "Failed to perform quick simulation",
        variant: "destructive",
      });
    } finally {
      setQuickSimLoading(false);
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
      <Navigation currentPage="dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Tournament Match Section */}
          <TournamentMatchSection
            tournamentStatus={tournamentStatus}
            onPlayMatch={handlePlayMatch}
            onQuickSim={handleQuickSim}
            onScheduleTournament={() => router.push('/journey')}
            quickSimLoading={quickSimLoading}
            title="TOURNAMENT MATCH"
          />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - League Table & Quick Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>LEAGUE STANDINGS</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leagueTable.leagueTable && leagueTable.leagueTable.slice(0, 8).map((team, index) => (
                      <div key={team.id} className={`flex items-center justify-between p-3 rounded-lg ${index < 3 ? 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-gray-400 text-white' : index === 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{team.name}</div>
                            <div className="text-xs text-muted-foreground">{team.played} played</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{team.points}</div>
                          <div className="text-xs text-muted-foreground">pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>QUICK ACTIONS</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => router.push('/squad')}
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      variant="outline"
                    >
                      <Users className="w-6 h-6" />
                      <span className="text-xs">Manage Squad</span>
                    </Button>
                    <Button
                      onClick={() => router.push('/marketplace')}
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      variant="outline"
                    >
                      <TrendingUp className="w-6 h-6" />
                      <span className="text-xs">Transfer Market</span>
                    </Button>
                    <Button
                      onClick={createFriendlyMatch}
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      variant="outline"
                    >
                      <Play className="w-6 h-6" />
                      <span className="text-xs">Quick Match</span>
                    </Button>
                    <Button
                      onClick={handleQuickSim}
                      disabled={quickSimLoading}
                      className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                    >
                      {quickSimLoading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <Zap className="w-6 h-6" />
                      )}
                      <span className="text-xs">{quickSimLoading ? 'Simulating...' : 'Quick Sim'}</span>
                    </Button>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => router.push('/journey')}
                      className="w-full flex items-center justify-center space-x-2"
                      variant="outline"
                    >
                      <Award className="w-4 h-4" />
                      <span>My Journey</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Team Performance & Matches */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>TEAM PERFORMANCE</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{completedMatches.filter(m => m.result === user.id).length}</div>
                        <div className="text-xs text-muted-foreground">Wins</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{players.length}</div>
                        <div className="text-xs text-muted-foreground">Players</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{mainLineup ? '✓' : '✗'}</div>
                        <div className="text-xs text-muted-foreground">Main Lineup</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Squad Strength</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, (players.filter(p => p.rating >= 80).length / players.length) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {players.filter(p => p.rating >= 80).length}/{players.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Available Budget</span>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Coins className="w-3 h-3" />
                          <span>{user.coins?.toLocaleString() || '0'}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>RECENT ACTIVITY</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedMatches.slice(-3).reverse().map((match, index) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${match.result === user.id ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {match.result === user.id ? 'W' : 'L'}
                          </div>
                          <div>
                            <div className="font-medium text-sm">T20 Match</div>
                            <div className="text-xs text-muted-foreground">
                              {match.home_score} - {match.away_score}
                            </div>
                          </div>
                        </div>
                        <Badge variant={match.result === user.id ? 'default' : 'destructive'} className="text-xs">
                          {match.result === user.id ? 'Won' : 'Lost'}
                        </Badge>
                      </div>
                    ))}
                    {completedMatches.length === 0 && (
                      <div className="text-center py-6">
                        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No matches played yet</p>
                        <Button onClick={createFriendlyMatch} size="sm" className="mt-2">
                          Play Your First Match
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>



          {/* Live Matches Section - Only show if there are active matches */}
          {inProgressMatches.length > 0 && (
            <Card>
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
                          onClick={() => router.push(`/match/${match.id}`)}
                          className="flex-1"
                        >
                          {match.home_team_id === user.id || match.away_team_id === user.id ? 'Resume Your Match' : 'View Match'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Toaster />
    </div>
  );
}
