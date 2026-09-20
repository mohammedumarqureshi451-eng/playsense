import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";


/* =========================================================
   HELPERS
   ========================================================= */

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, safeNumber(value)));

const average = (values) => {
  if (!values.length) return 0;
  return (
    values.reduce((sum, value) => sum + safeNumber(value), 0) /
    values.length
  );
};

const round = (value, decimals = 0) => {
  const factor = 10 ** decimals;
  return Math.round(safeNumber(value) * factor) / factor;
};

/* =========================================================
   STAGE 21
   PERFORMANCE PATTERN DETECTION ENGINE
   ========================================================= */

const detectPatterns = ({
  matches,
  selectedSport,
  getOutput,
  getPerformanceScore,
}) => {
  if (!matches || matches.length < 3) {
    return [];
  }

  const chronological = [...matches].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const recent = chronological.slice(-5);
  const previous = chronological.slice(
    Math.max(0, chronological.length - 10),
    Math.max(0, chronological.length - 5)
  );

  const recentOutputs = recent.map(getOutput);
  const previousOutputs = previous.map(getOutput);

  const recentScores = recent.map(getPerformanceScore);
  const previousScores = previous.map(getPerformanceScore);

  const recentOutputAverage = average(recentOutputs);
  const previousOutputAverage = average(previousOutputs);
  const recentScoreAverage = average(recentScores);
  const previousScoreAverage = average(previousScores);

  const patterns = [];

  /* ---------------------------------------------------------
     IMPROVING PERFORMANCE
     --------------------------------------------------------- */

  if (
    previous.length >= 2 &&
    recentScoreAverage > previousScoreAverage + 5
  ) {
    patterns.push({
      type: "improving",
      icon: "📈",
      title: "Performance Improving",
      description:
        "Your recent performance scores are trending above the previous period.",
      confidence: clamp(
        65 + (recentScoreAverage - previousScoreAverage) * 3,
        0,
        95
      ),
      tone: "positive",
    });
  }

  /* ---------------------------------------------------------
     DECLINING PERFORMANCE
     --------------------------------------------------------- */

  if (
    previous.length >= 2 &&
    recentScoreAverage < previousScoreAverage - 5
  ) {
    patterns.push({
      type: "declining",
      icon: "📉",
      title: "Performance Declining",
      description:
        "Your recent performance scores are below the previous period.",
      confidence: clamp(
        65 + (previousScoreAverage - recentScoreAverage) * 3,
        0,
        95
      ),
      tone: "negative",
    });
  }

  /* ---------------------------------------------------------
     HOT STREAK
     --------------------------------------------------------- */

  const hotMatches = recent.filter(
    (match) => getPerformanceScore(match) >= 75
  );

  if (hotMatches.length >= Math.min(3, recent.length)) {
    patterns.push({
      type: "hotStreak",
      icon: "🔥",
      title: "Hot Performance Streak",
      description:
        "Several recent matches have produced strong performance scores.",
      confidence: clamp(70 + hotMatches.length * 5, 0, 95),
      tone: "positive",
    });
  }

  /* ---------------------------------------------------------
     COLD STREAK
     --------------------------------------------------------- */

  const coldMatches = recent.filter(
    (match) => getPerformanceScore(match) < 45
  );

  if (coldMatches.length >= Math.min(3, recent.length)) {
    patterns.push({
      type: "coldStreak",
      icon: "❄️",
      title: "Cold Performance Period",
      description:
        "Several recent matches are producing lower performance scores.",
      confidence: clamp(70 + coldMatches.length * 5, 0, 95),
      tone: "negative",
    });
  }

  /* ---------------------------------------------------------
     OUTPUT IMPROVEMENT
     --------------------------------------------------------- */

  if (
    previous.length >= 2 &&
    previousOutputAverage > 0 &&
    recentOutputAverage > previousOutputAverage * 1.1
  ) {
    patterns.push({
      type: "outputGrowth",
      icon: "⚡",
      title: "Output Growth",
      description:
        selectedSport === "cricket"
          ? "Recent run output is above the earlier comparison period."
          : "Recent attacking output is above the earlier comparison period.",
      confidence: clamp(
        65 +
          ((recentOutputAverage - previousOutputAverage) /
            previousOutputAverage) *
            100,
        0,
        95
      ),
      tone: "positive",
    });
  }

  /* ---------------------------------------------------------
     OUTPUT DECLINE
     --------------------------------------------------------- */

  if (
    previous.length >= 2 &&
    previousOutputAverage > 0 &&
    recentOutputAverage < previousOutputAverage * 0.9
  ) {
    patterns.push({
      type: "outputDecline",
      icon: "↘",
      title: "Output Decline",
      description:
        selectedSport === "cricket"
          ? "Recent run output is below the earlier comparison period."
          : "Recent attacking output is below the earlier comparison period.",
      confidence: clamp(
        65 +
          ((previousOutputAverage - recentOutputAverage) /
            previousOutputAverage) *
            100,
        0,
        95
      ),
      tone: "negative",
    });
  }

  /* ---------------------------------------------------------
     CONSISTENCY
     --------------------------------------------------------- */

  const recentMean = average(recentOutputs);

  const recentVariance =
    recentOutputs.length > 0
      ? recentOutputs.reduce(
          (sum, value) =>
            sum + Math.pow(value - recentMean, 2),
          0
        ) / recentOutputs.length
      : 0;

  const recentStdDev = Math.sqrt(recentVariance);

  const recentVariation =
    recentMean > 0
      ? (recentStdDev / recentMean) * 100
      : 0;

  if (recentVariation <= 20 && recent.length >= 3) {
    patterns.push({
      type: "consistent",
      icon: "🎯",
      title: "Stable Performance Pattern",
      description:
        "Your recent output has remained within a relatively narrow range.",
      confidence: clamp(80 - recentVariation, 0, 95),
      tone: "positive",
    });
  }

  /* ---------------------------------------------------------
     VOLATILITY
     --------------------------------------------------------- */

  if (recentVariation >= 60 && recent.length >= 3) {
    patterns.push({
      type: "volatile",
      icon: "⚡",
      title: "High Performance Volatility",
      description:
        "Recent output is fluctuating significantly between matches.",
      confidence: clamp(65 + recentVariation / 4, 0, 95),
      tone: "warning",
    });
  }

  /* ---------------------------------------------------------
     WINNING PATTERN
     --------------------------------------------------------- */

  const recentWins = recent.filter(
    (match) => match.result === "Won"
  ).length;

  if (recent.length >= 3 && recentWins >= 3) {
    patterns.push({
      type: "winningPattern",
      icon: "🏆",
      title: "Winning Pattern",
      description:
        "Recent results show repeated wins across the latest matches.",
      confidence: clamp(70 + recentWins * 5, 0, 95),
      tone: "positive",
    });
  }

  /* ---------------------------------------------------------
     LOSS PATTERN
     --------------------------------------------------------- */

  const recentLosses = recent.filter(
    (match) => match.result === "Lost"
  ).length;

  if (recent.length >= 3 && recentLosses >= 3) {
    patterns.push({
      type: "lossPattern",
      icon: "⚠️",
      title: "Repeated Loss Pattern",
      description:
        "Recent results contain several losses that may deserve review.",
      confidence: clamp(70 + recentLosses * 5, 0, 95),
      tone: "negative",
    });
  }

  /* ---------------------------------------------------------
     RECOVERY PATTERN
     --------------------------------------------------------- */

  if (chronological.length >= 4) {
    const lastFour = chronological.slice(-4);
    const scores = lastFour.map(getPerformanceScore);

    const wasLow =
      scores[0] < 50 || scores[1] < 50;

    const recovered =
      scores[2] > scores[0] &&
      scores[3] > scores[1];

    if (wasLow && recovered) {
      patterns.push({
        type: "recovery",
        icon: "🔄",
        title: "Recovery Pattern",
        description:
          "Your latest performances have recovered after a weaker period.",
        confidence: 82,
        tone: "positive",
      });
    }
  }

  /* ---------------------------------------------------------
     CRICKET PATTERNS
     --------------------------------------------------------- */

  if (selectedSport === "cricket") {
    const strikeRates = recent.map((match) => {
      const runs = safeNumber(match.runs);
      const balls = safeNumber(match.balls);

      return balls > 0 ? (runs / balls) * 100 : 0;
    });

    if (
      strikeRates.length >= 3 &&
      average(strikeRates) >= 120
    ) {
      patterns.push({
        type: "cricketTempo",
        icon: "🏏",
        title: "Strong Batting Tempo",
        description:
          "Recent matches show a strong scoring rate relative to balls faced.",
        confidence: clamp(
          70 + (average(strikeRates) - 120) / 2,
          0,
          95
        ),
        tone: "positive",
      });
    }

    const boundaryValues = recent.map(
      (match) =>
        safeNumber(match.fours) * 4 +
        safeNumber(match.sixes) * 6
    );

    const boundaryRate =
      recentOutputAverage > 0
        ? (average(boundaryValues) /
            recentOutputAverage) *
          100
        : 0;

    if (boundaryRate >= 45) {
      patterns.push({
        type: "boundaryImpact",
        icon: "💥",
        title: "Boundary-Driven Output",
        description:
          "A substantial portion of recent scoring comes from boundaries.",
        confidence: clamp(70 + boundaryRate / 5, 0, 95),
        tone: "positive",
      });
    }
  }

  /* ---------------------------------------------------------
     FOOTBALL PATTERNS
     --------------------------------------------------------- */

  if (selectedSport === "football") {
    const shotAccuracyValues = recent.map((match) => {
      const shots = safeNumber(match.shots);
      const target = safeNumber(match.shotsOnTarget);

      return shots > 0 ? (target / shots) * 100 : 0;
    });

    if (
      shotAccuracyValues.length >= 3 &&
      average(shotAccuracyValues) >= 55
    ) {
      patterns.push({
        type: "footballAccuracy",
        icon: "🎯",
        title: "Strong Shot Accuracy",
        description:
          "Recent matches show a high percentage of shots reaching the target.",
        confidence: clamp(
          70 + (average(shotAccuracyValues) - 55),
          0,
          95
        ),
        tone: "positive",
      });
    }

    const attackingValues = recent.map(
      (match) =>
        safeNumber(match.goals) +
        safeNumber(match.assists)
    );

    if (
      average(attackingValues) >= 2
    ) {
      patterns.push({
        type: "footballAttack",
        icon: "⚽",
        title: "Strong Attacking Contribution",
        description:
          "Recent matches show repeated goals and assists contributing to output.",
        confidence: 82,
        tone: "positive",
      });
    }
  }

  return patterns;
};

/* =========================================================
   STAGE 23
   CONTEXT & MATCH-UP PATTERN DETECTION ENGINE
   ========================================================= */

