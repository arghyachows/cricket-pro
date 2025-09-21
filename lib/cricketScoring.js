/**
 * Comprehensive Cricket Scoring Algorithms and Rules
 * Implements T20, ODI, and Test cricket scoring systems
 */

// Cricket format constants
export const CRICKET_FORMATS = {
  TEST: 'test',
  ODI: 'odi',
  T20: 't20'
};

// Scoring constants
export const SCORING_RULES = {
  MAX_OVERS: {
    [CRICKET_FORMATS.TEST]: null, // Unlimited
    [CRICKET_FORMATS.ODI]: 50,
    [CRICKET_FORMATS.T20]: 20
  },
  MAX_WICKETS: 10,
  BALLS_PER_OVER: 6,
  POWERPLAY_OVERS: {
    [CRICKET_FORMATS.TEST]: null,
    [CRICKET_FORMATS.ODI]: 10,
    [CRICKET_FORMATS.T20]: 6
  }
};

/**
 * Convert cricket over notation to decimal overs
 * @param {number} overs - Overs in cricket notation (e.g., 19.4)
 * @returns {number} Overs in decimal format
 */
export function oversToDecimal(overs) {
  const wholeOvers = Math.floor(overs);
  const balls = (overs - wholeOvers) * 10; // Convert 0.4 to 4 balls
  return wholeOvers + (balls / SCORING_RULES.BALLS_PER_OVER);
}

/**
 * Convert decimal overs to cricket notation
 * @param {number} decimalOvers - Overs in decimal format
 * @returns {number} Overs in cricket notation
 */
export function decimalToOvers(decimalOvers) {
  const wholeOvers = Math.floor(decimalOvers);
  const remainingBalls = (decimalOvers - wholeOvers) * SCORING_RULES.BALLS_PER_OVER;
  return wholeOvers + (remainingBalls / 10);
}

/**
 * Calculate current run rate
 * @param {number} runs - Total runs scored
 * @param {number} overs - Overs faced in cricket notation
 * @returns {number} Current run rate
 */
export function calculateCurrentRunRate(runs, overs) {
  if (overs <= 0) return 0;
  const decimalOvers = oversToDecimal(overs);
  return runs / decimalOvers;
}

/**
 * Calculate required run rate
 * @param {number} target - Target score to chase
 * @param {number} currentRuns - Current runs scored
 * @param {number} remainingOvers - Remaining overs in cricket notation
 * @returns {number} Required run rate
 */
export function calculateRequiredRunRate(target, currentRuns, remainingOvers) {
  const runsNeeded = target - currentRuns;
  if (remainingOvers <= 0) return runsNeeded > 0 ? Infinity : 0;
  const decimalOvers = oversToDecimal(remainingOvers);
  return runsNeeded / decimalOvers;
}

/**
 * Calculate Net Run Rate (NRR)
 * @param {number} runsScored - Total runs scored by team
 * @param {number} oversFaced - Total overs faced by team
 * @param {number} runsConceded - Total runs conceded by team
 * @param {number} oversBowled - Total overs bowled by team
 * @param {string} format - Cricket format (test/odi/t20)
 * @returns {number} Net run rate
 */
export function calculateNetRunRate(runsScored, oversFaced, runsConceded, oversBowled, format = CRICKET_FORMATS.T20) {
  const maxOvers = SCORING_RULES.MAX_OVERS[format];

  // For limited-overs cricket, if team was bowled out early, count as facing full quota
  let effectiveOversFaced = oversToDecimal(oversFaced);
  let effectiveOversBowled = oversToDecimal(oversBowled);

  if (maxOvers && effectiveOversFaced < maxOvers) {
    effectiveOversFaced = maxOvers;
  }
  if (maxOvers && effectiveOversBowled < maxOvers) {
    effectiveOversBowled = maxOvers;
  }

  const runRate = runsScored / effectiveOversFaced;
  const economyRate = runsConceded / effectiveOversBowled;

  return runRate - economyRate;
}

/**
 * Calculate projected final score using T20 algorithms
 * @param {number} currentRuns - Current runs scored
 * @param {number} currentOvers - Current overs faced
 * @param {number} totalOvers - Total overs in innings
 * @param {number} wicketsLost - Wickets lost so far
 * @param {string} phase - Current phase of innings (powerplay/middle/death)
 * @returns {number} Projected final score
 */
