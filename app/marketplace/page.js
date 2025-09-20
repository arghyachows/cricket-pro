'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import {
  Trophy,
  ShoppingCart,
  Coins,
  TrendingUp,
  User
} from 'lucide-react';

export default function MarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [marketplace, setMarketplace] = useState([]);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMarketplace();
    }
  }, [user]);

  const fetchMarketplace = async () => {
    if (!user) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      // Fetch marketplace
      const marketResponse = await fetch(`${baseUrl}/api/marketplace`);
      const marketData = await marketResponse.json();
      setMarketplace(marketData);

    } catch (error) {
      console.error('Error fetching marketplace:', error);
      toast({
        title: "Error",
        description: "Failed to fetch marketplace",
        variant: "destructive",
      });
    }
  };

  const buyPlayer = async () => {
    if (!selectedPlayer || !bidAmount) return;

    const bid = parseInt(bidAmount);
    if (bid > user.coins) {
      toast({
        title: "Error",
        description: "You don't have enough coins",
        variant: "destructive",
      });
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';
      const response = await fetch(`${baseUrl}/api/marketplace/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: selectedPlayer.id,
          bid_amount: bid
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Player purchased successfully",
        });
        setShowBuyDialog(false);
        setBidAmount('');
        setSelectedPlayer(null);
        fetchMarketplace(); // Refresh marketplace
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
          <h2 className="text-2xl font-bold">Transfer Market</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/players')}>
              Squad
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
          </div>
        </div>

        {marketplace.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No players available in the market</p>
              <p className="text-sm text-muted-foreground">
                Check back later for new transfers
              </p>
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
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>Batting</span>
                        </span>
                        <span className={`font-medium ${getSkillColor(player.batting)}`}>
                          {getSkillName(player.batting)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Bowling</span>
                        </span>
                        <span className={`font-medium ${getSkillColor(player.bowling)}`}>
                          {getSkillName(player.bowling)}
                        </span>
                      </div>
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
                        <span>{player.sale_price?.toLocaleString()}</span>
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPlayer(player);
                          setShowBuyDialog(true);
                        }}
                        disabled={user.coins < player.sale_price}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Toaster />

      {/* Buy Player Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Player</DialogTitle>
            <DialogDescription>
              Purchase {selectedPlayer?.name} for the listed price
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedPlayer && (
              <div className="text-sm text-muted-foreground">
                <p><strong>Player:</strong> {selectedPlayer.name}</p>
                <p><strong>Rating:</strong> {selectedPlayer.rating}</p>
                <p><strong>Price:</strong> {selectedPlayer.sale_price?.toLocaleString()} coins</p>
                <p><strong>Your Balance:</strong> {user.coins?.toLocaleString()} coins</p>
              </div>
            )}

            {selectedPlayer && user.coins < selectedPlayer.sale_price && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                You don't have enough coins to purchase this player
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={buyPlayer}
              disabled={!selectedPlayer || user.coins < selectedPlayer.sale_price}
            >
              Buy Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
