export const detectPatterns = (matches) => {
  if (!matches || matches.length < 5) {
    return [];
  }

  const patterns = [];

  // newest first
  const sorted = [...matches].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const recent5 = sorted.slice(0, 5);
  const recent10 = sorted.slice(0, 10);

  // ----------------------------
  // Average Rating
  // ----------------------------

  const avgRecent5 =
    recent5.reduce((sum, m) => sum + (m.rating || 0), 0) /
    recent5.length;

  const avgOlder5 =
    sorted.slice(5, 10).reduce((sum, m) => sum + (m.rating || 0), 0) /
    Math.max(sorted.slice(5, 10).length, 1);

  // ----------------------------
  // Improvement
  // ----------------------------

  if (avgRecent5 > avgOlder5 + 0.5) {
    patterns.push({
      type: "improving",
      title: "Performance Improving",
      description:
        "Your recent performances are better than previous matches.",
      confidence: Math.min(
        95,
        Math.round((avgRecent5 - avgOlder5) * 30)
      ),
      color: "#4caf50",
      icon: "📈",
    });
  }

  // ----------------------------
  // Decline
  // ----------------------------

  if (avgRecent5 < avgOlder5 - 0.5) {
    patterns.push({
      type: "declining",
      title: "Performance Declining",
      description:
        "Recent performances are below your earlier average.",
      confidence: Math.min(
        95,
        Math.round((avgOlder5 - avgRecent5) * 30)
      ),
      color: "#f44336",
      icon: "📉",
    });
  }

  // ----------------------------
  // Hot Streak
  // ----------------------------

  const hotStreak = recent5.filter(
    m => (m.rating || 0) >= 8
  ).length;

  if (hotStreak >= 4) {
    patterns.push({
      type: "hotStreak",
      title: "Hot Streak",
      description:
        "Excellent performances in recent matches.",
      confidence: 90,
      color: "#ff9800",
      icon: "🔥",
    });
  }

  // ----------------------------
  // Cold Streak
  // ----------------------------

  const coldStreak = recent5.filter(
    m => (m.rating || 0) <= 5
  ).length;

  if (coldStreak >= 4) {
    patterns.push({
      type: "coldStreak",
      title: "Cold Streak",
      description:
        "Several low-rated performances detected.",
      confidence: 85,
      color: "#2196f3",
      icon: "❄️",
    });
  }

  // ----------------------------
  // Consistency
  // ----------------------------

  const ratings = recent10.map(m => m.rating || 0);

  const avg =
    ratings.reduce((a, b) => a + b, 0) /
    ratings.length;

  const variance =
    ratings.reduce(
      (sum, r) => sum + Math.pow(r - avg, 2),
      0
    ) / ratings.length;

  const stdDev = Math.sqrt(variance);

  if (stdDev < 1) {
    patterns.push({
      type: "consistent",
      title: "Highly Consistent",
      description:
        "Your performances are very stable.",
      confidence: 90,
      color: "#9c27b0",
      icon: "🎯",
    });
  }

  if (stdDev > 2) {
    patterns.push({
      type: "volatile",
      title: "Inconsistent Form",
      description:
        "Performance fluctuates significantly.",
      confidence: 80,
      color: "#795548",
      icon: "⚡",
    });
  }

  // ----------------------------
  // Match Load
  // ----------------------------

  const last7Days = sorted.filter(m => {
    const diff =
      (new Date() - new Date(m.date)) /
      (1000 * 60 * 60 * 24);

    return diff <= 7;
  });

  if (last7Days.length >= 5) {
    patterns.push({
      type: "highLoad",
      title: "Heavy Match Load",
      description:
        "High number of matches recently.",
      confidence: 75,
      color: "#607d8b",
      icon: "🧠",
    });
  }

  return patterns;
}; 