'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Play,
  Trophy,
  Zap,
  CalendarDays
} from 'lucide-react';

export default function TournamentMatchSection({
  tournamentStatus,
  onPlayMatch,
  onQuickSim,
  onScheduleTournament,
  quickSimLoading,
  showTitle = true,
  title = "TOURNAMENT MATCH"
}) {

  if (!tournamentStatus) {
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
            <p className="text-muted-foreground">Loading tournament status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div className="space-y-4">
          {tournamentStatus.status === 'tournament_complete' ? (
            <div className="text-center py-4">
              <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tournament Complete!</h3>
              <p className="text-muted-foreground mb-4">
                All {tournamentStatus.totalMatches} matches have been completed.
              </p>
              <Button onClick={onScheduleTournament} className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4" />
                <span>Start New Tournament</span>
              </Button>
            </div>
          ) : tournamentStatus.status === 'match_in_progress' ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold">Match in Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {tournamentStatus.match?.home_team_name || 'Home Team'} vs {tournamentStatus.match?.away_team_name || 'Away Team'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {tournamentStatus.userInvolved
                    ? "Your team is playing in this match. You can play it now or use Quick Sim to skip."
                    : "This match doesn't involve your team. Use Quick Sim to proceed to your next match."
                  }
                </p>
                <div className="flex space-x-2">
                  {tournamentStatus.userInvolved && (
                    <Button onClick={onPlayMatch} className="flex items-center space-x-2">
                      <Play className="w-4 h-4" />
                      <span>Play Your Match</span>
                    </Button>
                  )}
                  <Button
                    onClick={onQuickSim}
                    disabled={quickSimLoading}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    {quickSimLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>{quickSimLoading ? 'Simulating...' : 'Quick Sim'}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : tournamentStatus.status === 'next_match_available' ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Next Tournament Match</h3>
                  <p className="text-sm text-muted-foreground">
                    {tournamentStatus.match?.home_team_name || 'Home Team'} vs {tournamentStatus.match?.away_team_name || 'Away Team'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Round {tournamentStatus.match?.round || 'N/A'} • Match {tournamentStatus.match?.match_number || 'N/A'}
                  </p>
                </div>
              </div>

              {tournamentStatus.canProceed ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {tournamentStatus.userInvolved
                      ? "Your team is playing next. Click to start the match or use Quick Sim to skip."
                      : "This match doesn't involve your team. Use Quick Sim to proceed to your next match."
                    }
                  </p>
                  <div className="flex space-x-2">
                    {tournamentStatus.userInvolved && (
                      <Button onClick={onPlayMatch} className="flex items-center space-x-2">
                        <Play className="w-4 h-4" />
                        <span>Play Your Match</span>
                      </Button>
                    )}
                    <Button
                      onClick={onQuickSim}
                      disabled={quickSimLoading}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      {quickSimLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      <span>{quickSimLoading ? 'Simulating...' : 'Quick Sim'}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {tournamentStatus.previousMatchesPending} previous match{tournamentStatus.previousMatchesPending > 1 ? 'es' : ''} must be completed first.
                  </p>
                  <Badge variant="secondary">Waiting for previous matches</Badge>
                  <Button
                    onClick={onQuickSim}
                    disabled={quickSimLoading}
                    variant="outline"
                    className="flex items-center space-x-2 mt-2"
                  >
                    {quickSimLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>{quickSimLoading ? 'Simulating...' : 'Quick Sim All Pending'}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tournament Scheduled</h3>
              <p className="text-muted-foreground mb-4">
                Schedule matches to start the tournament.
              </p>
              <Button onClick={onScheduleTournament} className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4" />
                <span>Schedule Tournament</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
