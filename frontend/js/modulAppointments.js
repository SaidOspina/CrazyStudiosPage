/**
 * Módulo de Citas para Dashboard Administrador - VERSIÓN CORREGIDA
 * Archivo: frontend/js/modulAppointments.js
 */

let currentAppointmentsPage = 1;
let appointmentsPerPage = 10;
let appointmentsData = [];
let filteredAppointmentsData = [];
let clientsOptionsAppointments = [];
let projectsOptionsAppointments = [];

// Variables del calendario
let currentDate = new Date();
let selectedDate = null;
let calendarAppointments = {};

/**
 * Inicializa el módulo de citas cuando se carga la sección
 */
function initAppointmentsModule() {
    console.log('✅ Inicializando módulo de citas...');
    
    // Configurar eventos de la sección de citas
    setupAppointmentsEvents();
    
    // Cargar datos iniciales
    loadAppointmentsData();
    loadClientsOptionsForAppointments();
    loadProjectsOptionsForAppointments();
    
    // Configurar calendario
    setupCalendar();
    
    // Configurar filtros
    setupAppointmentsFilters();
    
    // Configurar vistas (calendario/lista)
    setupViewTabs();
    
    // Renderizar calendario inicial
    renderCalendar();
}

/**
 * Configura todos los eventos relacionados con citas
 */
function setupAppointmentsEvents() {
    // Botón de nueva cita
    const newAppointmentBtn = document.getElementById('new-appointment-btn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', function() {
            openCreateAppointmentModal();
        });
    }
    
    // Búsqueda de citas
    const appointmentSearchBtn = document.getElementById('appointment-search-btn');
    const appointmentSearchInput = document.getElementById('appointment-search');
    
    if (appointmentSearchBtn) {
        appointmentSearchBtn.addEventListener('click', function() {
            searchAppointments();
        });
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
}

/**
 * Configura las pestañas de vista (calendario/lista)
 */
function setupViewTabs() {
    const viewTabs = document.querySelectorAll('.view-tab');
    const calendarView = document.getElementById('appointments-calendar');
    const listView = document.getElementById('appointments-list-view');
    
    viewTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Actualizar pestañas activas
            viewTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar/ocultar vistas
            if (view === 'calendar') {
                calendarView.classList.add('active');
                listView.classList.remove('active');
                renderCalendar(); // Re-renderizar calendario al cambiar vista
            } else {
                calendarView.classList.remove('active');
                listView.classList.add('active');
                renderAppointmentsList(); // Renderizar lista
            }
        });
    });
}

/**
 * Configura el calendario
 */
function setupCalendar() {
    const prevBtn = document.getElementById('prev-month-btn');
    const nextBtn = document.getElementById('next-month-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
}

/**
 * Renderiza el calendario con las citas
 */
function renderCalendar() {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarBody = document.getElementById('calendar-body');
    
    if (!calendarTitle || !calendarBody) {
        console.error('Elementos del calendario no encontrados');
        return;
    }
    
    // Actualizar título del mes
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    calendarTitle.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Generar días del calendario
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Obtener días del mes anterior para completar la primera semana
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    let calendarHTML = '';
    let dayCount = 1;
    let nextMonthDay = 1;
    
    // Generar 6 semanas (42 días)
    for (let week = 0; week < 6; week++) {
        calendarHTML += '<tr>';
        
        for (let day = 0; day < 7; day++) {
            const cellIndex = week * 7 + day;
            let dayNumber, cellClass, cellDate;
            
            if (cellIndex < startingDayOfWeek) {
                // Días del mes anterior
                dayNumber = daysInPrevMonth - startingDayOfWeek + cellIndex + 1;
                cellClass = 'calendar-day other-month';
                cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, dayNumber);
            } else if (dayCount <= daysInMonth) {
                // Días del mes actual
                dayNumber = dayCount;
                cellClass = 'calendar-day';
                cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                
                // Marcar día actual
                const today = new Date();
                if (cellDate.toDateString() === today.toDateString()) {
                    cellClass += ' current-day';
                }
                
                dayCount++;
            } else {
                // Días del mes siguiente
                dayNumber = nextMonthDay;
                cellClass = 'calendar-day other-month';
                cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, nextMonthDay);
                nextMonthDay++;
            }
            
            // Obtener citas para este día
            const dayAppointments = getAppointmentsForDate(cellDate);
            const appointmentsHTML = renderDayAppointments(dayAppointments);
            
            calendarHTML += `
                <td class="${cellClass}" data-date="${cellDate.toISOString().split('T')[0]}" onclick="selectCalendarDate('${cellDate.toISOString().split('T')[0]}')">
                    ${dayNumber}
                    ${appointmentsHTML}
                </td>
            `;
        }
        
        calendarHTML += '</tr>';
    }
    
    calendarBody.innerHTML = calendarHTML;
}

