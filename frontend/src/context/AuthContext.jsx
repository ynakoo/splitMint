// ─────────────────────────────────────────────────────────
// Auth Context – global authentication state
// ─────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('splitmint_token');
    if (token) {
      fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem('splitmint_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    
    localStorage.setItem('splitmint_token', data.token);
    setUser(data.user);
  };

  const signup = async (email, password, name, username) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, username })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');

    localStorage.setItem('splitmint_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('splitmint_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
