if (!requireAuth('admin')) { /* redirected */ }

document.getElementById('admin-logout-btn').addEventListener('click', async () => {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearToken();
  window.location.href = '/index.html';
});

// URL Param extraction
const urlParams = new URLSearchParams(window.location.search);
const filterDateEl = document.getElementById('filter-date');
const filterStatusEl = document.getElementById('filter-status');
const filterDateLabelEl = document.getElementById('filter-date-label');

function updateFilterDateLabel(isoStr) {
  if (filterDateLabelEl) {
    filterDateLabelEl.textContent = isoStr ? formatDate(isoStr) : '';
  }
}

if (urlParams.has('date')) {
  filterDateEl.value = urlParams.get('date');
} else {
  filterDateEl.value = toISODateString(new Date());
}
updateFilterDateLabel(filterDateEl.value);
if (urlParams.has('status')) filterStatusEl.value = urlParams.get('status');
const filterSlotId = urlParams.get('slotId') || '';

filterDateEl.addEventListener('change', () => {
  updateFilterDateLabel(filterDateEl.value);
  loadAppointments();
});
filterStatusEl.addEventListener('change', loadAppointments);
document.getElementById('clear-filters-btn').addEventListener('click', () => {
  filterDateEl.value = '';
  filterStatusEl.value = '';
  updateFilterDateLabel('');
  window.history.replaceState({}, document.title, window.location.pathname);
  loadAppointments();
});

let cancelTargetId = null;