export function calculateT20Projection(currentRuns, currentOvers, totalOvers, wicketsLost, phase = 'middle') {
  const decimalCurrentOvers = oversToDecimal(currentOvers);
  const decimalTotalOvers = totalOvers;
  const oversRemaining = decimalTotalOvers - decimalCurrentOvers;

  if (oversRemaining <= 0) return currentRuns;

  // T20 scoring phases with different run rate expectations
  const phaseMultipliers = {
    powerplay: { baseRR: 7.5, wicketPenalty: 0.8 },
    middle: { baseRR: 8.2, wicketPenalty: 1.0 },
    death: { baseRR: 9.5, wicketPenalty: 1.2 }
  };

  const { baseRR, wicketPenalty } = phaseMultipliers[phase] || phaseMultipliers.middle;

  // Adjust for wickets lost (more impact in T20)
  const wicketAdjustment = Math.max(0, 1 - (wicketsLost * 0.15 * wicketPenalty));

  // Calculate expected run rate for remaining overs
  const expectedRR = baseRR * wicketAdjustment;

  // Project remaining runs
  const projectedRuns = expectedRR * oversRemaining;

  return Math.round(currentRuns + projectedRuns);
}

/**
 * Calculate Duckworth-Lewis-Stern revised target
 * @param {number} originalTarget - Original target score
 * @param {number} oversAvailable - Total overs available
 * @param {number} oversRemaining - Overs remaining when interrupted
 * @param {number} wicketsLost - Wickets lost by team batting first
 * @returns {number} Revised target score
 */
export function calculateDLSTarget(originalTarget, oversAvailable, oversRemaining, wicketsLost) {
  // Simplified DLS calculation (actual DLS is more complex)
  const resourcesAvailable = (oversRemaining / oversAvailable) * (1 - wicketsLost * 0.1);
  const revisedTarget = Math.round(originalTarget * (1 / resourcesAvailable));
  return revisedTarget;
}

/**
 * Validate cricket scoring data
 * @param {Object} scoreData - Score data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateCricketScore(scoreData) {
  const errors = [];

  if (scoreData.runs < 0) {
    errors.push('Runs cannot be negative');
  }

  if (scoreData.wickets < 0 || scoreData.wickets > SCORING_RULES.MAX_WICKETS) {
    errors.push(`Wickets must be between 0 and ${SCORING_RULES.MAX_WICKETS}`);
  }

  if (scoreData.overs < 0) {
    errors.push('Overs cannot be negative');
  }

  const maxOvers = SCORING_RULES.MAX_OVERS[scoreData.format];
  if (maxOvers && oversToDecimal(scoreData.overs) > maxOvers) {
    errors.push(`Overs cannot exceed ${maxOvers} for ${scoreData.format.toUpperCase()}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate balls remaining in current over
 * @param {number} overs - Current overs in cricket notation
 * @returns {number} Balls remaining in current over (0-5)
 */
export function ballsRemainingInOver(overs) {
  const balls = (overs - Math.floor(overs)) * 10;
  return SCORING_RULES.BALLS_PER_OVER - balls;
}

/**
 * Calculate total balls bowled
 * @param {number} overs - Overs in cricket notation
 * @returns {number} Total balls bowled
 */
export function totalBallsBowled(overs) {
  return Math.floor(overs) * SCORING_RULES.BALLS_PER_OVER + ((overs % 1) * 10);
}

/**
 * Check if innings is complete
 * @param {number} wickets - Wickets lost
 * @param {number} overs - Overs completed
 * @param {string} format - Cricket format
 * @returns {boolean} Whether innings is complete
 */
export function isInningsComplete(wickets, overs, format) {
  // All out
  if (wickets >= SCORING_RULES.MAX_WICKETS) return true;

  // Overs completed (for limited-overs cricket)
  const maxOvers = SCORING_RULES.MAX_OVERS[format];
  if (maxOvers && oversToDecimal(overs) >= maxOvers) return true;

  return false;
}

/**
 * Get maximum overs for a cricket format
 * @param {string} format - Cricket format
 * @returns {number|null} Maximum overs or null for unlimited
 */
export function getMaxOvers(format) {
  return SCORING_RULES.MAX_OVERS[format] || null;
}

/**
 * Check if overs limit is exceeded for format
 * @param {number} overs - Current overs
 * @param {string} format - Cricket format
 * @returns {boolean} Whether overs limit is exceeded
 */
