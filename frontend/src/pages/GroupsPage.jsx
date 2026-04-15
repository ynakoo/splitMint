// ─────────────────────────────────────────────────────────
// Groups List Page
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupAPI } from '../services/api';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    groupAPI.list()
      .then(setGroups)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader">Loading groups…</div>;

  return (
    <div className="groups-page">
      <div className="page-header">
        <h2>Groups</h2>
        <Link to="/groups/new" className="btn btn-primary">+ New Group</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No groups yet</h3>
          <p>Create a group to start splitting expenses with friends.</p>
          <Link to="/groups/new" className="btn btn-primary">Create Your First Group</Link>
        </div>
      ) : (
        <div className="group-grid">
          {groups.map((g) => (
            <Link to={`/groups/${g.id}`} key={g.id} className="group-card">
              <h4>{g.name}</h4>
              <div className="group-card-stats">
                <span>{g.participants.length} members</span>
                <span>{g._count?.expenses || 0} expenses</span>
              </div>
              <div className="group-card-members">
                {g.participants.map((p) => (
                  <span
                    key={p.id}
                    className="member-badge"
                    style={{ backgroundColor: p.color + '22', color: p.color, borderColor: p.color }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
