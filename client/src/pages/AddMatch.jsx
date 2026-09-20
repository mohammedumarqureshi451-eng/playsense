import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiPost } from "../utils/api";

function AddMatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialSport =
    searchParams.get("sport") === "football"
      ? "football"
      : "cricket";

  const [sport, setSport] = useState(initialSport);

  const [formData, setFormData] = useState({
    opponent: "",
    date: new Date().toISOString().split("T")[0],
    result: "Won",

    runs: "",
    balls: "",
    fours: "",
    sixes: "",
    wickets: "",

    goals: "",
    assists: "",
    shots: "",
    shotsOnTarget: "",
    passes: "",
    passAccuracy: "",
    tackles: "",
    interceptions: "",
    yellowCards: "",
    redCards: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSportChange = (newSport) => {
    setSport(newSport);
    setError("");
    setSuccess("");
  };

  const cricketMetrics = useMemo(() => {
    const runs = Number(formData.runs) || 0;
    const balls = Number(formData.balls) || 0;
    const fours = Number(formData.fours) || 0;
    const sixes = Number(formData.sixes) || 0;

    const strikeRate =
      balls > 0 ? (runs / balls) * 100 : 0;

    const boundaryRuns =
      fours * 4 + sixes * 6;

    const boundaryContribution =
      runs > 0
        ? (boundaryRuns / runs) * 100
        : 0;

    return {
      strikeRate,
      boundaryRuns,
      boundaryContribution,
    };
  }, [
    formData.runs,
    formData.balls,
    formData.fours,
    formData.sixes,
  ]);

  const footballMetrics = useMemo(() => {
    const goals = Number(formData.goals) || 0;
    const assists = Number(formData.assists) || 0;
    const shots = Number(formData.shots) || 0;
    const shotsOnTarget =
      Number(formData.shotsOnTarget) || 0;

    const shotAccuracy =
      shots > 0
        ? (shotsOnTarget / shots) * 100
        : 0;

    const shotConversion =
      shots > 0
        ? (goals / shots) * 100
        : 0;

    const attackingContribution =
      goals + assists;

    return {
      shotAccuracy,
      shotConversion,
      attackingContribution,
    };
  }, [
    formData.goals,
    formData.assists,
    formData.shots,
    formData.shotsOnTarget,
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.opponent.trim()) {
      setError("Please enter the opponent name.");
      return;
    }

    if (!formData.date) {
      setError("Please select the match date.");
      return;
    }

    const newMatch = {
      sport,
      opponent: formData.opponent.trim(),
      date: formData.date,
      result: formData.result,

      runs:
        sport === "cricket"
          ? Number(formData.runs) || 0
          : 0,

      balls:
        sport === "cricket"
          ? Number(formData.balls) || 0
          : 0,

      fours:
        sport === "cricket"
          ? Number(formData.fours) || 0
          : 0,

      sixes:
        sport === "cricket"
          ? Number(formData.sixes) || 0
          : 0,

      wickets:
        sport === "cricket"
          ? Number(formData.wickets) || 0
          : 0,

      goals:
        sport === "football"
          ? Number(formData.goals) || 0
          : 0,

      assists:
        sport === "football"
          ? Number(formData.assists) || 0
          : 0,

      shots:
        sport === "football"
          ? Number(formData.shots) || 0
          : 0,

      shotsOnTarget:
        sport === "football"
          ? Number(formData.shotsOnTarget) || 0
          : 0,

      passes:
        sport === "football"
          ? Number(formData.passes) || 0
          : 0,

      passAccuracy:
        sport === "football"
          ? Number(formData.passAccuracy) || 0
          : 0,

      tackles:
        sport === "football"
          ? Number(formData.tackles) || 0
          : 0,

      interceptions:
        sport === "football"
          ? Number(formData.interceptions) || 0
          : 0,

      yellowCards:
        sport === "football"
          ? Number(formData.yellowCards) || 0
          : 0,

      redCards:
        sport === "football"
          ? Number(formData.redCards) || 0
          : 0,
    };

    try {
      setLoading(true);

      await apiPost("/matches", newMatch);

      setSuccess("Match saved successfully.");

      window.dispatchEvent(
        new Event("matchesUpdated")
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 700);
    } catch (submitError) {
      console.error(
        "Add match error:",
        submitError
      );

      setError(
        submitError.message ||
          "Unable to save match."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-match-page">

      <div className="add-match-container">

        <div className="add-match-header">

          <div>
            <Link
              to="/dashboard"
              className="add-match-back"
            >
              ← Back to Dashboard
            </Link>

            <div className="add-match-kicker">
              PERFORMANCE DATA
            </div>

            <h1>Add Match</h1>

            <p>
              Record your match performance and
              build your PlaySense performance history.
            </p>
          </div>

          <div className="add-match-header-badge">
            <span>●</span>
            DATA CAPTURE
          </div>

        </div>

        <div className="sport-selector-card">

          <div className="section-heading-row">

            <div>
              <span className="section-eyebrow">
                SPORT
              </span>

              <h2>
                Select match type
              </h2>
            </div>

            <span className="section-helper">
              Choose the statistics you want to record.
            </span>

          </div>

          <div className="sport-selector">

            <button
              type="button"
              className={`sport-option ${
                sport === "cricket"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleSportChange("cricket")
              }
            >
              <span className="sport-option-icon">
                🏏
              </span>

              <span>
                <strong>Cricket</strong>
                <small>
                  Batting & bowling performance
                </small>
              </span>

              {sport === "cricket" && (
                <span className="sport-check">
                  ✓
                </span>
              )}
            </button>

            <button
              type="button"
              className={`sport-option ${
                sport === "football"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleSportChange("football")
              }
            >
              <span className="sport-option-icon">
                ⚽
              </span>

              <span>
                <strong>Football</strong>
                <small>
                  Attacking & defensive performance
                </small>
              </span>

              {sport === "football" && (
                <span className="sport-check">
                  ✓
                </span>
              )}
            </button>

          </div>

        </div>

        {error && (
          <div className="form-message form-message-error">
            <span>!</span>
            {error}
          </div>
        )}

        {success && (
          <div className="form-message form-message-success">
            <span>✓</span>
            {success}
          </div>
        )}

        <form
          className="add-match-form"
          onSubmit={handleSubmit}
        >

          <section className="form-section">

            <div className="form-section-header">

              <div className="form-section-number">
                01
              </div>

              <div>
                <span className="section-eyebrow">
                  MATCH INFORMATION
                </span>

                <h2>Match details</h2>

                <p>
                  Enter the basic information about
                  the match.
                </p>
              </div>

            </div>

            <div className="form-grid">

              <div className="form-field form-field-wide">

                <label htmlFor="opponent">
                  Opponent
                </label>

                <input
                  id="opponent"
                  name="opponent"
                  type="text"
                  placeholder={
                    sport === "cricket"
                      ? "e.g. Mumbai Warriors"
                      : "e.g. Mumbai City FC"
                  }
                  value={formData.opponent}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-field">

                <label htmlFor="date">
                  Match Date
                </label>

                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-field">

                <label htmlFor="result">
                  Result
                </label>

                <select
                  id="result"
                  name="result"
                  value={formData.result}
                  onChange={handleChange}
                >
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

          </section>

          <section className="form-section">

            <div className="form-section-header">

              <div className="form-section-number">
                02
              </div>

              <div>
                <span className="section-eyebrow">
                  {sport === "cricket"
                    ? "CRICKET PERFORMANCE"
                    : "FOOTBALL PERFORMANCE"}
                </span>

                <h2>
                  {sport === "cricket"
                    ? "Performance statistics"
                    : "Performance statistics"}
                </h2>

                <p>
                  Enter the statistics recorded
                  during this match.
                </p>
              </div>

            </div>

            {sport === "cricket" ? (
              <>

                <div className="stat-input-grid">

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      R
                    </span>

                    <label htmlFor="runs">
                      Runs
                    </label>

                    <input
                      id="runs"
                      name="runs"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.runs}
                      onChange={handleChange}
                    />

                    <small>
                      Total runs scored
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      B
                    </span>

                    <label htmlFor="balls">
                      Balls
                    </label>

                    <input
                      id="balls"
                      name="balls"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.balls}
                      onChange={handleChange}
                    />

                    <small>
                      Balls faced
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      4
                    </span>

                    <label htmlFor="fours">
                      Fours
                    </label>

                    <input
                      id="fours"
                      name="fours"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.fours}
                      onChange={handleChange}
                    />

                    <small>
                      Number of fours
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      6
                    </span>

                    <label htmlFor="sixes">
                      Sixes
                    </label>

                    <input
                      id="sixes"
                      name="sixes"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.sixes}
                      onChange={handleChange}
                    />

                    <small>
                      Number of sixes
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      W
                    </span>

                    <label htmlFor="wickets">
                      Wickets
                    </label>

                    <input
                      id="wickets"
                      name="wickets"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.wickets}
                      onChange={handleChange}
                    />

                    <small>
                      Wickets taken
                    </small>
                  </div>

                </div>

                <div className="live-metrics-panel">

                  <div className="live-metrics-heading">
                    <span>◈</span>
                    LIVE PERFORMANCE METRICS
                  </div>

                  <div className="live-metrics-grid">

                    <div>
                      <span>
                        Strike Rate
                      </span>

                      <strong>
                        {cricketMetrics.strikeRate.toFixed(
                          2
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Boundary Runs
                      </span>

                      <strong>
                        {cricketMetrics.boundaryRuns}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Boundary Contribution
                      </span>

                      <strong>
                        {Math.min(
                          100,
                          cricketMetrics.boundaryContribution
                        ).toFixed(1)}
                        %
                      </strong>
                    </div>

                  </div>

                </div>

              </>
            ) : (
              <>

                <div className="stat-input-grid">

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      G
                    </span>

                    <label htmlFor="goals">
                      Goals
                    </label>

                    <input
                      id="goals"
                      name="goals"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.goals}
                      onChange={handleChange}
                    />

                    <small>
                      Goals scored
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      A
                    </span>

                    <label htmlFor="assists">
                      Assists
                    </label>

                    <input
                      id="assists"
                      name="assists"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.assists}
                      onChange={handleChange}
                    />

                    <small>
                      Assists provided
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      S
                    </span>

                    <label htmlFor="shots">
                      Shots
                    </label>

                    <input
                      id="shots"
                      name="shots"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.shots}
                      onChange={handleChange}
                    />

                    <small>
                      Total shots
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      T
                    </span>

                    <label htmlFor="shotsOnTarget">
                      Shots on target
                    </label>

                    <input
                      id="shotsOnTarget"
                      name="shotsOnTarget"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.shotsOnTarget}
                      onChange={handleChange}
                    />

                    <small>
                      Shots on target
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      P
                    </span>

                    <label htmlFor="passes">
                      Passes
                    </label>

                    <input
                      id="passes"
                      name="passes"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.passes}
                      onChange={handleChange}
                    />

                    <small>
                      Completed passes
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      %
                    </span>

                    <label htmlFor="passAccuracy">
                      Pass accuracy
                    </label>

                    <input
                      id="passAccuracy"
                      name="passAccuracy"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={formData.passAccuracy}
                      onChange={handleChange}
                    />

                    <small>
                      Passing accuracy
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      T
                    </span>

                    <label htmlFor="tackles">
                      Tackles
                    </label>

                    <input
                      id="tackles"
                      name="tackles"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.tackles}
                      onChange={handleChange}
                    />

                    <small>
                      Successful tackles
                    </small>
                  </div>

                  <div className="stat-input-card">
                    <span className="stat-input-icon">
                      I
                    </span>

                    <label htmlFor="interceptions">
                      Interceptions
                    </label>

                    <input
                      id="interceptions"
                      name="interceptions"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.interceptions}
                      onChange={handleChange}
                    />

                    <small>
                      Defensive interceptions
                    </small>
                  </div>

                </div>

                <div className="form-subsection">

                  <div className="form-subsection-title">
                    DISCIPLINE
                  </div>

                  <div className="discipline-input-grid">

                    <div className="stat-input-card compact">
                      <label htmlFor="yellowCards">
                        Yellow Cards
                      </label>

                      <input
                        id="yellowCards"
                        name="yellowCards"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.yellowCards}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="stat-input-card compact">
                      <label htmlFor="redCards">
                        Red Cards
                      </label>

                      <input
                        id="redCards"
                        name="redCards"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.redCards}
                        onChange={handleChange}
                      />
                    </div>

                  </div>

                </div>

                <div className="live-metrics-panel">

                  <div className="live-metrics-heading">
                    <span>◈</span>
                    LIVE PERFORMANCE METRICS
                  </div>

                  <div className="live-metrics-grid">

                    <div>
                      <span>
                        Shot Accuracy
                      </span>

                      <strong>
                        {footballMetrics.shotAccuracy.toFixed(
                          1
                        )}
                        %
                      </strong>
                    </div>

                    <div>
                      <span>
                        Shot Conversion
                      </span>

                      <strong>
                        {footballMetrics.shotConversion.toFixed(
                          1
                        )}
                        %
                      </strong>
                    </div>

                    <div>
                      <span>
                        Attacking Contribution
                      </span>

                      <strong>
                        {
                          footballMetrics.attackingContribution
                        }
                      </strong>
                    </div>

                  </div>

                </div>

              </>
            )}

          </section>

          <section className="form-section form-section-final">

            <div className="form-section-header">

              <div className="form-section-number">
                03
              </div>

              <div>
                <span className="section-eyebrow">
                  READY TO SAVE
                </span>

                <h2>
                  Add to performance history
                </h2>

                <p>
                  Your match will become part of your
                  PlaySense analytics and improvement
                  analysis.
                </p>
              </div>

            </div>

            <div className="submit-area">

              <div className="submit-note">
                <span>✦</span>

                <p>
                  PlaySense will automatically use
                  this match in your performance trends,
                  consistency analysis and improvement
                  insights.
                </p>
              </div>

              <div className="submit-actions">

                <Link
                  to="/dashboard"
                  className="secondary-action-button"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="primary-action-button"
                  disabled={loading}
                >
                  {loading
                    ? "Saving Match..."
                    : "Save Match →"}
                </button>

              </div>

            </div>

          </section>

        </form>

      </div>

    </div>
  );
}

export default AddMatch;  