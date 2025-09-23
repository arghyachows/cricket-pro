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
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
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
  const [currentInnings, setCurrentInnings] = useState(1);
  const [battingTeam, setBattingTeam] = useState(null);
  const [bowlingTeam, setBowlingTeam] = useState(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeWickets, setHomeWickets] = useState(0);
  const [awayWickets, setAwayWickets] = useState(0);

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

        // Fetch team names
        await fetchTeamNames(matchData.home_team_id, matchData.away_team_id);

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

  const fetchTeamNames = async (homeTeamId, awayTeamId) => {
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      // Fetch home team info
      const homeResponse = await fetch(`${baseUrl}/api/users/${homeTeamId}`);
      if (homeResponse.ok) {
        const homeTeamData = await homeResponse.json();
        setHomeTeam(homeTeamData);
      }

      // Fetch away team info
      const awayResponse = await fetch(`${baseUrl}/api/users/${awayTeamId}`);
      if (awayResponse.ok) {
        const awayTeamData = await awayResponse.json();
        setAwayTeam(awayTeamData);
      }
    } catch (error) {
      console.error('Error fetching team names:', error);
      // Set default names if fetch fails
      setHomeTeam({ team_name: 'Home Team' });
      setAwayTeam({ team_name: 'Away Team' });
    }
  };

  const startSimulation = async () => {
    if (!match) return;
    
    setIsSimulating(true);
    
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
      
      const response = await fetch(`${baseUrl}/api/matches/${params.id}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Empty body for now, can add parameters later if needed
      });
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
    let firstInningsComplete = false;

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

      // Determine which innings we're in and update team scores
      if (!firstInningsComplete) {
        // First innings - home team batting
        setCurrentInnings(1);
        setHomeScore(comment.totalRuns);
        setHomeWickets(comment.wickets);
      } else {
        // Second innings - away team batting
        setCurrentInnings(2);
        setAwayScore(comment.totalRuns);
        setAwayWickets(comment.wickets);
      }

      // Check if first innings is complete (when we reach the target setting point)
      if (comment.requiredRunRate && !firstInningsComplete && matchResult) {
        firstInningsComplete = true;
        setHomeScore(matchResult.homeScore || comment.totalRuns); // Set final first innings score
        setHomeWickets(matchResult.homeWickets || comment.wickets);
      }

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
                <h1 className="text-xl font-bold">
                  {homeTeam?.team_name || 'Home Team'} vs {awayTeam?.team_name || 'Away Team'}
                </h1>
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
                {/* Match Info */}
                <div className="space-y-2">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{match.match_type} Match</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(match.scheduled_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Match Conditions */}
                  <div className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                    <span>🌤️ {match.weather}</span>
                    <span>•</span>
                    <span>🏏 {match.pitch_type} Pitch</span>
                  </div>
                </div>

                {/* Team Scores */}
                <div className="space-y-3">
                  {/* Home Team */}
                  <div className={`p-3 rounded-lg border-2 ${currentInnings === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{homeTeam?.team_name || 'Home Team'}</span>
                        {currentInnings === 1 && <Badge variant="secondary" className="text-xs">Batting</Badge>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{homeScore}/{homeWickets}</div>
                        {matchResult && (
                          <div className="text-xs text-muted-foreground">
                            ({matchResult.homeOvers} overs)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className={`p-3 rounded-lg border-2 ${currentInnings === 2 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{awayTeam?.team_name || 'Away Team'}</span>
                        {currentInnings === 2 && <Badge variant="secondary" className="text-xs">Batting</Badge>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{awayScore}/{awayWickets}</div>
                        {matchResult && (
                          <div className="text-xs text-muted-foreground">
                            ({matchResult.awayOvers} overs)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Innings Details */}
                {isSimulating && (
                  <div className="space-y-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                    <div className="text-center">
                      <h4 className="font-semibold text-sm mb-2">
                        {currentInnings === 1 ? 'First Innings' : 'Second Innings'}
                      </h4>
                      <div className="text-2xl font-bold text-green-600">
                        {currentRuns}/{currentWickets}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Over {currentOver}.{currentBall} • {Math.floor((currentOver * 6 + currentBall) / 6 * 10) / 10} overs
                      </div>
                    </div>

                    {/* Run Rates */}
                    {(currentRunRate > 0 || requiredRunRate) && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center p-2 bg-blue-100 rounded">
                          <div className="font-semibold text-blue-700">{currentRunRate.toFixed(2)}</div>
                          <div className="text-xs text-blue-600">Current RR</div>
                        </div>
                        {requiredRunRate && (
                          <div className="text-center p-2 bg-orange-100 rounded">
                            <div className={`font-semibold ${requiredRunRate > currentRunRate + 2 ? 'text-red-700' : 'text-orange-700'}`}>
                              {requiredRunRate.toFixed(2)}
                            </div>
                            <div className="text-xs text-orange-600">Required RR</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Target Information */}
                    {target && ballsLeft && (
                      <div className="text-center p-2 bg-gray-100 rounded text-sm">
                        <div className="font-medium text-gray-800">
                          Need {Math.max(0, target - currentRuns)} runs from {ballsLeft} balls
                        </div>
                        <div className="text-xs text-gray-600">
                          Target: {target}
                        </div>
                      </div>
                    )}

                    {/* Match Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Match Progress</span>
                        <span className="text-gray-600">{commentary.length} balls</span>
                      </div>
                      <Progress
                        value={(commentary.length / (matchResult?.commentary?.length || 1)) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                )}

                {/* Final Result */}
                {simulationComplete && matchResult && (
                  <div className="space-y-3 text-center pt-4 border-t">
                    <h3 className="font-semibold text-lg flex items-center justify-center space-x-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span>Match Result</span>
                    </h3>
                    <div className="space-y-2">
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-sm font-medium">
                          Home: {matchResult.homeScore} ({matchResult.homeOvers} overs)
                        </div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-sm font-medium">
                          Away: {matchResult.awayScore} ({matchResult.awayOvers} overs)
                        </div>
                      </div>
                      {matchResult.winMargin && matchResult.winType && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-sm font-bold text-yellow-800">
                            🏆 Won by {matchResult.winMargin} {matchResult.winType}
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge variant="default" className="mt-2 bg-green-600">
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
                      disabled={!simulationComplete || !matchResult}
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
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                  PP
                                </Badge>
                              )}
                              {comment.isDeathOvers && (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
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
                  // Enhanced Scorecard View
                  <ScrollArea className="h-[500px] p-4">
                    {matchResult && matchResult.firstInnings && matchResult.secondInnings ? (
                      <div className="space-y-8">
                        {/* Match Summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
                          <h3 className="font-bold text-lg mb-3 text-center">Match Summary</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-blue-700">{homeTeam?.team_name || 'Home Team'}</div>
                              <div className="text-lg font-bold">{matchResult.homeScore}</div>
                              <div className="text-xs text-muted-foreground">({matchResult.homeOvers} overs)</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-700">{awayTeam?.team_name || 'Away Team'}</div>
                              <div className="text-lg font-bold">{matchResult.awayScore}</div>
                              <div className="text-xs text-muted-foreground">({matchResult.awayOvers} overs)</div>
                            </div>
                          </div>
                          {matchResult.winMargin && matchResult.winType && (
                            <div className="text-center mt-3 p-2 bg-yellow-100 rounded">
                              <div className="font-bold text-yellow-800">
                                🏆 {matchResult.winner === match.home_team_id ? (homeTeam?.team_name || 'Home Team') : (awayTeam?.team_name || 'Away Team')} won by {matchResult.winMargin} {matchResult.winType}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* First Innings */}
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center">
                              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                              First Innings - {homeTeam?.team_name || 'Home Team'}
                            </h3>
                            <div className="text-right">
                              <div className="text-xl font-bold text-blue-700">{matchResult.homeScore}/{matchResult.homeWickets}</div>
                              <div className="text-sm text-muted-foreground">({matchResult.homeOvers} overs, RR: {matchResult.firstInnings.runRate})</div>
                            </div>
                          </div>

                          {/* Batting Scorecard */}
                          <div className="mb-6">
                            <h4 className="font-semibold mb-3 flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              Batting
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border rounded">
                                <thead>
                                  <tr className="border-b bg-blue-50">
                                    <th className="text-left p-3 font-semibold">Batsman</th>
                                    <th className="text-center p-3 font-semibold">R</th>
                                    <th className="text-center p-3 font-semibold">B</th>
                                    <th className="text-center p-3 font-semibold">4s</th>
                                    <th className="text-center p-3 font-semibold">6s</th>
                                    <th className="text-center p-3 font-semibold">SR</th>
                                    <th className="text-center p-3 font-semibold">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.firstInnings.batsmanScores?.map((batsman, index) => (
                                    <tr key={index} className={`border-b ${batsman.out ? 'bg-red-50' : 'bg-green-50'}`}>
                                      <td className="p-3 font-medium">{batsman.name}</td>
                                      <td className="text-center p-3 font-bold text-lg">{batsman.runs}</td>
                                      <td className="text-center p-3">{batsman.balls}</td>
                                      <td className="text-center p-3">{batsman.fours}</td>
                                      <td className="text-center p-3">{batsman.sixes}</td>
                                      <td className="text-center p-3">{batsman.strikeRate}</td>
                                      <td className="text-center p-3">
                                        {batsman.out ? (
                                          <Badge variant="destructive" className="text-xs">
                                            {batsman.outType} b {batsman.bowler}
                                          </Badge>
                                        ) : (
                                          <Badge variant="default" className="text-xs bg-green-600">
                                            Not Out
                                          </Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t bg-blue-100 font-semibold">
                                    <td className="p-3">Total</td>
                                    <td className="text-center p-3 font-bold">{matchResult.homeScore}</td>
                                    <td className="text-center p-3" colSpan="6">
                                      {matchResult.homeWickets} wickets • {matchResult.homeOvers} overs • RR: {matchResult.firstInnings.runRate}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Figures */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              Bowling
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border rounded">
                                <thead>
                                  <tr className="border-b bg-red-50">
                                    <th className="text-left p-3 font-semibold">Bowler</th>
                                    <th className="text-center p-3 font-semibold">O</th>
                                    <th className="text-center p-3 font-semibold">M</th>
                                    <th className="text-center p-3 font-semibold">R</th>
                                    <th className="text-center p-3 font-semibold">W</th>
                                    <th className="text-center p-3 font-semibold">Econ</th>
                                    <th className="text-center p-3 font-semibold">Extras</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.firstInnings.bowlingFigures?.map((bowler, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="p-3 font-medium">{bowler.name}</td>
                                      <td className="text-center p-3">{bowler.overs}</td>
                                      <td className="text-center p-3">{bowler.maidens}</td>
                                      <td className="text-center p-3">{bowler.runs}</td>
                                      <td className="text-center p-3 font-bold text-red-600">{bowler.wickets}</td>
                                      <td className="text-center p-3">{bowler.economy}</td>
                                      <td className="text-center p-3">-</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Second Innings */}
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center">
                              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                              Second Innings - {awayTeam?.team_name || 'Away Team'}
                            </h3>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-700">{matchResult.awayScore}/{matchResult.awayWickets}</div>
                              <div className="text-sm text-muted-foreground">({matchResult.awayOvers} overs, RR: {matchResult.secondInnings.runRate})</div>
                            </div>
                          </div>

                          {/* Target Info */}
                          {matchResult.target && (
                            <div className="mb-4 p-3 bg-orange-50 rounded border border-orange-200">
                              <div className="text-center">
                                <div className="font-semibold text-orange-800">Target: {matchResult.target} runs</div>
                                <div className="text-sm text-orange-600">
                                  {matchResult.awayScore >= matchResult.target ? 'Target achieved!' : `${matchResult.target - matchResult.awayScore} runs needed`}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Batting Scorecard */}
                          <div className="mb-6">
                            <h4 className="font-semibold mb-3 flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              Batting
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border rounded">
                                <thead>
                                  <tr className="border-b bg-green-50">
                                    <th className="text-left p-3 font-semibold">Batsman</th>
                                    <th className="text-center p-3 font-semibold">R</th>
                                    <th className="text-center p-3 font-semibold">B</th>
                                    <th className="text-center p-3 font-semibold">4s</th>
                                    <th className="text-center p-3 font-semibold">6s</th>
                                    <th className="text-center p-3 font-semibold">SR</th>
                                    <th className="text-center p-3 font-semibold">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.secondInnings.batsmanScores?.map((batsman, index) => (
                                    <tr key={index} className={`border-b ${batsman.out ? 'bg-red-50' : 'bg-green-50'}`}>
                                      <td className="p-3 font-medium">{batsman.name}</td>
                                      <td className="text-center p-3 font-bold text-lg">{batsman.runs}</td>
                                      <td className="text-center p-3">{batsman.balls}</td>
                                      <td className="text-center p-3">{batsman.fours}</td>
                                      <td className="text-center p-3">{batsman.sixes}</td>
                                      <td className="text-center p-3">{batsman.strikeRate}</td>
                                      <td className="text-center p-3">
                                        {batsman.out ? (
                                          <Badge variant="destructive" className="text-xs">
                                            {batsman.outType} b {batsman.bowler}
                                          </Badge>
                                        ) : (
                                          <Badge variant="default" className="text-xs bg-green-600">
                                            Not Out
                                          </Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t bg-green-100 font-semibold">
                                    <td className="p-3">Total</td>
                                    <td className="text-center p-3 font-bold">{matchResult.awayScore}</td>
                                    <td className="text-center p-3" colSpan="6">
                                      {matchResult.awayWickets} wickets • {matchResult.awayOvers} overs • RR: {matchResult.secondInnings.runRate}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Figures */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              Bowling
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border rounded">
                                <thead>
                                  <tr className="border-b bg-red-50">
                                    <th className="text-left p-3 font-semibold">Bowler</th>
                                    <th className="text-center p-3 font-semibold">O</th>
                                    <th className="text-center p-3 font-semibold">M</th>
                                    <th className="text-center p-3 font-semibold">R</th>
                                    <th className="text-center p-3 font-semibold">W</th>
                                    <th className="text-center p-3 font-semibold">Econ</th>
                                    <th className="text-center p-3 font-semibold">Extras</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.secondInnings.bowlingFigures?.map((bowler, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="p-3 font-medium">{bowler.name}</td>
                                      <td className="text-center p-3">{bowler.overs}</td>
                                      <td className="text-center p-3">{bowler.maidens}</td>
                                      <td className="text-center p-3">{bowler.runs}</td>
                                      <td className="text-center p-3 font-bold text-red-600">{bowler.wickets}</td>
                                      <td className="text-center p-3">{bowler.economy}</td>
                                      <td className="text-center p-3">-</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Match Statistics */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <h3 className="font-bold text-lg mb-4 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2" />
                            Match Statistics
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center p-3 bg-white rounded">
                              <div className="font-bold text-lg text-blue-600">
                                {matchResult.firstInnings.batsmanScores?.reduce((sum, b) => sum + b.fours, 0) || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Fours</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded">
                              <div className="font-bold text-lg text-purple-600">
                                {matchResult.firstInnings.batsmanScores?.reduce((sum, b) => sum + b.sixes, 0) || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Sixes</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded">
                              <div className="font-bold text-lg text-red-600">
                                {matchResult.firstInnings.bowlingFigures?.reduce((sum, b) => sum + b.wickets, 0) || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Wickets</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded">
                              <div className="font-bold text-lg text-green-600">
                                {matchResult.firstInnings.bowlingFigures?.reduce((sum, b) => sum + b.maidens, 0) || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Maiden Overs</div>
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
