import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  apiDelete,
  apiGet,
} from "../utils/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function Dashboard() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [selectedSport, setSelectedSport] =
    useState("cricket");

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(
    localStorage.getItem(
      "playsense_user"
    ) || "null"
  );

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet("/matches");

      setMatches(
        Array.isArray(data) ? data : []
      );
    } catch (fetchError) {
      console.error(
        "Dashboard API error:",
        fetchError
      );

      if (fetchError?.status === 401) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setError(
        fetchError?.message ||
          "Unable to load your matches."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    const handleMatchesUpdated =
      () => {
        fetchMatches();
      };

    window.addEventListener(
      "matchesUpdated",
      handleMatchesUpdated
    );

    return () => {
      window.removeEventListener(
        "matchesUpdated",
        handleMatchesUpdated
      );
    };
  }, []);

  const sportMatches = useMemo(() => {
    return matches.filter(
      (match) =>
        (match.sport || "cricket") ===
        selectedSport
    );
  }, [
    matches,
    selectedSport,
  ]);

  const filteredMatches = useMemo(() => {
    return sportMatches.filter(
      (match) => {
        const opponent =
          match.opponent
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            );

        const resultMatch =
          resultFilter === "All" ||
          match.result === resultFilter;

        return (
          opponent &&
          resultMatch
        );
      }
    );
  }, [
    sportMatches,
    search,
    resultFilter,
  ]);

  const getOutput = (match) => {
    if (
      (match.sport || "cricket") ===
      "football"
    ) {
      return (
        (Number(match.goals) || 0) +
        (Number(match.assists) || 0)
      );
    }

    return Number(match.runs) || 0;
  };

  const getPerformanceScore = (
    match
  ) => {
    if (
      (match.sport || "cricket") ===
      "football"
    ) {
      const goals =
        Number(match.goals) || 0;

      const assists =
        Number(match.assists) || 0;

      const shots =
        Number(match.shots) || 0;

      const shotsOnTarget =
        Number(
          match.shotsOnTarget
        ) || 0;

      const passAccuracy =
        Number(
          match.passAccuracy
        ) || 0;

      const shotAccuracy =
        shots > 0
          ? (shotsOnTarget /
              shots) *
            100
          : 0;

      const attacking =
        Math.min(
          100,
          (goals + assists) * 20
        );

      return Math.round(
        Math.min(
          100,
          attacking * 0.45 +
            shotAccuracy * 0.3 +
            passAccuracy * 0.25
        )
      );
    }

    const runs =
      Number(match.runs) || 0;

    const balls =
      Number(match.balls) || 0;

    const fours =
      Number(match.fours) || 0;

    const sixes =
      Number(match.sixes) || 0;

    const wickets =
      Number(match.wickets) || 0;

    const strikeRate =
      balls > 0
        ? (runs / balls) *
          100
        : 0;

    const boundaryRuns =
      fours * 4 +
      sixes * 6;

    const boundaryContribution =
      runs > 0
        ? Math.min(
            100,
            (boundaryRuns /
              runs) *
              100
          )
        : 0;

    const scoring =
      Math.min(
        100,
        runs * 1.2
      );

    const bowling =
      Math.min(
        100,
        wickets * 20
      );

    return Math.round(
      Math.min(
        100,
        scoring * 0.35 +
          Math.min(
            100,
            strikeRate
          ) *
            0.3 +
          boundaryContribution *
            0.15 +
          bowling * 0.2
      )
    );
  };

  const analytics = useMemo(() => {
    if (!sportMatches.length) {
      return {
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        averageOutput: 0,
        averageScore: 0,
        bestScore: 0,
        bestOutput: 0,
        consistency: 0,
        recentAverage: 0,
        previousAverage: 0,
        improvement: 0,
      };
    }

    const outputs =
      sportMatches.map(
        getOutput
      );

    const scores =
      sportMatches.map(
        getPerformanceScore
      );

    const wins =
      sportMatches.filter(
        (match) =>
          match.result ===
          "Won"
      ).length;

    const losses =
      sportMatches.filter(
        (match) =>
          match.result ===
          "Lost"
      ).length;

    const draws =
      sportMatches.filter(
        (match) =>
          match.result ===
          "Draw"
      ).length;

    const averageOutput =
      outputs.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      outputs.length;

    const averageScore =
      scores.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      scores.length;

    const bestScore =
      Math.max(...scores);

    const bestOutput =
      Math.max(...outputs);

    const variance =
      outputs.reduce(
        (sum, value) =>
          sum +
          Math.pow(
            value -
              averageOutput,
            2
          ),
        0
      ) /
      outputs.length;

    const standardDeviation =
      Math.sqrt(variance);

    const variation =
      averageOutput > 0
        ? (standardDeviation /
            averageOutput) *
          100
        : 0;

    const consistency =
      Math.max(
        0,
        Math.min(
          100,
          100 - variation
        )
      );

    const recentCount =
      Math.min(
        5,
        sportMatches.length
      );

    const recent =
      sportMatches.slice(
        0,
        recentCount
      );

    const previous =
      sportMatches.slice(
        recentCount,
        recentCount * 2
      );

    const recentAverage =
      recent.length
        ? recent.reduce(
            (sum, match) =>
              sum +
              getOutput(match),
            0
          ) /
          recent.length
        : 0;

    const previousAverage =
      previous.length
        ? previous.reduce(
            (sum, match) =>
              sum +
              getOutput(match),
            0
          ) /
          previous.length
        : 0;

    const improvement =
      previousAverage > 0
        ? ((recentAverage -
            previousAverage) /
            previousAverage) *
          100
        : 0;

    return {
      matches:
        sportMatches.length,

      wins,

      losses,

      draws,

      winRate:
        (wins /
          sportMatches.length) *
        100,

      averageOutput,

      averageScore,

      bestScore,

      bestOutput,

      consistency,

      recentAverage,

      previousAverage,

      improvement,
    };
  }, [sportMatches]);

  const trendData = useMemo(() => {
    return [...sportMatches]
      .reverse()
      .map(
        (match, index) => ({
          match:
            `M${index + 1}`,
          score:
            getPerformanceScore(
              match
            ),
          output:
            getOutput(match),
        })
      );
  }, [sportMatches]);

  const recentMatches =
    filteredMatches.slice(
      0,
      6
    );

  const handleDelete = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Delete this match?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await apiDelete(`/matches/${id}`);

      setMatches((previous) =>
        previous.filter(
          (match) => match._id !== id
        )
      );
    } catch (deleteError) {
      console.error(
        "Dashboard delete API error:",
        deleteError
      );

      if (deleteError?.status === 401) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setError(
        deleteError?.message ||
          "Unable to delete match."
      );
    }
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "Unknown date";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatOutput = (
    match
  ) => {
    if (
      (match.sport ||
        "cricket") ===
      "football"
    ) {
      return `${match.goals || 0} G · ${
        match.assists || 0
      } A`;
    }

    return `${match.runs || 0} runs`;
  };

  const getImprovementClass =
    () => {
      if (
        analytics.improvement >=
        5
      ) {
        return "positive";
      }

      if (
        analytics.improvement <=
        -5
      ) {
        return "negative";
      }

      return "neutral";
    };

  return (
    <div className="dashboard-page">

      <div className="dashboard-container">

        <div className="dashboard-header">

          <div>
            <div className="dashboard-kicker">
              PERFORMANCE OVERVIEW
            </div>

            <h1>
              Welcome back
              {user?.name
                ? `, ${user.name}`
                : ""}
            </h1>

            <p>
              Track your performance,
              understand your trends
              and identify where you
              can improve.
            </p>
          </div>

          <Link
            to={`/add-match?sport=${selectedSport}`}
            className="dashboard-add-button"
          >
            <span>＋</span>
            Add Match
          </Link>

        </div>

        <div className="dashboard-sport-switcher">

          <button
            className={
              selectedSport ===
              "cricket"
                ? "active"
                : ""
            }
            onClick={() =>
              setSelectedSport(
                "cricket"
              )
            }
          >
            🏏 Cricket
          </button>

          <button
            className={
              selectedSport ===
              "football"
                ? "active"
                : ""
            }
            onClick={() =>
              setSelectedSport(
                "football"
              )
            }
          >
            ⚽ Football
          </button>

        </div>

        {loading ? (
          <div className="dashboard-state-card">
            <div className="dashboard-loader" />
            <h3>
              Loading performance data
            </h3>
            <p>
              Preparing your
              performance dashboard...
            </p>
          </div>
        ) : error ? (
          <div className="dashboard-state-card error">
            <div className="state-icon">
              !
            </div>

            <h3>
              Something went wrong
            </h3>

            <p>
              {error}
            </p>

            <button
              className="dashboard-retry-button"
              onClick={
                fetchMatches
              }
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-metric-grid">

              <div className="dashboard-metric-card">

                <div className="metric-card-top">
                  <span>
                    PERFORMANCE
                  </span>

                  <div className="metric-icon cyan">
                    ◈
                  </div>
                </div>

                <strong>
                  {Math.round(
                    analytics.averageScore
                  )}
                </strong>

                <p>
                  Average performance score
                </p>

              </div>

              <div className="dashboard-metric-card">

                <div className="metric-card-top">
                  <span>
                    WIN RATE
                  </span>

                  <div className="metric-icon green">
                    ✓
                  </div>
                </div>

                <strong>
                  {analytics.winRate.toFixed(
                    1
                  )}
                  %
                </strong>

                <p>
                  {analytics.wins} wins from{" "}
                  {analytics.matches} matches
                </p>

              </div>

              <div className="dashboard-metric-card">

                <div className="metric-card-top">
                  <span>
                    AVERAGE OUTPUT
                  </span>

                  <div className="metric-icon orange">
                    ↗
                  </div>
                </div>

                <strong>
                  {analytics.averageOutput.toFixed(
                    1
                  )}
                </strong>

                <p>
                  {selectedSport ===
                  "cricket"
                    ? "Average runs per match"
                    : "Goals + assists per match"}
                </p>

              </div>

              <div className="dashboard-metric-card">

                <div className="metric-card-top">
                  <span>
                    CONSISTENCY
                  </span>

                  <div className="metric-icon violet">
                    ≋
                  </div>
                </div>

                <strong>
                  {Math.round(
                    analytics.consistency
                  )}
                </strong>

                <p>
                  Performance consistency index
                </p>

              </div>

            </div>

            <div className="dashboard-main-grid">

              <section className="dashboard-panel trend-panel">

                <div className="panel-header">

                  <div>
                    <span className="panel-eyebrow">
                      PERFORMANCE ENGINE
                    </span>

                    <h2>
                      Performance trend
                    </h2>
                  </div>

                  <Link
                    to="/analytics"
                    className="panel-link"
                  >
                    Full Analytics →
                  </Link>

                </div>

                {trendData.length >
                0 ? (
                  <div className="dashboard-chart">
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >
                      <LineChart
                        data={
                          trendData
                        }
                        margin={{
                          top: 10,
                          right: 10,
                          left: -20,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(148,163,184,0.10)"
                        />

                        <XAxis
                          dataKey="match"
                          stroke="#64748b"
                          tick={{
                            fill: "#94a3b8",
                            fontSize: 11,
                          }}
                        />

                        <YAxis
                          domain={[
                            0,
                            100,
                          ]}
                          stroke="#64748b"
                          tick={{
                            fill: "#94a3b8",
                            fontSize: 11,
                          }}
                        />

                        <Tooltip
                          contentStyle={{
                            background:
                              "#0f1728",
                            border:
                              "1px solid rgba(148,163,184,0.16)",
                            borderRadius:
                              "8px",
                            color:
                              "#f4f7fb",
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#67e8f9"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            fill: "#67e8f9",
                          }}
                          activeDot={{
                            r: 6,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="chart-empty">
                    Add matches to see your
                    performance trend.
                  </div>
                )}

              </section>

              <section className="dashboard-panel insight-panel">

                <div className="panel-header">

                  <div>
                    <span className="panel-eyebrow">
                      INTELLIGENCE
                    </span>

                    <h2>
                      Quick insights
                    </h2>
                  </div>

                </div>

                <div className="quick-insights">

                  <div className="quick-insight">

                    <div className="quick-insight-icon">
                      ★
                    </div>

                    <div>
                      <span>
                        BEST PERFORMANCE
                      </span>

                      <strong>
                        {Math.round(
                          analytics.bestScore
                        )}
                      </strong>

                      <p>
                        Highest match performance
                        score
                      </p>
                    </div>

                  </div>

                  <div className="quick-insight">

                    <div className="quick-insight-icon orange">
                      ↑
                    </div>

                    <div>
                      <span>
                        RECENT OUTPUT
                      </span>

                      <strong>
                        {analytics.recentAverage.toFixed(
                          1
                        )}
                      </strong>

                      <p>
                        Average across recent matches
                      </p>
                    </div>

                  </div>

                  <div className="quick-insight">

                    <div className="quick-insight-icon violet">
                      ◇
                    </div>

                    <div>
                      <span>
                        IMPROVEMENT
                      </span>

                      <strong
                        className={
                          getImprovementClass()
                        }
                      >
                        {analytics.improvement >=
                        0
                          ? "+"
                          : ""}
                        {analytics.improvement.toFixed(
                          1
                        )}
                        %
                      </strong>

                      <p>
                        Recent output vs previous period
                      </p>
                    </div>

                  </div>

                </div>

              </section>

            </div>

            <section className="dashboard-matches-panel">

              <div className="panel-header matches-panel-header">

                <div>
                  <span className="panel-eyebrow">
                    MATCH HISTORY
                  </span>

                  <h2>
                    Recent matches
                  </h2>
                </div>

                <div className="match-filters">

                  <input
                    type="text"
                    placeholder="Search opponent..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                  />

                  <select
                    value={
                      resultFilter
                    }
                    onChange={(event) =>
                      setResultFilter(
                        event.target.value
                      )
                    }
                  >
                    <option value="All">
                      All Results
                    </option>

                    <option value="Won">
                      Won
                    </option>

                    <option value="Lost">
                      Lost
                    </option>

                    <option value="Draw">
                      Draw
                    </option>
                  </select>

                </div>

              </div>

              {recentMatches.length ===
              0 ? (
                <div className="dashboard-empty">

                  <div className="empty-icon">
                    {selectedSport ===
                    "cricket"
                      ? "🏏"
                      : "⚽"}
                  </div>

                  <h3>
                    No {selectedSport} matches
                    found
                  </h3>

                  <p>
                    Add your first match to
                    start building your
                    performance history.
                  </p>

                  <Link
                    to={`/add-match?sport=${selectedSport}`}
                    className="dashboard-add-button"
                  >
                    Add First Match
                  </Link>

                </div>
              ) : (
                <div className="match-list">

                  {recentMatches.map(
                    (match) => {
                      const score =
                        getPerformanceScore(
                          match
                        );

                      return (
                        <div
                          className="dashboard-match-row"
                          key={
                            match._id
                          }
                        >

                          <div className="match-row-date">
                            <span>
                              {formatDate(
                                match.date
                              )}
                            </span>

                            <small>
                              {(
                                match.sport ||
                                "cricket"
                              ).toUpperCase()}
                            </small>
                          </div>

                          <div className="match-row-opponent">
                            <strong>
                              {match.opponent}
                            </strong>

                            <span>
                              {formatOutput(
                                match
                              )}
                            </span>
                          </div>

                          <div
                            className={`match-row-result ${
                              match.result
                                ?.toLowerCase()
                            }`}
                          >
                            {match.result}
                          </div>

                          <div className="match-row-score">

                            <span>
                              Score
                            </span>

                            <strong>
                              {score}
                            </strong>

                          </div>

                          <div className="match-row-actions">

                            <Link
                              to={`/match/${match._id}`}
                              className="row-view-button"
                            >
                              View
                            </Link>

                            <Link
                              to={`/match/${match._id}/edit`}
                              className="row-edit-button"
                            >
                              Edit
                            </Link>

                            <button
                              className="row-delete-button"
                              onClick={() =>
                                handleDelete(
                                  match._id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

          </>
        )}

      </div>

    </div>
  );
}

export default Dashboard;  