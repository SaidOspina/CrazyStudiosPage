/**
 * Módulo de Citas para Dashboard Administrador
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
    console.log('Inicializando módulo de citas...');
    
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
    console.log('Cargando datos de citas...');
    
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
        console.log('Citas cargadas:', data);
        
        appointmentsData = data.data || [];
        filteredAppointmentsData = [...appointmentsData];
        
        // Renderizar calendario y lista
        renderCalendar();
        renderAppointmentsList();
        
        // Actualizar estadísticas
        updateAppointmentsStatistics();
        
    } catch (error) {
        console.error('Error al cargar citas:', error);
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
        
        console.log(`Clientes disponibles para citas: ${clientsOptionsAppointments.length}`);
        
    } catch (error) {
        console.error('Error al cargar opciones de clientes:', error);
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
        
        console.log(`Proyectos disponibles para citas: ${projectsOptionsAppointments.length}`);
        
    } catch (error) {
        console.error('Error al cargar opciones de proyectos:', error);
        projectsOptionsAppointments = [];
    }
}

/**
 * Abre el modal para crear una nueva cita
 */
async function openCreateAppointmentModal(preselectedDate = null) {
    console.log('Abriendo modal de crear cita...');
    
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
 * Crea el modal para agregar/editar cita
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
                                <p style="color: #999; font-size: 13px; margin: 5px 0 15px 0;">
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
 * Configura los eventos del modal de cita
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
    
    if (!modal || !form) {
        console.error('Elementos del modal de cita no encontrados');
        return;
    }
    
    // Función para cerrar modal
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal && modal.parentNode) {
                modal.remove();
            }
            document.body.style.overflow = 'auto';
        }, 300);
    }
    
    // Eventos de cierre
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    // Mostrar/ocultar campo de proyecto según el tipo
    if (typeSelect && projectContainer) {
        typeSelect.addEventListener('change', function() {
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
    
    // LÓGICA PRINCIPAL: Manejar selección de cliente
    if (clientSelect && guestFields && selectedClientInfo) {
        clientSelect.addEventListener('change', function() {
            const selectedClientId = this.value;
            
            if (selectedClientId) {
                // Cliente seleccionado - ocultar campos de invitado
                guestFields.style.display = 'none';
                selectedClientInfo.style.display = 'block';
                
                // Limpiar requerimientos de campos de invitado
                document.getElementById('contact-name').required = false;
                document.getElementById('contact-email').required = false;
                
                // Mostrar información del cliente seleccionado
                showSelectedClientInfo(selectedClientId);
                
                // Si el tipo es seguimiento de proyecto, filtrar proyectos de este cliente
                if (typeSelect && typeSelect.value === 'seguimiento-proyecto') {
                    filterProjectsByClient(selectedClientId);
                }
                
            } else {
                // No hay cliente seleccionado - mostrar campos de invitado
                guestFields.style.display = 'block';
                selectedClientInfo.style.display = 'none';
                
                // Establecer requerimientos para campos de invitado
                document.getElementById('contact-name').required = true;
                document.getElementById('contact-email').required = true;
                
                // Limpiar información del cliente
                clearSelectedClientInfo();
                
                // Restaurar todos los proyectos en el selector
                if (projectSelect) {
                    resetProjectsOptions();
                }
            }
        });
        
        // Trigger inicial para establecer el estado correcto
        clientSelect.dispatchEvent(new Event('change'));
    }
    
    // Envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validación personalizada antes del envío
        if (validateAppointmentForm()) {
            if (isEditing) {
                handleAppointmentUpdate(e, appointmentData);
            } else {
                handleAppointmentCreate(e);
            }
        }
    });
}

/**
 * Valida el formulario de cita antes del envío
 */
