if (!requireAuth('admin')) { /* redirected */ }

document.getElementById('admin-logout-btn').addEventListener('click', async () => {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearToken();
  window.location.href = '/index.html';
});

const dateInput = document.getElementById('dashboard-date');
const todayStr = toISODateString(new Date());
dateInput.value = todayStr;
// Admin can navigate to any date (past or future) for historical view

// Show date in pt-BR format next to input (browser input[type=date] locale varies by OS)
const dateLabelEl = document.getElementById('dashboard-date-label');
function updateDateLabel(isoStr) {
  if (dateLabelEl && isoStr) dateLabelEl.textContent = formatDate(isoStr);
}
updateDateLabel(todayStr);

dateInput.addEventListener('change', () => {
  updateDateLabel(dateInput.value);
  loadDashboardData(dateInput.value);
});

async function loadDashboardData(dateStr) {
  const container = document.getElementById('dashboard-occupancy-list');
  container.innerHTML = '<div class="loading-overlay"><div class="spinner spinner--lg"></div></div>';

  try {
    // 1. Load active slots matching current day of week
    const slots = await apiFetch(`/schedules/available?date=${dateStr}`);
    
    // 2. Fetch all appointments for the date to compile statistics
    const appointmentsData = await apiFetch(`/appointments?date=${dateStr}&limit=500`);
    const appts = appointmentsData.items;

    const pending = appts.filter(a => a.status === 'pending').length;
    const confirmed = appts.filter(a => a.status === 'confirmed').length;
    const totalCapacity = slots.reduce((acc, curr) => acc + curr.capacity, 0);
    const totalBooked = slots.reduce((acc, curr) => acc + curr.booked, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    // Update Stats
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-confirmed').textContent = confirmed;
    document.getElementById('stat-capacity').textContent = totalCapacity;
    document.getElementById('stat-occupancy').textContent = `${occupancyRate}%`;

    // Sidebar/Nav Badge update
    const badge = document.getElementById('nav-pending-badge');
    if (badge) {
      if (pending > 0) {
        badge.textContent = pending;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    renderOccupancyList(slots, dateStr);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h3>Erro ao processar dados</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
  }
}

function renderOccupancyList(slots, dateStr) {
  const container = document.getElementById('dashboard-occupancy-list');
  if (!slots.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 24px;">
        <div class="empty-state__icon">📅</div>
        <h3>Nenhum horário na grade para hoje</h3>
        <p>Não há horários ativos cadastrados para este dia da semana.</p>
        <a href="/admin/schedules.html" class="btn btn--primary" style="margin-top: 16px;">Configurar Grade de Horários</a>
      </div>`;
    return;
  }

  container.innerHTML = '';
  for (const slot of slots) {
    const isFull = slot.isFull;
    const percentage = slot.capacity > 0 ? Math.round((slot.booked / slot.capacity) * 100) : 0;
    const availableSpots = slot.capacity - slot.booked;

    const item = document.createElement('div');
    item.className = 'occupancy-block';
    item.innerHTML = `
      <div>
        <div class="occupancy-block__header">
          <span class="occupancy-block__title">${slot.startTime} – ${slot.endTime}</span>
          <span class="badge ${isFull ? 'badge--full' : 'badge--available'}">
            ${isFull ? 'Lotado' : `${availableSpots} vaga${availableSpots > 1 ? 's' : ''} livre${availableSpots > 1 ? 's' : ''}`}
          </span>
        </div>

        <div style="margin: 14px 0 6px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 500; margin-bottom: 6px; color: var(--color-text-muted);">
            <span>${slot.booked} de ${slot.capacity} vagas ocupadas</span>
            <span style="font-weight: 600; color: var(--color-text);">${percentage}%</span>
          </div>
          <div class="occupancy-bar">
            <div class="occupancy-bar__fill ${isFull ? 'full' : ''}" style="width: ${percentage}%"></div>
          </div>
        </div>
      </div>

      <div class="occupancy-block__footer">
        <span style="font-size: 0.8125rem; color: var(--color-text-muted);">
          ${slot.booked > 0 ? `${slot.booked} aluno${slot.booked > 1 ? 's' : ''} agendado${slot.booked > 1 ? 's' : ''}` : 'Sem agendamentos'}
        </span>
        <a href="/admin/appointments.html?slotId=${slot.id}&date=${dateStr}" class="btn btn--outline btn--sm">
          Ver Alunos
        </a>
      </div>
    `;
    container.appendChild(item);
  }
}

// Init
loadDashboardData(todayStr);
