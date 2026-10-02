let displayYear = new Date().getFullYear();
let displayMonth = new Date().getMonth();

// Recuperar registros y síntomas desde localStorage
let pillRecords = JSON.parse(localStorage.getItem('snoopyPillRecords')) || {};
let symptomRecords = JSON.parse(localStorage.getItem('snoopySymptomRecords')) || {};
let selectedDateString = null;

// Estados temporales dentro del modal actual
let currentSelectedMethod = null;
let currentSelectedSymptom = null;

// Cargar barra semanal al iniciar la app
window.addEventListener('DOMContentLoaded', () => {
    renderWeeklyBar();
    initModalGridInteraction();
});

// Control de navegación entre pestañas
const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetId = btn.getAttribute('data-target');
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active-view');
        });
        document.getElementById(targetId).classList.add('active-view');

        if (targetId === 'calendarView') {
            initCalendarSelectors();
            renderCalendar();
        } else if (targetId === 'homeView') {
            renderWeeklyBar();
        }
    });
});

// Renderizar la barra semanal dinámica en la vista principal
function renderWeeklyBar() {
    const container = document.getElementById('weekDaysContainer');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    today.setHours(0,0,0,0);

    const currentDayOfWeek = today.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + distanceToMonday);

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
        const loopDate = new Date(startOfWeek);
        loopDate.setDate(startOfWeek.getDate() + i);
        
        const year = loopDate.getFullYear();
        const month = String(loopDate.getMonth() + 1).padStart(2, '0');
        const dayNum = String(loopDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dayNum}`;

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('week-day-item');

        if (loopDate.getTime() === today.getTime()) {
            dayDiv.classList.add('today');
        }

        dayDiv.addEventListener('click', () => {
            openDayModal(dateString, loopDate.getDate(), loopDate.getMonth(), year);
        });

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('week-day-name');
        nameSpan.innerText = dayNames[i];

        const numSpan = document.createElement('span');
        numSpan.classList.add('week-day-num');
        numSpan.innerText = loopDate.getDate();

        const indicatorsDiv = document.createElement('div');
        indicatorsDiv.classList.add('week-day-indicators');

        if (pillRecords[dateString]) {
            const pSpan = document.createElement('span');
            pSpan.innerText = '💊';
            indicatorsDiv.appendChild(pSpan);
        }
        if (symptomRecords[dateString]) {
            const sSpan = document.createElement('span');
            sSpan.innerText = '✨';
            indicatorsDiv.appendChild(sSpan);
        }

        dayDiv.appendChild(nameSpan);
        dayDiv.appendChild(numSpan);
        dayDiv.appendChild(indicatorsDiv);

        container.appendChild(dayDiv);
    }
}

// Configurar clics en los botones de las grillas del modal
function initModalGridInteraction() {
    const gridButtons = document.querySelectorAll('.icon-option-btn');
    gridButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            const value = btn.getAttribute('data-value');

            if (type === 'method') {
                // Si ya estaba seleccionado, se desmarca (permite alternar)
                if (currentSelectedMethod === value) {
                    currentSelectedMethod = null;
                    btn.classList.remove('selected');
                } else {
                    // Desmarcar otros del mismo grupo
                    document.querySelectorAll('[data-type="method"]').forEach(b => b.classList.remove('selected'));
                    currentSelectedMethod = value;
                    btn.classList.add('selected');
                }
            } else if (type === 'symptom') {
                if (currentSelectedSymptom === value) {
                    currentSelectedSymptom = null;
                    btn.classList.remove('selected');
                } else {
                    document.querySelectorAll('[data-type="symptom"]').forEach(b => b.classList.remove('selected'));
                    currentSelectedSymptom = value;
                    btn.classList.add('selected');
                }
            }
        });
    });
}

// Abrir modal unificado y marcar botones activos según la fecha
function openDayModal(dateString, dayNum, monthIdx, yearNum) {
    selectedDateString = dateString;
    const monthNamesFull = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    document.getElementById('modalDateTitle').innerText = `${dayNum} de ${monthNamesFull[monthIdx]} ${yearNum}`;

    // Cargar valores guardados o limpiar
    currentSelectedMethod = pillRecords[dateString] || null;
    currentSelectedSymptom = symptomRecords[dateString] || null;

    // Actualizar visualmente la selección en las grillas
    document.querySelectorAll('[data-type="method"]').forEach(b => {
        if (b.getAttribute('data-value') === currentSelectedMethod) {
            b.classList.add('selected');
        } else {
            b.classList.remove('selected');
        }
    });

    document.querySelectorAll('[data-type="symptom"]').forEach(b => {
        if (b.getAttribute('data-value') === currentSelectedSymptom) {
            b.classList.add('selected');
        } else {
            b.classList.remove('selected');
        }
    });

    document.getElementById('dayModal').style.display = 'flex';
}

// Botón rápido de síntomas para HOY
const quickSymptomBtn = document.getElementById('openSymptomModalBtn');
if (quickSymptomBtn) {
    quickSymptomBtn.addEventListener('click', () => {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        openDayModal(dateString, today.getDate(), today.getMonth(), today.getFullYear());
    });
}

// Inicializar selectores de mes y año en el calendario
function initCalendarSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    if (monthSelect.children.length > 0) return;

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthSelect.innerHTML = '';
    monthNames.forEach((m, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.innerText = m;
        monthSelect.appendChild(opt);
    });

    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let y = currentYear - 3; y <= currentYear + 5; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.innerText = y;
        yearSelect.appendChild(opt);
    }

    monthSelect.value = displayMonth;
    yearSelect.value = displayYear;

    monthSelect.addEventListener('change', (e) => {
        displayMonth = parseInt(e.target.value);
        renderCalendar();
    });

    yearSelect.addEventListener('change', (e) => {
        displayYear = parseInt(e.target.value);
        renderCalendar();
    });
}

// Botones de navegación de mes
document.getElementById('prevMonthBtn').addEventListener('click', () => {
    displayMonth--;
    if (displayMonth < 0) {
        displayMonth = 11;
        displayYear--;
    }
    updateSelectorsUI();
    renderCalendar();
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
    displayMonth++;
    if (displayMonth > 11) {
        displayMonth = 0;
        displayYear++;
    }
    updateSelectorsUI();
    renderCalendar();
});

document.getElementById('goToTodayBtn').addEventListener('click', () => {
    const now = new Date();
    displayYear = now.getFullYear();
    displayMonth = now.getMonth();
    updateSelectorsUI();
    renderCalendar();
});

function updateSelectorsUI() {
    const mSel = document.getElementById('monthSelect');
    const ySel = document.getElementById('yearSelect');
    if (mSel && ySel) {
        mSel.value = displayMonth;
        ySel.value = displayYear;
    }
}

// Cálculo del ciclo principal
document.getElementById('calculateBtn').addEventListener('click', function() {
    const startDateInput = document.getElementById('startDate').value;
    const cycleLength = parseInt(document.getElementById('cycleLength').value);

    if (!startDateInput) {
        alert("Por favor selecciona una fecha de inicio.");
        return;
    }

    const lastPeriodDate = new Date(startDateInput);
    const today = new Date();

    lastPeriodDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffTime = today - lastPeriodDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        alert("La fecha seleccionada no puede ser en el futuro.");
        return;
    }

    const currentCycleDay = (diffDays % cycleLength) + 1;
    const cyclesPassed = Math.floor(diffDays / cycleLength);
    const nextPeriodDate = new Date(lastPeriodDate);
    nextPeriodDate.setDate(lastPeriodDate.getDate() + ((cyclesPassed + 1) * cycleLength));

    const ovulationDate = new Date(nextPeriodDate);
    ovulationDate.setDate(nextPeriodDate.getDate() - 14);

    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(ovulationDate.getDate() - 5);
    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(ovulationDate.getDate() + 1);

    let phaseName = "";
    let tip = "";

    if (currentCycleDay <= 5) {
        phaseName = "Fase Menstrual 🌧️";
        tip = "🐶 *Snoopy dice:* Hoy toca descanso total en la casita. Una mantita y chocolates serán sus mejores aliados.";
    } else if (currentCycleDay <= 13) {
        phaseName = "Fase Folicular 🌱";
        tip = "🐶 *Snoopy dice:* ¡La energía va subiendo como Woodstock volando! Ideal para salir a pasear juntos.";
    } else if (currentCycleDay <= 17) {
        phaseName = "Fase Ovulatoria ✨";
        tip = "🐶 *Snoopy dice:* ¡Vitalidad al máximo! Aprovechen el buen humor para divertirse al aire libre.";
    } else {
        phaseName = "Fase Lútea 🍂";
        tip = "🐶 *Snoopy dice:* Se encuentra cerca el momento de bajar el ritmo. Ten paciencia extra y apóyala con mimos.";
    }

    const options = { day: 'numeric', month: 'short' };

    document.getElementById('currentDayNumber').innerText = `Día ${currentCycleDay}`;
    document.getElementById('currentPhaseLabel').innerText = phaseName;
    document.getElementById('predictionText').innerText = `Próximo periodo estimado en ${cycleLength - currentCycleDay} días.`;
    
    document.getElementById('nextPeriod').innerText = nextPeriodDate.toLocaleDateString('es-ES', options);
    document.getElementById('fertileWindow').innerText = `${fertileStart.toLocaleDateString('es-ES', options)} al ${fertileEnd.toLocaleDateString('es-ES', options)}`;
    document.getElementById('snoopyTip').innerHTML = tip;
    document.getElementById('detailsSection').style.display = 'block';

    renderCalendar();
});

// Guardar datos del modal utilizando las selecciones de las grillas
document.getElementById('saveModalBtn').addEventListener('click', () => {
    if (currentSelectedMethod) {
        pillRecords[selectedDateString] = currentSelectedMethod;
    } else {
        delete pillRecords[selectedDateString];
    }

    if (currentSelectedSymptom) {
        symptomRecords[selectedDateString] = currentSelectedSymptom;
    } else {
        delete symptomRecords[selectedDateString];
    }

    localStorage.setItem('snoopyPillRecords', JSON.stringify(pillRecords));
    localStorage.setItem('snoopySymptomRecords', JSON.stringify(symptomRecords));

    document.getElementById('dayModal').style.display = 'none';
    renderWeeklyBar();
    if (document.getElementById('calendarView').classList.contains('active-view')) {
        renderCalendar();
    }
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('dayModal').style.display = 'none';
});

// Renderizar Calendario Grande
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    const startDateInput = document.getElementById('startDate').value;
    const cycleLength = parseInt(document.getElementById('cycleLength').value) || 28;
    let lastPeriodDate = startDateInput ? new Date(startDateInput) : new Date();
    lastPeriodDate.setHours(0,0,0,0);

    const firstDayIndex = new Date(displayYear, displayMonth, 1).getDay();
    const startingSpace = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
    const totalDaysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

    for (let i = 0; i < startingSpace; i++) {
        const emptyDiv = document.createElement('div');
        calendarGrid.appendChild(emptyDiv);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentDate = new Date(displayYear, displayMonth, day);
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('cal-day');

        const dateString = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        dayDiv.addEventListener('click', () => {
            openDayModal(dateString, day, displayMonth, displayYear);
        });

        const diffTime = currentDate - lastPeriodDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0) {
            const cyclesPassed = Math.floor(diffDays / cycleLength);
            const calculatedCycleStart = new Date(lastPeriodDate);
            calculatedCycleStart.setDate(lastPeriodDate.getDate() + (cyclesPassed * cycleLength));
            const dayOfThisCycle = Math.floor((currentDate - calculatedCycleStart) / (1000 * 60 * 60 * 24)) + 1;

            const badge = document.createElement('span');
            badge.classList.add('cycle-day-badge');
            badge.innerText = dayOfThisCycle;
            dayDiv.appendChild(badge);

            if (dayOfThisCycle >= 1 && dayOfThisCycle <= 5) {
                dayDiv.classList.add('period');
            } else {
                const heart = document.createElement('span');
                heart.classList.add('sub-indicator');
                heart.innerText = '♥';
                dayDiv.appendChild(heart);
            }
        }

        const numSpan = document.createElement('span');
        numSpan.classList.add('date-num');
        numSpan.innerText = day;
        dayDiv.appendChild(numSpan);

        if (pillRecords[dateString]) {
            const pillSpan = document.createElement('span');
            pillSpan.classList.add('pill-indicator');
            // Muestra el icono según el método guardado (pastilla, inyección o anillo)
            let iconMap = { pill: '💊', injection: '💉', ring: '💍' };
            pillSpan.innerText = iconMap[pillRecords[dateString]] || '💊';
            dayDiv.appendChild(pillSpan);
        }

        if (symptomRecords[dateString]) {
            const symptomSpan = document.createElement('span');
            symptomSpan.classList.add('symptom-indicator');
            let symptomIconMap = { cramps: '⚡', headache: '🤕', mood: '🌧️', energy: '✨', acne: '🌱' };
            symptomSpan.innerText = symptomIconMap[symptomRecords[dateString]] || '✨';
            symptomSpan.style.position = 'absolute';
            symptomSpan.style.top = '2px';
            symptomSpan.style.right = '4px';
            symptomSpan.style.fontSize = '0.55rem';
            dayDiv.appendChild(symptomSpan);
        }

        calendarGrid.appendChild(dayDiv);
    }
}