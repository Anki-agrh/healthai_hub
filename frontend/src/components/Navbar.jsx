import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Apply dark mode class on mount and toggle
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const syncUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, [location]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setShowMenu(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    // Preserve theme preference after logout
    if (darkMode) localStorage.setItem("theme", "dark");
    setUser(null);
    setShowMenu(false);
    navigate("/login");
  };

  return (
    <nav className="glass-navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">💙</span> HealthAI Hub
        </Link>
      </div>

      {/* Hamburger Button (Mobile Only) */}
      <button 
        className={`hamburger ${mobileOpen ? "active" : ""}`} 
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`nav-center ${mobileOpen ? "mobile-open" : ""}`}>
        <Link to="/ai" className={location.pathname === "/ai" ? "active" : ""}>AI Assistant</Link>
        <Link to="/diet" className={location.pathname === "/diet" ? "active" : ""}>Diet Plan</Link>
        <Link to="/nearby-doctors" className={location.pathname === "/nearby-doctors" ? "active" : ""}>Nearby Doctors</Link>
        <Link to="/consult" className={location.pathname === "/consult" ? "active" : ""}>Consult</Link>
        <Link to="/queue" className={location.pathname === "/queue" ? "active" : ""}>Live Records</Link>
        <Link to="/meds" className={location.pathname === "/meds" ? "active" : ""}>Dashboard</Link>
        {user?.role === "admin" && <Link to="/admin" className="admin-link">Admin</Link>}
      </div>

      <div className="nav-right">
        {/* Dark Mode Toggle */}
        <button 
          className="theme-toggle" 
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <Link to="/emergency" className="emergency-nav-btn">Emergency</Link>

        <div className="account-section">
          <button className="user-pill" onClick={() => setShowMenu(!showMenu)}>
            <div className="avatar">{user ? user.name[0] : "?"}</div>
            <span>{user ? `Hi, ${user.name.split(' ')[0]}` : "Account"}</span>
            <span className="arrow">▾</span>
          </button>

          {showMenu && (
            <div className="glass-dropdown">
              {!user ? (
                <>
                  <Link to="/login" onClick={() => setShowMenu(false)}>Login</Link>
                  <Link to="/register" onClick={() => setShowMenu(false)}>Register</Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" onClick={() => setShowMenu(false)}>Dashboard</Link>
                  {user.role === "doctor" && (
                    <Link to="/doctor-panel" onClick={() => setShowMenu(false)}>Doctor Panel</Link>
                  )}
                  <Link 
                    to={user.role === "doctor" ? "/my-profile" : "/"} 
                    onClick={() => setShowMenu(false)}
                  >
                    My Profile
                  </Link>
                  <div onClick={handleLogout} className="logout-btn">
                    Logout
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;