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
import { Checkbox } from '@/components/ui/checkbox';
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
  Globe,
  ShoppingCart,
  PlusCircle,
  Edit,
  Coins
} from 'lucide-react';

export default function App() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { toast } = useToast();

  // Lineup creation state
  const [isCreatingLineup, setIsCreatingLineup] = useState(false);
  const [newLineup, setNewLineup] = useState({
    name: '',
    players: [],
    captain_id: '',
    wicketkeeper_id: '',
    first_bowler_id: '',
    second_bowler_id: '',
    is_main: false
  });

  // Marketplace state
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [playerToSell, setPlayerToSell] = useState(null);
  const [salePrice, setSalePrice] = useState('');

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
      const leagueResponse = await fetch(`${baseUrl}/api/leagues`);
      const leagueData = await leagueResponse.json();
      setLeagueTable(leagueData);

      // Fetch lineups
      const lineupsResponse = await fetch(`${baseUrl}/api/lineups?userId=${user.id}`);
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

  const createLineup = async () => {
    if (newLineup.players.length !== 11 || !newLineup.captain_id || !newLineup.wicketkeeper_id || 
        !newLineup.first_bowler_id || !newLineup.second_bowler_id || !newLineup.name) {
      toast({
        title: "Error",
        description: "Please fill all required fields: 11 players, captain, wicketkeeper, and 2 bowlers",
        variant: "destructive",
      });
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
      const response = await fetch(`${baseUrl}/api/lineups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLineup,
          user_id: user.id
        }),
      });

      const lineup = await response.json();

      if (response.ok) {
        setLineups([...lineups, lineup]);
        setIsCreatingLineup(false);
        setNewLineup({
          name: '',
          players: [],
          captain_id: '',
          wicketkeeper_id: '',
          first_bowler_id: '',
          second_bowler_id: '',
          is_main: false
        });
        toast({
          title: "Success!",
          description: "Lineup created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: lineup.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lineup",
        variant: "destructive",
      });
    }
  };

  const sellPlayer = async () => {
    if (!playerToSell || !salePrice) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
      const response = await fetch(`${baseUrl}/api/marketplace/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerToSell.id,
          sale_price: parseInt(salePrice)
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Player listed for sale",
        });
        setShowSellDialog(false);
        setSalePrice('');
        setPlayerToSell(null);
        fetchUserData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: "Failed to list player",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to list player",
        variant: "destructive",
      });
    }
  };

  const buyPlayer = async (player) => {
    if (!user || user.coins < player.sale_price) {
      toast({
        title: "Error",
        description: "Insufficient coins",
        variant: "destructive",
      });
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
      const response = await fetch(`${baseUrl}/api/marketplace/buy/${player.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buyerId: user.id }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Player purchased successfully",
        });
        // Update user coins
        setUser({...user, coins: user.coins - player.sale_price});
        fetchUserData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: "Failed to purchase player",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase player",
        variant: "destructive",
      });
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

  const handlePlayerSelect = (playerId, isSelected) => {
    if (isSelected && newLineup.players.length < 11) {
      setNewLineup({...newLineup, players: [...newLineup.players, playerId]});
    } else if (!isSelected) {
      setNewLineup({...newLineup, players: newLineup.players.filter(id => id !== playerId)});
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
            <CardDescription>T20 Cricket Management Game</CardDescription>
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
              <span className="hidden sm:inline">Squad</span>
            </TabsTrigger>
            <TabsTrigger value="lineups" className="flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Lineups</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Matches</span>
            </TabsTrigger>
            <TabsTrigger value="league" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">League</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Market</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Edit className="h-4 w-4 text-muted-foreground" />
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
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Virtual Coins</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.coins?.toLocaleString() || '0'}</div>
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
          </TabsContent>

          {/* Squad Tab */}
          <TabsContent value="players" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Squad ({players.length} players)</h2>
              <Button
                onClick={() => setCurrentTab('marketplace')}
                variant="outline"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse Market
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <Card key={player.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{player.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{player.age} years</Badge>
                        {player.is_for_sale && (
                          <Badge variant="secondary">For Sale</Badge>
                        )}
                      </div>
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
                          Rating: {player.rating}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Coins className="w-3 h-3" />
                          <span>{player.market_value?.toLocaleString()}</span>
                        </Badge>
                        {!player.is_for_sale && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPlayerToSell(player);
                              setShowSellDialog(true);
                            }}
                          >
                            Sell
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Lineups Tab */}
          <TabsContent value="lineups" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Team Lineups</h2>
              <Button onClick={() => setIsCreatingLineup(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Lineup
              </Button>
            </div>

            {lineups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Edit className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No lineups created yet</p>
                  <Button onClick={() => setIsCreatingLineup(true)}>
                    Create Your First Lineup
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lineups.map((lineup) => (
                  <Card key={lineup.id} className={lineup.is_main ? 'ring-2 ring-green-500' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{lineup.name}</CardTitle>
                        {lineup.is_main && <Badge variant="default">Main Lineup</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Captain:</strong> {players.find(p => p.id === lineup.captain_id)?.name || 'Unknown'}</p>
                        <p><strong>Wicketkeeper:</strong> {players.find(p => p.id === lineup.wicketkeeper_id)?.name || 'Unknown'}</p>
                        <p><strong>1st Bowler:</strong> {players.find(p => p.id === lineup.first_bowler_id)?.name || 'Unknown'}</p>
                        <p><strong>2nd Bowler:</strong> {players.find(p => p.id === lineup.second_bowler_id)?.name || 'Unknown'}</p>
                        <p><strong>Players:</strong> {lineup.players?.length || 0}/11</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">T20 Matches</h2>
              <Button onClick={createFriendlyMatch}>
                Create T20 Match
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
                            <CardTitle>T20 Match</CardTitle>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/match/${match.id}`)}
                            >
                              View Match
                            </Button>
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
          <TabsContent value="league" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>T20 League Table</CardTitle>
                <CardDescription>Current Season Standings</CardDescription>
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

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Player Marketplace</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Coins className="w-4 h-4" />
                  <span>{user.coins?.toLocaleString() || '0'} coins</span>
                </Badge>
              </div>
            </div>

            {marketplace.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No players for sale right now</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplace.map((player) => (
                  <Card key={player.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{player.name}</CardTitle>
                        <Badge variant="secondary">For Sale</Badge>
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
                            <span>Batting</span>
                            <span className={`font-medium ${getSkillColor(player.batting)}`}>
                              {getSkillName(player.batting)}
                            </span>
                          </div>
                          <Progress value={player.batting} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span>Bowling</span>
                            <span className={`font-medium ${getSkillColor(player.bowling)}`}>
                              {getSkillName(player.bowling)}
                            </span>
                          </div>
                          <Progress value={player.bowling} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {player.sale_price?.toLocaleString()} coins
                          </p>
                          <p className="text-xs text-muted-foreground">Sale Price</p>
                        </div>
                        <Button
                          onClick={() => buyPlayer(player)}
                          disabled={user.coins < player.sale_price}
                        >
                          Buy Player
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />

      {/* Lineup Creation Dialog */}
      <Dialog open={isCreatingLineup} onOpenChange={setIsCreatingLineup}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Create New Lineup</DialogTitle>
            <DialogDescription>
              Select 11 players and assign captain, wicketkeeper, and 2 main bowlers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lineup-name">Lineup Name</Label>
                <Input
                  id="lineup-name"
                  value={newLineup.name}
                  onChange={(e) => setNewLineup({...newLineup, name: e.target.value})}
                  placeholder="e.g., Main T20 Team"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="is-main"
                  checked={newLineup.is_main}
                  onCheckedChange={(checked) => setNewLineup({...newLineup, is_main: checked})}
                />
                <Label htmlFor="is-main">Set as main lineup</Label>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Captain</Label>
                <Select value={newLineup.captain_id} onValueChange={(value) => setNewLineup({...newLineup, captain_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select captain" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.filter(p => newLineup.players.includes(p.id)).map(player => (
                      <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Wicketkeeper</Label>
                <Select value={newLineup.wicketkeeper_id} onValueChange={(value) => setNewLineup({...newLineup, wicketkeeper_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select keeper" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.filter(p => newLineup.players.includes(p.id)).map(player => (
                      <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>1st Bowler</Label>
                <Select value={newLineup.first_bowler_id} onValueChange={(value) => setNewLineup({...newLineup, first_bowler_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select 1st bowler" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.filter(p => newLineup.players.includes(p.id)).map(player => (
                      <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>2nd Bowler</Label>
                <Select value={newLineup.second_bowler_id} onValueChange={(value) => setNewLineup({...newLineup, second_bowler_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select 2nd bowler" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.filter(p => newLineup.players.includes(p.id)).map(player => (
                      <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Select Players ({newLineup.players.length}/11)</Label>
              <ScrollArea className="h-64 border rounded-md p-4">
                <div className="grid grid-cols-2 gap-2">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={player.id}
                        checked={newLineup.players.includes(player.id)}
                        onCheckedChange={(checked) => handlePlayerSelect(player.id, checked)}
                        disabled={!newLineup.players.includes(player.id) && newLineup.players.length >= 11}
                      />
                      <Label htmlFor={player.id} className="text-sm">
                        {player.name} (Rating: {player.rating})
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingLineup(false)}>
              Cancel
            </Button>
            <Button
              onClick={createLineup}
              disabled={newLineup.players.length !== 11 || !newLineup.captain_id || !newLineup.wicketkeeper_id || 
                        !newLineup.first_bowler_id || !newLineup.second_bowler_id || !newLineup.name}
            >
              Create Lineup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Player Dialog */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Player</DialogTitle>
            <DialogDescription>
              Set a sale price for {playerToSell?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="sale-price">Sale Price (coins)</Label>
              <Input
                id="sale-price"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter price in coins"
              />
            </div>
            
            {playerToSell && (
              <div className="text-sm text-muted-foreground">
                <p>Market Value: {playerToSell.market_value?.toLocaleString()} coins</p>
                <p>Player Rating: {playerToSell.rating}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSellDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sellPlayer} disabled={!salePrice}>
              List for Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}