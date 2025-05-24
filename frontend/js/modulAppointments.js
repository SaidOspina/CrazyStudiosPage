/**
 * Módulo de Citas para Dashboard Administrador
 * Archivo: frontend/js/modulAppointments.js
 * Parte 1: Variables globales y configuración inicial
 */

// Variables globales del módulo
let currentAppointmentsPage = 1;
let appointmentsPerPage = 10;
let appointmentsData = [];
let filteredAppointmentsData = [];
let clientsOptionsForAppointments = []; // Para el selector de clientes
let projectsOptionsForAppointments = []; // Para el selector de proyectos
let currentCalendarDate = new Date();
let currentViewMode = 'calendar'; // 'calendar' o 'list'

// Configuración de tipos y estados de citas según el backend
const APPOINTMENT_TYPES = {
    'consulta-general': 'Consulta General',
    'plan-personalizado': 'Plan Personalizado',
    'seguimiento-proyecto': 'Seguimiento de Proyecto'
};

const APPOINTMENT_STATUSES = {
    'pendiente': 'Pendiente',
    'confirmada': 'Confirmada',
    'cancelada': 'Cancelada',
    'completada': 'Completada'
};

// Opciones de horarios disponibles
const AVAILABLE_TIMES = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
];

// Colores para el calendario según el tipo de cita
const APPOINTMENT_COLORS = {
    'consulta-general': '#007bff',
    'plan-personalizado': '#28a745',
    'seguimiento-proyecto': '#ff9800'
};

/**
 * Función principal de inicialización del módulo de citas
 */
function initAppointmentsModule() {
    console.log('🎯 Inicializando módulo de citas...');
    
    try {
        // Configurar eventos de la sección de citas
        setupAppointmentsEvents();
        
        // Cargar datos necesarios
        loadAppointmentsData();
        loadClientsForAppointments();
        loadProjectsForAppointments();
        
        // Configurar filtros
        setupAppointmentsFilters();
        
        // Configurar vista de calendario
        setupCalendarView();
        
        // Configurar vista de lista
        setupListView();
        
        // Configurar paginación
        setupAppointmentsPagination();
        
        console.log('✅ Módulo de citas inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar módulo de citas:', error);
        showToast('Error al inicializar módulo de citas', 'error');
    }
}

/**
 * Función completa de inicialización (para uso externo)
 */
function initAppointmentsModuleComplete() {
    console.log('🚀 Inicializando módulo completo de citas...');
    
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
        initAppointmentsModule();
    }, 100);
}

/**
 * Configurar todos los eventos relacionados con citas
 */
function setupAppointmentsEvents() {
    console.log('🔧 Configurando eventos de citas...');
    
    // Botón principal de nueva cita
    const newAppointmentBtn = document.getElementById('new-appointment-btn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', function() {
            console.log('Click en botón nueva cita');
            openCreateAppointmentModal();
        });
        console.log('✅ Botón nueva cita configurado');
    } else {
        console.warn('⚠️ Botón new-appointment-btn no encontrado');
    }
    
    // Tabs de vista (calendario vs lista)
    const viewTabs = document.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchAppointmentView(view);
        });
    });
    
    // Navegación del calendario
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => navigateCalendar(-1));
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => navigateCalendar(1));
    }
    
    // Búsqueda de citas
    const appointmentSearchBtn = document.getElementById('appointment-search-btn');
    const appointmentSearchInput = document.getElementById('appointment-search');
    
    if (appointmentSearchBtn) {
        appointmentSearchBtn.addEventListener('click', searchAppointments);
    }
    
    if (appointmentSearchInput) {
        appointmentSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchAppointments();
            }
        });
        
        // Búsqueda en tiempo real
        appointmentSearchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                searchAppointments();
            }, 500);
        });
    }
    
    console.log('🎯 Eventos de citas configurados');
}

/**
 * Función global para abrir modal de crear cita (llamada desde quick actions)
 */
function openCreateAppointmentModal() {
    console.log('🎯 Abriendo modal de crear cita...');
    
    // Verificar que tenemos los datos necesarios
    if (clientsOptionsForAppointments.length === 0) {
        console.log('No hay clientes cargados, cargando...');
        showToast('Cargando lista de clientes...', 'info');
        loadClientsForAppointments().then(() => {
            if (clientsOptionsForAppointments.length === 0) {
                showToast('No hay clientes disponibles. Crea un cliente primero.', 'warning');
                return;
            }
            createAppointmentModal();
        });
    } else {
        createAppointmentModal();
    }
}

/**
 * Cambiar entre vista de calendario y lista
 */
function switchAppointmentView(view) {
    console.log(`🔄 Cambiando vista a: ${view}`);
    
    currentViewMode = view;
    
    // Actualizar tabs activos
    const viewTabs = document.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-view') === view) {
            tab.classList.add('active');
        }
    });
    
    // Mostrar/ocultar vistas
    const calendarView = document.getElementById('appointments-calendar');
    const listView = document.getElementById('appointments-list-view');
    
    if (view === 'calendar') {
        if (calendarView) calendarView.classList.add('active');
        if (listView) listView.classList.remove('active');
        renderCalendarView();
    } else {
        if (calendarView) calendarView.classList.remove('active');
        if (listView) listView.classList.add('active');
        renderAppointmentsList();
    }
}

/**
 * Función para debug - verificar estado del módulo
 */
function debugAppointmentsModule() {
    console.log('=== DEBUG MÓDULO DE CITAS ===');
    console.log('appointmentsData:', appointmentsData.length, 'citas');
    console.log('clientsOptionsForAppointments:', clientsOptionsForAppointments.length, 'clientes');
    console.log('projectsOptionsForAppointments:', projectsOptionsForAppointments.length, 'proyectos');
    console.log('currentViewMode:', currentViewMode);
    console.log('currentCalendarDate:', currentCalendarDate);
    
    // Verificar elementos del DOM
    const elements = {
        'new-appointment-btn': document.getElementById('new-appointment-btn'),
        'appointments-calendar': document.getElementById('appointments-calendar'),
        'appointments-list-view': document.getElementById('appointments-list-view'),
        'appointments-table': document.getElementById('appointments-table')
    };
    
    console.log('Elementos DOM:');
    Object.entries(elements).forEach(([key, element]) => {
        console.log(`- ${key}:`, element ? '✅' : '❌');
    });
}

// Exponer funciones globalmente
window.initAppointmentsModule = initAppointmentsModule;
window.initAppointmentsModuleComplete = initAppointmentsModuleComplete;
window.openCreateAppointmentModal = openCreateAppointmentModal;
window.debugAppointmentsModule = debugAppointmentsModule;

console.log('📅 Módulo de citas - Parte 1 cargada: Variables y configuración inicial');

/**
 * Módulo de Citas - Parte 2: Funciones para cargar datos desde la API
 */

/**
 * Carga los datos de citas desde la API
 */
async function loadAppointmentsData() {
    console.log('📅 Cargando datos de citas...');
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/appointments?page=${currentAppointmentsPage}&limit=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar citas');
        }
        
        const data = await response.json();
        console.log('📊 Citas cargadas:', data);
        
        appointmentsData = data.data || [];
        filteredAppointmentsData = [...appointmentsData];
        
        // Procesar las fechas para el manejo correcto
        appointmentsData.forEach(appointment => {
            if (appointment.fecha) {
                appointment.fecha = new Date(appointment.fecha);
            }
        });
        
        console.log(`✅ ${appointmentsData.length} citas cargadas correctamente`);
        
        // Renderizar la vista actual
        if (currentViewMode === 'calendar') {
            renderCalendarView();
        } else {
            renderAppointmentsList();
        }
        
        // Actualizar estadísticas
        updateAppointmentsStatistics();
        
    } catch (error) {
        console.error('❌ Error al cargar citas:', error);
        showToast('Error al cargar citas', 'error');
        
        // Mostrar datos de ejemplo en caso de error
        showSampleAppointmentsData();
    }
}

/**
 * Carga las opciones de clientes para los selectores de citas
 */
async function loadClientsForAppointments() {
    console.log('👥 Cargando clientes para citas...');
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/users?limit=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar clientes');
        }
        
        const data = await response.json();
        const allUsers = data.data || [];
        
        // Filtrar solo clientes
        clientsOptionsForAppointments = allUsers.filter(user => user.rol === 'cliente');
        
        console.log(`✅ ${clientsOptionsForAppointments.length} clientes disponibles para citas`);
        
    } catch (error) {
        console.error('❌ Error al cargar clientes para citas:', error);
        clientsOptionsForAppointments = [];
    }
}

