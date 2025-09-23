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
  Crown
} from 'lucide-react';

export default function SquadPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [playerToSell, setPlayerToSell] = useState(null);
  const [salePrice, setSalePrice] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(savedUser));
    fetchPlayers();
  }, [router]);

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
    } finally {
      setLoading(false);
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Squad ({players.length} players)</h2>
          <Button
            onClick={() => router.push('/marketplace')}
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

      <Toaster />
    </div>
  );
}
