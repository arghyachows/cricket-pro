'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ShoppingCart,
  Target,
  Zap,
  Shield,
  Crown
} from 'lucide-react';

export default function MarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [marketplace, setMarketplace] = useState([]);
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
    fetchMarketplace();
  }, [router]);

  const fetchMarketplace = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/marketplace`);
      const marketData = await response.json();
      setMarketplace(marketData);
    } catch (error) {
      console.error('Error fetching marketplace:', error);
      toast({
        title: "Error",
        description: "Failed to fetch marketplace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <p>Loading marketplace...</p>
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
          <div className="flex space-x-1 overflow-x-auto">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/squad')}
            >
              <Users className="w-4 h-4 mr-2" />
              Squad
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/lineups')}
            >
              <Play className="w-4 h-4 mr-2" />
              Lineups
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/matches')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Matches
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/league')}
            >
              <Trophy className="w-4 h-4 mr-2" />
              League
            </Button>
            <Button
              variant="ghost"
              className="bg-primary text-primary-foreground"
              onClick={() => router.push('/marketplace')}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Market
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
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
      </main>

      <Toaster />
    </div>
  );
}
