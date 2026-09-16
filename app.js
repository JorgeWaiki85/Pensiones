// ==================== CONFIGURACIÓN DE USUARIOS ====================
const USERS_FIJOS = {
    'admin': { password: 'admin123', role: 'admin', name: 'Administrador del Sistema' },
    'telefonista': { password: 'tel123', role: 'telefonista', name: 'Telefonista' }
};

const EJECUTIVOS_DEFAULT = [
    { nombre: 'MARÍA PAZ INOSTROZA', telefono: '+56 9 1234 0001' },
    { nombre: 'PAULINA INOSTROZA', telefono: '+56 9 1234 0002' },
    { nombre: 'CARLOS VALLADARES', telefono: '+56 9 1234 0003' },
    { nombre: 'EVELYN VALLADARES', telefono: '+56 9 1234 0004' },
    { nombre: 'MAYROBERT BUSTILLO', telefono: '+56 9 1234 0005' },
    { nombre: 'DANIELA PÉREZ', telefono: '+56 9 1234 0006' },
    { nombre: 'ANDRES ORREGO', telefono: '+56 9 1234 0007' },
    { nombre: 'WENDOLIN GONZÁLEZ', telefono: '+56 9 1234 0008' },
    { nombre: 'RENATA LAGOS', telefono: '+56 9 1234 0009' },
    { nombre: 'PAOLA RAMÍREZ', telefono: '+56 9 1234 0010' },
    { nombre: 'JOAN SALFATE', telefono: '+56 9 1234 0011' },
    { nombre: 'GHISLAINE CÁCERES', telefono: '+56 9 1234 0012' },
    { nombre: 'EMILY DÍAZ', telefono: '+56 9 1234 0013' },
    { nombre: 'ARIANY RIOS', telefono: '+56 9 1234 0014' }
];