/**
 * Carga las opciones de proyectos para los selectores de citas
 */
async function loadProjectsForAppointments() {
    console.log('📊 Cargando proyectos para citas...');
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/projects?limit=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        const data = await response.json();
        projectsOptionsForAppointments = data.data || [];
        
        console.log(`✅ ${projectsOptionsForAppointments.length} proyectos disponibles para citas`);
        
    } catch (error) {
        console.error('❌ Error al cargar proyectos para citas:', error);
        projectsOptionsForAppointments = [];
    }
}

/**
 * Carga proyectos específicos de un cliente
 */
async function loadClientProjects(clientId) {
    console.log('📋 Cargando proyectos del cliente:', clientId);
    
    if (!clientId) {
        return [];
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/projects?cliente=${clientId}&limit=100`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.warn('Error al cargar proyectos del cliente');
            return [];
        }
        
        const data = await response.json();
        const clientProjects = data.data || [];
        
        console.log(`✅ ${clientProjects.length} proyectos encontrados para el cliente`);
        return clientProjects;
        
    } catch (error) {
        console.error('❌ Error al cargar proyectos del cliente:', error);
        return [];
    }
}

/**
 * Muestra datos de ejemplo cuando falla la carga
 */
function showSampleAppointmentsData() {
    console.log('📋 Mostrando datos de ejemplo para citas...');
    
    const sampleData = [
        {
            _id: 'sample1',
            tipo: 'consulta-general',
            fecha: new Date(),
            hora: '10:00',
            estado: 'confirmada',
            nombreContacto: 'Cliente de Ejemplo',
            correoContacto: 'cliente@ejemplo.com',
            notas: 'Cita de ejemplo para demostración'
        }
    ];
    
    appointmentsData = sampleData;
    filteredAppointmentsData = [...appointmentsData];
    
    // Renderizar vista con datos de ejemplo
    if (currentViewMode === 'calendar') {
        renderCalendarView();
    } else {
        renderAppointmentsList();
    }
    
    // Mostrar notificación
    showToast('Mostrando datos de ejemplo - Conecte con la API para datos reales', 'info');
}

/**
 * Refresca todos los datos del módulo
 */
async function refreshAppointmentsData() {
    console.log('🔄 Refrescando datos de citas...');
    
    showToast('Actualizando datos...', 'info');
    
    try {
        // Cargar todos los datos en paralelo
        await Promise.all([
            loadAppointmentsData(),
            loadClientsForAppointments(),
            loadProjectsForAppointments()
        ]);
        
        showToast('Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al refrescar datos:', error);
        showToast('Error al actualizar datos', 'error');
    }
}

/**
 * Actualizar estadísticas de citas en el dashboard principal
 */
function updateAppointmentsStatistics() {
    const totalCitas = appointmentsData.length;
    const citasPendientes = appointmentsData.filter(appointment => 
        appointment.estado === 'pendiente' || appointment.estado === 'confirmada'
    ).length;
    
    const citasHoy = appointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        const today = new Date();
        const appointmentDate = new Date(appointment.fecha);
        return appointmentDate.toDateString() === today.toDateString();
    }).length;
    
    const citasEsteMes = appointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        const appointmentDate = new Date(appointment.fecha);
        const now = new Date();
        return appointmentDate.getMonth() === now.getMonth() && 
               appointmentDate.getFullYear() === now.getFullYear();
    }).length;
    
    // Actualizar elementos en el dashboard principal si existen
    const appointmentsCountElement = document.getElementById('appointments-count');
    if (appointmentsCountElement) {
        appointmentsCountElement.textContent = citasPendientes;
    }
    
    // Actualizar descripción
    const appointmentsDescription = document.querySelector('.appointments-icon')?.closest('.stat-card')?.querySelector('.stat-description');
    if (appointmentsDescription) {
        appointmentsDescription.textContent = `${citasEsteMes} este mes`;
    }
    
    console.log('📊 Estadísticas de citas actualizadas:', {
        total: totalCitas,
        pendientes: citasPendientes,
        hoy: citasHoy,
        esteMes: citasEsteMes
    });
    
    // Crear evento personalizado para notificar cambios en estadísticas
    const statsEvent = new CustomEvent('appointmentStatsUpdated', {
        detail: {
            total: totalCitas,
            pending: citasPendientes,
            today: citasHoy,
            thisMonth: citasEsteMes
        }
    });
    
    document.dispatchEvent(statsEvent);
}

/**
 * Obtener citas de un rango de fechas específico
 */
function getAppointmentsByDateRange(startDate, endDate) {
    return appointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        
        const appointmentDate = new Date(appointment.fecha);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Ajustar las horas para comparación completa del día
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        appointmentDate.setHours(0, 0, 0, 0);
        
        return appointmentDate >= start && appointmentDate <= end;
    });
}

/**
 * Obtener citas de un día específico
 */
function getAppointmentsByDate(date) {
    const targetDate = new Date(date);
    
    return appointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        
        const appointmentDate = new Date(appointment.fecha);
        return appointmentDate.toDateString() === targetDate.toDateString();
    });
}

/**
 * Verificar disponibilidad de horario
 */
function isTimeSlotAvailable(date, time, excludeAppointmentId = null) {
    const targetDate = new Date(date);
    
    const conflictingAppointments = appointmentsData.filter(appointment => {
        if (excludeAppointmentId && appointment._id === excludeAppointmentId) {
            return false; // Excluir la cita que se está editando
        }
        
        if (!appointment.fecha || appointment.estado === 'cancelada') {
            return false;
        }
        
        const appointmentDate = new Date(appointment.fecha);
        return appointmentDate.toDateString() === targetDate.toDateString() && 
               appointment.hora === time;
    });
    
    return conflictingAppointments.length === 0;
}

console.log('📅 Módulo de citas - Parte 2 cargada: Carga de datos desde API');


/**
 * Módulo de Citas - Parte 3: Modal de crear/editar cita
 */

/**
 * Crea el modal para agregar/editar cita
 */
function createAppointmentModal(appointmentData = null) {
    console.log('🎯 Creando modal de cita...');
    console.log('Es edición:', !!appointmentData);
    console.log('Clientes disponibles:', clientsOptionsForAppointments.length);
    
    const isEditing = appointmentData !== null;
    const modalTitle = isEditing ? 'Editar Cita' : 'Agendar Nueva Cita';
    const submitButtonText = isEditing ? 'Guardar Cambios' : 'Agendar Cita';
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('appointment-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Verificar clientes disponibles
    if (clientsOptionsForAppointments.length === 0) {
        console.warn('⚠️ No hay clientes disponibles');
        showToast('No hay clientes disponibles. Crea un cliente primero.', 'warning');
        return;
    }
    
    // Generar opciones de clientes
    let clientOptionsHTML = '<option value="">Seleccionar cliente</option>';
    clientsOptionsForAppointments.forEach(client => {
        const isSelected = appointmentData?.usuario === client._id ? 'selected' : '';
        const empresaText = client.empresa ? ` - ${client.empresa}` : ' - Sin empresa';
        
        clientOptionsHTML += `<option value="${client._id}" ${isSelected}>
            ${client.nombre} ${client.apellidos}${empresaText}
        </option>`;
    });
    
    // Generar opciones de horarios
    let timeOptionsHTML = '<option value="">Seleccionar hora</option>';
    AVAILABLE_TIMES.forEach(time => {
        const isSelected = appointmentData?.hora === time ? 'selected' : '';
        const timeFormatted = formatTime(time);
        
        timeOptionsHTML += `<option value="${time}" ${isSelected}>${timeFormatted}</option>`;
    });
    
    // Fecha por defecto (hoy o la fecha de la cita si es edición)
    const defaultDate = appointmentData?.fecha 
        ? formatDateForInput(appointmentData.fecha)
        : formatDateForInput(new Date());
    
    const modalHTML = `
        <div class="modal active" id="appointment-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2>${modalTitle}</h2>
                    <button class="close-btn" id="close-appointment-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="appointment-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="appointment-client">Cliente *</label>
                                <select id="appointment-client" name="usuario" required>
                                    ${clientOptionsHTML}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="appointment-type">Tipo de Cita *</label>
                                <select id="appointment-type" name="tipo" required>
                                    <option value="">Seleccionar tipo</option>
                                    <option value="consulta-general" ${appointmentData?.tipo === 'consulta-general' ? 'selected' : ''}>Consulta General</option>
                                    <option value="plan-personalizado" ${appointmentData?.tipo === 'plan-personalizado' ? 'selected' : ''}>Plan Personalizado</option>
                                    <option value="seguimiento-proyecto" ${appointmentData?.tipo === 'seguimiento-proyecto' ? 'selected' : ''}>Seguimiento de Proyecto</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group" id="project-select-container" style="display: none;">
                            <label for="appointment-project">Proyecto (requerido para seguimiento) *</label>
                            <select id="appointment-project" name="proyecto">
                                <option value="">Seleccionar proyecto</option>
                                <!-- Opciones se cargarán dinámicamente -->
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="appointment-date">Fecha *</label>
                                <input type="date" id="appointment-date" name="fecha" value="${defaultDate}" required min="${formatDateForInput(new Date())}">
                            </div>
                            <div class="form-group">
                                <label for="appointment-time">Hora *</label>
                                <select id="appointment-time" name="hora" required>
                                    ${timeOptionsHTML}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="appointment-status">Estado *</label>
                                <select id="appointment-status" name="estado" required>
                                    <option value="pendiente" ${appointmentData?.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                    <option value="confirmada" ${appointmentData?.estado === 'confirmada' ? 'selected' : ''}>Confirmada</option>
                                    <option value="cancelada" ${appointmentData?.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                                    <option value="completada" ${appointmentData?.estado === 'completada' ? 'selected' : ''}>Completada</option>
                                </select>
                            </div>
                            <div class="form-group checkbox-group">
                                <label class="checkbox-container">
                                    <input type="checkbox" id="send-notification" name="enviarNotificacion" ${!isEditing ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Enviar notificación al cliente
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointment-notes">Notas (opcional)</label>
                            <textarea id="appointment-notes" name="notas" rows="4" placeholder="Notas adicionales sobre la cita...">${appointmentData?.notas || ''}</textarea>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 20px;">
                            <button type="button" class="secondary-btn" id="cancel-appointment-btn">Cancelar</button>
                            <button type="submit" class="primary-btn" id="save-appointment-btn">${submitButtonText}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Insertar el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos del modal después de que esté en el DOM
    setTimeout(() => {
        setupAppointmentModalEvents(isEditing, appointmentData);
    }, 100);
}

/**
 * Configura los eventos del modal de cita
 */
function setupAppointmentModalEvents(isEditing, appointmentData) {
    console.log('🔧 Configurando eventos del modal de cita...');
    
    const modal = document.getElementById('appointment-modal');
    const closeBtn = document.getElementById('close-appointment-modal');
    const cancelBtn = document.getElementById('cancel-appointment-btn');
    const form = document.getElementById('appointment-form');
    const typeSelect = document.getElementById('appointment-type');
    const clientSelect = document.getElementById('appointment-client');
    const projectContainer = document.getElementById('project-select-container');
    const projectSelect = document.getElementById('appointment-project');
    const dateInput = document.getElementById('appointment-date');
    const timeSelect = document.getElementById('appointment-time');
    
    if (!modal || !form) {
        console.error('❌ Modal o formulario no encontrado');
        return;
    }
    
    // Función para cerrar modal
    function closeModal() {
        console.log('Cerrando modal de cita...');
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal && modal.parentNode) {
                modal.remove();
            }
            document.body.style.overflow = 'auto';
        }, 300);
    }
    
    // Eventos de cierre
    if (closeBtn) {
        console.log('Close modal de cita...');
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    if (cancelBtn) {
        console.log('Cancel modal de cita...');
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Manejar cambio de tipo de cita
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            console.log('Tipo de cita seleccionado:', selectedType);
            
            if (selectedType === 'seguimiento-proyecto') {
                projectContainer.style.display = 'block';
                projectSelect.required = true;
                loadProjectsForClient(clientSelect.value);
            } else {
                projectContainer.style.display = 'none';
                projectSelect.required = false;
                projectSelect.innerHTML = '<option value="">Seleccionar proyecto</option>';
            }
        });
        
        // Trigger inicial si es edición
        if (isEditing && appointmentData?.tipo === 'seguimiento-proyecto') {
            projectContainer.style.display = 'block';
            projectSelect.required = true;
            loadProjectsForClient(appointmentData.usuario);
        }
    }
    
    // Manejar cambio de cliente
    if (clientSelect) {
        clientSelect.addEventListener('change', function() {
            const selectedClient = this.value;
            console.log('Cliente seleccionado:', selectedClient);
            
            // Si el tipo es seguimiento de proyecto, cargar proyectos del cliente
            if (typeSelect.value === 'seguimiento-proyecto' && selectedClient) {
                loadProjectsForClient(selectedClient);
            }
        });
    }
    
    // Validar disponibilidad de horario al cambiar fecha/hora
    function validateTimeSlot() {
        const date = dateInput.value;
        const time = timeSelect.value;
        
        if (date && time) {
            const isAvailable = isTimeSlotAvailable(date, time, isEditing ? appointmentData._id : null);
            
            if (!isAvailable) {
                timeSelect.setCustomValidity('Este horario ya está ocupado');
                timeSelect.reportValidity();
                return false;
            } else {
                timeSelect.setCustomValidity('');
                return true;
            }
        }
        return true;
    }
    
    if (dateInput) {
        dateInput.addEventListener('change', validateTimeSlot);
    }
    
    if (timeSelect) {
        timeSelect.addEventListener('change', validateTimeSlot);
    }
    
    // Envío del formulario
    form.addEventListener('submit', function(e) {
        console.log('📝 Submit del formulario de cita detectado');
        e.preventDefault();
        
        // Validar horario antes de enviar
        if (!validateTimeSlot()) {
            console.log('❌ Horario no disponible');
            return;
        }
        
        if (isEditing) {
            handleAppointmentUpdate(e, appointmentData);
        } else {
            handleAppointmentCreate(e);
        }
    });
    
    console.log('✅ Eventos del modal de cita configurados');
}

