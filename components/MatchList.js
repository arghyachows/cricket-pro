'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MatchSummary from './MatchSummary';
import {
  Calendar,
  Trophy,
  Eye,
  Clock
} from 'lucide-react';

export default function MatchList({ userId, showTitle = true, title = "Recent Matches" }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showMatchSummary, setShowMatchSummary] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchMatches();
    }
  }, [userId]);

  const fetchMatches = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/matches?userId=${userId}&status=completed&limit=20`);
      const matchesData = await response.json();

      // Sort by completion date (most recent first)
      const sortedMatches = matchesData.sort((a, b) =>
        new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at)
      );

      setMatches(sortedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMatch = async (match) => {
    // If match already has detailed data, use it
    if (match.match_data && match.match_data.firstInnings) {
      setSelectedMatch({
        matchId: match.id,
        homeTeam: { id: match.home_team_id, name: match.home_team_name || 'Home Team' },
        awayTeam: { id: match.away_team_id, name: match.away_team_name || 'Away Team' },
        homeScore: match.home_score,
        awayScore: match.away_score,
        homeOvers: match.home_overs,
        awayOvers: match.away_overs,
        winner: match.result,
        winMargin: match.win_margin,
        winType: match.win_type,
        target: match.target,
        commentary: match.commentary || [],
        firstInnings: match.match_data.firstInnings,
        secondInnings: match.match_data.secondInnings,
        matchConditions: {
          weather: match.weather || 'Sunny',
          pitchType: match.pitch_type || 'Normal'
        }
      });
      setShowMatchSummary(true);
      return;
    }

    // Otherwise, simulate the match to get detailed data
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

      const response = await fetch(`${baseUrl}/api/matches/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId: match.id }),
      });

      if (response.ok) {
        const matchData = await response.json();
        setSelectedMatch(matchData);
        setShowMatchSummary(true);
      }
    } catch (error) {
      console.error('Error simulating match for details:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    return new Date(dateString).toLocaleDateString();
  };

  const getResultBadge = (match, userId) => {
    const isHomeTeam = match.home_team_id === userId;
    const isAwayTeam = match.away_team_id === userId;
    const userWon = match.result === userId;

    if (isHomeTeam || isAwayTeam) {
      return (
        <Badge variant={userWon ? 'default' : 'destructive'} className="text-xs">
          {userWon ? 'Won' : 'Lost'}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        League Match
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading matches...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
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
            <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No completed matches yet</p>
            <p className="text-sm text-muted-foreground">Matches will appear here after being played</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{title}</span>
              <Badge variant="outline" className="text-xs">
                {matches.length} matches
              </Badge>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-center min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {match.home_team_name || 'Home'} vs {match.away_team_name || 'Away'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {match.home_score || 0}-{match.home_wickets || 0} ({match.home_overs || 0}) vs {match.away_score || 0}-{match.away_wickets || 0} ({match.away_overs || 0})
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(match.completed_at)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-1">
                    {getResultBadge(match, userId)}
                    {match.result && (
                      <div className="text-xs text-muted-foreground text-center">
                        {match.result === match.home_team_id
                          ? (match.home_team_name || 'Home')
                          : (match.away_team_name || 'Away')
                        } won by {match.win_margin} {match.win_type}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewMatch(match)}
                  className="ml-4 flex items-center space-x-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Match Summary Modal */}
      {showMatchSummary && selectedMatch && (
        <MatchSummary
          matchData={selectedMatch}
          onClose={() => {
            setShowMatchSummary(false);
            setSelectedMatch(null);
          }}
        />
      )}
    </>
  );
}
