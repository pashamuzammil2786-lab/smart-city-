import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bus,
  LayoutDashboard,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo & Name */}
        <Link to="/" className="nav-brand" onClick={closeMobile}>
          <div className="nav-brand-icon" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}>
            <Bus size={20} color="#fff" />
          </div>
          <div>
            <span>Smart City <span style={{ color: '#38BDF8' }}>Transport</span></span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
              PUBLIC TRANSIT & ROUTE ANALYTICS
            </span>
          </div>
        </Link>

        {/* Desktop & Mobile Navigation Links */}
        {user && (
          <>
            <button
              className="mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' || location.pathname === '/dashboard' ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>

              {/* Mobile Profile & Logout */}
              {mobileOpen && (
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #233554', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Account: <strong>{user.name}</strong></span>
                  <button onClick={handleLogout} className="btn-logout">
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* User Account / Profile & Logout (Desktop) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-user-pill">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0F1A33', padding: '4px 10px', borderRadius: '20px', border: '1px solid #233554' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#E2E8F0' }}>
                  {user.name}
                </span>
              </div>

              <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