/**
 * Carga los proyectos de un cliente específico en el selector
 */
async function loadProjectsForClient(clientId) {
    console.log('📋 Cargando proyectos para cliente:', clientId);
    
    const projectSelect = document.getElementById('appointment-project');
    if (!projectSelect || !clientId) return;
    
    // Limpiar opciones actuales
    projectSelect.innerHTML = '<option value="">Cargando proyectos...</option>';
    
    try {
        const clientProjects = await loadClientProjects(clientId);
        
        // Generar nuevas opciones
        let projectOptionsHTML = '<option value="">Seleccionar proyecto</option>';
        
        clientProjects.forEach(project => {
            projectOptionsHTML += `<option value="${project._id}">
                ${project.nombre} (${project.estado})
            </option>`;
        });
        
        projectSelect.innerHTML = projectOptionsHTML;
        
        console.log(`✅ ${clientProjects.length} proyectos cargados para el cliente`);
        
    } catch (error) {
        console.error('❌ Error al cargar proyectos del cliente:', error);
        projectSelect.innerHTML = '<option value="">Error al cargar proyectos</option>';
    }
}

/**
 * Funciones auxiliares para formateo
 */
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
}

function formatDateForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

console.log('📅 Módulo de citas - Parte 3 cargada: Modal de crear/editar cita');

/**
 * Módulo de Citas - Parte 4: Crear y actualizar citas (API)
 */

/**
 * Maneja la creación de una nueva cita
 */