export function isOversLimitExceeded(overs, format) {
  const maxOvers = getMaxOvers(format);
  if (!maxOvers) return false; // Test cricket has no limit
  return oversToDecimal(overs) > maxOvers;
}

/**
 * Get remaining overs in format
 * @param {number} currentOvers - Current overs completed
 * @param {string} format - Cricket format
 * @returns {number} Remaining overs
 */
export function getRemainingOvers(currentOvers, format) {
  const maxOvers = getMaxOvers(format);
  if (!maxOvers) return null; // Unlimited for Test cricket
  const remaining = maxOvers - oversToDecimal(currentOvers);
  return Math.max(0, remaining);
}

/**
 * Calculate strike rate
 * @param {number} runs - Runs scored
 * @param {number} balls - Balls faced
 * @returns {number} Strike rate
 */
export function calculateStrikeRate(runs, balls) {
  if (balls <= 0) return 0;
  return (runs / balls) * 100;
}

/**
 * Calculate bowling economy rate
 * @param {number} runs - Runs conceded
 * @param {number} overs - Overs bowled
 * @returns {number} Economy rate
 */
export function calculateEconomyRate(runs, overs) {
  const decimalOvers = oversToDecimal(overs);
  if (decimalOvers <= 0) return 0;
  return runs / decimalOvers;
}

/**
 * Get innings phase for T20 cricket
 * @param {number} overs - Current overs completed
 * @returns {string} Phase of innings (powerplay/middle/death)
 */
export function getT20InningsPhase(overs) {
  const decimalOvers = oversToDecimal(overs);

  if (decimalOvers <= SCORING_RULES.POWERPLAY_OVERS[CRICKET_FORMATS.T20]) {
    return 'powerplay';
  } else if (decimalOvers <= 15) {
    return 'middle';
  } else {
    return 'death';
  }
}

/**
 * Calculate T20 powerplay score prediction
 * @param {number} currentRuns - Runs in powerplay
 * @param {number} wicketsLost - Wickets lost in powerplay
 * @returns {Object} Prediction with expected range
 */
export function predictT20PowerplayScore(currentRuns, wicketsLost) {
  const basePowerplayScore = 45; // Average T20 powerplay score
  const wicketPenalty = wicketsLost * 8;
  const expectedScore = Math.max(0, basePowerplayScore - wicketPenalty);

  return {
    expected: expectedScore,
    range: {
      min: Math.max(0, expectedScore - 15),
      max: expectedScore + 15
    }
  };
}

/**
 * Calculate match result probability
 * @param {number} target - Target score
 * @param {number} currentRuns - Current runs
 * @param {number} remainingOvers - Remaining overs
 * @param {number} wicketsRemaining - Wickets remaining
 * @param {string} format - Cricket format
 * @returns {Object} Probability assessment
 */
export function calculateWinProbability(target, currentRuns, remainingOvers, wicketsRemaining, format) {
  const runsNeeded = target - currentRuns;
  const requiredRR = calculateRequiredRunRate(target, currentRuns, remainingOvers);

  let probability = 0.5; // Base 50% probability

  // Adjust based on required run rate
  if (requiredRR > 12) probability -= 0.3;
  else if (requiredRR > 9) probability -= 0.1;
  else if (requiredRR < 6) probability += 0.2;

  // Adjust based on wickets remaining
  probability += (wicketsRemaining - 5) * 0.05;

  // Adjust based on overs remaining
  const decimalOvers = oversToDecimal(remainingOvers);
  if (decimalOvers > 10) probability += 0.1;
  else if (decimalOvers < 5) probability -= 0.1;

  // Format-specific adjustments
  if (format === CRICKET_FORMATS.T20) {
    // T20 is more unpredictable
    probability = probability * 0.8 + 0.5 * 0.2;
  }

  return {
    probability: Math.max(0, Math.min(1, probability)),
    assessment: probability > 0.6 ? 'favorable' : probability < 0.4 ? 'unfavorable' : 'competitive'
  };
}

/**
 * Generate exciting T20 scoring patterns
 * @param {number} currentOvers - Current overs completed
 * @param {number} wicketsLost - Wickets lost so far
 * @param {string} phase - Current phase (powerplay/middle/death)
 * @returns {Object} Scoring pattern with runs distribution
 */
