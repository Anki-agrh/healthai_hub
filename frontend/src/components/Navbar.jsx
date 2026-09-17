import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

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
    <nav className="flex items-center justify-between py-2.5 px-4 md:px-[5%] bg-white/75 dark:bg-slate-900/85 backdrop-blur-md border-b border-white/40 dark:border-slate-700/50 sticky top-0 z-[2000] transition-all duration-300">
      <div className="flex-shrink-0">
        <Link to="/" className="text-xl md:text-2xl font-extrabold text-accent flex items-center gap-1.5 no-underline tracking-tight">
          <span className="text-[1.3rem]">💙</span> HealthAI Hub
        </Link>
      </div>

      {/* Hamburger Button (Mobile Only) */}
      <button 
        className="flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer z-[2001] md:hidden" 
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className={`block w-6 h-[2.5px] bg-slate-800 dark:bg-slate-100 rounded-sm transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-x-[5px] translate-y-[5px]' : ''}`}></span>
        <span className={`block w-6 h-[2.5px] bg-slate-800 dark:bg-slate-100 rounded-sm transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block w-6 h-[2.5px] bg-slate-800 dark:bg-slate-100 rounded-sm transition-all duration-300 ${mobileOpen ? '-rotate-45 translate-x-[5px] -translate-y-[5px]' : ''}`}></span>
      </button>

      <div className={`${mobileOpen ? 'flex fixed top-14 left-0 right-0 bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-col items-center justify-start pt-10 gap-2 z-[1999] animate-slideDown' : 'hidden'} md:flex md:gap-5 md:static md:bg-transparent md:flex-row`}>
        {["/ai", "/diet", "/nearby-doctors", "/consult", "/queue", "/meds"].map((path) => (
          <Link 
            key={path} 
            to={path} 
            className={`no-underline font-semibold transition-colors duration-300 relative py-1 md:py-1 ${mobileOpen ? 'text-[1.15rem] py-3.5 px-7 w-4/5 text-center rounded-xl hover:bg-accent-light' : 'text-[0.95rem]'} ${location.pathname === path ? 'text-accent ' + (mobileOpen ? 'bg-accent-light' : 'after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-accent after:rounded-sm') : 'text-slate-500 hover:text-accent'}`}
          >
            {path === "/ai" ? "AI Assistant" : path === "/diet" ? "Diet Plan" : path === "/nearby-doctors" ? "Nearby Doctors" : path === "/consult" ? "Consult" : path === "/queue" ? "Live Records" : "Dashboard"}
          </Link>
        ))}
        {user?.role === "admin" && (
          <Link to="/admin" className={`no-underline font-semibold transition-colors duration-300 relative py-1 md:py-1 ${mobileOpen ? 'text-[1.15rem] py-3.5 px-7 w-4/5 text-center rounded-xl hover:bg-accent-light' : 'text-[0.95rem]'} ${location.pathname === "/admin" ? 'text-accent ' + (mobileOpen ? 'bg-accent-light' : 'after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-accent after:rounded-sm') : 'text-slate-500 hover:text-accent'}`}>
            Admin
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Dark Mode Toggle */}
        <button 
          className="bg-accent-light border border-accent/15 w-[34px] h-[34px] md:w-[38px] md:h-[38px] rounded-full cursor-pointer text-base md:text-[1.1rem] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-12" 
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <Link to="/emergency" className="bg-danger text-white no-underline py-1.5 px-3 md:py-2 md:px-4 rounded-lg font-bold text-[0.8rem] md:text-[0.9rem] shadow-[0_4px_12px_rgba(239,68,68,0.2)] transition-transform duration-200 hover:scale-105 hover:bg-red-600">
          Emergency
        </Link>

        <div className="relative">
          <button className="flex items-center gap-1 md:gap-2.5 bg-accent-light border border-accent/15 p-1 md:py-1 md:px-3 md:pl-1 rounded-full cursor-pointer text-accent font-bold transition-all duration-200" onClick={() => setShowMenu(!showMenu)}>
            <div className="w-[30px] h-[30px] bg-accent text-white rounded-full flex items-center justify-center uppercase">
              {user ? user.name[0] : "?"}
            </div>
            <span className="hidden md:inline">{user ? `Hi, ${user.name.split(' ')[0]}` : "Account"}</span>
            <span className="hidden md:inline text-xs">▾</span>
          </button>

          {showMenu && (
            <div className="absolute top-[50px] right-0 w-[180px] bg-white/90 dark:bg-slate-800/95 backdrop-blur-md rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-white/50 dark:border-slate-700 overflow-hidden animate-slideDown">
              {!user ? (
                <>
                  <Link to="/login" className="block py-3 px-4 no-underline text-slate-800 dark:text-slate-200 text-[0.9rem] font-medium transition-colors hover:bg-accent-light hover:text-accent" onClick={() => setShowMenu(false)}>Login</Link>
                  <Link to="/register" className="block py-3 px-4 no-underline text-slate-800 dark:text-slate-200 text-[0.9rem] font-medium transition-colors hover:bg-accent-light hover:text-accent" onClick={() => setShowMenu(false)}>Register</Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="block py-3 px-4 no-underline text-slate-800 dark:text-slate-200 text-[0.9rem] font-medium transition-colors hover:bg-accent-light hover:text-accent" onClick={() => setShowMenu(false)}>Dashboard</Link>
                  {user.role === "doctor" && (
                    <Link to="/doctor-panel" className="block py-3 px-4 no-underline text-slate-800 dark:text-slate-200 text-[0.9rem] font-medium transition-colors hover:bg-accent-light hover:text-accent" onClick={() => setShowMenu(false)}>Doctor Panel</Link>
                  )}
                  <Link 
                    to={user.role === "doctor" ? "/my-profile" : "/"} 
                    className="block py-3 px-4 no-underline text-slate-800 dark:text-slate-200 text-[0.9rem] font-medium transition-colors hover:bg-accent-light hover:text-accent"
                    onClick={() => setShowMenu(false)}
                  >
                    My Profile
                  </Link>
                  <div onClick={handleLogout} className="block py-3 px-4 text-[0.9rem] font-bold text-danger cursor-pointer border-t border-black/5 dark:border-white/5 transition-colors hover:bg-accent-light hover:text-accent">
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