if (!requireAuth('student')) { /* redirected */ }

const user = getUser();
document.getElementById('user-name-display').textContent = user?.name?.split(' ')[0] || '';
document.getElementById('logout-btn').addEventListener('click', async () => {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearToken();
  window.location.href = '/index.html';
});

let currentStatus = '';
let cancelTargetId = null;

// ─── Filter Tabs ─────────────────────────────────────────────────────────────
document.querySelectorAll('[data-status]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-status]').forEach(b => {
      b.className = 'btn btn--sm btn--outline';
    });
    btn.className = 'btn btn--sm btn--primary';
    currentStatus = btn.dataset.status;
    loadAppointments();
  });
});

// ─── Load ────────────────────────────────────────────────────────────────────
async function loadAppointments() {
  const container = document.getElementById('appointments-container');
  container.innerHTML = '<div class="loading-overlay"><div class="spinner spinner--lg"></div></div>';

  try {
    const params = new URLSearchParams({ limit: 50 });
    if (currentStatus) params.set('status', currentStatus);
    const data = await apiFetch(`/appointments?${params}`);
    renderAppointments(data.items);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h3>Erro ao carregar</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
  }
}

function renderAppointments(items) {
  const container = document.getElementById('appointments-container');
  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📋</div>
        <h3>Nenhum agendamento</h3>
        <p>Você ainda não tem agendamentos${currentStatus ? ' com este status' : ''}.</p>
        <a href="/schedule.html" class="btn btn--primary" style="margin-top: 16px;">Agendar agora</a>
      </div>`;
    return;
  }

  const list = document.createElement('div');
  list.className = 'slot-list';

  for (const appt of items) {
    const dateStr = appt.date.split('T')[0];
    const canCancel = appt.status !== 'cancelled';
    const item = document.createElement('div');
    item.className = 'appointment-item';
    item.innerHTML = `
      <div class="appointment-item__info">
        <div class="appointment-item__date">${formatDateFull(dateStr)}</div>
        <div class="appointment-item__time">${appt.slot.startTime} – ${appt.slot.endTime}</div>
        <div style="margin-top: 6px;">${statusBadge(appt.status)}</div>
      </div>
      <div class="appointment-item__actions">
        ${canCancel ? `<button class="btn btn--outline btn--sm cancel-btn" data-id="${appt.id}" data-date="${dateStr}" data-time="${appt.slot.startTime} – ${appt.slot.endTime}">Cancelar</button>` : ''}
      </div>`;
    list.appendChild(item);
  }

  container.innerHTML = '';
  container.appendChild(list);

  // Bind cancel buttons
  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cancelTargetId = btn.dataset.id;
      const info = document.getElementById('cancel-appointment-info');
      info.innerHTML = `<strong>${formatDateFull(btn.dataset.date)}</strong><br>${btn.dataset.time}`;
      document.getElementById('cancel-error').classList.add('hidden');
      document.getElementById('cancel-modal').classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
function closeCancelModal() {
  document.getElementById('cancel-modal').classList.add('hidden');
  document.body.style.overflow = '';
  cancelTargetId = null;
}
document.getElementById('cancel-modal-close').addEventListener('click', closeCancelModal);
document.getElementById('cancel-keep-btn').addEventListener('click', closeCancelModal);
document.getElementById('cancel-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeCancelModal();
});

document.getElementById('cancel-confirm-btn').addEventListener('click', async () => {
  if (!cancelTargetId) return;
  const btn = document.getElementById('cancel-confirm-btn');
  const errEl = document.getElementById('cancel-error');
  errEl.classList.add('hidden');
  setLoading(btn, true);
  try {
    await apiFetch(`/appointments/${cancelTargetId}/cancel`, { method: 'PATCH', body: JSON.stringify({}) });
    closeCancelModal();
    showToast('Agendamento cancelado.', 'success');
    loadAppointments();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    setLoading(btn, false);
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadAppointments();
