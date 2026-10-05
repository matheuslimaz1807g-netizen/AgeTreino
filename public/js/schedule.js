if (!requireAuth('student')) { /* redirected */ }

const user = getUser();
document.getElementById('user-name-display').textContent = user?.name?.split(' ')[0] || '';
document.getElementById('logout-btn').addEventListener('click', async () => {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearToken();
  window.location.href = '/index.html';
});

// ─── State ───────────────────────────────────────────────────────────────────
let selectedDate = null;
let selectedSlot = null;
const NUM_DAYS = 14; // show next 14 days

// ─── Date Picker ─────────────────────────────────────────────────────────────
function buildDatePicker() {
  const bar = document.getElementById('date-picker-bar');
  bar.innerHTML = '';
  const today = new Date();

  for (let i = 0; i < NUM_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = toISODateString(d);
    const chip = document.createElement('div');
    chip.className = 'date-chip' + (i === 0 ? ' active' : '');
    chip.dataset.date = iso;
    chip.innerHTML = `
      <span>${DAY_NAMES_SHORT[d.getDay()]}</span>
      <span class="date-chip__day">${d.getDate()}</span>
      <span>${MONTH_NAMES[d.getMonth()]}</span>
    `;
    chip.addEventListener('click', () => selectDate(iso, chip));
    bar.appendChild(chip);
  }

  // Select today
  const todayIso = toISODateString(today);
  selectDate(todayIso, bar.querySelector('.date-chip'));
}

function selectDate(iso, chipEl) {
  document.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
  chipEl.classList.add('active');
  selectedDate = iso;
  loadSlots(iso);
}

// ─── Slots ───────────────────────────────────────────────────────────────────
async function loadSlots(dateStr) {
  const container = document.getElementById('slots-container');
  container.innerHTML = '<div class="loading-overlay"><div class="spinner spinner--lg"></div></div>';

  try {
    const slots = await apiFetch(`/schedules/available?date=${dateStr}`);
    renderSlots(slots, dateStr);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h3>Erro ao carregar horários</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
  }
}

function renderSlots(slots, dateStr) {
  const container = document.getElementById('slots-container');
  if (!slots.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📅</div>
        <h3>Nenhum horário disponível</h3>
        <p>Não há horários disponíveis para esta data.</p>
      </div>`;
    return;
  }

  const list = document.createElement('div');
  list.className = 'slot-list';

  for (const slot of slots) {
    const item = document.createElement('div');
    const isFull = slot.isFull;
    item.className = 'slot-item' + (isFull ? ' slot-item--full' : '');
    item.innerHTML = `
      <div>
        <div class="slot-item__time">${slot.startTime} – ${slot.endTime}</div>
        <div class="slot-item__sub">
          ${slot.available} ${slot.available === 1 ? 'vaga disponível' : 'vagas disponíveis'}
        </div>
      </div>
      <div class="slot-item__right">
        ${buildVacancyDots(slot)}
        ${isFull
          ? '<span class="badge badge--full">Lotado</span>'
          : '<button class="btn btn--accent btn--sm">Agendar</button>'}
      </div>`;

    if (!isFull) {
      item.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        openConfirmModal(slot, dateStr);
      });
      item.addEventListener('click', () => openConfirmModal(slot, dateStr));
    }

    list.appendChild(item);
  }

  container.innerHTML = '';
  container.appendChild(list);
}

function buildVacancyDots(slot) {
  const max = Math.min(slot.capacity, 6); // show at most 6 dots
  let dots = '<div class="vacancy-dots">';
  for (let i = 0; i < max; i++) {
    dots += `<div class="vacancy-dot${i < slot.booked ? ' filled' : ''}"></div>`;
  }
  dots += '</div>';
  return `<div class="vacancy-indicator">${dots}<span>${slot.booked}/${slot.capacity}</span></div>`;
}

// ─── Confirm Modal ───────────────────────────────────────────────────────────
function openConfirmModal(slot, dateStr) {
  selectedSlot = slot;
  document.getElementById('modal-slot-time').textContent = `${slot.startTime} – ${slot.endTime}`;
  document.getElementById('modal-slot-date').textContent = formatDateFull(dateStr);
  document.getElementById('confirm-error').classList.add('hidden');
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('confirm-modal').classList.add('hidden');
  document.body.style.overflow = '';
  selectedSlot = null;
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
document.getElementById('confirm-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById('modal-confirm-btn').addEventListener('click', async () => {
  if (!selectedSlot || !selectedDate) return;
  const btn = document.getElementById('modal-confirm-btn');
  const errEl = document.getElementById('confirm-error');
  errEl.classList.add('hidden');
  setLoading(btn, true);

  try {
    await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({ slotId: selectedSlot.id, date: selectedDate }),
    });
    closeModal();
    showToast('Agendamento solicitado! Aguarde a confirmação.', 'success');
    loadSlots(selectedDate); // refresh availability
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    setLoading(btn, false);
  }
});

// ─── Init ────────────────────────────────────────────────────────────────────
buildDatePicker();
