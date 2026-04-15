// ─────────────────────────────────────────────────────────
// Edit Group Modal
// ─────────────────────────────────────────────────────────

import { useState } from 'react';

export default function EditGroupModal({ group, onClose, onSave }) {
  const [name, setName] = useState(group.name);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      if (btn) btn.disabled = false;
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('splitmint_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/groups/${group.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      
      onSave();
    } catch (err) {
      setError(err.message);
      if (btn) btn.disabled = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Group</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