function validateAppointmentForm() {
    const clientSelect = document.getElementById('appointment-client');
    const typeSelect = document.getElementById('appointment-type');
    const projectSelect = document.getElementById('appointment-project');
    const contactName = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');
    
    // Validar tipo de cita
    if (!typeSelect.value) {
        showToast('Por favor selecciona un tipo de cita', 'error');
        typeSelect.focus();
        return false;
    }
    
    // Validar proyecto para seguimiento
    if (typeSelect.value === 'seguimiento-proyecto' && !projectSelect.value) {
        showToast('Por favor selecciona un proyecto para el seguimiento', 'error');
        projectSelect.focus();
        return false;
    }
    
    // Validar datos de contacto si no hay cliente seleccionado
    if (!clientSelect.value) {
        if (!contactName.value.trim()) {
            showToast('Por favor ingresa el nombre del contacto', 'error');
            contactName.focus();
            return false;
        }
        
        if (!contactEmail.value.trim()) {
            showToast('Por favor ingresa el email del contacto', 'error');
            contactEmail.focus();
            return false;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail.value.trim())) {
            showToast('Por favor ingresa un email válido', 'error');
            contactEmail.focus();
            return false;
        }
    }
    
    return true;
}


function showSelectedClientInfo(clientId) {
    const client = clientsOptionsAppointments.find(c => c._id === clientId);
    const clientDetailsContent = document.getElementById('client-details-content');
    
    if (client && clientDetailsContent) {
        const projectsCount = projectsOptionsAppointments.filter(p => 
            p.clienteDetalles && p.clienteDetalles._id === clientId
        ).length;
        
        clientDetailsContent.innerHTML = `
            <div class="client-info-grid">
                <div class="client-info-item">
                    <strong>${client.nombre} ${client.apellidos}</strong>
                    ${client.empresa ? `<br><span style="color: #999;">${client.empresa}</span>` : ''}
                </div>
                <div class="client-info-item">
                    <i class="fas fa-envelope"></i> ${client.correo}
                </div>
                ${client.telefono ? `
                <div class="client-info-item">
                    <i class="fas fa-phone"></i> ${client.telefono}
                </div>
                ` : ''}
                <div class="client-info-item">
                    <i class="fas fa-project-diagram"></i> 
                    ${projectsCount} proyecto${projectsCount !== 1 ? 's' : ''}
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
 * Filtra proyectos por cliente
 */
function filterProjectsByClient(clientId) {
    const projectSelect = document.getElementById('appointment-project');
    if (!projectSelect) return;
    
    // Obtener proyectos del cliente
    const clientProjects = projectsOptionsAppointments.filter(project => 
        project.clienteDetalles && project.clienteDetalles._id === clientId
    );
    
    // Limpiar opciones actuales
    projectSelect.innerHTML = '<option value="">Seleccionar proyecto del cliente</option>';
    
    if (clientProjects.length > 0) {
        clientProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = project.nombre;
            projectSelect.appendChild(option);
        });
        
        // Agregar opción para otros proyectos
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = '--- Otros proyectos ---';
        otherOption.disabled = true;
        projectSelect.appendChild(otherOption);
        
        // Agregar proyectos de otros clientes (deshabilitados para contexto)
        const otherProjects = projectsOptionsAppointments.filter(project => 
            !project.clienteDetalles || project.clienteDetalles._id !== clientId
        );
        
        otherProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = `${project.nombre} ${project.clienteDetalles ? 
                `(${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos})` : ''}`;
            option.style.color = '#666';
            projectSelect.appendChild(option);
        });
        
    } else {
        // Cliente sin proyectos
        const noProjectsOption = document.createElement('option');
        noProjectsOption.value = '';
        noProjectsOption.textContent = 'Este cliente no tiene proyectos';
        noProjectsOption.disabled = true;
        projectSelect.appendChild(noProjectsOption);
        
        // Mostrar todos los proyectos disponibles
        projectsOptionsAppointments.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = `${project.nombre} ${project.clienteDetalles ? 
                `(${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos})` : ''}`;
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
    
    projectSelect.innerHTML = '<option value="">Sin proyecto específico</option>';
    
    projectsOptionsAppointments.forEach(project => {
        const option = document.createElement('option');
        option.value = project._id;
        option.textContent = project.nombre + 
            (project.clienteDetalles ? ` (${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos})` : '');
        projectSelect.appendChild(option);
    });
}

/**
 * Maneja la creación de una nueva cita - VERSIÓN CORREGIDA
 */
async function handleAppointmentCreate(e) {
    console.log('📅 Creando nueva cita...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-appointment-btn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agendando...';
        
        // Recopilar datos del formulario
        const formData = {
            tipo: document.getElementById('appointment-type')?.value || '',
            fecha: document.getElementById('appointment-date')?.value || '',
            hora: document.getElementById('appointment-time')?.value || '',
            estado: document.getElementById('appointment-status')?.value || 'pendiente',
            usuario: document.getElementById('appointment-client')?.value || null,
            proyecto: document.getElementById('appointment-project')?.value || null,
            notas: document.getElementById('appointment-notes')?.value?.trim() || ''
        };
        
        // Si no hay usuario, agregar datos de contacto
        if (!formData.usuario) {
            formData.nombreContacto = document.getElementById('contact-name')?.value?.trim() || '';
            formData.correoContacto = document.getElementById('contact-email')?.value?.trim() || '';
            formData.telefonoContacto = document.getElementById('contact-phone')?.value?.trim() || '';
        }
        
        console.log('📋 Datos de la cita:', formData);
        
        // Las validaciones ya se hicieron en validateAppointmentForm()
        
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
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear cita');
        }
        
        const data = await response.json();
        console.log('✅ Cita creada:', data);
        
        const clienteName = formData.usuario ? 
            'cliente registrado' : 
            formData.nombreContacto;
        
        showToast(`Cita agendada correctamente para ${clienteName}`, 'success');
        
        // Recargar datos y actualizar vistas
        await loadAppointmentsData();
        
        // Cerrar modal
        closeAppointmentModal();
        
    } catch (error) {
        console.error('❌ Error al crear cita:', error);
        showToast(error.message || 'Error al crear cita', 'error');
    } finally {
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
    console.log('Actualizando cita...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-appointment-btn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        
        // Recopilar datos del formulario
        const updateData = {
            tipo: document.getElementById('appointment-type')?.value || '',
            fecha: document.getElementById('appointment-date')?.value || '',
            hora: document.getElementById('appointment-time')?.value || '',
            estado: document.getElementById('appointment-status')?.value || 'pendiente',
            usuario: document.getElementById('appointment-client')?.value || null,
            proyecto: document.getElementById('appointment-project')?.value || null,
            notas: document.getElementById('appointment-notes')?.value?.trim() || ''
        };
        
        // Si no hay usuario, agregar datos de contacto
        if (!updateData.usuario) {
            updateData.nombreContacto = document.getElementById('contact-name')?.value?.trim() || '';
            updateData.correoContacto = document.getElementById('contact-email')?.value?.trim() || '';
            updateData.telefonoContacto = document.getElementById('contact-phone')?.value?.trim() || '';
        }
        
        console.log('Datos de actualización:', updateData);
        
        // Validaciones
        const errors = [];
        if (!updateData.tipo) errors.push('Tipo de cita es requerido');
        if (!updateData.fecha) errors.push('Fecha es requerida');
        if (!updateData.hora) errors.push('Hora es requerida');
        
        if (updateData.tipo === 'seguimiento-proyecto' && !updateData.proyecto) {
            errors.push('Proyecto es requerido para citas de seguimiento');
        }
        
        if (!updateData.usuario) {
            if (!updateData.nombreContacto) errors.push('Nombre de contacto es requerido');
            if (!updateData.correoContacto) errors.push('Email de contacto es requerido');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
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
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar cita');
        }
        
        const data = await response.json();
        console.log('Cita actualizada:', data);
        
        showToast('Cita actualizada correctamente', 'success');
        
        // Recargar datos y actualizar vistas
        await loadAppointmentsData();
        
        // Cerrar modal
        closeAppointmentModal();
        
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        showToast(error.message || 'Error al actualizar cita', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Cierra el modal de cita
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
 * Renderiza la lista de citas
 */
function renderAppointmentsList() {
    const appointmentsTable = document.querySelector('#appointments-table tbody');
    if (!appointmentsTable) return;
    
    if (filteredAppointmentsData.length === 0) {
        appointmentsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <i class="far fa-calendar-alt" style="font-size: 48px; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                    No se encontraron citas
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = filteredAppointmentsData.map(appointment => {
        const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES');
        const cliente = appointment.usuarioDetalles ? 
            `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}` : 
            appointment.nombreContacto || 'Invitado';
        
        const proyecto = appointment.proyectoDetalles ? appointment.proyectoDetalles.nombre : '-';
        
        return `
            <tr>
                <td>${cliente}</td>
                <td>${getAppointmentTypeLabel(appointment.tipo)}</td>
                <td>${fecha}</td>
                <td>${appointment.hora}</td>
                <td><span class="status-badge ${appointment.estado}">${getAppointmentStatusLabel(appointment.estado)}</span></td>
                <td>${proyecto}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="Ver detalles" onclick="viewAppointment('${appointment._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Editar" onclick="editAppointment('${appointment._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Eliminar" onclick="deleteAppointment('${appointment._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    appointmentsTable.innerHTML = rows;
}

