'use client';

import { useState, useEffect } from 'react';
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
import {
  Users,
  Trophy,
  Target,
  Zap,
  Shield,
  Crown,
  Coins,
  ShoppingCart
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
          <h2 className="text-2xl font-bold">Squad Players</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Dashboard
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