const detectContextPatterns = ({
  matches,
  selectedSport,
  getOutput,
  getPerformanceScore,
  opponentDifficultyData,
}) => {
  if (!matches || matches.length < 2) return [];

  const chronological = [...matches].sort(
    (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
  );

  const averageOutput = average(chronological.map(getOutput));
  const averageScore = average(chronological.map(getPerformanceScore));
  const opponentGroups = {};

  chronological.forEach((match) => {
    const opponent = match.opponent?.trim() || "Unknown";
    if (!opponentGroups[opponent]) opponentGroups[opponent] = [];
    opponentGroups[opponent].push(match);
  });

  const patterns = [];

  Object.entries(opponentGroups).forEach(([opponent, opponentMatches]) => {
    if (opponentMatches.length < 2) return;

    const outputs = opponentMatches.map(getOutput);
    const scores = opponentMatches.map(getPerformanceScore);
    const opponentAverageOutput = average(outputs);
    const opponentAverageScore = average(scores);
    const wins = opponentMatches.filter((m) => m.result === "Won").length;
    const losses = opponentMatches.filter((m) => m.result === "Lost").length;
    const winRate = (wins / opponentMatches.length) * 100;
    const outputGap = averageOutput > 0 ? ((opponentAverageOutput - averageOutput) / averageOutput) * 100 : 0;
    const scoreGap = opponentAverageScore - averageScore;
    const sampleConfidence = Math.min(100, 45 + opponentMatches.length * 12);

    if (scoreGap >= 8 && outputGap >= 5 && winRate >= 50) {
      patterns.push({ type:"strong-matchup", opponent, icon:"↗", title:`Strong against ${opponent}`, description:`Your average performance against ${opponent} is above your overall baseline, with a ${Math.round(winRate)}% win rate.`, evidence:`${opponentMatches.length} matches · ${Math.round(opponentAverageScore)}/100 average score`, confidence:Math.round(Math.min(95, sampleConfidence + scoreGap)), severity:scoreGap >= 15 ? "High" : "Moderate", tone:"positive", matches:opponentMatches.length, averageOutput:opponentAverageOutput, averageScore:opponentAverageScore, winRate });
    }

    if (scoreGap <= -8 && outputGap <= -5) {
      patterns.push({ type:"difficult-matchup", opponent, icon:"↘", title:`Pressure against ${opponent}`, description:`Your performance against ${opponent} is below your overall baseline.`, evidence:`${opponentMatches.length} matches · ${Math.round(opponentAverageScore)}/100 average score`, confidence:Math.round(Math.min(95, sampleConfidence + Math.abs(scoreGap))), severity:scoreGap <= -15 ? "High" : "Moderate", tone:"warning", matches:opponentMatches.length, averageOutput:opponentAverageOutput, averageScore:opponentAverageScore, winRate });
    }

    const variance = outputs.length > 1 ? average(outputs.map((v) => Math.pow(v - opponentAverageOutput, 2))) : 0;
    const variation = opponentAverageOutput > 0 ? (Math.sqrt(variance) / opponentAverageOutput) * 100 : 0;
    if (variation <= 20 && opponentMatches.length >= 3) {
      patterns.push({ type:"consistent-matchup", opponent, icon:"≋", title:`Consistent against ${opponent}`, description:`Your output against ${opponent} has remained relatively stable across repeated matches.`, evidence:`${opponentMatches.length} matches · ${Math.round(variation)}% output variation`, confidence:Math.round(Math.min(95, sampleConfidence + Math.max(0,20-variation))), severity:"Moderate", tone:"positive", matches:opponentMatches.length, averageOutput:opponentAverageOutput, averageScore:opponentAverageScore, winRate });
    }

    if (opponentMatches.length >= 3 && winRate >= 67) {
      patterns.push({ type:"win-pattern", opponent, icon:"W", title:`Repeated wins vs ${opponent}`, description:`You have won ${wins} of ${opponentMatches.length} recorded matches against ${opponent}.`, evidence:`${wins} wins · ${losses} losses · ${Math.round(winRate)}% win rate`, confidence:Math.round(Math.min(95, sampleConfidence + winRate - 50)), severity:winRate >= 80 ? "High" : "Moderate", tone:"positive", matches:opponentMatches.length, averageOutput:opponentAverageOutput, averageScore:opponentAverageScore, winRate });
    }

    if (opponentMatches.length >= 3 && winRate <= 33) {
      patterns.push({ type:"loss-pattern", opponent, icon:"L", title:`Repeated losses vs ${opponent}`, description:`You have lost ${losses} of ${opponentMatches.length} recorded matches against ${opponent}.`, evidence:`${wins} wins · ${losses} losses · ${Math.round(winRate)}% win rate`, confidence:Math.round(Math.min(95, sampleConfidence + 50 - winRate)), severity:winRate <= 20 ? "High" : "Moderate", tone:"warning", matches:opponentMatches.length, averageOutput:opponentAverageOutput, averageScore:opponentAverageScore, winRate });
    }
  });

  if (opponentDifficultyData?.length) {
    const difficult = opponentDifficultyData.filter((o) => o.difficultyScore >= 60);
    const manageable = opponentDifficultyData.filter((o) => o.difficultyScore < 45);
    const getDifficultyMatches = (min, max) => chronological.filter((m) => {
      const item = opponentDifficultyData.find((o) => o.opponent === (m.opponent || "Unknown"));
      return item && item.difficultyScore >= min && item.difficultyScore < max;
    });

    if (difficult.length) {
      const dm = getDifficultyMatches(60, Infinity);
      const ds = average(dm.map(getPerformanceScore));
      const dout = average(dm.map(getOutput));
      if (ds < averageScore - 5) {
        const gap = averageScore - ds;
        patterns.push({ type:"difficulty-gap", icon:"◈", title:"Performance drops against difficult opponents", description:`Your average performance score against higher-difficulty opponents is ${Math.round(gap)} points below your overall baseline.`, evidence:`${dm.length} difficult-opponent matches · ${Math.round(ds)}/100 average score`, confidence:Math.round(Math.min(95,60 + gap * 3)), severity:gap >= 15 ? "High" : "Moderate", tone:"warning", matches:dm.length, averageOutput:dout, averageScore:ds });
      }
    }

    if (difficult.length && manageable.length) {
      const dm = getDifficultyMatches(60, Infinity);
      const mm = getDifficultyMatches(0, 45);
      const difficultAverage = average(dm.map(getPerformanceScore));
      const manageableAverage = average(mm.map(getPerformanceScore));
      const gap = manageableAverage - difficultAverage;
      if (Math.abs(gap) >= 8) {
        patterns.push({ type:"context-gap", icon:"△", title:"Opponent difficulty changes your output", description:`Your average performance score changes by ${Math.round(Math.abs(gap))} points between manageable and difficult opponents.`, evidence:`Difficult: ${Math.round(difficultAverage)}/100 · Manageable: ${Math.round(manageableAverage)}/100`, confidence:Math.round(Math.min(95,55 + Math.abs(gap) * 2)), severity:Math.abs(gap) >= 15 ? "High" : "Moderate", tone:gap < 0 ? "warning" : "positive" });
      }
    }
  }

  const winMatches = chronological.filter((m) => m.result === "Won");
  const lossMatches = chronological.filter((m) => m.result === "Lost");
  if (winMatches.length && lossMatches.length) {
    const winAverage = average(winMatches.map(getPerformanceScore));
    const lossAverage = average(lossMatches.map(getPerformanceScore));
    if (winAverage >= lossAverage + 10) {
      patterns.push({ type:"performance-win-link", icon:"◎", title:"Higher performance aligns with wins", description:"Your winning matches generally contain stronger individual performance scores than your losses.", evidence:`Wins: ${Math.round(winAverage)}/100 · Losses: ${Math.round(lossAverage)}/100`, confidence:Math.round(Math.min(95,60 + (winAverage-lossAverage)*2)), severity:"Moderate", tone:"positive" });
    }
    if (lossAverage >= winAverage + 10) {
      patterns.push({ type:"performance-result-gap", icon:"!", title:"Results are not matching performance output", description:"Your recorded losses contain higher average performance scores than your wins.", evidence:`Wins: ${Math.round(winAverage)}/100 · Losses: ${Math.round(lossAverage)}/100`, confidence:Math.round(Math.min(95,60 + (lossAverage-winAverage)*2)), severity:"Moderate", tone:"warning" });
    }
  }

  return patterns.sort((a,b) => safeNumber(b.confidence) - safeNumber(a.confidence));
};


/* =========================================================
   STAGE 24
   ACTIONABLE PERFORMANCE RECOMMENDATION ENGINE
   ========================================================= */

const buildActionRecommendations = ({
  selectedSport,
  totalMatches,
  currentFormDirection,
  consistencyIndex,
  efficiencyIndex,
  developmentIndex,
  weakestArea,
  strongestArea,
  contextPatterns,
  strongestContextPattern,
  forecastConfidence,
  improvementPercentage,
  goals,
}) => {
  const recommendations = [];

  const add = (item) => {
    if (recommendations.some((existing) => existing.id === item.id)) return;
    recommendations.push(item);
  };

  if (currentFormDirection === "Falling") {
    add({
      id: "stabilize-form",
      priority: "High",
      tone: "warning",
      icon: "↘",
      title: "Stabilize recent form",
      action: "Focus the next training block on repeatable execution before increasing workload.",
      evidence: "Recent performance direction is falling.",
    });
  } else if (currentFormDirection === "Rising") {
    add({
      id: "protect-momentum",
      priority: "High",
      tone: "positive",
      icon: "↗",
      title: "Protect current momentum",
      action: "Keep the current successful routine consistent while gradually increasing challenge.",
      evidence: "Recent performance direction is rising.",
    });
  }

  if (weakestArea && weakestArea.value < 60) {
    add({
      id: "develop-weakest-area",
      priority: weakestArea.value < 45 ? "High" : "Medium",
      tone: "warning",
      icon: "△",
      title: `Develop ${weakestArea.label}`,
      action: `Use targeted practice to raise ${weakestArea.label.toLowerCase()} before adding complexity elsewhere.`,
      evidence: `${weakestArea.label}: ${Math.round(weakestArea.value)}/100.`,
    });
  }

  if (consistencyIndex < 60) {
    add({
      id: "improve-consistency",
      priority: "High",
      tone: "warning",
      icon: "≋",
      title: "Improve performance consistency",
      action: "Track the same core actions each match and reduce avoidable variation in execution.",
      evidence: `Consistency index: ${Math.round(consistencyIndex)}/100.`,
    });
  }

  if (efficiencyIndex < 60) {
    add({
      id: "improve-efficiency",
      priority: "Medium",
      tone: "warning",
      icon: "⚙",
      title: "Improve conversion efficiency",
      action: selectedSport === "cricket"
        ? "Prioritize scoring efficiency, strike rotation and boundary conversion in training."
        : "Prioritize shot selection, shot accuracy and final-third conversion in training.",
      evidence: `Efficiency index: ${Math.round(efficiencyIndex)}/100.`,
    });
  }

  const pressurePattern = contextPatterns.find(
    (pattern) => pattern.tone === "warning" && pattern.severity === "High"
  );

  if (pressurePattern) {
    add({
      id: "prepare-for-pressure",
      priority: "High",
      tone: "warning",
      icon: "◈",
      title: "Prepare for pressure matchups",
      action: `Create a specific preparation routine for ${pressurePattern.opponent ? pressurePattern.opponent : "difficult opponents"}.`,
      evidence: pressurePattern.title,
    });
  } else if (strongestContextPattern && strongestContextPattern.tone === "positive") {
    add({
      id: "repeat-success",
      priority: "Medium",
      tone: "positive",
      icon: "◎",
      title: "Repeat successful matchup behaviours",
      action: "Identify the preparation and execution choices behind your strongest context signal and reuse them.",
      evidence: strongestContextPattern.title,
    });
  }

  if (improvementPercentage <= -5) {
    add({
      id: "reverse-output-drop",
      priority: "High",
      tone: "warning",
      icon: "↓",
      title: "Reverse the output decline",
      action: "Review the recent matches individually and identify the first point where output started dropping.",
      evidence: `Recent output movement: ${Math.round(improvementPercentage)}%.`,
    });
  }

  if (forecastConfidence < 60 && totalMatches < 8) {
    add({
      id: "build-evidence",
      priority: "Medium",
      tone: "neutral",
      icon: "＋",
      title: "Build a stronger evidence base",
      action: "Record more matches across different opponents before relying heavily on forecast signals.",
      evidence: `${totalMatches} matches recorded · forecast confidence ${Math.round(forecastConfidence)}%.`,
    });
  }

  if (developmentIndex < 60) {
    add({
      id: "development-focus",
      priority: "Medium",
      tone: "neutral",
      icon: "↗",
      title: "Strengthen long-term development",
      action: "Set a small measurable improvement target for the next phase and review it after several matches.",
      evidence: `Development index: ${Math.round(developmentIndex)}/100.`,
    });
  }

  if (recommendations.length === 0) {
    add({
      id: "maintain-profile",
      priority: "Medium",
      tone: "positive",
      icon: "✓",
      title: "Maintain the current performance profile",
      action: "Keep the current routine stable and continue collecting match evidence before making major changes.",
      evidence: strongestArea
        ? `${strongestArea.label}: ${Math.round(strongestArea.value)}/100.`
        : "No major weakness detected.",
    });
  }

  return recommendations.slice(0, 5);
};



/* =========================================================
   STAGE 25
   PERFORMANCE READINESS & RISK ENGINE
   ========================================================= */

const buildReadinessAssessment = ({
  healthScore,
  currentFormScore,
  consistencyIndex,
  efficiencyIndex,
  developmentIndex,
  forecastConfidence,
  improvementPercentage,
  contextPatterns,
  opponentDifficultyData,
  actionRecommendations,
  totalMatches,
}) => {
  const signals = [];

  const addSignal = (signal) => {
    if (!signals.some((item) => item.id === signal.id)) {
      signals.push(signal);
    }
  };

  if (currentFormScore < 50) {
    addSignal({
      id: "low-form",
      tone: "warning",
      severity: "High",
      icon: "↘",
      title: "Recent form needs attention",
      description: "Current form is below the stable performance range.",
      evidence: `Current form: ${Math.round(currentFormScore)}/100.`,
    });
  } else if (currentFormScore >= 75) {
    addSignal({
      id: "strong-form",
      tone: "positive",
      severity: "Low",
      icon: "↗",
      title: "Recent form is strong",
      description: "Recent performances indicate a stable platform for continued progression.",
      evidence: `Current form: ${Math.round(currentFormScore)}/100.`,
    });
  }

  if (consistencyIndex < 55) {
    addSignal({
      id: "consistency-risk",
      tone: "warning",
      severity: "High",
      icon: "≋",
      title: "Consistency is a readiness risk",
      description: "Performance variation may make outcomes less predictable from match to match.",
      evidence: `Consistency: ${Math.round(consistencyIndex)}/100.`,
    });
  }

  if (efficiencyIndex < 55) {
    addSignal({
      id: "efficiency-risk",
      tone: "warning",
      severity: "Moderate",
      icon: "⚙",
      title: "Efficiency limits readiness",
      description: "The current profile suggests room to improve conversion of actions into useful output.",
      evidence: `Efficiency: ${Math.round(efficiencyIndex)}/100.`,
    });
  }

  if (developmentIndex < 55) {
    addSignal({
      id: "development-risk",
      tone: "warning",
      severity: "Moderate",
      icon: "△",
      title: "Long-term development needs focus",
      description: "Recent progress has not yet established a strong development trajectory.",
      evidence: `Development index: ${Math.round(developmentIndex)}/100.`,
    });
  }

  if (improvementPercentage <= -8) {
    addSignal({
      id: "declining-output",
      tone: "warning",
      severity: "High",
      icon: "↓",
      title: "Output trend is declining",
      description: "Recent output is materially below the comparison baseline.",
      evidence: `Recent movement: ${Math.round(improvementPercentage)}%.`,
    });
  } else if (improvementPercentage >= 8) {
    addSignal({
      id: "improving-output",
      tone: "positive",
      severity: "Low",
      icon: "↑",
      title: "Output trend is improving",
      description: "Recent output is materially above the comparison baseline.",
      evidence: `Recent movement: +${Math.round(improvementPercentage)}%.`,
    });
  }

  const highPressurePatterns = contextPatterns.filter(
    (pattern) =>
      pattern.tone === "warning" &&
      pattern.severity === "High"
  );

  if (highPressurePatterns.length > 0) {
    addSignal({
      id: "context-pressure",
      tone: "warning",
      severity: "High",
      icon: "◈",
      title: "Matchup pressure is present",
      description: "Repeated contextual signals show that some opponent environments currently reduce performance.",
      evidence: `${highPressurePatterns.length} high-severity context signal${highPressurePatterns.length === 1 ? "" : "s"}.`,
    });
  }

  const difficultOpponents = opponentDifficultyData.filter(
    (item) => item.difficultyScore >= 60
  );

  if (difficultOpponents.length > 0 && totalMatches >= 3) {
    addSignal({
      id: "difficulty-load",
      tone: "neutral",
      severity: "Moderate",
      icon: "◇",
      title: "Schedule difficulty is meaningful",
      description: "The profile includes repeated matches against higher-difficulty opponents.",
      evidence: `${difficultOpponents.length} difficult opponent${difficultOpponents.length === 1 ? "" : "s"} tracked.`,
    });
  }

  if (forecastConfidence < 55 && totalMatches < 8) {
    addSignal({
      id: "limited-evidence",
      tone: "neutral",
      severity: "Moderate",
      icon: "＋",
      title: "Evidence depth is still developing",
      description: "Readiness should be interpreted cautiously until more matches establish a larger evidence base.",
      evidence: `${totalMatches} matches · ${Math.round(forecastConfidence)}% forecast confidence.`,
    });
  }

  const highPriorityActions = actionRecommendations.filter(
    (recommendation) => recommendation.priority === "High"
  ).length;

  if (highPriorityActions >= 2) {
    addSignal({
      id: "action-load",
      tone: "warning",
      severity: "Moderate",
      icon: "!",
      title: "Several priority actions are active",
      description: "Multiple high-priority signals suggest focusing on a small number of fundamentals rather than adding complexity.",
      evidence: `${highPriorityActions} high-priority actions currently active.`,
    });
  }

  const warningCount = signals.filter(
    (signal) => signal.tone === "warning"
  ).length;

  const positiveCount = signals.filter(
    (signal) => signal.tone === "positive"
  ).length;

  const highSeverityCount = signals.filter(
    (signal) => signal.severity === "High"
  ).length;

  const readinessScore = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        healthScore * 0.30 +
          currentFormScore * 0.25 +
          consistencyIndex * 0.15 +
          efficiencyIndex * 0.10 +
          developmentIndex * 0.10 +
          forecastConfidence * 0.10 -
          highSeverityCount * 5
      )
    )
  );

  const readinessLabel =
    readinessScore >= 80
      ? "Ready to perform"
      : readinessScore >= 65
      ? "Stable readiness"
      : readinessScore >= 50
      ? "Developing readiness"
      : "Needs preparation";

  const readinessTone =
    readinessScore >= 80
      ? "positive"
      : readinessScore >= 65
      ? "positive"
      : readinessScore >= 50
      ? "neutral"
      : "warning";

  const primaryRisk =
    signals.find((signal) => signal.severity === "High" && signal.tone === "warning") ||
    signals.find((signal) => signal.tone === "warning") ||
    null;

  const readinessEvidence = [
    `Health ${Math.round(healthScore)}`,
    `Form ${Math.round(currentFormScore)}`,
    `Consistency ${Math.round(consistencyIndex)}`,
    `Efficiency ${Math.round(efficiencyIndex)}`,
  ];

  return {
    signals: signals.slice(0, 6),
    readinessScore,
    readinessLabel,
    readinessTone,
    warningCount,
    positiveCount,
    highSeverityCount,
    primaryRisk,
    readinessEvidence,
  };
};



/* =========================================================
   STAGE 26
   NEXT-MATCH SCENARIO PLANNING ENGINE
   ========================================================= */

const buildScenarioPlanning = ({
  selectedSport,
  readinessAssessment,
  currentFormScore,
  healthScore,
  consistencyIndex,
  efficiencyIndex,
  developmentIndex,
  forecastConfidence,
  opponentDifficultyData,
  contextPatterns,
  getOutput,
  getPerformanceScore,
  sportMatches,
}) => {
  const trackedOpponents = opponentDifficultyData || [];
  const defaultOpponent = trackedOpponents.length > 0
    ? [...trackedOpponents].sort((a, b) => safeNumber(b.matches) - safeNumber(a.matches))[0]
    : null;

  const opponent = defaultOpponent;
  const difficultyScore = opponent ? safeNumber(opponent.difficultyScore) : 50;
  const opponentWinRate = opponent ? safeNumber(opponent.winRate) : 50;

  const pressurePatterns = (contextPatterns || []).filter(
    (pattern) =>
      pattern.tone === "warning" &&
      (pattern.opponent === (opponent?.opponent || "") || !pattern.opponent)
  );

  const contextPenalty = Math.min(15, pressurePatterns.length * 4);
  const difficultyPenalty = Math.max(-8, Math.min(12, (difficultyScore - 50) * 0.12));

  const baseScore = clamp(
    currentFormScore * 0.35 +
      healthScore * 0.25 +
      consistencyIndex * 0.15 +
      efficiencyIndex * 0.10 +
      developmentIndex * 0.05 +
      forecastConfidence * 0.10
  );

  const scenarios = [
    {
      id: "baseline",
      tone: "neutral",
      icon: "◎",
      label: "Baseline day",
      score: clamp(Math.round(baseScore - difficultyPenalty - contextPenalty * 0.5)),
      description: "Expected performance if your current form and preparation profile continue into the next match.",
    },
    {
      id: "strong",
      tone: "positive",
      icon: "↗",
      label: "Strong execution",
      score: clamp(Math.round(baseScore + 8 - difficultyPenalty * 0.35)),
      description: "A higher-output scenario where your strongest current behaviours are converted efficiently.",
    },
    {
      id: "pressure",
      tone: "warning",
      icon: "↘",
      label: "Pressure day",
      score: clamp(Math.round(baseScore - 10 - difficultyPenalty - contextPenalty)),
      description: "A pressure scenario reflecting lower consistency, opponent difficulty or known matchup friction.",
    },
  ];

  const outputMatches = (sportMatches || []).slice(-5);
  const averageOutput = outputMatches.length > 0
    ? average(outputMatches.map(getOutput))
    : 0;
  const averageScore = outputMatches.length > 0
    ? average(outputMatches.map(getPerformanceScore))
    : baseScore;

  const outputMultiplier = averageScore > 0 ? baseScore / averageScore : 1;

  const planningOutput = scenarios.map((scenario) => ({
    ...scenario,
    estimatedOutput: averageOutput > 0
      ? Math.round(averageOutput * (scenario.score / Math.max(baseScore, 1)) * outputMultiplier)
      : 0,
  }));

  const planningConfidence = Math.round(
    clamp(
      forecastConfidence * 0.55 +
      readinessAssessment.readinessScore * 0.25 +
      Math.min(100, sportMatches.length * 8) * 0.20
    )
  );

  const planningLabel =
    planningConfidence >= 75
      ? "High evidence"
      : planningConfidence >= 55
      ? "Usable evidence"
      : "Early evidence";

  const opponentLabel = opponent
    ? opponent.opponent
    : "General scenario";

  return {
    scenarios: planningOutput,
    planningConfidence,
    planningLabel,
    opponentLabel,
    difficultyScore,
    opponentWinRate,
    pressurePatterns,
    baseScore: Math.round(baseScore),
    averageOutput: Math.round(averageOutput),
    selectedSport,
  };
};


/* =========================================================
   STAGE 27
   POST-MATCH REVIEW & LEARNING ENGINE
   ========================================================= */

