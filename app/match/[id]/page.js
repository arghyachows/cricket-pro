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
import Navigation from '@/components/Navigation';
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
  Layers,
  Coins
} from 'lucide-react';

export default function MatchSimulation() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
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
  const [showExitDialog, setShowExitDialog] = useState(false);
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
    // Check if user is logged in
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

  useEffect(() => {
    if (params.id && user) {
      fetchMatch();
      checkForBackgroundMatch();
    }
  }, [params.id, user]);

  const checkForBackgroundMatch = () => {
    try {
      const savedMatch = localStorage.getItem('backgroundMatch');
      if (savedMatch) {
        const matchState = JSON.parse(savedMatch);
        if (matchState.matchId === params.id) {
          // Restore saved state
          setCurrentCommentaryIndex(matchState.currentCommentaryIndex);
          setIsSimulating(matchState.isSimulating);
          setIsPaused(matchState.isPaused);
          setSimulationComplete(matchState.simulationComplete);
          setMatchResult(matchState.matchResult);
          setCurrentRuns(matchState.currentRuns);
          setCurrentWickets(matchState.currentWickets);
          setCurrentOver(matchState.currentOver);
          setCurrentBall(matchState.currentBall);
          setTarget(matchState.target);
          
          // Clear the background match since we're back
          localStorage.removeItem('backgroundMatch');
          
          // Resume simulation if it was running
          if (matchState.isSimulating && !matchState.isPaused && !matchState.simulationComplete) {
            setTimeout(() => {
              simulateLiveCommentary(matchState.matchResult.commentary.slice(matchState.currentCommentaryIndex));
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error restoring background match:', error);
      localStorage.removeItem('backgroundMatch');
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commentary]);

  const fetchMatch = async () => {
    try {
      const baseUrl = '';
      
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
      const baseUrl = '';
      
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
          // Clear background match since simulation is complete
          localStorage.removeItem('backgroundMatch');
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

  const handleBackClick = () => {
    if (isSimulating && !simulationComplete) {
      setShowExitDialog(true);
    } else {
      router.push('/');
    }
  };

  const confirmExit = () => {
    // Save match state to localStorage for background continuation
    if (isSimulating && matchResult) {
      const matchState = {
        matchId: params.id,
        currentCommentaryIndex,
        isSimulating,
        isPaused,
        simulationComplete,
        matchResult,
        currentRuns,
        currentWickets,
        currentOver,
        currentBall,
        target,
        timestamp: Date.now()
      };
      localStorage.setItem('backgroundMatch', JSON.stringify(matchState));
    }
    
    setShowExitDialog(false);
    router.push('/');
  };

  const getEventIcon = (comment) => {
    if (comment.isWicket) return <Target className="w-6 h-6 text-destructive" />;
    if (comment.runs === 6) return <Crown className="w-6 h-6 text-purple-500 dark:text-purple-400" />;
    if (comment.runs === 4) return <Zap className="w-6 h-6 text-blue-500 dark:text-blue-400" />;
    return <Trophy className="w-6 h-6 text-green-500 dark:text-green-400" />;
  };

  const getEventColor = (comment) => {
    if (comment.isWicket) return 'bg-destructive/10 border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30';
    if (comment.runs === 6) return 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700';
    if (comment.runs === 4) return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
    return 'bg-muted border-border';
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading match...</p>
        </div>
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
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Cricket Manager Pro</h1>
                <p className="text-sm text-muted-foreground">Match Simulation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Coins className="w-4 h-4" />
                <span>{user?.coins?.toLocaleString() || '0'} coins</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>{user?.country || 'Country'}</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{match.match_type} Match Simulation</h2>
                <p className="text-sm text-muted-foreground">
                  {match.weather} • {match.pitch_type} Pitch • {match.status}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Navigation
                user={user}
                onLogout={() => {
                  localStorage.removeItem('user');
                  router.push('/');
                }}
              />
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
      </nav>

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
                {/* Match Conditions */}
                <div className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                  <span>{match.weather}</span>
                  <span>•</span>
                  <span>{match.pitch_type} Pitch</span>
                </div>

                {/* Current Score */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {currentRuns}/{currentWickets}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentOver > 0 && `${currentOver}.${currentBall} overs`}
                  </div>
                </div>

                {/* Run Rates */}
                {(currentRunRate > 0 || requiredRunRate) && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted/30 rounded border">
                      <div className="font-semibold text-foreground">{currentRunRate.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Current RR</div>
                    </div>
                    {requiredRunRate && (
                      <div className="text-center p-2 bg-muted/30 rounded border">
                        <div className={`font-semibold ${requiredRunRate > currentRunRate + 2 ? 'text-destructive' : 'text-orange-600 dark:text-orange-400'}`}>
                          {requiredRunRate.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Required RR</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Target Information */}
                {target && ballsLeft && (
                  <div className="text-center p-2 bg-muted/30 rounded border text-sm">
                    <div className="font-medium">
                      Need {Math.max(0, target - currentRuns)} runs from {ballsLeft} balls
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: {target}
                    </div>
                  </div>
                )}
                
                {/* Match Progress */}
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
                
                {/* Final Result */}
                {simulationComplete && matchResult && (
                  <div className="space-y-2 text-center pt-4 border-t">
                    <h3 className="font-semibold text-lg">Match Result</h3>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>{matchResult.homeTeamName}:</strong> {matchResult.homeScore} ({matchResult.homeOvers} overs)
                      </div>
                      <div className="text-sm">
                        <strong>{matchResult.awayTeamName}:</strong> {matchResult.awayScore} ({matchResult.awayOvers} overs)
                      </div>
                      {matchResult.winMargin && matchResult.winType && (
                        <div className="text-sm font-medium text-primary">
                          Won by {matchResult.winMargin} {matchResult.winType}
                        </div>
                      )}
                    </div>
                    <Badge variant="default" className="mt-2">
                      Match Complete
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Commentary/Scorecard */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {currentView === 'commentary' ? (
                      <>
                        <Clock className="w-5 h-5" />
                        <span>Live Commentary</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-5 h-5" />
                        <span>Scorecard</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant={currentView === 'commentary' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('commentary')}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Commentary
                    </Button>
                    <Button
                      variant={currentView === 'scorecard' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('scorecard')}
                      disabled={!matchResult}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Scorecard
                    </Button>
                  </div>
                </div>
                
                <CardDescription>
                  {currentView === 'commentary' 
                    ? (isSimulating ? 'Live ball-by-ball commentary' : 
                       simulationComplete ? 'Match completed' : 'Ready to start simulation')
                    : 'Detailed match statistics and player performances'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {currentView === 'commentary' ? (
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
                              {comment.isPowerplay && (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  PP
                                </Badge>
                              )}
                              {comment.isDeathOvers && (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Death
                                </Badge>
                              )}
                              {(comment.isWicket || comment.runs === 4 || comment.runs === 6 || comment.milestone) && 
                                getEventIcon(comment)
                              }
                            </div>
                            <div className="text-sm font-medium">
                              {comment.totalRuns}/{comment.wickets}
                              {comment.currentRunRate && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  RR: {comment.currentRunRate.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm mb-2">{comment.commentary}</p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{comment.batsman} facing {comment.bowler}</span>
                            <div className="flex items-center space-x-2">
                              {comment.runs > 0 && !comment.isWicket && (
                                <Badge variant="secondary" className="text-xs">
                                  {comment.runs} run{comment.runs > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {comment.extras && (
                                <Badge variant="outline" className="text-xs">
                                  {comment.extras}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  // Scorecard View
                  <ScrollArea className="h-[500px] p-4">
                    {matchResult && matchResult.firstInnings && matchResult.secondInnings ? (
                      <div className="space-y-6">
                        {/* First Innings */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <Trophy className="w-5 h-5 mr-2" />
                            {matchResult.homeTeamName} - {matchResult.homeScore}
                          </h3>
                          
                          {/* Batting Scorecard */}
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Batting</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead>
                                  <tr className="border-b bg-muted/30">
                                    <th className="text-left p-2">Batsman</th>
                                    <th className="text-center p-2">R</th>
                                    <th className="text-center p-2">B</th>
                                    <th className="text-center p-2">4s</th>
                                    <th className="text-center p-2">6s</th>
                                    <th className="text-center p-2">SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.firstInnings.batsmanScores?.map((batsman, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="p-2">
                                        {batsman.name}
                                        {batsman.out && (
                                          <div className="text-xs text-destructive">
                                            {batsman.outType} b {batsman.bowler}
                                          </div>
                                        )}
                                      </td>
                                      <td className="text-center p-2 font-medium">{batsman.runs}</td>
                                      <td className="text-center p-2">{batsman.balls}</td>
                                      <td className="text-center p-2">{batsman.fours}</td>
                                      <td className="text-center p-2">{batsman.sixes}</td>
                                      <td className="text-center p-2">{batsman.strikeRate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Figures */}
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Bowling</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead>
                                  <tr className="border-b bg-muted/30">
                                    <th className="text-left p-2">Bowler</th>
                                    <th className="text-center p-2">O</th>
                                    <th className="text-center p-2">M</th>
                                    <th className="text-center p-2">R</th>
                                    <th className="text-center p-2">W</th>
                                    <th className="text-center p-2">Econ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.firstInnings.bowlingFigures?.map((bowler, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="p-2">{bowler.name}</td>
                                      <td className="text-center p-2">{bowler.overs}</td>
                                      <td className="text-center p-2">{bowler.maidens}</td>
                                      <td className="text-center p-2">{bowler.runs}</td>
                                      <td className="text-center p-2 font-medium">{bowler.wickets}</td>
                                      <td className="text-center p-2">{bowler.economy}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Second Innings */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <Trophy className="w-5 h-5 mr-2" />
                            {matchResult.awayTeamName} - {matchResult.awayScore}
                          </h3>
                          
                          {/* Batting Scorecard */}
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Batting</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead>
                                  <tr className="border-b bg-muted/30">
                                    <th className="text-left p-2">Batsman</th>
                                    <th className="text-center p-2">R</th>
                                    <th className="text-center p-2">B</th>
                                    <th className="text-center p-2">4s</th>
                                    <th className="text-center p-2">6s</th>
                                    <th className="text-center p-2">SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.secondInnings.batsmanScores?.map((batsman, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="p-2">
                                        {batsman.name}
                                        {batsman.out && (
                                          <div className="text-xs text-destructive">
                                            {batsman.outType} b {batsman.bowler}
                                          </div>
                                        )}
                                      </td>
                                      <td className="text-center p-2 font-medium">{batsman.runs}</td>
                                      <td className="text-center p-2">{batsman.balls}</td>
                                      <td className="text-center p-2">{batsman.fours}</td>
                                      <td className="text-center p-2">{batsman.sixes}</td>
                                      <td className="text-center p-2">{batsman.strikeRate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Figures */}
                          <div>
                            <h4 className="font-medium mb-2">Bowling</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead>
                                  <tr className="border-b bg-muted/30">
                                    <th className="text-left p-2">Bowler</th>
                                    <th className="text-center p-2">O</th>
                                    <th className="text-center p-2">M</th>
                                    <th className="text-center p-2">R</th>
                                    <th className="text-center p-2">W</th>
                                    <th className="text-center p-2">Econ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.secondInnings.bowlingFigures?.map((bowler, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="p-2">{bowler.name}</td>
                                      <td className="text-center p-2">{bowler.overs}</td>
                                      <td className="text-center p-2">{bowler.maidens}</td>
                                      <td className="text-center p-2">{bowler.runs}</td>
                                      <td className="text-center p-2 font-medium">{bowler.wickets}</td>
                                      <td className="text-center p-2">{bowler.economy}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Scorecard will be available after match simulation</p>
                      </div>
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Match Simulation?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>The match is currently in progress. If you exit:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>The match will continue running in the background</li>
              <li>You can return to this match from the dashboard</li>
              <li>Your current position will be saved</li>
            </ul>
            <p className="text-sm">Are you sure you want to exit?</p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Stay in Match
            </Button>
            <Button onClick={confirmExit}>
              Exit to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
