import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ModelPerformance from './pages/ModelPerformance';
import { api } from './services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B132B', color: '#F8FAFC', padding: '2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '500px', background: '#111C35', padding: '2rem', borderRadius: '12px', border: '1px solid #233554' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8', marginBottom: '0.75rem' }}>Something went wrong</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/dashboard';
              }}
              style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent({ user, setUser, handleLogout }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = !user && (location.pathname === '/' || location.pathname === '/landing');

  return (
    <div className="app-container">
      {/* Navigation bar is rendered when logged in, across all pages except auth */}
      {user && !isAuthPage && <Navbar user={user} onLogout={handleLogout} />}

      <main className={(isAuthPage || isLandingPage) ? 'public-content' : 'main-content'}>
        <Routes>
          {/* Root: Landing Page if logged out, Dashboard if logged in */}
          <Route
            path="/"
            element={user ? <Dashboard user={user} /> : <Landing />}
          />
          <Route
            path="/landing"
            element={<Landing />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />}
          />

          {/* Authentication Routes */}
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={setUser} />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/dashboard" replace /> : <Signup onSignupSuccess={setUser} />}
          />

          {/* Redirect Model Performance to Dashboard */}
          <Route path="/model-performance" element={<Navigate to="/dashboard" replace />} />

          {/* Redirect any legacy ML links directly into Dashboard */}
          <Route path="/ml" element={<Navigate to="/dashboard" replace />} />
          <Route path="/transport/ml" element={<Navigate to="/dashboard" replace />} />

          {/* Route Finder fallback directly into Dashboard */}
          <Route path="/routes" element={<Navigate to="/dashboard" replace />} />
          <Route path="/transport" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('smart_city_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
          } else {
            localStorage.removeItem('smart_city_token');
          }
        } catch (e) {
          localStorage.removeItem('smart_city_token');
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('smart_city_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B132B' }}>
        <div style={{ textAlign: 'center', color: '#38BDF8', fontWeight: 600, fontSize: '0.95rem' }}>
          Loading Smart City Urban Analytics Platform...
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <AppContent user={user} setUser={setUser} handleLogout={handleLogout} />
      </Router>
    </ErrorBoundary>
  );
}
