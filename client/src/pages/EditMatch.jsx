import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { apiGet, apiPut } from "../utils/api";

function EditMatch() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedSport, setSelectedSport] = useState("cricket");

  // Common fields
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [result, setResult] = useState("Won");

  // Cricket fields
  const [runs, setRuns] = useState("");
  const [balls, setBalls] = useState("");
  const [fours, setFours] = useState("");
  const [sixes, setSixes] = useState("");
  const [wickets, setWickets] = useState("");

  // Football fields
  const [goals, setGoals] = useState("");
  const [assists, setAssists] = useState("");
  const [shots, setShots] = useState("");
  const [shotsOnTarget, setShotsOnTarget] = useState("");
  const [passes, setPasses] = useState("");
  const [passAccuracy, setPassAccuracy] = useState("");
  const [tackles, setTackles] = useState("");
  const [interceptions, setInterceptions] = useState("");
  const [yellowCards, setYellowCards] = useState("");
  const [redCards, setRedCards] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const match = await apiGet(`/matches/${id}`);

        // Existing records without sport are treated as cricket
        const sport = match.sport || "cricket";

        setSelectedSport(sport);

        // Common fields
        setOpponent(match.opponent || "");
        setDate(match.date || "");
        setResult(match.result || "Won");

        // Cricket fields
        setRuns(match.runs ?? "");
        setBalls(match.balls ?? "");
        setFours(match.fours ?? "");
        setSixes(match.sixes ?? "");
        setWickets(match.wickets ?? "");

        // Football fields
        setGoals(match.goals ?? "");
        setAssists(match.assists ?? "");
        setShots(match.shots ?? "");
        setShotsOnTarget(match.shotsOnTarget ?? "");
        setPasses(match.passes ?? "");
        setPassAccuracy(match.passAccuracy ?? "");
        setTackles(match.tackles ?? "");
        setInterceptions(match.interceptions ?? "");
        setYellowCards(match.yellowCards ?? "");
        setRedCards(match.redCards ?? "");

        setLoading(false);
      } catch (error) {
        console.error("Error loading match:", error);

        if (error?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        navigate("/dashboard");
      }
    };

    loadMatch();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedMatch = {
      sport: selectedSport,

      // Common fields
      opponent,
      date,
      result,

      // Cricket
      runs: Number(runs || 0),
      balls: Number(balls || 0),
      fours: Number(fours || 0),
      sixes: Number(sixes || 0),
      wickets: Number(wickets || 0),

      // Football
      goals: Number(goals || 0),
      assists: Number(assists || 0),
      shots: Number(shots || 0),
      shotsOnTarget: Number(shotsOnTarget || 0),
      passes: Number(passes || 0),
      passAccuracy: Number(passAccuracy || 0),
      tackles: Number(tackles || 0),
      interceptions: Number(interceptions || 0),
      yellowCards: Number(yellowCards || 0),
      redCards: Number(redCards || 0),
    };

    try {
      await apiPut(`/matches/${id}`, updatedMatch);

      window.dispatchEvent(new Event("matchesUpdated"));

      navigate(`/match/${id}`);
    } catch (error) {
      console.error("Error updating match:", error);

      if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      alert(
        error?.message ||
          "Failed to update match. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <div className="edit-match-page">
        <div className="form-container">
          <p>Loading match...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-match-page">
      <header className="app-header">
        <div className="header-inner">
          <Link to="/dashboard" className="brand-logo">
            PlaySense
          </Link>

          <nav className="main-nav">
            <Link to="/dashboard">Dashboard</Link>
            <Link to={`/match/${id}`}>Match Details</Link>
          </nav>
        </div>
      </header>

      <main className="form-container">
        <div className="form-heading">
          <p className="eyebrow">
            {selectedSport === "football"
              ? "⚽ Football Analytics"
              : "🏏 Cricket Analytics"}
          </p>

          <h1>Edit Match</h1>

          <p>
            Update your {selectedSport} performance data and keep your
            PlaySense analytics accurate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="match-form">
          {/* SPORT SELECTOR */}
          <div className="sport-selector-section">
            <label>Sport</label>

            <div className="sport-selector">
              <button
                type="button"
                className={
                  selectedSport === "cricket"
                    ? "sport-option active"
                    : "sport-option"
                }
                onClick={() => setSelectedSport("cricket")}
              >
                <span className="sport-icon">🏏</span>
                <span>
                  <strong>Cricket</strong>
                  <small>Batting & bowling</small>
                </span>
              </button>

              <button
                type="button"
                className={
                  selectedSport === "football"
                    ? "sport-option active"
                    : "sport-option"
                }
                onClick={() => setSelectedSport("football")}
              >
                <span className="sport-icon">⚽</span>
                <span>
                  <strong>Football</strong>
                  <small>Attacking, passing & defence</small>
                </span>
              </button>
            </div>
          </div>

          {/* COMMON INFORMATION */}
          <div className="form-section">
            <div className="form-section-heading">
              <span className="section-number">01</span>

              <div>
                <h2>Match Information</h2>
                <p>Basic information about the match.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="opponent">Opponent</label>

                <input
                  id="opponent"
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder={
                    selectedSport === "football"
                      ? "e.g. Arsenal"
                      : "e.g. Mumbai Warriors"
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Match Date</label>

                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="result">Result</label>

                <select
                  id="result"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                >
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                  <option value="Draw">Draw</option>
                </select>
              </div>
            </div>
          </div>

          {/* CRICKET FORM */}
          {selectedSport === "cricket" && (
            <>
              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">02</span>

                  <div>
                    <h2>Batting Performance</h2>
                    <p>Record your batting contribution.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="runs">Runs</label>

                    <input
                      id="runs"
                      type="number"
                      min="0"
                      value={runs}
                      onChange={(e) => setRuns(e.target.value)}
                      placeholder="e.g. 45"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="balls">Balls Faced</label>

                    <input
                      id="balls"
                      type="number"
                      min="0"
                      value={balls}
                      onChange={(e) => setBalls(e.target.value)}
                      placeholder="e.g. 32"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fours">Fours</label>

                    <input
                      id="fours"
                      type="number"
                      min="0"
                      value={fours}
                      onChange={(e) => setFours(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sixes">Sixes</label>

                    <input
                      id="sixes"
                      type="number"
                      min="0"
                      value={sixes}
                      onChange={(e) => setSixes(e.target.value)}
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">03</span>

                  <div>
                    <h2>Bowling Performance</h2>
                    <p>Record your bowling contribution.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="wickets">Wickets</label>

                    <input
                      id="wickets"
                      type="number"
                      min="0"
                      value={wickets}
                      onChange={(e) => setWickets(e.target.value)}
                      placeholder="e.g. 1"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FOOTBALL FORM */}
          {selectedSport === "football" && (
            <>
              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">02</span>

                  <div>
                    <h2>Attacking Performance</h2>
                    <p>Record your attacking contribution.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="goals">Goals</label>

                    <input
                      id="goals"
                      type="number"
                      min="0"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="e.g. 2"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="assists">Assists</label>

                    <input
                      id="assists"
                      type="number"
                      min="0"
                      value={assists}
                      onChange={(e) => setAssists(e.target.value)}
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="shots">Shots</label>

                    <input
                      id="shots"
                      type="number"
                      min="0"
                      value={shots}
                      onChange={(e) => setShots(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="shotsOnTarget">
                      Shots on Target
                    </label>

                    <input
                      id="shotsOnTarget"
                      type="number"
                      min="0"
                      value={shotsOnTarget}
                      onChange={(e) =>
                        setShotsOnTarget(e.target.value)
                      }
                      placeholder="e.g. 3"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">03</span>

                  <div>
                    <h2>Passing Performance</h2>
                    <p>Record your passing statistics.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="passes">Passes</label>

                    <input
                      id="passes"
                      type="number"
                      min="0"
                      value={passes}
                      onChange={(e) => setPasses(e.target.value)}
                      placeholder="e.g. 47"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="passAccuracy">
                      Pass Accuracy (%)
                    </label>

                    <input
                      id="passAccuracy"
                      type="number"
                      min="0"
                      max="100"
                      value={passAccuracy}
                      onChange={(e) =>
                        setPassAccuracy(e.target.value)
                      }
                      placeholder="e.g. 89"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">04</span>

                  <div>
                    <h2>Defensive Contribution</h2>
                    <p>Record your defensive statistics.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="tackles">Tackles</label>

                    <input
                      id="tackles"
                      type="number"
                      min="0"
                      value={tackles}
                      onChange={(e) => setTackles(e.target.value)}
                      placeholder="e.g. 4"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="interceptions">
                      Interceptions
                    </label>

                    <input
                      id="interceptions"
                      type="number"
                      min="0"
                      value={interceptions}
                      onChange={(e) =>
                        setInterceptions(e.target.value)
                      }
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">05</span>

                  <div>
                    <h2>Discipline</h2>
                    <p>Record cards received during the match.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="yellowCards">
                      Yellow Cards
                    </label>

                    <input
                      id="yellowCards"
                      type="number"
                      min="0"
                      value={yellowCards}
                      onChange={(e) =>
                        setYellowCards(e.target.value)
                      }
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="redCards">Red Cards</label>

                    <input
                      id="redCards"
                      type="number"
                      min="0"
                      value={redCards}
                      onChange={(e) => setRedCards(e.target.value)}
                      placeholder="e.g. 0"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ACTIONS */}
          <div className="form-actions">
            <Link to={`/match/${id}`} className="cancel-button">
              Cancel
            </Link>

            <button type="submit" className="submit-button">
              Update {selectedSport === "football" ? "Football" : "Cricket"} Match
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditMatch 