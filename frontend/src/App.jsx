// ─────────────────────────────────────────────────────────
// SplitMint – Main App with Routing
// ─────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupDetailPage from './pages/GroupDetailPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <>
      <Navbar />
      <main className="main-content">{children}</main>
    </>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (user) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
          <Route path="/groups/new" element={<ProtectedRoute><CreateGroupPage /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
