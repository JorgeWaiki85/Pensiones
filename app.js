// ==================== CONFIGURACIÓN DE USUARIOS ====================
const USERS = {
    'admin': { password: 'admin123', role: 'admin', name: 'Administrador del Sistema' },
    'telefonista': { password: 'tel123', role: 'telefonista', name: 'Telefonista' },
    'ejecutivo': { password: 'ejec123', role: 'ejecutivo', name: 'Ejecutivo' }
};

const EJECUTIVOS = [
    'MARÍA PAZ INOSTROZA',
    'PAULINA INOSTROZA',
    'CARLOS VALLADARES',
    'EVELYN VALLADARES',
    'MAYROBERT BUSTILLO',
    'DANIELA PÉREZ',
    'ANDRES ORREGO',
    'WENDOLIN GONZÁLEZ',
    'RENATA LAGOS',
    'PAOLA RAMÍREZ',
    'JOAN SALFATE',
    'GHISLAINE CÁCERES',
    'EMILY DÍAZ',
    'ARIANY RIOS'
];

// ==================== VARIABLES GLOBALES ====================
let citas = [];
let currentRole = '';
let currentUser = '';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedCitaId = null;
let selectedDayCitas = null;
let editingCitaId = null;

// ==================== FUNCIONES DE UTILIDAD ====================
function getStoredCitas() {
    const stored = localStorage.getItem('pensiones_citas');
    return stored ? JSON.parse(stored) : [];
}

function saveCitasToLista(citasLista) {
    localStorage.setItem('pensiones_citas', JSON.stringify(citasLista));
}

function setCitas(newCitas) {
    citas = newCitas;
    saveCitasToLista(citas);
}

// ==================== AUTENTICACIÓN ====================
function handleLogin(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuario').value.trim().toLowerCase();
    const contraseña = document.getElementById('contraseña').value;
    
    const errorMessage = document.getElementById('errorMessage');
    
    if (USERS[usuario] && USERS[usuario].password === contraseña) {
        const user = USERS[usuario];
        sessionStorage.setItem('pensiones_user', JSON.stringify({
            username: usuario,
            role: user.role,
            name: user.name
        }));
        
        switch (user.role) {
            case 'admin':
                window.location.href = 'admin.html';
                break;
            case 'telefonista':
                window.location.href = 'telefonista.html';
                break;
            case 'ejecutivo':
                window.location.href = 'ejecutivo.html';
                break;
        }
    } else {
        errorMessage.textContent = 'Usuario o contraseña incorrectos.';
        errorMessage.style.display = 'block';
    }
}

function checkAuth(requiredRole) {
    try {
        const userData = JSON.parse(sessionStorage.getItem('pensiones_user'));
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }
        
        if (requiredRole === 'admin' && userData.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        if (requiredRole === 'telefonista' && userData.role !== 'telefonista' && userData.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        if (requiredRole === 'ejecutivo' && userData.role !== 'ejecutivo' && userData.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        
        currentRole = userData.role;
        currentUser = userData.name;
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = userData.name;
        }
        
        citas = getStoredCitas();
    } catch (e) {
        window.location.href = 'index.html';
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('pensiones_user');
    window.location.href = 'index.html';
}

// ==================== NAVEGACIÓN ====================
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-menu li').forEach(li => {
        li.classList.remove('active');
    });
    
    const mapping = {
        'Dashboard': 'dashboard',
        'Nueva Cita': 'nuevaCita',
        'Calendario': 'calendario',
        'Lista de Citas': 'listaCitas',
        'Mis Citas': 'misCitas',
        'Gestionar Ejecutivos': 'gestionarEjecutivos'
    };
    
    document.querySelectorAll('.nav-menu li').forEach(li => {
        const iconText = li.querySelector('.menu-icon').textContent;
        const plainText = li.textContent.trim().replace(iconText, '').trim();
        if (mapping[plainText] === sectionId) {
            li.classList.add('active');
        }
    });
    
    if (sectionId === 'calendario') {
        loadCalendar();
    }
    if (sectionId === 'listaCitas') {
        loadCitasTable();
    }
    if (sectionId === 'misCitas') {
        loadMisCitas();
    }
    if (sectionId === 'gestionarEjecutivos') {
        loadExecutivesList();
    }
    if (sectionId === 'dashboard') {
        loadDashboard();
    }
}

