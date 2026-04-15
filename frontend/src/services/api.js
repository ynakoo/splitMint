// ─────────────────────────────────────────────────────────
// API Service – centralized HTTP client for backend
// ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('splitmint_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  profile: () => request('/auth/profile'),
};

// ── Groups ───────────────────────────────────────────────
export const groupAPI = {
  list: () => request('/groups'),
  get: (id) => request(`/groups/${id}`),
  create: (body) => request('/groups', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
};

// ── Participants ─────────────────────────────────────────
export const participantAPI = {
  list: (groupId) => request(`/participants/group/${groupId}`),
  add: (groupId, body) => request(`/participants/group/${groupId}`, { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/participants/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/participants/${id}`, { method: 'DELETE' }),
};

// ── Expenses ─────────────────────────────────────────────
export const expenseAPI = {
  list: (groupId, params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request(`/expenses/group/${groupId}${query ? `?${query}` : ''}`);
  },
  get: (id) => request(`/expenses/${id}`),
  create: (body) => request('/expenses', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  confirmSettlement: (id) => request(`/expenses/${id}/confirm`, { method: 'PUT' }),
  parse: (text) => request('/expenses/parse', { method: 'POST', body: JSON.stringify({ text }) }),
};

// ── Balances ─────────────────────────────────────────────
export const balanceAPI = {
  get: (groupId) => request(`/balances/${groupId}`),
  settlements: (groupId) => request(`/balances/${groupId}/settlements`),
};

// ── Dashboard ────────────────────────────────────────────
export const dashboardAPI = {
  get: () => request('/dashboard'),
};