const buildPostMatchReview = ({
  selectedSport,
  sportMatches,
  chronologicalMatches,
  getOutput,
  getPerformanceScore,
  averageOutput,
  averageScore,
  consistencyIndex,
  efficiencyIndex,
  winRate,
  improvementPercentage,
  readinessAssessment,
  scenarioPlanning,
}) => {
  const latestMatch = chronologicalMatches[chronologicalMatches.length - 1] || null;

  if (!latestMatch) {
    return {
      available: false,
      opponent: "No opponent",
      result: "No result",
      output: 0,
      score: 0,
      outputGap: 0,
      scoreGap: 0,
      resultImpact: "Monitoring",
      positives: [],
      focusAreas: [],
      lesson: "Record a match to activate post-match learning.",
      nextPriority: "Build an evidence baseline.",
      reviewConfidence: 0,
    };
  }

  const output = safeNumber(getOutput(latestMatch));
  const score = safeNumber(getPerformanceScore(latestMatch));
  const outputGap = averageOutput > 0
    ? round(((output - averageOutput) / averageOutput) * 100, 1)
    : 0;
  const scoreGap = round(score - averageScore, 1);

  const positives = [];
  const focusAreas = [];

  if (score >= averageScore + 5) {
    positives.push("Performance score finished above your current baseline.");
  }
  if (outputGap >= 5) {
    positives.push("Match output was above the long-term output baseline.");
  }
  if (latestMatch.result === "Won") {
    positives.push("The latest result converted the performance into a win.");
  }
  if (consistencyIndex >= 70) {
    positives.push("Your overall output profile remains relatively stable.");
  }
  if (efficiencyIndex >= 70) {
    positives.push("Efficiency remains a strong part of the current profile.");
  }

  if (score < averageScore - 5) {
    focusAreas.push("Review the behaviours that lowered the latest performance score.");
  }
  if (outputGap <= -5) {
    focusAreas.push("Identify why latest-match output fell below the normal baseline.");
  }
  if (latestMatch.result === "Lost") {
    focusAreas.push("Separate the result from the underlying performance signals before changing the plan.");
  }
  if (consistencyIndex < 60) {
    focusAreas.push("Prioritise repeatable execution before adding more performance volume.");
  }
  if (efficiencyIndex < 60) {
    focusAreas.push("Improve conversion of opportunities into measurable output.");
  }

  if (!positives.length) {
    positives.push("The latest match is still useful evidence for the learning baseline.");
  }
  if (!focusAreas.length) {
    focusAreas.push("Maintain the current process and monitor the next match for confirmation.");
  }

  const resultImpact =
    latestMatch.result === "Won"
      ? "Positive result"
      : latestMatch.result === "Lost"
      ? "Result pressure"
      : "Neutral result";

  const lesson =
    scoreGap >= 5 && outputGap >= 5
      ? "The latest match supports the current performance direction: output and quality moved together."
      : scoreGap >= 5
      ? "Performance quality improved even though output did not move by the same amount."
      : outputGap >= 5
      ? "Output improved, so review whether the extra production was also efficient and repeatable."
      : scoreGap <= -5 && outputGap <= -5
      ? "Both performance quality and output were below baseline, making preparation and execution the main review areas."
      : "The latest match is close to baseline, so more evidence is needed before changing the performance plan.";

  const nextPriority =
    readinessAssessment.primaryRisk?.title
      ? `Address the readiness risk: ${readinessAssessment.primaryRisk.title}.`
      : scenarioPlanning?.scenarios?.length
      ? `Prepare for the pressure gap between ${scenarioPlanning.scenarios[0].label.toLowerCase()} and ${scenarioPlanning.scenarios[2].label.toLowerCase()}.`
      : improvementPercentage < -5
      ? "Stabilise the recent decline before adding new targets."
      : "Repeat the behaviours that produced the latest useful signals.";

  const evidenceDepth = Math.min(100, sportMatches.length * 8);
  const reviewConfidence = Math.round(
    clamp(
      evidenceDepth * 0.45 +
        readinessAssessment.readinessScore * 0.25 +
        Math.min(100, Math.abs(scoreGap) * 5 + 40) * 0.30
    )
  );

  return {
    available: true,
    sport: selectedSport,
    opponent: latestMatch.opponent || "Unknown opponent",
    date: latestMatch.date,
    result: latestMatch.result || "Unknown",
    resultImpact,
    output,
    score,
    outputGap,
    scoreGap,
    positives: positives.slice(0, 3),
    focusAreas: focusAreas.slice(0, 3),
    lesson,
    nextPriority,
    reviewConfidence,
  };
};



/* =========================================================
   STAGE 28
   PREPARATION & TRAINING FOCUS ENGINE
   ========================================================= */

const buildPreparationPlan = ({
  selectedSport,
  currentFormScore,
  consistencyIndex,
  efficiencyIndex,
  developmentIndex,
  improvementPercentage,
  readinessAssessment,
  postMatchReview,
  actionRecommendations,
  scenarioPlanning,
}) => {
  const focusItems = [];

  if (efficiencyIndex < 60) {
    focusItems.push({
      priority: "High",
      title: "Conversion efficiency",
      detail:
        selectedSport === "cricket"
          ? "Work on converting scoring opportunities into controlled runs without unnecessary risk."
          : "Work on turning attacking opportunities into accurate, efficient actions.",
      reason: `Efficiency is currently ${Math.round(efficiencyIndex)}/100.`,
      tone: "warning",
    });
  }

  if (consistencyIndex < 60) {
    focusItems.push({
      priority: "High",
      title: "Repeatable execution",
      detail:
        "Prioritise a repeatable process before adding more volume or complexity to the next session.",
      reason: `Consistency is currently ${Math.round(consistencyIndex)}/100.`,
      tone: "warning",
    });
  }

  if (developmentIndex < 65) {
    focusItems.push({
      priority: "Medium",
      title: "Development priority",
      detail:
        `Use the weakest current development area as the main technical focus for the next training block.`,
      reason: `Development index is ${Math.round(developmentIndex)}/100.`,
      tone: "neutral",
    });
  }

  if (improvementPercentage < -5) {
    focusItems.push({
      priority: "High",
      title: "Stabilise the decline",
      detail:
        "Reduce unnecessary changes and rebuild the behaviours that supported earlier performance levels.",
      reason: `Recent output movement is ${Math.round(improvementPercentage)}% versus the earlier baseline.`,
      tone: "warning",
    });
  }

  if (currentFormScore >= 75 && consistencyIndex >= 65) {
    focusItems.push({
      priority: "Medium",
      title: "Protect current form",
      detail:
        "Keep the strongest existing behaviours intact while making only targeted adjustments.",
      reason: `Current form is ${Math.round(currentFormScore)}/100 with stable supporting evidence.`,
      tone: "positive",
    });
  }

  if (!focusItems.length) {
    focusItems.push({
      priority: "Medium",
      title: "Evidence-building session",
      detail:
        "Use the next session to reinforce your current process and collect another clean performance sample.",
      reason: "No major preparation weakness is currently dominant.",
      tone: "neutral",
    });
  }

  const riskTitle = readinessAssessment?.primaryRisk?.title || "No major readiness risk";
  const scenarioGap = scenarioPlanning?.scenarios?.length >= 3
    ? Math.max(
        0,
        Math.round(
          scenarioPlanning.scenarios[0].score -
          scenarioPlanning.scenarios[2].score
        )
      )
    : 0;

  const sessionIntensity =
    readinessAssessment.readinessScore < 50 || improvementPercentage < -5
      ? "Controlled"
      : readinessAssessment.readinessScore >= 75 && currentFormScore >= 70
      ? "Progressive"
      : "Moderate";

  const matchdayCue =
    scenarioGap >= 15
      ? "Keep the first phase simple and protect against the pressure scenario before increasing intensity."
      : riskTitle !== "No major readiness risk"
      ? `Before the match, address the main readiness signal: ${riskTitle}.`
      : postMatchReview?.nextPriority ||
        "Repeat the behaviours that produced the strongest recent evidence.";

  const primaryFocus = focusItems[0];
  const secondaryFocus = focusItems[1] || null;

  const preparationConfidence = Math.round(
    clamp(
      readinessAssessment.readinessScore * 0.35 +
        Math.max(0, currentFormScore) * 0.20 +
        Math.max(0, consistencyIndex) * 0.15 +
        Math.max(0, efficiencyIndex) * 0.15 +
        Math.min(100, actionRecommendations.length * 20) * 0.05 +
        Math.min(100, scenarioPlanning?.planningConfidence || 0) * 0.10
    )
  );

  return {
    sessionIntensity,
    primaryFocus,
    secondaryFocus,
    focusItems: focusItems.slice(0, 3),
    riskTitle,
    scenarioGap,
    matchdayCue,
    preparationConfidence,
  };
};


/* =========================================================
   STAGE 29
   FRONTEND STABILITY & ANALYTICS VALIDATION ENGINE
   ========================================================= */

const buildAnalyticsStabilityReport = ({
  matches,
  sportMatches,
  selectedSport,
  getOutput,
  getPerformanceScore,
  readinessAssessment,
  scenarioPlanning,
  postMatchReview,
  preparationPlan,
}) => {
  const sourceMatches = Array.isArray(matches) ? matches : [];
  const activeMatches = Array.isArray(sportMatches) ? sportMatches : [];

  const validMatchIds = sourceMatches.filter(
    (match) => match && (match._id || match.id)
  ).length;

  const validDates = activeMatches.filter(
    (match) => match && !Number.isNaN(new Date(match.date).getTime())
  ).length;

  const finiteOutputs = activeMatches.filter(
    (match) => Number.isFinite(Number(getOutput(match)))
  ).length;

  const finiteScores = activeMatches.filter(
    (match) => Number.isFinite(Number(getPerformanceScore(match)))
  ).length;

  const resultValues = new Set(["Won", "Lost", "Draw"]);
  const validResults = activeMatches.filter(
    (match) => resultValues.has(match?.result)
  ).length;

  const dataIntegrity =
    sourceMatches.length === 0
      ? "Waiting for match data"
      : validMatchIds === sourceMatches.length &&
        validDates === activeMatches.length &&
        finiteOutputs === activeMatches.length &&
        finiteScores === activeMatches.length
      ? "Healthy"
      : "Review data";

  const engineChecks = [
    {
      key: "data",
      label: "Match data",
      status: dataIntegrity,
      detail:
        activeMatches.length > 0
          ? `${activeMatches.length} ${selectedSport} ${activeMatches.length === 1 ? "match" : "matches"} available to the analytics engine.`
          : `No ${selectedSport} matches are currently available.`,
    },
    {
      key: "scores",
      label: "Score engine",
      status:
        finiteScores === activeMatches.length ? "Healthy" : "Review data",
      detail:
        activeMatches.length > 0
          ? `${finiteScores}/${activeMatches.length} performance scores are numeric.`
          : "Waiting for enough match data.",
    },
    {
      key: "outputs",
      label: "Output engine",
      status:
        finiteOutputs === activeMatches.length ? "Healthy" : "Review data",
      detail:
        activeMatches.length > 0
          ? `${finiteOutputs}/${activeMatches.length} outputs are numeric.`
          : "Waiting for enough match data.",
    },
    {
      key: "context",
      label: "Match context",
      status:
        validResults === activeMatches.length ? "Healthy" : "Review data",
      detail:
        activeMatches.length > 0
          ? `${validResults}/${activeMatches.length} matches have a valid result label.`
          : "Waiting for match results.",
    },
    {
      key: "readiness",
      label: "Readiness engine",
      status:
        readinessAssessment &&
        Number.isFinite(Number(readinessAssessment.readinessScore))
          ? "Healthy"
          : "Review engine",
      detail: "Readiness and risk calculations are available.",
    },
    {
      key: "scenario",
      label: "Scenario engine",
      status:
        scenarioPlanning &&
        Array.isArray(scenarioPlanning.scenarios)
          ? "Healthy"
          : "Review engine",
      detail: "Baseline, strong-execution and pressure scenarios are available.",
    },
    {
      key: "review",
      label: "Post-match review",
      status:
        postMatchReview ? "Healthy" : "Review engine",
      detail: "Latest-match learning signals are available.",
    },
    {
      key: "preparation",
      label: "Preparation plan",
      status:
        preparationPlan &&
        Array.isArray(preparationPlan.focusItems)
          ? "Healthy"
          : "Review engine",
      detail: "Training focus and preparation signals are available.",
    },
  ];

  const healthyCount = engineChecks.filter(
    (check) => check.status === "Healthy"
  ).length;

  const reviewCount = engineChecks.length - healthyCount;

  const stabilityScore = Math.round(
    (healthyCount / Math.max(engineChecks.length, 1)) * 100
  );

  const stabilityLabel =
    stabilityScore >= 90
      ? "Stable"
      : stabilityScore >= 70
      ? "Mostly stable"
      : "Needs review";

  const recommendations = [];

  if (activeMatches.length < 3) {
    recommendations.push(
      "Record more matches to strengthen trend, pattern and forecasting evidence."
    );
  }

  if (validDates < activeMatches.length) {
    recommendations.push(
      "Review match dates so chronological analytics can use the full history."
    );
  }

  if (validResults < activeMatches.length) {
    recommendations.push(
      "Review result values so win-rate and outcome context remain reliable."
    );
  }

  if (healthyCount === engineChecks.length && recommendations.length === 0) {
    recommendations.push(
      "No stability issues detected. Continue recording consistent match data."
    );
  }

  return {
    engineChecks,
    healthyCount,
    reviewCount,
    stabilityScore,
    stabilityLabel,
    recommendations,
    activeMatches: activeMatches.length,
    validDates,
    validResults,
  };
};