function normalizeUsername(nombre) {
    return nombre.split(' ')[0].toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getStoredEjecutivos() {
    let stored;
    try {
        stored = JSON.parse(localStorage.getItem('pensiones_ejecutivos'));
    } catch (e) {
        stored = null;
    }

    if (!stored || !Array.isArray(stored) || stored.length === 0) {
        stored = EJECUTIVOS_DEFAULT.map(e => ({
            nombre: e.nombre,
            telefono: e.telefono,
            correo: e.correo || '',
            username: normalizeUsername(e.nombre),
            password: 'ejec123'
        }));
        localStorage.setItem('pensiones_ejecutivos', JSON.stringify(stored));
    }
    return stored;
}

function saveEjecutivos(lista) {
    localStorage.setItem('pensiones_ejecutivos', JSON.stringify(lista));
}

function getUsers() {
    const users = Object.assign({}, USERS_FIJOS);
    getStoredEjecutivos().forEach(e => {
        if (e.username) {
            users[e.username.toLowerCase()] = {
                password: e.password,
                role: 'ejecutivo',
                name: e.nombre,
                telefono: e.telefono
            };
        }
    });
    return users;
}

let EJECUTIVOS = getStoredEjecutivos();

// ==================== CONFIGURACIÓN DE NOTIFICACIONES DEL ADMINISTRADOR ====================
const CONFIG_DEFAULT = {
    admin_correo: 'jorge.huaiquicheo86@gmail.com',
    admin_telefono: '+56971779459'
};

function getConfig() {
    let cfg;
    try {
        cfg = JSON.parse(localStorage.getItem('pensiones_config'));
    } catch (e) {
        cfg = null;
    }
    if (!cfg || !cfg.admin_correo || !cfg.admin_telefono) {
        cfg = Object.assign({}, CONFIG_DEFAULT, cfg || {});
        localStorage.setItem('pensiones_config', JSON.stringify(cfg));
    }
    return cfg;
}

function saveConfig(cfg) {
    localStorage.setItem('pensiones_config', JSON.stringify(cfg));
}

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
    
    const USERS = getUsers();
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

        // El ejecutivo ve automáticamente sus propias citas
        if (userData.role === 'ejecutivo' && userData.name) {
            myAssignedEjecutivo = userData.name;
            localStorage.setItem('pensiones_ejecutivo', myAssignedEjecutivo);
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
        'Gestionar Ejecutivos': 'gestionarEjecutivos',
        'Configuración': 'configuracion'
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
    if (sectionId === 'configuracion') {
        loadConfiguracion();
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

    const ejecutivosActivosEl = document.getElementById('ejecutivosActivos');
    if (ejecutivosActivosEl) {
        ejecutivosActivosEl.textContent = getStoredEjecutivos().length;
    }
    
    const actividadEl = document.getElementById('actividadReciente');
    if (citas.length === 0) {
        actividadEl.innerHTML = '<p class="no-activity">No hay actividad reciente</p>';
    } else {
        const sorted = [...citas].sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn)).slice(0, 8);
        let html = '<ul>';
        sorted.forEach(c => {
            html += `<li>
                <span class="activity-date">${formatDateShort(c.creadaEn)}</span>
                <span class="activity-text"><strong>${c.nombre}</strong> - ${c.ejecutivo || 'SIN ASIGNAR'}</span>
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
        ejecutivo: document.getElementById('ejecutivo') ? document.getElementById('ejecutivo').value : '',
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
    
    // La telefonista no asigna ejecutivo: se notifica al administrador
    if (currentRole === 'telefonista') {
        notifyAdmin(cita);
        form.reset();
        if (document.getElementById('calendario')) loadCalendar();
        if (document.getElementById('listaCitas')) loadCitasTable();
        if (document.getElementById('dashboard')) loadDashboard();
        return;
    }
    
    // Notificación WhatsApp al ejecutivo asignado
    const ejecutivoAsignado = EJECUTIVOS.find(e => e.nombre === cita.ejecutivo);
    if (ejecutivoAsignado && ejecutivoAsignado.telefono) {
        const url = buildWhatsAppUrl(ejecutivoAsignado.telefono, cita);
        if (url && confirm(`¿Abrir WhatsApp para notificar a ${ejecutivoAsignado.nombre} sobre esta cita?`)) {
            window.open(url, '_blank');
        }
    } else if (ejecutivoAsignado) {
        if (confirm(`El ejecutivo ${ejecutivoAsignado.nombre} no tiene teléfono registrado.\n¿Ir a Gestionar Ejecutivos para agregarlo?`)) {
            if (document.getElementById('gestionarEjecutivos')) {
                showSection('gestionarEjecutivos');
                loadExecutivesList();
            }
        }
    }
    
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
            <div class="detail-item"><strong>Ejecutivo(a):</strong> ${cita.ejecutivo || 'SIN ASIGNAR'}</div>
            <div class="detail-item"><strong>Fecha de Cita:</strong> ${formatDateTime(cita.fechaCita)}</div>
        </div>
        <div class="detail-note">
            <strong>Nota:</strong> ${cita.nota || 'Sin notas'}
        </div>
        <div class="detail-executive">
            <strong>Reunión Realizada:</strong> ${cita.reunion === 'si' ? '✅ Sí' : '❌ No'}
            <br>
            <strong>Dictamen Ejecutoriado:</strong> ${cita.dictamenEjecutoriado === 'si' ? '✅ Sí' : '❌ No'}
            <br>
            <strong>Certificado de Saldo:</strong> ${cita.certificadoSaldo === 'si' ? '✅ Sí' : '❌ No'}
            <br>
            <strong>Solicitud de SCOMP:</strong> ${cita.solicitudScomp === 'si' ? '✅ Sí' : '❌ No'}
            <br>
            <strong>Elección de Modalidad:</strong> ${cita.eleccionModalidad === 'si' ? '✅ Sí' : '❌ No'}
            <br>
            <strong>Fidelización:</strong> ${cita.fidelizacion === 'si' ? '✅ Sí' : '❌ No'}
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
        document.getElementById('dictamenEjecutoriado').checked = cita.dictamenEjecutoriado === 'si';
        document.getElementById('certificadoSaldo').checked = cita.certificadoSaldo === 'si';
        document.getElementById('solicitudScomp').checked = cita.solicitudScomp === 'si';
        document.getElementById('eleccionModalidad').checked = cita.eleccionModalidad === 'si';
        document.getElementById('fidelizacion').checked = cita.fidelizacion === 'si';
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
    
    citas[idx].reunion = reunionCheckbox && reunionCheckbox.checked ? 'si' : 'no';
    citas[idx].dictamenEjecutoriado = document.getElementById('dictamenEjecutoriado').checked ? 'si' : 'no';
    citas[idx].certificadoSaldo = document.getElementById('certificadoSaldo').checked ? 'si' : 'no';
    citas[idx].solicitudScomp = document.getElementById('solicitudScomp').checked ? 'si' : 'no';
    citas[idx].eleccionModalidad = document.getElementById('eleccionModalidad').checked ? 'si' : 'no';
    citas[idx].fidelizacion = document.getElementById('fidelizacion').checked ? 'si' : 'no';
    
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
    const selEjec = document.getElementById('ejecutivo');
    if (selEjec) selEjec.value = cita.ejecutivo || '';
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
    const selEjec = document.getElementById('ejecutivo');
    citas[idx].ejecutivo = currentRole === 'telefonista'
        ? citas[idx].ejecutivo
        : (selEjec ? selEjec.value : citas[idx].ejecutivo);
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

// ==================== ASIGNAR EJECUTIVO A CITA (ADMIN) ====================
function asignarEjecutivo(citaId) {
    const sel = document.getElementById('asignarSel_' + citaId);
    const ejecutivoNombre = sel ? sel.value : '';
    if (!ejecutivoNombre) {
        alert('Seleccione un ejecutivo para asignar');
        return;
    }

    citas = getStoredCitas();
    const idx = citas.findIndex(c => c.id === citaId);
    if (idx === -1) return;

    citas[idx].ejecutivo = ejecutivoNombre;
    setCitas(citas);

    alert('Ejecutivo asignado a la cita');
    loadCitasTable();
    loadCalendar();
    loadMisCitas();
    if (document.getElementById('dashboard')) loadDashboard();
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
        const acciones = [];

        if (currentRole === 'admin' && !c.ejecutivo) {
            acciones.push(`
                <select id="asignarSel_${c.id}" class="asignar-select">
                    <option value="">Asignar...</option>
                    ${EJECUTIVOS.map(e => `<option value="${e.nombre}">${e.nombre}</option>`).join('')}
                </select>
                <button class="btn-action" onclick="asignarEjecutivo('${c.id}')">✔ Asignar</button>
            `);
        }

        acciones.push(`<button class="btn-action" onclick="verDetalles('${c.id}')">👁 Ver</button>`);

        html += `
            <tr>
                <td>${c.nombre}</td>
                <td>${c.run}</td>
                <td>${c.fono}</td>
                <td>${c.ejecutivo || '<span class="sin-asignar">SIN ASIGNAR</span>'}</td>
                <td>${formatDateTime(c.fechaCita)}</td>
                <td><span class="status-badge ${estadoClass(c)}">${estadoLabel(c)}</span></td>
                <td>${acciones.join(' ')}</td>
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
        if (ejecutivoValue === 'sinAsignar') {
            filtered = filtered.filter(c => !c.ejecutivo);
        } else {
            filtered = filtered.filter(c => c.ejecutivo === ejecutivoValue);
        }
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
        const acciones = [];

        if (currentRole === 'admin' && !c.ejecutivo) {
            acciones.push(`
                <select id="asignarSel_${c.id}" class="asignar-select">
                    <option value="">Asignar...</option>
                    ${EJECUTIVOS.map(e => `<option value="${e.nombre}">${e.nombre}</option>`).join('')}
                </select>
                <button class="btn-action" onclick="asignarEjecutivo('${c.id}')">✔ Asignar</button>
            `);
        }

        acciones.push(`<button class="btn-action" onclick="verDetalles('${c.id}')">👁 Ver</button>`);

        html += `
            <tr>
                <td>${c.nombre}</td>
                <td>${c.run}</td>
                <td>${c.fono}</td>
                <td>${c.ejecutivo || '<span class="sin-asignar">SIN ASIGNAR</span>'}</td>
                <td>${formatDateTime(c.fechaCita)}</td>
                <td><span class="status-badge ${estadoClass(c)}">${estadoLabel(c)}</span></td>
                <td>${acciones.join(' ')}</td>
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
        document.getElementById('dictamenEjecutoriado').checked = false;
        document.getElementById('certificadoSaldo').checked = false;
        document.getElementById('solicitudScomp').checked = false;
        document.getElementById('eleccionModalidad').checked = false;
        document.getElementById('fidelizacion').checked = false;
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
                <span class="cita-ejecutivo">${c.ejecutivo || 'SIN ASIGNAR'}</span>
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

    EJECUTIVOS = getStoredEjecutivos();

    if (EJECUTIVOS.length === 0) {
        container.innerHTML = '<p class="no-activity">No hay ejecutivos registrados</p>';
        return;
    }

    let html = '<table class="data-table"><thead><tr><th>Ejecutivo(a)</th><th>Teléfono</th><th>Correo</th><th>Usuario</th><th>Citas</th><th>Reuniones</th><th>Cerrados</th><th>Acciones</th></tr></thead><tbody>';

    EJECUTIVOS.forEach(e => {
        const ejCitas = citas.filter(c => c.ejecutivo === e.nombre);
        const cerrados = ejCitas.filter(c => c.procesoCerrado === 'si').length;

        html += `
            <tr>
                <td>${e.nombre}</td>
                <td>${e.telefono || 'Sin teléfono'}</td>
                <td>${e.correo || '-'}</td>
                <td>${e.username || '-'}</td>
                <td>${ejCitas.length}</td>
                <td>${ejCitas.filter(c => c.reunion === 'si').length}</td>
                <td>${cerrados}</td>
                <td>
                    <button class="btn-action" onclick="openEjecutivoForm('${e.nombre.replace(/'/g, "\\'")}')">✏️ Editar</button>
                    <button class="btn-action danger" onclick="eliminarEjecutivo('${e.nombre.replace(/'/g, "\\'")}')">🗑 Eliminar</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function openEjecutivoForm(nombre) {
    const modal = document.getElementById('ejecutivoModal');
    if (!modal) return;
    const form = document.getElementById('ejecutivoForm');
    const title = document.getElementById('ejecutivoModalTitle');

    form.reset();
    document.getElementById('ejecutivoId').value = '';
    document.getElementById('ejPassword').setAttribute('required', 'required');

    if (nombre) {
        EJECUTIVOS = getStoredEjecutivos();
        const ejecutivo = EJECUTIVOS.find(e => e.nombre === nombre);
        if (!ejecutivo) return;
        title.textContent = 'Editar Ejecutivo';
        document.getElementById('ejecutivoId').value = ejecutivo.nombre;
        document.getElementById('ejNombre').value = ejecutivo.nombre;
        document.getElementById('ejTelefono').value = ejecutivo.telefono || '';
        document.getElementById('ejCorreo').value = ejecutivo.correo || '';
        document.getElementById('ejUsername').value = ejecutivo.username || '';
        document.getElementById('ejPassword').removeAttribute('required');
        document.getElementById('ejPassword').placeholder = 'Dejar vacío para mantener la actual';
    } else {
        title.textContent = 'Nuevo Ejecutivo';
        document.getElementById('ejPassword').placeholder = '';
    }

    form.onsubmit = function(e) {
        e.preventDefault();
        guardarEjecutivo();
    };

    modal.style.display = 'block';
}

function guardarEjecutivo() {
    const originalNombre = document.getElementById('ejecutivoId').value;
    const nombre = document.getElementById('ejNombre').value.trim().toUpperCase();
    const telefono = document.getElementById('ejTelefono').value.trim();
    const correo = document.getElementById('ejCorreo').value.trim();
    const username = document.getElementById('ejUsername').value.trim().toLowerCase();
    const password = document.getElementById('ejPassword').value;

    if (!nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    if (!username) {
        alert('El usuario es obligatorio');
        return;
    }

    EJECUTIVOS = getStoredEjecutivos();

    // Chequear nombre duplicado
    if (EJECUTIVOS.some(e => e.nombre === nombre && e.nombre !== originalNombre)) {
        alert('Ya existe un ejecutivo con ese nombre');
        return;
    }
    // Chequear usuario duplicado
    if (EJECUTIVOS.some(e => e.username.toLowerCase() === username && e.nombre !== originalNombre)) {
        alert('El nombre de usuario ya está en uso');
        return;
    }

    if (originalNombre) {
        // EDITAR
        const idx = EJECUTIVOS.findIndex(e => e.nombre === originalNombre);
        if (idx === -1) return;
        EJECUTIVOS[idx].nombre = nombre;
        EJECUTIVOS[idx].telefono = telefono;
        EJECUTIVOS[idx].correo = correo;
        EJECUTIVOS[idx].username = username;
        if (password) {
            EJECUTIVOS[idx].password = password;
        }
        saveEjecutivos(EJECUTIVOS);
        alert('Ejecutivo actualizado exitosamente');
    } else {
        // CREAR
        if (!password) {
            alert('La contraseña es obligatoria');
            return;
        }
        EJECUTIVOS.push({ nombre, telefono, correo, username, password });
        saveEjecutivos(EJECUTIVOS);
        alert('Ejecutivo creado exitosamente');
    }

    closeEjecutivoModal();
    loadExecutivesList();
    loadDashboard();
    refrescarSelects();
}

function eliminarEjecutivo(nombre) {
    if (!confirm(`¿Está seguro que desea eliminar a ${nombre} y su usuario de acceso?`)) return;

    EJECUTIVOS = getStoredEjecutivos();
    const tieneCitas = getStoredCitas().some(c => c.ejecutivo === nombre);
    if (tieneCitas) {
        alert('No se puede eliminar: el ejecutivo tiene citas asignadas');
        return;
    }

    EJECUTIVOS = EJECUTIVOS.filter(e => e.nombre !== nombre);
    saveEjecutivos(EJECUTIVOS);
    alert('Ejecutivo eliminado');
    loadExecutivesList();
    loadDashboard();
    refrescarSelects();
}

function closeEjecutivoModal() {
    const modal = document.getElementById('ejecutivoModal');
    if (modal) modal.style.display = 'none';
}

// ==================== CONFIGURACIÓN NOTIFICACIONES (ADMIN) ====================
function loadConfiguracion() {
    const cfg = getConfig();
    if (document.getElementById('adminCorreo')) document.getElementById('adminCorreo').value = cfg.admin_correo || '';
    if (document.getElementById('adminTelefono')) document.getElementById('adminTelefono').value = cfg.admin_telefono || '';
}

function guardarConfiguracion(e) {
    e.preventDefault();
    const cfg = {
        admin_correo: document.getElementById('adminCorreo').value.trim(),
        admin_telefono: document.getElementById('adminTelefono').value.trim()
    };
    saveConfig(cfg);
    alert('Configuración de notificaciones guardada');
}

function refrescarSelects() {
    EJECUTIVOS = getStoredEjecutivos();

    const selectCita = document.getElementById('ejecutivo');
    if (selectCita) {
        selectCita.innerHTML = '<option value="">Seleccione ejecutivo...</option>';
        EJECUTIVOS.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.nombre;
            opt.textContent = e.nombre;
            selectCita.appendChild(opt);
        });
    }

    const selectFiltro = document.getElementById('filterEjecutivo');
    if (selectFiltro) {
        const actual = selectFiltro.value;
        selectFiltro.innerHTML = '<option value="">Todos los Ejecutivos</option>';
        EJECUTIVOS.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.nombre;
            opt.textContent = e.nombre;
            selectFiltro.appendChild(opt);
        });
        const optSin = document.createElement('option');
        optSin.value = 'sinAsignar';
        optSin.textContent = 'Sin Asignar';
        selectFiltro.appendChild(optSin);
        selectFiltro.value = actual;
    }

    const selectEjecutivoPanel = document.getElementById('selectEjecutivo');
    if (selectEjecutivoPanel) {
        selectEjecutivoPanel.innerHTML = '';
        EJECUTIVOS.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.nombre;
            opt.textContent = e.nombre;
            selectEjecutivoPanel.appendChild(opt);
        });
        selectEjecutivoPanel.value = myAssignedEjecutivo;
    }
}

