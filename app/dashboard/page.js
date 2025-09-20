'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/Navigation';
import {
  Users,
  Trophy,
  Calendar,
  TrendingUp,
  Play,
  Coins,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backgroundMatch, setBackgroundMatch] = useState(null);
  const [liveMatchUpdates, setLiveMatchUpdates] = useState(new Map());
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
      checkBackgroundMatch();
    }
  }, [user]);

  // Check for background match updates when component mounts or when returning from match
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - refresh data and check background match
        fetchUserData();
        checkBackgroundMatch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also check when window regains focus
    const handleFocus = () => {
      fetchUserData();
      checkBackgroundMatch();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Cricket Manager Pro</h1>
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
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <Navigation
              user={user}
              onLogout={() => {
                localStorage.removeItem('user');
                setUser(null);
                router.push('/');
              }}
            />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">

        {/* Quick Access - Running Matches */}
        {inProgressMatches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse mr-2"></div>
              Running Matches
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressMatches.slice(0, 3).map((match) => {
                const currentScore = match.current_runs || 0;
                const currentWickets = match.current_wickets || 0;
                const currentOver = match.current_over || 0;
                const currentBall = match.current_ball || 0;

                return (
                  <Card key={match.id} className="border-destructive/20 bg-gradient-to-r from-destructive/5 to-destructive/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-destructive text-destructive-foreground text-xs">
                          {match.status === 'paused' ? 'PAUSED' : 'LIVE'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {match.weather}
                        </span>
                      </div>

                      <div className="text-center mb-3">
                        <div className="text-xl font-bold text-primary">
                          {currentScore}/{currentWickets}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentOver}.{currentBall} overs
                        </div>
                      </div>

                      <Link href={`/match/${match.id}`}>
                        <Button size="sm" className="w-full bg-destructive hover:bg-destructive/90">
                          <Play className="w-4 h-4 mr-2" />
                          {match.status === 'paused' ? 'Resume' : 'Watch Live'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Background Match Alert */}
        {backgroundMatch && (
          <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 dark:border-primary/30 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <CardTitle className="text-primary">Match in Progress</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={dismissBackgroundMatch}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-primary/80 dark:text-primary/70">
                  You have a T20 match running in the background
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Score:</span> {backgroundMatch.currentRuns}/{backgroundMatch.currentWickets}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Over:</span> {backgroundMatch.currentOver}.{backgroundMatch.currentBall}
                  </div>
                </div>
                {backgroundMatch.target && (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Target:</span> {backgroundMatch.target} runs
                  </div>
                )}
                <Link href={`/match/${backgroundMatch.matchId}`} className="w-full">
                  <Button className="w-full mt-3">
                    <Play className="w-4 h-4 mr-2" />
                    Return to Match
                  </Button>
                </Link>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                    <span>Live Matches</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUserData()}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inProgressMatches.map((match) => {
                    const currentScore = match.current_runs || 0;
                    const currentWickets = match.current_wickets || 0;
                    const currentOver = match.current_over || 0;
                    const currentBall = match.current_ball || 0;
                    const runRate = currentScore > 0 && currentOver > 0
                      ? (currentScore / ((currentOver * 6 + currentBall) / 6)).toFixed(2)
                      : '0.00';

                    return (
                      <div key={match.id} className="p-4 border rounded-lg bg-gradient-to-r from-destructive/5 to-destructive/10 border-destructive/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-destructive text-destructive-foreground border-destructive animate-pulse">
                              {match.status === 'paused' ? 'PAUSED' : 'LIVE'}
                            </Badge>
                            <span className="text-sm font-medium">T20 Match</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {match.weather} • {match.pitch_type}
                          </Badge>
                        </div>

                        {/* Live Score Display */}
                        <div className="text-center mb-3 p-3 bg-background/50 rounded-lg border">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {currentScore}/{currentWickets}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Overs: {currentOver}.{currentBall} • RR: {runRate}
                          </div>
                          {match.target && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Target: {match.target} runs
                            </div>
                          )}
                        </div>

                        {/* Team Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">{user.team_name}</span>
                            <span className="text-muted-foreground">vs Opponent</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last updated: {new Date(match.updated_at || match.created_at).toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Link href={`/match/${match.id}`} className="flex-1">
                            <Button size="sm" className="w-full bg-destructive hover:bg-destructive/90">
                              <Play className="w-4 h-4 mr-2" />
                              {match.status === 'paused' ? 'Resume Match' : 'Watch Live'}
                            </Button>
                          </Link>
                          <Link href={`/match/${match.id}`}>
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
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
                      <Link href={`/match/${match.id}`}>
                        <Button size="sm" disabled={loading}>
                          Simulate
                        </Button>
                      </Link>
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
                  {completedMatches.slice(-3).map((match) => {
                    // Handle different score formats - prioritize direct fields, fallback to match_data
                    const homeScore = match.home_score ?? match.match_data?.firstInnings?.runs ?? 0;
                    const awayScore = match.away_score ?? match.match_data?.secondInnings?.runs ?? 0;
                    const homeWickets = match.home_wickets ?? match.match_data?.firstInnings?.wickets ?? 10;
                    const awayWickets = match.away_wickets ?? match.match_data?.secondInnings?.wickets ?? 10;
                    const homeOvers = match.home_overs ?? match.match_data?.firstInnings?.overs ?? 0;
                    const awayOvers = match.away_overs ?? match.match_data?.secondInnings?.overs ?? 0;

                    // Determine winner with better logic
                    let result = 'Draw';
                    let resultVariant = 'secondary';

                    if (match.result === user.id) {
                      result = 'Won';
                      resultVariant = 'default';
                    } else if (match.result && match.result !== 'tie' && match.result !== user.id) {
                      result = 'Lost';
                      resultVariant = 'destructive';
                    } else if (match.result === 'tie') {
                      result = 'Tie';
                      resultVariant = 'secondary';
                    }

                    // Format overs properly
                    const formatOvers = (overs) => {
                      if (typeof overs === 'number') {
                        const wholeOvers = Math.floor(overs);
                        const balls = Math.round((overs - wholeOvers) * 10);
                        return balls > 0 ? `${wholeOvers}.${balls}` : `${wholeOvers}`;
                      }
                      return overs || '0';
                    };

                    return (
                      <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">T20 Match</p>
                          <p className="text-sm text-muted-foreground">
                            {homeScore}/{homeWickets} ({formatOvers(homeOvers)}) vs {awayScore}/{awayWickets} ({formatOvers(awayOvers)})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {match.weather || 'Sunny'} • {match.pitch_type || 'Normal'}
                          </p>
                        </div>
                        <Badge variant={resultVariant} className="ml-3">
                          {result}
                        </Badge>
                      </div>
                    );
                  })}
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
