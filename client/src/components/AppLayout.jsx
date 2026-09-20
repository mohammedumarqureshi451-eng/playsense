import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

function AppLayout() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("playsense_user") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("playsense_token");
    localStorage.removeItem("playsense_user");

    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-icon">
            PS
          </div>

          <div>
            <h1>PlaySense</h1>
            <span>Performance Intelligence</span>
          </div>

        </div>

        <div className="sidebar-divider" />

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          <div className="nav-section-title">
            MAIN
          </div>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="nav-icon">⌂</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="nav-icon">◈</span>
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/add-match"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="nav-icon">＋</span>
            <span>Add Match</span>
          </NavLink>

          <div className="nav-section-title">
            INSIGHTS
          </div>

          <div className="sidebar-info-card">

            <div className="info-card-icon">
              ✦
            </div>

            <div>
              <strong>
                Performance Engine
              </strong>

              <p>
                Turn match data into actionable
                insights.
              </p>
            </div>

          </div>

        </nav>

        {/* USER AREA */}

        <div className="sidebar-bottom">

          <div className="user-card">

            <div className="user-avatar">
              {user?.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

            <div className="user-details">

              <strong>
                {user?.name || "Player"}
              </strong>

              <span>
                {user?.email || "PlaySense User"}
              </span>

            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        <div className="topbar">

          <div>
            <span className="topbar-label">
              PLAY SENSE
            </span>

            <span className="topbar-status">
              ● SYSTEM ONLINE
            </span>
          </div>

          <div className="topbar-right">
            {user?.name
              ? `Welcome, ${user.name}`
              : "Welcome"}
          </div>

        </div>

        <div className="page-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}

export default AppLayout; 