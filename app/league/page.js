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
  TrendingUp,
  Play,
  Calendar,
  Coins,
  Globe,
  PlayCircle,
  SkipForward,
  CalendarDays
} from 'lucide-react';

export default function LeaguePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leagueTable, setLeagueTable] = useState([]);
  const [tournamentStatus, setTournamentStatus] = useState(null);
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
    fetchLeagueTable();
  }, [router]);

  useEffect(() => {
    // Fetch tournament status when user is available
    if (user) {
      fetchTournamentStatus();
    }
  }, [user]);

  const fetchLeagueTable = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/leagues`);
      const leagueData = await response.json();
      setLeagueTable(leagueData);
    } catch (error) {
      console.error('Error fetching league table:', error);
      toast({
        title: "Error",
        description: "Failed to fetch league table",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const scheduleMatches = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/matches/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leagueId: 'default' }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Scheduled ${result.totalMatches} matches for ${result.teamsCount} teams`,
        });
        fetchTournamentStatus();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to schedule matches",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error scheduling matches:', error);
      toast({
        title: "Error",
        description: "Failed to schedule matches",
        variant: "destructive",
      });
    }
  };

  const handlePlayMatch = async () => {
    if (!tournamentStatus?.match) return;

    // Navigate to match page with the match ID
    router.push(`/match/${tournamentStatus.match.id}`);
  };

  const handleSimulateMatch = async () => {
    if (!tournamentStatus?.match) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/matches/${tournamentStatus.match.id}/simulate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Match Simulated",
          description: `${result.homeScore} vs ${result.awayScore}`,
        });
        fetchLeagueTable();
        fetchTournamentStatus();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to simulate match",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error simulating match:', error);
      toast({
        title: "Error",
        description: "Failed to simulate match",
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
          <p>Loading league...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

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
                <Globe className="w-4 h-4" />
                <span>{user.country}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
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
              className="flex-shrink-0"
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
              onClick={() => router.push('/matches')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Matches</span>
            </Button>
            <Button
              variant="ghost"
              className="bg-primary text-primary-foreground flex-shrink-0"
              onClick={() => router.push('/league')}
            >
              <Trophy className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">League</span>
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
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Tournament Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5" />
              <span>Tournament Management</span>
            </CardTitle>
            <CardDescription>Schedule and manage league matches</CardDescription>
          </CardHeader>
          <CardContent>
            {tournamentStatus ? (
              <div className="space-y-4">
                {tournamentStatus.status === 'tournament_complete' ? (
                  <div className="text-center py-4">
                    <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Tournament Complete!</h3>
                    <p className="text-muted-foreground mb-4">
                      All {tournamentStatus.totalMatches} matches have been completed.
                    </p>
                    <Button onClick={scheduleMatches} className="flex items-center space-x-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Start New Tournament</span>
                    </Button>
                  </div>
                ) : tournamentStatus.status === 'match_in_progress' ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <PlayCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <h3 className="font-semibold">Match in Progress</h3>
                        <p className="text-sm text-muted-foreground">
                          {tournamentStatus.match.home_team_name} vs {tournamentStatus.match.away_team_name}
                        </p>
                      </div>
                    </div>

                    {tournamentStatus.userInvolved ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Your team is playing in this match. You can play it now or wait for it to complete.
                        </p>
                        <Button onClick={handlePlayMatch} className="flex items-center space-x-2">
                          <PlayCircle className="w-4 h-4" />
                          <span>Play Match</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          This match doesn't involve your team. You can simulate it to proceed to the next match.
                        </p>
                        <Button onClick={handleSimulateMatch} variant="outline" className="flex items-center space-x-2">
                          <SkipForward className="w-4 h-4" />
                          <span>Simulate Match</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : tournamentStatus.status === 'next_match_available' ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Next Match</h3>
                        <p className="text-sm text-muted-foreground">
                          {tournamentStatus.match.home_team_name} vs {tournamentStatus.match.away_team_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Round {tournamentStatus.match.round} • Match {tournamentStatus.match.match_number}
                        </p>
                      </div>
                    </div>

                    {tournamentStatus.canProceed ? (
                      tournamentStatus.userInvolved ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Your team is playing next. Click to start the match!
                          </p>
                          <Button onClick={handlePlayMatch} className="flex items-center space-x-2">
                            <PlayCircle className="w-4 h-4" />
                            <span>Play Your Match</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            This match doesn't involve your team. Simulate it to proceed to your next match.
                          </p>
                          <Button onClick={handleSimulateMatch} variant="outline" className="flex items-center space-x-2">
                            <SkipForward className="w-4 h-4" />
                            <span>Simulate Match</span>
                          </Button>
                        </div>
                      )
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {tournamentStatus.previousMatchesPending} previous match{tournamentStatus.previousMatchesPending > 1 ? 'es' : ''} must be completed first.
                        </p>
                        <Badge variant="secondary">Waiting for previous matches</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Tournament Scheduled</h3>
                    <p className="text-muted-foreground mb-4">
                      Schedule matches to start the tournament.
                    </p>
                    <Button onClick={scheduleMatches} className="flex items-center space-x-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Schedule Tournament</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading tournament status...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* League Table */}
        <Card>
          <CardHeader>
            <CardTitle>T20 League Table</CardTitle>
            <CardDescription>
              {leagueTable.leagueTable && leagueTable.leagueTable.length > 0 && leagueTable.season
                ? `Season ${leagueTable.season} Standings`
                : 'Current Season Standings'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!leagueTable.leagueTable || leagueTable.leagueTable.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No league data available</p>
                <p className="text-sm text-muted-foreground mt-2">Play some matches to see league standings</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Pos</th>
                      <th className="text-left p-2">Team</th>
                      <th className="text-center p-2">P</th>
                      <th className="text-center p-2">W</th>
                      <th className="text-center p-2">L</th>
                      <th className="text-center p-2">T</th>
                      <th className="text-center p-2">Pts</th>
                      <th className="text-center p-2">NRR</th>
                      <th className="text-center p-2">Avg</th>
                      <th className="text-center p-2">Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueTable.leagueTable.map((team, index) => (
                      <tr
                        key={team.id}
                        className={`border-b hover:bg-muted/50 ${team.id === user.id ? 'bg-green-50 font-medium' : ''}`}
                      >
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <div>
                            {team.name}
                            {team.id === user.id && <Badge variant="outline" className="ml-2">You</Badge>}
                          </div>
                          {team.highestScore > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Best: {team.highestScore} • Worst: {team.lowestScore}
                            </div>
                          )}
                        </td>
                        <td className="text-center p-2">{team.played}</td>
                        <td className="text-center p-2">{team.won}</td>
                        <td className="text-center p-2">{team.lost}</td>
                        <td className="text-center p-2">{team.tied}</td>
                        <td className="text-center p-2 font-semibold">{team.points}</td>
                        <td className="text-center p-2">
                          <span className={team.netRunRate > 0 ? 'text-green-600' : team.netRunRate < 0 ? 'text-red-600' : ''}>
                            {team.netRunRate}
                          </span>
                        </td>
                        <td className="text-center p-2">{team.averageScore}</td>
                        <td className="text-center p-2">
                          <div className="flex justify-center space-x-1">
                            {(team.form || []).slice(0, 5).map((result, idx) => (
                              <Badge
                                key={idx}
                                variant={result === 'W' ? 'default' : result === 'L' ? 'destructive' : 'secondary'}
                                className="w-5 h-5 text-xs p-0 flex items-center justify-center"
                              >
                                {result}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Toaster />
    </div>
  );
}
