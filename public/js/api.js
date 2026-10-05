// ─── Modo Mockup / Apresentação (Sem Banco de Dados) ─────────────────────────
// Mude para false quando for conectar ao backend real na VPS
const USE_MOCK_API = true;

// ─── API Client ─────────────────────────────────────────────────────────────
const API_BASE = '/api';

// ─── XSS Prevention ─────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getToken() {
  return localStorage.getItem('accessToken');
}

function setToken(token) {
  localStorage.setItem('accessToken', token);
}

function clearToken() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function apiFetch(path, options = {}) {
  // Se o modo mock estiver ativado, processa localmente no navegador
  if (USE_MOCK_API) {
    if (!window.__ageMockRouter) {
      await new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = '/js/mock-service.js';
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
      });
    }
    if (window.__ageMockRouter) {
      return await window.__ageMockRouter(path, options);
    }
  }

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Token expired — try refresh
  if (res.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry original request with new token
      headers.Authorization = `Bearer ${getToken()}`;
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      return handleResponse(retryRes);
    } else {
      clearToken();
      window.location.href = '/index.html';
      return;
    }
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function tryRefreshToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .2s ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// ─── Auth Guards ─────────────────────────────────────────────────────────────
function requireAuth(role) {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/index.html';
    return false;
  }
  if (role && user.role !== role) {
    window.location.href = user.role === 'admin' ? '/admin/' : '/schedule.html';
    return false;
  }
  return true;
}

function redirectIfLoggedIn() {
  const user = getUser();
  const token = getToken();
  if (user && token) {
    window.location.href = user.role === 'admin' ? '/admin/' : '/schedule.html';
    return true;
  }
  return false;
}

// ─── Date Utilities ───────────────────────────────────────────────────────────
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES_FULL  = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTH_NAMES     = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function toISODateString(date) {
  // Returns YYYY-MM-DD in local time
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(dateStr) {
  // dateStr = YYYY-MM-DD (UTC)
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
}

function formatDateFull(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_NAMES_FULL[dow]}, ${String(d).padStart(2,'0')} de ${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m - 1]}`;
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ─── DOM helpers ─────────────────────────────────────────────────────────────
function $(selector, parent = document) {
  return parent.querySelector(selector);
}
function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}
function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

// ─── Status label ─────────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    pending:   ['badge--pending',   'Pendente'],
    confirmed: ['badge--confirmed', 'Confirmado'],
    cancelled: ['badge--cancelled', 'Cancelado'],
  };
  const [cls, label] = map[status] || ['', status];
  return `<span class="badge ${cls}">${label}</span>`;
}
