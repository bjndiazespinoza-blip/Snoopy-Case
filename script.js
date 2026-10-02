// --- ESTADO GLOBAL UNIFICADO ---
let cycleData = JSON.parse(localStorage.getItem('snoopy_cycle_data')) || {
    isConfigured: false,
    username: '',
    startDate: '',
    cycleLength: 28,
    periodLength: 5,
    flowIntensity: 'moderado',
    contraceptiveType: 'ninguno',
    ovulates: true,
    logs: {}
};

let currentDateCursor = new Date();
let selectedDateStrForModal = '';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Comprobar si es la primera vez que usa la app
    if (!cycleData.isConfigured || !cycleData.startDate) {
        showFirstTimeWelcomeModal();
    } else {
        loadProfileIntoForm();
        calculateCycle();
    }

    setupNavigationAndEvents();
});

// --- PANTALLA / MODAL DE PREGUNTAS PARA LA PRIMERA VEZ ---
function showFirstTimeWelcomeModal() {
    const welcomeHTML = `
        <div id="firstTimeOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; padding: 1rem;">
            <div class="card p-4 shadow-lg" style="width: 100%; max-width: 450px; background: var(--card-bg); color: var(--text-main); border-radius: 20px; max-height: 90vh; overflow-y: auto;">
                <h3 class="text-center mb-2 fw-bold text-danger">🐾 ¡Bienvenida a Snoopy Cycle!</h3>
                <p class="text-muted text-center small mb-4">Como es tu primera vez por aquí, respondamos unas breves preguntas para personalizar tus fases, tus consejos y tu calendario.</p>
                
                <form id="firstTimeForm">
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">1. ¿Cómo te llamas o apodo?</label>
                        <input type="text" id="ftName" class="form-control" required placeholder="Tu nombre">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">2. Fecha de inicio de tu última regla:</label>
                        <input type="date" id="ftStartDate" class="form-control" required>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <label class="form-label fw-semibold small">3. Duración del ciclo (días):</label>
                            <input type="number" id="ftCycleLen" class="form-control" value="28" min="20" max="45" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label fw-semibold small">4. Duración de la regla (días):</label>
                            <input type="number" id="ftPeriodLen" class="form-control" value="5" min="2" max="10" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">5. Abundancia habitual de tu flujo:</label>
                        <select id="ftFlow" class="form-select">
                            <option value="ligero">Ligero</option>
                            <option value="moderado" selected>Moderado</option>
                            <option value="abundante">Abundante</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="form-label fw-semibold small">6. ¿Utilizas algún método anticonceptivo?</label>
                        <select id="ftContraceptive" class="form-select">
                            <option value="ninguno" selected>Ninguno / DIU de cobre (Ciclo Natural)</option>
                            <option value="pastillas">Pastillas anticonceptivas</option>
                            <option value="inyeccion">Inyección anticonceptiva</option>
                            <option value="implante">Implante / DIU hormonal</option>
                        </select>
                        <div class="form-text text-muted small mt-1" style="font-size: 0.75rem;">
                            *Si usas pastillas, inyección o implante, la app adaptará la predicción excluyendo la ovulación biológica.
                        </div>
                    </div>
                    <button type="submit" class="btn btn-warning w-100 fw-bold py-2 shadow-sm">¡Comenzar mi viaje con Snoopy! 🐶</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', welcomeHTML);

    // Poner la fecha de hoy por defecto en el input de bienvenida
    document.getElementById('ftStartDate').value = formatDateISO(new Date());

    document.getElementById('firstTimeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        cycleData.isConfigured = true;
        cycleData.username = document.getElementById('ftName').value.trim();
        cycleData.startDate = document.getElementById('ftStartDate').value;
        cycleData.cycleLength = parseInt(document.getElementById('ftCycleLen').value) || 28;
        cycleData.periodLength = parseInt(document.getElementById('ftPeriodLen').value) || 5;
        cycleData.flowIntensity = document.getElementById('ftFlow').value;
        cycleData.contraceptiveType = document.getElementById('ftContraceptive').value;

        // Determinar ovulación según método
        cycleData.ovulates = !['pastillas', 'inyeccion', 'implante'].includes(cycleData.contraceptiveType);

        saveData();
        document.getElementById('firstTimeOverlay').remove();
        loadProfileIntoForm();
        calculateCycle();
        
        alert(`¡Todo listo, ${cycleData.username}! Ya puedes explorar tu app 🐾`);
    });
}

// Cargar datos actuales en la pestaña de actualización (Mis Datos)
function loadProfileIntoForm() {
    if (!cycleData.startDate) return;
    document.getElementById('profileName').value = cycleData.username || '';
    document.getElementById('profileStartDate').value = cycleData.startDate;
    document.getElementById('profileCycleLen').value = cycleData.cycleLength;
    document.getElementById('profilePeriodLen').value = cycleData.periodLength;
    document.getElementById('profileFlow').value = cycleData.flowIntensity || 'moderado';
    document.getElementById('profileContraceptive').value = cycleData.contraceptiveType || 'ninguno';
}

function setupNavigationAndEvents() {
    // Cambio de Vistas
    const navButtons = document.querySelectorAll('.app-nav-bar .nav-item-btn[data-target]');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
            document.getElementById(targetId).classList.add('active-view');

            if (targetId === 'calendarView') {
                initCalendarSelects();
                renderCalendar();
            } else if (targetId === 'profileView') {
                loadProfileIntoForm();
            }
        });
    });

    // Guardar actualización desde la pestaña "Mis Datos"
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            cycleData.username = document.getElementById('profileName').value.trim();
            cycleData.startDate = document.getElementById('profileStartDate').value;
            cycleData.cycleLength = parseInt(document.getElementById('profileCycleLen').value) || 28;
            cycleData.periodLength = parseInt(document.getElementById('profilePeriodLen').value) || 5;
            cycleData.flowIntensity = document.getElementById('profileFlow').value;
            cycleData.contraceptiveType = document.getElementById('profileContraceptive').value;

            cycleData.ovulates = !['pastillas', 'inyeccion', 'implante'].includes(cycleData.contraceptiveType);

            saveData();
            calculateCycle();
            
            alert('¡Tus datos se han actualizado con éxito! El contenido y el calendario se han recalculado 🐾');
            document.querySelector('[data-target="homeView"]').click();
        });
    }

    // Botones rápidos
    document.getElementById('goToTodayBtn').addEventListener('click', () => {
        currentDateCursor = new Date();
        initCalendarSelects();
        renderCalendar();
    });

    document.getElementById('openSymptomModalBtn').addEventListener('click', () => {
        openDayModal(formatDateISO(new Date()));
    });

    // Controles de mes
    document.getElementById('prevMonthBtn').addEventListener('click', () => { currentDateCursor.setMonth(currentDateCursor.getMonth() - 1); updateCalendarDropdowns(); renderCalendar(); });
    document.getElementById('nextMonthBtn').addEventListener('click', () => { currentDateCursor.setMonth(currentDateCursor.getMonth() + 1); updateCalendarDropdowns(); renderCalendar(); });
    document.getElementById('monthSelect').addEventListener('change', (e) => { currentDateCursor.setMonth(parseInt(e.target.value)); renderCalendar(); });
    document.getElementById('yearSelect').addEventListener('change', (e) => { currentDateCursor.setFullYear(parseInt(e.target.value)); renderCalendar(); });

    setupModalInteractions();
}

// --- CÁLCULO INTELIGENTE DEL CICLO ---
function calculateCycle() {
    if (!cycleData.startDate) return;

    const start = new Date(cycleData.startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);

    const cycleLen = cycleData.cycleLength;
    const periodLen = cycleData.periodLength;

    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let currentDayOfCycle = (diffDays % cycleLen) + 1;
    if (currentDayOfCycle < 1) currentDayOfCycle = cycleLen + currentDayOfCycle;

    let phaseName = 'Fase Folicular';
    let greeting = cycleData.username ? `, ${cycleData.username}` : '';
    let tip = `🐶 *Snoopy dice${greeting}:* Tienes buena energía, ¡ideal para pasear!`;

    if (currentDayOfCycle <= periodLen) {
        phaseName = 'Fase Menstrual 🩸';
        tip = `🐶 *Snoopy dice${greeting}:* Descansa y abrígate. Tu flujo está registrado como *${cycleData.flowIntensity}*.`;
    } else if (cycleData.ovulates && currentDayOfCycle >= (cycleLen - 16) && currentDayOfCycle <= (cycleLen - 12)) {
        phaseName = 'Ventana Fértil & Ovulación ✨';
        tip = `🐶 *Snoopy dice${greeting}:* ¡Días de máxima vitalidad y ovulación estimada!`;
    } else if (!cycleData.ovulates && currentDayOfCycle >= (cycleLen - 16) && currentDayOfCycle <= (cycleLen - 12)) {
        phaseName = 'Fase Media (Controlada) 💊';
        tip = `🐶 *Snoopy dice${greeting}:* Tu método (${cycleData.contraceptiveType}) mantiene tu ciclo estable sin ovulación.`;
    } else if (currentDayOfCycle > (cycleLen - 12)) {
        phaseName = 'Fase Lútea 🌙';
        tip = `🐶 *Snoopy dice${greeting}:* Ve bajando el ritmo con calma y paciencia.`;
    }

    document.getElementById('currentDayNumber').textContent = `Día ${currentDayOfCycle}`;
    document.getElementById('currentPhaseLabel').textContent = phaseName;
    document.getElementById('predictionText').textContent = `Ciclo de ${cycleLen} días • ${cycleData.contraceptiveType !== 'ninguno' ? 'Con anticonceptivo' : 'Natural'}`;

    const nextPeriodDate = new Date(start);
    const cyclesPassed = Math.floor(diffDays / cycleLen) + (diffDays >= 0 ? 1 : 0);
    nextPeriodDate.setDate(start.getDate() + (cyclesPassed * cycleLen));

    document.getElementById('nextPeriod').textContent = formatDateReadable(nextPeriodDate);
    
    const fertileEl = document.getElementById('fertileWindow');
    if (cycleData.ovulates) {
        const ovDate = new Date(nextPeriodDate);
        ovDate.setDate(nextPeriodDate.getDate() - 14);
        fertileEl.textContent = `Ovulación el ${formatDateReadable(ovDate)}`;
    } else {
        fertileEl.textContent = `No aplica (Método activo)`;
    }

    document.getElementById('snoopyTip').innerHTML = tip;
    renderWeeklyBar(start, cycleLen);
}

// --- RENDERIZAR BARRA SEMANAL ---
function renderWeeklyBar(startDate, cycleLength) {
    const container = document.getElementById('weekDaysContainer');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = -3; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = formatDateISO(d);

        const diff = Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
        let cDay = (diff % cycleLength) + 1;
        if (cDay < 1) cDay = cycleLength + cDay;

        const isToday = i === 0;
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dayName = dayNames[d.getDay()];

        const item = document.createElement('div');
        item.className = `week-day-item ${isToday ? 'today' : ''}`;
        
        const log = cycleData.logs[dateStr];
        let iconsHtml = '';
        if (log) {
            if (log.methods && log.methods.length > 0) iconsHtml += '💊';
            if (log.symptoms && log.symptoms.length > 0) iconsHtml += '✨';
        }

        item.innerHTML = `
            <span class="week-day-name">${dayName}</span>
            <span class="week-day-num">${d.getDate()}</span>
            <span class="small text-muted" style="font-size:0.6rem;">D.${cDay}</span>
            <div class="week-day-indicators">${iconsHtml}</div>
        `;

        item.addEventListener('click', () => openDayModal(dateStr));
        container.appendChild(item);
    }
}

// --- CALENDARIO MENSUAL CON OVULACIÓN CONDICIONAL ---
function initCalendarSelects() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    if (!monthSelect || !yearSelect) return;

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    monthSelect.innerHTML = '';
    months.forEach((m, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = m;
        monthSelect.appendChild(opt);
    });

    yearSelect.innerHTML = '';
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }

    updateCalendarDropdowns();
}

function updateCalendarDropdowns() {
    const mSel = document.getElementById('monthSelect');
    const ySel = document.getElementById('yearSelect');
    if (mSel) mSel.value = currentDateCursor.getMonth();
    if (ySel) ySel.value = currentDateCursor.getFullYear();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const year = currentDateCursor.getFullYear();
    const month = currentDateCursor.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-day opacity-25 bg-transparent border-0';
        grid.appendChild(emptyCell);
    }

    const startDateObj = cycleData.startDate ? new Date(cycleData.startDate + 'T00:00:00') : null;
    const cycleLen = cycleData.cycleLength;
    const periodLen = cycleData.periodLength;

    for (let day = 1; day <= totalDays; day++) {
        const cellDate = new Date(year, month, day);
        cellDate.setHours(0,0,0,0);
        const dateStr = formatDateISO(cellDate);

        const cell = document.createElement('div');
        cell.className = 'cal-day';

        let badgeText = '';
        let isPeriod = false;
        let isOvulation = false;

        if (startDateObj) {
            const diffTime = cellDate - startDateObj;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0) {
                let cDay = (diffDays % cycleLen) + 1;
                badgeText = cDay;
                
                if (cDay <= periodLen) {
                    isPeriod = true;
                    cell.classList.add('period');
                }

                // Mostrar ovulación SOLO SI el perfil indica que ovula
                if (cycleData.ovulates && cDay === (cycleLen - 14)) {
                    isOvulation = true;
                }
            }
        }

        const log = cycleData.logs[dateStr];
        let indicatorsHtml = '';
        if (log) {
            if (log.methods && log.methods.length > 0) indicatorsHtml += '<span title="Método registrado">💊</span>';
            if (log.symptoms && log.symptoms.length > 0) indicatorsHtml += '<span title="Síntoma registrado">✨</span>';
        }

        cell.innerHTML = `
            ${badgeText ? `<span class="cycle-day-badge">D${badgeText}</span>` : ''}
            <span class="date-num">${day}</span>
            <div class="sub-indicator d-flex gap-1 align-items-center justify-content-center">
                ${isOvulation ? '<span title="Día de ovulación estimado">🥚</span>' : ''}
                ${indicatorsHtml}
            </div>
        `;

        cell.addEventListener('click', () => openDayModal(dateStr));
        grid.appendChild(cell);
    }
}

// --- MODAL DE REGISTRO DIARIO ---
function openDayModal(dateStr) {
    selectedDateStrForModal = dateStr;
    const titleElem = document.getElementById('modalDateTitle');
    if (titleElem) titleElem.textContent = `Registro: ${formatDateReadable(new Date(dateStr + 'T00:00:00'))}`;

    document.querySelectorAll('.icon-option-btn').forEach(btn => btn.classList.remove('selected'));

    const log = cycleData.logs[dateStr];
    if (log) {
        if (log.methods) {
            log.methods.forEach(val => {
                const btn = document.querySelector(`.icon-option-btn[data-type="method"][data-value="${val}"]`);
                if (btn) btn.classList.add('selected');
            });
        }
        if (log.symptoms) {
            log.symptoms.forEach(val => {
                const btn = document.querySelector(`.icon-option-btn[data-type="symptom"][data-value="${val}"]`);
                if (btn) btn.classList.add('selected');
            });
        }
    }

    const dayModal = document.getElementById('dayModal');
    if (dayModal) dayModal.style.display = 'flex';
}

function setupModalInteractions() {
    document.querySelectorAll('.icon-option-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('selected'));
    });

    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('dayModal').style.display = 'none';
        });
    }

    const saveBtn = document.getElementById('saveModalBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const methods = [];
            const symptoms = [];

            document.querySelectorAll('.icon-option-btn.selected').forEach(btn => {
                const type = btn.getAttribute('data-type');
                const val = btn.getAttribute('data-value');
                if (type === 'method') methods.push(val);
                if (type === 'symptom') symptoms.push(val);
            });

            if (!cycleData.logs) cycleData.logs = {};

            if (methods.length > 0 || symptoms.length > 0) {
                cycleData.logs[selectedDateStrForModal] = { methods, symptoms };
            } else {
                delete cycleData.logs[selectedDateStrForModal];
            }

            saveData();
            document.getElementById('dayModal').style.display = 'none';

            calculateCycle();
            const calView = document.getElementById('calendarView');
            if (calView && calView.classList.contains('active-view')) {
                renderCalendar();
            }

            alert('¡Datos guardados con éxito! 🐾');
        });
    }
}

// --- MODO OSCURO / CLARO ---
function initTheme() {
    const savedTheme = localStorage.getItem('snoopy_theme');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('snoopy_theme', 'dark');
                themeToggleBtn.textContent = '☀️️';
            } else {
                localStorage.setItem('snoopy_theme', 'light');
                themeToggleBtn.textContent = '🌙';
            }
        });
    }
}

// --- UTILIDADES ---
function saveData() {
    localStorage.setItem('snoopy_cycle_data', JSON.stringify(cycleData));
}

function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateReadable(date) {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}