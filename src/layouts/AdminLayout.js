import "../App.css";
import "../MapView.css";
import { Suspense } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { RealTimeNotifications } from "../components";
import { logout } from "../utils/firebaseAuth";

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="App">
      <RealTimeNotifications />
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>Skillzaar Admin</h1>
          </div>
          <nav className="sidebar-nav">
            <NavLink className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`} to="/">
              <span className="sidebar-icon">📊</span>
              <span className="sidebar-text">Dashboard</span>
            </NavLink>
            <NavLink className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`} to="/jobs">
              <span className="sidebar-icon">📋</span>
              <span className="sidebar-text">Job Approvals</span>
            </NavLink>
            <NavLink className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`} to="/workers">
              <span className="sidebar-icon">👷</span>
              <span className="sidebar-text">Worker Management</span>
            </NavLink>
            <NavLink className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`} to="/create-worker">
              <span className="sidebar-icon">➕</span>
              <span className="sidebar-text">Create Worker</span>
            </NavLink>
            <NavLink className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`} to="/payments">
              <span className="sidebar-icon">💳</span>
              <span className="sidebar-text">Payments</span>
            </NavLink>
            <NavLink className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`} to="/map">
              <span className="sidebar-icon">🗺️</span>
              <span className="sidebar-text">Map View</span>
            </NavLink>
            <NavLink className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`} to="/privacy">
              <span className="sidebar-icon">🔒</span>
              <span className="sidebar-text">Privacy Policy</span>
            </NavLink>
            <button 
              className="sidebar-item" 
              onClick={handleLogout}
              style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.2)" }}
            >
              <span className="sidebar-icon">🚪</span>
              <span className="sidebar-text">Logout</span>
            </button>
          </nav>
        </aside>
        <main className="main-content">
          <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;


