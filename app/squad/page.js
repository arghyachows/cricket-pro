'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/Navigation';
import {
  Users,
  Trophy,
  TrendingUp,
  Play,
  Calendar,
  Coins,
  Globe,
  ShoppingCart,
  Target,
  Zap,
  Shield,
  Crown,
  PlusCircle,
  Edit,
  Grid3X3,
  List,
  Filter,
  Trash2
} from 'lucide-react';

export default function SquadPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [playerToSell, setPlayerToSell] = useState(null);
  const [salePrice, setSalePrice] = useState('');
  const [isCreatingLineup, setIsCreatingLineup] = useState(false);
  const [isEditingLineup, setIsEditingLineup] = useState(false);
  const [editingLineup, setEditingLineup] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [filters, setFilters] = useState({
    battingStyle: 'all',
    bowlerType: 'all',
    form: 'all',
    minRating: '',
    maxRating: ''
  });
  const [newLineup, setNewLineup] = useState({
    name: 'Main Lineup',
    players: [],
    captain_id: '',
    wicketkeeper_id: '',
    first_bowler_id: '',
    second_bowler_id: '',
    is_main: true
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lineupToDelete, setLineupToDelete] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(savedUser));
    fetchData();
  }, [router]);

  const fetchData = async () => {
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

      // Fetch lineups
      const lineupsResponse = await fetch(`${baseUrl}/api/lineups?userId=${savedUser.id}`);
      const lineupsData = await lineupsResponse.json();
      setLineups(lineupsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        // Refresh the entire lineups list to get updated main lineup status
        const refreshedLineupsResponse = await fetch(`${baseUrl}/api/lineups?userId=${user.id}`);
        const refreshedLineups = await refreshedLineupsResponse.json();
        setLineups(refreshedLineups);

        setIsCreatingLineup(false);
        setNewLineup({
          name: 'Main Lineup',
          players: [],
          captain_id: '',
          wicketkeeper_id: '',
          first_bowler_id: '',
          second_bowler_id: '',
          is_main: true
        });
        toast({
          title: "Success!",
          description: "Main lineup created successfully",
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

  const editLineup = async () => {
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
      const response = await fetch(`${baseUrl}/api/lineups/${editingLineup.id}`, {
        method: 'PUT',
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
        // Refresh the entire lineups list to get updated main lineup status
        const refreshedLineupsResponse = await fetch(`${baseUrl}/api/lineups?userId=${user.id}`);
        const refreshedLineups = await refreshedLineupsResponse.json();
        setLineups(refreshedLineups);

        setIsEditingLineup(false);
        setEditingLineup(null);
        setNewLineup({
          name: 'Main Lineup',
          players: [],
          captain_id: '',
          wicketkeeper_id: '',
          first_bowler_id: '',
          second_bowler_id: '',
          is_main: true
        });
        toast({
          title: "Success!",
          description: "Main lineup updated successfully",
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
        description: "Failed to update lineup",
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
        fetchPlayers(); // Refresh data
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

  const fetchPlayers = async () => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (!savedUser) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/players?userId=${savedUser.id}`);
      const playersData = await response.json();
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive",
      });
    }
  };

  const handlePlayerSelect = (playerId, isSelected) => {
    if (isSelected && newLineup.players.length < 11) {
      setNewLineup({...newLineup, players: [...newLineup.players, playerId]});
    } else if (!isSelected) {
      setNewLineup({...newLineup, players: newLineup.players.filter(id => id !== playerId)});
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const deleteLineup = async () => {
    if (!lineupToDelete) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';
      const response = await fetch(`${baseUrl}/api/lineups/${lineupToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setLineups(lineups.filter(l => l.id !== lineupToDelete.id));
        setShowDeleteDialog(false);
        setLineupToDelete(null);
        toast({
          title: "Success!",
          description: "Lineup deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lineup",
        variant: "destructive",
      });
    }
  };

  // Filter players based on current filters
  const filteredPlayers = players.filter(player => {
    if (filters.battingStyle !== 'all' && player.batting_style !== filters.battingStyle) return false;
    if (filters.bowlerType !== 'all' && player.bowler_type !== filters.bowlerType) return false;
    if (filters.form !== 'all' && player.form !== filters.form) return false;
    if (filters.minRating && player.rating < parseInt(filters.minRating)) return false;
    if (filters.maxRating && player.rating > parseInt(filters.maxRating)) return false;
    return true;
  });

  const mainLineup = lineups.find(lineup => lineup.is_main);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading squad...</p>
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
      <Navigation currentPage="squad" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="squad" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="squad">Squad ({players.length} players)</TabsTrigger>
            <TabsTrigger value="lineup">Lineups</TabsTrigger>
          </TabsList>

          <TabsContent value="squad" className="space-y-6">
            {/* Squad Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Squad</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => router.push('/marketplace')}
                  variant="outline"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse Market
                </Button>
              </div>
            </div>

            {/* Filters and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Select value={filters.battingStyle} onValueChange={(value) => setFilters({...filters, battingStyle: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Batting Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    <SelectItem value="Right-handed">Right-handed</SelectItem>
                    <SelectItem value="Left-handed">Left-handed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.bowlerType} onValueChange={(value) => setFilters({...filters, bowlerType: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Bowler Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Right-arm fast">Right-arm fast</SelectItem>
                    <SelectItem value="Left-arm fast">Left-arm fast</SelectItem>
                    <SelectItem value="Right-arm medium">Right-arm medium</SelectItem>
                    <SelectItem value="Left-arm medium">Left-arm medium</SelectItem>
                    <SelectItem value="Right-arm spin">Right-arm spin</SelectItem>
                    <SelectItem value="Left-arm spin">Left-arm spin</SelectItem>
                    <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.form} onValueChange={(value) => setFilters({...filters, form: value})}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Form</SelectItem>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Terrible">Terrible</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Min Rating"
                  value={filters.minRating}
                  onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="Max Rating"
                  value={filters.maxRating}
                  onChange={(e) => setFilters({...filters, maxRating: e.target.value})}
                  className="w-24"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Squad Display */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredPlayers.map((player) => (
                  <Card key={player.id} className="hover:shadow-md transition-shadow p-3">
                    <CardHeader className="pb-2 p-0">
                      <div className="flex items-center justify-between mb-1">
                        <CardTitle className="text-base font-semibold">{player.name}</CardTitle>
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline" className="text-xs px-1 py-0">{player.age}</Badge>
                          {player.is_for_sale && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">Sale</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground">
                        {player.batting_style} • {player.bowler_type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-0">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center">
                              <Target className="w-3 h-3 mr-1" />
                              <span>Bat</span>
                            </span>
                            <span className={`font-medium ${getSkillColor(player.batting)}`}>
                              {getSkillName(player.batting)}
                            </span>
                          </div>
                          <Progress value={player.batting} className="h-1" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              <span>Bowl</span>
                            </span>
                            <span className={`font-medium ${getSkillColor(player.bowling)}`}>
                              {getSkillName(player.bowling)}
                            </span>
                          </div>
                          <Progress value={player.bowling} className="h-1" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center">
                              <Crown className="w-3 h-3 mr-1" />
                              <span>Capt</span>
                            </span>
                            <span className={`font-medium ${getSkillColor(player.captaincy)}`}>
                              {getSkillName(player.captaincy)}
                            </span>
                          </div>
                          <Progress value={player.captaincy} className="h-1" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t text-xs">
                        <div className="flex items-center space-x-1">
                          <Badge variant={player.form === 'Excellent' ? 'default' :
                                        player.form === 'Good' ? 'secondary' : 'outline'}
                                 className="text-xs px-1 py-0">
                            {player.form}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {player.rating}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline" className="flex items-center text-xs px-1 py-0">
                            <Coins className="w-2 h-2 mr-1" />
                            <span>{(player.market_value / 1000).toFixed(0)}k</span>
                          </Badge>
                          {!player.is_for_sale && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
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
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Style</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Form</TableHead>
                        <TableHead>Batting</TableHead>
                        <TableHead>Bowling</TableHead>
                        <TableHead>Keeping</TableHead>
                        <TableHead>Captaincy</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{player.name}</div>
                              {player.is_for_sale && (
                                <Badge variant="secondary" className="text-xs">For Sale</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{player.age}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{player.batting_style}</div>
                              <div className="text-muted-foreground">{player.bowler_type}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{player.rating}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={player.form === 'Excellent' ? 'default' :
                                          player.form === 'Good' ? 'secondary' : 'outline'}>
                              {player.form}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${getSkillColor(player.batting)}`}>
                              {getSkillName(player.batting)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${getSkillColor(player.bowling)}`}>
                              {getSkillName(player.bowling)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${getSkillColor(player.keeping)}`}>
                              {getSkillName(player.keeping)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${getSkillColor(player.captaincy)}`}>
                              {getSkillName(player.captaincy)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                              <Coins className="w-3 h-3" />
                              <span>{player.market_value?.toLocaleString()}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="lineup" className="space-y-6">
            {/* Lineups Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Lineups ({lineups.length})</h2>
              <Button onClick={() => setIsCreatingLineup(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Lineup
              </Button>
            </div>

            {/* All Lineups */}
            {lineups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lineups.map((lineup) => (
                  <Card key={lineup.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-base font-semibold">{lineup.name}</CardTitle>
                          {lineup.is_main && (
                            <Badge variant="default" className="text-xs">Main</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditingLineup(lineup);
                              setNewLineup({
                                name: lineup.name,
                                players: [...lineup.players],
                                captain_id: lineup.captain_id,
                                wicketkeeper_id: lineup.wicketkeeper_id,
                                first_bowler_id: lineup.first_bowler_id,
                                second_bowler_id: lineup.second_bowler_id,
                                is_main: lineup.is_main
                              });
                              setIsEditingLineup(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setLineupToDelete(lineup);
                              setShowDeleteDialog(true);
                            }}
                            disabled={lineup.is_main}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Del
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        {lineup.players?.length || 0}/11 players
                      </div>

                      {/* All Players */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Team:</div>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {lineup.players?.map((playerId, index) => {
                            const player = players.find(p => p.id === playerId);
                            if (!player) return null;

                            const isCaptain = lineup.captain_id === playerId;
                            const isWicketkeeper = lineup.wicketkeeper_id === playerId;
                            const isFirstBowler = lineup.first_bowler_id === playerId;
                            const isSecondBowler = lineup.second_bowler_id === playerId;

                            return (
                              <div key={playerId} className="flex items-center space-x-2 p-1 rounded border">
                                <span className="text-muted-foreground w-6">#{index + 1}</span>
                                <span className="font-medium flex-1">{player.name}</span>
                                <div className="flex items-center space-x-1">
                                  {isCaptain && <Badge variant="default" className="text-xs px-1 py-0">C</Badge>}
                                  {isWicketkeeper && <Badge variant="secondary" className="text-xs px-1 py-0">K</Badge>}
                                  {isFirstBowler && <Badge variant="outline" className="text-xs px-1 py-0">B1</Badge>}
                                  {isSecondBowler && <Badge variant="outline" className="text-xs px-1 py-0">B2</Badge>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Edit className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No lineups created yet</p>
                  <Button onClick={() => setIsCreatingLineup(true)}>
                    Create Your First Lineup
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

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

      {/* Lineup Creation Dialog */}
      <Dialog open={isCreatingLineup} onOpenChange={setIsCreatingLineup}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Create Main Lineup</DialogTitle>
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
                    {players.filter(p => newLineup.players.includes(p.id) &&
                      p.id !== newLineup.first_bowler_id &&
                      p.id !== newLineup.second_bowler_id).map(player => (
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
                    {players.filter(p => newLineup.players.includes(p.id) &&
                      p.id !== newLineup.wicketkeeper_id &&
                      p.id !== newLineup.second_bowler_id).map(player => (
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
                    {players.filter(p => newLineup.players.includes(p.id) &&
                      p.id !== newLineup.wicketkeeper_id &&
                      p.id !== newLineup.first_bowler_id).map(player => (
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
              Add Lineup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lineup Edit Dialog */}
      <Dialog open={isEditingLineup} onOpenChange={setIsEditingLineup}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Main Lineup</DialogTitle>
            <DialogDescription>
              Modify your main lineup by selecting different players and updating roles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-lineup-name">Lineup Name</Label>
                <Input
                  id="edit-lineup-name"
                  value={newLineup.name}
                  onChange={(e) => setNewLineup({...newLineup, name: e.target.value})}
                  placeholder="e.g., Main T20 Team"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="edit-is-main"
                  checked={newLineup.is_main}
                  onCheckedChange={(checked) => setNewLineup({...newLineup, is_main: checked})}
                />
                <Label htmlFor="edit-is-main">Set as main lineup</Label>
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
                    {players.filter(p => newLineup.players.includes(p.id) &&
                      p.id !== newLineup.first_bowler_id &&
                      p.id !== newLineup.second_bowler_id).map(player => (
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
                    {players.filter(p => newLineup.players.includes(p.id) &&
                      p.id !== newLineup.wicketkeeper_id &&
                      p.id !== newLineup.second_bowler_id).map(player => (
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
                    {players.filter(p => newLineup.players.includes(p.id) &&
                      p.id !== newLineup.wicketkeeper_id &&
                      p.id !== newLineup.first_bowler_id).map(player => (
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
                        id={`edit-${player.id}`}
                        checked={newLineup.players.includes(player.id)}
                        onCheckedChange={(checked) => handlePlayerSelect(player.id, checked)}
                        disabled={!newLineup.players.includes(player.id) && newLineup.players.length >= 11}
                      />
                      <Label htmlFor={`edit-${player.id}`} className="text-sm">
                        {player.name} (Rating: {player.rating})
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingLineup(false)}>
              Cancel
            </Button>
            <Button
              onClick={editLineup}
              disabled={newLineup.players.length !== 11 || !newLineup.captain_id || !newLineup.wicketkeeper_id ||
                        !newLineup.first_bowler_id || !newLineup.second_bowler_id || !newLineup.name}
            >
              Update Lineup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lineup Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lineup</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{lineupToDelete?.name}"?
              {lineupToDelete?.is_main && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This is your main lineup. You cannot delete the main lineup.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteLineup}
              disabled={lineupToDelete?.is_main}
            >
              Delete Lineup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
