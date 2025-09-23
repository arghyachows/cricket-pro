'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  PlusCircle,
  Edit
} from 'lucide-react';

export default function LineupsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handlePlayerSelect = (playerId, isSelected) => {
    if (isSelected && newLineup.players.length < 11) {
      setNewLineup({...newLineup, players: [...newLineup.players, playerId]});
    } else if (!isSelected) {
      setNewLineup({...newLineup, players: newLineup.players.filter(id => id !== playerId)});
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
          <p>Loading lineups...</p>
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
              className="bg-primary text-primary-foreground"
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
              onClick={() => router.push('/marketplace')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Market
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
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
      </main>

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

      <Toaster />
    </div>
  );
}