async function handleAppointmentCreate(e) {
    console.log('📝 Iniciando creación de cita...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-appointment-btn');
    
    if (!submitBtn) {
        console.error('❌ Botón de envío no encontrado');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        
        // Recopilar datos del formulario
        const appointmentData = {
            usuario: document.getElementById('appointment-client')?.value || '',
            tipo: document.getElementById('appointment-type')?.value || '',
            fecha: document.getElementById('appointment-date')?.value || '',
            hora: document.getElementById('appointment-time')?.value || '',
            estado: document.getElementById('appointment-status')?.value || 'pendiente',
            notas: document.getElementById('appointment-notes')?.value?.trim() || ''
        };
        
        // Agregar proyecto si es necesario
        const projectSelect = document.getElementById('appointment-project');
        if (projectSelect && projectSelect.style.display !== 'none' && projectSelect.value) {
            appointmentData.proyecto = projectSelect.value;
        }
        
        console.log('📊 Datos a enviar:', appointmentData);
        
        // Validaciones
        const errors = [];
        if (!appointmentData.usuario) errors.push('Cliente es requerido');
        if (!appointmentData.tipo) errors.push('Tipo de cita es requerido');
        if (!appointmentData.fecha) errors.push('Fecha es requerida');
        if (!appointmentData.hora) errors.push('Hora es requerida');
        
        // Validación especial para seguimiento de proyecto
        if (appointmentData.tipo === 'seguimiento-proyecto' && !appointmentData.proyecto) {
            errors.push('Proyecto es requerido para citas de seguimiento');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        
        // Validar que la fecha no sea en el pasado
        const appointmentDate = new Date(appointmentData.fecha);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
            throw new Error('No se pueden agendar citas en fechas pasadas');
        }
        
        // Validar disponibilidad del horario
        if (!isTimeSlotAvailable(appointmentData.fecha, appointmentData.hora)) {
            throw new Error('El horario seleccionado ya está ocupado');
        }
        
        // Enviar al servidor
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(appointmentData)
        });
        
        console.log('📡 Respuesta del servidor:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('✅ Cita creada exitosamente:', responseData);
        
        // Mostrar mensaje de éxito
        showToast('Cita creada correctamente', 'success');
        
        // Recargar datos
        await loadAppointmentsData();
        
        // Cerrar modal
        closeAppointmentModal();
        
    } catch (error) {
        console.error('❌ Error al crear cita:', error);
        showToast(error.message || 'Error al crear cita', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Maneja la actualización de una cita existente
 */
async function handleAppointmentUpdate(e, appointmentData) {
    console.log('📝 Iniciando actualización de cita...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-appointment-btn');
    
    if (!submitBtn) {
        console.error('❌ Botón de envío no encontrado');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        
        // Recopilar datos del formulario
        const updatedData = {
            usuario: document.getElementById('appointment-client')?.value || '',
            tipo: document.getElementById('appointment-type')?.value || '',
            fecha: document.getElementById('appointment-date')?.value || '',
            hora: document.getElementById('appointment-time')?.value || '',
            estado: document.getElementById('appointment-status')?.value || 'pendiente',
            notas: document.getElementById('appointment-notes')?.value?.trim() || ''
        };
        
        // Agregar proyecto si es necesario
        const projectSelect = document.getElementById('appointment-project');
        if (projectSelect && projectSelect.style.display !== 'none') {
            updatedData.proyecto = projectSelect.value || null;
        }
        
        console.log('📊 Datos de actualización:', updatedData);
        
        // Validaciones
        const errors = [];
        if (!updatedData.usuario) errors.push('Cliente es requerido');
        if (!updatedData.tipo) errors.push('Tipo de cita es requerido');
        if (!updatedData.fecha) errors.push('Fecha es requerida');
        if (!updatedData.hora) errors.push('Hora es requerida');
        
        // Validación especial para seguimiento de proyecto
        if (updatedData.tipo === 'seguimiento-proyecto' && !updatedData.proyecto) {
            errors.push('Proyecto es requerido para citas de seguimiento');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        
        // Validar disponibilidad del horario (excluyendo la cita actual)
        if (!isTimeSlotAvailable(updatedData.fecha, updatedData.hora, appointmentData._id)) {
            throw new Error('El horario seleccionado ya está ocupado');
        }
        
        // Enviar al servidor
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/appointments/${appointmentData._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
        
        console.log('📡 Respuesta de actualización:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('✅ Cita actualizada exitosamente:', responseData);
        
        // Mostrar mensaje de éxito
        showToast('Cita actualizada correctamente', 'success');
        
        // Recargar datos
        await loadAppointmentsData();
        
        // Cerrar modal
        closeAppointmentModal();
        
    } catch (error) {
        console.error('❌ Error al actualizar cita:', error);
        showToast(error.message || 'Error al actualizar cita', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Elimina una cita
 */
async function deleteAppointment(appointmentId) {
    console.log('🗑️ Eliminando cita:', appointmentId);
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar cita');
        }
        
        showToast('Cita eliminada correctamente', 'success');
        await loadAppointmentsData();
        
    } catch (error) {
        console.error('❌ Error al eliminar cita:', error);
        showToast(error.message || 'Error al eliminar cita', 'error');
    }
}

/**
 * Función auxiliar para cerrar el modal de cita
 */
function closeAppointmentModal() {
    const modal = document.getElementById('appointment-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal && modal.parentNode) {
                modal.remove();
            }
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

/**
 * Ver detalles de una cita
 */
function viewAppointment(appointmentId) {
    console.log('👁️ Viendo detalles de cita:', appointmentId);
    const appointment = appointmentsData.find(a => a._id === appointmentId);
    if (appointment) {
        showAppointmentDetailsModal(appointment);
    }
}

/**
 * Editar una cita
 */
function editAppointment(appointmentId) {
    console.log('✏️ Editando cita:', appointmentId);
    const appointment = appointmentsData.find(a => a._id === appointmentId);
    if (appointment) {
        createAppointmentModal(appointment);
    }
}

/**
 * Cambiar rápidamente el estado de una cita
 */
async function changeAppointmentStatus(appointmentId, newStatus) {
    console.log('🔄 Cambiando estado de cita:', appointmentId, 'a', newStatus);
    
    try {
        const appointment = appointmentsData.find(a => a._id === appointmentId);
        if (!appointment) {
            throw new Error('Cita no encontrada');
        }
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: newStatus })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cambiar estado');
        }
        
        showToast(`Estado cambiado a ${APPOINTMENT_STATUSES[newStatus]}`, 'success');
        await loadAppointmentsData();
        
    } catch (error) {
        console.error('❌ Error al cambiar estado:', error);
        showToast(error.message || 'Error al cambiar estado', 'error');
    }
}

/**
 * Confirmar una cita
 */
function confirmAppointment(appointmentId) {
    changeAppointmentStatus(appointmentId, 'confirmada');
}

/**
 * Cancelar una cita
 */
function cancelAppointment(appointmentId) {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
        changeAppointmentStatus(appointmentId, 'cancelada');
    }
}

/**
 * Marcar cita como completada
 */
function completeAppointment(appointmentId) {
    changeAppointmentStatus(appointmentId, 'completada');
}

/**
 * Reprogramar una cita (abre el modal de edición)
 */
function rescheduleAppointment(appointmentId) {
    console.log('📅 Reprogramando cita:', appointmentId);
    editAppointment(appointmentId);
}

console.log('📅 Módulo de citas - Parte 4 cargada: Crear y actualizar citas (API)');

/**
 * Módulo de Citas - Parte 5: Vista de calendario
 */

/**
 * Configura la vista de calendario
 */
function setupCalendarView() {
    console.log('📅 Configurando vista de calendario...');
    
    // Inicializar calendario con el mes actual
    renderCalendarView();
    
    // Configurar navegación del calendario
    setupCalendarNavigation();
    
    console.log('✅ Vista de calendario configurada');
}

/**
 * Renderiza la vista de calendario
 */
function renderCalendarView() {
    console.log('🎨 Renderizando vista de calendario...');
    
    const calendarTitle = document.getElementById('calendar-title');
    const calendarBody = document.getElementById('calendar-body');
    
    if (!calendarTitle || !calendarBody) {
        console.warn('⚠️ Elementos de calendario no encontrados');
        return;
    }
    
    // Actualizar título del mes
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    calendarTitle.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    // Generar días del calendario
    const calendarHTML = generateCalendarHTML();
    calendarBody.innerHTML = calendarHTML;
    
    console.log('✅ Calendario renderizado para:', calendarTitle.textContent);
}

/**
 * Genera el HTML del calendario
 */
function generateCalendarHTML() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Día de la semana en que empieza el mes (0 = domingo)
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // Días del mes anterior para completar la primera semana
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    let calendarHTML = '';
    let dayCount = 1;
    let nextMonthDayCount = 1;
    
    // Generar 6 filas (semanas)
    for (let week = 0; week < 6; week++) {
        calendarHTML += '<tr>';
        
        // Generar 7 días (columnas)
        for (let day = 0; day < 7; day++) {
            const cellNumber = week * 7 + day;
            
            if (cellNumber < startingDayOfWeek) {
                // Días del mes anterior
                const dayNum = daysInPrevMonth - startingDayOfWeek + cellNumber + 1;
                calendarHTML += `<td class="calendar-day other-month">${dayNum}</td>`;
                
            } else if (dayCount <= daysInMonth) {
                // Días del mes actual
                const currentDate = new Date(year, month, dayCount);
                const isToday = isDateToday(currentDate);
                const dayAppointments = getAppointmentsByDate(currentDate);
                
                let dayClass = 'calendar-day';
                if (isToday) dayClass += ' current-day';
                if (dayAppointments.length > 0) dayClass += ' has-appointments';
                
                calendarHTML += `<td class="${dayClass}" data-date="${formatDateForInput(currentDate)}">
                    <div class="day-number">${dayCount}</div>
                    ${generateDayAppointments(dayAppointments)}
                </td>`;
                
                dayCount++;
                
            } else {
                // Días del mes siguiente
                calendarHTML += `<td class="calendar-day other-month">${nextMonthDayCount}</td>`;
                nextMonthDayCount++;
            }
        }
        
        calendarHTML += '</tr>';
        
        // Si ya terminamos el mes y la siguiente fila estaría vacía, parar
        if (dayCount > daysInMonth && week >= 4) {
            break;
        }
    }
    
    return calendarHTML;
}

/**
 * Genera las citas para un día específico en el calendario
 */
function generateDayAppointments(appointments) {
    if (appointments.length === 0) return '';
    
    let appointmentsHTML = '<div class="day-appointments">';
    
    // Mostrar máximo 3 citas por día
    const maxVisible = 3;
    const visibleAppointments = appointments.slice(0, maxVisible);
    
    visibleAppointments.forEach(appointment => {
        const clientName = appointment.usuarioDetalles 
            ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
            : appointment.nombreContacto || 'Cliente';
        
        const appointmentColor = APPOINTMENT_COLORS[appointment.tipo] || '#007bff';
        const shortClientName = clientName.length > 12 ? clientName.substring(0, 12) + '...' : clientName;
        
        appointmentsHTML += `
            <div class="day-appointment" 
                 style="background-color: ${appointmentColor};" 
                 title="${appointment.hora} - ${clientName} (${APPOINTMENT_TYPES[appointment.tipo]})"
                 onclick="viewAppointment('${appointment._id}')">
                <span class="appointment-time">${appointment.hora}</span>
                <span class="appointment-client">${shortClientName}</span>
            </div>
        `;
    });
    
    // Si hay más citas, mostrar contador
    if (appointments.length > maxVisible) {
        const remaining = appointments.length - maxVisible;
        appointmentsHTML += `
            <div class="day-appointment more-appointments" onclick="showDayAppointments('${formatDateForInput(appointments[0].fecha)}')">
                +${remaining} más
            </div>
        `;
    }
    
    appointmentsHTML += '</div>';
    return appointmentsHTML;
}

/**
 * Configura la navegación del calendario
 */
function setupCalendarNavigation() {
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => navigateCalendar(-1));
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => navigateCalendar(1));
    }
    
    // Click en días del calendario
    document.addEventListener('click', function(e) {
        const calendarDay = e.target.closest('.calendar-day:not(.other-month)');
        if (calendarDay) {
            const date = calendarDay.getAttribute('data-date');
            if (date) {
                handleCalendarDayClick(date);
            }
        }
    });
}

