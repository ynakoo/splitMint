// ─────────────────────────────────────────────────────────
// Navbar Component
// ─────────────────────────────────────────────────────────

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="logo-icon">🌿</span>
          <span className="brand-text">SplitMint</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={isActive('/')}>Dashboard</Link>
          <Link to="/groups" className={isActive('/groups')}>Groups</Link>
        </div>

        <div className="nav-user">
          <span className="user-name">{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