/**
 * Obtiene la etiqueta del tipo de cita
 */
function getAppointmentTypeLabel(type) {
    const labels = {
        'consulta-general': 'Consulta General',
        'plan-personalizado': 'Plan Personalizado',
        'seguimiento-proyecto': 'Seguimiento de Proyecto'
    };
    return labels[type] || type;
}

/**
 * Obtiene la etiqueta del estado de cita
 */
function getAppointmentStatusLabel(status) {
    const labels = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'completada': 'Completada'
    };
    return labels[status] || status;
}

/**
 * Ver detalles de una cita
 */
function viewAppointment(appointmentId) {
    console.log('Ver cita:', appointmentId);
    const appointment = appointmentsData.find(a => a._id === appointmentId);
    if (appointment) {
        showAppointmentDetailsModal(appointment);
    }
}

/**
 * Editar una cita
 */
function editAppointment(appointmentId) {
    console.log('Editar cita:', appointmentId);
    const appointment = appointmentsData.find(a => a._id === appointmentId);
    if (appointment) {
        createAppointmentModal(appointment);
    }
}

/**
 * Eliminar una cita
 */
async function deleteAppointment(appointmentId) {
    console.log('Eliminar cita:', appointmentId);
    
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
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar cita');
        }
        
        showToast('Cita eliminada correctamente', 'success');
        await loadAppointmentsData();
        
        // Cerrar modal del día si está abierto
        closeDayAppointmentsModal();
        
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        showToast(error.message || 'Error al eliminar cita', 'error');
    }
}