// ==================== NOTIFICACIÓN WHATSAPP ====================
function buildWhatsAppUrl(telefono, cita) {
    const phone = (telefono || '').replace(/[^0-9]/g, '');
    if (!phone) return null;

    const mensaje = [
        `Hola ${cita.ejecutivo}, se ha agendado una nueva cita de pensión en el sistema PENSIONES:`,
        ``,
        `👤 Cliente: ${cita.nombre}`,
        `🪪 RUN: ${cita.run}`,
        `📞 Fono: ${cita.fono}`,
        `🏦 AFP: ${cita.afp}`,
        `📋 Pensión: ${cita.tipoPension || 'Sin especificar'}`,
        `📅 Fecha de la cita: ${formatWhatsAppDate(cita.fechaCita)}`,
        ``,
        `Por favor revise los detalles en el sistema.`
    ].join('\n');

    return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
}

function formatWhatsAppDate(dateStr) {
    if (!dateStr) return 'Sin fecha';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ==================== NOTIFICACIÓN AL ADMINISTRADOR ====================
function notifyAdmin(cita) {
    const cfg = getConfig();
    const mensaje = [
        `Se ha registrado una nueva cita de pensión (pendiente de asignación de ejecutivo):`,
        ``,
        `👤 Cliente: ${cita.nombre}`,
        `🪪 RUN: ${cita.run}`,
        `📞 Fono: ${cita.fono}`,
        `📧 Correo: ${cita.correo || '-'}`,
        `🏦 AFP: ${cita.afp}`,
        `📋 Pensión: ${cita.tipoPension || 'Sin especificar'}`,
        `📅 Fecha de la cita: ${formatWhatsAppDate(cita.fechaCita)}`,
        ``,
        `Por favor asigne un ejecutivo(a) en el sistema.`
    ].join('\n');

    const telefono = (cfg.admin_telefono || '').replace(/[^0-9]/g, '');
    if (telefono && confirm('¿Abrir WhatsApp para notificar al Administrador sobre esta cita?')) {
        window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
    }

    if (cfg.admin_correo && confirm('¿Abrir correo para notificar al Administrador sobre esta cita?')) {
        const subject = encodeURIComponent('Nueva cita registrada - PENSIONES');
        window.open(`mailto:${cfg.admin_correo}?subject=${subject}&body=${encodeURIComponent(mensaje)}`, '_blank');
    }
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

    const configForm = document.getElementById('configForm');
    if (configForm) {
        configForm.addEventListener('submit', guardarConfiguracion);
    }

    refrescarSelects();
});

// Click en el modal para cerrar
window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
        selectedCitaId = null;
    }
};