'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import DragDropLineup from '@/components/DragDropLineup';
import {
  Users,
  Trophy,
  Edit,
  PlusCircle,
  Coins
} from 'lucide-react';

export default function LineupsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [isCreatingLineup, setIsCreatingLineup] = useState(false);
  const [isEditingLineup, setIsEditingLineup] = useState(false);
  const [editingLineupId, setEditingLineupId] = useState(null);
  const [newLineup, setNewLineup] = useState({
    name: '',
    players: [],
    captain_id: '',
    wicketkeeper_id: '',
    first_bowler_id: '',
    second_bowler_id: '',
    is_main: false
  });
  const [playingXI, setPlayingXI] = useState([]);
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

      // Fetch lineups
      const lineupsResponse = await fetch(`${baseUrl}/api/lineups?userId=${user.id}`);
      const lineupsData = await lineupsResponse.json();
      setLineups(lineupsData);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    }
  };

  const startEditLineup = (lineup) => {
    setEditingLineupId(lineup.id);
    setNewLineup({
      name: lineup.name,
      players: lineup.players || [],
      captain_id: lineup.captain_id,
      wicketkeeper_id: lineup.wicketkeeper_id,
      first_bowler_id: lineup.first_bowler_id,
      second_bowler_id: lineup.second_bowler_id,
      is_main: lineup.is_main
    });

    // Load the lineup players
    const lineupPlayers = players.filter(p => lineup.players.includes(p.id));
    setPlayingXI(lineupPlayers);

    setIsEditingLineup(true);
    setIsCreatingLineup(true);
  };

  const createOrUpdateLineup = async () => {
    // Validate that we have exactly 11 players in Playing XI
    if (playingXI.length !== 11 || !newLineup.captain_id || !newLineup.wicketkeeper_id ||
        !newLineup.first_bowler_id || !newLineup.second_bowler_id || !newLineup.name) {
      toast({
        title: "Error",
        description: "Please fill all required fields: 11 players in Playing XI, captain, wicketkeeper, and 2 bowlers",
        variant: "destructive",
      });
      return;
    }

    // Validate that captain, wicketkeeper, and bowlers are in the Playing XI
    const playingXIIds = playingXI.map(p => p.id);
    if (!playingXIIds.includes(newLineup.captain_id) ||
        !playingXIIds.includes(newLineup.wicketkeeper_id) ||
        !playingXIIds.includes(newLineup.first_bowler_id) ||
        !playingXIIds.includes(newLineup.second_bowler_id)) {
      toast({
        title: "Error",
        description: "Captain, wicketkeeper, and bowlers must be in the Playing XI",
        variant: "destructive",
      });
      return;
    }

    try {
      const baseUrl = '';

      const url = isEditingLineup ? `${baseUrl}/api/lineups/${editingLineupId}` : `${baseUrl}/api/lineups`;
      const method = isEditingLineup ? 'PUT' : 'POST';

      // Use only Playing XI players for the lineup
      const allPlayers = playingXI.map(p => p.id);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLineup.name,
          players: allPlayers,
          captain_id: newLineup.captain_id,
          wicketkeeper_id: newLineup.wicketkeeper_id,
          first_bowler_id: newLineup.first_bowler_id,
          second_bowler_id: newLineup.second_bowler_id,
          is_main: newLineup.is_main,
          user_id: user.id
        }),
      });

      const lineup = await response.json();

      if (response.ok) {
        if (isEditingLineup) {
          setLineups(lineups.map(l => l.id === editingLineupId ? lineup : l));
        } else {
          setLineups([...lineups, lineup]);
        }

        // Reset state
        setIsCreatingLineup(false);
        setIsEditingLineup(false);
        setEditingLineupId(null);
        setNewLineup({
          name: '',
          players: [],
          captain_id: '',
          wicketkeeper_id: '',
          first_bowler_id: '',
          second_bowler_id: '',
          is_main: false
        });
        setPlayingXI([]);

        toast({
          title: "Success!",
          description: isEditingLineup ? "Lineup updated successfully" : "Lineup created successfully",
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
        description: isEditingLineup ? "Failed to update lineup" : "Failed to create lineup",
        variant: "destructive",
      });
    }
  };

  const handlePlayersChange = (newPlayingXI) => {
    setPlayingXI(newPlayingXI);
    // Update the lineup state with player IDs
    const allPlayerIds = newPlayingXI.map(p => p.id);
    setNewLineup({...newLineup, players: allPlayerIds});
  };

  const handleRolesChange = (role, playerId) => {
    setNewLineup({...newLineup, [role + '_id']: playerId});
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
          <h2 className="text-2xl font-bold">Team Lineups</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/players')}>
              Squad
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

        <div className="flex items-center justify-between mb-6">
          <div></div>
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
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditLineup(lineup)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Lineup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Toaster />

      {/* Lineup Creation Dialog */}
      <Dialog
        open={isCreatingLineup}
        onOpenChange={(open) => {
          if (!open) {
            setPlayingXI([]);
            setNewLineup({
              name: '',
              players: [],
              captain_id: '',
              wicketkeeper_id: '',
              first_bowler_id: '',
              second_bowler_id: '',
              is_main: false
            });
          }
          setIsCreatingLineup(open);
        }}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{isEditingLineup ? 'Edit Lineup' : 'Create New Lineup'}</DialogTitle>
            <DialogDescription>
              Drag players between sections or click available players to add them. Assign roles using the dropdowns.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 overflow-hidden flex-1">
            <div className="grid grid-cols-2 gap-4 flex-shrink-0">
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

            <div className="border rounded-lg p-4 bg-muted/20 overflow-y-auto flex-1">
              <DragDropLineup
                players={players}
                playingXI={playingXI}
                captainId={newLineup.captain_id}
                wicketkeeperId={newLineup.wicketkeeper_id}
                firstBowlerId={newLineup.first_bowler_id}
                secondBowlerId={newLineup.second_bowler_id}
                onPlayersChange={handlePlayersChange}
                onRolesChange={handleRolesChange}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setPlayingXI([]);
              setNewLineup({
                name: '',
                players: [],
                captain_id: '',
                wicketkeeper_id: '',
                first_bowler_id: '',
                second_bowler_id: '',
                is_main: false
              });
              setIsCreatingLineup(false);
            }}>
              Cancel
            </Button>
            <Button
              onClick={createOrUpdateLineup}
              disabled={playingXI.length !== 11 || !newLineup.captain_id || !newLineup.wicketkeeper_id ||
                        !newLineup.first_bowler_id || !newLineup.second_bowler_id || !newLineup.name}
            >
              {isEditingLineup ? 'Update Lineup' : 'Create Lineup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
