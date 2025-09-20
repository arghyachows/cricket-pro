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
  Coins
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backgroundMatch, setBackgroundMatch] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
      checkBackgroundMatch();
    }
  }, [user]);

  const checkBackgroundMatch = () => {
    try {
      const savedMatch = localStorage.getItem('backgroundMatch');
      if (savedMatch) {
        const matchState = JSON.parse(savedMatch);
        // Check if match is less than 24 hours old
        if (Date.now() - matchState.timestamp < 24 * 60 * 60 * 1000) {
          setBackgroundMatch(matchState);
        } else {
          localStorage.removeItem('backgroundMatch');
        }
      }
    } catch (error) {
      console.error('Error checking background match:', error);
      localStorage.removeItem('backgroundMatch');
    }
  };

  const returnToMatch = () => {
    if (backgroundMatch) {
      router.push(`/match/${backgroundMatch.matchId}`);
    }
  };

  const dismissBackgroundMatch = () => {
    localStorage.removeItem('backgroundMatch');
    setBackgroundMatch(null);
  };

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      // Fetch players
      const playersResponse = await fetch(`${baseUrl}/api/players?userId=${user.id}`);
      const playersData = await playersResponse.json();
      setPlayers(playersData);

      // Fetch matches
      const matchesResponse = await fetch(`${baseUrl}/api/matches?userId=${user.id}`);
      const matchesData = await matchesResponse.json();
      setMatches(matchesData);

      // Fetch lineups
      const lineupsResponse = await fetch(`${baseUrl}/api/lineups?userId=${user.id}`);
      const lineupsData = await lineupsResponse.json();
      setLineups(lineupsData);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
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

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Trophy className="w-12 h-12 text-white mx-auto mb-4" />
            <p className="text-white">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
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
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold">From the Pavilion</h1>
                <p className="text-sm text-muted-foreground">{user.team_name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Coins className="w-4 h-4" />
                <span>{user.coins?.toLocaleString() || '0'} coins</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>{user.country}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('user');
                  setUser(null);
                  router.push('/');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/players')}>
              Squad
            </Button>
            <Button variant="outline" onClick={() => router.push('/lineups')}>
              Lineups
            </Button>
            <Button variant="outline" onClick={() => router.push('/matches')}>
              Matches
            </Button>
            <Button variant="outline" onClick={() => router.push('/league')}>
              League
            </Button>
            <Button variant="outline" onClick={() => router.push('/marketplace')}>
              Market
            </Button>
          </div>
        </div>

        {/* Background Match Alert */}
        {backgroundMatch && (
          <Card className="border-orange-200 bg-orange-50 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <CardTitle className="text-orange-800">Match in Progress</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={dismissBackgroundMatch}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-orange-700">
                  You have a T20 match running in the background
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Score:</span> {backgroundMatch.currentRuns}/{backgroundMatch.currentWickets}
                  </div>
                  <div>
                    <span className="font-medium">Over:</span> {backgroundMatch.currentOver}.{backgroundMatch.currentBall}
                  </div>
                </div>
                {backgroundMatch.target && (
                  <div className="text-sm">
                    <span className="font-medium">Target:</span> {backgroundMatch.target} runs
                  </div>
                )}
                <Button onClick={returnToMatch} className="w-full mt-3">
                  <Play className="w-4 h-4 mr-2" />
                  Return to Match
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Squad Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{players.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lineups</CardTitle>
              <span className="h-4 w-4 text-muted-foreground">📋</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lineups.length}</div>
              <p className="text-xs text-muted-foreground">
                {mainLineup ? `Main: ${mainLineup.name}` : 'No main lineup'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressMatches.length}</div>
              <p className="text-xs text-muted-foreground">
                {inProgressMatches.length > 0 ? 'Matches in progress' : 'No live matches'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingMatches.length}</div>
            </CardContent>
          </Card>
        </div>

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

      <Toaster />
    </div>
  );
}
