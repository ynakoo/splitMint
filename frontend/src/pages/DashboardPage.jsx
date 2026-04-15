// ─────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('splitmint_token');
    fetch(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader">Loading dashboard…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-user-header">
        <div className="user-profile-summary">
          <div className="user-avatar-large">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name-row">
              <h2>{user?.name}</h2>
              <span className="username-badge">@{user?.username}</span>
            </div>
            <p className="user-email text-muted">{user?.email}</p>
          </div>
        </div>
        <Link to="/groups/new" className="btn btn-primary">+ New Group</Link>
      </div>

      {/* Summary Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-total">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value">${data.totalSpent.toFixed(2)}</span>
        </div>
        <div className="stat-card stat-owe">
          <span className="stat-label">You Owe</span>
          <span className="stat-value text-red">${data.youOwe.toFixed(2)}</span>
        </div>
        <div className="stat-card stat-owed">
          <span className="stat-label">You Are Owed</span>
          <span className="stat-value text-green">${data.youAreOwed.toFixed(2)}</span>
        </div>
        <div className="stat-card stat-net">
          <span className="stat-label">Net Balance</span>
          <span className={`stat-value ${data.netBalance >= 0 ? 'text-green' : 'text-red'}`}>
            {data.netBalance >= 0 ? '+' : ''}${data.netBalance.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Group Summaries */}
      <section className="dashboard-section">
        <h3>Your Groups</h3>
        {data.groupSummaries.length === 0 ? (
          <div className="empty-state">
            <p>No groups yet. Create one to start splitting expenses!</p>
            <Link to="/groups/new" className="btn btn-primary">Create Group</Link>
          </div>
        ) : (
          <div className="group-grid">
            {data.groupSummaries.map((g) => (
              <Link to={`/groups/${g.groupId}`} key={g.groupId} className="group-card">
                <h4>{g.groupName}</h4>
                <div className="group-card-stats">
                  <span>{g.participantCount} members</span>
                  <span>{g.expenseCount} expenses</span>
                </div>
                <div className="group-card-total">
                  Your Total Spent: <strong>${g.yourTotalSpent.toFixed(2)}</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="dashboard-section">
        <h3>Recent Transactions</h3>
        {data.recentTransactions.length === 0 ? (
          <p className="text-muted">No transactions yet.</p>
        ) : (
          <div className="transaction-list">
            {data.recentTransactions.slice(0, 10).map((t) => (
              <Link to={`/groups/${t.groupId}`} key={t.id} className="transaction-item">
                <div className="transaction-info">
                  <span className="transaction-desc">{t.description}</span>
                  <span className="transaction-meta">
                    {t.groupName} · Paid by {t.payerName}
                  </span>
                </div>
                <div className="transaction-amount">${t.amount.toFixed(2)}</div>
                <div className="transaction-date">
                  {new Date(t.date).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
