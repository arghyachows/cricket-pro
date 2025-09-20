'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/Navigation';
import {
  Trophy,
  Medal,
  Target,
  Coins
} from 'lucide-react';

export default function LeaguePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leagueData, setLeagueData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchLeagueData();
    }
  }, [user]);

  const fetchLeagueData = async () => {
    if (!user) return;

    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      // Fetch league data
      const leagueResponse = await fetch(`${baseUrl}/api/league?userId=${user.id}`);
      const leagueData = await leagueResponse.json();
      setLeagueData(leagueData);

    } catch (error) {
      console.error('Error fetching league data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch league data",
        variant: "destructive",
      });
    }
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
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">League Standings</h2>
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

        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">League Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              Compete against other teams in the global cricket league
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <Medal className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-medium">Win Matches</p>
                <p className="text-sm text-muted-foreground">Earn points and climb rankings</p>
              </div>
              <div className="text-center">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium">Weekly Tournaments</p>
                <p className="text-sm text-muted-foreground">Special events and rewards</p>
              </div>
              <div className="text-center">
                <Coins className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium">Prize Pool</p>
                <p className="text-sm text-muted-foreground">Win coins and exclusive players</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </div>
  );
}
