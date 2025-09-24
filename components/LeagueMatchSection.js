'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Play,
  Trophy,
  Zap,
  CalendarDays,
  Target,
  Users,
  Clock
} from 'lucide-react';

export default function LeagueMatchSection({
  leagueStatus,
  onQuickSim,
  onScheduleLeague,
  quickSimLoading,
  showTitle = true,
  title = "LEAGUE MATCH"
}) {
  const [showQuickSimDetails, setShowQuickSimDetails] = useState(false);

  if (!leagueStatus) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading league status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate league progress
  const getLeagueProgress = () => {
    if (leagueStatus.status === 'league_complete') {
      return 100;
    }
    if (leagueStatus.totalMatches && leagueStatus.completedMatches !== undefined) {
      return Math.round((leagueStatus.completedMatches / leagueStatus.totalMatches) * 100);
    }
    return 0;
  };

  const progress = getLeagueProgress();

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{title}</span>
          </CardTitle>
          {leagueStatus.totalMatches && (
            <div className="mt-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>League Progress</span>
                <span>{leagueStatus.completedMatches || 0}/{leagueStatus.totalMatches} matches</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {leagueStatus.status === 'league_complete' ? (
            <div className="text-center py-4">
              <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">🏆 League Complete!</h3>
              <p className="text-muted-foreground mb-4">
                Congratulations! All {leagueStatus.totalMatches} matches have been completed.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  🎉 Your team finished the season! Check the league table to see final standings.
                </p>
              </div>
              <Button onClick={onScheduleLeague} className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4" />
                <span>Start New Season</span>
              </Button>
            </div>
          ) : leagueStatus.status === 'match_in_progress' ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold">⚡ Match in Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {leagueStatus.match?.home_team_name || 'Home Team'} vs {leagueStatus.match?.away_team_name || 'Away Team'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Round {leagueStatus.match?.round || 'N/A'} • Match {leagueStatus.match?.match_number || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Current Match Score Display */}
              {leagueStatus.match?.home_score !== undefined && (
                <div className="bg-white/50 rounded-lg p-4 border">
                  <div className="text-center space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-left flex-1">
                        <div className="font-medium text-sm">{leagueStatus.match.home_team_name}</div>
                        <div className="text-xl font-bold text-blue-600">
                          {leagueStatus.match.home_score}/{leagueStatus.match.home_wickets}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({leagueStatus.match.home_overs} overs)
                        </div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-sm text-muted-foreground font-medium">VS</div>
                        <div className="text-xs text-muted-foreground">T20</div>
                        <div className="text-xs text-muted-foreground">League</div>
                      </div>
                      <div className="text-right flex-1">
                        <div className="font-medium text-sm">{leagueStatus.match.away_team_name}</div>
                        <div className="text-xl font-bold text-red-600">
                          {leagueStatus.match.away_score}/{leagueStatus.match.away_wickets}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({leagueStatus.match.away_overs} overs)
                        </div>
                      </div>
                    </div>
                    {leagueStatus.match.result && (
                      <div className="pt-3 border-t">
                        <Badge variant={leagueStatus.match.result === 'tie' ? 'secondary' : 'default'} className="text-xs">
                          {leagueStatus.match.result === 'tie'
                            ? '🤝 Match Tied'
                            : `🏆 ${leagueStatus.match.result === leagueStatus.match.home_team_id
                                ? leagueStatus.match.home_team_name
                                : leagueStatus.match.away_team_name} won by ${leagueStatus.match.win_margin} ${leagueStatus.match.win_type}`
                          }
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    {leagueStatus.userInvolved
                      ? "🎯 Your team is currently playing! Use Quick Sim to generate random results and continue."
                      : "⏭️ This match doesn't involve your team. Use Quick Sim to fast-forward to your next match."
                    }
                  </p>
                </div>

                <Button
                  onClick={onQuickSim}
                  disabled={quickSimLoading}
                  variant="outline"
                  className="flex items-center space-x-2 w-full"
                >
                  {quickSimLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>{quickSimLoading ? '⚡ Simulating...' : '⚡ Quick Sim Match'}</span>
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  Quick Sim generates random T20 scores and progresses the league
                </div>
              </div>
            </div>
          ) : leagueStatus.status === 'next_match_available' ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold">🎯 Next League Match</h3>
                  <p className="text-sm text-muted-foreground">
                    {leagueStatus.match?.home_team_name || 'Home Team'} vs {leagueStatus.match?.away_team_name || 'Away Team'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Round {leagueStatus.match?.round || 'N/A'} • Match {leagueStatus.match?.match_number || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Next Match Preview */}
              <div className="bg-white/30 rounded-lg p-4 border border-dashed">
                <div className="text-center space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-left flex-1">
                      <div className="font-medium">{leagueStatus.match?.home_team_name || 'Home Team'}</div>
                      <div className="text-sm text-muted-foreground">Home</div>
                    </div>
                    <div className="text-center px-4">
                      <div className="text-lg font-bold text-muted-foreground">VS</div>
                      <div className="text-xs text-muted-foreground">T20 Cricket</div>
                      <div className="text-xs text-muted-foreground">League Match</div>
                    </div>
                    <div className="text-right flex-1">
                      <div className="font-medium">{leagueStatus.match?.away_team_name || 'Away Team'}</div>
                      <div className="text-sm text-muted-foreground">Away</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Ready to Play</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>League Round {leagueStatus.match?.round || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {leagueStatus.canProceed ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      {leagueStatus.userInvolved
                        ? "🎯 Your team is up next! Use Quick Sim to generate random results and continue the season."
                        : "⏭️ This match doesn't involve your team. Quick Sim will fast-forward to your next match."
                      }
                    </p>
                  </div>

                  <Button
                    onClick={() => setShowQuickSimDetails(!showQuickSimDetails)}
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full"
                  >
                    {showQuickSimDetails ? 'Hide' : 'Show'} Quick Sim Details
                  </Button>

                  {showQuickSimDetails && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                      <p className="font-medium mb-1">⚡ Quick Sim generates:</p>
                      <ul className="space-y-1">
                        <li>• Random T20 scores (120-200 runs)</li>
                        <li>• Realistic wickets (4-10)</li>
                        <li>• Proper win/loss determination</li>
                        <li>• Automatic progression to next match</li>
                      </ul>
                    </div>
                  )}

                  <Button
                    onClick={onQuickSim}
                    disabled={quickSimLoading}
                    variant="outline"
                    className="flex items-center space-x-2 w-full"
                  >
                    {quickSimLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>{quickSimLoading ? '⚡ Simulating Match...' : '⚡ Quick Sim Match'}</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800">
                      ⏳ {leagueStatus.previousMatchesPending} previous match{leagueStatus.previousMatchesPending > 1 ? 'es' : ''} must be completed first.
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Waiting for Previous Matches
                  </Badge>
                  <Button
                    onClick={onQuickSim}
                    disabled={quickSimLoading}
                    variant="outline"
                    className="flex items-center space-x-2 w-full"
                  >
                    {quickSimLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>{quickSimLoading ? '⚡ Simulating All...' : '⚡ Quick Sim All Pending'}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : leagueStatus.status === 'no_active_season' ? (
            <div className="text-center py-4">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Season</h3>
              <p className="text-muted-foreground mb-4">
                No league season is currently active. Start a new season to begin playing.
              </p>
              <Button onClick={onScheduleLeague} className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4" />
                <span>🏁 Start New Season</span>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No League Scheduled</h3>
              <p className="text-muted-foreground mb-4">
                Schedule league matches to start the season and begin playing.
              </p>
              <Button onClick={onScheduleLeague} className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4" />
                <span>📅 Schedule League</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
