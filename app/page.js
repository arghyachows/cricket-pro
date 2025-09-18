'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import { 
  Users, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Play, 
  User,
  Star,
  Shield,
  Target,
  Zap,
  Heart,
  Crown,
  DollarSign,
  Globe
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchCommentary, setMatchCommentary] = useState([]);
  const { toast } = useToast();

  // Auth state
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    username: '',
    team_name: '',
    country: 'England',
    nationality: 'English'
  });

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

      // Fetch league table
      const leagueResponse = await fetch(`${baseUrl}/api/leagues?type=SOD`);
      const leagueData = await leagueResponse.json();
      setLeagueTable(leagueData);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
      const endpoint = authMode === 'login' ? `${baseUrl}/api/auth/login` : `${baseUrl}/api/auth/register`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authForm),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        toast({
          title: "Success",
          description: authMode === 'login' ? "Logged in successfully!" : "Account created successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSkillName = (value) => {
    if (value >= 96) return 'Legendary';
    if (value >= 91) return 'Exceptional';
    if (value >= 81) return 'Quality';
    if (value >= 71) return 'Capable';
    if (value >= 61) return 'Reasonable';
    if (value >= 51) return 'Moderate';
    if (value >= 41) return 'Inadequate';
    if (value >= 31) return 'Weak';
    if (value >= 21) return 'Poor';
    if (value >= 11) return 'Dreadful';
    return 'Atrocious';
  };

  const getSkillColor = (value) => {
    if (value >= 96) return 'text-purple-600';
    if (value >= 91) return 'text-blue-600';
    if (value >= 81) return 'text-green-600';
    if (value >= 71) return 'text-lime-600';
    if (value >= 61) return 'text-yellow-600';
    if (value >= 51) return 'text-orange-600';
    if (value >= 41) return 'text-red-400';
    if (value >= 31) return 'text-red-500';
    if (value >= 21) return 'text-red-600';
    if (value >= 11) return 'text-red-700';
    return 'text-red-800';
  };

  const simulateMatch = (matchId) => {
    // Navigate to the live match simulation page
    window.location.href = `/match/${matchId}`;
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
      // For demo, create a match against a random opponent
      const response = await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          home_team_id: user.id,
          away_team_id: 'demo-opponent',
          match_type: 'SOD',
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
          description: "Your friendly match has been scheduled",
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">From the Pavilion</CardTitle>
            <CardDescription>Cricket Management Game</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={setAuthMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleAuth} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    required
                  />
                </div>

                {authMode === 'register' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={authForm.username}
                        onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="team_name">Team Name</Label>
                      <Input
                        id="team_name"
                        value={authForm.team_name}
                        onChange={(e) => setAuthForm({...authForm, team_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select value={authForm.country} onValueChange={(value) => setAuthForm({...authForm, country: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="England">England</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="Pakistan">Pakistan</SelectItem>
                          <SelectItem value="South Africa">South Africa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Loading...' : (authMode === 'login' ? 'Login' : 'Create Account')}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  const seniorPlayers = players.filter(p => p.squad_type === 'senior');
  const youthPlayers = players.filter(p => p.squad_type === 'youth');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'completed');

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
                <Globe className="w-4 h-4" />
                <span>{user.country}</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUser(null)}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Players</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Matches</span>
            </TabsTrigger>
            <TabsTrigger value="leagues" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">League</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Finances</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Senior Players</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{seniorPlayers.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Youth Players</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{youthPlayers.length}</div>
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
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Matches</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foregreen" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedMatches.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingMatches.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No upcoming matches</p>
                      <Button onClick={createFriendlyMatch}>
                        Create Friendly Match
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingMatches.slice(0, 3).map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{match.match_type} Match</p>
                            <p className="text-sm text-muted-foreground">
                              vs {match.away_team_id === user.id ? 'Home Team' : 'Away Team'}
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
                            <p className="font-medium">{match.match_type} Match</p>
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
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6 mt-6">
            <Tabs defaultValue="senior" className="w-full">
              <TabsList>
                <TabsTrigger value="senior">Senior Squad ({seniorPlayers.length})</TabsTrigger>
                <TabsTrigger value="youth">Youth Squad ({youthPlayers.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="senior" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seniorPlayers.map((player) => (
                    <Card key={player.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{player.name}</CardTitle>
                          <Badge variant="outline">{player.age} years</Badge>
                        </div>
                        <CardDescription className="flex items-center space-x-2">
                          <span>{player.batting_style}</span>
                          <span>•</span>
                          <span>{player.bowler_type}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center space-x-1">
                                <Target className="w-3 h-3" />
                                <span>Batting</span>
                              </span>
                              <span className={`font-medium ${getSkillColor(player.batting)}`}>
                                {getSkillName(player.batting)}
                              </span>
                            </div>
                            <Progress value={player.batting} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center space-x-1">
                                <Zap className="w-3 h-3" />
                                <span>Bowling</span>
                              </span>
                              <span className={`font-medium ${getSkillColor(player.bowling)}`}>
                                {getSkillName(player.bowling)}
                              </span>
                            </div>
                            <Progress value={player.bowling} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center space-x-1">
                                <Shield className="w-3 h-3" />
                                <span>Keeping</span>
                              </span>
                              <span className={`font-medium ${getSkillColor(player.keeping)}`}>
                                {getSkillName(player.keeping)}
                              </span>
                            </div>
                            <Progress value={player.keeping} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center space-x-1">
                                <Crown className="w-3 h-3" />
                                <span>Captaincy</span>
                              </span>
                              <span className={`font-medium ${getSkillColor(player.captaincy)}`}>
                                {getSkillName(player.captaincy)}
                              </span>
                            </div>
                            <Progress value={player.captaincy} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-2">
                            <Badge variant={player.form === 'Excellent' ? 'default' : 
                                          player.form === 'Good' ? 'secondary' : 'outline'}>
                              {player.form}
                            </Badge>
                            <Badge variant="outline">
                              ${player.wage?.toLocaleString() || '0'}/week
                            </Badge>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">Rating: {player.rating}</div>
                            <div className="text-muted-foreground">{player.nationality}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="youth" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {youthPlayers.map((player) => (
                    <Card key={player.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{player.name}</CardTitle>
                          <Badge variant="outline">{player.age} years</Badge>
                        </div>
                        <CardDescription className="flex items-center space-x-2">
                          <span>{player.batting_style}</span>
                          <span>•</span>
                          <span>{player.bowler_type}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center space-x-1">
                                <Target className="w-3 h-3" />
                                <span>Batting</span>
                              </span>
                              <span className={`font-medium ${getSkillColor(player.batting)}`}>
                                {getSkillName(player.batting)}
                              </span>
                            </div>
                            <Progress value={player.batting} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center space-x-1">
                                <Zap className="w-3 h-3" />
                                <span>Bowling</span>
                              </span>
                              <span className={`font-medium ${getSkillColor(player.bowling)}`}>
                                {getSkillName(player.bowling)}
                              </span>
                            </div>
                            <Progress value={player.bowling} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center space-x-1">
                                <Shield className="w-3 h-3" />
                                <span>Keeping</span>
                              </span>
                              <span className={`font-medium ${getSkillColor(player.keeping)}`}>
                                {getSkillName(player.keeping)}
                              </span>
                            </div>
                            <Progress value={player.keeping} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center space-x-1">
                                <Crown className="w-3 h-3" />
                                <span>Captaincy</span>
                              </span>
                              <span className={`font-medium ${getSkillColor(player.captaincy)}`}>
                                {getSkillName(player.captaincy)}
                              </span>
                            </div>
                            <Progress value={player.captaincy} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-2">
                            <Badge variant={player.form === 'Excellent' ? 'default' : 
                                          player.form === 'Good' ? 'secondary' : 'outline'}>
                              {player.form}
                            </Badge>
                            <Badge variant="outline">
                              ${player.wage?.toLocaleString() || '0'}/week
                            </Badge>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">Rating: {player.rating}</div>
                            <div className="text-muted-foreground">{player.nationality}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Matches</h2>
              <Button onClick={createFriendlyMatch}>
                Create Friendly Match
              </Button>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming ({upcomingMatches.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedMatches.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="mt-6">
                {upcomingMatches.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No upcoming matches</p>
                      <Button onClick={createFriendlyMatch}>
                        Create Friendly Match
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <Card key={match.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>{match.match_type} Match</CardTitle>
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
                            <Button 
                              onClick={() => simulateMatch(match.id)}
                              disabled={loading}
                            >
                              {loading ? 'Simulating...' : 'Simulate Match'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
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
                    {completedMatches.map((match) => (
                      <Card key={match.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>{match.match_type} Match</CardTitle>
                            <Badge variant={match.result === user.id ? 'default' : 'destructive'}>
                              {match.result === user.id ? 'Won' : 'Lost'}
                            </Badge>
                          </div>
                          <CardDescription>
                            Played: {new Date(match.scheduled_time).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold">
                              Final Score: {match.home_score} - {match.away_score}
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  View Commentary
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>Match Commentary</DialogTitle>
                                  <DialogDescription>
                                    {match.match_type} Match - Final Score: {match.home_score} - {match.away_score}
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-96">
                                  <div className="space-y-2">
                                    {match.commentary?.map((comment, index) => (
                                      <div 
                                        key={index} 
                                        className={`p-2 rounded text-sm ${
                                          comment.isWicket ? 'bg-red-50 border-l-4 border-red-500' : 
                                          comment.runs === 6 ? 'bg-green-50 border-l-4 border-green-500' :
                                          comment.runs === 4 ? 'bg-blue-50 border-l-4 border-blue-500' :
                                          'bg-muted'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium">
                                            Over {comment.over}.{comment.ball}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {comment.totalRuns}/{comment.wickets}
                                          </span>
                                        </div>
                                        <p>{comment.commentary}</p>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* League Tab */}
          <TabsContent value="leagues" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Senior One Day League</CardTitle>
                <CardDescription>Division I Table</CardDescription>
              </CardHeader>
              <CardContent>
                {leagueTable.length === 0 ? (
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
                        </tr>
                      </thead>
                      <tbody>
                        {leagueTable.map((team, index) => (
                          <tr 
                            key={team.id} 
                            className={`border-b hover:bg-muted/50 ${team.id === user.id ? 'bg-green-50 font-medium' : ''}`}
                          >
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">
                              {team.name}
                              {team.id === user.id && <Badge variant="outline" className="ml-2">You</Badge>}
                            </td>
                            <td className="text-center p-2">{team.played}</td>
                            <td className="text-center p-2">{team.won}</td>
                            <td className="text-center p-2">{team.lost}</td>
                            <td className="text-center p-2">{team.tied}</td>
                            <td className="text-center p-2 font-semibold">{team.points}</td>
                            <td className="text-center p-2">{team.runRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Senior Academy</CardTitle>
                  <CardDescription>Train your senior squad players</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Academy training system</p>
                    <p className="text-sm text-muted-foreground">Coming soon - assign training programs to improve player skills</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Youth Academy</CardTitle>
                  <CardDescription>Develop young talent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Youth development system</p>
                    <p className="text-sm text-muted-foreground">Coming soon - recruit and train youth players</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Finances Tab */}
          <TabsContent value="finances" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">$25,000</div>
                  <p className="text-xs text-muted-foreground">Gate receipts + Sponsorship</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Expenses</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${seniorPlayers.reduce((sum, p) => sum + (p.wage || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Player wages</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Position</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foresfbdoreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(25000 - seniorPlayers.reduce((sum, p) => sum + (p.wage || 0), 0)).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Weekly profit/loss</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Your club's financial status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Financial management system</p>
                  <p className="text-sm text-muted-foreground">Coming soon - detailed financial tracking, transfers, and budget management</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
      
      {/* Match Result Dialog */}
      {selectedMatch && (
        <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Match Result</DialogTitle>
              <DialogDescription>
                {selectedMatch.match_type} Match - Final Score: {selectedMatch.homeScore} vs {selectedMatch.awayScore}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {matchCommentary.map((comment, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded ${
                      comment.isWicket ? 'bg-red-50 border-l-4 border-red-500' : 
                      comment.runs === 6 ? 'bg-green-50 border-l-4 border-green-500' :
                      comment.runs === 4 ? 'bg-blue-50 border-l-4 border-blue-500' :
                      'bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        Over {comment.over}.{comment.ball}
                      </span>
                      <span className="text-sm font-medium">
                        {comment.totalRuns}/{comment.wickets}
                      </span>
                    </div>
                    <p className="text-sm">{comment.commentary}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{comment.batsman} facing {comment.bowler}</span>
                      {comment.runs > 0 && !comment.isWicket && (
                        <Badge variant="outline" className="text-xs">
                          {comment.runs} run{comment.runs > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setSelectedMatch(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}