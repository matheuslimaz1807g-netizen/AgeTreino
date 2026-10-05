// ─── Students Admin Page ────────────────────────────────────────────────────
'use strict';

requireAuth('admin');

document.getElementById('admin-logout-btn').addEventListener('click', async () => {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearToken();
  window.location.href = '/index.html';
});

// ─── Constants ───────────────────────────────────────────────────────────────
const PARTNER_LABELS = {
  wellhub:    'Wellhub',
  totalpass:  'TotalPass',
  classpass:  'ClassPass',
  particular: 'Particular',
};
const PLAN_LABELS = {
  twice_a_week:        '2× / semana',
  three_times_a_week:  '3× / semana',
  monthly_free:        'Mensal Livre',
};
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_LABELS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// ─── State ───────────────────────────────────────────────────────────────────
let allSlots = [];     // grade slots from server
let editingId = null;  // student ID currently being edited

// ─── Load grade slots ────────────────────────────────────────────────────────
async function loadSlots() {
  try {
    allSlots = await apiFetch('/schedules');
  } catch {
    allSlots = [];
  }
}

// ─── Render student table ────────────────────────────────────────────────────
async function loadStudents() {
  const search = document.getElementById('search-input').value.trim();
  const active = document.getElementById('filter-active').value;
  const params = new URLSearchParams();
  if (active !== '') params.set('active', active);
  if (search)        params.set('search', search);

  const tbody = document.getElementById('students-tbody');
  tbody.innerHTML = '<tr><td colspan="6"><div class="loading-overlay"><div class="spinner spinner--lg"></div></div></td></tr>';

  try {
    const students = await apiFetch(`/students?${params}`);
    renderTable(students);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">⚠️</div><h3>Erro ao carregar</h3><p>${escapeHtml(err.message)}</p></div></td></tr>`;
  }
}

function renderTable(students) {
  const tbody = document.getElementById('students-tbody');
  if (!students.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">👤</div><h3>Nenhum aluno encontrado</h3><p>Clique em "Novo Aluno" para cadastrar.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = students.map((s) => {
    const partnerBadge = `<span class="badge badge--${s.partnerType}">${escapeHtml(PARTNER_LABELS[s.partnerType] || s.partnerType)}</span>`;
    const planBadge    = `<span class="badge badge--plan">${escapeHtml(PLAN_LABELS[s.planType] || s.planType)}</span>`;
    const activeBadge  = s.active ? '' : ' <span class="badge badge--inactive">Inativo</span>';

    const scheduleTags = (s.horariosFixos || []).map((h) =>
      `<span class="schedule-tag">${DAY_LABELS[h.dayOfWeek]} ${h.startTime}</span>`
    ).join('');

    return `
      <tr>
        <td>
          <span style="font-weight:600;">${escapeHtml(s.name)}</span>${activeBadge}
          ${s.documentId ? `<div class="text-muted" style="font-size:.75rem;">${escapeHtml(s.documentId)}</div>` : ''}
        </td>
        <td>${escapeHtml(s.phone || '—')}</td>
        <td>${partnerBadge}</td>
        <td>${planBadge}</td>
        <td>
          <div class="schedule-tags">
            ${scheduleTags || '<span class="text-muted" style="font-size:.8125rem;">Nenhum</span>'}
          </div>
        </td>
        <td class="col-actions">
          <button class="btn btn--outline btn--sm" onclick="openEdit('${s.id}')">Editar</button>
        </td>
      </tr>`;
  }).join('');
}

// ─── Modal logic ──────────────────────────────────────────────────────────────
const modal        = document.getElementById('student-modal');
const modalTitle   = document.getElementById('modal-title');
const formError    = document.getElementById('student-form-error');
const btnToggle    = document.getElementById('btn-toggle-active');