/**
 * Navega el calendario (meses)
 */
function navigateCalendar(direction) {
    console.log('🗓️ Navegando calendario:', direction > 0 ? 'siguiente' : 'anterior');
    
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendarView();
}

/**
 * Maneja el click en un día del calendario
 */
function handleCalendarDayClick(dateString) {
    console.log('📅 Click en día del calendario:', dateString);
    
    const selectedDate = new Date(dateString);
    const dayAppointments = getAppointmentsByDate(selectedDate);
    
    if (dayAppointments.length > 0) {
        // Si hay citas, mostrar detalles del día
        showDayAppointmentsModal(dateString, dayAppointments);
    } else {
        // Si no hay citas, ofrecer crear una nueva
        if (confirm(`¿Deseas crear una nueva cita para el ${formatDateForDisplay(selectedDate)}?`)) {
            openCreateAppointmentModalForDate(dateString);
        }
    }
}

/**
 * Abre el modal de crear cita con una fecha pre-seleccionada
 */
function openCreateAppointmentModalForDate(dateString) {
    console.log('📝 Creando cita para fecha:', dateString);
    
    // Verificar clientes disponibles
    if (clientsOptionsForAppointments.length === 0) {
        loadClientsForAppointments().then(() => {
            if (clientsOptionsForAppointments.length === 0) {
                showToast('No hay clientes disponibles. Crea un cliente primero.', 'warning');
                return;
            }
            createAppointmentModalWithDate(dateString);
        });
    } else {
        createAppointmentModalWithDate(dateString);
    }
}

/**
 * Crea el modal de cita con fecha pre-seleccionada
 */
function createAppointmentModalWithDate(dateString) {
    // Crear modal normal pero con fecha pre-establecida
    createAppointmentModal();
    
    // Esperar a que el modal se cree y luego establecer la fecha
    setTimeout(() => {
        const dateInput = document.getElementById('appointment-date');
        if (dateInput) {
            dateInput.value = dateString;
        }
    }, 150);
}

/**
 * Muestra las citas de un día específico
 */
function showDayAppointments(dateString) {
    console.log('📋 Mostrando citas del día:', dateString);
    
    const dayAppointments = getAppointmentsByDate(new Date(dateString));
    showDayAppointmentsModal(dateString, dayAppointments);
}

/**
 * Muestra modal con las citas de un día específico
 */
