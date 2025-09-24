'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/Navigation';
import LeagueMatchSection from '@/components/LeagueMatchSection';
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
  CalendarDays,
  History
} from 'lucide-react';

export default function LeaguePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leagueTable, setLeagueTable] = useState([]);
  const [leagueHistory, setLeagueHistory] = useState([]);
  const [leagueStatus, setLeagueStatus] = useState(null);
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
    fetchLeagueTable();
  }, [router]);

  useEffect(() => {
    // Fetch league status when user is available
    if (user) {
      fetchLeagueStatus();
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

  const fetchLeagueHistory = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/leagues?history=true`);
      const historyData = await response.json();
      setLeagueHistory(historyData.history || []);
    } catch (error) {
      console.error('Error fetching league history:', error);
    }
  };

  const fetchLeagueStatus = async () => {
    if (!user) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/matches/next?userId=${user.id}`);
      const status = await response.json();
      setLeagueStatus(status);
    } catch (error) {
      console.error('Error fetching league status:', error);
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
        fetchLeagueStatus();
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
    if (!leagueStatus?.match) return;

    // Navigate to match page with the match ID
    router.push(`/match/${leagueStatus.match.id}`);
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
        fetchLeagueTable();
        fetchLeagueStatus();
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
      <Navigation currentPage="journey" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Current Season</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2" onClick={fetchLeagueHistory}>
              <History className="w-4 h-4" />
              <span>Season History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {/* League Management */}
            <LeagueMatchSection
              leagueStatus={leagueStatus}
              onPlayMatch={handlePlayMatch}
              onQuickSim={handleQuickSim}
              onScheduleLeague={scheduleMatches}
              quickSimLoading={quickSimLoading}
              showTitle={true}
              title="League Management"
            />

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
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Season History */}
            {leagueHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No season history available</p>
                  <p className="text-sm text-muted-foreground mt-2">Complete seasons will appear here</p>
                </CardContent>
              </Card>
            ) : (
              leagueHistory.map((season) => (
                <Card key={season.season}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5" />
                      <span>Season {season.season}</span>
                      <Badge variant="outline">Completed</Badge>
                    </CardTitle>
                    <CardDescription>
                      {season.totalMatches} matches played
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                          </tr>
                        </thead>
                        <tbody>
                          {season.standings.slice(0, 3).map((team, index) => (
                            <tr key={team.id} className="border-b">
                              <td className="p-2">
                                <div className="flex items-center space-x-2">
                                  {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                                  {index === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                                  {index === 2 && <Trophy className="w-4 h-4 text-orange-600" />}
                                  <span>{index + 1}</span>
                                </div>
                              </td>
                              <td className="p-2 font-medium">{team.name}</td>
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  );
}
