// ─────────────────────────────────────────────────────────
// Create Group Page
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupAPI } from '../services/api';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

export default function CreateGroupPage() {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState([{ name: '', color: COLORS[0] }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addParticipant = () => {
    // Max 3 additional, since 1 is creator = total 4
    if (participants.length >= 3) {
      setError('You can add at most 3 additional members (total 4 including yourself)');
      return;
    }
    setParticipants([...participants, { name: '', color: COLORS[(participants.length + 1) % COLORS.length] }]);
  };

  const removeParticipant = (idx) => {
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  const updateParticipant = (idx, field, value) => {
    const updated = [...participants];
    updated[idx] = { ...updated[idx], [field]: value };
    setParticipants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    const validParticipants = participants.filter((p) => p.name.trim());
    // Creator is added automatically by backend, so 0 additional is technically allowed
    // but usually user wants to add someone.

    setLoading(true);
    try {
      const group = await groupAPI.create({ name, participants: validParticipants });
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group-page">
      <div className="page-header">
        <h2>Create Group</h2>
      </div>

      <div className="form-card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="group-name">Group Name</label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Trip, Roommates"
              required
            />
          </div>

          <div className="form-group">
            <label>Add People (max 3 additional)</label>
            <p className="small text-muted mb-2">You (the group creator) are automatically included as the first member.</p>
            {participants.map((p, idx) => (
              <div key={idx} className="participant-row">
                <input
                  type="color"
                  value={p.color}
                  onChange={(e) => updateParticipant(idx, 'color', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateParticipant(idx, 'name', e.target.value)}
                  placeholder={`Member ${idx + 2}`}
                  className="participant-input"
                />
                {participants.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-icon btn-danger"
                    onClick={() => removeParticipant(idx)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {participants.length < 3 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={addParticipant}>
                + Add Participant
              </button>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