// ==================== DASHBOARD ADMIN ====================
function loadDashboard() {
    citas = getStoredCitas();
    const total = citas.length;
    const pendientes = citas.filter(c => c.reunion === 'no').length;
    const completadas = citas.filter(c => c.procesoCerrado === 'si').length;
    
    document.getElementById('totalCitas').textContent = total;
    document.getElementById('citasPendientes').textContent = pendientes;
    document.getElementById('citasCompletadas').textContent = completadas;
    
    const actividadEl = document.getElementById('actividadReciente');
    if (citas.length === 0) {
        actividadEl.innerHTML = '<p class="no-activity">No hay actividad reciente</p>';
    } else {
        const sorted = [...citas].sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn)).slice(0, 8);
        let html = '<ul>';
        sorted.forEach(c => {
            html += `<li>
                <span class="activity-date">${formatDateShort(c.creadaEn)}</span>
                <span class="activity-text"><strong>${c.nombre}</strong> - ${c.ejecutivo}</span>
                <span class="activity-status ${estadoClass(c)}">${estadoLabel(c)}</span>
            </li>`;
        });
        html += '</ul>';
        actividadEl.innerHTML = html;
    }
}

// ==================== GESTIÓN DE CITAS ====================
function guardarCita(event) {
    if (event) event.preventDefault();
    
    const form = document.getElementById('citaForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const cita = {
        id: Date.now().toString(),
        nombre: document.getElementById('nombre').value.toUpperCase(),
        run: document.getElementById('run').value.toUpperCase(),
        fono: document.getElementById('fono').value,
        direccion: document.getElementById('direccion').value.toUpperCase(),
        correo: document.getElementById('correo').value,
        afp: document.getElementById('afp').value.toUpperCase(),
        tipoPension: document.getElementById('tipoPension').value,
        fMaxApelacion: document.getElementById('fMaxApelacion').value,
        fSolPension: document.getElementById('fSolPension').value,
        calificacion: document.getElementById('calificacion').value,
        enfermedad: document.getElementById('enfermedad').value,
        nota: document.getElementById('nota').value,
        dictamen: document.getElementById('dictamen').value,
        ejecutivo: document.getElementById('ejecutivo').value,
        fechaCita: document.getElementById('fechaCita').value,
        reunion: 'no',
        procesoCerrado: 'no',
        fechaCierre: '',
        creadaEn: new Date().toISOString()
    };
    
    citas = getStoredCitas();
    citas.push(cita);
    setCitas(citas);
    
    alert('Cita agendada exitosamente para ' + cita.nombre);
    
    form.reset();
    
    if (document.getElementById('calendario')) {
        loadCalendar();
    }
    if (document.getElementById('listaCitas')) {
        loadCitasTable();
    }
    if (document.getElementById('dashboard')) {
        loadDashboard();
    }
}

function handleCitaFormSubmit(event) {
    event.preventDefault();
    if (editingCitaId) {
        actualizarCita(editingCitaId);
    } else {
        guardarCita(event);
    }
}

