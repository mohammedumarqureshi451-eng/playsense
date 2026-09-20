import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasValidSession } from "../utils/auth";

function ProtectedRoute() {
  const location = useLocation();

  if (!hasValidSession()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
