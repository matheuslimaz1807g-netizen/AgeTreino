/**
 * Age Treino Studio Personal — Mock Service Layer
 * Permite que a aplicação funcione 100% no navegador (Client-side),
 * sem necessidade de banco de dados, Docker ou VPS para apresentações.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    INIT: 'AGE_MOCK_INITIALIZED_V1',
    USERS: 'AGE_MOCK_USERS',
    STUDENTS: 'AGE_MOCK_STUDENTS',
    SLOTS: 'AGE_MOCK_SLOTS',
    APPOINTMENTS: 'AGE_MOCK_APPOINTMENTS',
    MINIMIZED: 'AGE_MOCK_BAR_MINIMIZED',
  };

  // ─── Helpers de Data ────────────────────────────────────────────────────────
  function toISODateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getOffsetDate(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d;
  }

  function getOffsetDateIso(daysOffset) {
    return toISODateString(getOffsetDate(daysOffset));
  }

  // ─── Inicialização do Banco Mock ───────────────────────────────────────────
  function initMockDatabase(force = false) {
    if (!force && localStorage.getItem(STORAGE_KEYS.INIT)) {
      return;
    }

    // 1. Usuários de Autenticação
    const users = [
      {
        id: 'usr-admin-1',
        name: 'Administrador Age',
        email: 'admin@age.com',
        role: 'admin',
      },
      {
        id: 'usr-student-1',
        name: 'Carlos Silva',
        email: 'aluno@age.com',
        role: 'student',
      },
    ];

    // 2. Grade de Horários (Segunda a Sábado)
    const slots = [];
    // Segunda (1) a Sexta (5)
    for (let day = 1; day <= 5; day++) {
      const times = [
        { start: '07:00', end: '08:00', cap: 6 },
        { start: '08:00', end: '09:00', cap: 6 },
        { start: '09:00', end: '10:00', cap: 6 },
        { start: '10:00', end: '11:00', cap: 6 },
        { start: '17:00', end: '18:00', cap: 6 },
        { start: '18:00', end: '19:00', cap: 6 },
        { start: '19:00', end: '20:00', cap: 6 },
      ];
      times.forEach((t, idx) => {
        slots.push({
          id: `slot-d${day}-${t.start.replace(':', '')}`,
          dayOfWeek: day,
          startTime: t.start,
          endTime: t.end,
          capacity: t.cap,
          active: true,
        });
      });
    }

    // Sábado (6)
    [
      { start: '08:00', end: '09:00', cap: 8 },
      { start: '09:00', end: '10:00', cap: 8 },
      { start: '10:00', end: '11:00', cap: 8 },
    ].forEach((t) => {
      slots.push({
        id: `slot-d6-${t.start.replace(':', '')}`,
        dayOfWeek: 6,
        startTime: t.start,
        endTime: t.end,
        capacity: t.cap,
        active: true,
      });
    });

    // 3. Alunos Cadastrados
    const students = [
      {
        id: 'std-1',
        name: 'Carlos Silva',
        phone: '(11) 98765-4321',
        documentId: '456.789.123-00',
        partnerType: 'particular',
        planType: 'twice_a_week',
        active: true,
        horariosFixos: [
          { id: 'fix-1', dayOfWeek: 2, startTime: '18:00', endTime: '19:00' },
          { id: 'fix-2', dayOfWeek: 4, startTime: '18:00', endTime: '19:00' },
        ],
      },
      {
        id: 'std-2',
        name: 'Mariana Souza',
        phone: '(11) 97654-3210',
        documentId: '234.567.890-11',
        partnerType: 'wellhub',
        planType: 'three_times_a_week',
        active: true,
        horariosFixos: [
          { id: 'fix-3', dayOfWeek: 1, startTime: '08:00', endTime: '09:00' },
          { id: 'fix-4', dayOfWeek: 3, startTime: '08:00', endTime: '09:00' },
          { id: 'fix-5', dayOfWeek: 5, startTime: '08:00', endTime: '09:00' },
        ],
      },
      {
        id: 'std-3',
        name: 'Lucas Ferreira',
        phone: '(11) 99123-4567',
        documentId: '345.678.901-22',
        partnerType: 'totalpass',
        planType: 'monthly_free',
        active: true,
        horariosFixos: [
          { id: 'fix-6', dayOfWeek: 1, startTime: '19:00', endTime: '20:00' },
          { id: 'fix-7', dayOfWeek: 3, startTime: '19:00', endTime: '20:00' },
        ],
      },
      {
        id: 'std-4',
        name: 'Beatriz Costa',
        phone: '(11) 98234-5678',
        documentId: '567.890.123-33',
        partnerType: 'classpass',
        planType: 'twice_a_week',
        active: true,
        horariosFixos: [
          { id: 'fix-8', dayOfWeek: 2, startTime: '09:00', endTime: '10:00' },
          { id: 'fix-9', dayOfWeek: 4, startTime: '09:00', endTime: '10:00' },
        ],
      },
      {
        id: 'std-5',
        name: 'Rodrigo Lima',
        phone: '(11) 97345-6789',
        documentId: '678.901.234-44',
        partnerType: 'particular',
        planType: 'three_times_a_week',
        active: true,
        horariosFixos: [
          { id: 'fix-10', dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },
          { id: 'fix-11', dayOfWeek: 3, startTime: '18:00', endTime: '19:00' },
          { id: 'fix-12', dayOfWeek: 5, startTime: '18:00', endTime: '19:00' },
        ],
      },
      {
        id: 'std-6',
        name: 'Juliana Mendes',
        phone: '(11) 99456-7890',
        documentId: '789.012.345-55',
        partnerType: 'wellhub',
        planType: 'twice_a_week',
        active: false,
        horariosFixos: [],
      },
    ];

    // 4. Agendamentos Dinâmicos Relativos à Data Atual
    const appointments = [];
    const today = new Date();

    // Helper para achar slot pelo dia e hora
    function findSlot(dow, timePrefix) {
      return slots.find((s) => s.dayOfWeek === dow && s.startTime.startsWith(timePrefix)) || slots.find((s) => s.dayOfWeek === dow) || slots[0];
    }

    // Criar agendamentos para Hoje (dia 0)
    const todayDow = today.getDay();
    const todayIso = toISODateString(today);
    const todaySlots = slots.filter((s) => s.dayOfWeek === todayDow);

    if (todaySlots.length > 0) {
      // Slot 1: Mariana confirmada
      appointments.push({
        id: 'appt-seed-today-1',
        date: `${todayIso}T00:00:00.000Z`,
        slotId: todaySlots[0].id,
        slot: todaySlots[0],
        status: 'confirmed',
        studentId: 'std-2',
        aluno: students[1],
        createdAt: new Date().toISOString(),
      });

      // Slot 1: Visitante manual
      appointments.push({
        id: 'appt-seed-today-2',
        date: `${todayIso}T00:00:00.000Z`,
        slotId: todaySlots[0].id,
        slot: todaySlots[0],
        status: 'confirmed',
        guestName: 'Pedro Alcantara (Convidado)',
        createdAt: new Date().toISOString(),
      });

      if (todaySlots.length > 1) {
        // Slot 2: Beatriz PENDENTE (para mostrar a notificação no admin!)
        appointments.push({
          id: 'appt-seed-today-3',
          date: `${todayIso}T00:00:00.000Z`,
          slotId: todaySlots[1].id,
          slot: todaySlots[1],
          status: 'pending',
          studentId: 'std-4',
          aluno: students[3],
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Criar agendamento para Amanhã (+1 dia) - Carlos Silva (Aluno Logado)
    const tmrw = getOffsetDate(1);
    const tmrwDow = tmrw.getDay();
    const tmrwIso = toISODateString(tmrw);
    const tmrwSlots = slots.filter((s) => s.dayOfWeek === tmrwDow);
    if (tmrwSlots.length > 0) {
      appointments.push({
        id: 'appt-seed-tmrw-1',
        date: `${tmrwIso}T00:00:00.000Z`,
        slotId: tmrwSlots[0].id,
        slot: tmrwSlots[0],
        status: 'confirmed',
        userId: 'usr-student-1',
        usuario: users[1],
        studentId: 'std-1',
        aluno: students[0],
        createdAt: new Date().toISOString(),
      });
    }

    // Criar agendamento para Ontem (-1 dia)
    const yest = getOffsetDate(-1);
    const yestDow = yest.getDay();
    const yestIso = toISODateString(yest);
    const yestSlots = slots.filter((s) => s.dayOfWeek === yestDow);
    if (yestSlots.length > 0) {
      appointments.push({
        id: 'appt-seed-yest-1',
        date: `${yestIso}T00:00:00.000Z`,
        slotId: yestSlots[0].id,
        slot: yestSlots[0],
        status: 'confirmed',
        userId: 'usr-student-1',
        usuario: users[1],
        studentId: 'std-1',
        aluno: students[0],
        createdAt: new Date().toISOString(),
      });
    }

    // Salvar no localStorage
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    localStorage.setItem(STORAGE_KEYS.INIT, 'true');
  }

  // ─── Getters & Setters de Armazenamento ──────────────────────────────────────
  function getCollection(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  function setCollection(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ─── Roteador Mock de Requisições ───────────────────────────────────────────
  async function mockApiRouter(path, options = {}) {
    initMockDatabase();

    const method = (options.method || 'GET').toUpperCase();
    const url = new URL(path, 'http://localhost');
    const pathname = url.pathname;
    const searchParams = url.searchParams;
    let body = {};

    if (options.body) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch {
        body = {};
      }
    }

    // Simula uma pequena latência de 80ms para suavidade na UI
    await new Promise((r) => setTimeout(r, 80));

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. AUTENTICAÇÃO (/auth/*)
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname === '/auth/login' && method === 'POST') {
      const { email, password } = body;
      const users = getCollection(STORAGE_KEYS.USERS);
      const normalizedEmail = (email || '').trim().toLowerCase();

      let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      // Se não encontrou, deduz pelo padrão ou cria
      if (!user) {
        if (normalizedEmail.includes('admin')) {
          user = users.find((u) => u.role === 'admin') || users[0];
        } else {
          user = users.find((u) => u.role === 'student') || users[1];
        }
      }

      const token = `mock-token-${user.role}-${Date.now()}`;
      return {
        usuario: user,
        accessToken: token,
        refreshToken: `mock-refresh-${Date.now()}`,
      };
    }

    if (pathname === '/auth/logout' && method === 'POST') {
      return { success: true };
    }

    if (pathname === '/auth/refresh' && method === 'POST') {
      return { accessToken: `mock-token-refresh-${Date.now()}` };
    }

    if (pathname === '/auth/me' && method === 'GET') {
      return { usuario: currentUser };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. GRADE DE HORÁRIOS (/schedules/*)
    // ─────────────────────────────────────────────────────────────────────────
    // 2.1 Horários disponíveis para uma data (/schedules/available?date=YYYY-MM-DD)
    if (pathname === '/schedules/available' && method === 'GET') {
      const dateStr = searchParams.get('date') || toISODateString(new Date());
      const [y, m, d] = dateStr.split('-').map(Number);
      const targetDate = new Date(Date.UTC(y, m - 1, d));
      const dow = targetDate.getUTCDay();

      const slots = getCollection(STORAGE_KEYS.SLOTS).filter((s) => s.dayOfWeek === dow && s.active);
      const appointments = getCollection(STORAGE_KEYS.APPOINTMENTS);

      const availableSlots = slots.map((slot) => {
        // Conta agendamentos ativos na data e slot
        const activeAppts = appointments.filter((a) => {
          const aDate = a.date.split('T')[0];
          return aDate === dateStr && a.slotId === slot.id && a.status !== 'cancelled';
        });

        const booked = activeAppts.length;
        const remaining = Math.max(0, slot.capacity - booked);
        const isFull = booked >= slot.capacity;

        const userBooked = currentUser
          ? activeAppts.some((a) => a.userId === currentUser.id || a.studentId === currentUser.id)
          : false;

        return {
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          active: slot.active,
          booked,
          available: remaining,
          remaining,
          isFull,
          userBooked,
        };
      });

      // Ordenar por horário de início
      availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      return availableSlots;
    }

    // 2.2 Listagem geral de horários (/schedules)
    if (pathname === '/schedules' && method === 'GET') {
      const slots = getCollection(STORAGE_KEYS.SLOTS);
      slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
      return slots;
    }

    // 2.3 Criar horário (/schedules)
    if (pathname === '/schedules' && method === 'POST') {
      const slots = getCollection(STORAGE_KEYS.SLOTS);
      const newSlot = {
        id: `slot-custom-${Date.now()}`,
        dayOfWeek: Number(body.dayOfWeek),
        startTime: body.startTime,
        endTime: body.endTime,
        capacity: Number(body.capacity) || 6,
        active: true,
      };
      slots.push(newSlot);
      setCollection(STORAGE_KEYS.SLOTS, slots);
      return newSlot;
    }

    // 2.4 Toggle ativo de horário (/schedules/:id/toggle)
    const toggleMatch = pathname.match(/^\/schedules\/([^/]+)\/toggle$/);
    if (toggleMatch && method === 'PATCH') {
      const slotId = toggleMatch[1];
      const slots = getCollection(STORAGE_KEYS.SLOTS);
      const slot = slots.find((s) => s.id === slotId);
      if (slot) {
        slot.active = !slot.active;
        setCollection(STORAGE_KEYS.SLOTS, slots);
      }
      return slot;
    }

    // 2.5 Atualizar horário (/schedules/:id)
    const slotUpdateMatch = pathname.match(/^\/schedules\/([^/]+)$/);
    if (slotUpdateMatch && method === 'PATCH') {
      const slotId = slotUpdateMatch[1];
      const slots = getCollection(STORAGE_KEYS.SLOTS);
      const slot = slots.find((s) => s.id === slotId);
      if (slot) {
        Object.assign(slot, {
          dayOfWeek: body.dayOfWeek !== undefined ? Number(body.dayOfWeek) : slot.dayOfWeek,
          startTime: body.startTime || slot.startTime,
          endTime: body.endTime || slot.endTime,
          capacity: body.capacity !== undefined ? Number(body.capacity) : slot.capacity,
        });
        setCollection(STORAGE_KEYS.SLOTS, slots);
      }
      return slot;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. AGENDAMENTOS (/appointments/*)
    // ─────────────────────────────────────────────────────────────────────────
    // 3.1 Listar agendamentos (/appointments)
    if (pathname === '/appointments' && method === 'GET') {
      let appointments = getCollection(STORAGE_KEYS.APPOINTMENTS);
      const dateFilter = searchParams.get('date');
      const statusFilter = searchParams.get('status');
      const slotIdFilter = searchParams.get('slotId');

      if (dateFilter) {
        appointments = appointments.filter((a) => a.date.split('T')[0] === dateFilter);
      }
      if (statusFilter) {
        appointments = appointments.filter((a) => a.status === statusFilter);
      }
      if (slotIdFilter) {
        appointments = appointments.filter((a) => a.slotId === slotIdFilter);
      }

      // Se for visão de aluno, filtra agendamentos do aluno
      if (currentUser && currentUser.role === 'student') {
        appointments = appointments.filter(
          (a) => a.userId === currentUser.id || a.studentId === currentUser.id || a.studentId === 'std-1'
        );
      }

      // Ordenar por data decrescente
      appointments.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        items: appointments,
        total: appointments.length,
        page: 1,
        totalPages: 1,
      };
    }

    // 3.2 Aluno faz agendamento (/appointments)
    if (pathname === '/appointments' && method === 'POST') {
      const slots = getCollection(STORAGE_KEYS.SLOTS);
      const appointments = getCollection(STORAGE_KEYS.APPOINTMENTS);
      const slot = slots.find((s) => s.id === body.slotId);

      if (!slot) {
        throw new Error('Horário não encontrado.');
      }

      const newAppt = {
        id: `appt-${Date.now()}`,
        date: `${body.date}T00:00:00.000Z`,
        slotId: body.slotId,
        slot,
        status: 'pending',
        userId: currentUser?.id || 'usr-student-1',
        usuario: currentUser || { id: 'usr-student-1', name: 'Carlos Silva', email: 'aluno@age.com' },
        createdAt: new Date().toISOString(),
      };

      appointments.unshift(newAppt);
      setCollection(STORAGE_KEYS.APPOINTMENTS, appointments);
      return newAppt;
    }

    // 3.3 Admin faz agendamento manual (/appointments/admin-book)
    if (pathname === '/appointments/admin-book' && method === 'POST') {
      const slots = getCollection(STORAGE_KEYS.SLOTS);
      const students = getCollection(STORAGE_KEYS.STUDENTS);
      const appointments = getCollection(STORAGE_KEYS.APPOINTMENTS);

      const slot = slots.find((s) => s.id === body.slotId);
      const student = body.studentId ? students.find((s) => s.id === body.studentId) : null;

      const newAppt = {
        id: `appt-admin-${Date.now()}`,
        date: `${body.date}T00:00:00.000Z`,
        slotId: body.slotId,
        slot,
        status: 'confirmed',
        studentId: body.studentId || null,
        aluno: student || null,
        guestName: body.guestName || (student ? student.name : 'Visitante'),
        createdAt: new Date().toISOString(),
      };

      appointments.unshift(newAppt);
      setCollection(STORAGE_KEYS.APPOINTMENTS, appointments);
      return newAppt;
    }

    // 3.4 Confirmar agendamento (/appointments/:id/confirm)
    const confirmMatch = pathname.match(/^\/appointments\/([^/]+)\/confirm$/);
    if (confirmMatch && method === 'PATCH') {
      const apptId = confirmMatch[1];
      const appointments = getCollection(STORAGE_KEYS.APPOINTMENTS);
      const appt = appointments.find((a) => a.id === apptId);
      if (appt) {
        appt.status = 'confirmed';
        setCollection(STORAGE_KEYS.APPOINTMENTS, appointments);
      }
      return appt;
    }

    // 3.5 Cancelar agendamento (/appointments/:id/cancel)
    const cancelMatch = pathname.match(/^\/appointments\/([^/]+)\/cancel$/);
    if (cancelMatch && method === 'PATCH') {
      const apptId = cancelMatch[1];
      const appointments = getCollection(STORAGE_KEYS.APPOINTMENTS);
      const appt = appointments.find((a) => a.id === apptId);
      if (appt) {
        appt.status = 'cancelled';
        appt.cancelledBy = currentUser?.role || 'admin';
        appt.cancelReason = body.cancelReason || 'Cancelado';
        setCollection(STORAGE_KEYS.APPOINTMENTS, appointments);
      }
      return appt;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. GESTÃO DE ALUNOS (/students/*)
    // ─────────────────────────────────────────────────────────────────────────
    // 4.1 Listar alunos (/students)
    if (pathname === '/students' && method === 'GET') {
      let students = getCollection(STORAGE_KEYS.STUDENTS);
      const search = (searchParams.get('search') || '').toLowerCase();
      const active = searchParams.get('active');

      if (search) {
        students = students.filter(
          (s) =>
            s.name.toLowerCase().includes(search) ||
            (s.phone && s.phone.includes(search)) ||
            (s.documentId && s.documentId.includes(search))
        );
      }
      if (active !== null && active !== '') {
        const isActive = active === 'true';
        students = students.filter((s) => s.active === isActive);
      }

      return students;
    }

    // 4.2 Obter aluno por ID (/students/:id)
    const studentGetMatch = pathname.match(/^\/students\/([^/]+)$/);
    if (studentGetMatch && method === 'GET') {
      const id = studentGetMatch[1];
      const student = getCollection(STORAGE_KEYS.STUDENTS).find((s) => s.id === id);
      if (!student) throw new Error('Aluno não encontrado.');
      return student;
    }

    // 4.3 Cadastrar aluno (/students)
    if (pathname === '/students' && method === 'POST') {
      const students = getCollection(STORAGE_KEYS.STUDENTS);
      const newStudent = {
        id: `std-${Date.now()}`,
        name: body.name,
        phone: body.phone || '',
        documentId: body.documentId || '',
        partnerType: body.partnerType || 'particular',
        planType: body.planType || 'twice_a_week',
        active: body.active !== undefined ? body.active : true,
        horariosFixos: [],
      };
      students.unshift(newStudent);
      setCollection(STORAGE_KEYS.STUDENTS, students);
      return newStudent;
    }

    // 4.4 Atualizar aluno (/students/:id)
    if (studentGetMatch && method === 'PATCH') {
      const id = studentGetMatch[1];
      const students = getCollection(STORAGE_KEYS.STUDENTS);
      const student = students.find((s) => s.id === id);
      if (!student) throw new Error('Aluno não encontrado.');
      Object.assign(student, body);
      setCollection(STORAGE_KEYS.STUDENTS, students);
      return student;
    }

    // 4.5 Definir horários fixos do aluno (/students/:id/schedules)
    const schedulesMatch = pathname.match(/^\/students\/([^/]+)\/schedules$/);
    if (schedulesMatch && (method === 'POST' || method === 'PUT')) {
      const id = schedulesMatch[1];
      const students = getCollection(STORAGE_KEYS.STUDENTS);
      const student = students.find((s) => s.id === id);
      if (student) {
        student.horariosFixos = (body.schedules || []).map((h, idx) => ({
          id: `fix-${Date.now()}-${idx}`,
          dayOfWeek: Number(h.dayOfWeek),
          startTime: h.startTime,
          endTime: h.endTime,
        }));
        setCollection(STORAGE_KEYS.STUDENTS, students);
      }
      return { success: true, count: student?.horariosFixos?.length || 0 };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. NOTIFICAÇÕES (/notifications/*)
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname.startsWith('/notifications')) {
      if (pathname.includes('unread-count')) {
        return { unreadCount: 1 };
      }
      return [];
    }

    // Fallback genérico
    return {};
  }

  // ─── Barra Flutuante de Demonstração ────────────────────────────────────────
  function renderDemoToolbar() {
    if (document.getElementById('age-mock-toolbar')) return;

    const style = document.createElement('style');
    style.textContent = `
      #age-mock-toolbar {
        position: fixed;
        bottom: 18px;
        right: 18px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .mock-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #18181b;
        color: #ffffff;
        padding: 8px 14px;
        border-radius: 9999px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        border: 1px solid #3f3f46;
        transition: transform 0.15s ease, background 0.15s ease;
      }
      .mock-pill:hover {
        transform: translateY(-2px);
        background: #27272a;
      }
      .mock-pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #7DC22B;
        box-shadow: 0 0 8px #7DC22B;
      }
      .mock-panel {
        display: none;
        flex-direction: column;
        gap: 12px;
        background: #18181b;
        color: #f4f4f5;
        width: 290px;
        padding: 16px;
        border-radius: 14px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.45);
        border: 1px solid #3f3f46;
        margin-bottom: 8px;
      }
      .mock-panel.open {
        display: flex;
      }
      .mock-panel-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 700;
        color: #ffffff;
      }
      .mock-badge-status {
        background: #27272a;
        color: #a1a1aa;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.4;
      }
      .mock-badge-status strong {
        color: #7DC22B;
      }
      .mock-actions {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .mock-btn {
        background: #27272a;
        color: #ffffff;
        border: 1px solid #3f3f46;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.15s ease;
      }
      .mock-btn:hover {
        background: #3f3f46;
      }
      .mock-btn--danger {
        color: #f87171;
        border-color: rgba(248, 113, 113, 0.2);
      }
      .mock-btn--danger:hover {
        background: rgba(248, 113, 113, 0.15);
      }
    `;
    document.head.appendChild(style);

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isLogged = !!currentUser;
    const isStudent = currentUser?.role === 'student';
    const isAdmin = currentUser?.role === 'admin';

    const wrap = document.createElement('div');
    wrap.id = 'age-mock-toolbar';
    wrap.innerHTML = `
      <div id="mock-panel" class="mock-panel">
        <div class="mock-panel-title">
          <span>⚡ Modo Demonstração</span>
          <button id="mock-close-btn" style="background:none; border:none; color:#a1a1aa; cursor:pointer; font-size:16px;">✕</button>
        </div>
        <div class="mock-badge-status">
          ${
            isLogged
              ? `Logado como: <strong>${currentUser.name}</strong><br>Perfil: ${isAdmin ? '👑 Administrador' : '🏋️ Aluno'}`
              : `Status: <strong>Desconectado (Tela de Login)</strong>`
          }
        </div>
        <div class="mock-actions">
          ${
            isAdmin
              ? `<button id="btn-mock-switch-student" class="mock-btn">🏋️ Alternar para Visão do Aluno</button>`
              : `<button id="btn-mock-switch-admin" class="mock-btn">👑 Alternar para Visão do Admin</button>`
          }
          <button id="btn-mock-reset" class="mock-btn mock-btn--danger">🔄 Resetar Dados de Demonstração</button>
        </div>
        <div style="font-size:10px; color:#71717a; text-align:center;">
          Execução 100% no navegador (sem banco de dados)
        </div>
      </div>
      <div id="mock-toggle-pill" class="mock-pill" title="Clique para abrir opções de demonstração">
        <span class="mock-pill-dot"></span>
        <span>Mockup Ativo</span>
      </div>
    `;

    document.body.appendChild(wrap);

    const panel = document.getElementById('mock-panel');
    const togglePill = document.getElementById('mock-toggle-pill');
    const closeBtn = document.getElementById('mock-close-btn');

    togglePill.addEventListener('click', () => {
      panel.classList.toggle('open');
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });

    const btnSwitchStudent = document.getElementById('btn-mock-switch-student');
    if (btnSwitchStudent) {
      btnSwitchStudent.addEventListener('click', () => {
        const studentUser = {
          id: 'usr-student-1',
          name: 'Carlos Silva',
          email: 'aluno@age.com',
          role: 'student',
        };
        localStorage.setItem('accessToken', 'mock-token-student');
        localStorage.setItem('user', JSON.stringify(studentUser));
        window.location.href = '/schedule.html';
      });
    }

    const btnSwitchAdmin = document.getElementById('btn-mock-switch-admin');
    if (btnSwitchAdmin) {
      btnSwitchAdmin.addEventListener('click', () => {
        const adminUser = {
          id: 'usr-admin-1',
          name: 'Administrador Age',
          email: 'admin@age.com',
          role: 'admin',
        };
        localStorage.setItem('accessToken', 'mock-token-admin');
        localStorage.setItem('user', JSON.stringify(adminUser));
        window.location.href = '/admin/';
      });
    }

    const btnReset = document.getElementById('btn-mock-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Deseja restaurar todos os agendamentos, horários e alunos originais da demonstração?')) {
          initMockDatabase(true);
          alert('Dados restaurados com sucesso!');
          window.location.reload();
        }
      });
    }
  }

  // ─── Inicialização Automática ──────────────────────────────────────────────
  initMockDatabase();

  window.__ageMockRouter = mockApiRouter;
  window.__ageResetMock = () => initMockDatabase(true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDemoToolbar);
  } else {
    renderDemoToolbar();
  }
})();
