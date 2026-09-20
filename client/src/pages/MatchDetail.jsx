import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { apiGet } from "../utils/api";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet(`/matches/${id}`);

      setMatch(data);
    } catch (err) {
      console.error(err);

      if (err?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err?.message ||
          "Unable to load this match."
      );
    } finally {
      setLoading(false);
    }
  };

  const sport =
    match?.sport || "cricket";

  /* =========================================================
     CRICKET ANALYSIS
     ========================================================= */

  const cricketAnalysis = useMemo(() => {
    if (!match || sport !== "cricket") {
      return null;
    }

    const runs = Number(match.runs || 0);
    const balls = Number(match.balls || 0);
    const fours = Number(match.fours || 0);
    const sixes = Number(match.sixes || 0);
    const wickets = Number(
      match.wickets || 0
    );

    const strikeRate =
      balls > 0
        ? (runs / balls) * 100
        : 0;

    const boundaryRuns =
      fours * 4 + sixes * 6;

    const boundaryContribution =
      runs > 0
        ? (boundaryRuns / runs) * 100
        : 0;

    const runsPerBall =
      balls > 0
        ? runs / balls
        : 0;

    const performanceScore = Math.round(
      clamp(strikeRate) * 0.45 +
        clamp(
          boundaryContribution
        ) *
          0.2 +
        clamp(wickets * 10) * 0.15 +
        (match.result === "Won"
          ? 20
          : match.result === "Draw"
          ? 10
          : 0)
    );

    return {
      runs,
      balls,
      fours,
      sixes,
      wickets,
      strikeRate,
      boundaryRuns,
      boundaryContribution,
      runsPerBall,
      performanceScore,
    };
  }, [match, sport]);

  /* =========================================================
     FOOTBALL ANALYSIS
     ========================================================= */

  const footballAnalysis = useMemo(() => {
    if (!match || sport !== "football") {
      return null;
    }

    const goals = Number(
      match.goals || 0
    );

    const assists = Number(
      match.assists || 0
    );

    const shots = Number(
      match.shots || 0
    );

    const shotsOnTarget = Number(
      match.shotsOnTarget || 0
    );

    const passes = Number(
      match.passes || 0
    );

    const passAccuracy = Number(
      match.passAccuracy || 0
    );

    const tackles = Number(
      match.tackles || 0
    );

    const interceptions = Number(
      match.interceptions || 0
    );

    const yellowCards = Number(
      match.yellowCards || 0
    );

    const redCards = Number(
      match.redCards || 0
    );

    const shotAccuracy =
      shots > 0
        ? (shotsOnTarget / shots) *
          100
        : 0;

    const shotConversion =
      shots > 0
        ? (goals / shots) * 100
        : 0;

    const attackingContribution =
      goals + assists;

    const performanceScore = Math.round(
      clamp(shotAccuracy) * 0.25 +
        clamp(shotConversion) * 0.25 +
        clamp(
          attackingContribution * 15
        ) *
          0.2 +
        clamp(passAccuracy) * 0.1 +
        clamp(tackles * 10) * 0.1 +
        (match.result === "Won"
          ? 10
          : match.result === "Draw"
          ? 5
          : 0)
    );

    return {
      goals,
      assists,
      shots,
      shotsOnTarget,
      passes,
      passAccuracy,
      tackles,
      interceptions,
      yellowCards,
      redCards,
      shotAccuracy,
      shotConversion,
      attackingContribution,
      performanceScore,
    };
  }, [match, sport]);

  /* =========================================================
     GENERAL PERFORMANCE INTERPRETATION
     ========================================================= */

  const performanceMessage = useMemo(() => {
    if (!match) return "";

    if (sport === "cricket") {
      if (
        cricketAnalysis.performanceScore >=
        80
      ) {
        return "A strong individual performance with effective scoring output.";
      }

      if (
        cricketAnalysis.performanceScore >=
        60
      ) {
        return "A productive performance with several positive indicators.";
      }

      if (
        cricketAnalysis.performanceScore >=
        40
      ) {
        return "A developing performance with clear opportunities to improve efficiency.";
      }

      return "This match provides useful areas to focus on in future performances.";
    }

    if (
      footballAnalysis.performanceScore >=
      80
    ) {
      return "A strong attacking and overall contribution in this match.";
    }

    if (
      footballAnalysis.performanceScore >=
      60
    ) {
      return "A productive contribution with several positive performance signals.";
    }

    if (
      footballAnalysis.performanceScore >=
      40
    ) {
      return "A developing performance with opportunities to improve match impact.";
    }

    return "This match provides useful areas to focus on in future performances.";
  }, [
    match,
    sport,
    cricketAnalysis,
    footballAnalysis,
  ]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-orb" />

        <p>
          Loading match intelligence...
        </p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="dashboard-container">

        <div className="error-message">
          {error ||
            "Match not found."}
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate("/dashboard")
          }
          style={{
            marginTop: "18px",
          }}
        >
          Back to Dashboard
        </button>

      </div>
    );
  }

  const performanceScore =
    sport === "cricket"
      ? cricketAnalysis.performanceScore
      : footballAnalysis.performanceScore;

  return (
    <div className="match-detail-page">

      <div className="match-detail-container">

        {/* =================================================
            TOP NAVIGATION
            ================================================= */}

        <div className="match-detail-topbar">

          <Link
            to="/dashboard"
            className="back-link"
          >
            ← Back to dashboard
          </Link>

          <div className="match-detail-actions">

            <Link
              to={`/match/${match._id}/edit`}
              className="edit-button"
            >
              Edit Match
            </Link>

          </div>

        </div>


        {/* =================================================
            MATCH HERO
            ================================================= */}

        <section className="match-hero">

          <div className="match-hero-left">

            <div className="match-sport-label">
              {sport === "cricket"
                ? "🏏 CRICKET MATCH"
                : "⚽ FOOTBALL MATCH"}
            </div>

            <h1>
              vs {match.opponent}
            </h1>

            <p>
              {match.date}
            </p>

          </div>

          <div className="match-hero-result">

            <span>
              MATCH RESULT
            </span>

            <strong
              className={`hero-result ${match.result?.toLowerCase()}`}
            >
              {match.result}
            </strong>

          </div>

        </section>


        {/* =================================================
            PERFORMANCE SCORE
            ================================================= */}

        <section className="match-performance-banner">

          <div>

            <span>
              PLAYSENSE PERFORMANCE SCORE
            </span>

            <h2>
              Individual Match Impact
            </h2>

            <p>
              {performanceMessage}
            </p>

          </div>

          <div className="match-score-ring">

            <div className="score-ring-inner">

              <strong>
                {performanceScore}
              </strong>

              <span>
                /100
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            CRICKET
            ================================================= */}

        {sport === "cricket" && (
          <>

            <div className="detail-section-heading">

              <span>
                BATTING PROFILE
              </span>

              <h2>
                Scoring performance
              </h2>

            </div>


            <div className="detail-stats-grid">

              <div className="detail-stat-card highlight">
                <span>
                  RUNS
                </span>

                <strong>
                  {cricketAnalysis.runs}
                </strong>

                <small>
                  Match output
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  BALLS
                </span>

                <strong>
                  {cricketAnalysis.balls}
                </strong>

                <small>
                  Deliveries faced
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  STRIKE RATE
                </span>

                <strong>
                  {cricketAnalysis.strikeRate.toFixed(
                    1
                  )}
                </strong>

                <small>
                  Runs per 100 balls
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  FOURS
                </span>

                <strong>
                  {cricketAnalysis.fours}
                </strong>

                <small>
                  Boundary fours
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  SIXES
                </span>

                <strong>
                  {cricketAnalysis.sixes}
                </strong>

                <small>
                  Boundary sixes
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  WICKETS
                </span>

                <strong>
                  {cricketAnalysis.wickets}
                </strong>

                <small>
                  Wickets taken
                </small>
              </div>

            </div>


            <div className="detail-analysis-grid">

              <div className="detail-analysis-card">

                <span>
                  SCORING EFFICIENCY
                </span>

                <h3>
                  {cricketAnalysis.runsPerBall.toFixed(
                    2
                  )}
                  <small>
                    {" "}
                    runs / ball
                  </small>
                </h3>

                <p>
                  This measures how much scoring
                  output was generated from each
                  delivery faced.
                </p>

              </div>


              <div className="detail-analysis-card">

                <span>
                  BOUNDARY CONTRIBUTION
                </span>

                <h3>
                  {cricketAnalysis.boundaryContribution.toFixed(
                    1
                  )}
                  %
                </h3>

                <p>
                  {cricketAnalysis.boundaryRuns} runs
                  came from fours and sixes in
                  this innings.
                </p>

              </div>

            </div>

          </>
        )}


        {/* =================================================
            FOOTBALL
            ================================================= */}

        {sport === "football" && (
          <>

            <div className="detail-section-heading">

              <span>
                ATTACKING PROFILE
              </span>

              <h2>
                Match contribution
              </h2>

            </div>


            <div className="detail-stats-grid">

              <div className="detail-stat-card highlight">
                <span>
                  GOALS
                </span>

                <strong>
                  {footballAnalysis.goals}
                </strong>

                <small>
                  Goals scored
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  ASSISTS
                </span>

                <strong>
                  {footballAnalysis.assists}
                </strong>

                <small>
                  Chances created
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  SHOTS
                </span>

                <strong>
                  {footballAnalysis.shots}
                </strong>

                <small>
                  Attempts
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  ON TARGET
                </span>

                <strong>
                  {
                    footballAnalysis.shotsOnTarget
                  }
                </strong>

                <small>
                  Accurate shots
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  PASSES
                </span>

                <strong>
                  {footballAnalysis.passes}
                </strong>

                <small>
                  Completed attempts
                </small>
              </div>

              <div className="detail-stat-card">
                <span>
                  TACKLES
                </span>

                <strong>
                  {footballAnalysis.tackles}
                </strong>

                <small>
                  Defensive actions
                </small>
              </div>

            </div>


            <div className="detail-analysis-grid">

              <div className="detail-analysis-card">

                <span>
                  SHOT ACCURACY
                </span>

                <h3>
                  {footballAnalysis.shotAccuracy.toFixed(
                    1
                  )}
                  %
                </h3>

                <p>
                  Percentage of recorded shots that
                  were on target.
                </p>

              </div>


              <div className="detail-analysis-card">

                <span>
                  SHOT CONVERSION
                </span>

                <h3>
                  {footballAnalysis.shotConversion.toFixed(
                    1
                  )}
                  %
                </h3>

                <p>
                  Percentage of recorded shots that
                  resulted in goals.
                </p>

              </div>


              <div className="detail-analysis-card">

                <span>
                  PASS ACCURACY
                </span>

                <h3>
                  {footballAnalysis.passAccuracy.toFixed(
                    1
                  )}
                  %
                </h3>

                <p>
                  Recorded passing accuracy for the
                  match.
                </p>

              </div>


              <div className="detail-analysis-card">

                <span>
                  DEFENSIVE ACTIVITY
                </span>

                <h3>
                  {footballAnalysis.tackles +
                    footballAnalysis.interceptions}
                </h3>

                <p>
                  Combined tackles and
                  interceptions.
                </p>

              </div>

            </div>


            <div className="discipline-card">

              <div>
                <span>
                  DISCIPLINE
                </span>

                <strong>
                  {footballAnalysis.yellowCards}
                  {" "}
                  Yellow
                </strong>
              </div>

              <div>
                <strong>
                  {footballAnalysis.redCards}
                  {" "}
                  Red
                </strong>
              </div>

            </div>

          </>
        )}


        {/* =================================================
            PERFORMANCE SIGNALS
            ================================================= */}

        <section className="match-insight-section">

          <div className="detail-section-heading">

            <span>
              MATCH INTELLIGENCE
            </span>

            <h2>
              Performance signals
            </h2>

          </div>


          <div className="match-insight-grid">

            <div className="match-insight-card">

              <div className="insight-icon">
                ✦
              </div>

              <div>
                <span>
                  RESULT
                </span>

                <h3>
                  {match.result}
                </h3>

                <p>
                  Match outcome recorded in
                  PlaySense.
                </p>
              </div>

            </div>


            <div className="match-insight-card">

              <div className="insight-icon">
                ◈
              </div>

              <div>
                <span>
                  SPORT
                </span>

                <h3>
                  {sport === "cricket"
                    ? "Cricket"
                    : "Football"}
                </h3>

                <p>
                  Sport-specific performance
                  engine applied.
                </p>
              </div>

            </div>


            <div className="match-insight-card">

              <div className="insight-icon">
                ↗
              </div>

              <div>
                <span>
                  PERFORMANCE
                </span>

                <h3>
                  {performanceScore}/100
                </h3>

                <p>
                  Composite individual match
                  performance signal.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            FOOTER ACTIONS
            ================================================= */}

        <div className="match-detail-footer">

          <Link
            to="/dashboard"
            className="secondary-button"
          >
            ← Dashboard
          </Link>

          <Link
            to={`/match/${match._id}/edit`}
            className="primary-button"
          >
            Edit Match
          </Link>

        </div>

      </div>

    </div>
  );
}

export default MatchDetail; 