function showDayAppointmentsModal(dateString, appointments) {
    const date = new Date(dateString);
    const formattedDate = formatDateForDisplay(date);
    
    const modalHTML = `
        <div class="modal active" id="day-appointments-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Citas del ${formattedDate}</h2>
                    <button class="close-btn" id="close-day-appointments-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="day-appointments-list">
                        ${appointments.map(appointment => {
                            const clientName = appointment.usuarioDetalles 
                                ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
                                : appointment.nombreContacto || 'Cliente no registrado';
                            
                            const statusClass = appointment.estado.toLowerCase().replace(' ', '-');
                            
                            return `
                                <div class="appointment-item">
                                    <div class="appointment-time">
                                        <i class="far fa-clock"></i>
                                        ${appointment.hora}
                                    </div>
                                    <div class="appointment-details">
                                        <h4>${clientName}</h4>
                                        <p class="appointment-type">${APPOINTMENT_TYPES[appointment.tipo]}</p>
                                        ${appointment.notas ? `<p class="appointment-notes">${appointment.notas}</p>` : ''}
                                    </div>
                                    <div class="appointment-status">
                                        <span class="status-badge ${statusClass}">${APPOINTMENT_STATUSES[appointment.estado]}</span>
                                    </div>
                                    <div class="appointment-actions">
                                        <button class="action-btn view-btn" onclick="viewAppointment('${appointment._id}')" title="Ver detalles">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="action-btn edit-btn" onclick="editAppointment('${appointment._id}')" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        ${appointment.estado === 'pendiente' ? `
                                            <button class="action-btn confirm-btn" onclick="confirmAppointment('${appointment._id}')" title="Confirmar">
                                                <i class="fas fa-check"></i>
                                            </button>
                                        ` : ''}
                                        ${appointment.estado !== 'cancelada' ? `
                                            <button class="action-btn delete-btn" onclick="cancelAppointment('${appointment._id}')" title="Cancelar">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="button" class="secondary-btn" onclick="openCreateAppointmentModalForDate('${dateString}')">
                            <i class="fas fa-plus"></i> Nueva Cita
                        </button>
                        <button type="button" class="primary-btn" id="close-day-modal-btn">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos
    setTimeout(() => {
        const modal = document.getElementById('day-appointments-modal');
        const closeBtn = document.getElementById('close-day-appointments-modal');
        const closeDayBtn = document.getElementById('close-day-modal-btn');
        
        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeDayBtn) closeDayBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }, 100);
}

/**
 * Funciones auxiliares
 */
function isDateToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function formatDateForDisplay(date) {
    return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

console.log('📅 Módulo de citas - Parte 5 cargada: Vista de calendario');

/**
 * Módulo de Citas - Parte 6: Vista de lista y filtros
 */

/**
 * Configura la vista de lista
 */
function setupListView() {
    console.log('📋 Configurando vista de lista...');
    
    // Renderizar tabla inicial
    renderAppointmentsList();
    
    console.log('✅ Vista de lista configurada');
}

/**
 * Renderiza la tabla de citas
 */
function renderAppointmentsList() {
    console.log('🎨 Renderizando lista de citas...');
    
    const tableBody = document.querySelector('#appointments-table tbody');
    if (!tableBody) {
        console.warn('⚠️ Tabla de citas no encontrada');
        return;
    }
    
    if (filteredAppointmentsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <i class="far fa-calendar-alt" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    No se encontraron citas
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = filteredAppointmentsData.map(appointment => {
        const clientName = appointment.usuarioDetalles 
            ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
            : appointment.nombreContacto || 'Cliente no registrado';
        
        const clientContact = appointment.usuarioDetalles?.correo 
            || appointment.correoContacto 
            || 'No disponible';
        
        const projectName = appointment.proyectoDetalles?.nombre || 'N/A';
        
        const appointmentDate = appointment.fecha 
            ? new Date(appointment.fecha).toLocaleDateString('es-ES')
            : 'N/A';
        
        const statusClass = appointment.estado.toLowerCase().replace(' ', '-');
        const typeClass = appointment.tipo.toLowerCase().replace('-', '');
        
        return `
            <tr class="appointment-row" data-appointment-id="${appointment._id}">
                <td>
                    <div class="client-info">
                        <div class="client-name">${clientName}</div>
                        <div class="client-contact">${clientContact}</div>
                    </div>
                </td>
                <td>
                    <span class="appointment-type-badge ${typeClass}">
                        ${APPOINTMENT_TYPES[appointment.tipo]}
                    </span>
                </td>
                <td>${appointmentDate}</td>
                <td class="appointment-time">
                    <i class="far fa-clock"></i>
                    ${appointment.hora}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${APPOINTMENT_STATUSES[appointment.estado]}
                    </span>
                </td>
                <td>
                    ${appointment.tipo === 'seguimiento-proyecto' ? projectName : 'N/A'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="Ver detalles" onclick="viewAppointment('${appointment._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Editar" onclick="editAppointment('${appointment._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${appointment.estado === 'pendiente' ? `
                            <button class="action-btn confirm-btn" title="Confirmar" onclick="confirmAppointment('${appointment._id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${appointment.estado === 'confirmada' ? `
                            <button class="action-btn complete-btn" title="Marcar como completada" onclick="completeAppointment('${appointment._id}')">
                                <i class="fas fa-check-double"></i>
                            </button>
                        ` : ''}
                        ${appointment.estado !== 'cancelada' && appointment.estado !== 'completada' ? `
                            <button class="action-btn cancel-btn" title="Cancelar" onclick="cancelAppointment('${appointment._id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn delete-btn" title="Eliminar" onclick="deleteAppointment('${appointment._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
    
    console.log(`✅ ${filteredAppointmentsData.length} citas renderizadas en la tabla`);
}

/**
 * Configura los filtros de citas
 */
function setupAppointmentsFilters() {
    console.log('🔧 Configurando filtros de citas...');
    
    const filterType = document.getElementById('appointment-filter-type');
    const filterStatus = document.getElementById('appointment-filter-status');
    const filterDate = document.getElementById('appointment-date-filter');
    
    if (filterType) {
        filterType.addEventListener('change', applyAppointmentsFilters);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', applyAppointmentsFilters);
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', applyAppointmentsFilters);
    }
    
    console.log('✅ Filtros de citas configurados');
}

/**
 * Aplica los filtros a los datos de citas
 */
function applyAppointmentsFilters() {
    console.log('🔍 Aplicando filtros de citas...');
    
    const filterType = document.getElementById('appointment-filter-type')?.value || 'all';
    const filterStatus = document.getElementById('appointment-filter-status')?.value || 'all';
    const filterDate = document.getElementById('appointment-date-filter')?.value || '';
    const searchTerm = document.getElementById('appointment-search')?.value?.toLowerCase() || '';
    
    filteredAppointmentsData = appointmentsData.filter(appointment => {
        // Filtro por tipo
        let typeMatch = filterType === 'all' || appointment.tipo === filterType;
        
        // Filtro por estado
        let statusMatch = filterStatus === 'all' || appointment.estado === filterStatus;
        
        // Filtro por fecha específica
        let dateMatch = true;
        if (filterDate && appointment.fecha) {
            const appointmentDate = new Date(appointment.fecha);
            const selectedDate = new Date(filterDate);
            dateMatch = appointmentDate.toDateString() === selectedDate.toDateString();
        }
        
        // Filtro por búsqueda
        let searchMatch = true;
        if (searchTerm) {
            const clientName = appointment.usuarioDetalles 
                ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
                : appointment.nombreContacto || '';
            
            const clientEmail = appointment.usuarioDetalles?.correo 
                || appointment.correoContacto || '';
            
            const projectName = appointment.proyectoDetalles?.nombre || '';
            
            searchMatch = (
                clientName.toLowerCase().includes(searchTerm) ||
                clientEmail.toLowerCase().includes(searchTerm) ||
                projectName.toLowerCase().includes(searchTerm) ||
                appointment.notas?.toLowerCase().includes(searchTerm) ||
                APPOINTMENT_TYPES[appointment.tipo]?.toLowerCase().includes(searchTerm) ||
                APPOINTMENT_STATUSES[appointment.estado]?.toLowerCase().includes(searchTerm)
            );
        }
        
        return typeMatch && statusMatch && dateMatch && searchMatch;
    });
    
    console.log(`🎯 Filtros aplicados: ${filteredAppointmentsData.length} de ${appointmentsData.length} citas`);
    
    // Renderizar vista actual
    if (currentViewMode === 'list') {
        renderAppointmentsList();
    } else {
        renderCalendarView();
    }
}

/**
 * Búsqueda de citas
 */
function searchAppointments() {
    console.log('🔍 Realizando búsqueda de citas...');
    applyAppointmentsFilters();
}

/**
 * Configurar paginación de citas
 */
function setupAppointmentsPagination() {
    console.log('📄 Configurando paginación de citas...');
    // Implementar lógica de paginación si es necesario
    console.log('✅ Paginación de citas configurada');
}

/**
 * Filtros rápidos para citas
 */
function showTodayAppointments() {
    console.log('📅 Mostrando citas de hoy...');
    
    const today = new Date();
    const dateInput = document.getElementById('appointment-date-filter');
    
    if (dateInput) {
        dateInput.value = formatDateForInput(today);
        applyAppointmentsFilters();
    }
    
    // Cambiar a vista de lista si estamos en calendario
    if (currentViewMode === 'calendar') {
        switchAppointmentView('list');
    }
}

function showThisWeekAppointments() {
    console.log('📅 Mostrando citas de esta semana...');
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 6);
    
    filteredAppointmentsData = appointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        
        const appointmentDate = new Date(appointment.fecha);
        return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
    });
    
    renderAppointmentsList();
    
    // Cambiar a vista de lista
    if (currentViewMode === 'calendar') {
        switchAppointmentView('list');
    }
    
    showToast(`Mostrando ${filteredAppointmentsData.length} citas de esta semana`, 'info');
}

function showPendingAppointments() {
    console.log('⏳ Mostrando citas pendientes...');
    
    const statusFilter = document.getElementById('appointment-filter-status');
    if (statusFilter) {
        statusFilter.value = 'pendiente';
        applyAppointmentsFilters();
    }
    
    // Cambiar a vista de lista
    if (currentViewMode === 'calendar') {
        switchAppointmentView('list');
    }
}

