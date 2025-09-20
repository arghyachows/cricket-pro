'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/Navigation';
import {
  Users,
  Trophy,
  Play,
  Calendar,
  Coins
} from 'lucide-react';

export default function MatchesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-green-600" />
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
            <h2 className="text-2xl font-bold">T20 Matches</h2>
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
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <Button onClick={createFriendlyMatch}>
            Create T20 Match
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingMatches.length})</TabsTrigger>
            {inProgressMatches.length > 0 && (
              <TabsTrigger value="live">Live ({inProgressMatches.length})</TabsTrigger>
            )}
            <TabsTrigger value="completed">Completed ({completedMatches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No upcoming matches</p>
                  <Button onClick={createFriendlyMatch}>
                    Create T20 Match
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingMatches.map((match) => (
                  <Card key={match.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>T20 Match</CardTitle>
                        <Badge variant="outline">{match.status}</Badge>
                      </div>
                      <CardDescription>
                        Scheduled: {new Date(match.scheduled_time).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p><strong>Pitch:</strong> {match.pitch_type}</p>
                          <p><strong>Weather:</strong> {match.weather}</p>
                        </div>
                        <Link href={`/match/${match.id}`}>
                          <Button disabled={loading}>
                            {loading ? 'Simulating...' : 'Simulate Match'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {inProgressMatches.length > 0 && (
            <TabsContent value="live" className="mt-6">
              <div className="space-y-4">
                {inProgressMatches.map((match) => (
                  <Card key={match.id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span>T20 Match</span>
                          <Badge variant={match.status === 'paused' ? 'secondary' : 'default'}>
                            {match.status === 'paused' ? 'PAUSED' : 'LIVE'}
                          </Badge>
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {match.weather} • {match.pitch_type} Pitch
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {match.current_runs || 0}/{match.current_wickets || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {match.current_over || 0}.{match.current_ball || 0} overs
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          {match.current_runs && match.current_over && (
                            <div className="flex justify-between">
                              <span>Run Rate:</span>
                              <span className="font-medium">
                                {((match.current_runs / ((match.current_over * 6 + match.current_ball) / 6)) || 0).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-medium">
                              Innings {match.current_innings || 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Link href={`/match/${match.id}`} className="flex-1">
                          <Button className="w-full" disabled={loading}>
                            {match.status === 'paused' ? 'Resume Match' : 'Continue Watching'}
                          </Button>
                        </Link>
                        <Link href={`/match/${match.id}`}>
                          <Button variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="completed" className="mt-6">
            {completedMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No matches played yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedMatches.map((match) => {
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
                    <Card key={match.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>T20 Match</CardTitle>
                          <Badge variant={resultVariant}>
                            {result}
                          </Badge>
                        </div>
                        <CardDescription>
                          Played: {new Date(match.completed_at || match.scheduled_time).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <div className="text-lg font-bold text-primary">
                                {homeScore}/{homeWickets}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatOvers(homeOvers)} overs
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {user.team_name}
                              </div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <div className="text-lg font-bold text-primary">
                                {awayScore}/{awayWickets}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatOvers(awayOvers)} overs
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Opponent
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-sm text-muted-foreground">
                              {match.weather || 'Sunny'} • {match.pitch_type || 'Normal'} Pitch
                            </div>
                            <Link href={`/match/${match.id}`}>
                              <Button variant="outline" size="sm">
                                View Match Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </div>
  );
}