export function generateT20ScoringPattern(currentOvers, wicketsLost, phase = 'middle') {
  const decimalOvers = oversToDecimal(currentOvers);

  // Base scoring patterns for different phases
  const phasePatterns = {
    powerplay: {
      // Aggressive batting in powerplay (overs 1-6)
      baseRunsPerOver: 8.5,
      boundaryRate: 0.35, // 35% chance of boundary per ball
      sixRate: 0.15, // 15% chance of six
      wicketRate: 0.08, // 8% wicket chance per over
      dotBallRate: 0.25
    },
    middle: {
      // Consolidation phase (overs 7-15)
      baseRunsPerOver: 7.8,
      boundaryRate: 0.28,
      sixRate: 0.12,
      wicketRate: 0.06,
      dotBallRate: 0.30
    },
    death: {
      // Death overs (overs 16-20)
      baseRunsPerOver: 10.2,
      boundaryRate: 0.32,
      sixRate: 0.20,
      wicketRate: 0.10,
      dotBallRate: 0.20
    }
  };

  const pattern = phasePatterns[phase] || phasePatterns.middle;

  // Adjust for wickets lost
  const wicketAdjustment = Math.max(0.3, 1 - (wicketsLost * 0.12));
  const adjustedRunsPerOver = pattern.baseRunsPerOver * wicketAdjustment;

  return {
    expectedRunsPerOver: adjustedRunsPerOver,
    boundaryRate: pattern.boundaryRate,
    sixRate: pattern.sixRate,
    wicketRate: pattern.wicketRate,
    dotBallRate: pattern.dotBallRate,
    phase,
    excitement: phase === 'death' ? 'high' : phase === 'powerplay' ? 'medium' : 'steady'
  };
}

/**
 * Calculate T20 excitement factor
 * @param {number} currentRuns - Current runs
 * @param {number} currentOvers - Current overs
 * @param {number} wicketsLost - Wickets lost
 * @param {number} target - Target score (if chasing)
 * @returns {Object} Excitement metrics
 */
export function calculateT20Excitement(currentRuns, currentOvers, wicketsLost, target = null) {
  const decimalOvers = oversToDecimal(currentOvers);
  const phase = getT20InningsPhase(currentOvers);
  const pattern = generateT20ScoringPattern(currentOvers, wicketsLost, phase);

  let excitementScore = 0;
  let factors = [];

  // Phase-based excitement
  if (phase === 'death') {
    excitementScore += 30;
    factors.push('Death overs intensity');
  } else if (phase === 'powerplay') {
    excitementScore += 20;
    factors.push('Powerplay aggression');
  }

  // Wicket situation excitement
  if (wicketsLost >= 7) {
    excitementScore += 25;
    factors.push('High wicket pressure');
  } else if (wicketsLost <= 2) {
    excitementScore += 15;
    factors.push('Stable batting');
  }

  // Run rate excitement
  const currentRR = calculateCurrentRunRate(currentRuns, currentOvers);
  if (currentRR > 10) {
    excitementScore += 20;
    factors.push('Explosive scoring');
  } else if (currentRR > 8) {
    excitementScore += 10;
    factors.push('Good momentum');
  }

  // Chase excitement
  if (target) {
    const requiredRR = calculateRequiredRunRate(target, currentRuns, 20 - decimalOvers);
    if (requiredRR > 12) {
      excitementScore += 35;
      factors.push('Impossible chase drama');
    } else if (requiredRR > 9) {
      excitementScore += 25;
      factors.push('Tense chase');
    } else if (requiredRR < 6 && decimalOvers < 15) {
      excitementScore += 15;
      factors.push('Comfortable chase');
    }
  }

  // Boundary frequency
  if (pattern.boundaryRate > 0.3) {
    excitementScore += 15;
    factors.push('Boundary barrage');
  }

  return {
    score: Math.min(100, excitementScore),
    level: excitementScore > 60 ? 'extreme' : excitementScore > 40 ? 'high' : excitementScore > 20 ? 'medium' : 'low',
    factors,
    phase,
    currentRunRate: currentRR,
    expectedNextOver: pattern.expectedRunsPerOver
  };
}

/**
 * Validate T20 match state according to official ICC rules
 * @param {Object} matchState - Current match state
 * @returns {Object} Validation result
 */