function Analytics() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [selectedSport, setSelectedSport] = useState("cricket");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [comparisonA, setComparisonA] = useState("");
  const [comparisonB, setComparisonB] = useState("");


  /* =========================================================
     FETCH
     ========================================================= */

  const fetchMatches = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await apiGet("/matches");

      const safeData = Array.isArray(data) ? data : [];

      setMatches(safeData);

      if (safeData.length >= 2) {
        setComparisonA((current) =>
          safeData.some((match) => match._id === current)
            ? current
            : safeData[0]._id
        );

        setComparisonB((current) =>
          safeData.some((match) => match._id === current)
            ? current
            : safeData[1]._id
        );
      } else {
        setComparisonA("");
        setComparisonB("");
      }
    } catch (fetchError) {
      console.error("Analytics API error:", fetchError);

      if (fetchError?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        fetchError?.message ||
          "Unable to load analytics data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    const refreshMatches = () => {
      fetchMatches(true);
    };

    window.addEventListener(
      "matchesUpdated",
      refreshMatches
    );

    return () => {
      window.removeEventListener(
        "matchesUpdated",
        refreshMatches
      );
    };
  }, []);

  /* =========================================================
     SPORT
     ========================================================= */

  const sportMatches = useMemo(() => {
    return matches.filter(
      (match) =>
        (match.sport || "cricket") === selectedSport
    );
  }, [matches, selectedSport]);

  /* =========================================================
     OUTPUT
     ========================================================= */

  const getOutput = (match) => {
    if (selectedSport === "football") {
      return (
        safeNumber(match.goals) +
        safeNumber(match.assists)
      );
    }

    return safeNumber(match.runs);
  };

  /* =========================================================
     PERFORMANCE SCORE
     ========================================================= */

  const getPerformanceScore = (match) => {
    if (selectedSport === "football") {
      const goals = safeNumber(match.goals);
      const assists = safeNumber(match.assists);
      const shots = safeNumber(match.shots);
      const shotsOnTarget = safeNumber(
        match.shotsOnTarget
      );
      const passAccuracy = clamp(
        match.passAccuracy
      );

      const shotAccuracy =
        shots > 0
          ? (shotsOnTarget / shots) * 100
          : 0;

      const attackingScore = Math.min(
        100,
        (goals + assists) * 20
      );

      return Math.round(
        attackingScore * 0.4 +
          clamp(shotAccuracy) * 0.3 +
          passAccuracy * 0.3
      );
    }

    const runs = safeNumber(match.runs);
    const balls = safeNumber(match.balls);
    const fours = safeNumber(match.fours);
    const sixes = safeNumber(match.sixes);
    const wickets = safeNumber(match.wickets);

    const strikeRate =
      balls > 0 ? (runs / balls) * 100 : 0;

    const boundaryRuns =
      fours * 4 + sixes * 6;

    const boundaryContribution =
      runs > 0
        ? Math.min(
            100,
            (boundaryRuns / runs) * 100
          )
        : 0;

    const scoringScore =
      Math.min(100, runs * 2);

    const wicketScore =
      Math.min(100, wickets * 20);

    return Math.round(
      scoringScore * 0.4 +
        Math.min(100, strikeRate) * 0.25 +
        boundaryContribution * 0.15 +
        wicketScore * 0.2
    );
  };

  /* =========================================================
     BASIC METRICS
     ========================================================= */

  const totalMatches = sportMatches.length;

  const wins = sportMatches.filter(
    (match) => match.result === "Won"
  ).length;

  const losses = sportMatches.filter(
    (match) => match.result === "Lost"
  ).length;

  const draws = sportMatches.filter(
    (match) => match.result === "Draw"
  ).length;

  const winRate =
    totalMatches > 0
      ? (wins / totalMatches) * 100
      : 0;

  const totalOutput = sportMatches.reduce(
    (sum, match) =>
      sum + getOutput(match),
    0
  );

  const averageOutput =
    totalMatches > 0
      ? totalOutput / totalMatches
      : 0;

  const scores = sportMatches.map(
    getPerformanceScore
  );

  const averageScore =
    scores.length > 0
      ? average(scores)
      : 0;

  const bestScore =
    scores.length > 0
      ? Math.max(...scores)
      : 0;

  /* =========================================================
     TREND
     ========================================================= */

  const chronologicalMatches = useMemo(
    () =>
      [...sportMatches].sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      ),
    [sportMatches]
  );

  const trendData = chronologicalMatches.map(
    (match, index) => ({
      match: index + 1,
      output: getOutput(match),
      score: getPerformanceScore(match),
      opponent: match.opponent || "Unknown",
    })
  );

  /* =========================================================
     CONSISTENCY
     ========================================================= */

  const outputValues = sportMatches.map(
    getOutput
  );

  const outputMean = average(outputValues);

  const variance =
    outputValues.length > 0
      ? average(
          outputValues.map((value) =>
            Math.pow(
              value - outputMean,
              2
            )
          )
        )
      : 0;

  const standardDeviation =
    Math.sqrt(variance);

  const variationPercentage =
    outputMean > 0
      ? (standardDeviation /
          outputMean) *
        100
      : 0;

  const consistencyIndex = Math.round(
    clamp(100 - variationPercentage)
  );

  const consistencyLabel =
    consistencyIndex >= 80
      ? "Very consistent"
      : consistencyIndex >= 60
      ? "Consistent"
      : consistencyIndex >= 40
      ? "Developing"
      : "Needs improvement";

  /* =========================================================
     EFFICIENCY
     ========================================================= */

  let efficiencyIndex = 0;
  let strikeRate = 0;
  let boundaryContribution = 0;
  let shotAccuracy = 0;
  let shotConversion = 0;
  let attackingContribution = 0;

  if (selectedSport === "cricket") {
    const totalRuns = sportMatches.reduce(
      (sum, match) =>
        sum + safeNumber(match.runs),
      0
    );

    const totalBalls = sportMatches.reduce(
      (sum, match) =>
        sum + safeNumber(match.balls),
      0
    );

    const totalFours = sportMatches.reduce(
      (sum, match) =>
        sum + safeNumber(match.fours),
      0
    );

    const totalSixes = sportMatches.reduce(
      (sum, match) =>
        sum + safeNumber(match.sixes),
      0
    );

    strikeRate =
      totalBalls > 0
        ? (totalRuns / totalBalls) * 100
        : 0;

    const boundaryRuns =
      totalFours * 4 +
      totalSixes * 6;

    boundaryContribution =
      totalRuns > 0
        ? Math.min(
            100,
            (boundaryRuns /
              totalRuns) *
              100
          )
        : 0;

    efficiencyIndex = Math.round(
      Math.min(100, strikeRate) *
        0.7 +
        boundaryContribution * 0.3
    );
  } else {
    const totalGoals = sportMatches.reduce(
      (sum, match) =>
        sum + safeNumber(match.goals),
      0
    );

    const totalAssists = sportMatches.reduce(
      (sum, match) =>
        sum + safeNumber(match.assists),
      0
    );

    const totalShots = sportMatches.reduce(
      (sum, match) =>
        sum + safeNumber(match.shots),
      0
    );

    const totalShotsOnTarget =
      sportMatches.reduce(
        (sum, match) =>
          sum +
          safeNumber(
            match.shotsOnTarget
          ),
        0
      );

    shotConversion =
      totalShots > 0
        ? (totalGoals /
            totalShots) *
          100
        : 0;

    shotAccuracy =
      totalShots > 0
        ? (totalShotsOnTarget /
            totalShots) *
          100
        : 0;

    attackingContribution =
      totalGoals +
      totalAssists;

    efficiencyIndex = Math.round(
      Math.min(
        100,
        shotConversion
      ) *
        0.4 +
        Math.min(
          100,
          shotAccuracy
        ) *
          0.4 +
        Math.min(
          100,
          attackingContribution * 10
        ) *
          0.2
    );
  }

  /* =========================================================
     OPPONENT INTELLIGENCE
     ========================================================= */

  const opponentData = useMemo(() => {
    const grouped = {};

    sportMatches.forEach((match) => {
      const opponent =
        match.opponent || "Unknown";

      if (!grouped[opponent]) {
        grouped[opponent] = {
          opponent,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          output: 0,
          performanceTotal: 0,
        };
      }

      grouped[opponent].matches += 1;
      grouped[opponent].output +=
        getOutput(match);

      grouped[opponent].performanceTotal +=
        getPerformanceScore(match);

      if (match.result === "Won")
        grouped[opponent].wins += 1;

      if (match.result === "Lost")
        grouped[opponent].losses += 1;

      if (match.result === "Draw")
        grouped[opponent].draws += 1;
    });

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        averageOutput:
          item.matches > 0
            ? item.output /
              item.matches
            : 0,
        averagePerformance:
          item.matches > 0
            ? item.performanceTotal /
              item.matches
            : 0,
        winRate:
          item.matches > 0
            ? (item.wins /
                item.matches) *
              100
            : 0,
      }))
      .sort(
        (a, b) =>
          b.averageOutput -
          a.averageOutput
      );
  }, [sportMatches, selectedSport]);

  /* =========================================================
     DIFFICULTY
     ========================================================= */

  const opponentDifficultyData =
    useMemo(() => {
      if (!opponentData.length)
        return [];

      const maxMatches = Math.max(
        ...opponentData.map(
          (item) => item.matches
        ),
        1
      );

      return opponentData
        .map((item) => {
          const lossRate =
            item.matches > 0
              ? (item.losses /
                  item.matches) *
                100
              : 0;

          const experienceFactor =
            Math.min(
              100,
              (item.matches /
                maxMatches) *
                100
            );

          const difficultyScore =
            Math.round(
              Math.min(
                100,
                lossRate * 0.45 +
                  (100 -
                    item.winRate) *
                    0.35 +
                  experienceFactor *
                    0.2
              )
            );

          const difficultyLabel =
            difficultyScore >= 70
              ? "Difficult"
              : difficultyScore >=
                45
              ? "Moderate"
              : "Manageable";

          const adjustedPerformance =
            Math.round(
              Math.min(
                100,
                item.averagePerformance *
                  (1 +
                    difficultyScore /
                      200)
              )
            );

          return {
            ...item,
            lossRate,
            experienceFactor,
            difficultyScore,
            difficultyLabel,
            adjustedPerformance,
          };
        })
        .sort(
          (a, b) =>
            b.difficultyScore -
            a.difficultyScore
        );
    }, [opponentData]);

  const averageDifficulty =
    average(
      opponentDifficultyData.map(
        (item) =>
          item.difficultyScore
      )
    );

  const difficultOpponents =
    opponentDifficultyData.filter(
      (item) =>
        item.difficultyScore >= 70
    );

  const moderateOpponents =
    opponentDifficultyData.filter(
      (item) =>
        item.difficultyScore >= 45 &&
        item.difficultyScore < 70
    );

  const manageableOpponents =
    opponentDifficultyData.filter(
      (item) =>
        item.difficultyScore < 45
    );

  const mostDifficultOpponent =
    opponentDifficultyData[0] ||
    null;

  const difficultyChartData =
    opponentDifficultyData.map(
      (item) => ({
        opponent: item.opponent,
        difficulty:
          item.difficultyScore,
        performance:
          item.averagePerformance,
      })
    );

  /* =========================================================
     FORM
     ========================================================= */

  const recentMatches =
    chronologicalMatches.slice(-5);

  const recentAverage = average(
    recentMatches.map(getOutput)
  );

  const previousMatches =
    chronologicalMatches.slice(
      0,
      Math.max(
        0,
        chronologicalMatches.length - 5
      )
    );

  const previousAverage =
    average(
      previousMatches.map(getOutput)
    );

  const improvementPercentage =
    previousAverage > 0
      ? ((recentAverage -
          previousAverage) /
          previousAverage) *
        100
      : 0;

  const improvementLabel =
    improvementPercentage >= 10
      ? "Strong improvement"
      : improvementPercentage >= 3
      ? "Improving"
      : improvementPercentage <= -10
      ? "Declining"
      : improvementPercentage <= -3
      ? "Needs attention"
      : "Stable";

  const recentScoreAverage =
    average(
      recentMatches.map(
        getPerformanceScore
      )
    );

  const currentFormScore = Math.round(
    recentScoreAverage
  );

  const formStatus =
    currentFormScore >= 80
      ? "Hot form"
      : currentFormScore >= 65
      ? "Strong form"
      : currentFormScore >= 50
      ? "Stable form"
      : currentFormScore >= 35
      ? "Cold form"
      : "Developing form";

  const latestMatch =
    chronologicalMatches[
      chronologicalMatches.length - 1
    ];

  const previousMatch =
    chronologicalMatches[
      chronologicalMatches.length - 2
    ];

  const latestPerformanceScore =
    latestMatch
      ? getPerformanceScore(
          latestMatch
        )
      : 0;

  const previousPerformanceScore =
    previousMatch
      ? getPerformanceScore(
          previousMatch
        )
      : latestPerformanceScore;

  const formScoreChange =
    latestPerformanceScore -
    previousPerformanceScore;

  const currentFormDirection =
    formScoreChange >= 8
      ? "Rising"
      : formScoreChange <= -8
      ? "Falling"
      : "Stable";

  /* =========================================================
     FORM TIMELINE
     ========================================================= */

  const formTimeline =
    chronologicalMatches.map(
      (match, index) => ({
        match: index + 1,
        output: getOutput(match),
        score: getPerformanceScore(
          match
        ),
        result: match.result,
      })
    );

  /* =========================================================
     STREAKS
     ========================================================= */

  let currentWinStreak = 0;
  let bestWinStreak = 0;

  chronologicalMatches.forEach(
    (match) => {
      if (match.result === "Won") {
        currentWinStreak += 1;
        bestWinStreak = Math.max(
          bestWinStreak,
          currentWinStreak
        );
      } else {
        currentWinStreak = 0;
      }
    }
  );

  let currentLossStreak = 0;
  let bestLossStreak = 0;

  chronologicalMatches.forEach(
    (match) => {
      if (match.result === "Lost") {
        currentLossStreak += 1;
        bestLossStreak = Math.max(
          bestLossStreak,
          currentLossStreak
        );
      } else {
        currentLossStreak = 0;
      }
    }
  );

  /* =========================================================
     STAGE 17
     DEVELOPMENT
     ========================================================= */

  const developmentEarly =
    chronologicalMatches.slice(
      0,
      Math.max(
        1,
        Math.floor(
          chronologicalMatches.length /
            2
        )
      )
    );

  const developmentRecent =
    chronologicalMatches.slice(
      Math.floor(
        chronologicalMatches.length /
          2
      )
    );

  const earlyOutput = average(
    developmentEarly.map(getOutput)
  );

  const recentDevelopmentOutput =
    average(
      developmentRecent.map(
        getOutput
      )
    );

  const earlyScore = average(
    developmentEarly.map(
      getPerformanceScore
    )
  );

  const recentDevelopmentScore =
    average(
      developmentRecent.map(
        getPerformanceScore
      )
    );

  const outputDevelopment =
    earlyOutput > 0
      ? ((recentDevelopmentOutput -
          earlyOutput) /
          earlyOutput) *
        100
      : 0;

  const scoreDevelopment =
    recentDevelopmentScore -
    earlyScore;

  const developmentIndex = Math.round(
    clamp(
      recentDevelopmentScore * 0.45 +
        consistencyIndex * 0.2 +
        efficiencyIndex * 0.2 +
        winRate * 0.15
    )
  );

  const developmentTrajectory =
    scoreDevelopment >= 10
      ? "Accelerating"
      : scoreDevelopment >= 4
      ? "Progressing"
      : scoreDevelopment <= -10
      ? "Regressing"
      : scoreDevelopment <= -4
      ? "Needs review"
      : "Stable";

  const developmentDimensions =
    selectedSport === "cricket"
      ? [
          {
            label: "Scoring",
            value: clamp(
              averageOutput * 2
            ),
          },
          {
            label: "Strike Rate",
            value: clamp(
              strikeRate
            ),
          },
          {
            label: "Consistency",
            value: consistencyIndex,
          },
          {
            label: "Efficiency",
            value: efficiencyIndex,
          },
          {
            label: "Results",
            value: winRate,
          },
        ]
      : [
          {
            label: "Attacking Output",
            value: clamp(
              attackingContribution *
                10
            ),
          },
          {
            label: "Shot Accuracy",
            value: clamp(
              shotAccuracy
            ),
          },
          {
            label: "Consistency",
            value: consistencyIndex,
          },
          {
            label: "Efficiency",
            value: efficiencyIndex,
          },
          {
            label: "Results",
            value: winRate,
          },
        ];

  const strongestDevelopment =
    [...developmentDimensions].sort(
      (a, b) => b.value - a.value
    )[0];

  const weakestDevelopment =
    [...developmentDimensions].sort(
      (a, b) => a.value - b.value
    )[0];

  const developmentChartData =
    chronologicalMatches.map(
      (match, index) => ({
        match: index + 1,
        score: getPerformanceScore(
          match
        ),
        output: getOutput(match),
      })
    );

  /* =========================================================
     STAGE 14
     FORECAST
     ========================================================= */

  const forecastWindow =
    Math.min(
      5,
      chronologicalMatches.length
    );

  const forecastMatches =
    chronologicalMatches.slice(
      -forecastWindow
    );

  const forecastAverageOutput =
    average(
      forecastMatches.map(
        getOutput
      )
    );

  const forecastAverageScore =
    average(
      forecastMatches.map(
        getPerformanceScore
      )
    );

  const momentumAdjustment =
    improvementPercentage >= 5
      ? forecastAverageOutput * 0.05
      : improvementPercentage <= -5
      ? -forecastAverageOutput *
        0.05
      : 0;

  const expectedOutput = round(
    Math.max(
      0,
      forecastAverageOutput +
        momentumAdjustment
    ),
    1
  );

  const forecastSpread = Math.max(
    expectedOutput * 0.08,
    standardDeviation * 0.75
  );

  const forecastLow = round(
    Math.max(
      0,
      expectedOutput -
        forecastSpread
    ),
    1
  );

  const forecastHigh = round(
    expectedOutput +
      forecastSpread,
    1
  );

  const forecastConfidence =
    Math.round(
      clamp(
        totalMatches * 8 +
          consistencyIndex *
            0.35 -
          Math.abs(
            improvementPercentage
          ) *
            0.2
      )
    );

  const forecastConfidenceLabel =
    forecastConfidence >= 80
      ? "High confidence"
      : forecastConfidence >= 60
      ? "Moderate confidence"
      : "Early estimate";

  const forecastChartData = [
    ...trendData.slice(-5),
    {
      match:
        trendData.length + 1,
      output: expectedOutput,
      score: Math.round(
        forecastAverageScore
      ),
    },
  ];

  /* =========================================================
     STAGE 12
     HEALTH
     ========================================================= */

  const healthScore = Math.round(
    clamp(
      averageScore * 0.4 +
        consistencyIndex * 0.25 +
        efficiencyIndex * 0.2 +
        winRate * 0.15
    )
  );

  const strengthAreas =
    developmentDimensions;

  const strongestArea =
    [...strengthAreas].sort(
      (a, b) => b.value - a.value
    )[0];

  const weakestArea =
    [...strengthAreas].sort(
      (a, b) => a.value - b.value
    )[0];

  /* =========================================================
     STAGE 16
     ADVANCED SIGNALS
     ========================================================= */

  const recentOutputAverage =
    average(
      recentMatches.map(
        getOutput
      )
    );

  const safeAverageOutput =
    Number.isFinite(
      averageOutput
    )
      ? averageOutput
      : 0;

  const outputGapPercentage =
    safeAverageOutput > 0
      ? ((recentOutputAverage -
          safeAverageOutput) /
          safeAverageOutput) *
        100
      : 0;

  const recentWinRate =
    recentMatches.length > 0
      ? (recentMatches.filter(
          (match) =>
            match.result === "Won"
        ).length /
          recentMatches.length) *
        100
      : winRate;

  const resultSignal =
    recentWinRate >= winRate + 10
      ? "Positive"
      : recentWinRate <= winRate - 10
      ? "Under pressure"
      : "Stable";

  const advancedSignals = [
    {
      label: "Recent performance",
      value: Math.round(
        recentScoreAverage
      ),
      description:
        "Average performance score across recent matches.",
    },
    {
      label: "Output movement",
      value: round(
        outputGapPercentage,
        1
      ),
      suffix: "%",
      description:
        "Recent output compared with the long-term baseline.",
    },
    {
      label: "Consistency",
      value: consistencyIndex,
      description:
        "Stability of match output.",
    },
    {
      label: "Efficiency",
      value: efficiencyIndex,
      description:
        "Effectiveness of converting opportunities into output.",
    },
    {
      label: "Match results",
      value: round(
        recentWinRate,
        1
      ),
      suffix: "%",
      description:
        "Recent win percentage.",
    },
  ];

  const advancedInsightSummary =
    currentFormDirection ===
    "Rising"
      ? {
          title:
            "Positive momentum detected",
          explanation:
            "Recent performance is moving upward compared with the previous period.",
          confidence: 84,
        }
      : currentFormDirection ===
        "Falling"
      ? {
          title:
            "Recent momentum needs review",
          explanation:
            "The latest performance score has moved downward compared with the previous match.",
          confidence: 78,
        }
      : weakestArea &&
        weakestArea.value < 50
      ? {
          title:
            `${weakestArea.label} is the main development signal`,
          explanation:
            "This dimension currently sits below the other major performance indicators.",
          confidence: 80,
        }
      : {
          title:
            "Performance profile is balanced",
          explanation:
            "The main performance indicators are currently within a relatively stable range.",
          confidence: 72,
        };

  /* =========================================================
     STAGE 18
     GOALS
     ========================================================= */

  const goalTargetMatches = 20;

  const goals = [
    {
      id: "performance",
      title: "Performance Score",
      target: 80,
      current: Math.round(
        averageScore
      ),
      unit: "/100",
      progress: clamp(
        (averageScore / 80) *
          100
      ),
    },
    {
      id: "output",
      title:
        selectedSport === "cricket"
          ? "Average Runs"
          : "Goals + Assists",
      target:
        selectedSport === "cricket"
          ? 50
          : 3,
      current: round(
        averageOutput,
        1
      ),
      unit:
        selectedSport === "cricket"
          ? " runs"
          : " actions",
      progress: clamp(
        (averageOutput /
          (selectedSport ===
          "cricket"
            ? 50
            : 3)) *
          100
      ),
    },
    {
      id: "consistency",
      title: "Consistency",
      target: 80,
      current: consistencyIndex,
      unit: "/100",
      progress: clamp(
        (consistencyIndex / 80) *
          100
      ),
    },
    {
      id: "winrate",
      title: "Win Rate",
      target: 60,
      current: round(
        winRate,
        1
      ),
      unit: "%",
      progress: clamp(
        (winRate / 60) *
          100
      ),
    },
  ].map((goal) => ({
    ...goal,
    completed:
      goal.current >= goal.target,
    status:
      goal.current >= goal.target
        ? "Completed"
        : goal.progress >= 75
        ? "Close"
        : goal.progress >= 40
        ? "In progress"
        : "Early progress",
  }));

  const completedGoals =
    goals.filter(
      (goal) => goal.completed
    ).length;

  /* =========================================================
     ACHIEVEMENTS
     ========================================================= */

  const achievements = [
    {
      id: "first",
      icon: "🏁",
      title: "First Match",
      unlocked: totalMatches >= 1,
      text: "Record your first match.",
    },
    {
      id: "five",
      icon: "⭐",
      title: "5 Matches",
      unlocked: totalMatches >= 5,
      text: "Record five matches.",
    },
    {
      id: "ten",
      icon: "🔥",
      title: "10 Matches",
      unlocked: totalMatches >= 10,
      text: "Record ten matches.",
    },
    {
      id: "twenty",
      icon: "🏆",
      title: "20 Matches",
      unlocked:
        totalMatches >= 20,
      text: "Complete a 20-match season.",
    },
    {
      id: "score80",
      icon: "💎",
      title: "Performance 80+",
      unlocked:
        bestScore >= 80,
      text: "Reach an 80+ performance score.",
    },
    {
      id: "consistency80",
      icon: "🎯",
      title: "Consistency 80+",
      unlocked:
        consistencyIndex >= 80,
      text: "Reach an 80+ consistency index.",
    },
    {
      id: "win3",
      icon: "🥇",
      title: "3-Win Streak",
      unlocked:
        bestWinStreak >= 3,
      text: "Win three matches consecutively.",
    },
    {
      id: "development75",
      icon: "📈",
      title: "Development 75+",
      unlocked:
        developmentIndex >= 75,
      text: "Reach a 75+ development index.",
    },
  ];

  const goalsComplete =
    completedGoals ===
    goals.length;

  const allAchievements = [
    ...achievements,
    {
      id: "allGoals",
      icon: "👑",
      title: "Goal Master",
      unlocked: goalsComplete,
      text: "Complete all performance goals.",
    },
  ];

  const unlockedAchievements =
    allAchievements.filter(
      (item) => item.unlocked
    ).length;

  const seasonProgress = clamp(
    (totalMatches /
      goalTargetMatches) *
      100
  );

  /* =========================================================
     STAGE 21
     DETECTED PATTERNS
     ========================================================= */

  const patterns = useMemo(
    () =>
      detectPatterns({
        matches: sportMatches,
        selectedSport,
        getOutput,
        getPerformanceScore,
      }),
    [
      sportMatches,
      selectedSport,
    ]
  );

  const patternSummary =
    patterns.length === 0
      ? "No strong recurring pattern detected yet."
      : `${patterns.length} performance pattern${
          patterns.length === 1
            ? ""
            : "s"
        } detected.`;

  /* =========================================================
     STAGE 23
     CONTEXT PATTERNS
     ========================================================= */

  const contextPatterns = useMemo(() => {
    return detectContextPatterns({
      matches: sportMatches,
      selectedSport,
      getOutput,
      getPerformanceScore,
      opponentDifficultyData,
    });
  }, [sportMatches, selectedSport, opponentDifficultyData]);

  const contextPatternSummary =
    contextPatterns.length === 0 ? "Monitoring" : `${contextPatterns.length} context signals`;

  const strongestContextPattern = contextPatterns[0] || null;
  const contextPositiveCount = contextPatterns.filter((p) => p.tone === "positive").length;
  const contextWarningCount = contextPatterns.filter((p) => p.tone === "warning").length;

  /* =========================================================
     STAGE 24
     ACTIONABLE RECOMMENDATIONS
     ========================================================= */

  const actionRecommendations = useMemo(() => {
    return buildActionRecommendations({
      selectedSport,
      totalMatches,
      currentFormDirection,
      consistencyIndex,
      efficiencyIndex,
      developmentIndex,
      weakestArea,
      strongestArea,
      contextPatterns,
      strongestContextPattern,
      forecastConfidence,
      improvementPercentage,
      goals,
    });
  }, [
    selectedSport,
    totalMatches,
    currentFormDirection,
    consistencyIndex,
    efficiencyIndex,
    developmentIndex,
    weakestArea,
    strongestArea,
    contextPatterns,
    strongestContextPattern,
    forecastConfidence,
    improvementPercentage,
    goals,
  ]);

  const recommendationSummary =
    actionRecommendations.length === 0
      ? "Monitoring"
      : `${actionRecommendations.length} actions`;

  /* =========================================================
     STAGE 25
     READINESS ASSESSMENT
     ========================================================= */

  const readinessAssessment = useMemo(() => {
    return buildReadinessAssessment({
      healthScore,
      currentFormScore,
      consistencyIndex,
      efficiencyIndex,
      developmentIndex,
      forecastConfidence,
      improvementPercentage,
      contextPatterns,
      opponentDifficultyData,
      actionRecommendations,
      totalMatches,
    });
  }, [
    healthScore,
    currentFormScore,
    consistencyIndex,
    efficiencyIndex,
    developmentIndex,
    forecastConfidence,
    improvementPercentage,
    contextPatterns,
    opponentDifficultyData,
    actionRecommendations,
    totalMatches,
  ]);

  const readinessSummary =
    `${readinessAssessment.readinessScore}/100 · ${readinessAssessment.readinessLabel}`;


  /* =========================================================
     RADAR
     ========================================================= */

  const radarData =
    selectedSport === "cricket"
      ? [
          {
            metric: "Scoring",
            value: clamp(
              averageOutput * 2
            ),
          },
          {
            metric: "Strike Rate",
            value: clamp(
              strikeRate
            ),
          },
          {
            metric: "Boundaries",
            value: clamp(
              boundaryContribution
            ),
          },
          {
            metric: "Consistency",
            value: consistencyIndex,
          },
          {
            metric: "Win Rate",
            value: clamp(winRate),
          },
        ]
      : [
          {
            metric: "Attacking",
            value: clamp(
              attackingContribution *
                10
            ),
          },
          {
            metric: "Shot Accuracy",
            value: clamp(
              shotAccuracy
            ),
          },
          {
            metric: "Efficiency",
            value: efficiencyIndex,
          },
          {
            metric: "Consistency",
            value: consistencyIndex,
          },
          {
            metric: "Win Rate",
            value: clamp(winRate),
          },
        ];

  /* =========================================================
     COMPARISON
     ========================================================= */

  const comparisonMatchA =
    matches.find(
      (match) =>
        match._id === comparisonA
    );

  const comparisonMatchB =
    matches.find(
      (match) =>
        match._id === comparisonB
    );

  const getComparisonMetric = (
    match,
    metric
  ) => {
    if (!match) return 0;

    if (metric === "output")
      return getOutput(match);

    if (metric === "score")
      return getPerformanceScore(
        match
      );

    if (
      metric === "strikeRate"
    ) {
      const balls =
        safeNumber(
          match.balls
        );

      return balls > 0
        ? (safeNumber(
            match.runs
          ) /
            balls) *
            100
        : 0;
    }

    if (
      metric === "boundaries"
    ) {
      return (
        safeNumber(
          match.fours
        ) +
        safeNumber(
          match.sixes
        )
      );
    }

    if (
      metric === "shotAccuracy"
    ) {
      const shots =
        safeNumber(
          match.shots
        );

      return shots > 0
        ? (safeNumber(
            match.shotsOnTarget
          ) /
            shots) *
            100
        : 0;
    }

    if (
      metric === "passes"
    )
      return safeNumber(
        match.passes
      );

    if (
      metric === "tackles"
    )
      return safeNumber(
        match.tackles
      );

    if (
      metric === "wickets"
    )
      return safeNumber(
        match.wickets
      );

    return 0;
  };

  const comparisonMetrics =
    selectedSport === "cricket"
      ? [
          {
            key: "output",
            label: "Runs",
          },
          {
            key: "strikeRate",
            label: "Strike Rate",
          },
          {
            key: "boundaries",
            label: "Boundaries",
          },
          {
            key: "wickets",
            label: "Wickets",
          },
          {
            key: "score",
            label:
              "Performance Score",
          },
        ]
      : [
          {
            key: "output",
            label:
              "Goals + Assists",
          },
          {
            key:
              "shotAccuracy",
            label:
              "Shot Accuracy",
          },
          {
            key: "passes",
            label: "Passes",
          },
          {
            key: "tackles",
            label: "Tackles",
          },
          {
            key: "score",
            label:
              "Performance Score",
          },
        ];

  /* =========================================================
     MAIN
     ========================================================= */

  const scenarioPlanning = useMemo(() => {
    return buildScenarioPlanning({
      selectedSport,
      readinessAssessment,
      currentFormScore,
      healthScore,
      consistencyIndex,
      efficiencyIndex,
      developmentIndex,
      forecastConfidence,
      opponentDifficultyData,
      contextPatterns,
      getOutput,
      getPerformanceScore,
      sportMatches,
    });
  }, [
    selectedSport,
    readinessAssessment,
    currentFormScore,
    healthScore,
    consistencyIndex,
    efficiencyIndex,
    developmentIndex,
    forecastConfidence,
    opponentDifficultyData,
    contextPatterns,
    sportMatches,
  ]);


  /* =========================================================
     STAGE 27
     POST-MATCH REVIEW & LEARNING
     ========================================================= */

  const postMatchReview = useMemo(() => {
    return buildPostMatchReview({
      selectedSport,
      sportMatches,
      chronologicalMatches,
      getOutput,
      getPerformanceScore,
      averageOutput,
      averageScore,
      consistencyIndex,
      efficiencyIndex,
      winRate,
      improvementPercentage,
      readinessAssessment,
      scenarioPlanning,
    });
  }, [
    selectedSport,
    sportMatches,
    chronologicalMatches,
    averageOutput,
    averageScore,
    consistencyIndex,
    efficiencyIndex,
    winRate,
    improvementPercentage,
    readinessAssessment,
    scenarioPlanning,
  ]);

  /* =========================================================
     STAGE 28
     PREPARATION PLAN
     ========================================================= */

  const preparationPlan = useMemo(() => {
    return buildPreparationPlan({
      selectedSport,
      currentFormScore,
      consistencyIndex,
      efficiencyIndex,
      developmentIndex,
      improvementPercentage,
      readinessAssessment,
      postMatchReview,
      actionRecommendations,
      scenarioPlanning,
    });
  }, [
    selectedSport,
    currentFormScore,
    consistencyIndex,
    efficiencyIndex,
    developmentIndex,
    improvementPercentage,
    readinessAssessment,
    postMatchReview,
    actionRecommendations,
    scenarioPlanning,
  ]);

  /* =========================================================
     STAGE 29
     FRONTEND STABILITY & VALIDATION
     ========================================================= */

  const stabilityReport = useMemo(() => {
    return buildAnalyticsStabilityReport({
      matches,
      sportMatches,
      selectedSport,
      getOutput,
      getPerformanceScore,
      readinessAssessment,
      scenarioPlanning,
      postMatchReview,
      preparationPlan,
    });
  }, [
    matches,
    sportMatches,
    selectedSport,
    readinessAssessment,
    scenarioPlanning,
    postMatchReview,
    preparationPlan,
  ]);

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-empty-state">
          <div className="analytics-empty-state-icon">
            ◈
          </div>

          <h3>
            Loading analytics engine...
          </h3>

          <p>
            PlaySense is processing
            your match performance
            data.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-empty-state">
          <div className="analytics-empty-state-icon">
            !
          </div>

          <h3>
            Analytics unavailable
          </h3>

          <p>{error}</p>

          <button
            type="button"
            className="analytics-refresh-button"
            onClick={() =>
              fetchMatches(true)
            }
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     EMPTY
     ========================================================= */

  if (matches.length === 0) {
    return (
      <div className="analytics-page">
        <div className="analytics-command-header">
          <div className="analytics-command-copy">
            <div className="analytics-command-kicker">
              PLAYSENSE INTELLIGENCE ENGINE
            </div>

            <h1>
              Performance Analytics
            </h1>

            <p>
              Transform your match
              history into measurable
              performance insights.
            </p>
          </div>
        </div>

        <div className="analytics-empty-state">
          <div className="analytics-empty-state-icon">
            +
          </div>

          <h3>
            No match data yet
          </h3>

          <p>
            Add your first cricket
            or football match to
            activate the PlaySense
            analytics engine.
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="analytics-page">

      {/* =====================================================
          STAGE 30
          RESPONSIVE & MOBILE EXPERIENCE
          ===================================================== */}

      <style>{`
        .analytics-page {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .analytics-page *,
        .analytics-page *::before,
        .analytics-page *::after {
          box-sizing: border-box;
        }

        .analytics-page img,
        .analytics-page svg,
        .analytics-page canvas {
          max-width: 100%;
        }

        .analytics-page .recharts-responsive-container {
          min-width: 0 !important;
        }

        .analytics-page .analytics-command-header,
        .analytics-page .analytics-section-heading {
          min-width: 0;
        }

        .analytics-page .analytics-command-copy,
        .analytics-page .analytics-section-heading > div:first-child {
          min-width: 0;
        }

        .analytics-page .analytics-command-copy h1,
        .analytics-page .analytics-section-heading h2,
        .analytics-page .analytics-section-heading h3,
        .analytics-page .analytics-panel h2,
        .analytics-page .analytics-panel h3 {
          overflow-wrap: anywhere;
        }

        .analytics-page button,
        .analytics-page select,
        .analytics-page input {
          max-width: 100%;
        }

        @media (max-width: 900px) {
          .analytics-page .analytics-command-header,
          .analytics-page .analytics-section-heading {
            gap: 16px;
          }

          .analytics-page .analytics-command-actions {
            flex-wrap: wrap;
          }

          .analytics-page .analytics-metric-grid,
          .analytics-page .pattern-grid,
          .analytics-page .development-dimension-grid,
          .analytics-page .trend-insight-grid,
          .analytics-page .validation-grid,
          .analytics-page .analytics-engine-grid,
          .analytics-page .analytics-roadmap-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .analytics-page .analytics-panel {
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .analytics-page {
            padding-bottom: 24px;
          }

          .analytics-page .analytics-command-header,
          .analytics-page .analytics-section-heading {
            flex-direction: column;
            align-items: stretch;
          }

          .analytics-page .analytics-command-actions {
            width: 100%;
          }

          .analytics-page .analytics-command-actions > * {
            flex: 1 1 100%;
            width: 100%;
          }

          .analytics-page .analytics-command-status {
            width: 100%;
            text-align: center;
          }

          .analytics-page .analytics-metric-grid,
          .analytics-page .pattern-grid,
          .analytics-page .development-dimension-grid,
          .analytics-page .trend-insight-grid,
          .analytics-page .validation-grid,
          .analytics-page .analytics-engine-grid,
          .analytics-page .analytics-roadmap-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .analytics-page .analytics-section {
            margin-bottom: 18px;
          }

          .analytics-page .analytics-panel,
          .analytics-page .analytics-card,
          .analytics-page .pattern-card,
          .analytics-page .trend-insight-card {
            min-width: 0;
            overflow-wrap: anywhere;
          }

          .analytics-page .analytics-panel {
            padding: 16px;
          }

          .analytics-page .analytics-panel strong {
            max-width: 100%;
            overflow-wrap: anywhere;
          }

          .analytics-page .recharts-wrapper,
          .analytics-page .recharts-surface {
            max-width: 100%;
          }

          .analytics-page .recharts-default-tooltip {
            max-width: calc(100vw - 32px);
          }

          .analytics-page table {
            display: block;
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 420px) {
          .analytics-page .analytics-panel {
            padding: 14px;
          }

          .analytics-page h1 {
            font-size: clamp(28px, 9vw, 38px);
          }

          .analytics-page h2 {
            font-size: clamp(21px, 7vw, 28px);
          }

          .analytics-page h3 {
            font-size: 18px;
          }
        }
      `}</style>


      {/* =====================================================
          STAGE 38
          FINAL UI / UX POLISH
          ===================================================== */}
      <style>{`
        .analytics-page {
          --ps-bg: #07111f;
          --ps-surface: rgba(15, 23, 42, 0.78);
          --ps-surface-strong: rgba(15, 23, 42, 0.94);
          --ps-border: rgba(148, 163, 184, 0.14);
          --ps-border-strong: rgba(103, 232, 249, 0.28);
          --ps-text: #e5eef8;
          --ps-muted: #94a3b8;
          --ps-accent: #67e8f9;
          --ps-accent-soft: rgba(103, 232, 249, 0.10);
          --ps-success: #86efac;
          --ps-warning: #fbbf24;
          --ps-danger: #f87171;
        }

        /* Stage 41: dark-theme text contrast refinement */
        .analytics-page {
          color: var(--ps-text);
          color-scheme: dark;
        }

        .analytics-page h1,
        .analytics-page h2,
        .analytics-page h3,
        .analytics-page h4,
        .analytics-page strong {
          color: #f8fbff;
        }

        .analytics-page p,
        .analytics-page li,
        .analytics-page td,
        .analytics-page th,
        .analytics-page label {
          color: #d5deea;
        }

        .analytics-page .analytics-section-heading p,
        .analytics-page .analytics-command-copy p,
        .analytics-page .analytics-panel p,
        .analytics-page .analytics-card p,
        .analytics-page .pattern-card p,
        .analytics-page .trend-insight-card p,
        .analytics-page .advanced-insight-card p,
        .analytics-page .achievement-card p,
        .analytics-page .pattern-empty-card p {
          color: #cbd5e1 !important;
        }

        .analytics-page .analytics-section-kicker,
        .analytics-page .analytics-card > span,
        .analytics-page .pattern-card-top > span,
        .analytics-page .advanced-insight-card > span,
        .analytics-page .achievement-card > span {
          color: #a9b8ca;
        }

        .analytics-page .analytics-command-status,
        .analytics-page .pattern-meta-row,
        .analytics-page .pattern-evidence,
        .analytics-page .analytics-engine-grid span,
        .analytics-page .analytics-roadmap-grid span {
          color: #b8c5d6;
        }

        .analytics-page .analytics-command-status strong,
        .analytics-page .pattern-evidence strong,
        .analytics-page .pattern-meta-row strong {
          color: #f1f5f9;
        }

        .analytics-page .analytics-panel,
        .analytics-page .analytics-card,
        .analytics-page .pattern-card,
        .analytics-page .trend-insight-card,
        .analytics-page .advanced-insight-card,
        .analytics-page .achievement-card {
          color: #e5edf7;
        }

        .analytics-page input,
        .analytics-page select,
        .analytics-page textarea {
          color: #f1f5f9 !important;
          background-color: rgba(15, 23, 42, 0.92);
          border-color: rgba(148, 163, 184, 0.24);
        }

        .analytics-page input::placeholder,
        .analytics-page textarea::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        .analytics-page select option {
          color: #f1f5f9;
          background: #0f172a;
        }

        .analytics-page table th {
          color: #dbe7f3 !important;
        }

        .analytics-page table td {
          color: #cbd5e1 !important;
        }

        .analytics-page .recharts-cartesian-axis-tick-value,
        .analytics-page .recharts-polar-angle-axis-tick-value,
        .analytics-page .recharts-polar-radius-axis-tick-value {
          fill: #b9c7d8 !important;
        }

        .analytics-page .recharts-cartesian-axis-line,
        .analytics-page .recharts-cartesian-axis-tick-line {
          stroke: rgba(148, 163, 184, 0.28) !important;
        }

        .analytics-page .recharts-tooltip-wrapper {
          color: #e5edf7;
        }

        .analytics-page .recharts-default-tooltip {
          background: rgba(8, 15, 28, 0.96) !important;
          border: 1px solid rgba(103, 232, 249, 0.22) !important;
          border-radius: 12px !important;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.32);
          color: #e5edf7 !important;
        }

        .analytics-page .recharts-tooltip-label,
        .analytics-page .recharts-tooltip-item {
          color: #e5edf7 !important;
        }

        .analytics-page .analytics-command-header,
        .analytics-page .analytics-section {
          animation: psFadeUp 420ms ease both;
        }

        .analytics-page .analytics-section:nth-of-type(2) { animation-delay: 30ms; }
        .analytics-page .analytics-section:nth-of-type(3) { animation-delay: 50ms; }

        .analytics-page .analytics-card,
        .analytics-page .pattern-card,
        .analytics-page .trend-insight-card,
        .analytics-page .advanced-insight-card,
        .analytics-page .analytics-panel,
        .analytics-page .achievement-card {
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .analytics-page .analytics-card:hover,
        .analytics-page .pattern-card:hover,
        .analytics-page .trend-insight-card:hover,
        .analytics-page .advanced-insight-card:hover,
        .analytics-page .achievement-card:hover {
          transform: translateY(-2px);
          border-color: var(--ps-border-strong);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
        }

        .analytics-page button,
        .analytics-page select {
          min-height: 42px;
          border-radius: 12px;
        }

        .analytics-page button:focus-visible,
        .analytics-page select:focus-visible,
        .analytics-page input:focus-visible {
          outline: 3px solid rgba(103, 232, 249, 0.34);
          outline-offset: 2px;
        }

        .analytics-page .analytics-refresh-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 160ms ease,
            opacity 160ms ease,
            border-color 160ms ease;
        }

        .analytics-page .analytics-refresh-button:not(:disabled):hover {
          transform: translateY(-1px);
        }

        .analytics-page .analytics-refresh-button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .analytics-page .analytics-status-dot {
          display: inline-block;
          margin-right: 6px;
          color: var(--ps-success);
          animation: psPulse 1.8s ease-in-out infinite;
        }

        .analytics-page .analytics-sport-switch {
          position: sticky;
          top: 12px;
          z-index: 5;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .analytics-page .analytics-empty-state {
          min-height: 260px;
          display: grid;
          place-items: center;
          text-align: center;
          align-content: center;
          gap: 8px;
        }

        .analytics-page .analytics-empty-state-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border: 1px solid var(--ps-border-strong);
          border-radius: 16px;
          background: var(--ps-accent-soft);
          color: var(--ps-accent);
          font-size: 24px;
          margin-bottom: 6px;
        }

        .analytics-page .analytics-empty-state h3,
        .analytics-page .analytics-empty-state p {
          margin-left: auto;
          margin-right: auto;
        }

        .analytics-page .pattern-confidence-bar > div,
        .analytics-page .development-progress > div,
        .analytics-page .goal-progress > div,
        .analytics-page .season-progress-bar > div {
          transition: width 500ms cubic-bezier(.22,1,.36,1);
        }

        .analytics-page table {
          border-collapse: collapse;
        }

        .analytics-page ::selection {
          background: rgba(103, 232, 249, 0.24);
          color: #fff;
        }

        @keyframes psFadeUp {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes psPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        @media (max-width: 640px) {
          .analytics-page .analytics-sport-switch {
            position: static;
          }

          .analytics-page .analytics-command-header {
            padding-top: 4px;
          }

          .analytics-page .analytics-card,
          .analytics-page .pattern-card,
          .analytics-page .trend-insight-card,
          .analytics-page .advanced-insight-card {
            padding: 15px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .analytics-page *,
          .analytics-page *::before,
          .analytics-page *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="analytics-command-header">

        <div className="analytics-command-copy">

          <div className="analytics-command-kicker">
            PLAYSENSE INTELLIGENCE ENGINE
          </div>

          <h1>
            Performance Analytics
          </h1>

          <p>
            Multi-factor analysis,
            development tracking,
            goals and performance
            pattern detection.
          </p>

        </div>

        <div className="analytics-command-actions">

          <button
            type="button"
            className="analytics-refresh-button"
            aria-label={refreshing ? "Refreshing analytics" : "Refresh analytics"}
            onClick={() =>
              fetchMatches(true)
            }
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

          <div className="analytics-command-status">
            <span className="analytics-status-dot">
              ●
            </span>

            ANALYSIS READY
          </div>

        </div>

      </section>

      {/* =====================================================
          SPORT SWITCH
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-sport-switch">

          <button
            type="button"
            className={
              selectedSport ===
              "cricket"
                ? "active"
                : ""
            }
            aria-pressed={selectedSport === "cricket"}
            aria-label="Show cricket analytics"
            onClick={() =>
              setSelectedSport(
                "cricket"
              )
            }
          >
            🏏 Cricket
          </button>

          <button
            type="button"
            className={
              selectedSport ===
              "football"
                ? "active"
                : ""
            }
            aria-pressed={selectedSport === "football"}
            aria-label="Show football analytics"
            onClick={() =>
              setSelectedSport(
                "football"
              )
            }
          >
            ⚽ Football
          </button>

        </div>

      </section>

      {/* =====================================================
          EXECUTIVE OVERVIEW
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              EXECUTIVE OVERVIEW
            </span>

            <h2>
              {selectedSport ===
              "cricket"
                ? "Cricket performance command center"
                : "Football performance command center"}
            </h2>

            <p>
              A compact view of your
              current competitive
              profile.
            </p>
          </div>

          <div className="analytics-command-status">
            {formStatus}
          </div>

        </div>

        <div className="analytics-metric-grid">

          <div className="analytics-card">
            <span>
              MATCHES
            </span>

            <strong>
              {totalMatches}
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              AVG OUTPUT
            </span>

            <strong>
              {round(
                averageOutput,
                1
              )}
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              AVG SCORE
            </span>

            <strong>
              {round(
                averageScore
              )}
              /100
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              WIN RATE
            </span>

            <strong>
              {round(winRate, 1)}%
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              CONSISTENCY
            </span>

            <strong>
              {consistencyIndex}
              /100
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              EFFICIENCY
            </span>

            <strong>
              {efficiencyIndex}
              /100
            </strong>
          </div>

        </div>

      </section>

      {/* =====================================================
          STAGE 21
          PATTERN DETECTION
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              STAGE 21 · PATTERN ENGINE
            </span>

            <h2>
              Performance patterns
            </h2>

            <p>
              PlaySense scans recent
              matches for recurring
              performance behaviour,
              momentum and volatility.
            </p>
          </div>

          <div className="analytics-command-status">
            {patternSummary}
          </div>

        </div>

        <div className="pattern-engine-summary">

          <div className="pattern-engine-summary-icon">
            ◈
          </div>

          <div>
            <span>
              DETECTION STATUS
            </span>

            <strong>
              {patterns.length > 0
                ? "Patterns detected"
                : "Monitoring"}
            </strong>

            <p>
              {patterns.length > 0
                ? "The engine identified recurring signals in your recorded match history."
                : "Record more matches to increase pattern detection depth."}
            </p>
          </div>

          <div className="pattern-engine-count">
            <strong>
              {patterns.length}
            </strong>

            <span>
              signals
            </span>
          </div>

        </div>

        <div className="pattern-grid">

          {patterns.map(
            (pattern, index) => (
              <div
                className={`pattern-card pattern-${pattern.tone}`}
                key={`${pattern.type}-${index}`}
              >

                <div className="pattern-card-top">

                  <div className="pattern-icon">
                    {pattern.icon}
                  </div>

                  <span>
                    {pattern.confidence}% confidence
                  </span>

                </div>

                <h3>
                  {pattern.title}
                </h3>

                <p>
                  {pattern.description}
                </p>

                <div className="pattern-confidence-bar">
                  <div
                    style={{
                      width: `${clamp(
                        pattern.confidence
                      )}%`,
                    }}
                  />
                </div>

              </div>
            )
          )}

          {patterns.length === 0 && (
            <div className="pattern-empty-card">
              <strong>
                No strong recurring
                pattern yet
              </strong>

              <p>
                PlaySense needs a
                larger match history
                before making stronger
                pattern observations.
              </p>
            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          PERFORMANCE TREND
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              PERFORMANCE TREND
            </span>

            <h2>
              Output and performance
              trajectory
            </h2>
          </div>

        </div>

        <div className="analytics-panel">

          <ResponsiveContainer
            width="100%"
            height={330}
          >
            <LineChart
              data={trendData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
              />

              <XAxis
                dataKey="match"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="output"
                stroke="#67e8f9"
                strokeWidth={3}
                dot={{ r: 4 }}
                name={
                  selectedSport ===
                  "cricket"
                    ? "Runs"
                    : "Goals + Assists"
                }
              />

              <Line
                type="monotone"
                dataKey="score"
                stroke="#a78bfa"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Performance Score"
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      </section>

      {/* =====================================================
          FORM
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              FORM & MOMENTUM
            </span>

            <h2>
              Current competitive form
            </h2>

            <p>
              Recent match behaviour
              compared with the
              historical baseline.
            </p>
          </div>

          <div className="analytics-command-status">
            {currentFormDirection}
          </div>

        </div>

        <div className="form-intelligence-grid">

          <div className="analytics-card analytics-feature-card">

            <span>
              FORM INDEX
            </span>

            <strong>
              {currentFormScore}
              <small>/100</small>
            </strong>

            <p>
              {formStatus}
            </p>

          </div>

          <div className="analytics-card analytics-feature-card">

            <span>
              OUTPUT MOVEMENT
            </span>

            <strong>
              {round(
                improvementPercentage,
                1
              )}
              <small>%</small>
            </strong>

            <p>
              {improvementLabel}
            </p>

          </div>

          <div className="analytics-card analytics-feature-card">

            <span>
              WIN STREAK
            </span>

            <strong>
              {currentWinStreak}
            </strong>

            <p>
              Best:{" "}
              {bestWinStreak}
            </p>

          </div>

          <div className="analytics-card analytics-feature-card">

            <span>
              LOSS STREAK
            </span>

            <strong>
              {currentLossStreak}
            </strong>

            <p>
              Best:{" "}
              {bestLossStreak}
            </p>

          </div>

        </div>

      </section>

      {/* FORM CHART */}

      <section className="analytics-section">

        <div className="analytics-panel">

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <AreaChart
              data={formTimeline}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
              />

              <XAxis
                dataKey="match"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="score"
                stroke="#67e8f9"
                fill="rgba(103,232,249,0.12)"
                name="Form Score"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </section>

      {/* =====================================================
          CONSISTENCY + EFFICIENCY
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              PERFORMANCE QUALITY
            </span>

            <h2>
              Consistency and efficiency
            </h2>
          </div>

        </div>

        <div className="analytics-two-column">

          <div className="analytics-panel analytics-feature-panel">

            <div className="analytics-feature-label">
              CONSISTENCY INDEX
            </div>

            <div className="analytics-big-number">
              {consistencyIndex}
              <small>
                /100
              </small>
            </div>

            <div className="analytics-feature-status">
              {consistencyLabel}
            </div>

            <p>
              Based on the variation
              of your match output
              across the selected sport.
            </p>

          </div>

          <div className="analytics-panel analytics-feature-panel">

            <div className="analytics-feature-label">
              EFFICIENCY INDEX
            </div>

            <div className="analytics-big-number">
              {efficiencyIndex}
              <small>
                /100
              </small>
            </div>

            <div className="analytics-feature-status">

              {selectedSport ===
              "cricket"
                ? `${round(
                    strikeRate,
                    1
                  )} strike rate`
                : `${round(
                    shotAccuracy,
                    1
                  )}% shot accuracy`}

            </div>

            <p>
              Measures how effectively
              you convert opportunities
              into useful match output.
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          RADAR
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              PERFORMANCE PROFILE
            </span>

            <h2>
              Strength profile
            </h2>
          </div>

        </div>

        <div className="analytics-panel">

          <ResponsiveContainer
            width="100%"
            height={380}
          >

            <RadarChart
              data={radarData}
            >

              <PolarGrid />

              <PolarAngleAxis
                dataKey="metric"
              />

              <PolarRadiusAxis
                domain={[0, 100]}
              />

              <Radar
                dataKey="value"
                stroke="#67e8f9"
                fill="#67e8f9"
                fillOpacity={0.18}
              />

              <Tooltip />

            </RadarChart>

          </ResponsiveContainer>

        </div>

      </section>

      {/* =====================================================
          DEVELOPMENT
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              STAGE 17 · DEVELOPMENT
            </span>

            <h2>
              Long-term player development
            </h2>

            <p>
              Track how your performance
              dimensions are developing
              over time.
            </p>
          </div>

          <div className="analytics-command-status">
            {developmentTrajectory}
          </div>

        </div>

        <div className="analytics-metric-grid">

          <div className="analytics-card">
            <span>
              DEVELOPMENT INDEX
            </span>

            <strong>
              {developmentIndex}
              /100
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              SCORE CHANGE
            </span>

            <strong>
              {round(
                scoreDevelopment,
                1
              )}
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              OUTPUT CHANGE
            </span>

            <strong>
              {round(
                outputDevelopment,
                1
              )}
              %
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              STRONGEST AREA
            </span>

            <strong>
              {strongestDevelopment
                ? strongestDevelopment.label
                : "—"}
            </strong>
          </div>

        </div>

        <div className="development-dimension-grid">

          {developmentDimensions.map(
            (dimension) => (
              <div
                className="development-dimension"
                key={dimension.label}
              >

                <div>
                  <span>
                    {dimension.label}
                  </span>

                  <strong>
                    {round(
                      dimension.value
                    )}
                  </strong>
                </div>

                <div className="development-progress">
                  <div
                    style={{
                      width: `${clamp(
                        dimension.value
                      )}%`,
                    }}
                  />
                </div>

              </div>
            )
          )}

        </div>

      </section>

      {/* DEVELOPMENT CHART */}

      <section className="analytics-section">

        <div className="analytics-panel">

          <ResponsiveContainer
            width="100%"
            height={320}
          >

            <LineChart
              data={
                developmentChartData
              }
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
              />

              <XAxis
                dataKey="match"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="score"
                stroke="#a78bfa"
                strokeWidth={3}
                name="Development Score"
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </section>

      {/* =====================================================
          FORECAST
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              FORECAST ENGINE
            </span>

            <h2>
              Next-match performance
              estimate
            </h2>

            <p>
              A data-derived estimate
              based on recent output,
              historical form and
              consistency.
            </p>
          </div>

          <div className="analytics-command-status">
            {forecastConfidenceLabel}
          </div>

        </div>

        <div className="forecast-hero">

          <div>
            <span>
              EXPECTED OUTPUT
            </span>

            <strong>
              {expectedOutput}
            </strong>

            <p>
              Estimated range:
              {" "}
              {forecastLow}
              {" – "}
              {forecastHigh}
            </p>
          </div>

          <div className="forecast-confidence">
            <span>
              CONFIDENCE
            </span>

            <strong>
              {forecastConfidence}%
            </strong>
          </div>

        </div>

        <div className="analytics-panel">

          <ResponsiveContainer
            width="100%"
            height={320}
          >

            <LineChart
              data={
                forecastChartData
              }
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
              />

              <XAxis
                dataKey="match"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="output"
                stroke="#67e8f9"
                strokeWidth={3}
                name={
                  selectedSport ===
                  "cricket"
                    ? "Output"
                    : "Goals + Assists"
                }
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </section>

      {/* =====================================================
          OPPONENT DIFFICULTY
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              MATCH DIFFICULTY ENGINE
            </span>

            <h2>
              Opponent strength
              intelligence
            </h2>
          </div>

          <div className="analytics-command-status">
            {round(
              averageDifficulty
            )}
            /100
          </div>

        </div>

        <div className="analytics-metric-grid">

          <div className="analytics-card">
            <span>
              AVG DIFFICULTY
            </span>

            <strong>
              {round(
                averageDifficulty
              )}
              /100
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              DIFFICULT
            </span>

            <strong>
              {
                difficultOpponents.length
              }
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              MODERATE
            </span>

            <strong>
              {
                moderateOpponents.length
              }
            </strong>
          </div>

          <div className="analytics-card">
            <span>
              MANAGEABLE
            </span>

            <strong>
              {
                manageableOpponents.length
              }
            </strong>
          </div>

        </div>

        <div className="difficulty-intelligence-panel">

          <div>
            <span className="analytics-section-kicker">
              TOUGHEST HISTORICAL
              MATCHUP
            </span>

            <h3>
              {mostDifficultOpponent
                ? mostDifficultOpponent.opponent
                : "Not enough data"}
            </h3>

            <p>
              {mostDifficultOpponent
                ? `Difficulty index ${mostDifficultOpponent.difficultyScore}/100 based on historical results and performance.`
                : "Record more matches against different opponents."}
            </p>
          </div>

          <div className="difficulty-score-display">
            <strong>
              {mostDifficultOpponent
                ? mostDifficultOpponent.difficultyScore
                : 0}
            </strong>

            <span>
              /100
            </span>
          </div>

        </div>

      </section>

      {/* DIFFICULTY CHART */}

      {difficultyChartData.length >
        0 && (
        <section className="analytics-section">

          <div className="analytics-panel">

            <ResponsiveContainer
              width="100%"
              height={340}
            >

              <BarChart
                data={
                  difficultyChartData
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.12)"
                />

                <XAxis
                  dataKey="opponent"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                />

                <Tooltip />

                <Bar
                  dataKey="difficulty"
                  fill="#fb923c"
                  name="Difficulty"
                />

                <Bar
                  dataKey="performance"
                  fill="#67e8f9"
                  name="Performance"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>
      )}

      {/* =====================================================
          ADVANCED INSIGHTS
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              STAGE 16 · ADVANCED
              INTELLIGENCE
            </span>

            <h2>
              Advanced performance
              insights
            </h2>
          </div>

        </div>

        <div className="advanced-insight-hero">

          <div className="advanced-insight-hero-icon">
            ◈
          </div>

          <div className="advanced-insight-hero-copy">

            <span>
              PRIMARY SIGNAL
            </span>

            <h3>
              {
                advancedInsightSummary.title
              }
            </h3>

            <p>
              {
                advancedInsightSummary.explanation
              }
            </p>

          </div>

          <div className="advanced-insight-confidence">

            <span>
              CONFIDENCE
            </span>

            <strong>
              {
                advancedInsightSummary.confidence
              }%
            </strong>

          </div>

        </div>

        <div className="advanced-signal-grid">

          {advancedSignals.map(
            (signal) => (
              <div
                className="advanced-signal-card"
                key={signal.label}
              >

                <span>
                  {signal.label}
                </span>

                <strong>
                  {signal.value}
                  {signal.suffix || ""}
                </strong>

                <p>
                  {
                    signal.description
                  }
                </p>

              </div>
            )
          )}

        </div>

      </section>

      {/* =====================================================
          GOALS
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              STAGE 18 · GOALS
            </span>

            <h2>
              Performance goals
            </h2>

            <p>
              Track measurable
              targets from your
              current analytics profile.
            </p>
          </div>

          <div className="analytics-command-status">
            {completedGoals}/
            {goals.length} completed
          </div>

        </div>

        <div className="goals-grid">

          {goals.map((goal) => (
            <div
              className={`goal-card ${
                goal.completed
                  ? "goal-complete"
                  : ""
              }`}
              key={goal.id}
            >

              <div className="goal-card-header">

                <div>
                  <span>
                    {goal.title}
                  </span>

                  <strong>
                    {goal.current}
                    {goal.unit}
                  </strong>
                </div>

                <div className="goal-status">
                  {goal.completed
                    ? "✓"
                    : Math.round(
                        goal.progress
                      ) + "%"}
                </div>

              </div>

              <p>
                Target:{" "}
                {goal.target}
                {goal.unit}
              </p>

              <div className="goal-progress">

                <div
                  style={{
                    width: `${clamp(
                      goal.progress
                    )}%`,
                  }}
                />

              </div>

              <small>
                {goal.status}
              </small>

            </div>
          ))}

        </div>

      </section>

      {/* =====================================================
          SEASON PROGRESS
          ===================================================== */}

      <section className="analytics-section">

        <div className="season-progress-panel">

          <div>

            <span className="analytics-section-kicker">
              SEASON PROGRESS
            </span>

            <h2>
              {totalMatches}/
              {goalTargetMatches}
              {" "}
              matches
            </h2>

            <p>
              Current progress toward
              the 20-match development
              target.
            </p>

          </div>

          <strong>
            {Math.round(
              seasonProgress
            )}
            %
          </strong>

        </div>

        <div className="season-progress-bar">

          <div
            style={{
              width: `${seasonProgress}%`,
            }}
          />

        </div>

      </section>

      {/* =====================================================
          ACHIEVEMENTS
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-heading">

          <div>
            <span className="analytics-section-kicker">
              ACHIEVEMENT SYSTEM
            </span>

            <h2>
              Performance achievements
            </h2>

            <p>
              Milestones are unlocked
              automatically from your
              recorded performance.
            </p>
          </div>

          <div className="analytics-command-status">
            {unlockedAchievements}/
            {allAchievements.length}
          </div>

        </div>

        <div className="achievement-grid">

          {allAchievements.map(
            (achievement) => (
              <div
                className={`achievement-card ${
                  achievement.unlocked
                    ? "achievement-unlocked"
                    : "achievement-locked"
                }`}
                key={
                  achievement.id
                }
              >

                <div className="achievement-icon">
                  {achievement.unlocked
                    ? achievement.icon
                    : "🔒"}
                </div>

                <div>

                  <span>
                    {achievement.unlocked
                      ? "UNLOCKED"
                      : "LOCKED"}
                  </span>

                  <h3>
                    {
                      achievement.title
                    }
                  </h3>

                  <p>
                    {
                      achievement.text
                    }
                  </p>

                </div>

              </div>
            )
          )}

        </div>

      </section>

      {/* =====================================================
          COMPARISON
          ===================================================== */}

      {matches.length >= 2 && (
        <section className="analytics-section">

          <div className="analytics-section-heading">

            <div>
              <span className="analytics-section-kicker">
                MATCH COMPARISON
              </span>

              <h2>
                Compare performances
              </h2>
            </div>

          </div>

          <div className="comparison-controls">

            <select
              value={comparisonA}
              onChange={(event) =>
                setComparisonA(
                  event.target.value
                )
              }
            >
              {matches
                .filter(
                  (match) =>
                    (match.sport ||
                      "cricket") ===
                    selectedSport
                )
                .map((match) => (
                  <option
                    key={
                      match._id
                    }
                    value={
                      match._id
                    }
                  >
                    {match.date} —{" "}
                    {match.opponent ||
                      "Unknown"}
                  </option>
                ))}
            </select>

            <span>
              VS
            </span>

            <select
              value={comparisonB}
              onChange={(event) =>
                setComparisonB(
                  event.target.value
                )
              }
            >
              {matches
                .filter(
                  (match) =>
                    (match.sport ||
                      "cricket") ===
                    selectedSport
                )
                .map((match) => (
                  <option
                    key={
                      match._id
                    }
                    value={
                      match._id
                    }
                  >
                    {match.date} —{" "}
                    {match.opponent ||
                      "Unknown"}
                  </option>
                ))}
            </select>

          </div>

          {comparisonMatchA &&
            comparisonMatchB && (
              <div className="comparison-panel">

                <div className="comparison-match-header">

                  <div>
                    <span>
                      MATCH A
                    </span>

                    <strong>
                      {
                        comparisonMatchA.opponent
                      }
                    </strong>

                    <small>
                      {
                        comparisonMatchA.date
                      }
                    </small>
                  </div>

                  <div className="comparison-result">
                    VS
                  </div>

                  <div className="comparison-match-right">
                    <span>
                      MATCH B
                    </span>

                    <strong>
                      {
                        comparisonMatchB.opponent
                      }
                    </strong>

                    <small>
                      {
                        comparisonMatchB.date
                      }
                    </small>
                  </div>

                </div>

                <div className="comparison-grid">

                  {comparisonMetrics.map(
                    (metric) => {

                      const valueA =
                        getComparisonMetric(
                          comparisonMatchA,
                          metric.key
                        );

                      const valueB =
                        getComparisonMetric(
                          comparisonMatchB,
                          metric.key
                        );

                      const difference =
                        valueA -
                        valueB;

                      return (
                        <div
                          className="comparison-metric"
                          key={
                            metric.key
                          }
                        >

                          <span>
                            {
                              metric.label
                            }
                          </span>

                          <strong>
                            {round(
                              valueA,
                              1
                            )}
                            {" "}
                            vs{" "}
                            {round(
                              valueB,
                              1
                            )}
                          </strong>

                          <small>
                            Difference:{" "}
                            {difference >=
                            0
                              ? "+"
                              : ""}
                            {round(
                              difference,
                              1
                            )}
                          </small>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>
            )}

        </section>
      )}


      {/* =====================================================
          STAGE 23
          CONTEXT & MATCH-UP PATTERNS
          ===================================================== */}

      <section className="analytics-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">STAGE 23 · CONTEXT PATTERNS</span>
            <h2>Context-aware performance patterns</h2>
            <p>PlaySense compares your performance across opponents, results and opponent difficulty to identify repeatable match-up behaviour.</p>
          </div>
          <div className="analytics-command-status">{contextPatternSummary}</div>
        </div>

        <div className="pattern-engine-summary">
          <div className="pattern-engine-summary-icon">◇</div>
          <div>
            <span>CONTEXT ENGINE</span>
            <strong>{contextPatterns.length > 0 ? "Context patterns detected" : "Monitoring match context"}</strong>
            <p>{contextPatterns.length > 0 ? "Repeated opponent and result conditions have been identified in your match history." : "Record more matches against different opponents to increase contextual pattern depth."}</p>
          </div>
          <div className="pattern-engine-count"><strong>{contextPatterns.length}</strong><span>signals</span></div>
        </div>

        <div className="analytics-metric-grid">
          <div className="analytics-card"><span>CONTEXT SIGNALS</span><strong>{contextPatterns.length}</strong></div>
          <div className="analytics-card"><span>POSITIVE</span><strong>{contextPositiveCount}</strong></div>
          <div className="analytics-card"><span>PRESSURE</span><strong>{contextWarningCount}</strong></div>
          <div className="analytics-card"><span>OPPONENTS</span><strong>{opponentDifficultyData.length}</strong></div>
        </div>

        <div className="pattern-grid">
          {contextPatterns.map((pattern, index) => (
            <div className={`pattern-card pattern-${pattern.tone}`} key={`${pattern.type}-${pattern.opponent || "context"}-${index}`}>
              <div className="pattern-card-top"><div className="pattern-icon">{pattern.icon}</div><span>{Math.round(pattern.confidence)}% confidence</span></div>
              <h3>{pattern.title}</h3>
              <p>{pattern.description}</p>
              <div className="pattern-evidence"><span>EVIDENCE</span><strong>{pattern.evidence}</strong></div>
              <div className="pattern-confidence-bar"><div style={{width:`${clamp(pattern.confidence)}%`}} /></div>
              <div className="pattern-meta-row"><span>Severity</span><strong>{pattern.severity || "Observed"}</strong></div>
            </div>
          ))}
          {contextPatterns.length === 0 && (
            <div className="pattern-empty-card"><strong>No strong context pattern yet</strong><p>PlaySense needs repeated matchups and results before making stronger opponent-aware observations.</p></div>
          )}
        </div>
      </section>

      <section className="analytics-section">
        <div className="analytics-section-heading"><div><span className="analytics-section-kicker">CONTEXT INTERPRETATION</span><h2>What changes with match context?</h2></div></div>
        <div className="advanced-insights-grid">
          <div className="advanced-insight-card"><span>STRONGEST SIGNAL</span><strong>{strongestContextPattern ? strongestContextPattern.title : "Not enough evidence"}</strong><p>{strongestContextPattern ? strongestContextPattern.description : "Record more matches to establish a reliable context pattern."}</p></div>
          <div className="advanced-insight-card"><span>OPPONENT CONTEXT</span><strong>{opponentDifficultyData.length > 0 ? `${opponentDifficultyData.length} opponents tracked` : "No opponent data"}</strong><p>{opponentDifficultyData.length > 0 ? "PlaySense uses repeated opponent history to separate general performance from matchup-specific behaviour." : "Opponent names are required to build matchup-specific patterns."}</p></div>
          <div className="advanced-insight-card"><span>RESULT CONTEXT</span><strong>{wins} wins · {losses} losses</strong><p>Results are compared with performance scores to identify whether individual output and match outcomes move together.</p></div>
          <div className="advanced-insight-card"><span>SPORT MODEL</span><strong>{selectedSport === "cricket" ? "Cricket context" : "Football context"}</strong><p>{selectedSport === "cricket" ? "Context patterns use runs, strike-rate, boundaries and wickets through the existing performance model." : "Context patterns use goals, assists, shots, accuracy and passing through the existing performance model."}</p></div>
        </div>
      </section>

      {/* =====================================================
          STAGE 24
          ACTIONABLE PERFORMANCE PLAN
          ===================================================== */}

      <section className="analytics-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">
              STAGE 24 · ACTION PLAN
            </span>
            <h2>What should you work on next?</h2>
            <p>
              PlaySense converts your current form, weaknesses, matchup context and trend signals into practical next actions.
            </p>
          </div>
          <div className="analytics-command-status">
            {recommendationSummary}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {actionRecommendations.map((recommendation) => {
            const tone =
              recommendation.tone === "positive"
                ? { border: "rgba(74,222,128,0.28)", bg: "rgba(74,222,128,0.06)", accent: "#4ade80" }
                : recommendation.tone === "warning"
                ? { border: "rgba(248,113,113,0.28)", bg: "rgba(248,113,113,0.06)", accent: "#f87171" }
                : { border: "rgba(103,232,249,0.22)", bg: "rgba(103,232,249,0.05)", accent: "#67e8f9" };

            return (
              <div
                key={recommendation.id}
                style={{
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  borderRadius: "16px",
                  padding: "20px",
                  minHeight: "190px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: tone.accent, fontSize: "24px", fontWeight: 800 }}>
                    {recommendation.icon}
                  </span>
                  <span style={{ color: tone.accent, fontSize: "11px", fontWeight: 800, letterSpacing: "0.12em" }}>
                    {recommendation.priority} PRIORITY
                  </span>
                </div>

                <strong style={{ fontSize: "18px", color: "#f4f7fb" }}>
                  {recommendation.title}
                </strong>

                <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
                  {recommendation.action}
                </p>

                <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                  <span style={{ display: "block", color: "#64748b", fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", marginBottom: "5px" }}>
                    WHY THIS APPEARS
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                    {recommendation.evidence}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="analytics-panel" style={{ marginTop: "18px" }}>
          <span className="analytics-section-kicker">
            DECISION SUPPORT
          </span>
          <h3 style={{ margin: "8px 0" }}>
            Recommendations are evidence-driven, not permanent ratings.
          </h3>
          <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.7 }}>
            These actions are recalculated whenever your match history, sport selection or performance context changes. Record additional matches to test whether the same signals continue to appear.
          </p>
        </div>
      </section>


      {/* =====================================================
          STAGE 25
          PERFORMANCE READINESS & RISK
          ===================================================== */}

      <section className="analytics-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">
              STAGE 25 · READINESS ENGINE
            </span>
            <h2>Performance readiness & risk</h2>
            <p>
              PlaySense combines health, form, consistency, efficiency, development and match context to estimate how prepared your current profile is for the next performance environment.
            </p>
          </div>
          <div className="analytics-command-status">
            {readinessSummary}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 0.9fr) minmax(280px, 1.5fr)",
            gap: "18px",
          }}
        >
          <div
            className="analytics-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: "260px",
            }}
          >
            <span className="analytics-section-kicker">
              READINESS SCORE
            </span>
            <strong
              style={{
                fontSize: "64px",
                lineHeight: 1,
                margin: "14px 0 8px",
                color:
                  readinessAssessment.readinessTone === "positive"
                    ? "#4ade80"
                    : readinessAssessment.readinessTone === "warning"
                    ? "#f87171"
                    : "#67e8f9",
              }}
            >
              {readinessAssessment.readinessScore}
            </strong>
            <h3 style={{ margin: 0 }}>
              {readinessAssessment.readinessLabel}
            </h3>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              Based on the current evidence available in your {selectedSport} profile.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {readinessAssessment.readinessEvidence.map((item) => (
                <span
                  key={item}
                  style={{
                    border: "1px solid rgba(148,163,184,0.16)",
                    borderRadius: "999px",
                    padding: "6px 9px",
                    color: "#94a3b8",
                    fontSize: "11px",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div
            className="analytics-panel"
            style={{ minHeight: "260px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div className="analytics-card">
                <span>RISK SIGNALS</span>
                <strong>{readinessAssessment.warningCount}</strong>
              </div>
              <div className="analytics-card">
                <span>POSITIVE</span>
                <strong>{readinessAssessment.positiveCount}</strong>
              </div>
              <div className="analytics-card">
                <span>HIGH SEVERITY</span>
                <strong>{readinessAssessment.highSeverityCount}</strong>
              </div>
            </div>

            <span className="analytics-section-kicker">
              PRIMARY READINESS SIGNAL
            </span>
            <h3 style={{ margin: "8px 0" }}>
              {readinessAssessment.primaryRisk
                ? readinessAssessment.primaryRisk.title
                : "No major readiness risk detected"}
            </h3>
            <p style={{ color: "#94a3b8", lineHeight: 1.65 }}>
              {readinessAssessment.primaryRisk
                ? readinessAssessment.primaryRisk.description
                : "The current profile does not contain a high-severity warning. Continue collecting evidence and maintain the behaviours supporting your strongest areas."}
            </p>

            {readinessAssessment.primaryRisk && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.16)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#64748b",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    marginBottom: "5px",
                  }}
                >
                  EVIDENCE
                </span>
                <span style={{ color: "#cbd5e1", fontSize: "13px" }}>
                  {readinessAssessment.primaryRisk.evidence}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginTop: "18px",
          }}
        >
          {readinessAssessment.signals.map((signal) => {
            const tone =
              signal.tone === "positive"
                ? {
                    border: "rgba(74,222,128,0.22)",
                    bg: "rgba(74,222,128,0.05)",
                    accent: "#4ade80",
                  }
                : signal.tone === "warning"
                ? {
                    border: "rgba(248,113,113,0.22)",
                    bg: "rgba(248,113,113,0.05)",
                    accent: "#f87171",
                  }
                : {
                    border: "rgba(103,232,249,0.18)",
                    bg: "rgba(103,232,249,0.04)",
                    accent: "#67e8f9",
                  };

            return (
              <div
                key={signal.id}
                style={{
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  borderRadius: "16px",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ color: tone.accent, fontSize: "22px", fontWeight: 800 }}>
                    {signal.icon}
                  </span>
                  <span style={{ color: tone.accent, fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em" }}>
                    {signal.severity}
                  </span>
                </div>
                <h3 style={{ margin: "12px 0 7px" }}>
                  {signal.title}
                </h3>
                <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.6 }}>
                  {signal.description}
                </p>
                <div style={{ marginTop: "12px", color: "#64748b", fontSize: "12px" }}>
                  {signal.evidence}
                </div>
              </div>
            );
          })}

          {readinessAssessment.signals.length === 0 && (
            <div className="pattern-empty-card">
              <strong>Readiness signals are still forming</strong>
              <p>
                Record more matches so PlaySense can establish a stronger readiness baseline.
              </p>
            </div>
          )}
        </div>

        <div className="analytics-panel" style={{ marginTop: "18px" }}>
          <span className="analytics-section-kicker">
            HOW TO USE THIS SIGNAL
          </span>
          <h3 style={{ margin: "8px 0" }}>
            Readiness is a planning indicator, not a prediction.
          </h3>
          <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.7 }}>
            Use the highest-severity signals to decide what deserves attention before the next match. The score is recalculated from your recorded evidence and should become more informative as your match history grows.
          </p>
        </div>
      </section>

      {/* =====================================================
          STAGE 26
          NEXT-MATCH SCENARIO PLANNING
          ===================================================== */}

      <section className="analytics-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">
              STAGE 26 · SCENARIO ENGINE
            </span>
            <h2>Next-match scenario planning</h2>
            <p>
              PlaySense models baseline, strong-execution and pressure scenarios from your existing performance evidence.
            </p>
          </div>
          <div className="analytics-command-status">
            {scenarioPlanning.planningLabel}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          <div className="analytics-panel">
            <span className="analytics-section-kicker">
              PLANNING CONFIDENCE
            </span>
            <strong style={{ display: "block", fontSize: "36px", marginTop: "8px", color: "#67e8f9" }}>
              {scenarioPlanning.planningConfidence}%
            </strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              {scenarioPlanning.planningLabel} from {sportMatches.length} recorded {sportMatches.length === 1 ? "match" : "matches"}.
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">
              MATCH CONTEXT
            </span>
            <h3 style={{ margin: "8px 0" }}>
              {scenarioPlanning.opponentLabel}
            </h3>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              Difficulty: {Math.round(scenarioPlanning.difficultyScore)}/100 · Win rate: {Math.round(scenarioPlanning.opponentWinRate)}%
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">
              CURRENT BASELINE
            </span>
            <strong style={{ display: "block", fontSize: "30px", marginTop: "8px" }}>
              {scenarioPlanning.baseScore}/100
            </strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              Combined from form, health, consistency, efficiency, development and forecast evidence.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginTop: "18px",
          }}
        >
          {scenarioPlanning.scenarios.map((scenario) => {
            const tone =
              scenario.tone === "positive"
                ? { border: "rgba(74,222,128,0.22)", bg: "rgba(74,222,128,0.05)", accent: "#4ade80" }
                : scenario.tone === "warning"
                ? { border: "rgba(248,113,113,0.22)", bg: "rgba(248,113,113,0.05)", accent: "#f87171" }
                : { border: "rgba(103,232,249,0.18)", bg: "rgba(103,232,249,0.04)", accent: "#67e8f9" };

            return (
              <div
                key={scenario.id}
                style={{
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  borderRadius: "16px",
                  padding: "18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: tone.accent, fontSize: "22px", fontWeight: 800 }}>{scenario.icon}</span>
                  <span style={{ color: tone.accent, fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em" }}>
                    SCENARIO
                  </span>
                </div>
                <h3 style={{ margin: "12px 0 7px" }}>{scenario.label}</h3>
                <strong style={{ display: "block", fontSize: "30px", color: tone.accent }}>
                  {scenario.score}/100
                </strong>
                {scenarioPlanning.averageOutput > 0 && (
                  <span style={{ color: "#cbd5e1", fontSize: "13px" }}>
                    Estimated output: {scenario.estimatedOutput}
                  </span>
                )}
                <p style={{ marginTop: "10px", color: "#94a3b8", lineHeight: 1.6 }}>
                  {scenario.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="analytics-panel" style={{ marginTop: "18px" }}>
          <span className="analytics-section-kicker">
            PLANNING INTERPRETATION
          </span>
          <h3 style={{ margin: "8px 0" }}>
            Prepare around the gap between baseline and pressure scenarios.
          </h3>
          <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.7 }}>
            The scenario engine does not predict a match result. It shows how your existing performance evidence changes under different execution and pressure conditions, so the readiness and action-plan signals can be used before the next performance environment.
          </p>
        </div>
      </section>

      {/* =====================================================
          STAGE 27
          POST-MATCH REVIEW & LEARNING
          ===================================================== */}

      <section className="analytics-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">
              STAGE 27 · REVIEW ENGINE
            </span>
            <h2>Post-match review & learning</h2>
            <p>
              Turn the latest match into a structured lesson by comparing its output, performance quality and result with your established baseline.
            </p>
          </div>
          <div className="analytics-command-status">
            {postMatchReview.reviewConfidence}% evidence
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <div className="analytics-panel">
            <span className="analytics-section-kicker">LATEST MATCH</span>
            <h3 style={{ margin: "8px 0" }}>{postMatchReview.opponent}</h3>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 0 }}>
              {postMatchReview.resultImpact} · {postMatchReview.result}
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">PERFORMANCE SCORE</span>
            <strong style={{ display: "block", fontSize: "34px", marginTop: "8px", color: "#67e8f9" }}>
              {Math.round(postMatchReview.score)}/100
            </strong>
            <p style={{ color: "#94a3b8", marginBottom: 0 }}>
              {postMatchReview.scoreGap >= 0 ? "+" : ""}{postMatchReview.scoreGap} vs baseline
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">MATCH OUTPUT</span>
            <strong style={{ display: "block", fontSize: "34px", marginTop: "8px" }}>
              {postMatchReview.output}
            </strong>
            <p style={{ color: "#94a3b8", marginBottom: 0 }}>
              {postMatchReview.outputGap >= 0 ? "+" : ""}{postMatchReview.outputGap}% vs baseline
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">REVIEW CONFIDENCE</span>
            <strong style={{ display: "block", fontSize: "34px", marginTop: "8px", color: "#a78bfa" }}>
              {postMatchReview.reviewConfidence}%
            </strong>
            <p style={{ color: "#94a3b8", marginBottom: 0 }}>
              Based on match-history depth and current readiness evidence.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "18px",
          }}
        >
          <div className="analytics-panel">
            <span className="analytics-section-kicker">WHAT WORKED</span>
            {postMatchReview.positives.map((item, index) => (
              <div key={index} style={{ padding: "10px 0", borderBottom: index < postMatchReview.positives.length - 1 ? "1px solid rgba(148,163,184,0.10)" : "none" }}>
                <strong style={{ color: "#4ade80" }}>✓</strong>
                <span style={{ color: "#cbd5e1", marginLeft: "10px", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">WHAT TO REVIEW</span>
            {postMatchReview.focusAreas.map((item, index) => (
              <div key={index} style={{ padding: "10px 0", borderBottom: index < postMatchReview.focusAreas.length - 1 ? "1px solid rgba(148,163,184,0.10)" : "none" }}>
                <strong style={{ color: "#fb923c" }}>→</strong>
                <span style={{ color: "#cbd5e1", marginLeft: "10px", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-panel" style={{ marginTop: "18px" }}>
          <span className="analytics-section-kicker">MATCH LESSON</span>
          <h3 style={{ margin: "8px 0" }}>{postMatchReview.lesson}</h3>
          <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: 0 }}>
            Next priority: {postMatchReview.nextPriority}
          </p>
        </div>
      </section>

      {/* =====================================================
          STAGE 28
          PREPARATION & TRAINING FOCUS
          ===================================================== */}

      <section className="analytics-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">
              STAGE 28 · PREPARATION ENGINE
            </span>
            <h2>Training focus & preparation plan</h2>
            <p>
              Convert the latest review, readiness signals and scenario evidence into a focused preparation plan for the next performance environment.
            </p>
          </div>
          <div className="analytics-command-status">
            {preparationPlan.preparationConfidence}% evidence
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <div className="analytics-panel">
            <span className="analytics-section-kicker">SESSION INTENSITY</span>
            <h3 style={{ margin: "8px 0" }}>{preparationPlan.sessionIntensity}</h3>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 0 }}>
              Intensity is based on readiness, recent form and performance movement.
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">PRIMARY FOCUS</span>
            <h3 style={{ margin: "8px 0" }}>{preparationPlan.primaryFocus.title}</h3>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 0 }}>
              {preparationPlan.primaryFocus.reason}
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">PRESSURE GAP</span>
            <strong style={{ display: "block", fontSize: "34px", marginTop: "8px", color: "#fb923c" }}>
              {preparationPlan.scenarioGap} pts
            </strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 0 }}>
              Difference between baseline and pressure scenarios.
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">READINESS RISK</span>
            <h3 style={{ margin: "8px 0" }}>{preparationPlan.riskTitle}</h3>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 0 }}>
              Use this signal to decide what deserves attention before the next match.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "18px",
          }}
        >
          {preparationPlan.focusItems.map((item, index) => {
            const accent =
              item.tone === "warning"
                ? "#fb923c"
                : item.tone === "positive"
                ? "#4ade80"
                : "#67e8f9";

            return (
              <div
                className="analytics-panel"
                key={`${item.title}-${index}`}
                style={{ borderColor: `${accent}33` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span className="analytics-section-kicker">{item.priority} PRIORITY</span>
                  <strong style={{ color: accent }}>●</strong>
                </div>
                <h3 style={{ margin: "8px 0" }}>{item.title}</h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>{item.detail}</p>
                <small style={{ color: "#64748b" }}>{item.reason}</small>
              </div>
            );
          })}
        </div>

        <div className="analytics-panel" style={{ marginTop: "18px" }}>
          <span className="analytics-section-kicker">MATCHDAY CUE</span>
          <h3 style={{ margin: "8px 0" }}>Keep the preparation simple enough to execute under pressure.</h3>
          <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: 0 }}>
            {preparationPlan.matchdayCue}
          </p>
        </div>
      </section>

      {/* =====================================================
          STAGE 29
          FRONTEND STABILITY & VALIDATION
          ===================================================== */}

      <section className="analytics-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">
              STAGE 29 · VALIDATION
            </span>
            <h2>Analytics stability & validation</h2>
            <p>
              PlaySense checks the active sport data and analytics engines before using their signals for decision support.
            </p>
          </div>

          <div className="analytics-command-status">
            {stabilityReport.stabilityLabel}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
          }}
        >
          <div className="analytics-panel">
            <span className="analytics-section-kicker">
              STABILITY SCORE
            </span>
            <strong
              style={{
                display: "block",
                fontSize: "36px",
                marginTop: "8px",
                color:
                  stabilityReport.stabilityScore >= 90
                    ? "#4ade80"
                    : stabilityReport.stabilityScore >= 70
                    ? "#facc15"
                    : "#f87171",
              }}
            >
              {stabilityReport.stabilityScore}/100
            </strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              {stabilityReport.healthyCount} of {stabilityReport.engineChecks.length} validation checks are healthy.
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">
              ACTIVE DATA
            </span>
            <strong
              style={{
                display: "block",
                fontSize: "30px",
                marginTop: "8px",
              }}
            >
              {stabilityReport.activeMatches}
            </strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              {selectedSport} matches currently feeding the analytics engine.
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">
              DATA QUALITY
            </span>
            <strong
              style={{
                display: "block",
                fontSize: "30px",
                marginTop: "8px",
              }}
            >
              {stabilityReport.validDates}/{stabilityReport.activeMatches}
            </strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              Active matches have usable chronological dates.
            </p>
          </div>

          <div className="analytics-panel">
            <span className="analytics-section-kicker">
              OUTCOME DATA
            </span>
            <strong
              style={{
                display: "block",
                fontSize: "30px",
                marginTop: "8px",
              }}
            >
              {stabilityReport.validResults}/{stabilityReport.activeMatches}
            </strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              Active matches have valid Won, Lost or Draw results.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginTop: "18px",
          }}
        >
          {stabilityReport.engineChecks.map((check) => {
            const healthy = check.status === "Healthy";
            const accent = healthy ? "#4ade80" : "#facc15";

            return (
              <div
                className="analytics-panel"
                key={check.key}
                style={{
                  borderColor: `${accent}33`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span className="analytics-section-kicker">
                    {check.label}
                  </span>
                  <strong style={{ color: accent }}>
                    {healthy ? "✓" : "!"}
                  </strong>
                </div>

                <h3 style={{ margin: "8px 0" }}>
                  {check.status}
                </h3>

                <p
                  style={{
                    color: "#94a3b8",
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  {check.detail}
                </p>
              </div>
            );
          })}
        </div>

        <div className="analytics-panel" style={{ marginTop: "18px" }}>
          <span className="analytics-section-kicker">
            VALIDATION NOTES
          </span>

          <div
            style={{
              display: "grid",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            {stabilityReport.recommendations.map(
              (recommendation, index) => (
                <div
                  key={`${recommendation}-${index}`}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "rgba(103,232,249,0.04)",
                    border: "1px solid rgba(103,232,249,0.12)",
                    color: "#cbd5e1",
                    lineHeight: 1.6,
                  }}
                >
                  {recommendation}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          ENGINE HEALTH
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-panel analytics-engine-summary">

          <div className="analytics-section-kicker">
            ANALYTICS ENGINE
          </div>

          <h2>
            PlaySense Intelligence
            Summary
          </h2>

          <p>
            Your current{" "}
            {selectedSport} profile
            is built from{" "}
            {totalMatches} recorded
            match
            {totalMatches === 1
              ? ""
              : "es"}
            , combining output,
            efficiency, consistency,
            results, opponent
            difficulty, form,
            development,
            forecasting, goals,
            achievements and
            performance pattern
            detection, trend momentum,
            context-aware match-up analysis,
            actionable recommendations and
            performance readiness monitoring.
          </p>

          <div className="analytics-engine-grid">

            <div>
              <span>
                HEALTH
              </span>

              <strong>
                {healthScore}/100
              </strong>
            </div>

            <div>
              <span>
                FORM
              </span>

              <strong>
                {currentFormScore}/100
              </strong>
            </div>

            <div>
              <span>
                DEVELOPMENT
              </span>

              <strong>
                {developmentIndex}/100
              </strong>
            </div>

            <div>
              <span>
                CONSISTENCY
              </span>

              <strong>
                {consistencyIndex}/100
              </strong>
            </div>

            <div>
              <span>
                EFFICIENCY
              </span>

              <strong>
                {efficiencyIndex}/100
              </strong>
            </div>

            <div>
              <span>
                PATTERNS
              </span>

              <strong>
                {patterns.length}
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          VALIDATION
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-panel analytics-validation-panel">

          <div>
            <span className="analytics-section-kicker">
              STAGE 20 · VALIDATION
            </span>

            <h2>
              Analytics system status
            </h2>
          </div>

          <div className="validation-grid">

            <div>
              <span>
                MATCH DATA
              </span>

              <strong>
                ✓ Loaded
              </strong>
            </div>

            <div>
              <span>
                SPORT ENGINE
              </span>

              <strong>
                ✓ Active
              </strong>
            </div>

            <div>
              <span>
                FORECAST ENGINE
              </span>

              <strong>
                ✓ Active
              </strong>
            </div>

            <div>
              <span>
                PATTERN ENGINE
              </span>

              <strong>
                ✓ Active
              </strong>
            </div>

            <div>
              <span>
                GOAL ENGINE
              </span>

              <strong>
                ✓ Active
              </strong>
            </div>

            <div>
              <span>
                DEVELOPMENT ENGINE
              </span>

              <strong>
                ✓ Active
              </strong>
            </div>

            <div>
              <span>
                RECOMMENDATION ENGINE
              </span>

              <strong>
                ✓ Active
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          STAGE 30
          RESPONSIVE EXPERIENCE STATUS
          ===================================================== */}

      <section className="analytics-section">
        <div className="analytics-panel">
          <span className="analytics-section-kicker">
            STAGE 30 · RESPONSIVE EXPERIENCE
          </span>
          <h2>Built for every screen</h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>
            The Analytics workspace now adapts its information density, controls, cards and charts for desktop, tablet and mobile layouts without changing the underlying analytics calculations.
          </p>

          <div
            className="analytics-metric-grid"
            style={{ marginTop: "18px" }}
          >
            <div className="analytics-card">
              <span>DESKTOP</span>
              <strong>✓ Optimized</strong>
              <p style={{ color: "#94a3b8" }}>
                Full-width dashboards, charts and multi-column intelligence panels.
              </p>
            </div>

            <div className="analytics-card">
              <span>TABLET</span>
              <strong>✓ Optimized</strong>
              <p style={{ color: "#94a3b8" }}>
                Two-column information density with flexible controls and cards.
              </p>
            </div>

            <div className="analytics-card">
              <span>MOBILE</span>
              <strong>✓ Optimized</strong>
              <p style={{ color: "#94a3b8" }}>
                Single-column flow, full-width actions and horizontally scrollable data tables.
              </p>
            </div>

            <div className="analytics-card">
              <span>CHARTS</span>
              <strong>✓ Protected</strong>
              <p style={{ color: "#94a3b8" }}>
                Responsive containers prevent charts from forcing horizontal page overflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ROADMAP
          ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-panel analytics-roadmap">

          <div className="analytics-section-kicker">
            PERFORMANCE INTELLIGENCE
            ROADMAP
          </div>

          <h2>
            Intelligence modules
          </h2>

          <div className="analytics-roadmap-grid">

            <div>
              <span>
                01
              </span>

              <strong>
                Forecasting
              </strong>

              <p>
                Estimate future
                performance trends.
              </p>
            </div>

            <div>
              <span>
                02
              </span>

              <strong>
                Match Difficulty
              </strong>

              <p>
                Analyse opponent
                performance environments.
              </p>
            </div>

            <div>
              <span>
                03
              </span>

              <strong>
                Form Detection
              </strong>

              <p>
                Detect hot, cold and
                recovery periods.
              </p>
            </div>

            <div>
              <span>
                04
              </span>

              <strong>
                Development
              </strong>

              <p>
                Track long-term player
                progress.
              </p>
            </div>

            <div>
              <span>
                05
              </span>

              <strong>
                Goals
              </strong>

              <p>
                Track measurable
                performance targets.
              </p>
            </div>

            <div>
              <span>
                06
              </span>

              <strong>
                Pattern Detection
              </strong>

              <p>
                Detect recurring
                performance behaviour.
              </p>
            </div>

            <div>
              <span>
                07
              </span>

              <strong>
                Action Plan
              </strong>

              <p>
                Convert performance signals into practical next actions.
              </p>
            </div>

            <div>
              <span>
                08
              </span>

              <strong>
                Readiness & Risk
              </strong>

              <p>
                Monitor preparation signals before the next performance environment.
              </p>
            </div>

            <div>
              <span>
                10
              </span>

              <strong>
                Post-Match Review
              </strong>

              <p>
                Convert the latest match into structured lessons and review priorities.
              </p>
            </div>

            <div>
              <span>
                11
              </span>

              <strong>
                Training Focus
              </strong>

              <p>
                Convert readiness and review signals into a focused preparation plan.
              </p>
            </div>

            <div>
              <span>
                09
              </span>

              <strong>
                Scenario Planning
              </strong>

              <p>
                Model baseline, strong-execution and pressure conditions before the next match.
              </p>
            </div>

            <div>
              <span>
                12
              </span>

              <strong>
                Stability & Validation
              </strong>

              <p>
                Validate active match data and analytics engines before final testing and deployment.
              </p>
            </div>

            <div>
              <span>
                13
              </span>

              <strong>
                Responsive Experience
              </strong>

              <p>
                Adapt the analytics workspace for desktop, tablet and mobile use.
              </p>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Analytics;   