function verDetalles(id) {
    citas = getStoredCitas();
    const cita = citas.find(c => c.id === id);
    if (!cita) return;
    
    selectedCitaId = id;
    
    let modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item"><strong>Nombre:</strong> ${cita.nombre}</div>
            <div class="detail-item"><strong>RUN:</strong> ${cita.run}</div>
            <div class="detail-item"><strong>Fono:</strong> ${cita.fono}</div>
            <div class="detail-item"><strong>Correo:</strong> ${cita.correo || '-'}</div>
            <div class="detail-item"><strong>Dirección:</strong> ${cita.direccion}</div>
            <div class="detail-item"><strong>AFP:</strong> ${cita.afp}</div>
            <div class="detail-item"><strong>Tipo de Pensión:</strong> ${cita.tipoPension}</div>
            <div class="detail-item"><strong>F. Max. Apelación:</strong> ${formatDate(cita.fMaxApelacion) || '-'}</div>
            <div class="detail-item"><strong>F. Sol. Pensión:</strong> ${formatDate(cita.fSolPension)}</div>
            <div class="detail-item"><strong>Calificación:</strong> ${cita.calificacion || '-'}</div>
            <div class="detail-item"><strong>Enfermedad:</strong> ${cita.enfermedad || '-'}</div>
            <div class="detail-item"><strong>Dictamen Nro.:</strong> ${cita.dictamen || '-'}</div>
            <div class="detail-item"><strong>Ejecutivo(a):</strong> ${cita.ejecutivo}</div>
            <div class="detail-item"><strong>Fecha de Cita:</strong> ${formatDateTime(cita.fechaCita)}</div>
        </div>
        <div class="detail-note">
            <strong>Nota:</strong> ${cita.nota || 'Sin notas'}
        </div>
        <div class="detail-executive">
            <strong>Reunión Realizada:</strong> ${cita.reunion === 'si' ? '✅ Sí' : '❌ No'}
            <br>
            <strong>Proceso Concretado:</strong> ${cita.procesoCerrado === 'si' ? '✅ Sí' : '❌ No'}
            ${cita.fechaCierre ? `<br><strong>Fecha de Cierre:</strong> ${formatDate(cita.fechaCierre)}` : ''}
        </div>
    `;
    
    // Si es rol ejecutivo, mostrar controles de gestión
    const executiveActions = document.querySelector('.executive-actions');
    if (executiveActions) {
        executiveActions.style.display = 'block';
        const reunionCheckbox = document.getElementById('reunionRealizada');
        const cierreCheckbox = document.getElementById('procesoCerrado');
        const cierreContainer = document.getElementById('cierreContainer');
        const fechaCierreContainer = document.getElementById('fechaCierreContainer');
        const fechaCierre = document.getElementById('fechaCierre');
        
        reunionCheckbox.checked = cita.reunion === 'si';
        cierreCheckbox.checked = cita.procesoCerrado === 'si';
        fechaCierre.value = cita.fechaCierre || '';
        
        cierreContainer.style.display = cita.reunion === 'si' ? 'block' : 'none';
        fechaCierreContainer.style.display = cita.reunion === 'si' ? 'block' : 'none';
    }
    
    document.getElementById('detailModal').style.display = 'block';
}

function guardarGestion() {
    if (!selectedCitaId) return;
    
    citas = getStoredCitas();
    const idx = citas.findIndex(c => c.id === selectedCitaId);
    if (idx === -1) return;
    
    const reunionCheckbox = document.getElementById('reunionRealizada');
    const cierreCheckbox = document.getElementById('procesoCerrado');
    const fechaCierreInput = document.getElementById('fechaCierre');
    
    if (reunionCheckbox && reunionCheckbox.checked) {
        citas[idx].reunion = 'si';
    } else {
        citas[idx].reunion = 'no';
    }
    
    if (cierreCheckbox && cierreCheckbox.checked) {
        citas[idx].procesoCerrado = 'si';
        citas[idx].fechaCierre = fechaCierreInput ? fechaCierreInput.value : new Date().toISOString().split('T')[0];
    } else {
        citas[idx].procesoCerrado = 'no';
        citas[idx].fechaCierre = '';
    }
    
    setCitas(citas);
    alert('Gestión guardada exitosamente');
    closeModal();
    loadMisCitas();
    loadCitasTable();
    loadCalendar();
    if (document.getElementById('dashboard')) {
        loadDashboard();
    }
}

function editCita() {
    if (!selectedCitaId) return;
    
    citas = getStoredCitas();
    const cita = citas.find(c => c.id === selectedCitaId);
    if (!cita) return;
    
    closeModal();
    
    showSection('nuevaCita');
    
    document.getElementById('nombre').value = cita.nombre;
    document.getElementById('run').value = cita.run;
    document.getElementById('fono').value = cita.fono;
    document.getElementById('direccion').value = cita.direccion;
    document.getElementById('correo').value = cita.correo || '';
    document.getElementById('afp').value = cita.afp;
    document.getElementById('tipoPension').value = cita.tipoPension || '';
    document.getElementById('fMaxApelacion').value = cita.fMaxApelacion || '';
    document.getElementById('fSolPension').value = cita.fSolPension || '';
    document.getElementById('calificacion').value = cita.calificacion || '';
    document.getElementById('enfermedad').value = cita.enfermedad || '';
    document.getElementById('nota').value = cita.nota || '';
    document.getElementById('dictamen').value = cita.dictamen || '';
    document.getElementById('ejecutivo').value = cita.ejecutivo || '';
    document.getElementById('fechaCita').value = cita.fechaCita || '';
    
    editingCitaId = cita.id;
    document.getElementById('citaForm').scrollIntoView({ behavior: 'smooth' });
}

function actualizarCita(id) {
    citas = getStoredCitas();
    const idx = citas.findIndex(c => c.id === id);
    if (idx === -1) {
        editingCitaId = null;
        guardarCita(new Event('submit'));
        return;
    }
    
    const form = document.getElementById('citaForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    citas[idx].nombre = document.getElementById('nombre').value.toUpperCase();
    citas[idx].run = document.getElementById('run').value.toUpperCase();
    citas[idx].fono = document.getElementById('fono').value;
    citas[idx].direccion = document.getElementById('direccion').value.toUpperCase();
    citas[idx].correo = document.getElementById('correo').value;
    citas[idx].afp = document.getElementById('afp').value.toUpperCase();
    citas[idx].tipoPension = document.getElementById('tipoPension').value;
    citas[idx].fMaxApelacion = document.getElementById('fMaxApelacion').value;
    citas[idx].fSolPension = document.getElementById('fSolPension').value;
    citas[idx].calificacion = document.getElementById('calificacion').value;
    citas[idx].enfermedad = document.getElementById('enfermedad').value;
    citas[idx].nota = document.getElementById('nota').value;
    citas[idx].dictamen = document.getElementById('dictamen').value;
    citas[idx].ejecutivo = document.getElementById('ejecutivo').value;
    citas[idx].fechaCita = document.getElementById('fechaCita').value;
    
    setCitas(citas);
    alert('Cita actualizada exitosamente');
    
    form.reset();
    editingCitaId = null;
    
    loadCitasTable();
    loadCalendar();
    loadMisCitas();
    if (document.getElementById('dashboard')) {
        loadDashboard();
    }
}

function deleteCita() {
    if (!selectedCitaId) return;
    
    if (!confirm('¿Está seguro que desea eliminar esta cita?')) return;
    
    citas = getStoredCitas();
    citas = citas.filter(c => c.id !== selectedCitaId);
    setCitas(citas);
    
    alert('Cita eliminada');
    closeModal();
    loadCitasTable();
    loadCalendar();
    if (document.getElementById('dashboard')) {
        loadDashboard();
    }
    if (document.getElementById('misCitasTableBody')) {
        loadMisCitas();
    }
}

// ==================== TABLA DE CITAS (ADMIN / TELEFONISTA) ====================
function loadCitasTable() {
    citas = getStoredCitas();
    const tbody = document.getElementById('citasTableBody');
    if (!tbody) return;
    
    if (citas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-table">No hay citas registradas</td></tr>';
        return;
    }
    
    const sorted = [...citas].sort((a, b) => new Date(b.fechaCita) - new Date(a.fechaCita));
    
    let html = '';
    sorted.forEach(c => {
        html += `
            <tr>
                <td>${c.nombre}</td>
                <td>${c.run}</td>
                <td>${c.fono}</td>
                <td>${c.ejecutivo}</td>
                <td>${formatDateTime(c.fechaCita)}</td>
                <td><span class="status-badge ${estadoClass(c)}">${estadoLabel(c)}</span></td>
                <td>
                    <button class="btn-action" onclick="verDetalles('${c.id}')">👁 Ver</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function filterAppointments() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const ejecutivoValue = document.getElementById('filterEjecutivo').value;
    const estadoValue = document.getElementById('filterEstado') ? document.getElementById('filterEstado').value : '';
    
    citas = getStoredCitas();
    let filtered = [...citas];
    
    if (searchValue) {
        filtered = filtered.filter(c => 
            c.nombre.toLowerCase().includes(searchValue) || 
            c.run.toLowerCase().includes(searchValue)
        );
    }
    
    if (ejecutivoValue) {
        filtered = filtered.filter(c => c.ejecutivo === ejecutivoValue);
    }
    
    if (estadoValue) {
        if (estadoValue === 'pendiente') {
            filtered = filtered.filter(c => c.reunion === 'no');
        } else if (estadoValue === 'reunion') {
            filtered = filtered.filter(c => c.reunion === 'si' && c.procesoCerrado === 'no');
        } else if (estadoValue === 'cerrado') {
            filtered = filtered.filter(c => c.procesoCerrado === 'si');
        }
    }
    
    const tbody = document.getElementById('citasTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-table">No se encontraron resultados</td></tr>';
        return;
    }
    
    let html = '';
    filtered.forEach(c => {
        html += `
            <tr>
                <td>${c.nombre}</td>
                <td>${c.run}</td>
                <td>${c.fono}</td>
                <td>${c.ejecutivo}</td>
                <td>${formatDateTime(c.fechaCita)}</td>
                <td><span class="status-badge ${estadoClass(c)}">${estadoLabel(c)}</span></td>
                <td>
                    <button class="btn-action" onclick="verDetalles('${c.id}')">👁 Ver</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ==================== MIS CITAS (EJECUTIVO) ====================
let myAssignedEjecutivo = localStorage.getItem('pensiones_ejecutivo') || 'MARÍA PAZ INOSTROZA';

function cambiarEjecutivo() {
    const selectEl = document.getElementById('selectEjecutivo');
    if (selectEl) {
        myAssignedEjecutivo = selectEl.value;
        localStorage.setItem('pensiones_ejecutivo', myAssignedEjecutivo);
        loadMisCitas();
        loadCalendar();
    }
}

function loadMisCitas() {
    citas = getStoredCitas();
    const tbody = document.getElementById('misCitasTableBody');
    if (!tbody) return;
    
    // Sincronizar selector
    const selectEl = document.getElementById('selectEjecutivo');
    if (selectEl && selectEl.value !== myAssignedEjecutivo) {
        selectEl.value = myAssignedEjecutivo;
    }
    
    const myCitas = citas.filter(c => c.ejecutivo === myAssignedEjecutivo);
    
    const total = myCitas.length;
    const conReunion = myCitas.filter(c => c.reunion === 'si').length;
    const cerrados = myCitas.filter(c => c.procesoCerrado === 'si').length;
    
    const totalEl = document.getElementById('myTotal');
    const reunionEl = document.getElementById('myReunion');
    const cerradosEl = document.getElementById('myCerrados');
    if (totalEl) totalEl.textContent = total;
    if (reunionEl) reunionEl.textContent = conReunion;
    if (cerradosEl) cerradosEl.textContent = cerrados;
    
    if (myCitas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="empty-table">No tiene citas asignadas</td></tr>';
        return;
    }
    
    let html = '';
    myCitas.forEach(c => {
        const reunionChecked = c.reunion === 'si' ? 'checked' : '';
        const cierreText = c.fechaCierre ? formatDate(c.fechaCierre) : 'Pendiente';
        
        html += `
            <tr>
                <td>${c.nombre}</td>
                <td>${c.run}</td>
                <td>${c.fono}</td>
                <td>${c.direccion}</td>
                <td>${c.correo || '-'}</td>
                <td>${c.afp}</td>
                <td>${c.tipoPension || '-'}</td>
                <td>${formatDateTime(c.fechaCita)}</td>
                <td>${reunionChecked ? '✅' : '❌'}</td>
                <td>${cierreText}</td>
                <td><span class="status-badge ${estadoClass(c)}">${estadoLabel(c)}</span></td>
                <td>
                    <button class="btn-action" onclick="verDetalles('${c.id}')">👁 Ver</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ==================== GESTIÓN EJECUTIVO (MODAL) ====================
function openEjecutivoModal(id) {
    citas = getStoredCitas();
    const cita = citas.find(c => c.id === id);
    if (!cita) return;
    
    selectedCitaId = id;
    
    document.getElementById('reunionRealizada').checked = cita.reunion === 'si';
    document.getElementById('procesoCerrado').checked = cita.procesoCerrado === 'si';
    document.getElementById('fechaCierre').value = cita.fechaCierre || '';
    
    document.getElementById('cierreContainer').style.display = cita.reunion === 'si' ? 'block' : 'none';
    document.getElementById('fechaCierreContainer').style.display = cita.reunion === 'si' ? 'block' : 'none';
    
    document.getElementById('detailModal').style.display = 'block';
}

function toggleCierreVisibility() {
    const reunionCheckbox = document.getElementById('reunionRealizada');
    const cierrContainer = document.getElementById('cierreContainer');
    const fechaCierreContainer = document.getElementById('fechaCierreContainer');
    
    if (reunionCheckbox.checked) {
        cierrContainer.style.display = 'block';
        fechaCierreContainer.style.display = 'block';
    } else {
        cierrContainer.style.display = 'none';
        fechaCierreContainer.style.display = 'none';
        document.getElementById('procesoCerrado').checked = false;
    }
}

// ==================== CALENDARIO ====================
function loadCalendar() {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const monthTitle = document.getElementById('currentMonth');
    if (monthTitle) {
        monthTitle.textContent = `${months[currentMonth]} ${currentYear}`;
    }
    
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = '';
    
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    citas = getStoredCitas();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayCitas = citas.filter(c => {
            if (!c.fechaCita) return false;
            const citaDate = c.fechaCita.split('T')[0];
            
            if (currentRole === 'ejecutivo') {
                return citaDate === dateStr && c.ejecutivo === myAssignedEjecutivo;
            }
            return citaDate === dateStr;
        });
        
        const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${dayCitas.length > 0 ? 'has-citas' : ''}" 
                 onclick="showDayCitas('${dateStr}')">
                <span class="day-number">${day}</span>
                ${dayCitas.length > 0 ? `<span class="day-badge">${dayCitas.length}</span>` : ''}
            </div>
        `;
    }
    
    calendarDays.innerHTML = html;
}

function showDayCitas(dateStr) {
    citas = getStoredCitas();
    
    let dayCitas;
    if (currentRole === 'ejecutivo') {
        dayCitas = citas.filter(c => {
            if (!c.fechaCita) return false;
            const citaDate = c.fechaCita.split('T')[0];
            return citaDate === dateStr && c.ejecutivo === myAssignedEjecutivo;
        });
    } else {
        dayCitas = citas.filter(c => {
            if (!c.fechaCita) return false;
            const citaDate = c.fechaCita.split('T')[0];
            return citaDate === dateStr;
        });
    }
    
    const container = document.getElementById('dayAppointments');
    
    if (dayCitas.length === 0) {
        container.innerHTML = `<h3>No hay citas para el ${formatDate(dateStr)}</h3>`;
        return;
    }
    
    let html = `<h3>Citas para el ${formatDate(dateStr)}</h3><ul class="day-citas-list">`;
    
    dayCitas.forEach(c => {
        const hora = c.fechaCita ? c.fechaCita.split('T')[1].substring(0, 5) : 'Sin hora';
        html += `
            <li class="day-cita-item">
                <span class="cita-hora">${hora}</span>
                <span class="cita-nombre">${c.nombre}</span>
                <span class="cita-ejecutivo">${c.ejecutivo}</span>
                <span class="status-badge ${estadoClass(c)}">${estadoLabel(c)}</span>
                <button class="btn-action" onclick="verDetalles('${c.id}')">👁 Ver</button>
            </li>
        `;
    });
    
    html += '</ul>';
    container.innerHTML = html;
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    loadCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    loadCalendar();
}

// ==================== GESTIONAR EJECUTIVOS (ADMIN) ====================
function loadExecutivesList() {
    citas = getStoredCitas();
    const container = document.getElementById('executivesList');
    if (!container) return;
    
    let html = '<table class="data-table"><thead><tr><th>Ejecutivo(a)</th><th>Citas Asignadas</th><th>Reuniones Realizadas</th><th>Procesos Cerrados</th></tr></thead><tbody>';
    
    EJECUTIVOS.forEach(nombre => {
        const ejCitas = citas.filter(c => c.ejecutivo === nombre);
        const total = ejCitas.length;
        const reuniones = ejCitas.filter(c => c.reunion === 'si').length;
        const cerrados = ejCitas.filter(c => c.procesoCerrado === 'si').length;
        
        html += `
            <tr>
                <td>${nombre}</td>
                <td>${total}</td>
                <td>${reuniones}</td>
                <td>${cerrados}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ==================== FORMATO DE FECHAS ====================
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'Sin fecha';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
           d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ==================== ESTADOS ====================
function estadoClass(cita) {
    if (cita.procesoCerrado === 'si') return 'cerrado';
    if (cita.reunion === 'si') return 'reunion';
    return 'pendiente';
}

function estadoLabel(cita) {
    if (cita.procesoCerrado === 'si') return 'CERRADO';
    if (cita.reunion === 'si') return 'REUNIÓN HECHA';
    return 'PENDIENTE';
}

// ==================== MODAL ====================
function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedCitaId = null;
}

// ==================== EVENTOS GLOBALES ====================
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const citaForm = document.getElementById('citaForm');
    if (citaForm) {
        if (typeof editingCitaId === 'undefined') {
            editingCitaId = null;
        }
        citaForm.addEventListener('submit', handleCitaFormSubmit);
    }
    
    const reunionCheckbox = document.getElementById('reunionRealizada');
    if (reunionCheckbox) {
        reunionCheckbox.addEventListener('change', toggleCierreVisibility);
    }
});

// Click en el modal para cerrar
window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
        selectedCitaId = null;
    }
};