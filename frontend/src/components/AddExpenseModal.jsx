// ─────────────────────────────────────────────────────────
// Add / Edit Expense Modal
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { expenseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AddExpenseModal({ group, expense, prefilledData, onClose, onSave }) {
  const { user } = useAuth();
  const isLeader = group.createdById === user?.id;
  const userParticipant = group.participants.find(p => p.userId === user?.id);

  const isEdit = !!expense;
  const [description, setDescription] = useState(expense?.description || prefilledData?.description || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || prefilledData?.amount?.toString() || '');
  const [date, setDate] = useState(
    expense?.date ? new Date(expense.date).toISOString().split('T')[0] : (prefilledData?.date || new Date().toISOString().split('T')[0])
  );
  const [payerId, setPayerId] = useState(
    expense?.payerId || 
    prefilledData?.payerId || 
    (!isLeader && userParticipant ? userParticipant.id : group.participants.find(p => p.isActive)?.id) || 
    ''
  );
  const [splitType, setSplitType] = useState(expense?.splitType || prefilledData?.splitType || 'EQUAL');
  const [selectedParticipants, setSelectedParticipants] = useState(
    expense?.splits?.map((s) => s.participantId) || 
    prefilledData?.participantIds || 
    group.participants.filter(p => p.isActive).map((p) => p.id)
  );
  const [customAmounts, setCustomAmounts] = useState(() => {
    if (expense?.splits) {
      const init = {};
      expense.splits.forEach(s => init[s.participantId] = s.amount.toString());
      return init;
    }
    return {};
  });
  const [percentages, setPercentages] = useState(() => {
    if (expense?.splits) {
      const init = {};
      expense.splits.forEach(s => init[s.participantId] = (s.percentage || 0).toString());
      return init;
    }
    return {};
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleParticipant = (pid) => {
    setSelectedParticipants((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) return setError('Description required');
    if (!amount || parseFloat(amount) <= 0) return setError('Valid amount required');
    if (selectedParticipants.length === 0) return setError('Select at least one participant');

    const totalAmount = parseFloat(amount);

    // Validation for CUSTOM split
    if (splitType === 'CUSTOM') {
      const sum = selectedParticipants.reduce((acc, pid) => acc + (parseFloat(customAmounts[pid]) || 0), 0);
      if (Math.abs(sum - totalAmount) > 0.01) {
        return setError(`Total of custom amounts ($${sum.toFixed(2)}) must equal expense amount ($${totalAmount.toFixed(2)})`);
      }
    }

    // Validation for PERCENTAGE split
    if (splitType === 'PERCENTAGE') {
      const sum = selectedParticipants.reduce((acc, pid) => acc + (parseFloat(percentages[pid]) || 0), 0);
      if (Math.abs(sum - 100) > 0.1) {
        return setError(`Total percentage (${sum.toFixed(1)}%) must equal 100%`);
      }
    }

    const body = {
      description,
      amount: totalAmount,
      date,
      payerId,
      splitType,
      groupId: group.id,
      participantIds: selectedParticipants,
    };

    if (splitType === 'CUSTOM') {
      body.customAmounts = selectedParticipants.map((pid) => parseFloat(customAmounts[pid]) || 0);
    }
    if (splitType === 'PERCENTAGE') {
      body.percentages = selectedParticipants.map((pid) => parseFloat(percentages[pid]) || 0);
    }

    setLoading(true);
    try {
      if (isEdit) {
        await expenseAPI.update(expense.id, body);
      } else {
        await expenseAPI.create(body);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Expense' : 'Add Expense'}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
                required
              />
            </div>
            <div className="form-group" style={{ width: '130px' }}>
              <label>Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group flex-1">
              <label>Paid by</label>
              <select 
                value={payerId} 
                onChange={(e) => setPayerId(e.target.value)}
                disabled={!isLeader && !isEdit}
              >
                {group.participants.filter(p => p.isActive || p.id === payerId).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Split Type</label>
            <div className="split-type-selector">
              {['EQUAL', 'CUSTOM', 'PERCENTAGE'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`split-type-btn ${splitType === type ? 'active' : ''}`}
                  onClick={() => setSplitType(type)}
                >
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Split among</label>
            <div className="participant-checkboxes">
              {group.participants.map((p, idx) => (
                <div key={p.id} className="participant-check-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(p.id)}
                      onChange={() => toggleParticipant(p.id)}
                    />
                    <span className="participant-dot" style={{ backgroundColor: p.color }}></span>
                    {p.name}
                  </label>

                  {splitType === 'CUSTOM' && selectedParticipants.includes(p.id) && (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="$0.00"
                      value={customAmounts[p.id] || ''}
                      onChange={(e) => {
                        setCustomAmounts(prev => ({ ...prev, [p.id]: e.target.value }));
                      }}
                      className="split-amount-input"
                    />
                  )}

                  {splitType === 'PERCENTAGE' && selectedParticipants.includes(p.id) && (
                    <div className="split-pct-input-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={percentages[p.id] || ''}
                        onChange={(e) => {
                          setPercentages(prev => ({ ...prev, [p.id]: e.target.value }));
                        }}
                        className="split-amount-input"
                      />
                      <span className="pct-sign">%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : (isEdit ? 'Update Expense' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