function clearAppointmentsFilters() {
    console.log('🧹 Limpiando filtros de citas...');
    
    // Limpiar todos los filtros
    const filterType = document.getElementById('appointment-filter-type');
    const filterStatus = document.getElementById('appointment-filter-status');
    const filterDate = document.getElementById('appointment-date-filter');
    const searchInput = document.getElementById('appointment-search');
    
    if (filterType) filterType.value = 'all';
    if (filterStatus) filterStatus.value = 'all';
    if (filterDate) filterDate.value = '';
    if (searchInput) searchInput.value = '';
    
    // Restaurar datos originales
    filteredAppointmentsData = [...appointmentsData];
    
    // Renderizar vista actual
    if (currentViewMode === 'list') {
        renderAppointmentsList();
    } else {
        renderCalendarView();
    }
    
    showToast('Filtros limpiados', 'success');
}

/**
 * Exportar citas filtradas
 */
function exportAppointmentsData(format = 'csv') {
    console.log(`📤 Exportando citas en formato ${format}...`);
    
    if (filteredAppointmentsData.length === 0) {
        showToast('No hay datos para exportar', 'warning');
        return;
    }
    
    try {
        let content = '';
        let filename = '';
        let mimeType = '';
        
        if (format === 'csv') {
            // Crear CSV
            const headers = ['Fecha', 'Hora', 'Cliente', 'Tipo', 'Estado', 'Proyecto', 'Notas'];
            const csvContent = [
                headers.join(','),
                ...filteredAppointmentsData.map(appointment => {
                    const clientName = appointment.usuarioDetalles 
                        ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
                        : appointment.nombreContacto || 'N/A';
                    
                    const projectName = appointment.proyectoDetalles?.nombre || 'N/A';
                    const appointmentDate = appointment.fecha 
                        ? new Date(appointment.fecha).toLocaleDateString('es-ES')
                        : 'N/A';
                    
                    return [
                        `"${appointmentDate}"`,
                        `"${appointment.hora || 'N/A'}"`,
                        `"${clientName}"`,
                        `"${APPOINTMENT_TYPES[appointment.tipo] || appointment.tipo}"`,
                        `"${APPOINTMENT_STATUSES[appointment.estado] || appointment.estado}"`,
                        `"${projectName}"`,
                        `"${appointment.notas || ''}"`
                    ].join(',');
                })
            ].join('\n');
            
            content = csvContent;
            filename = `citas_${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv;charset=utf-8;';
            
        } else if (format === 'json') {
            // Crear JSON
            content = JSON.stringify(filteredAppointmentsData, null, 2);
            filename = `citas_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json;charset=utf-8;';
        }
        
        // Crear y descargar archivo
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(`Datos exportados como ${filename}`, 'success');
        
    } catch (error) {
        console.error('❌ Error al exportar datos:', error);
        showToast('Error al exportar datos', 'error');
    }
}

/**
 * Obtener estadísticas de citas
 */
function getAppointmentsStats() {
    const stats = {
        total: appointmentsData.length,
        pendientes: appointmentsData.filter(a => a.estado === 'pendiente').length,
        confirmadas: appointmentsData.filter(a => a.estado === 'confirmada').length,
        completadas: appointmentsData.filter(a => a.estado === 'completada').length,
        canceladas: appointmentsData.filter(a => a.estado === 'cancelada').length,
        hoy: appointmentsData.filter(a => {
            if (!a.fecha) return false;
            const today = new Date();
            const appointmentDate = new Date(a.fecha);
            return appointmentDate.toDateString() === today.toDateString();
        }).length,
        estaSemana: appointmentsData.filter(a => {
            if (!a.fecha) return false;
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() - today.getDay() + 6);
            
            const appointmentDate = new Date(a.fecha);
            return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
        }).length,
        porTipo: {
            'consulta-general': appointmentsData.filter(a => a.tipo === 'consulta-general').length,
            'plan-personalizado': appointmentsData.filter(a => a.tipo === 'plan-personalizado').length,
            'seguimiento-proyecto': appointmentsData.filter(a => a.tipo === 'seguimiento-proyecto').length
        }
    };
    
    return stats;
}

/**
 * Mostrar estadísticas de citas
 */
function showAppointmentsStats() {
    const stats = getAppointmentsStats();
    
    console.log('📊 Estadísticas de citas:', stats);
    
    const statsMessage = `
        📊 Estadísticas de Citas:
        • Total: ${stats.total}
        • Pendientes: ${stats.pendientes}
        • Confirmadas: ${stats.confirmadas}
        • Completadas: ${stats.completadas}
        • Hoy: ${stats.hoy}
        • Esta semana: ${stats.estaSemana}
    `;
    
    showToast(statsMessage, 'info');
}

// Funciones de utilidad adicionales
function refreshCurrentView() {
    if (currentViewMode === 'calendar') {
        renderCalendarView();
    } else {
        renderAppointmentsList();
    }
}

// Exponer funciones globalmente
window.showTodayAppointments = showTodayAppointments;
window.showThisWeekAppointments = showThisWeekAppointments;
window.showPendingAppointments = showPendingAppointments;
window.clearAppointmentsFilters = clearAppointmentsFilters;
window.exportAppointmentsData = exportAppointmentsData;
window.showAppointmentsStats = showAppointmentsStats;

console.log('📅 Módulo de citas - Parte 6 cargada: Vista de lista y filtros');

/**
 * Módulo de Citas - Parte 7: Modal de detalles y funciones finales
 */

/**
 * Muestra modal con detalles completos de una cita
 */
