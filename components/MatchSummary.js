'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Target,
  Users,
  TrendingUp,
  Clock,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function MatchSummary({ matchData, onClose }) {
  const [showCommentary, setShowCommentary] = useState(false);

  if (!matchData) return null;

  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeOvers,
    awayOvers,
    winner,
    winMargin,
    winType,
    target,
    firstInnings,
    secondInnings,
    matchConditions
  } = matchData;

  const isHomeWinner = winner === homeTeam?.id;
  const isAwayWinner = winner === awayTeam?.id;
  const isTie = winner === 'tie';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Match Summary</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Match Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">{homeTeam?.name || 'Home Team'}</h3>
                <div className="text-3xl font-bold text-blue-600">{homeScore}</div>
                <div className="text-sm text-muted-foreground">({homeOvers} overs)</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-muted-foreground">VS</div>
                <div className="text-sm text-muted-foreground">T20 Cricket</div>
              </div>

              <div className="text-center">
                <h3 className="font-bold text-lg">{awayTeam?.name || 'Away Team'}</h3>
                <div className="text-3xl font-bold text-red-600">{awayScore}</div>
                <div className="text-sm text-muted-foreground">({awayOvers} overs)</div>
              </div>
            </div>

            {/* Match Result */}
            <div className="mb-4">
              {isTie ? (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  🤝 Match Tied
                </Badge>
              ) : (
                <Badge variant="default" className="text-lg px-4 py-2">
                  🏆 {(isHomeWinner ? homeTeam?.name : awayTeam?.name) || 'Winner'} won by {winMargin} {winType}
                </Badge>
              )}
            </div>

            {/* Match Conditions */}
            {matchConditions && (
              <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                <span>🌤️ {matchConditions.weather}</span>
                <span>🏟️ {matchConditions.pitchType} Pitch</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="scorecard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
              <TabsTrigger value="bowling">Bowling</TabsTrigger>
              <TabsTrigger value="commentary">Commentary</TabsTrigger>
            </TabsList>

            <TabsContent value="scorecard" className="space-y-6">
              {/* First Innings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {homeTeam?.name || 'Home Team'} Innings
                    <Badge variant="outline" className="ml-2">
                      {firstInnings?.runs}/{firstInnings?.wickets} ({firstInnings?.overs} overs)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Batsman</th>
                          <th className="text-center p-2">R</th>
                          <th className="text-center p-2">B</th>
                          <th className="text-center p-2">4s</th>
                          <th className="text-center p-2">6s</th>
                          <th className="text-center p-2">SR</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {firstInnings?.batsmanScores?.map((batsman, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{batsman.name}</td>
                            <td className="text-center p-2 font-bold">{batsman.runs}</td>
                            <td className="text-center p-2">{batsman.balls}</td>
                            <td className="text-center p-2">{batsman.fours}</td>
                            <td className="text-center p-2">{batsman.sixes}</td>
                            <td className="text-center p-2">{batsman.strikeRate}</td>
                            <td className="p-2">
                              {batsman.out ? (
                                <span className="text-red-600 text-xs">
                                  {batsman.outType} {batsman.bowler ? `b ${batsman.bowler}` : ''}
                                </span>
                              ) : (
                                <span className="text-green-600 text-xs">Not out</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Fall of Wickets */}
                  {firstInnings?.fallOfWickets && firstInnings.fallOfWickets.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">Fall of Wickets:</h4>
                      <div className="text-xs text-muted-foreground">
                        {firstInnings.fallOfWickets.map((wicket, index) => (
                          <span key={index}>
                            {wicket.wickets}-{wicket.runs} ({wicket.batsman}, {wicket.over}.{wicket.ball} ov){index < firstInnings.fallOfWickets.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Second Innings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {awayTeam?.name || 'Away Team'} Innings
                    <Badge variant="outline" className="ml-2">
                      {secondInnings?.runs}/{secondInnings?.wickets} ({secondInnings?.overs} overs)
                    </Badge>
                    {target && (
                      <Badge variant="secondary" className="ml-2">
                        Target: {target}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Batsman</th>
                          <th className="text-center p-2">R</th>
                          <th className="text-center p-2">B</th>
                          <th className="text-center p-2">4s</th>
                          <th className="text-center p-2">6s</th>
                          <th className="text-center p-2">SR</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {secondInnings?.batsmanScores?.map((batsman, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{batsman.name}</td>
                            <td className="text-center p-2 font-bold">{batsman.runs}</td>
                            <td className="text-center p-2">{batsman.balls}</td>
                            <td className="text-center p-2">{batsman.fours}</td>
                            <td className="text-center p-2">{batsman.sixes}</td>
                            <td className="text-center p-2">{batsman.strikeRate}</td>
                            <td className="p-2">
                              {batsman.out ? (
                                <span className="text-red-600 text-xs">
                                  {batsman.outType} {batsman.bowler ? `b ${batsman.bowler}` : ''}
                                </span>
                              ) : (
                                <span className="text-green-600 text-xs">Not out</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Fall of Wickets */}
                  {secondInnings?.fallOfWickets && secondInnings.fallOfWickets.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">Fall of Wickets:</h4>
                      <div className="text-xs text-muted-foreground">
                        {secondInnings.fallOfWickets.map((wicket, index) => (
                          <span key={index}>
                            {wicket.wickets}-{wicket.runs} ({wicket.batsman}, {wicket.over}.{wicket.ball} ov){index < secondInnings.fallOfWickets.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bowling" className="space-y-6">
              {/* First Innings Bowling */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {awayTeam?.name || 'Away Team'} Bowling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Bowler</th>
                          <th className="text-center p-2">O</th>
                          <th className="text-center p-2">M</th>
                          <th className="text-center p-2">R</th>
                          <th className="text-center p-2">W</th>
                          <th className="text-center p-2">Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {firstInnings?.bowlingFigures?.map((bowler, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{bowler.name}</td>
                            <td className="text-center p-2">{bowler.overs}</td>
                            <td className="text-center p-2">{bowler.maidens}</td>
                            <td className="text-center p-2">{bowler.runs}</td>
                            <td className="text-center p-2 font-bold">{bowler.wickets}</td>
                            <td className="text-center p-2">{bowler.economy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Second Innings Bowling */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {homeTeam?.name || 'Home Team'} Bowling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Bowler</th>
                          <th className="text-center p-2">O</th>
                          <th className="text-center p-2">M</th>
                          <th className="text-center p-2">R</th>
                          <th className="text-center p-2">W</th>
                          <th className="text-center p-2">Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {secondInnings?.bowlingFigures?.map((bowler, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{bowler.name}</td>
                            <td className="text-center p-2">{bowler.overs}</td>
                            <td className="text-center p-2">{bowler.maidens}</td>
                            <td className="text-center p-2">{bowler.runs}</td>
                            <td className="text-center p-2 font-bold">{bowler.wickets}</td>
                            <td className="text-center p-2">{bowler.economy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commentary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Match Commentary
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCommentary(!showCommentary)}
                    >
                      {showCommentary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showCommentary && (
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {matchData.commentary?.slice(-20).map((comment, index) => (
                        <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                          <span className="font-medium">{comment.over}.{comment.ball}:</span> {comment.commentary}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
