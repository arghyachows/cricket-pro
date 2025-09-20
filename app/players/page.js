'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import {
  Users,
  Trophy,
  Target,
  Zap,
  Shield,
  Crown,
  Coins,
  ShoppingCart,
  Search,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal
} from 'lucide-react';

export default function PlayersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [playerToSell, setPlayerToSell] = useState(null);
  const [salePrice, setSalePrice] = useState('');
  const { toast } = useToast();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    form: 'all',
    rating: 'all',
    position: 'all',
    sortBy: 'name'
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Filtered and sorted players
  const filteredPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      // Search filter
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesName = player.name.toLowerCase().includes(query);
        const matchesStyle = player.batting_style.toLowerCase().includes(query) ||
                           player.bowler_type.toLowerCase().includes(query);
        if (!matchesName && !matchesStyle) return false;
      }

      // Form filter
      if (filters.form !== 'all' && player.form !== filters.form) return false;

      // Rating filter
      if (filters.rating !== 'all') {
        const rating = parseInt(filters.rating);
        if (player.rating < rating || player.rating >= rating + 10) return false;
      }

      // Position filter
      if (filters.position !== 'all') {
        const hasGoodSkill = (skill) => skill >= 70;
        switch (filters.position) {
          case 'batsman':
            if (!hasGoodSkill(player.batting)) return false;
            break;
          case 'bowler':
            if (!hasGoodSkill(player.bowling)) return false;
            break;
          case 'keeper':
            if (!hasGoodSkill(player.keeping)) return false;
            break;
          case 'allrounder':
            if (!hasGoodSkill(player.batting) || !hasGoodSkill(player.bowling)) return false;
            break;
        }
      }

      return true;
    });

    // Sort players
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'age':
          return a.age - b.age;
        case 'value':
          return (b.market_value || 0) - (a.market_value || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [players, debouncedSearchQuery, filters]);

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
            <h2 className="text-2xl font-bold">Squad Players</h2>
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
        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          {/* Search Bar and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search players by name or style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={filters.form} onValueChange={(value) => setFilters({...filters, form: value})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.rating} onValueChange={(value) => setFilters({...filters, rating: value})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="90">90+</SelectItem>
                <SelectItem value="80">80-89</SelectItem>
                <SelectItem value="70">70-79</SelectItem>
                <SelectItem value="60">60-69</SelectItem>
                <SelectItem value="50">50-59</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.position} onValueChange={(value) => setFilters({...filters, position: value})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="batsman">Batsman</SelectItem>
                <SelectItem value="bowler">Bowler</SelectItem>
                <SelectItem value="keeper">Wicket Keeper</SelectItem>
                <SelectItem value="allrounder">All-rounder</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="age">Age</SelectItem>
                <SelectItem value="value">Market Value</SelectItem>
              </SelectContent>
            </Select>

            {/* Results count */}
            <div className="ml-auto text-sm text-muted-foreground">
              {filteredPlayers.length} of {players.length} players
            </div>
          </div>
        </div>

        {/* Players Display */}
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No players found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player) => (
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
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">{player.name}</h3>
                          <Badge variant="outline">{player.age} years</Badge>
                          {player.is_for_sale && (
                            <Badge variant="secondary">For Sale</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {player.batting_style} • {player.bowler_type}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span className={getSkillColor(player.batting)}>
                              Bat: {getSkillName(player.batting)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="w-3 h-3" />
                            <span className={getSkillColor(player.bowling)}>
                              Bowl: {getSkillName(player.bowling)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span className={getSkillColor(player.keeping)}>
                              Keep: {getSkillName(player.keeping)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant={player.form === 'Excellent' ? 'default' :
                                        player.form === 'Good' ? 'secondary' : 'outline'}>
                            {player.form}
                          </Badge>
                          <Badge variant="outline">
                            Rating: {player.rating}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Coins className="w-3 h-3" />
                          <span>{player.market_value?.toLocaleString()}</span>
                        </div>
                      </div>

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
        )}
      </div>

      <Toaster />

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
