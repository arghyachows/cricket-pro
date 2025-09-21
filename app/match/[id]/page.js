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
import { calculateAge, formatAge, generatePlayerBirthDate } from '@/lib/utils';
import {
  calculateCurrentRunRate,
  calculateRequiredRunRate,
  calculateT20Projection,
  getT20InningsPhase,
  oversToDecimal,
  decimalToOvers,
  CRICKET_FORMATS,
  getMaxOvers,
  isOversLimitExceeded,
  getRemainingOvers,
  calculateT20Excitement,
  validateT20MatchState,
  generateT20ScoringPattern
} from '@/lib/cricketScoring';
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
  Coins,
  Wifi,
  WifiOff
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const intervalRef = useRef(null);
  const scrollRef = useRef(null);
  const wsRef = useRef(null);

  // Current match state
  const [currentRuns, setCurrentRuns] = useState(0);
  const [currentWickets, setCurrentWickets] = useState(0);
  const [currentOver, setCurrentOver] = useState(0);
  const [currentBall, setCurrentBall] = useState(0);
  const [currentRunRate, setCurrentRunRate] = useState(0);
  const [requiredRunRate, setRequiredRunRate] = useState(null);
  const [target, setTarget] = useState(null);
  const [ballsLeft, setBallsLeft] = useState(null);
  const [currentBattingTeam, setCurrentBattingTeam] = useState(null);
  const [currentPartnership, setCurrentPartnership] = useState({ runs: 0, balls: 0 });
  const [currentBowler, setCurrentBowler] = useState(null);
  const [last12Balls, setLast12Balls] = useState([]);
  const [batsmanOnStrike, setBatsmanOnStrike] = useState(null);
  const [batsmanContributions, setBatsmanContributions] = useState({ batsman1: { name: null, runs: 0, balls: 0 }, batsman2: { name: null, runs: 0, balls: 0 } });
  const [totalBallsBowled, setTotalBallsBowled] = useState(0);

  // Live scorecard data
  const [liveScorecard, setLiveScorecard] = useState({
    batting: [],
    bowling: [],
    fallOfWickets: []
  });

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

  // WebSocket connection setup
  useEffect(() => {
    if (params.id && user) {
      // Check for background match first
      const hasBackgroundState = checkForBackgroundMatch();

      // Only fetch match data if no background state was restored
      if (!hasBackgroundState) {
        fetchMatch();
      }

      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [params.id, user]);

  const checkForBackgroundMatch = () => {
    try {
      const savedMatch = localStorage.getItem('backgroundMatch');
      if (savedMatch) {
        const matchState = JSON.parse(savedMatch);
        if (matchState.matchId === params.id) {
          // Only restore if match is not completed
          if (!matchState.simulationComplete) {
            console.log('Restoring background match state:', matchState);

            // Restore all saved state
            setCurrentCommentaryIndex(matchState.currentCommentaryIndex || 0);
            setIsSimulating(matchState.isSimulating || false);
            setIsPaused(matchState.isPaused || false);
            setSimulationComplete(matchState.simulationComplete || false);
            setMatchResult(matchState.matchResult || null);
            setCurrentRuns(matchState.currentRuns || 0);
            setCurrentWickets(matchState.currentWickets || 0);
            setCurrentOver(matchState.currentOver || 0);
            setCurrentBall(matchState.currentBall || 0);
            setTotalBallsBowled(matchState.totalBallsBowled || 0);
            setCurrentRunRate(matchState.currentRunRate || 0);
            setRequiredRunRate(matchState.requiredRunRate || null);
            setTarget(matchState.target || null);
            setBallsLeft(matchState.ballsLeft || null);

            // Restore commentary if available
            if (matchState.commentary && Array.isArray(matchState.commentary)) {
              setCommentary(matchState.commentary);
            }

            // Resume simulation if it was running
            if (matchState.isSimulating && !matchState.isPaused && !matchState.simulationComplete && matchState.matchResult) {
              setTimeout(() => {
                simulateLiveCommentary(matchState.matchResult.commentary.slice(matchState.currentCommentaryIndex || 0));
              }, 1000);
            }

            return true; // Indicate that we restored state
          }
        }
      }
      return false; // No state was restored
    } catch (error) {
      console.error('Error restoring background match:', error);
      localStorage.removeItem('backgroundMatch');
      return false;
    }
  };

  useEffect(() => {
    if (scrollRef.current && commentary.length > 0) {
      // Keep scroll at top to show most recent commentary first
      scrollRef.current.scrollTop = 0;
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

          // Construct matchResult from stored match data for completed matches
          if (matchData.status === 'completed') {
            const constructedResult = {
              homeScore: matchData.match_data ?
                `${matchData.match_data.firstInnings?.runs || 0}/${matchData.match_data.firstInnings?.wickets || 0}` :
                `${matchData.home_score || 0}/${matchData.home_wickets || 0}`,
              awayScore: matchData.match_data ?
                `${matchData.match_data.secondInnings?.runs || 0}/${matchData.match_data.secondInnings?.wickets || 0}` :
                `${matchData.away_score || 0}/${matchData.away_wickets || 0}`,
              homeOvers: matchData.match_data?.firstInnings?.overs || matchData.home_overs || 0,
              awayOvers: matchData.match_data?.secondInnings?.overs || matchData.away_overs || 0,
              homeWickets: matchData.match_data?.firstInnings?.wickets || matchData.home_wickets || 0,
              awayWickets: matchData.match_data?.secondInnings?.wickets || matchData.away_wickets || 0,
              homeTeamName: matchData.home_team_name || 'Home Team',
              awayTeamName: matchData.away_team_name || 'Away Team',
              winner: matchData.result,
              winMargin: matchData.win_margin,
              winType: matchData.win_type,
              target: matchData.target,
              commentary: matchData.commentary || [],
              firstInnings: matchData.match_data?.firstInnings || null,
              secondInnings: matchData.match_data?.secondInnings || null,
              matchConditions: {
                weather: matchData.weather,
                pitchType: matchData.pitch_type
              }
            };
            setMatchResult(constructedResult);
          }
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

    // Reset all match state for new simulation
    setTotalBallsBowled(0);
    setCurrentRuns(0);
    setCurrentWickets(0);
    setCurrentOver(0);
    setCurrentBall(0);
    setCurrentRunRate(0);
    setBatsmanOnStrike(null);
    setBatsmanContributions({ batsman1: { name: null, runs: 0, balls: 0 }, batsman2: { name: null, runs: 0, balls: 0 } });
    setCurrentPartnership({ runs: 0, balls: 0 });
    setCurrentBowler(null);
    setLast12Balls([]);

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
    let currentInningsBalls = 0; // Track balls in current innings

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

      // Check if we've reached the end of first innings (120 balls = 20 overs)
      const isFirstInnings = currentInningsBalls < 120;
      if (isFirstInnings && currentInningsBalls >= 120) {
        // Reset for second innings
        currentInningsBalls = 0;
        setCurrentRuns(0);
        setCurrentWickets(0);
        setCurrentOver(0);
        setCurrentBall(0);
        setBatsmanOnStrike(null);
        setBatsmanContributions({ batsman1: { name: null, runs: 0, balls: 0 }, batsman2: { name: null, runs: 0, balls: 0 } });
        setCurrentPartnership({ runs: 0, balls: 0 });
        setCurrentBowler(null);
        setLast12Balls([]);
      }

      // Validate T20 match state with proper bowler tracking
      const matchState = {
        overs: comment.over + comment.ball / 10,
        wickets: comment.wickets,
        bowlerOvers: 0, // Will be tracked properly in future updates
        powerplayFielders: currentInningsBalls < 36 ? 2 : 5, // Powerplay: max 2 fielders outside 30-yard, after: max 5
        timeElapsed: 0 // Simplified - would need actual time tracking
      };

      const validation = validateT20MatchState(matchState);
      if (!validation.isValid) {
        console.error('T20 validation failed:', validation.errors);
        // Continue but log the issue
      }

      // Update current match state
      setCurrentRuns(comment.totalRuns);
      setCurrentWickets(comment.wickets);

      // Cricket Ball Counting Rules: Only valid deliveries count as balls in the over
      // Valid balls: Legal deliveries where batsman has opportunity to play (including byes/leg-byes)
      // Invalid balls: Wides, no-balls, dead balls (do not count toward over)
      const isLegalDelivery = !comment.extras ||
                             (comment.extras === 'b' || comment.extras === 'lb' ||
                              comment.extras === 'byes' || comment.extras === 'legbyes');

      if (isLegalDelivery) {
        currentInningsBalls++;
        setTotalBallsBowled(prev => {
          const newTotal = prev + 1;
          const completedOvers = Math.floor(currentInningsBalls / 6);
          const ballsInCurrentOver = currentInningsBalls % 6;

          setCurrentOver(completedOvers);
          setCurrentBall(ballsInCurrentOver);

          return newTotal;
        });
      }

      setCurrentRunRate(comment.currentRunRate || 0);
      setRequiredRunRate(comment.requiredRunRate);
      setBallsLeft(comment.ballsLeft);

      // Determine current batting team based on innings
      if (matchResult) {
        setCurrentBattingTeam(isFirstInnings ? matchResult.homeTeamName : matchResult.awayTeamName);
      } else {
        setCurrentBattingTeam(isFirstInnings ? (user?.team_name || 'Home Team') : 'Opponent');
      }

      // Update current bowler
      setCurrentBowler(comment.bowler);

      // Update batsman on strike
      setBatsmanOnStrike(comment.batsman);

      // Update last 12 balls (keep most recent 12)
      setLast12Balls(prev => {
        const newBall = {
          runs: comment.runs,
          isWicket: comment.isWicket,
          extras: comment.extras,
          over: comment.over,
          ball: comment.ball
        };
        const updated = [newBall, ...prev];
        return updated.slice(0, 12);
      });

      // Update partnership and batsman contributions (reset on wicket)
      setCurrentPartnership(prev => {
        if (comment.isWicket) {
          return { runs: 0, balls: 0 };
        } else {
          return {
            runs: prev.runs + (comment.runs || 0),
            balls: prev.balls + (isLegalDelivery ? 1 : 0)
          };
        }
      });

      // Update batsman contributions in partnership
      setBatsmanContributions(prev => {
        if (comment.isWicket) {
          // Reset contributions on wicket
          return { batsman1: { name: null, runs: 0, balls: 0 }, batsman2: { name: null, runs: 0, balls: 0 } };
        } else {
          // Update the batsman who scored the runs
          const updated = { ...prev };
          if (updated.batsman1.name === comment.batsman || updated.batsman1.name === null) {
            updated.batsman1 = {
              name: comment.batsman,
              runs: (updated.batsman1.runs || 0) + (comment.runs || 0),
              balls: (updated.batsman1.balls || 0) + (isLegalDelivery ? 1 : 0)
            };
          } else if (updated.batsman2.name === comment.batsman || updated.batsman2.name === null) {
            updated.batsman2 = {
              name: comment.batsman,
              runs: (updated.batsman2.runs || 0) + (comment.runs || 0),
              balls: (updated.batsman2.balls || 0) + (isLegalDelivery ? 1 : 0)
            };
          } else {
            // New batsman coming in
            if (!updated.batsman1.name) {
              updated.batsman1 = { name: comment.batsman, runs: comment.runs || 0, balls: isLegalDelivery ? 1 : 0 };
            } else if (!updated.batsman2.name) {
              updated.batsman2 = { name: comment.batsman, runs: comment.runs || 0, balls: isLegalDelivery ? 1 : 0 };
            }
          }
          return updated;
        }
      });

      // Update live scorecard
      setLiveScorecard(prev => {
        const updated = { ...prev };

        // Update batting scorecard
        let batsmanFound = false;
        updated.batting = updated.batting.map(batsman => {
          if (batsman.name === comment.batsman) {
            batsmanFound = true;
            // Only count legal deliveries for balls faced
            const ballsIncrement = isLegalDelivery ? 1 : 0;

            // Batsman scoring: Only runs from bat count toward individual score
            // Extras (byes, leg-byes) go to team total but NOT individual batsman score
            const isExtrasOnly = comment.extras === 'b' || comment.extras === 'lb' ||
                                comment.extras === 'byes' || comment.extras === 'legbyes';
            const batsmanRunsIncrement = isExtrasOnly ? 0 : (comment.runs || 0);

            const newRuns = batsman.runs + batsmanRunsIncrement;
            const newBalls = batsman.balls + ballsIncrement;
            return {
              ...batsman,
              runs: newRuns,
              balls: newBalls,
              fours: batsman.fours + (comment.runs === 4 && !isExtrasOnly ? 1 : 0),
              sixes: batsman.sixes + (comment.runs === 6 && !isExtrasOnly ? 1 : 0),
              strikeRate: newBalls > 0 ? (newRuns / newBalls * 100).toFixed(1) : 0,
              out: comment.isWicket,
              outType: comment.isWicket ? (comment.wicketType || 'Unknown') : batsman.outType
            };
          }
          return batsman;
        });

        if (!batsmanFound && comment.batsman) {
          updated.batting.push({
            name: comment.batsman,
            runs: comment.runs || 0,
            balls: isLegalDelivery ? 1 : 0,
            fours: comment.runs === 4 ? 1 : 0,
            sixes: comment.runs === 6 ? 1 : 0,
            strikeRate: isLegalDelivery ? (comment.runs || 0) * 100 : 0,
            out: comment.isWicket,
            outType: comment.isWicket ? (comment.wicketType || 'Unknown') : null
          });
        }

        // Update bowling scorecard
        let bowlerFound = false;
        updated.bowling = updated.bowling.map(bowler => {
          if (bowler.name === comment.bowler) {
            bowlerFound = true;
            // Bowler attribution: Byes and leg-byes do NOT count against bowler
            // Only runs from bat, no-balls, and wides count against bowler
            const isExtrasOnly = comment.extras === 'b' || comment.extras === 'lb' ||
                                comment.extras === 'byes' || comment.extras === 'legbyes';
            const bowlerRunsIncrement = isExtrasOnly ? 0 : (comment.runs || 0);

            const newRuns = bowler.runs + bowlerRunsIncrement;
            const newBalls = bowler.balls + (isLegalDelivery ? 1 : 0);
            const newOvers = Math.floor(newBalls / 6) + (newBalls % 6) / 10;
            return {
              ...bowler,
              runs: newRuns,
              balls: newBalls,
              overs: newOvers.toFixed(1),
              wickets: bowler.wickets + (comment.isWicket ? 1 : 0),
              economy: newOvers > 0 ? (newRuns / newOvers).toFixed(1) : 0
            };
          }
          return bowler;
        });

        if (!bowlerFound && comment.bowler) {
          updated.bowling.push({
            name: comment.bowler,
            overs: isLegalDelivery ? '0.1' : '0.0',
            maidens: 0,
            runs: comment.runs || 0,
            wickets: comment.isWicket ? 1 : 0,
            balls: isLegalDelivery ? 1 : 0,
            economy: isLegalDelivery ? (comment.runs || 0) * 6 : 0
          });
        }

        // Update fall of wickets
        if (comment.isWicket) {
          updated.fallOfWickets.push({
            wicket: currentWickets + 1,
            batsman: comment.batsman,
            score: `${currentRuns}/${currentWickets + 1}`,
            overs: `${currentOver}.${currentBall}`
          });
        }

        return updated;
      });

      // Add comment to display (most recent at top)
      setCommentary(prev => [comment, ...prev]);
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
      router.push('/dashboard');
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
        totalBallsBowled,
        currentRunRate,
        requiredRunRate,
        target,
        ballsLeft,
        commentary, // Save the current commentary array
        timestamp: Date.now()
      };
      localStorage.setItem('backgroundMatch', JSON.stringify(matchState));
    }

    setShowExitDialog(false);
    router.push('/dashboard');
  };

  const getEventIcon = (comment) => {
    if (comment.isWicket) return <Target className="w-6 h-6 text-destructive" />;
    if (comment.runs === 6) return <Crown className="w-6 h-6 text-purple-500 dark:text-purple-400" />;
    if (comment.runs === 4) return <Zap className="w-6 h-6 text-blue-500 dark:text-blue-400" />;
    return <Trophy className="w-6 h-6 text-green-500 dark:text-green-400" />;
  };

  // WebSocket connection for live updates
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const wsUrl = `ws://localhost:8080?matchId=${params.id}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for match:', params.id);
        setIsConnected(true);
        setConnectionStatus('connected');

        // Send subscription message
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          matchId: params.id
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (params.id && user) {
            connectWebSocket();
          }
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'initial_state':
        console.log('Received initial match state:', data.data);
        if (data.data && !match) {
          setMatch(data.data);
          if (data.data.status === 'completed') {
            setSimulationComplete(true);
            setCommentary(data.data.commentary || []);
            setCurrentCommentaryIndex(data.data.commentary?.length || 0);
          }
        }
        break;

      case 'match_update':
        console.log('Received match update:', data);
        // Handle real-time match updates here
        // This would be triggered by MongoDB change streams
        if (data.operationType === 'update' && data.data) {
          // Update match state in real-time
          setMatch(prevMatch => ({
            ...prevMatch,
            ...data.data
          }));

          // Update current match statistics
          if (data.data.current_runs !== undefined) {
            setCurrentRuns(data.data.current_runs);
          }
          if (data.data.current_wickets !== undefined) {
            setCurrentWickets(data.data.current_wickets);
          }
          if (data.data.current_over !== undefined) {
            setCurrentOver(data.data.current_over);
          }
          if (data.data.current_ball !== undefined) {
            setCurrentBall(data.data.current_ball);
          }

          // Update commentary if new commentary is available
          if (data.data.live_commentary && Array.isArray(data.data.live_commentary)) {
            setCommentary(data.data.live_commentary);
          }
        }
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
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
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate">Cricket Manager Pro</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Match Simulation</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <Badge
                variant="outline"
                className={`flex items-center space-x-1 text-xs md:text-sm ${
                  isConnected ? 'border-green-500 text-green-700 dark:text-green-400' :
                  connectionStatus === 'error' ? 'border-red-500 text-red-700 dark:text-red-400' :
                  'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                }`}
              >
                {isConnected ? <Wifi className="w-3 h-3 md:w-4 md:h-4" /> : <WifiOff className="w-3 h-3 md:w-4 md:h-4" />}
                <span className="hidden sm:inline">
                  {isConnected ? 'Live' : connectionStatus === 'error' ? 'Offline' : 'Connecting'}
                </span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1 text-xs md:text-sm">
                <Coins className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{user?.coins?.toLocaleString() || '0'} coins</span>
                <span className="sm:hidden">{(user?.coins || 0).toLocaleString()}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1 text-xs md:text-sm">
                <span className="truncate max-w-[60px] md:max-w-none">{user?.country || 'Country'}</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
                className="self-start"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold truncate">{match.match_type} Match Simulation</h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {match.weather} • {match.pitch_type} Pitch • {match.status}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-x-2">
              <div className="flex items-center gap-2">
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
                    className="whitespace-nowrap"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    <span className="hidden sm:inline ml-2">{isPaused ? 'Resume' : 'Pause'}</span>
                  </Button>
                )}
              </div>

              {!isSimulating && !simulationComplete && (
                <Button onClick={startSimulation} className="self-start sm:self-auto">
                  <Play className="w-4 h-4 mr-2" />
                  Start Simulation
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Scoreboard */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-4 sm:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{simulationComplete ? 'Final Score' : 'Live Score'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Match Conditions */}
                <div className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                  <span>{match.weather}</span>
                  <span>•</span>
                  <span>{match.pitch_type} Pitch</span>
                </div>

                {/* Show different content for completed vs live matches */}
                {simulationComplete ? (
                  /* Final Result for Completed Matches */
                  <div className="space-y-4">
                    {/* First Innings Score */}
                    <div className="text-center p-3 bg-muted/30 rounded-lg border">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {matchResult?.homeScore || match.home_score || match.match_data?.firstInnings?.runs || 0}/{matchResult?.homeWickets || match.home_wickets || match.match_data?.firstInnings?.wickets || 10}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {matchResult?.homeOvers || match.home_overs || match.match_data?.firstInnings?.overs || 0} overs
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {matchResult?.homeTeamName || user?.team_name || 'Home Team'}
                      </div>
                    </div>

                    {/* Second Innings Score */}
                    <div className="text-center p-3 bg-muted/30 rounded-lg border">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {matchResult?.awayScore || match.away_score || match.match_data?.secondInnings?.runs || 0}/{matchResult?.awayWickets || match.away_wickets || match.match_data?.secondInnings?.wickets || 10}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {matchResult?.awayOvers || match.away_overs || match.match_data?.secondInnings?.overs || 0} overs
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {matchResult?.awayTeamName || 'Opponent'}
                      </div>
                    </div>

                    {/* Match Result Summary */}
                    <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-sm font-medium text-primary mb-1">
                        {match.result === user?.id ? '🏆 Won' : match.result && match.result !== 'tie' ? '❌ Lost' : '🤝 Tie'}
                      </div>
                      {match.win_margin && match.win_type && (
                        <div className="text-xs text-muted-foreground">
                          by {match.win_margin} {match.win_type}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Completed {match.completed_at ? new Date(match.completed_at).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>

                    {/* Match Statistics */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Overs:</span>
                        <span className="font-medium">
                          {(match.home_overs || 0) + (match.away_overs || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Wickets:</span>
                        <span className="font-medium">
                          {(match.home_wickets || 0) + (match.away_wickets || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Run Rate:</span>
                        <span className="font-medium">
                          {(((match.home_score || 0) + (match.away_score || 0)) / ((match.home_overs || 0) + (match.away_overs || 0))).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Live Score for Ongoing Matches */
                  <>
                    {/* Current Score */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {currentRuns}/{currentWickets}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {totalBallsBowled > 0 && `${currentOver}.${currentBall} overs`}
                      </div>
                      {currentBattingTeam && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {currentBattingTeam} batting
                        </div>
                      )}
                      {batsmanOnStrike && (
                        <div className="text-xs font-medium mt-1">
                          {batsmanOnStrike}*
                        </div>
                      )}
                      {/* T20 Phase Indicator */}
                      {totalBallsBowled > 0 && (
                        <div className="text-xs mt-2">
                          {totalBallsBowled <= 36 ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Powerplay (1-6 overs)
                            </Badge>
                          ) : totalBallsBowled >= 96 ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Death Overs (16-20)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Middle Overs (7-15)
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Current Match Info */}
                    {isSimulating && (
                      <div className="space-y-2">
                        {/* Current Partnership */}
                        <div className="text-center p-2 bg-muted/30 rounded border">
                          <div className="font-semibold text-sm mb-1">
                            Partnership: {currentPartnership.runs} runs ({currentPartnership.balls} balls)
                          </div>
                          {(batsmanContributions.batsman1.name || batsmanContributions.batsman2.name) && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              {batsmanContributions.batsman1.name && (
                                <div>
                                  {batsmanContributions.batsman1.name}: {batsmanContributions.batsman1.runs} ({batsmanContributions.batsman1.balls})
                                </div>
                              )}
                              {batsmanContributions.batsman2.name && (
                                <div>
                                  {batsmanContributions.batsman2.name}: {batsmanContributions.batsman2.runs} ({batsmanContributions.batsman2.balls})
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Current Bowler */}
                        {currentBowler && (
                          <div className="text-center p-2 bg-muted/30 rounded border">
                            <div className="font-semibold text-sm">
                              Bowler: {currentBowler}
                            </div>
                          </div>
                        )}

                        {/* Last 12 Balls */}
                        {last12Balls.length > 0 && (
                          <div className="p-2 bg-muted/30 rounded border">
                            <div className="text-xs font-medium mb-2 text-center">Last 12 Balls</div>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {last12Balls.slice().reverse().map((ball, index) => (
                                <Badge
                                  key={index}
                                  variant={ball.isWicket ? "destructive" : ball.runs === 4 ? "default" : ball.runs === 6 ? "secondary" : "outline"}
                                  className="text-xs px-2 py-1"
                                >
                                  {ball.isWicket ? 'W' : ball.extras ? ball.extras : ball.runs}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Run Rates */}
                    {isSimulating && (
                      <div className="space-y-3">
                        {/* Current Run Rate */}
                        <div className="text-center p-2 bg-muted/30 rounded border">
                          <div className="font-semibold text-foreground text-lg">
                            {calculateCurrentRunRate(currentRuns, currentOver + currentBall / 10).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">Current Run Rate</div>
                        </div>

                        {/* Required Run Rate */}
                        {target && (
                          <div className="text-center p-2 bg-muted/30 rounded border">
                            <div className={`font-semibold text-lg ${
                              calculateRequiredRunRate(target, currentRuns, 20 - oversToDecimal(currentOver + currentBall / 10)) > 12
                                ? 'text-destructive'
                                : calculateRequiredRunRate(target, currentRuns, 20 - oversToDecimal(currentOver + currentBall / 10)) > 9
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {calculateRequiredRunRate(target, currentRuns, 20 - oversToDecimal(currentOver + currentBall / 10)).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Required Run Rate</div>
                          </div>
                        )}

                        {/* T20 Phase Indicator */}
                        {matchResult && (
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                            <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                              {getT20InningsPhase(currentOver + currentBall / 10).toUpperCase()} PHASE
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Overs {decimalToOvers(oversToDecimal(currentOver + currentBall / 10)).toFixed(1)}/{20}
                            </div>
                          </div>
                        )}

                        {/* T20 Projection */}
                        {matchResult && (
                          <div className="text-center p-2 bg-primary/5 rounded border border-primary/20">
                            <div className="font-semibold text-primary text-lg">
                              {calculateT20Projection(
                                currentRuns,
                                currentOver + currentBall / 10,
                                20,
                                currentWickets,
                                getT20InningsPhase(currentOver + currentBall / 10)
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">Projected Final Score</div>
                          </div>
                        )}

                        {/* T20 Excitement Indicator */}
                        {matchResult && target && (
                          <div className="text-center p-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded border border-orange-200 dark:border-orange-700">
                            <div className="font-semibold text-orange-700 dark:text-orange-300 text-sm mb-1">
                              EXCITEMENT: {calculateT20Excitement(
                                currentRuns,
                                currentOver + currentBall / 10,
                                currentWickets,
                                target
                              ).level.toUpperCase()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {calculateT20Excitement(
                                currentRuns,
                                currentOver + currentBall / 10,
                                currentWickets,
                                target
                              ).factors.slice(0, 2).join(' • ')}
                            </div>
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Commentary/Scorecard */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <Card className="h-[500px] sm:h-[600px]">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    {currentView === 'commentary' ? (
                      <>
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base font-medium">Live Commentary</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base font-medium">Scorecard</span>
                      </>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant={currentView === 'commentary' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('commentary')}
                      className="text-xs sm:text-sm"
                    >
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden xs:inline">Commentary</span>
                      <span className="xs:hidden">Live</span>
                    </Button>
                    <Button
                      variant={currentView === 'scorecard' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('scorecard')}
                      disabled={!matchResult}
                      className="text-xs sm:text-sm"
                    >
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Scorecard
                    </Button>
                  </div>
                </div>

                <CardDescription className="text-xs sm:text-sm">
                  {currentView === 'commentary'
                    ? (isSimulating ? 'Live ball-by-ball commentary with real-time updates' :
                       simulationComplete ? 'Match completed - full commentary available' : 'Ready to start simulation')
                    : 'Detailed match statistics and player performance analytics'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {currentView === 'commentary' ? (
                  <ScrollArea className="h-[400px] sm:h-[500px] p-3 sm:p-4" ref={scrollRef}>
                    {commentary.length === 0 && !isSimulating && (
                      <div className="text-center py-8 sm:py-12">
                        <Play className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground">Click "Start Simulation" to begin the match</p>
                      </div>
                    )}

                    <div className="space-y-3 sm:space-y-4">
                      {commentary.map((comment, index) => {
                        const timestamp = new Date(Date.now() - index * 500).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });

                        return (
                          <div
                            key={index}
                            className={`p-3 sm:p-4 rounded-lg border-l-4 transition-all duration-300 hover:shadow-md ${getEventColor(comment)}`}
                          >
                            {/* Header with over, score, and timestamp */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <Badge variant="outline" className="text-xs font-mono bg-background/50">
                                  {comment.over}.{comment.ball}
                                </Badge>
                                <div className="text-sm sm:text-base font-bold text-primary">
                                  {comment.totalRuns}/{comment.wickets}
                                </div>
                                {comment.currentRunRate && (
                                  <Badge variant="secondary" className="text-xs">
                                    RR: {comment.currentRunRate.toFixed(1)}
                                  </Badge>
                                )}
                                {comment.isPowerplay && (
                                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    Powerplay
                                  </Badge>
                                )}
                                {comment.isDeathOvers && (
                                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    Death Overs
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {(comment.isWicket || comment.runs === 4 || comment.runs === 6 || comment.milestone) &&
                                  getEventIcon(comment)
                                }
                                <span className="text-xs text-muted-foreground font-mono">
                                  {timestamp}
                                </span>
                              </div>
                            </div>

                            {/* Main commentary text */}
                            <div className="mb-3">
                              <p className="text-sm sm:text-base leading-relaxed">{comment.commentary}</p>
                            </div>

                            {/* Footer with batsman/bowler and additional info */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-muted-foreground border-t pt-2">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                                <span className="font-medium">
                                  {comment.batsman} vs {comment.bowler}
                                </span>
                                {comment.requiredRunRate && (
                                  <span className={`font-medium ${comment.requiredRunRate > comment.currentRunRate + 2 ? 'text-destructive' : 'text-orange-600 dark:text-orange-400'}`}>
                                    Req RR: {comment.requiredRunRate.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {comment.runs > 0 && !comment.isWicket && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{comment.runs} run{comment.runs > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {comment.extras && (
                                  <Badge variant="outline" className="text-xs">
                                    {comment.extras}
                                  </Badge>
                                )}
                                {comment.ballsLeft && (
                                  <Badge variant="outline" className="text-xs">
                                    {comment.ballsLeft} balls left
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Additional context for special events */}
                            {(comment.isWicket || comment.runs === 4 || comment.runs === 6) && (
                              <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {comment.isWicket ? 'Wicket Alert' :
                                     comment.runs === 6 ? 'Maximum!' :
                                     comment.runs === 4 ? 'Boundary!' : 'Key Moment'}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Over {comment.over}.{comment.ball}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  // Scorecard View
                  <ScrollArea className="h-[500px] p-4">
                    {isSimulating && liveScorecard.batting.length > 0 ? (
                      /* Live Scorecard During Simulation */
                      <div className="space-y-6">
                        {/* Current Innings */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <Trophy className="w-5 h-5 mr-2" />
                            {currentBattingTeam} - {currentRuns}/{currentWickets}
                            <Badge variant="secondary" className="ml-2">
                              Live
                            </Badge>
                          </h3>

                          {/* Live Batting Scorecard */}
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
                                  {liveScorecard.batting.map((batsman, index) => (
                                    <tr key={index} className={`border-b hover:bg-muted/20 ${!batsman.out && batsmanOnStrike === batsman.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                      <td className="p-2">
                                        <div className="font-medium">
                                          <div className="flex items-center">
                                            {batsman.name}
                                            {!batsman.out && batsmanOnStrike === batsman.name && <span className="ml-1 text-blue-600">*</span>}
                                          </div>
                                          {batsman.out && batsman.outType && (
                                            <div className="text-xs text-destructive mt-1">
                                              {batsman.outType === 'bowled' && `b ${batsman.bowler || 'bowler'}`}
                                              {batsman.outType === 'caught' && `c ${batsman.bowler || 'fielder'} b ${batsman.bowler || 'bowler'}`}
                                              {batsman.outType === 'lbw' && `lbw b ${batsman.bowler || 'bowler'}`}
                                              {batsman.outType === 'caught behind' && `c behind b ${batsman.bowler || 'bowler'}`}
                                              {batsman.outType === 'run out' && `run out`}
                                              {!['bowled', 'caught', 'lbw', 'caught behind', 'run out'].includes(batsman.outType) && `${batsman.outType} b ${batsman.bowler || 'bowler'}`}
                                            </div>
                                          )}
                                          {batsman.out && !batsman.outType && (
                                            <div className="text-xs text-destructive mt-1">OUT</div>
                                          )}
                                        </div>
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

                          {/* Live Bowling Figures */}
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
                                  {liveScorecard.bowling.map((bowler, index) => (
                                    <tr key={index} className={`border-b hover:bg-muted/20 ${currentBowler === bowler.name ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                                      <td className="p-2 font-medium">{bowler.name}</td>
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

                          {/* Fall of Wickets */}
                          {liveScorecard.fallOfWickets.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2">Fall of Wickets</h4>
                              <div className="space-y-1">
                                {liveScorecard.fallOfWickets.map((wicket, index) => (
                                  <div key={index} className="text-sm p-2 bg-muted/30 rounded">
                                    {wicket.wickets} - {wicket.batsman} ({wicket.score}) at {wicket.overs} overs
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (matchResult && matchResult.firstInnings && matchResult.secondInnings) ||
                        (match && match.status === 'completed' && match.match_data) ? (
                      /* Final Scorecard After Match Completion */
                      <div className="space-y-8">
                        {/* First Innings */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-4 flex items-center">
                            <Trophy className="w-5 h-5 mr-2 text-blue-600" />
                            1st Innings: {matchResult.homeTeamName} - {matchResult.homeScore}/{matchResult.homeWickets}
                            <span className="text-sm text-muted-foreground ml-2">({matchResult.homeOvers} overs)</span>
                          </h3>

                          {/* Batting Scorecard - First Innings */}
                          <div className="mb-6">
                            <h4 className="font-medium mb-3 text-blue-700">Batting</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead>
                                  <tr className="border-b bg-blue-50 dark:bg-blue-900/20">
                                    <th className="text-left p-3 font-semibold">Batsman</th>
                                    <th className="text-center p-3 font-semibold">Dismissal</th>
                                    <th className="text-center p-3 font-semibold">R</th>
                                    <th className="text-center p-3 font-semibold">B</th>
                                    <th className="text-center p-3 font-semibold">4s</th>
                                    <th className="text-center p-3 font-semibold">6s</th>
                                    <th className="text-center p-3 font-semibold">SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.firstInnings.batsmanScores?.map((batsman, index) => {
                                    // Format dismissal according to cricket standards
                                    const getDismissalText = (batsman) => {
                                      if (!batsman.out) return 'not out';
                                      switch (batsman.outType) {
                                        case 'bowled': return `b ${batsman.bowler || 'bowler'}`;
                                        case 'caught': return `c ${batsman.bowler || 'fielder'} b ${batsman.bowler || 'bowler'}`;
                                        case 'lbw': return `lbw b ${batsman.bowler || 'bowler'}`;
                                        case 'caught behind': return `c behind b ${batsman.bowler || 'bowler'}`;
                                        case 'run out': return 'run out';
                                        case 'stumped': return `st ${batsman.bowler || 'keeper'} b ${batsman.bowler || 'bowler'}`;
                                        case 'hit wicket': return 'hit wicket';
                                        default: return batsman.outType || 'out';
                                      }
                                    };

                                    return (
                                      <tr key={index} className="border-b hover:bg-muted/20">
                                        <td className="p-3 font-medium">{batsman.name}</td>
                                        <td className="p-3 text-sm text-muted-foreground">{getDismissalText(batsman)}</td>
                                        <td className="text-center p-3 font-medium">{batsman.runs}</td>
                                        <td className="text-center p-3">{batsman.balls}</td>
                                        <td className="text-center p-3">{batsman.fours}</td>
                                        <td className="text-center p-3">{batsman.sixes}</td>
                                        <td className="text-center p-3">{batsman.strikeRate}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Figures - First Innings */}
                          <div>
                            <h4 className="font-medium mb-3 text-red-700">Bowling</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead>
                                  <tr className="border-b bg-red-50 dark:bg-red-900/20">
                                    <th className="text-left p-3 font-semibold">Bowler</th>
                                    <th className="text-center p-3 font-semibold">O</th>
                                    <th className="text-center p-3 font-semibold">M</th>
                                    <th className="text-center p-3 font-semibold">R</th>
                                    <th className="text-center p-3 font-semibold">W</th>
                                    <th className="text-center p-3 font-semibold">Econ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.firstInnings.bowlingFigures?.map((bowler, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/20">
                                      <td className="p-3 font-medium">{bowler.name}</td>
                                      <td className="text-center p-3">{bowler.overs}</td>
                                      <td className="text-center p-3">{bowler.maidens}</td>
                                      <td className="text-center p-3">{bowler.runs}</td>
                                      <td className="text-center p-3 font-medium">{bowler.wickets}</td>
                                      <td className="text-center p-3">{bowler.economy}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Second Innings */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-4 flex items-center">
                            <Trophy className="w-5 h-5 mr-2 text-green-600" />
                            2nd Innings: {matchResult.awayTeamName} - {matchResult.awayScore}/{matchResult.awayWickets}
                            <span className="text-sm text-muted-foreground ml-2">({matchResult.awayOvers} overs)</span>
                          </h3>

                          {/* Batting Scorecard - Second Innings */}
                          <div className="mb-6">
                            <h4 className="font-medium mb-3 text-green-700">Batting</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead>
                                  <tr className="border-b bg-green-50 dark:bg-green-900/20">
                                    <th className="text-left p-3 font-semibold">Batsman</th>
                                    <th className="text-center p-3 font-semibold">Dismissal</th>
                                    <th className="text-center p-3 font-semibold">R</th>
                                    <th className="text-center p-3 font-semibold">B</th>
                                    <th className="text-center p-3 font-semibold">4s</th>
                                    <th className="text-center p-3 font-semibold">6s</th>
                                    <th className="text-center p-3 font-semibold">SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.secondInnings.batsmanScores?.map((batsman, index) => {
                                    // Format dismissal according to cricket standards
                                    const getDismissalText = (batsman) => {
                                      if (!batsman.out) return 'not out';
                                      switch (batsman.outType) {
                                        case 'bowled': return `b ${batsman.bowler || 'bowler'}`;
                                        case 'caught': return `c ${batsman.bowler || 'fielder'} b ${batsman.bowler || 'bowler'}`;
                                        case 'lbw': return `lbw b ${batsman.bowler || 'bowler'}`;
                                        case 'caught behind': return `c behind b ${batsman.bowler || 'bowler'}`;
                                        case 'run out': return 'run out';
                                        case 'stumped': return `st ${batsman.bowler || 'keeper'} b ${batsman.bowler || 'bowler'}`;
                                        case 'hit wicket': return 'hit wicket';
                                        default: return batsman.outType || 'out';
                                      }
                                    };

                                    return (
                                      <tr key={index} className="border-b hover:bg-muted/20">
                                        <td className="p-3 font-medium">{batsman.name}</td>
                                        <td className="p-3 text-sm text-muted-foreground">{getDismissalText(batsman)}</td>
                                        <td className="text-center p-3 font-medium">{batsman.runs}</td>
                                        <td className="text-center p-3">{batsman.balls}</td>
                                        <td className="text-center p-3">{batsman.fours}</td>
                                        <td className="text-center p-3">{batsman.sixes}</td>
                                        <td className="text-center p-3">{batsman.strikeRate}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Figures - Second Innings */}
                          <div>
                            <h4 className="font-medium mb-3 text-orange-700">Bowling</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead>
                                  <tr className="border-b bg-orange-50 dark:bg-orange-900/20">
                                    <th className="text-left p-3 font-semibold">Bowler</th>
                                    <th className="text-center p-3 font-semibold">O</th>
                                    <th className="text-center p-3 font-semibold">M</th>
                                    <th className="text-center p-3 font-semibold">R</th>
                                    <th className="text-center p-3 font-semibold">W</th>
                                    <th className="text-center p-3 font-semibold">Econ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchResult.secondInnings.bowlingFigures?.map((bowler, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/20">
                                      <td className="p-3 font-medium">{bowler.name}</td>
                                      <td className="text-center p-3">{bowler.overs}</td>
                                      <td className="text-center p-3">{bowler.maidens}</td>
                                      <td className="text-center p-3">{bowler.runs}</td>
                                      <td className="text-center p-3 font-medium">{bowler.wickets}</td>
                                      <td className="text-center p-3">{bowler.economy}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Match Summary */}
                        <div className="border rounded-lg p-4 bg-primary/5">
                          <h3 className="font-semibold text-lg mb-3">Match Summary</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">{matchResult.homeTeamName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {matchResult.homeScore}/{matchResult.homeWickets} ({matchResult.homeOvers} overs)
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">{matchResult.awayTeamName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {matchResult.awayScore}/{matchResult.awayWickets} ({matchResult.awayOvers} overs)
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium text-primary">
                              {matchResult.winner === 'tie' ? 'Match Tied' :
                               matchResult.winner ? `${matchResult.winner === user?.id ? user?.team_name : 'Opponent'} won by ${matchResult.winMargin} ${matchResult.winType}` :
                               'Match Result Pending'}
                            </p>
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