export function validateT20MatchState(matchState) {
  const errors = [];
  const warnings = [];

  // Check overs limit - T20 is maximum 20 overs per innings
  if (isOversLimitExceeded(matchState.overs, CRICKET_FORMATS.T20)) {
    errors.push('T20 match cannot exceed 20 overs per innings');
  }

  // Check wickets - maximum 10 wickets per innings
  if (matchState.wickets > SCORING_RULES.MAX_WICKETS) {
    errors.push('Cannot have more than 10 wickets');
  }

  // Check minimum overs requirement - teams must face at least 5 overs for valid result
  const decimalOvers = oversToDecimal(matchState.overs);
  if (decimalOvers < 5 && matchState.wickets >= SCORING_RULES.MAX_WICKETS) {
    warnings.push('Match may be invalid - teams must face minimum 5 overs');
  }

  // Powerplay fielding restrictions (overs 1-6)
  if (decimalOvers <= 6 && matchState.powerplayFielders > 2) {
    warnings.push('Powerplay (overs 1-6): Max 2 fielders outside 30-yard circle');
  }

  // Post-powerplay fielding restrictions (overs 7-20)
  if (decimalOvers > 6 && matchState.powerplayFielders > 5) {
    warnings.push('Post-powerplay (overs 7-20): Max 5 fielders outside 30-yard circle');
  }

  // Bowling restrictions - no bowler can bowl more than 4 overs
  if (matchState.bowlerOvers > 4) {
    errors.push('No bowler can bowl more than 4 overs in T20');
  }

  // Time limits - fielding team must start 20th over within 75-90 minutes
  if (matchState.timeElapsed > 90) {
    warnings.push('Fielding team over 90-minute time limit for 20th over');
  }

  // Free hit rule validation (would need ball-by-ball data)
  // This would check if no-ball was followed by free hit

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    oversRemaining: getRemainingOvers(matchState.overs, CRICKET_FORMATS.T20),
    isPowerplay: decimalOvers <= 6,
    isDeathOvers: decimalOvers >= 16
  };
}

/**
 * Generate T20 match summary
 * @param {Object} matchData - Complete match data
 * @returns {Object} Match summary with key statistics
 */
export function generateT20MatchSummary(matchData) {
  const firstInnings = matchData.firstInnings || {};
  const secondInnings = matchData.secondInnings || {};

  const summary = {
    format: 'T20',
    totalOvers: 40, // 20 per team
    matchDuration: 'Approximately 3 hours',
    keyStats: {
      highestScore: Math.max(firstInnings.runs || 0, secondInnings.runs || 0),
      lowestScore: Math.min(firstInnings.runs || 0, secondInnings.runs || 0),
      averageRunRate: ((firstInnings.runs || 0) + (secondInnings.runs || 0)) / 40,
      totalBoundaries: (firstInnings.fours || 0) + (firstInnings.sixes || 0) +
                      (secondInnings.fours || 0) + (secondInnings.sixes || 0),
      totalWickets: (firstInnings.wickets || 0) + (secondInnings.wickets || 0)
    },
    excitement: calculateT20Excitement(
      secondInnings.runs || 0,
      secondInnings.overs || 0,
      secondInnings.wickets || 0,
      firstInnings.runs || 0
    )
  };

  return summary;
}

/**
 * Calculate T20 player impact rating
 * @param {Object} playerStats - Player statistics
 * @param {string} role - Player role (batsman/bowler/allrounder)
 * @returns {number} Impact rating (0-100)
 */
export function calculateT20PlayerImpact(playerStats, role = 'batsman') {
  let impact = 0;

  switch (role) {
    case 'batsman':
      // Batting impact
      impact += (playerStats.runs || 0) * 1.2;
      impact += (playerStats.fours || 0) * 1.5;
      impact += (playerStats.sixes || 0) * 2.0;
      impact += calculateStrikeRate(playerStats.runs || 0, playerStats.balls || 0) * 0.5;
      break;

    case 'bowler':
      // Bowling impact
      impact += (playerStats.wickets || 0) * 25;
      impact += (3 - calculateEconomyRate(playerStats.runs || 0, playerStats.overs || 0)) * 5;
      impact += (playerStats.maidens || 0) * 10;
      break;

    case 'allrounder':
      // Combined impact
      impact += calculateT20PlayerImpact(playerStats, 'batsman') * 0.6;
      impact += calculateT20PlayerImpact(playerStats, 'bowler') * 0.4;
      break;
  }

  return Math.min(100, Math.max(0, impact));
}