function showAppointmentDetailsModal(appointment) {
    console.log('👁️ Mostrando detalles de cita:', appointment._id);
    
    const clientName = appointment.usuarioDetalles 
        ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
        : appointment.nombreContacto || 'Cliente no registrado';
    
    const clientEmail = appointment.usuarioDetalles?.correo 
        || appointment.correoContacto || 'No disponible';
    
    const clientPhone = appointment.usuarioDetalles?.telefono 
        || appointment.telefonoContacto || 'No disponible';
    
    const clientCompany = appointment.usuarioDetalles?.empresa || 'No especificada';
    
    const projectInfo = appointment.proyectoDetalles 
        ? `${appointment.proyectoDetalles.nombre} (${appointment.proyectoDetalles.estado})`
        : 'No asignado';
    
    const appointmentDate = appointment.fecha 
        ? new Date(appointment.fecha).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
        : 'Fecha no disponible';
    
    const creationDate = appointment.fechaCreacion 
        ? new Date(appointment.fechaCreacion).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'No disponible';
    
    const modalHTML = `
        <div class="modal active" id="appointment-details-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2>Detalles de la Cita</h2>
                    <button class="close-btn" id="close-appointment-details-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="appointment-details">
                        <div class="appointment-header-details">
                            <div class="appointment-icon">
                                <i class="far fa-calendar-alt"></i>
                            </div>
                            <div class="appointment-info">
                                <h3>${APPOINTMENT_TYPES[appointment.tipo]}</h3>
                                <div class="appointment-meta">
                                    <span class="appointment-date-badge">
                                        <i class="far fa-calendar"></i> ${appointmentDate}
                                    </span>
                                    <span class="appointment-time-badge">
                                        <i class="far fa-clock"></i> ${appointment.hora}
                                    </span>
                                    <span class="appointment-status-badge ${appointment.estado.toLowerCase().replace(' ', '-')}">
                                        ${APPOINTMENT_STATUSES[appointment.estado]}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-grid">
                            <div class="detail-section">
                                <h4>Información del Cliente</h4>
                                <div class="detail-row">
                                    <label>Nombre:</label>
                                    <span>${clientName}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Correo:</label>
                                    <span>${clientEmail}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Teléfono:</label>
                                    <span>${clientPhone}</span>
                                </div>
                                ${appointment.usuarioDetalles ? `
                                    <div class="detail-row">
                                        <label>Empresa:</label>
                                        <span>${clientCompany}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="detail-section">
                                <h4>Detalles de la Cita</h4>
                                <div class="detail-row">
                                    <label>Tipo:</label>
                                    <span>${APPOINTMENT_TYPES[appointment.tipo]}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Estado:</label>
                                    <span class="status-indicator ${appointment.estado}">${APPOINTMENT_STATUSES[appointment.estado]}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Fecha:</label>
                                    <span>${appointmentDate}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Hora:</label>
                                    <span>${appointment.hora}</span>
                                </div>
                            </div>
                            
                            ${appointment.tipo === 'seguimiento-proyecto' ? `
                                <div class="detail-section">
                                    <h4>Proyecto Asociado</h4>
                                    <div class="detail-row">
                                        <label>Proyecto:</label>
                                        <span>${projectInfo}</span>
                                    </div>
                                    ${appointment.proyectoDetalles ? `
                                        <div class="detail-row">
                                            <label>Progreso:</label>
                                            <span>${appointment.proyectoDetalles.porcentajeProgreso || 0}%</span>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            <div class="detail-section">
                                <h4>Información Adicional</h4>
                                <div class="detail-row">
                                    <label>Fecha de Creación:</label>
                                    <span>${creationDate}</span>
                                </div>
                                ${appointment.notas ? `
                                    <div class="detail-row full-width">
                                        <label>Notas:</label>
                                        <div class="notes-content">
                                            <p>${appointment.notas}</p>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions" style="margin-top: 30px;">
                        <button type="button" class="secondary-btn" onclick="editAppointment('${appointment._id}')">
                            <i class="fas fa-edit"></i> Editar Cita
                        </button>
                        
                        ${appointment.estado === 'pendiente' ? `
                            <button type="button" class="secondary-btn success-btn" onclick="confirmAppointment('${appointment._id}')">
                                <i class="fas fa-check"></i> Confirmar
                            </button>
                        ` : ''}
                        
                        ${appointment.estado === 'confirmada' ? `
                            <button type="button" class="secondary-btn success-btn" onclick="completeAppointment('${appointment._id}')">
                                <i class="fas fa-check-double"></i> Completar
                            </button>
                        ` : ''}
                        
                        ${appointment.estado !== 'cancelada' && appointment.estado !== 'completada' ? `
                            <button type="button" class="secondary-btn warning-btn" onclick="rescheduleAppointment('${appointment._id}')">
                                <i class="fas fa-calendar-alt"></i> Reprogramar
                            </button>
                            <button type="button" class="secondary-btn danger-btn" onclick="cancelAppointment('${appointment._id}')">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        ` : ''}
                        
                        ${appointment.usuarioDetalles ? `
                            <button type="button" class="secondary-btn" onclick="contactAppointmentClient('${appointment.usuario}')">
                                <i class="fas fa-envelope"></i> Contactar Cliente
                            </button>
                        ` : ''}
                        
                        <button type="button" class="primary-btn" id="close-appointment-details-btn">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('appointment-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Insertar el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos del modal
    setTimeout(() => {
        const modal = document.getElementById('appointment-details-modal');
        const closeBtn = document.getElementById('close-appointment-details-modal');
        const closeDetailsBtn = document.getElementById('close-appointment-details-btn');
        
        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }, 100);
}

/**
 * Contactar cliente de una cita
 */
function contactAppointmentClient(clientId) {
    console.log('📧 Contactando cliente:', clientId);
    
    // Si existe la función del módulo de clientes, usarla
    if (typeof sendEmailToClient === 'function') {
        sendEmailToClient(clientId);
    } else {
        // Implementación básica
        const client = clientsOptionsForAppointments.find(c => c._id === clientId);
        if (client) {
            const mailto = `mailto:${client.correo}?subject=Seguimiento de Cita - Crazy Studios`;
            window.open(mailto);
        } else {
            showToast('No se pudo encontrar la información del cliente', 'error');
        }
    }
}

/**
 * Obtener próximas citas (para recordatorios)
 */
function getUpcomingAppointments() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    return appointmentsData.filter(appointment => {
        if (!appointment.fecha || appointment.estado === 'cancelada' || appointment.estado === 'completada') {
            return false;
        }
        
        const appointmentDate = new Date(appointment.fecha);
        return appointmentDate >= now && appointmentDate <= tomorrow;
    });
}

/**
 * Mostrar recordatorios de citas próximas
 */
function showUpcomingAppointmentsReminder() {
    const upcomingAppointments = getUpcomingAppointments();
    
    if (upcomingAppointments.length > 0) {
        const appointmentsList = upcomingAppointments.map(appointment => {
            const clientName = appointment.usuarioDetalles 
                ? `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`
                : appointment.nombreContacto;
            
            const date = new Date(appointment.fecha).toLocaleDateString('es-ES');
            
            return `• ${clientName} - ${date} a las ${appointment.hora}`;
        }).join('\n');
        
        const message = `🔔 Recordatorio: Tienes ${upcomingAppointments.length} cita(s) próxima(s):\n\n${appointmentsList}`;
        
        console.log('🔔 Citas próximas:', upcomingAppointments);
        showToast(message, 'info');
    }
}

/**
 * Inicializar recordatorios automáticos
 */
function initAppointmentReminders() {
    // Mostrar recordatorios al cargar
    setTimeout(() => {
        showUpcomingAppointmentsReminder();
    }, 2000);
    
    // Recordatorios cada 30 minutos
    setInterval(() => {
        showUpcomingAppointmentsReminder();
    }, 30 * 60 * 1000);
}

/**
 * Función de limpieza del módulo
 */
function cleanupAppointmentsModule() {
    console.log('🧹 Limpiando módulo de citas...');
    
    // Limpiar intervalos si existen
    if (window.appointmentRemindersInterval) {
        clearInterval(window.appointmentRemindersInterval);
    }
    
    // Cerrar modales abiertos
    const modals = [
        'appointment-modal',
        'appointment-details-modal', 
        'day-appointments-modal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    });
    
    // Restaurar scroll
    document.body.style.overflow = 'auto';
    
    console.log('✅ Módulo de citas limpio');
}

/**
 * Función de debug completa
 */
function debugAppointmentsModuleComplete() {
    console.log('=== DEBUG COMPLETO MÓDULO DE CITAS ===');
    
    // Estado general
    console.log('📊 Estado general:');
    console.log('- appointmentsData:', appointmentsData.length, 'citas');
    console.log('- filteredAppointmentsData:', filteredAppointmentsData.length, 'citas filtradas');
    console.log('- clientsOptionsForAppointments:', clientsOptionsForAppointments.length, 'clientes');
    console.log('- projectsOptionsForAppointments:', projectsOptionsForAppointments.length, 'proyectos');
    console.log('- currentViewMode:', currentViewMode);
    console.log('- currentCalendarDate:', currentCalendarDate);
    
    // Elementos DOM
    console.log('🎯 Elementos DOM:');
    const elements = {
        'new-appointment-btn': document.getElementById('new-appointment-btn'),
        'appointments-calendar': document.getElementById('appointments-calendar'),
        'appointments-list-view': document.getElementById('appointments-list-view'),
        'appointments-table': document.getElementById('appointments-table'),
        'calendar-title': document.getElementById('calendar-title'),
        'calendar-body': document.getElementById('calendar-body')
    };
    
    Object.entries(elements).forEach(([key, element]) => {
        console.log(`- ${key}:`, element ? '✅' : '❌');
    });
    
    // Estadísticas
    console.log('📊 Estadísticas:');
    const stats = getAppointmentsStats();
    console.log('- Stats:', stats);
    
    // Próximas citas
    console.log('🔔 Próximas citas:');
    const upcoming = getUpcomingAppointments();
    console.log('- Upcoming:', upcoming.length, 'citas');
    
    console.log('=== FIN DEBUG ===');
}

// Funciones globales para uso externo
window.viewAppointment = viewAppointment;
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.confirmAppointment = confirmAppointment;
window.cancelAppointment = cancelAppointment;
window.completeAppointment = completeAppointment;
window.rescheduleAppointment = rescheduleAppointment;
window.contactAppointmentClient = contactAppointmentClient;
window.refreshAppointmentsData = refreshAppointmentsData;
window.cleanupAppointmentsModule = cleanupAppointmentsModule;
window.debugAppointmentsModuleComplete = debugAppointmentsModuleComplete;

// Auto-inicialización de recordatorios cuando se carga el módulo completo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar recordatorios después de que se carguen los datos iniciales
    setTimeout(() => {
        if (appointmentsData.length > 0) {
            initAppointmentReminders();
        }
    }, 5000);
});

console.log('📅 Módulo de citas - Parte 7 cargada: Modal de detalles y funciones finales');
console.log('🎉 MÓDULO DE CITAS COMPLETADO - Todas las partes cargadas correctamente');

// Exportar configuración final del módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAppointmentsModule,
        initAppointmentsModuleComplete,
        openCreateAppointmentModal,
        loadAppointmentsData,
        refreshAppointmentsData,
        cleanupAppointmentsModule
    };
}