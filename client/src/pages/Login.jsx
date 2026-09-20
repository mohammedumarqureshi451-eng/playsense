import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed."
        );
      }

      // Store authentication information
      localStorage.setItem(
        "playsense_token",
        data.token
      );

      localStorage.setItem(
        "playsense_user",
        JSON.stringify(data.user)
      );

      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-glow"></div>

      <div className="auth-container">
        <div className="auth-brand">
          <Link to="/" className="brand-logo">
            <span className="brand-mark">P</span>
            PlaySense
          </Link>

          <p>Performance intelligence for athletes.</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-eyebrow">
              WELCOME BACK
            </span>

            <h1>Login to PlaySense</h1>

            <p>
              Continue analysing your sporting
              performance.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="auth-field">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create Account
            </Link>
          </div>
        </div>

        <div className="auth-security-note">
          🔐 Your account is protected by secure
          authentication.
        </div>
      </div>
    </div>
  );
}

export default Login; 