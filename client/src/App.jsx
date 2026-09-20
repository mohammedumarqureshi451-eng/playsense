import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";

import Dashboard from "./pages/Dashboard";
import AddMatch from "./pages/AddMatch";
import MatchDetail from "./pages/MatchDetail";
import EditMatch from "./pages/EditMatch";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Analytics from "./pages/Analytics";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-match" element={<AddMatch />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/match/:id/edit" element={<EditMatch />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App; 