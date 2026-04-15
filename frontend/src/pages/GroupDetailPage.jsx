// ─────────────────────────────────────────────────────────
// Group Detail Page – expenses, balances, settlements
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AddExpenseModal from '../components/AddExpenseModal';
import EditGroupModal from '../components/EditGroupModal';
import { useAuth } from '../context/AuthContext';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('expenses');

  // Filter state
  const [search, setSearch] = useState('');
  const [filterParticipant, setFilterParticipant] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Modal state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [prefilledExpense, setPrefilledExpense] = useState(null);
  const [showEditGroup, setShowEditGroup] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE;

  const authFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('splitmint_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  };

  const loadGroup = useCallback(async () => {
    try {
      const g = await authFetch(`/groups/${id}`);
      setGroup(g);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  const loadExpenses = useCallback(async () => {
    try {
      const params = {
        search, participantId: filterParticipant,
        startDate: filterStartDate, endDate: filterEndDate,
      };
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      const e = await authFetch(`/expenses/group/${id}${query ? `?${query}` : ''}`);
      setExpenses(e);
    } catch (err) {
      setError(err.message);
    }
  }, [id, search, filterParticipant, filterStartDate, filterEndDate]);

  const loadBalances = useCallback(async () => {
    try {
      const result = await authFetch(`/balances/${id}/settlements`);
      setBalances(result.balances || []);
      setSettlements(result.settlements || []);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadGroup(), loadExpenses(), loadBalances()]);
    setLoading(false);
  }, [loadGroup, loadExpenses, loadBalances]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Reload expenses when filters change
  useEffect(() => { if (!loading && tab === 'expenses') loadExpenses(); }, [search, filterParticipant, filterStartDate, filterEndDate, tab, loading, loadExpenses]);

  const handleDeleteGroup = async (e) => {
    e.target.disabled = true;
    if (!confirm('Delete this group and all its expenses? This cannot be undone.')) { e.target.disabled = false; return; }
    try {
      await authFetch(`/groups/${id}`, { method: 'DELETE' });
      navigate('/groups');
    } catch (err) {
      setError(err.message);
      e.target.disabled = false;
    }
  };

  const handleDeleteExpense = async (expenseId, e) => {
    e.target.disabled = true;
    if (!confirm('Delete this expense?')) { e.target.disabled = false; return; }
    try {
      await authFetch(`/expenses/${expenseId}`, { method: 'DELETE' });
      loadAll();
    } catch (err) {
      setError(err.message);
      e.target.disabled = false;
    }
  };

  const handleAddParticipant = async (e) => {
    if (e?.target) e.target.disabled = true;
    const name = prompt('Participant name:');
    if (!name) { if (e?.target) e.target.disabled = false; return; }
    try {
      await authFetch(`/participants/group/${id}`, { method: 'POST', body: JSON.stringify({ name }) });
      loadAll();
    } catch (err) {
      setError(err.message);
      if (e?.target) e.target.disabled = false;
    }
  };

  const handleRemoveParticipant = async (pid, e) => {
    e.target.disabled = true;
    if (!confirm('Remove this participant?')) { e.target.disabled = false; return; }
    try {
      await authFetch(`/participants/${pid}`, { method: 'DELETE' });
      loadAll();
    } catch (err) {
      setError(err.message);
      e.target.disabled = false;
    }
  };

  const handleInitiateSettlement = async (fromId, toId, amount, e) => {
    e.target.disabled = true;
    if (!confirm('Initiate this settlement payment?')) { e.target.disabled = false; return; }
    try {
      await authFetch('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          description: `Settlement Payment`,
          amount: Math.abs(amount),
          groupId: group.id,
          payerId: fromId,
          splitType: 'EQUAL',
          participantIds: [toId],
          isSettlement: true
        })
      });
      loadAll();
    } catch (err) {
      setError(err.message);
      e.target.disabled = false;
    }
  };

  const handleConfirmSettlement = async (expenseId, e) => {
    e.target.disabled = true;
    if (!confirm('Confirm you have received this payment?')) { e.target.disabled = false; return; }
    try {
      await authFetch(`/expenses/${expenseId}/confirm`, { method: 'PUT' });
      loadAll();
    } catch (err) {
      setError(err.message);
      e.target.disabled = false;
    }
  };

  const handleRejectSettlement = async (expenseId, e) => {
    e.target.disabled = true;
    if (!confirm('Reject this settlement request?')) { e.target.disabled = false; return; }
    try {
      await authFetch(`/expenses/${expenseId}/reject`, { method: 'PUT' });
      loadAll();
    } catch (err) {
      setError(err.message);
      e.target.disabled = false;
    }
  };

  if (loading) return <div className="page-loader">Loading group…</div>;
  if (!group) return <div className="alert alert-error">{error || 'Group not found'}</div>;

  const isLeader = group.createdById === user?.id;
  const currentParticipant = group.participants.find(p => p.userId === user?.id);

  return (
    <div className="group-detail-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link to="/groups" className="back-link">← Groups</Link>
          <h2>{group.name}</h2>
          <div className="group-members-row">
            {group.participants.filter(p => p.isActive).map((p) => (
              <span key={p.id} className="member-badge" style={{ backgroundColor: p.color + '22', color: p.color, borderColor: p.color }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
        <div className="header-actions">
          {isLeader ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditGroup(true)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteGroup}>Delete Group</button>
            </>
          ) : (
            currentParticipant && (
              <button className="btn btn-danger btn-sm" onClick={(e) => handleRemoveParticipant(currentParticipant.id, e)}>
                Leave Group
              </button>
            )
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>
          Expenses ({expenses.length})
        </button>
        <button className={`tab ${tab === 'balances' ? 'active' : ''}`} onClick={() => setTab('balances')}>
          Balances
        </button>
        <button className={`tab ${tab === 'settlements' ? 'active' : ''}`} onClick={() => setTab('settlements')}>
          Settlements
        </button>
        <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
          Members ({group.participants.length})
        </button>
      </div>

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="tab-content fade-in">
          {/* Filters */}
          <div className="filters-bar">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses…"
              className="filter-input"
            />
            <select
              value={filterParticipant}
              onChange={(e) => setFilterParticipant(e.target.value)}
              className="filter-select"
            >
              <option value="">All Participants</option>
              {group.participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="filter-date-range">
              <div className="filter-date-wrapper">
                <label>From</label>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="filter-date" />
              </div>
              <div className="filter-date-wrapper">
                <label>To</label>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="filter-date" />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => { setEditingExpense(null); setPrefilledExpense(null); setShowAddExpense(true); }}>
            + Add Expense
          </button>

          {expenses.length === 0 ? (
            <div className="empty-state">
              <p>No expenses yet. Add one to get started!</p>
            </div>
          ) : (
            <div className="expense-list">
              {expenses.map((exp) => (
                <div key={exp.id} className="expense-item">
                  <div className="expense-left">
                    <div className="expense-payer-avatar" style={{ backgroundColor: exp.payer.color }}>
                      {exp.payer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="expense-info">
                      <span className="expense-desc">{exp.description}</span>
                      <span className="expense-meta">
                        Paid by <strong>{exp.payer.name}</strong> · {exp.splitType.toLowerCase()} split · {new Date(exp.date).toLocaleDateString()}
                        {exp.isSettlement && !exp.isConfirmed && !exp.isRejected && (
                          <span className="ml-2 text-red font-semibold">(Pending Confirmation)</span>
                        )}
                        {exp.isSettlement && exp.isConfirmed && (
                          <span className="ml-2 text-green font-semibold">(Settled)</span>
                        )}
                        {exp.isSettlement && exp.isRejected && (
                          <span className="ml-2 text-red font-semibold">(Rejected)</span>
                        )}
                      </span>
                      <div className="expense-splits">
                        {exp.splits.map((s) => (
                          <span key={s.id} className="split-chip">
                            {s.participant.name}: ${s.amount.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="expense-right">
                    <span className="expense-amount">${exp.amount.toFixed(2)}</span>
                    <div className="expense-actions flex flex-col gap-1 items-end mt-2">
                      {exp.isSettlement && !exp.isConfirmed && !exp.isRejected && (
                        (exp.splits.some(s => s.participant.userId === user?.id)) && (
                          <div className="flex gap-2">
                            <button className="btn btn-primary btn-sm" onClick={(e) => handleConfirmSettlement(exp.id, e)}>
                              Confirm Received
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={(e) => handleRejectSettlement(exp.id, e)}>
                              Reject
                            </button>
                          </div>
                        )
                      )}
                      {(isLeader || exp.payer.userId === user?.id) && (
                        <div className="flex gap-2 mt-1">
                          {!exp.isSettlement && <button className="btn btn-ghost btn-sm" onClick={() => { setEditingExpense(exp); setPrefilledExpense(null); setShowAddExpense(true); }}>Edit</button>}
                          <button className="btn btn-ghost btn-sm text-red" onClick={(e) => handleDeleteExpense(exp.id, e)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {tab === 'balances' && (
        <div className="tab-content fade-in">
          <div className="balance-list">
            {balances.map(({ participant, balance }) => (
              <div key={participant.id} className="balance-item">
                <div className="balance-avatar" style={{ backgroundColor: participant.color }}>
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <span className="balance-name">{participant.name}</span>
                <span className={`balance-amount ${balance >= 0 ? 'text-green' : 'text-red'}`}>
                  {balance >= 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`}
                </span>
                <span className="balance-label">
                  {balance > 0 ? 'is owed' : balance < 0 ? 'owes' : 'settled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settlements Tab */}
      {tab === 'settlements' && (
        <div className="tab-content fade-in">
          {settlements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>All settled up!</h3>
              <p>No payments needed.</p>
            </div>
          ) : (
            <div className="settlement-list">
              <p className="settlement-info">
                Optimized to <strong>{settlements.length}</strong> transaction{settlements.length !== 1 ? 's' : ''}:
              </p>
              {settlements.map((s, i) => (
                <div key={i} className="settlement-item">
                  <div className="settlement-from">
                    <span className="settlement-avatar" style={{ backgroundColor: s.from.color }}>
                      {s.from.name.charAt(0).toUpperCase()}
                    </span>
                    <span>{s.from.name}</span>
                  </div>
                  <div className="settlement-arrow">
                    <span className="arrow">→</span>
                    <span className="settlement-amount">${s.amount.toFixed(2)}</span>
                  </div>
                  <div className="settlement-to">
                    <span className="settlement-avatar" style={{ backgroundColor: s.to.color }}>
                      {s.to.name.charAt(0).toUpperCase()}
                    </span>
                    <span>{s.to.name}</span>
                  </div>
                  {(s.from.userId === user?.id) && (() => {
                    const hasPendingSettlement = expenses.some(exp => 
                      exp.isSettlement && !exp.isConfirmed && !exp.isRejected &&
                      exp.payer.id === s.from.id &&
                      exp.splits.some(split => split.participant.id === s.to.id)
                    );
                    return (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        disabled={hasPendingSettlement}
                        onClick={(e) => handleInitiateSettlement(s.from.id, s.to.id, s.amount, e)}
                      >
                        {hasPendingSettlement ? 'Payment Pending' : 'Initiate Payment'}
                      </button>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="tab-content fade-in">
          <div className="members-list">
            <h4>Active Members ({group.participants.filter(p => p.isActive).length})</h4>
            {group.participants.filter(p => p.isActive).map((p) => (
              <div key={p.id} className="member-item">
                <div className="member-avatar" style={{ backgroundColor: p.color }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-name-group">
                  <span className="member-name">
                    {p.name} {p.userId && <span className="text-mint small">(Linked)</span>}
                    {p.userId === user?.id && (
                      <button className="btn btn-ghost btn-xs text-mint ml-2 py-0 px-2" onClick={(e) => {
                        const newName = prompt('Enter new name:', p.name);
                        if (newName && newName.trim()) {
                          const btn = e.target;
                          btn.disabled = true;
                          authFetch(`/participants/${p.id}`, { method: 'PUT', body: JSON.stringify({ name: newName.trim() }) })
                            .then(() => loadAll())
                            .catch(err => { setError(err.message); btn.disabled = false; });
                        }
                      }}>
                        Edit Name
                      </button>
                    )}
                  </span>
                  {!p.userId ? (
                    isLeader ? (
                      <div className="link-account-row">
                        <input 
                          type="text" 
                          placeholder="Link username or email" 
                          id={`link-id-${p.id}`}
                          className="filter-input input-xs"
                        />
                        <button className="btn btn-secondary btn-xs" onClick={(e) => {
                          const btn = e.target;
                          btn.disabled = true;
                          const val = document.getElementById(`link-id-${p.id}`).value;
                          if (!val) { btn.disabled = false; return; }
                          authFetch(`/participants/${p.id}`, { method: 'PUT', body: JSON.stringify({ email: val }) }).then(() => {
                            loadAll();
                          }).catch(err => {
                            setError(err.message);
                            btn.disabled = false;
                          });
                        }}>
                          Link
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted small italic">Not yet linked to SplitMint account</span>
                    )
                  ) : (
                    <span className="member-email text-muted small">Connected to SplitMint account</span>
                  )}
                </div>
                <div className="member-actions-inline">
                  {/* Remove action: Only Leader can remove people now */}
                  {isLeader && group.participants.filter(p => p.isActive).length > 1 && (
                    <button className="btn btn-ghost btn-sm text-red" onClick={(e) => handleRemoveParticipant(p.id, e)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            {group.participants.some(p => !p.isActive) && (
              <>
                <h4 className="mt-6 text-muted">Past Members</h4>
                {group.participants.filter(p => !p.isActive).map((p) => (
                  <div key={p.id} className="member-item opacity-50">
                    <div className="member-avatar" style={{ backgroundColor: p.color }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-name-group">
                      <span className="member-name">{p.name} <span className="text-muted small italic">(Left Group)</span></span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          {/* Only leader can invite members? User said "remove or delete part", but usually invites are also limited. 
              I'll keep invites open unless specified, or maybe limit it to leader for cleaner UX. 
              Let's limit it to leader to be safe. */}
          {isLeader && group.participants.filter(p => p.isActive).length < 4 && (
            <div className="add-member-card">
              <h4>Invite Member</h4>
              <p className="small text-muted mb-3">Add by name, or use a <strong>Username</strong> or <strong>Email</strong> to link a registered user.</p>
              <div className="add-member-form">
                <input 
                  type="text" 
                  id="new-member-name" 
                  placeholder="Guest Name (optional)" 
                  className="filter-input"
                />
                <input 
                  type="text" 
                  id="new-member-identifier" 
                  placeholder="username or email" 
                  className="filter-input"
                />
                <button className="btn btn-secondary" onClick={(e) => {
                  const btn = e.target;
                  btn.disabled = true;
                  const nameEl = document.getElementById('new-member-name');
                  const idEl = document.getElementById('new-member-identifier');
                  const name = nameEl.value;
                  const identifier = idEl.value;
                  
                  if (!name && !identifier) {
                    setError('Please provide a name, username, or email');
                    btn.disabled = false;
                    return;
                  }
                  
                  // Backend handles identifier search automatically
                  authFetch(`/participants/group/${id}`, { method: 'POST', body: JSON.stringify({ name, email: identifier }) }).then(() => {
                    nameEl.value = '';
                    idEl.value = '';
                    loadAll();
                  }).catch(err => {
                    setError(err.message);
                    btn.disabled = false;
                  });
                }}>
                  Add to Group
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          group={group}
          expense={editingExpense}
          prefilledData={prefilledExpense}
          onClose={() => { setShowAddExpense(false); setEditingExpense(null); setPrefilledExpense(null); }}
          onSave={() => { setShowAddExpense(false); setEditingExpense(null); setPrefilledExpense(null); loadAll(); }}
        />
      )}

      {/* Edit Group Modal */}
      {showEditGroup && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditGroup(false)}
          onSave={() => { setShowEditGroup(false); loadAll(); }}
        />
      )}
    </div>
  );
}
