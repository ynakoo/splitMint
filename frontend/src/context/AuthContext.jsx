// ─────────────────────────────────────────────────────────
// Auth Context – global authentication state
// ─────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('splitmint_token');
    if (token) {
      authAPI.profile()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('splitmint_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { user, token } = await authAPI.login({ email, password });
    localStorage.setItem('splitmint_token', token);
    setUser(user);
  };

  const signup = async (email, password, name, username) => {
    const { user, token } = await authAPI.signup({ email, password, name, username });
    localStorage.setItem('splitmint_token', token);
    setUser(user);
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