/**
 * Obtiene las citas para una fecha específica
 */
function getAppointmentsForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    return appointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        const appointmentDate = new Date(appointment.fecha).toISOString().split('T')[0];
        return appointmentDate === dateString;
    });
}

/**
 * Renderiza las citas de un día específico
 */
function renderDayAppointments(appointments) {
    if (!appointments || appointments.length === 0) {
        return '';
    }
    
    // Contar citas por tipo
    const appointmentsByType = appointments.reduce((acc, appointment) => {
        const type = appointment.tipo || 'consulta-general';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    
    let html = '<div class="day-appointments">';
    
    Object.entries(appointmentsByType).forEach(([type, count]) => {
        const label = count === 1 ? '1 cita' : `${count} citas`;
        html += `<div class="day-appointment" data-type="${type}">${label}</div>`;
    });
    
    html += '</div>';
    return html;
}

/**
 * Maneja la selección de una fecha en el calendario
 */
function selectCalendarDate(dateString) {
    console.log('Fecha seleccionada:', dateString);
    selectedDate = dateString;
    
    // Remover selección anterior
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Marcar día seleccionado
    const selectedCell = document.querySelector(`[data-date="${dateString}"]`);
    if (selectedCell) {
        selectedCell.classList.add('selected');
    }
    
    // Mostrar citas del día seleccionado
    showDayAppointments(dateString);
}

/**
 * Muestra las citas de un día específico
 */
function showDayAppointments(dateString) {
    const date = new Date(dateString);
    const appointments = getAppointmentsForDate(date);
    
    if (appointments.length === 0) {
        showToast(`No hay citas programadas para ${date.toLocaleDateString('es-ES')}`, 'info');
        return;
    }
    
    // Crear modal con las citas del día
    const modalHTML = `
        <div class="modal active" id="day-appointments-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Citas del ${date.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</h2>
                    <button class="close-btn" onclick="closeDayAppointmentsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="day-appointments-list">
                        ${appointments.map(appointment => `
                            <div class="appointment-item">
                                <div class="appointment-time">
                                    <i class="far fa-clock"></i>
                                    ${appointment.hora}
                                </div>
                                <div class="appointment-details">
                                    <h4>${getAppointmentTypeLabel(appointment.tipo)}</h4>
                                    <p class="appointment-client">
                                        ${appointment.usuarioDetalles ? 
                                            `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}` : 
                                            appointment.nombreContacto || 'Cliente no especificado'}
                                    </p>
                                    ${appointment.proyectoDetalles ? 
                                        `<p class="appointment-project">
                                            <i class="fas fa-project-diagram"></i>
                                            ${appointment.proyectoDetalles.nombre}
                                        </p>` : ''}
                                    ${appointment.notas ? 
                                        `<p class="appointment-notes">${appointment.notas}</p>` : ''}
                                </div>
                                <div class="appointment-status">
                                    <span class="status-badge ${appointment.estado}">${getAppointmentStatusLabel(appointment.estado)}</span>
                                </div>
                                <div class="appointment-actions">
                                    <button class="action-btn edit-btn" onclick="editAppointment('${appointment._id}')" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete-btn" onclick="deleteAppointment('${appointment._id}')" title="Eliminar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="form-actions" style="margin-top: 20px;">
                        <button class="primary-btn" onclick="openCreateAppointmentModal('${dateString}')">
                            <i class="far fa-calendar-plus"></i> Nueva Cita para este Día
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('day-appointments-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de citas del día
 */
function closeDayAppointmentsModal() {
    const modal = document.getElementById('day-appointments-modal');
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
        console.log('✅ Citas cargadas:', data);
        
        appointmentsData = data.data || [];
        filteredAppointmentsData = [...appointmentsData];
        
        // Renderizar calendario y lista
        renderCalendar();
        renderAppointmentsList();
        
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
 * Carga las opciones de clientes para las citas
 */
async function loadClientsOptionsForAppointments() {
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
        clientsOptionsAppointments = allUsers.filter(user => user.rol === 'cliente');
        
        console.log(`✅ Clientes disponibles para citas: ${clientsOptionsAppointments.length}`);
        
    } catch (error) {
        console.error('❌ Error al cargar opciones de clientes:', error);
        clientsOptionsAppointments = [];
    }
}

/**
 * Carga las opciones de proyectos para las citas
 */
async function loadProjectsOptionsForAppointments() {
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
        projectsOptionsAppointments = data.data || [];
        
        console.log(`✅ Proyectos disponibles para citas: ${projectsOptionsAppointments.length}`);
        
    } catch (error) {
        console.error('❌ Error al cargar opciones de proyectos:', error);
        projectsOptionsAppointments = [];
    }
}

/**
 * Abre el modal para crear una nueva cita
 */
async function openCreateAppointmentModal(preselectedDate = null) {
    console.log('📝 Abriendo modal de crear cita...');
    
    // Asegurar que tenemos los datos necesarios
    if (clientsOptionsAppointments.length === 0) {
        await loadClientsOptionsForAppointments();
    }
    
    if (projectsOptionsAppointments.length === 0) {
        await loadProjectsOptionsForAppointments();
    }
    
    createAppointmentModal(null, preselectedDate);
}

/**
 * Crea el modal para agregar/editar cita - VERSIÓN CORREGIDA
 */
function createAppointmentModal(appointmentData = null, preselectedDate = null) {
    const isEditing = appointmentData !== null;
    const modalTitle = isEditing ? 'Editar Cita' : 'Agendar Nueva Cita';
    const submitButtonText = isEditing ? 'Guardar Cambios' : 'Agendar Cita';
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('appointment-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Generar opciones de clientes
    let clientOptionsHTML = '<option value="">Sin cliente específico</option>';
    clientsOptionsAppointments.forEach(client => {
        const isSelected = appointmentData?.usuario === client._id ? 'selected' : '';
        const empresaText = client.empresa ? ` - ${client.empresa}` : '';
        clientOptionsHTML += `<option value="${client._id}" ${isSelected}>
            ${client.nombre} ${client.apellidos}${empresaText}
        </option>`;
    });
    
    // Generar opciones de proyectos
    let projectOptionsHTML = '<option value="">Sin proyecto específico</option>';
    projectsOptionsAppointments.forEach(project => {
        const isSelected = appointmentData?.proyecto === project._id ? 'selected' : '';
        const clientInfo = project.clienteDetalles ? 
            ` (${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos})` : '';
        projectOptionsHTML += `<option value="${project._id}" ${isSelected}>
            ${project.nombre}${clientInfo}
        </option>`;
    });
    
    // Fecha preseleccionada o fecha de la cita existente
    const defaultDate = preselectedDate || 
                       (appointmentData?.fecha ? new Date(appointmentData.fecha).toISOString().split('T')[0] : '');
    
    // Determinar si mostrar campos de contacto inicialmente
    const showGuestFields = !appointmentData?.usuario && (appointmentData?.nombreContacto || !isEditing);
    
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
                                <label for="appointment-client">Cliente (Opcional)</label>
                                <select id="appointment-client" name="usuario">
                                    ${clientOptionsHTML}
                                </select>
                                <small style="color: #999; font-size: 12px;">
                                    <i class="fas fa-info-circle"></i> 
                                    Selecciona un cliente registrado o deja vacío para invitado
                                </small>
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
                        
                        <!-- Campo de proyecto para seguimiento -->
                        <div class="form-group" id="project-select-container" style="display: ${appointmentData?.tipo === 'seguimiento-proyecto' ? 'block' : 'none'};">
                            <label for="appointment-project">
                                Proyecto *
                                <span style="color: #ff9800; font-size: 12px;">(Requerido para seguimiento)</span>
                            </label>
                            <select id="appointment-project" name="proyecto">
                                ${projectOptionsHTML}
                            </select>
                            <small style="color: #999; font-size: 12px;">
                                <i class="fas fa-project-diagram"></i> 
                                Este campo se llena automáticamente si seleccionas un cliente con proyectos
                            </small>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="appointment-date">Fecha *</label>
                                <input type="date" id="appointment-date" name="fecha" value="${defaultDate}" required>
                            </div>
                            <div class="form-group">
                                <label for="appointment-time">Hora *</label>
                                <select id="appointment-time" name="hora" required>
                                    <option value="">Seleccionar hora</option>
                                    ${generateTimeOptions(appointmentData?.hora)}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="appointment-status">Estado</label>
                                <select id="appointment-status" name="estado">
                                    <option value="pendiente" ${appointmentData?.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                    <option value="confirmada" ${appointmentData?.estado === 'confirmada' ? 'selected' : ''}>Confirmada</option>
                                    <option value="cancelada" ${appointmentData?.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                                    <option value="completada" ${appointmentData?.estado === 'completada' ? 'selected' : ''}>Completada</option>
                                </select>
                            </div>
                            <div class="form-group checkbox-group">
                                <label class="checkbox-container">
                                    <input type="checkbox" id="send-notification" ${!isEditing ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Enviar notificación por email
                                </label>
                            </div>
                        </div>
                        
                        <!-- Campos para contacto no registrado -->
                        <div id="guest-contact-fields" style="display: ${showGuestFields ? 'block' : 'none'};">
                            <div class="guest-fields-header">
                                <h4>
                                    <i class="fas fa-user-plus"></i>
                                    Datos de Contacto del Invitado
                                </h4>
                                <p style="color: #999; font-size: 13px; margin: 5px 0 15px 0;" id="guest-fields-help">
                                    Estos campos son requeridos cuando no se selecciona un cliente registrado
                                </p>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="contact-name">Nombre Completo *</label>
                                    <input 
                                        type="text" 
                                        id="contact-name" 
                                        name="nombreContacto" 
                                        value="${appointmentData?.nombreContacto || ''}"
                                        placeholder="Ej: María González"
                                    >
                                </div>
                                <div class="form-group">
                                    <label for="contact-email">Email *</label>
                                    <input 
                                        type="email" 
                                        id="contact-email" 
                                        name="correoContacto" 
                                        value="${appointmentData?.correoContacto || ''}"
                                        placeholder="maria@ejemplo.com"
                                    >
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="contact-phone">Teléfono</label>
                                <input 
                                    type="tel" 
                                    id="contact-phone" 
                                    name="telefonoContacto" 
                                    value="${appointmentData?.telefonoContacto || ''}"
                                    placeholder="+57 300 123 4567"
                                >
                            </div>
                        </div>
                        
                        <!-- Información del cliente seleccionado -->
                        <div id="selected-client-info" style="display: none;">
                            <div class="client-info-card">
                                <h4>
                                    <i class="fas fa-user-check"></i>
                                    Cliente Seleccionado
                                </h4>
                                <div id="client-details-content">
                                    <!-- Se llena dinámicamente -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointment-notes">Notas (Opcional)</label>
                            <textarea 
                                id="appointment-notes" 
                                name="notas" 
                                rows="3" 
                                placeholder="Notas adicionales sobre la cita, agenda específica, recordatorios..."
                            >${appointmentData?.notas || ''}</textarea>
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
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        setupAppointmentModalEvents(isEditing, appointmentData);
    }, 100);
}

/**
 * Genera opciones de horarios
 */
function generateTimeOptions(selectedTime = null) {
    const times = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
    ];
    
    return times.map(time => {
        const isSelected = selectedTime === time ? 'selected' : '';
        const display = new Date(`2000-01-01 ${time}`).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return `<option value="${time}" ${isSelected}>${display}</option>`;
    }).join('');
}

/**
 * Configura los eventos del modal de cita - VERSIÓN COMPLETA Y CORREGIDA
 */
function setupAppointmentModalEvents(isEditing, appointmentData) {
    const modal = document.getElementById('appointment-modal');
    const closeBtn = document.getElementById('close-appointment-modal');
    const cancelBtn = document.getElementById('cancel-appointment-btn');
    const form = document.getElementById('appointment-form');
    const typeSelect = document.getElementById('appointment-type');
    const clientSelect = document.getElementById('appointment-client');
    const projectSelect = document.getElementById('appointment-project');
    const projectContainer = document.getElementById('project-select-container');
    const guestFields = document.getElementById('guest-contact-fields');
    const selectedClientInfo = document.getElementById('selected-client-info');
    const contactNameInput = document.getElementById('contact-name');
    const contactEmailInput = document.getElementById('contact-email');
    const contactPhoneInput = document.getElementById('contact-phone');
    const guestFieldsHelp = document.getElementById('guest-fields-help');
    
    if (!modal || !form) {
        console.error('❌ Elementos del modal de cita no encontrados');
        return;
    }
    
    console.log('🔧 Configurando eventos del modal de cita...');
    
    // Función para cerrar modal - CORREGIDA
    function closeModal() {
        console.log('🚪 Cerrando modal de cita...');
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
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    if (cancelBtn) {
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
    
    // Mostrar/ocultar campo de proyecto según el tipo
    if (typeSelect && projectContainer) {
        typeSelect.addEventListener('change', function() {
            console.log('🔄 Tipo de cita cambiado a:', this.value);
            
            if (this.value === 'seguimiento-proyecto') {
                projectContainer.style.display = 'block';
                if (projectSelect) {
                    projectSelect.required = true;
                }
                
                // Si hay un cliente seleccionado, filtrar proyectos
                if (clientSelect && clientSelect.value) {
                    filterProjectsByClient(clientSelect.value);
                }
            } else {
                projectContainer.style.display = 'none';
                if (projectSelect) {
                    projectSelect.required = false;
                    projectSelect.value = ''; // Limpiar selección
                }
            }
        });
    }
    
    // LÓGICA PRINCIPAL: Manejar selección de cliente - VERSIÓN CORREGIDA
    if (clientSelect && guestFields && selectedClientInfo) {
        clientSelect.addEventListener('change', function() {
            const selectedClientId = this.value;
            console.log('👤 Cliente seleccionado:', selectedClientId);
            
            if (selectedClientId) {
                // Buscar datos del cliente
                const clientData = clientsOptionsAppointments.find(c => c._id === selectedClientId);
                
                if (clientData) {
                    console.log('✅ Datos del cliente encontrados:', clientData);
                    
                    // RELLENAR AUTOMÁTICAMENTE LOS CAMPOS DE CONTACTO
                    if (contactNameInput) {
                        contactNameInput.value = `${clientData.nombre} ${clientData.apellidos}`;
                        console.log('📝 Nombre actualizado:', contactNameInput.value);
                    }
                    if (contactEmailInput) {
                        contactEmailInput.value = clientData.correo || '';
                        console.log('📧 Email actualizado:', contactEmailInput.value);
                    }
                    if (contactPhoneInput) {
                        contactPhoneInput.value = clientData.telefono || '';
                        console.log('📞 Teléfono actualizado:', contactPhoneInput.value);
                    }
                    
                    // Actualizar el texto de ayuda
                    if (guestFieldsHelp) {
                        guestFieldsHelp.textContent = 'Datos del cliente seleccionado (se utilizarán automáticamente)';
                        guestFieldsHelp.style.color = '#4CAF50';
                        guestFieldsHelp.innerHTML = '<i class="fas fa-check-circle"></i> Datos del cliente seleccionado (se utilizarán automáticamente)';
                    }
                    
                    // Mostrar campos con los datos del cliente
                    guestFields.style.display = 'block';
                    selectedClientInfo.style.display = 'block';
                    
                    // Los campos NO son requeridos porque tenemos cliente seleccionado
                    if (contactNameInput) {
                        contactNameInput.required = false;
                        contactNameInput.disabled = true; // Deshabilitar para mostrar que son automáticos
                        contactNameInput.style.backgroundColor = '#e8f5e8';
                    }
                    if (contactEmailInput) {
                        contactEmailInput.required = false;
                        contactEmailInput.disabled = true;
                        contactEmailInput.style.backgroundColor = '#e8f5e8';
                    }
                    if (contactPhoneInput) {
                        contactPhoneInput.disabled = true;
                        contactPhoneInput.style.backgroundColor = '#e8f5e8';
                    }
                    
                    // Mostrar información del cliente seleccionado
                    showSelectedClientInfo(selectedClientId);
                    
                    // Si el tipo es seguimiento de proyecto, filtrar proyectos de este cliente
                    if (typeSelect && typeSelect.value === 'seguimiento-proyecto') {
                        filterProjectsByClient(selectedClientId);
                    }
                } else {
                    console.warn('⚠️ No se encontraron datos del cliente');
                }
                
            } else {
                console.log('🗑️ Cliente deseleccionado - habilitando campos de invitado');
                
                // Limpiar campos de contacto
                if (contactNameInput) {
                    contactNameInput.value = '';
                    contactNameInput.required = true;
                    contactNameInput.disabled = false;
                    contactNameInput.style.backgroundColor = '';
                }
                if (contactEmailInput) {
                    contactEmailInput.value = '';
                    contactEmailInput.required = true;
                    contactEmailInput.disabled = false;
                    contactEmailInput.style.backgroundColor = '';
                }
                if (contactPhoneInput) {
                    contactPhoneInput.value = '';
                    contactPhoneInput.disabled = false;
                    contactPhoneInput.style.backgroundColor = '';
                }
                
                // Restaurar texto de ayuda original
                if (guestFieldsHelp) {
                    guestFieldsHelp.innerHTML = '<i class="fas fa-info-circle"></i> Estos campos son requeridos cuando no se selecciona un cliente registrado';
                    guestFieldsHelp.style.color = '#999';
                }
                
                // Mostrar campos de invitado
                guestFields.style.display = 'block';
                selectedClientInfo.style.display = 'none';
                
                // Limpiar información del cliente
                clearSelectedClientInfo();
                
                // Restaurar todos los proyectos en el selector
                if (projectSelect) {
                    resetProjectsOptions();
                }
            }
        });
        
        // Trigger inicial para establecer el estado correcto
        setTimeout(() => {
            if (clientSelect.value) {
                console.log('🔄 Disparando evento inicial para cliente:', clientSelect.value);
                clientSelect.dispatchEvent(new Event('change'));
            }
        }, 200);
    }
    
    // Validación en tiempo real del tipo de cita
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            // Remover estilos de error si había
            this.style.borderColor = '';
            
            if (this.value) {
                console.log('✅ Tipo de cita válido seleccionado:', this.value);
            }
        });
        
        // Validación al perder el foco
        typeSelect.addEventListener('blur', function() {
            if (!this.value || this.value.trim() === '') {
                this.style.borderColor = '#ff9800';
                console.log('⚠️ Tipo de cita requerido');
            }
        });
    }
    
    // Envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('📤 Enviando formulario de cita...');
        
        // Habilitar temporalmente los campos deshabilitados para que se envíen
        if (contactNameInput && contactNameInput.disabled) {
            contactNameInput.disabled = false;
        }
        if (contactEmailInput && contactEmailInput.disabled) {
            contactEmailInput.disabled = false;
        }
        if (contactPhoneInput && contactPhoneInput.disabled) {
            contactPhoneInput.disabled = false;
        }
        
        // Validación personalizada antes del envío
        if (validateAppointmentForm()) {
            if (isEditing) {
                console.log('✏️ Actualizando cita existente...');
                handleAppointmentUpdate(e, appointmentData);
            } else {
                console.log('➕ Creando nueva cita...');
                handleAppointmentCreate(e);
            }
        } else {
            console.log('❌ Validación fallida');
            
            // Restaurar estado de campos si la validación falla
            if (clientSelect && clientSelect.value) {
                if (contactNameInput) {
                    contactNameInput.disabled = true;
                    contactNameInput.style.backgroundColor = '#e8f5e8';
                }
                if (contactEmailInput) {
                    contactEmailInput.disabled = true;
                    contactEmailInput.style.backgroundColor = '#e8f5e8';
                }
                if (contactPhoneInput) {
                    contactPhoneInput.disabled = true;
                    contactPhoneInput.style.backgroundColor = '#e8f5e8';
                }
            }
        }
    });
    
    // Validación en tiempo real de campos requeridos
    const requiredFields = [
        { element: document.getElementById('appointment-date'), name: 'fecha' },
        { element: document.getElementById('appointment-time'), name: 'hora' },
        { element: contactNameInput, name: 'nombre contacto' },
        { element: contactEmailInput, name: 'email contacto' }
    ];
    
    requiredFields.forEach(field => {
        if (field.element) {
            field.element.addEventListener('input', function() {
                if (this.value.trim()) {
                    this.style.borderColor = '';
                }
            });
            
            field.element.addEventListener('blur', function() {
                if (this.required && !this.value.trim()) {
                    this.style.borderColor = '#ff9800';
                }
            });
        }
    });
    
    console.log('✅ Eventos del modal de cita configurados correctamente');
}

/**
 * Funciones auxiliares para el modal
 */

/**
 * Muestra información del cliente seleccionado - MEJORADA
 */
function showSelectedClientInfo(clientId) {
    const client = clientsOptionsAppointments.find(c => c._id === clientId);
    const clientDetailsContent = document.getElementById('client-details-content');
    
    if (client && clientDetailsContent) {
        const projectsCount = projectsOptionsAppointments.filter(p => 
            p.clienteDetalles && p.clienteDetalles._id === clientId
        ).length;
        
        clientDetailsContent.innerHTML = `
            <div class="client-info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #4CAF50;">
                <div class="client-info-item">
                    <strong style="color: #2e7d32;">${client.nombre} ${client.apellidos}</strong>
                    ${client.empresa ? `<br><span style="color: #666; font-size: 13px;">${client.empresa}</span>` : ''}
                </div>
                <div class="client-info-item" style="font-size: 13px; color: #555;">
                    <div style="margin-bottom: 4px;"><i class="fas fa-envelope" style="width: 16px; color: #4CAF50;"></i> ${client.correo}</div>
                    ${client.telefono ? `<div style="margin-bottom: 4px;"><i class="fas fa-phone" style="width: 16px; color: #4CAF50;"></i> ${client.telefono}</div>` : ''}
                    <div><i class="fas fa-project-diagram" style="width: 16px; color: #4CAF50;"></i> ${projectsCount} proyecto${projectsCount !== 1 ? 's' : ''}</div>
                </div>
            </div>
        `;
    }
}

/**
 * Limpia la información del cliente seleccionado
 */
function clearSelectedClientInfo() {
    const clientDetailsContent = document.getElementById('client-details-content');
    if (clientDetailsContent) {
        clientDetailsContent.innerHTML = '';
    }
}

/**
 * Filtra proyectos por cliente seleccionado
 */
function filterProjectsByClient(clientId) {
    const projectSelect = document.getElementById('appointment-project');
    if (!projectSelect) return;
    
    console.log('🔍 Filtrando proyectos para cliente:', clientId);
    
    // Obtener proyectos del cliente
    const clientProjects = projectsOptionsAppointments.filter(project => 
        project.clienteDetalles && project.clienteDetalles._id === clientId
    );
    
    // Limpiar opciones actuales
    projectSelect.innerHTML = '<option value="">Seleccionar proyecto del cliente</option>';
    
    if (clientProjects.length > 0) {
        console.log(`✅ Encontrados ${clientProjects.length} proyectos para el cliente`);
        
        // Agregar proyectos del cliente
        clientProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = project.nombre;
            projectSelect.appendChild(option);
        });
        
        // Agregar separador
        const separatorOption = document.createElement('option');
        separatorOption.value = '';
        separatorOption.textContent = '--- Otros proyectos ---';
        separatorOption.disabled = true;
        separatorOption.style.fontStyle = 'italic';
        separatorOption.style.color = '#999';
        projectSelect.appendChild(separatorOption);
        
        // Agregar proyectos de otros clientes (para referencia)
        const otherProjects = projectsOptionsAppointments.filter(project => 
            !project.clienteDetalles || project.clienteDetalles._id !== clientId
        );
        
        otherProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = `${project.nombre} ${project.clienteDetalles ? 
                `(${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos})` : '(Sin cliente)'}`;
            option.style.color = '#888';
            option.style.fontStyle = 'italic';
            projectSelect.appendChild(option);
        });
        
    } else {
        console.log('⚠️ Cliente sin proyectos, mostrando todos los proyectos disponibles');
        
        // Cliente sin proyectos - mostrar mensaje y todos los proyectos
        const noProjectsOption = document.createElement('option');
        noProjectsOption.value = '';
        noProjectsOption.textContent = 'Este cliente no tiene proyectos asignados';
        noProjectsOption.disabled = true;
        noProjectsOption.style.color = '#ff9800';
        noProjectsOption.style.fontStyle = 'italic';
        projectSelect.appendChild(noProjectsOption);
        
        // Separador
        const separatorOption = document.createElement('option');
        separatorOption.value = '';
        separatorOption.textContent = '--- Todos los proyectos ---';
        separatorOption.disabled = true;
        separatorOption.style.fontStyle = 'italic';
        separatorOption.style.color = '#999';
        projectSelect.appendChild(separatorOption);
        
        // Mostrar todos los proyectos disponibles
        projectsOptionsAppointments.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = `${project.nombre} ${project.clienteDetalles ? 
                `(${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos})` : '(Sin cliente)'}`;
            projectSelect.appendChild(option);
        });
    }
}

/**
 * Restaura todas las opciones de proyectos
 */
function resetProjectsOptions() {
    const projectSelect = document.getElementById('appointment-project');
    if (!projectSelect) return;
    
    console.log('🔄 Restaurando todas las opciones de proyectos');
    
    projectSelect.innerHTML = '<option value="">Sin proyecto específico</option>';
    
    projectsOptionsAppointments.forEach(project => {
        const option = document.createElement('option');
        option.value = project._id;
        option.textContent = project.nombre + 
            (project.clienteDetalles ? ` (${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos})` : '');
        projectSelect.appendChild(option);
    });
}

console.log('✅ Funciones de eventos del modal de citas definidas correctamente');