async function loadAppointments() {
  const tbody = document.getElementById('appointments-tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px;"><span class="spinner"></span></td></tr>';

  try {
    const params = new URLSearchParams({ limit: 100 });
    if (filterDateEl.value) params.set('date', filterDateEl.value);
    if (filterStatusEl.value) params.set('status', filterStatusEl.value);
    if (filterSlotId) params.set('slotId', filterSlotId);

    const data = await apiFetch(`/appointments?${params}`);
    renderAppointments(data.items);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-danger); padding: 24px;">Erro: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderAppointments(items) {
  const tbody = document.getElementById('appointments-tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--color-text-muted);">Nenhum agendamento encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  for (const appt of items) {
    const tr = document.createElement('tr');
    const dateStr = appt.date.split('T')[0];

    const isPending = appt.status === 'pending';
    const isCancelled = appt.status === 'cancelled';
    const studentName = appt.usuario 
      ? escapeHtml(appt.usuario.name) 
      : appt.aluno 
        ? escapeHtml(appt.aluno.name)
        : escapeHtml(appt.guestName || 'Aluno');
        
    const studentType = appt.usuario 
      ? `<span class="badge" style="background: #e0f2fe; color: #0369a1;">App</span>`
      : appt.aluno 
        ? `<span class="badge" style="background: #dcfce7; color: #166534;">Fixo</span>`
        : `<span class="badge" style="background: #fef3c7; color: #92400e;">Manual</span>`;

    tr.innerHTML = `
      <td style="font-weight: 600;">${studentName}</td>
      <td>${studentType}</td>
      <td>${formatDate(dateStr)}</td>
      <td><strong>${appt.slot.startTime} – ${appt.slot.endTime}</strong></td>
      <td>${statusBadge(appt.status)}</td>
      <td>
        <div style="display: flex; gap: 6px;">
          ${isPending ? `<button class="btn btn--success btn--sm confirm-btn" data-id="${appt.id}">Confirmar</button>` : ''}
          ${!isCancelled ? `<button class="btn btn--outline btn--sm cancel-btn" data-id="${appt.id}">Recusar</button>` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }

  // Bind actions
  tbody.querySelectorAll('.confirm-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmAppointment(btn.dataset.id, btn));
  });
  tbody.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cancelTargetId = btn.dataset.id;
      document.getElementById('cancel-reason').value = '';
      document.getElementById('cancel-error').classList.add('hidden');
      document.getElementById('admin-cancel-modal').classList.remove('hidden');
    });
  });
}

async function confirmAppointment(id, btn) {
  setLoading(btn, true);
  try {
    await apiFetch(`/appointments/${id}/confirm`, { method: 'PATCH' });
    showToast('Agendamento confirmado.', 'success');
    loadAppointments();
  } catch (err) {
    showToast(err.message, 'danger');
    setLoading(btn, false);
  }
}

// Cancel/Reject Modal Logic
function closeCancelModal() {
  document.getElementById('admin-cancel-modal').classList.add('hidden');
  cancelTargetId = null;
}
document.getElementById('cancel-modal-close').addEventListener('click', closeCancelModal);
document.getElementById('cancel-keep-btn').addEventListener('click', closeCancelModal);

document.getElementById('cancel-confirm-btn').addEventListener('click', async () => {
  if (!cancelTargetId) return;
  const btn = document.getElementById('cancel-confirm-btn');
  const errEl = document.getElementById('cancel-error');
  const reason = document.getElementById('cancel-reason').value;

  errEl.classList.add('hidden');
  setLoading(btn, true);

  try {
    await apiFetch(`/appointments/${cancelTargetId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    closeCancelModal();
    showToast('Agendamento recusado/cancelado.', 'success');
    loadAppointments();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    setLoading(btn, false);
  }
});

// ─── Manual Admin Booking Modal ──────────────────────────────────────────
const bookModal = document.getElementById('admin-book-modal');
const bookBtn = document.getElementById('admin-book-btn');
const bookDateInput = document.getElementById('book-date');
const bookSlotSelect = document.getElementById('book-slot');
const bookStudentNameInput = document.getElementById('book-student-name');
const bookErrorEl = document.getElementById('book-error');
const bookForm = document.getElementById('admin-book-form');
const bookSubmitBtn = document.getElementById('book-submit-btn');

function openBookModal() {
  bookStudentNameInput.value = '';
  bookErrorEl.classList.add('hidden');
  
  // Set default date to filter date or today
  const defaultDate = filterDateEl.value || toISODateString(new Date());
  bookDateInput.value = defaultDate;
  bookDateInput.min = toISODateString(new Date());
  
  loadSlotsForDate(defaultDate);
  bookModal.classList.remove('hidden');
  bookStudentNameInput.focus();
}

function closeBookModal() {
  bookModal.classList.add('hidden');
}

document.getElementById('book-modal-close').addEventListener('click', closeBookModal);
document.getElementById('book-cancel-btn').addEventListener('click', closeBookModal);
if (bookBtn) {
  bookBtn.addEventListener('click', openBookModal);
}

bookDateInput.addEventListener('change', () => {
  if (bookDateInput.value) {
    loadSlotsForDate(bookDateInput.value);
  }
});

async function loadSlotsForDate(dateStr) {
  bookSlotSelect.innerHTML = '<option value="">Carregando horários...</option>';
  bookSlotSelect.disabled = true;

  try {
    const slots = await apiFetch(`/schedules/available?date=${dateStr}`);
    if (!slots.length) {
      bookSlotSelect.innerHTML = '<option value="">Nenhum horário disponível nesta data</option>';
      bookSlotSelect.disabled = true;
      return;
    }

    bookSlotSelect.innerHTML = '<option value="">Selecione um horário...</option>';
    for (const slot of slots) {
      const opt = document.createElement('option');
      opt.value = slot.id;
      const vagasInfo = `${slot.booked}/${slot.capacity} vagas`;
      opt.textContent = `${slot.startTime} – ${slot.endTime} (${vagasInfo}${slot.isFull ? ' - LOTADO' : ''})`;
      if (slot.isFull) opt.disabled = true;
      bookSlotSelect.appendChild(opt);
    }
    bookSlotSelect.disabled = false;
  } catch (err) {
    bookSlotSelect.innerHTML = `<option value="">Erro ao carregar horários</option>`;
    bookSlotSelect.disabled = true;
  }
}

bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  bookErrorEl.classList.add('hidden');

  const guestName = bookStudentNameInput.value.trim();
  const date = bookDateInput.value;
  const slotId = bookSlotSelect.value;

  if (!guestName) {
    bookErrorEl.textContent = 'Informe o nome do aluno.';
    bookErrorEl.classList.remove('hidden');
    return;
  }
  if (!date) {
    bookErrorEl.textContent = 'Selecione uma data.';
    bookErrorEl.classList.remove('hidden');
    return;
  }
  if (!slotId) {
    bookErrorEl.textContent = 'Selecione um horário.';
    bookErrorEl.classList.remove('hidden');
    return;
  }

  setLoading(bookSubmitBtn, true);

  try {
    await apiFetch('/appointments/admin-book', {
      method: 'POST',
      body: JSON.stringify({ guestName, date, slotId }),
    });

    closeBookModal();
    showToast(`Aluno "${escapeHtml(guestName)}" inscrito com sucesso!`, 'success');
    loadAppointments();
  } catch (err) {
    bookErrorEl.textContent = err.message;
    bookErrorEl.classList.remove('hidden');
  } finally {
    setLoading(bookSubmitBtn, false);
  }
});

// Init
loadAppointments();