function openModal() {
  modal.classList.remove('hidden');
  formError.classList.add('hidden');
  document.getElementById('schedule-conflicts').classList.add('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  document.getElementById('student-form').reset();
  document.getElementById('student-id').value = '';
  editingId = null;
  btnToggle.classList.add('hidden');
  buildDayGrid([]);
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ─── Day/Slot Grid ────────────────────────────────────────────────────────────
function buildDayGrid(selectedHorarios) {
  const grid = document.getElementById('day-grid');

  // Group allSlots by dayOfWeek
  const byDay = {};
  for (const slot of allSlots) {
    if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
    byDay[slot.dayOfWeek].push(slot);
  }

  if (!Object.keys(byDay).length) {
    grid.innerHTML = '<p class="text-muted" style="font-size:.8125rem;">Nenhuma turma na grade. Crie horários primeiro.</p>';
    return;
  }

  const selectedMap = {};
  for (const h of selectedHorarios) {
    const key = `${h.dayOfWeek}`;
    if (!selectedMap[key]) selectedMap[key] = [];
    selectedMap[key].push(h.startTime);
  }

  const days = Object.keys(byDay).sort((a, b) => Number(a) - Number(b));
  grid.innerHTML = days.map((dow) => {
    const daySlots = byDay[dow].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const isChecked = selectedMap[dow]?.length > 0;
    const selectedTime = selectedMap[dow]?.[0] || daySlots[0].startTime;

    const options = daySlots.map((s) =>
      `<option value="${s.startTime}|${s.endTime}" ${s.startTime === selectedTime ? 'selected' : ''}>${s.startTime} – ${s.endTime}</option>`
    ).join('');

    return `
      <div class="day-slot-row ${isChecked ? 'selected' : ''}" data-dow="${dow}">
        <label>
          <input type="checkbox" class="day-checkbox" data-dow="${dow}" ${isChecked ? 'checked' : ''}>
          ${DAY_LABELS_FULL[Number(dow)]}
        </label>
        <select class="day-time-select" data-dow="${dow}">${options}</select>
      </div>`;
  }).join('');

  // Toggle select visibility on checkbox change
  grid.querySelectorAll('.day-checkbox').forEach((cb) => {
    cb.addEventListener('change', () => {
      const row = cb.closest('.day-slot-row');
      row.classList.toggle('selected', cb.checked);
    });
  });
}

function collectHorarios() {
  const horarios = [];
  document.querySelectorAll('.day-checkbox:checked').forEach((cb) => {
    const dow = Number(cb.dataset.dow);
    const sel = document.querySelector(`.day-time-select[data-dow="${dow}"]`);
    if (!sel) return;
    const [startTime, endTime] = sel.value.split('|');
    horarios.push({ dayOfWeek: dow, startTime, endTime });
  });
  return horarios;
}

// ─── Open for create ─────────────────────────────────────────────────────────
document.getElementById('btn-new-student').addEventListener('click', () => {
  editingId = null;
  modalTitle.textContent = 'Novo Aluno';
  btnToggle.classList.add('hidden');
  buildDayGrid([]);
  openModal();
});

// ─── Open for edit ───────────────────────────────────────────────────────────
window.openEdit = async function (id) {
  editingId = id;
  modalTitle.textContent = 'Editar Aluno';
  buildDayGrid([]);
  openModal();

  try {
    const student = await apiFetch(`/students/${id}`);
    document.getElementById('student-id').value = student.id;
    document.getElementById('s-name').value    = student.name;
    document.getElementById('s-phone').value   = student.phone || '';
    document.getElementById('s-doc').value     = student.documentId || '';
    document.getElementById('s-partner').value = student.partnerType;
    document.getElementById('s-plan').value    = student.planType;

    buildDayGrid(student.horariosFixos || []);

    btnToggle.classList.remove('hidden');
    btnToggle.textContent = student.active ? 'Desativar Aluno' : 'Reativar Aluno';
    btnToggle.onclick = () => toggleActive(id, !student.active);
  } catch (err) {
    closeModal();
    showToast(err.message, 'danger');
  }
};

// ─── Toggle active ────────────────────────────────────────────────────────────
async function toggleActive(id, newActive) {
  try {
    await apiFetch(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: newActive }),
    });
    showToast(newActive ? 'Aluno reativado.' : 'Aluno desativado.', 'success');
    closeModal();
    loadStudents();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────
document.getElementById('modal-save-btn').addEventListener('click', async () => {
  const btn = document.getElementById('modal-save-btn');
  formError.classList.add('hidden');

  const name      = document.getElementById('s-name').value.trim();
  const phone     = document.getElementById('s-phone').value.trim();
  const documentId= document.getElementById('s-doc').value.trim();
  const partnerType= document.getElementById('s-partner').value;
  const planType  = document.getElementById('s-plan').value;

  if (!name || !partnerType || !planType) {
    formError.textContent = 'Preencha os campos obrigatórios: Nome, Parceiro e Plano.';
    formError.classList.remove('hidden');
    return;
  }

  const payload = { name, partnerType, planType };
  if (phone)      payload.phone = phone;
  if (documentId) payload.documentId = documentId;

  setLoading(btn, true);
  try {
    let student;
    if (editingId) {
      student = await apiFetch(`/students/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      student = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    // Save fixed schedules
    const horarios = collectHorarios();
    const syncResult = await apiFetch(`/students/${student.id}/schedules`, {
      method: 'PUT',
      body: JSON.stringify({ horarios }),
    });

    showToast(editingId ? 'Aluno atualizado!' : 'Aluno cadastrado!', 'success');
    closeModal();
    loadStudents();
  } catch (err) {
    formError.textContent = err.message || 'Erro ao salvar aluno.';
    formError.classList.remove('hidden');
    setLoading(btn, false);
  }
});

// ─── Filters ─────────────────────────────────────────────────────────────────
let searchTimeout;
document.getElementById('search-input').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadStudents, 300);
});
document.getElementById('filter-active').addEventListener('change', loadStudents);

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
  await loadSlots();
  await loadStudents();
})();