/**
 * Muestra modal con detalles de la cita
 */
function showAppointmentDetailsModal(appointment) {
    const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const cliente = appointment.usuarioDetalles ? 
        `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}` : 
        appointment.nombreContacto || 'Invitado';
    
    const contacto = appointment.usuarioDetalles ? 
        appointment.usuarioDetalles.correo : 
        appointment.correoContacto || '';
    
    const telefono = appointment.usuarioDetalles ? 
        appointment.usuarioDetalles.telefono : 
        appointment.telefonoContacto || '';
    
    const modalHTML = `
        <div class="modal active" id="appointment-details-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Detalles de la Cita</h2>
                    <button class="close-btn" onclick="closeAppointmentDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="appointment-details">
                        <div class="details-grid">
                            <div class="detail-section">
                                <h4>Información de la Cita</h4>
                                <div class="detail-row">
                                    <label>Tipo:</label>
                                    <span>${getAppointmentTypeLabel(appointment.tipo)}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Fecha:</label>
                                    <span>${fecha}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Hora:</label>
                                    <span>${appointment.hora}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Estado:</label>
                                    <span class="status-badge ${appointment.estado}">${getAppointmentStatusLabel(appointment.estado)}</span>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Información del Cliente</h4>
                                <div class="detail-row">
                                    <label>Cliente:</label>
                                    <span>${cliente}</span>
                                </div>
                                ${contacto ? `<div class="detail-row">
                                    <label>Email:</label>
                                    <span>${contacto}</span>
                                </div>` : ''}
                                ${telefono ? `<div class="detail-row">
                                    <label>Teléfono:</label>
                                    <span>${telefono}</span>
                                </div>` : ''}
                            </div>
                            
                            ${appointment.proyectoDetalles ? `<div class="detail-section">
                                <h4>Proyecto Relacionado</h4>
                                <div class="detail-row">
                                    <label>Proyecto:</label>
                                    <span>${appointment.proyectoDetalles.nombre}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Estado del Proyecto:</label>
                                    <span>${appointment.proyectoDetalles.estado}</span>
                                </div>
                            </div>` : ''}
                            
                            ${appointment.notas ? `<div class="detail-section">
                                <h4>Notas</h4>
                                <div class="notes-content">
                                    <p>${appointment.notas}</p>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                    
                    <div class="form-actions" style="margin-top: 30px;">
                        <button type="button" class="secondary-btn" onclick="editAppointment('${appointment._id}')">
                            <i class="fas fa-edit"></i> Editar Cita
                        </button>
                        ${contacto ? `<button type="button" class="secondary-btn" onclick="contactClient('${contacto}')">
                            <i class="fas fa-envelope"></i> Enviar Email
                        </button>` : ''}
                        <button type="button" class="primary-btn" onclick="closeAppointmentDetailsModal()">Cerrar</button>
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
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de detalles de cita
 */
function closeAppointmentDetailsModal() {
    const modal = document.getElementById('appointment-details-modal');
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
 * Configura los filtros de citas
 */
function setupAppointmentsFilters() {
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
}

/**
 * Aplica los filtros a los datos de citas
 */
function applyAppointmentsFilters() {
    const filterType = document.getElementById('appointment-filter-type')?.value || 'all';
    const filterStatus = document.getElementById('appointment-filter-status')?.value || 'all';
    const filterDate = document.getElementById('appointment-date-filter')?.value || '';
    const searchTerm = document.getElementById('appointment-search')?.value?.toLowerCase() || '';
    
    filteredAppointmentsData = appointmentsData.filter(appointment => {
        // Filtro por tipo
        let typeMatch = filterType === 'all' || appointment.tipo === filterType;
        
        // Filtro por estado
        let statusMatch = filterStatus === 'all' || appointment.estado === filterStatus;
        
        // Filtro por fecha
        let dateMatch = true;
        if (filterDate) {
            const appointmentDate = new Date(appointment.fecha).toISOString().split('T')[0];
            dateMatch = appointmentDate === filterDate;
        }
        
        // Filtro por búsqueda
        let searchMatch = true;
        if (searchTerm) {
            const clientName = appointment.usuarioDetalles ? 
                `${appointment.usuarioDetalles.nombre} ${appointment.usuarioDetalles.apellidos}`.toLowerCase() : 
                (appointment.nombreContacto || '').toLowerCase();
            
            const projectName = appointment.proyectoDetalles ? 
                appointment.proyectoDetalles.nombre.toLowerCase() : '';
            
            searchMatch = (
                clientName.includes(searchTerm) ||
                projectName.includes(searchTerm) ||
                appointment.tipo.toLowerCase().includes(searchTerm) ||
                appointment.estado.toLowerCase().includes(searchTerm) ||
                (appointment.notas || '').toLowerCase().includes(searchTerm)
            );
        }
        
        return typeMatch && statusMatch && dateMatch && searchMatch;
    });
    
    renderAppointmentsList();
}

/**
 * Búsqueda de citas
 */
function searchAppointments() {
    applyAppointmentsFilters();
}

/**
 * Actualizar estadísticas de citas
 */
function updateAppointmentsStatistics() {
    const totalCitas = appointmentsData.length;
    const citasPendientes = appointmentsData.filter(appointment => 
        appointment.estado === 'pendiente' || appointment.estado === 'confirmada'
    ).length;
    
    // Actualizar elemento en el dashboard principal si existe
    const appointmentsCountElement = document.getElementById('appointments-count');
    if (appointmentsCountElement) {
        appointmentsCountElement.textContent = citasPendientes;
    }
    
    console.log('Estadísticas de citas actualizadas:', {
        total: totalCitas,
        pendientes: citasPendientes
    });
}

/**
 * Muestra datos de ejemplo cuando falla la carga
 */
function showSampleAppointmentsData() {
    console.log('Mostrando datos de ejemplo para citas');
    // Datos de ejemplo para desarrollo
}

// Funciones globales para que puedan ser llamadas desde los botones
window.selectCalendarDate = selectCalendarDate;
window.closeDayAppointmentsModal = closeDayAppointmentsModal;
window.viewAppointment = viewAppointment;
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.closeAppointmentDetailsModal = closeAppointmentDetailsModal;
window.contactClient = contactClient;

// Hacer disponible la función de inicialización globalmente
window.initAppointmentsModule = initAppointmentsModule;
window.openCreateAppointmentModal = openCreateAppointmentModal;

console.log('Módulo de citas cargado correctamente');