if (!requireAuth('admin')) { /* redirected */ }

document.getElementById('admin-logout-btn').addEventListener('click', async () => {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearToken();
  window.location.href = '/index.html';
});

// ─── Load Slots ──────────────────────────────────────────────────────────────
async function loadSlots() {
  const container = document.getElementById('slots-by-day-container');
  container.innerHTML = '<div class="loading-overlay"><div class="spinner spinner--lg"></div></div>';

  try {
    const slots = await apiFetch('/schedules');
    renderSlotsGrouped(slots);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h3>Erro ao carregar grade</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
  }
}

function renderSlotsGrouped(slots) {
  const container = document.getElementById('slots-by-day-container');
  container.innerHTML = '';

  // Group by day of week (0 to 6)
  const grouped = Array.from({ length: 7 }, () => []);
  slots.forEach(slot => {
    grouped[slot.dayOfWeek].push(slot);
  });

  // Reorder starting from Monday (1) to Sunday (0)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];

  dayOrder.forEach(day => {
    const daySlots = grouped[day];
    if (!daySlots.length) return;

    const daySection = document.createElement('div');
    daySection.className = 'day-card';
    daySection.innerHTML = `
      <div class="day-card__header">
        <div class="day-card__title">
          ${DAY_NAMES_FULL[day]}
        </div>
        <span class="badge" style="background: #f1f5f9; color: #475569; font-weight: 500; font-size: 0.8125rem;">
          ${daySlots.length} horário${daySlots.length > 1 ? 's' : ''}
        </span>
      </div>
      <div class="table-wrap">
        <table class="table" style="width: 100%;">
          <thead>
            <tr>
              <th style="width: 30%;">Horário</th>
              <th style="width: 25%;">Capacidade</th>
              <th style="width: 20%;">Status</th>
              <th style="width: 25%; text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${daySlots.map(slot => `
              <tr style="opacity: ${slot.active ? '1' : '0.5'};">
                <td>
                  <span style="font-weight: 600; font-size: 0.9375rem; color: var(--color-text);">${slot.startTime} – ${slot.endTime}</span>
                </td>
                <td>
                  <span style="color: var(--color-text); font-weight: 500;">
                    ${slot.capacity} vagas
                  </span>
                </td>
                <td>
                  <span class="badge ${slot.active ? 'badge--available' : 'badge--cancelled'}">
                    ${slot.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn--outline btn--sm edit-btn" data-slot='${JSON.stringify(slot)}'>Editar</button>
                    <button class="btn btn--ghost btn--sm toggle-btn" data-id="${slot.id}" data-active="${slot.active}" style="color: ${slot.active ? '#dc2626' : '#16a34a'};">
                      ${slot.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.appendChild(daySection);
  });

  if (slots.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📅</div>
        <h3>Grade vazia</h3>
        <p>Cadastre o primeiro horário para começar.</p>
      </div>`;
  }

  // Bind buttons
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = JSON.parse(btn.dataset.slot);
      openModal(slot);
    });
  });

  container.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleSlot(btn.dataset.id, btn.dataset.active === 'true', btn));
  });
}

async function toggleSlot(id, currentActive, btn) {
  setLoading(btn, true);
  try {
    await apiFetch(`/schedules/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !currentActive }),
    });
    showToast('Status do horário atualizado.', 'success');
    loadSlots();
  } catch (err) {
    showToast(err.message, 'danger');
    setLoading(btn, false);
  }
}

// ─── Modal Add / Edit ────────────────────────────────────────────────────────
const modal = document.getElementById('slot-modal');
const form = document.getElementById('slot-form');
const modalTitle = document.getElementById('modal-title');
const errorEl = document.getElementById('slot-error');

function openModal(slot = null) {
  errorEl.classList.add('hidden');
  modal.classList.remove('hidden');

  if (slot) {
    modalTitle.textContent = 'Editar Horário';
    document.getElementById('slot-id').value = slot.id;
    document.getElementById('slot-day').value = slot.dayOfWeek;
    document.getElementById('slot-start').value = slot.startTime;
    document.getElementById('slot-end').value = slot.endTime;
    document.getElementById('slot-capacity').value = slot.capacity;
    document.getElementById('slot-day').disabled = true; // prevent changing day/time key on edit
    document.getElementById('slot-start').disabled = true;
    document.getElementById('slot-end').disabled = true;
  } else {
    modalTitle.textContent = 'Adicionar Horário';
    form.reset();
    document.getElementById('slot-id').value = '';
    document.getElementById('slot-day').disabled = false;
    document.getElementById('slot-start').disabled = false;
    document.getElementById('slot-end').disabled = false;
  }
}

function closeModal() {
  modal.classList.add('hidden');
}

document.getElementById('add-slot-btn').addEventListener('click', () => openModal());
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('modal-submit-btn');
  setLoading(btn, true);
  errorEl.classList.add('hidden');

  const id = document.getElementById('slot-id').value;
  const isEdit = !!id;

  const body = {
    dayOfWeek: Number(document.getElementById('slot-day').value),
    startTime: document.getElementById('slot-start').value,
    endTime: document.getElementById('slot-end').value,
    capacity: Number(document.getElementById('slot-capacity').value),
  };

  try {
    if (isEdit) {
      // For updates, we only allow updating capacity via the API
      await apiFetch(`/schedules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ capacity: body.capacity }),
      });
    } else {
      await apiFetch('/schedules', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }

    closeModal();
    showToast(isEdit ? 'Horário editado com sucesso.' : 'Horário criado com sucesso.', 'success');
    loadSlots();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    setLoading(btn, false);
  }
});

// Init
loadSlots();
