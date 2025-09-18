'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Trophy,
  Target,
  Zap,
  Crown,
  Clock,
  BarChart3,
  Activity,
  Users,
  TrendingUp,
  Layers
} from 'lucide-react';

export default function MatchSimulation() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [match, setMatch] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [currentCommentaryIndex, setCurrentCommentaryIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [currentView, setCurrentView] = useState('commentary'); // 'commentary' or 'scorecard'
  const intervalRef = useRef(null);
  const scrollRef = useRef(null);

  // Current match state
  const [currentRuns, setCurrentRuns] = useState(0);
  const [currentWickets, setCurrentWickets] = useState(0);
  const [currentOver, setCurrentOver] = useState(0);
  const [currentBall, setCurrentBall] = useState(0);
  const [currentRunRate, setCurrentRunRate] = useState(0);
  const [requiredRunRate, setRequiredRunRate] = useState(null);
  const [target, setTarget] = useState(null);
  const [ballsLeft, setBallsLeft] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchMatch();
    }
  }, [params.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commentary]);

  const fetchMatch = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
      
      const response = await fetch(`${baseUrl}/api/matches/${params.id}`);
      const matchData = await response.json();
      
      if (response.ok) {
        setMatch(matchData);
        if (matchData.status === 'completed') {
          setSimulationComplete(true);
          setCommentary(matchData.commentary || []);
          setCurrentCommentaryIndex(matchData.commentary?.length || 0);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load match data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast({
        title: "Error",
        description: "Failed to load match",
        variant: "destructive",
      });
    }
  };

  const startSimulation = async () => {
    if (!match) return;
    
    setIsSimulating(true);
    
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
      
      const response = await fetch(`${baseUrl}/api/matches/${params.id}/simulate`);
      const result = await response.json();
      
      if (response.ok) {
        setMatchResult(result);
        setTarget(result.target);
        
        // Start live commentary simulation
        if (result.commentary && result.commentary.length > 0) {
          setCommentary([]);
          setCurrentCommentaryIndex(0);
          simulateLiveCommentary(result.commentary);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to simulate match",
          variant: "destructive",
        });
        setIsSimulating(false);
      }
    } catch (error) {
      console.error('Error simulating match:', error);
      toast({
        title: "Error",
        description: "Failed to simulate match",
        variant: "destructive",
      });
      setIsSimulating(false);
    }
  };

  const simulateLiveCommentary = (fullCommentary) => {
    let index = 0;
    
    const addNextComment = () => {
      if (index >= fullCommentary.length || isPaused) {
        if (index >= fullCommentary.length) {
          setIsSimulating(false);
          setSimulationComplete(true);
          toast({
            title: "Match Complete!",
            description: `Final Score: ${matchResult?.homeScore} vs ${matchResult?.awayScore}`,
          });
        }
        return;
      }
      
      const comment = fullCommentary[index];
      
      // Update current match state
      setCurrentRuns(comment.totalRuns);
      setCurrentWickets(comment.wickets);
      setCurrentOver(comment.over);
      setCurrentBall(comment.ball);
      setCurrentRunRate(comment.currentRunRate || 0);
      setRequiredRunRate(comment.requiredRunRate);
      setBallsLeft(comment.ballsLeft);
      
      // Add comment to display
      setCommentary(prev => [...prev, comment]);
      setCurrentCommentaryIndex(index + 1);
      
      // Show special event popup
      if (comment.isWicket || comment.runs === 4 || comment.runs === 6) {
        setCurrentEvent(comment);
        setShowEventPopup(true);
        
        // Auto-hide popup after 2 seconds
        setTimeout(() => {
          setShowEventPopup(false);
        }, 2000);
      }
      
      index++;
      
      // Continue with next comment after 0.5 seconds
      setTimeout(addNextComment, 500);
    };
    
    addNextComment();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused && isSimulating && matchResult) {
      // Resume simulation
      simulateLiveCommentary(matchResult.commentary.slice(currentCommentaryIndex));
    }
  };

  const getEventIcon = (comment) => {
    if (comment.isWicket) return <Target className="w-6 h-6 text-red-600" />;
    if (comment.runs === 6) return <Crown className="w-6 h-6 text-purple-600" />;
    if (comment.runs === 4) return <Zap className="w-6 h-6 text-blue-600" />;
    return <Trophy className="w-6 h-6 text-green-600" />;
  };

  const getEventColor = (comment) => {
    if (comment.isWicket) return 'bg-red-50 border-red-500';
    if (comment.runs === 6) return 'bg-purple-50 border-purple-500';
    if (comment.runs === 4) return 'bg-blue-50 border-blue-500';
    return 'bg-gray-50 border-gray-300';
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading match...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Match Simulation</h1>
                <p className="text-sm text-muted-foreground">{match.match_type} Match</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isSimulating && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePause}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
              
              {!isSimulating && !simulationComplete && (
                <Button onClick={startSimulation}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Simulation
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scoreboard */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Live Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {currentRuns}/{currentWickets}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentOver > 0 && `${currentOver}.${currentBall} overs`}
                  </div>
                </div>
                
                {isSimulating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Match Progress</span>
                      <span>{commentary.length} balls</span>
                    </div>
                    <Progress 
                      value={(commentary.length / (matchResult?.commentary?.length || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
                
                {simulationComplete && matchResult && (
                  <div className="space-y-2 text-center pt-4 border-t">
                    <h3 className="font-semibold text-lg">Match Result</h3>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <strong>Home:</strong> {matchResult.homeScore}
                      </div>
                      <div className="text-sm">
                        <strong>Away:</strong> {matchResult.awayScore}
                      </div>
                    </div>
                    <Badge variant="default" className="mt-2">
                      Match Complete
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Commentary */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Live Commentary</span>
                </CardTitle>
                <CardDescription>
                  {isSimulating ? 'Live ball-by-ball commentary' : 
                   simulationComplete ? 'Match completed' : 'Ready to start simulation'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
                  {commentary.length === 0 && !isSimulating && (
                    <div className="text-center py-12">
                      <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Click "Start Simulation" to begin the match</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {commentary.map((comment, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border-l-4 transition-all duration-300 ${getEventColor(comment)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {comment.over}.{comment.ball}
                            </Badge>
                            {(comment.isWicket || comment.runs === 4 || comment.runs === 6) && 
                              getEventIcon(comment)
                            }
                          </div>
                          <div className="text-sm font-medium">
                            {comment.totalRuns}/{comment.wickets}
                          </div>
                        </div>
                        
                        <p className="text-sm mb-2">{comment.commentary}</p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{comment.batsman} facing {comment.bowler}</span>
                          {comment.runs > 0 && !comment.isWicket && (
                            <Badge variant="secondary" className="text-xs">
                              {comment.runs} run{comment.runs > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Event Popup */}
      <Dialog open={showEventPopup} onOpenChange={setShowEventPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {currentEvent && getEventIcon(currentEvent)}
              <span>
                {currentEvent?.isWicket ? 'WICKET!' : 
                 currentEvent?.runs === 6 ? 'SIX!' :
                 currentEvent?.runs === 4 ? 'FOUR!' : 'Great Shot!'}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            {currentEvent && (
              <>
                <p className="text-lg font-medium mb-2">{currentEvent.commentary}</p>
                <div className="text-sm text-muted-foreground">
                  Over {currentEvent.over}.{currentEvent.ball} • {currentEvent.totalRuns}/{currentEvent.wickets}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}