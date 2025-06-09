/**
 * Módulo de Citas para Dashboard Cliente
 * Archivo: frontend/js/modulAppointmentsClient.js
 * Versión adaptada del módulo de administrador para clientes
 */

// Variables globales del módulo cliente
let currentClientAppointmentsPage = 1;
let clientAppointmentsPerPage = 10;
let clientAppointmentsData = [];
let filteredClientAppointmentsData = [];
let currentClientCalendarDate = new Date();
let currentClientViewMode = 'calendar'; // 'calendar' o 'list'

// Configuración de tipos y estados de citas
const CLIENT_APPOINTMENT_TYPES = {
    'consulta-general': 'Consulta General',
    'plan-personalizado': 'Plan Personalizado',
    'seguimiento-proyecto': 'Seguimiento de Proyecto'
};

const CLIENT_APPOINTMENT_STATUSES = {
    'pendiente': 'Pendiente',
    'confirmada': 'Confirmada',
    'cancelada': 'Cancelada',
    'completada': 'Completada'
};

// Horarios disponibles para solicitar citas
const CLIENT_AVAILABLE_TIMES = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
];

// Colores para el calendario según el tipo de cita
const CLIENT_APPOINTMENT_COLORS = {
    'consulta-general': '#007bff',
    'plan-personalizado': '#28a745',
    'seguimiento-proyecto': '#ff9800'
};

/**
 * Convierte una fecha del servidor a fecha local sin problemas de zona horaria
 */
function parseServerDate(dateString) {
    if (!dateString) return null;
    
    // Si ya es un objeto Date, extraer la fecha
    if (dateString instanceof Date) {
        dateString = dateString.toISOString();
    }
    
    // Extraer solo la parte de fecha (YYYY-MM-DD) para evitar problemas de zona horaria
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Crear fecha local sin conversión de zona horaria
    return new Date(year, month - 1, day);
}

/**
 * FUNCIÓN PRINCIPAL: Inicialización del módulo de citas cliente
 */
function initClientAppointmentsModule() {
    console.log('🎯 Inicializando módulo de citas para cliente...');
    
    try {
        // Verificar que estemos en la sección de citas
        const appointmentsSection = document.getElementById('appointments');
        if (!appointmentsSection || !appointmentsSection.classList.contains('active')) {
            console.log('ℹ️ Sección de citas no activa, esperando...');
            return;
        }
        
        // Configurar eventos específicos del cliente
        setupClientAppointmentsEvents();
        
        // Cargar datos de citas del cliente
        loadClientAppointmentsData();
        
        // Configurar filtros del cliente
        setupClientAppointmentsFilters();
        
        // Configurar vista de calendario del cliente
        setupClientCalendarView();
        
        // Configurar vista de lista del cliente
        setupClientListView();
        
        console.log('✅ Módulo de citas para cliente inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar módulo de citas cliente:', error);
        if (typeof showToast === 'function') {
            showToast('Error al inicializar módulo de citas', 'error');
        }
    }
}

/**
 * Configurar eventos específicos del cliente
 */
function setupClientAppointmentsEvents() {
    console.log('🔧 Configurando eventos de citas para cliente...');
    
    // Botón de agendar nueva cita
    const scheduleBtn = document.getElementById('schedule-new-appointment-btn');
    if (scheduleBtn) {
        // Remover eventos anteriores
        scheduleBtn.replaceWith(scheduleBtn.cloneNode(true));
        const newScheduleBtn = document.getElementById('schedule-new-appointment-btn');
        
        newScheduleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📅 Cliente solicita nueva cita');
            openClientAppointmentModal();
        });
        console.log('✅ Botón agendar cita configurado');
    }
    
    // Tabs de vista (calendario vs lista)
    const viewTabs = document.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchClientAppointmentView(view);
        });
    });
    
    // Navegación del calendario
    const prevMonthBtn = document.getElementById('client-prev-month-btn');
    const nextMonthBtn = document.getElementById('client-next-month-btn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => navigateClientCalendar(-1));
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => navigateClientCalendar(1));
    }
    
    // Búsqueda de citas del cliente
    const appointmentSearchBtn = document.getElementById('client-appointment-search-btn');
    const appointmentSearchInput = document.getElementById('client-appointment-search');
    
    if (appointmentSearchBtn) {
        appointmentSearchBtn.addEventListener('click', searchClientAppointments);
    }
    
    if (appointmentSearchInput) {
        appointmentSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchClientAppointments();
            }
        });
        
        // Búsqueda en tiempo real
        appointmentSearchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                searchClientAppointments();
            }, 500);
        });
    }
    
    console.log('🎯 Eventos de citas cliente configurados');
}

/**
 * Cargar datos de citas del cliente - VERSIÓN CORREGIDA
 */
async function loadClientAppointmentsData() {
    console.log('📅 Cargando citas del cliente...');
    
    try {
        const token = localStorage.getItem('authToken');
        const user = window.currentUser;
        
        if (!token || !user) {
            throw new Error('No hay datos de autenticación');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/appointments?usuario=${user._id}&limit=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar citas');
        }
        
        const data = await response.json();
        console.log('📊 Citas del cliente cargadas:', data);
        
        clientAppointmentsData = data.data || [];
        
        // ✅ CORRECCIÓN: Procesar las fechas correctamente
        clientAppointmentsData.forEach(appointment => {
            if (appointment.fecha) {
                // Usar la función corregida para parsear fechas del servidor
                appointment.fecha = parseServerDate(appointment.fecha);
                console.log(`📅 Fecha procesada: ${appointment.fecha.toLocaleDateString()}`);
            }
        });
        
        filteredClientAppointmentsData = [...clientAppointmentsData];
        
        console.log(`✅ ${clientAppointmentsData.length} citas del cliente cargadas y fechas corregidas`);
        
        // Renderizar vista actual
        if (currentClientViewMode === 'calendar') {
            renderClientCalendarView();
        } else {
            renderClientAppointmentsList();
        }
        
        updateClientAppointmentsStatistics();
        
    } catch (error) {
        console.error('❌ Error al cargar citas del cliente:', error);
        if (typeof showToast === 'function') {
            showToast('Error al cargar citas', 'error');
        }
        showEmptyClientAppointments();
    }
}


/**
 * Abrir modal para agendar nueva cita (cliente)
 */
function openClientAppointmentModal(appointmentData = null) {
    console.log('🎯 Abriendo modal de cita para cliente...');
    
    const isEditing = appointmentData !== null;
    const modalTitle = isEditing ? 'Modificar Cita' : 'Agendar Nueva Cita';
    const submitButtonText = isEditing ? 'Guardar Cambios' : 'Solicitar Cita';
    
    // Limpiar modales existentes
    const existingModal = document.getElementById('client-appointment-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const user = window.currentUser;
    
    // Generar opciones de horarios
    let timeOptionsHTML = '<option value="">-- Seleccionar hora --</option>';
    CLIENT_AVAILABLE_TIMES.forEach(time => {
        const isSelected = appointmentData?.hora === time ? 'selected' : '';
        const timeFormatted = formatClientTime(time);
        
        timeOptionsHTML += `<option value="${time}" ${isSelected}>${timeFormatted}</option>`;
    });
    
    // ✅ CORRECCIÓN: Fecha por defecto correcta
    const defaultDate = appointmentData?.fecha 
        ? formatClientDateForInput(appointmentData.fecha)
        : formatClientDateForInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
    
    // ✅ CORRECCIÓN: Fecha mínima correcta
    const minDate = formatClientDateForInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
    
    
    // HTML del modal
    const modalHTML = `
        <div class="modal active" id="client-appointment-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2><i class="far fa-calendar-plus"></i> ${modalTitle}</h2>
                    <button type="button" class="close-btn" id="close-client-appointment-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="client-appointment-form" novalidate>
                        
                        <!-- Información informativa -->
                        <div class="form-info-box" style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 5px solid #2196F3;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <i class="fas fa-info-circle" style="color: #2196F3; font-size: 20px;"></i>
                                <h4 style="margin: 0; color: #1976D2;">Información sobre tu Cita</h4>
                            </div>
                            <ul style="margin: 0; color: #1565C0; line-height: 1.6;">
                                <li>Tu solicitud será revisada por nuestro equipo</li>
                                <li>Recibirás confirmación por correo electrónico</li>
                                <li>Puedes modificar o cancelar hasta 24 horas antes</li>
                            </ul>
                        </div>
                        
                        <!-- Tipo de Cita -->
                        <div class="form-group">
                            <label for="client-appointment-type">
                                <i class="fas fa-tag"></i> Tipo de Cita <span style="color: red;">*</span>
                            </label>
                            <select id="client-appointment-type" name="tipo" required class="form-control">
                                <option value="">-- ¿Qué tipo de cita necesitas? --</option>
                                <option value="consulta-general" ${appointmentData?.tipo === 'consulta-general' ? 'selected' : ''}>
                                    💬 Consulta General - Hablar sobre tus ideas
                                </option>
                                <option value="plan-personalizado" ${appointmentData?.tipo === 'plan-personalizado' ? 'selected' : ''}>
                                    📋 Plan Personalizado - Crear estrategia específica
                                </option>
                                <option value="seguimiento-proyecto" ${appointmentData?.tipo === 'seguimiento-proyecto' ? 'selected' : ''}>
                                    📊 Seguimiento de Proyecto - Revisar progreso
                                </option>
                            </select>
                            <small class="form-hint">Selecciona el tipo que mejor describa lo que necesitas</small>
                        </div>
                        
                        <!-- Selector de Proyecto (para seguimiento) -->
                        <div class="form-group" id="client-project-select-container" style="display: none;">
                            <label for="client-appointment-project">
                                <i class="fas fa-project-diagram"></i> Proyecto a Revisar <span style="color: red;">*</span>
                            </label>
                            <select id="client-appointment-project" name="proyecto" class="form-control">
                                <option value="">Cargando tus proyectos...</option>
                            </select>
                            <small class="form-hint">Selecciona el proyecto del que quieres hablar</small>
                        </div>
                        
                        <!-- Fecha y Hora -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="client-appointment-date">
                                    <i class="far fa-calendar"></i> Fecha Preferida <span style="color: red;">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    id="client-appointment-date" 
                                    name="fecha" 
                                    value="${defaultDate}" 
                                    required 
                                    min="${formatClientDateForInput(new Date(Date.now() + 24 * 60 * 60 * 1000))}"
                                    class="form-control"
                                >
                                <small class="form-hint">Selecciona tu fecha preferida (mínimo 24 horas de anticipación)</small>
                            </div>
                            <div class="form-group">
                                <label for="client-appointment-time">
                                    <i class="far fa-clock"></i> Hora Preferida <span style="color: red;">*</span>
                                </label>
                                <select id="client-appointment-time" name="hora" required class="form-control">
                                    ${timeOptionsHTML}
                                </select>
                                <small class="form-hint">Horario de atención: 9:00 AM - 6:00 PM</small>
                            </div>
                        </div>
                        
                        <!-- Descripción/Notas -->
                        <div class="form-group">
                            <label for="client-appointment-notes">
                                <i class="fas fa-sticky-note"></i> Cuéntanos más sobre lo que necesitas
                            </label>
                            <textarea 
                                id="client-appointment-notes" 
                                name="notas" 
                                rows="4" 
                                placeholder="Describe brevemente qué te gustaría discutir en la cita, tus objetivos, o cualquier información relevante que nos ayude a prepararnos mejor..."
                                class="form-control"
                            >${appointmentData?.notas || ''}</textarea>
                            <small class="form-hint">Esta información nos ayuda a preparar mejor tu cita</small>
                        </div>
                        
                        <!-- Datos de Contacto (confirmación) -->
                        <div class="contact-confirmation" style="background: rgba(76, 175, 80, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                            <h4 style="margin: 0 0 15px 0; color: #2E7D32; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-user-check"></i> Confirmación de Contacto
                            </h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Tu Nombre:</label>
                                    <input type="text" value="${user?.nombre || ''} ${user?.apellidos || ''}" readonly class="form-control" style="background: #f5f5f5;">
                                </div>
                                <div class="form-group">
                                    <label>Tu Email:</label>
                                    <input type="email" value="${user?.correo || ''}" readonly class="form-control" style="background: #f5f5f5;">
                                </div>
                            </div>
                            <small style="color: #2E7D32;">✅ Enviaremos la confirmación a este correo</small>
                        </div>
                        
                        <!-- Botones de acción -->
                        <div class="form-actions" style="margin-top: 30px;">
                            <button type="button" class="secondary-btn" id="cancel-client-appointment-btn">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="primary-btn" id="save-client-appointment-btn">
                                <i class="fas fa-calendar-check"></i> ${submitButtonText}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos del modal
    setTimeout(() => {
        setupClientAppointmentModalEvents(isEditing, appointmentData);
    }, 100);
    
    console.log('✅ Modal de cita cliente creado');
}

/**
 * Configurar eventos del modal de cita cliente
 */
function setupClientAppointmentModalEvents(isEditing, appointmentData) {
    console.log('🔧 Configurando eventos del modal cliente...');
    
    const modal = document.getElementById('client-appointment-modal');
    const closeBtn = document.getElementById('close-client-appointment-modal');
    const cancelBtn = document.getElementById('cancel-client-appointment-btn');
    const form = document.getElementById('client-appointment-form');
    const typeSelect = document.getElementById('client-appointment-type');
    const projectContainer = document.getElementById('client-project-select-container');
    const projectSelect = document.getElementById('client-appointment-project');
    
    if (!modal || !form) {
        console.error('❌ Modal o formulario cliente no encontrado');
        return;
    }
    
    // Función para cerrar modal
    function closeModal() {
        console.log('🚪 Cerrando modal cliente...');
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
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Manejar cambio de tipo de cita
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            console.log('Tipo seleccionado:', selectedType);
            
            if (selectedType === 'seguimiento-proyecto') {
                if (projectContainer) {
                    projectContainer.style.display = 'block';
                    if (projectSelect) {
                        projectSelect.required = true;
                        loadClientProjectsForAppointment();
                    }
                }
            } else {
                if (projectContainer) {
                    projectContainer.style.display = 'none';
                }
                if (projectSelect) {
                    projectSelect.required = false;
                }
            }
        });
        
        // Trigger inicial si es edición
        if (isEditing && appointmentData?.tipo === 'seguimiento-proyecto') {
            setTimeout(() => {
                if (projectContainer) projectContainer.style.display = 'block';
                if (projectSelect) {
                    projectSelect.required = true;
                    loadClientProjectsForAppointment().then(() => {
                        if (appointmentData.proyecto) {
                            projectSelect.value = appointmentData.proyecto;
                        }
                    });
                }
            }, 100);
        }
    }
    
    // Envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (isEditing) {
            handleClientAppointmentUpdate(e, appointmentData);
        } else {
            handleClientAppointmentCreate(e);
        }
    });
    
    console.log('✅ Eventos del modal cliente configurados');
}

/**
 * Cargar proyectos del cliente para el selector
 */
async function loadClientProjectsForAppointment() {
    console.log('📋 Cargando proyectos del cliente...');
    
    const projectSelect = document.getElementById('client-appointment-project');
    if (!projectSelect) return;
    
    const user = window.currentUser;
    if (!user) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/projects?cliente=${user._id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        const data = await response.json();
        const projects = data.data || [];
        
        // Generar opciones
        let optionsHTML = '<option value="">-- Selecciona tu proyecto --</option>';
        
        if (projects.length > 0) {
            projects.forEach(project => {
                const estadoInfo = project.estado ? ` (${project.estado})` : '';
                optionsHTML += `<option value="${project._id}">
                    ${project.nombre}${estadoInfo}
                </option>`;
            });
        } else {
            optionsHTML += '<option value="" disabled>No tienes proyectos disponibles</option>';
        }
        
        projectSelect.innerHTML = optionsHTML;
        
        console.log(`✅ ${projects.length} proyectos cargados`);
        
    } catch (error) {
        console.error('❌ Error al cargar proyectos:', error);
        projectSelect.innerHTML = '<option value="">Error al cargar proyectos</option>';
    }
}

/**
 * Manejar creación de nueva cita - VERSIÓN CORREGIDA
 */
async function handleClientAppointmentCreate(e) {
    console.log('📝 Creando nueva cita cliente...');
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-client-appointment-btn');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando Solicitud...';
        
        const user = window.currentUser;
        if (!user) {
            throw new Error('No hay datos de usuario');
        }
        
        // ✅ CORRECCIÓN: Manejar fecha correctamente
        const fechaInput = document.getElementById('client-appointment-date')?.value || '';
        
        // Recopilar datos
        const appointmentData = {
            usuario: user._id,
            tipo: document.getElementById('client-appointment-type')?.value || '',
            fecha: fechaInput, // Enviar como string YYYY-MM-DD
            hora: document.getElementById('client-appointment-time')?.value || '',
            notas: document.getElementById('client-appointment-notes')?.value?.trim() || '',
            estado: 'pendiente'
        };
        
        // Agregar proyecto si es necesario
        const projectSelect = document.getElementById('client-appointment-project');
        if (projectSelect && projectSelect.style.display !== 'none' && projectSelect.value) {
            appointmentData.proyecto = projectSelect.value;
        }
        
        console.log('📊 Datos de cita cliente:', appointmentData);
        
        // Validaciones
        const errors = [];
        if (!appointmentData.tipo) errors.push('Selecciona el tipo de cita');
        if (!appointmentData.fecha) errors.push('Selecciona una fecha');
        if (!appointmentData.hora) errors.push('Selecciona una hora');
        
        if (appointmentData.tipo === 'seguimiento-proyecto' && !appointmentData.proyecto) {
            errors.push('Selecciona un proyecto para el seguimiento');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('\n• '));
        }
        
        // Enviar a la API
        const token = localStorage.getItem('authToken');
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
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear cita');
        }
        
        const responseData = await response.json();
        console.log('✅ Cita cliente creada:', responseData);
        
        if (typeof showToast === 'function') {
            showToast('¡Cita solicitada correctamente! Recibirás confirmación por correo.', 'success');
        }
        
        // Recargar datos y cerrar modal
        await loadClientAppointmentsData();
        closeClientAppointmentModal();
        
    } catch (error) {
        console.error('❌ Error al crear cita cliente:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al solicitar cita', 'error');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Manejar actualización de cita - VERSIÓN CORREGIDA
 */
async function handleClientAppointmentUpdate(e, appointmentData) {
    console.log('📝 Actualizando cita cliente...');
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-client-appointment-btn');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando Cambios...';
        
        // Verificar si la cita se puede modificar
        if (appointmentData.estado === 'completada') {
            throw new Error('No puedes modificar una cita ya completada');
        }
        
        const now = new Date();
        const appointmentDate = parseServerDate(appointmentData.fecha);
        const timeDiff = appointmentDate - now;
        const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
        
        if (hoursUntilAppointment < 24) {
            throw new Error('No puedes modificar una cita con menos de 24 horas de anticipación');
        }
        
        // ✅ CORRECCIÓN: Manejar fecha correctamente
        const fechaInput = document.getElementById('client-appointment-date')?.value || '';
        
        // Recopilar datos actualizados
        const updatedData = {
            tipo: document.getElementById('client-appointment-type')?.value || '',
            fecha: fechaInput, // Enviar como string YYYY-MM-DD
            hora: document.getElementById('client-appointment-time')?.value || '',
            notas: document.getElementById('client-appointment-notes')?.value?.trim() || ''
        };
        
        // Agregar proyecto si es necesario
        const projectSelect = document.getElementById('client-appointment-project');
        if (projectSelect && projectSelect.style.display !== 'none') {
            updatedData.proyecto = projectSelect.value || null;
        }
        
        // Validaciones
        const errors = [];
        if (!updatedData.tipo) errors.push('Selecciona el tipo de cita');
        if (!updatedData.fecha) errors.push('Selecciona una fecha');
        if (!updatedData.hora) errors.push('Selecciona una hora');
        
        if (updatedData.tipo === 'seguimiento-proyecto' && !updatedData.proyecto) {
            errors.push('Selecciona un proyecto para el seguimiento');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('\n• '));
        }
        
        // Enviar actualización
        const token = localStorage.getItem('authToken');
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
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar cita');
        }
        
        if (typeof showToast === 'function') {
            showToast('Cita actualizada correctamente', 'success');
        }
        
        // Recargar datos y cerrar modal
        await loadClientAppointmentsData();
        closeClientAppointmentModal();
        
    } catch (error) {
        console.error('❌ Error al actualizar cita cliente:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al actualizar cita', 'error');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Cerrar modal de cita cliente
 */
function closeClientAppointmentModal() {
    const modal = document.getElementById('client-appointment-modal');
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
 * Cambiar entre vista de calendario y lista (cliente)
 */
function switchClientAppointmentView(view) {
    console.log(`🔄 Cambiando vista cliente a: ${view}`);
    
    currentClientViewMode = view;
    
    // Actualizar tabs activos
    const viewTabs = document.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-view') === view) {
            tab.classList.add('active');
        }
    });
    
    // Mostrar/ocultar vistas
    const calendarView = document.getElementById('client-appointments-calendar');
    const listView = document.getElementById('client-appointments-list-view');
    
    if (view === 'calendar') {
        if (calendarView) calendarView.classList.add('active');
        if (listView) listView.classList.remove('active');
        renderClientCalendarView();
    } else {
        if (calendarView) calendarView.classList.remove('active');
        if (listView) listView.classList.add('active');
        renderClientAppointmentsList();
    }
}

/**
 * Configurar vista de calendario del cliente
 */
function setupClientCalendarView() {
    console.log('📅 Configurando vista de calendario cliente...');
    renderClientCalendarView();
    console.log('✅ Vista de calendario cliente configurada');
}

/**
 * Renderizar vista de calendario del cliente
 */
function renderClientCalendarView() {
    console.log('🎨 Renderizando calendario cliente...');
    
    const calendarTitle = document.getElementById('client-calendar-title');
    const calendarBody = document.getElementById('client-calendar-body');
    
    if (!calendarTitle || !calendarBody) {
        console.warn('⚠️ Elementos de calendario cliente no encontrados');
        return;
    }
    
    // Actualizar título del mes
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    calendarTitle.textContent = `${monthNames[currentClientCalendarDate.getMonth()]} ${currentClientCalendarDate.getFullYear()}`;
    
    // Generar HTML del calendario
    const calendarHTML = generateClientCalendarHTML();
    calendarBody.innerHTML = calendarHTML;
    
    console.log('✅ Calendario cliente renderizado');
}

/**
 * Generar HTML del calendario - VERSIÓN CORREGIDA
 */
function generateClientCalendarHTML() {
    const year = currentClientCalendarDate.getFullYear();
    const month = currentClientCalendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    let calendarHTML = '';
    let dayCount = 1;
    let nextMonthDayCount = 1;
    
    for (let week = 0; week < 6; week++) {
        calendarHTML += '<tr>';
        
        for (let day = 0; day < 7; day++) {
            const cellNumber = week * 7 + day;
            
            if (cellNumber < startingDayOfWeek) {
                const dayNum = daysInPrevMonth - startingDayOfWeek + cellNumber + 1;
                calendarHTML += `<td class="calendar-day other-month">${dayNum}</td>`;
                
            } else if (dayCount <= daysInMonth) {
                // ✅ CORRECCIÓN: Crear fecha local correctamente
                const currentDate = new Date(year, month, dayCount);
                const isToday = isClientDateToday(currentDate);
                const dayAppointments = getClientAppointmentsByDate(currentDate);
                
                let dayClass = 'calendar-day';
                if (isToday) dayClass += ' current-day';
                if (dayAppointments.length > 0) dayClass += ' has-appointments';
                
                calendarHTML += `<td class="${dayClass}" data-date="${formatClientDateForInput(currentDate)}">
                    <div class="day-number">${dayCount}</div>
                    ${generateClientDayAppointments(dayAppointments)}
                </td>`;
                
                dayCount++;
                
            } else {
                calendarHTML += `<td class="calendar-day other-month">${nextMonthDayCount}</td>`;
                nextMonthDayCount++;
            }
        }
        
        calendarHTML += '</tr>';
        
        if (dayCount > daysInMonth && week >= 4) {
            break;
        }
    }
    
    return calendarHTML;
}

/**
 * Generar citas del día para el calendario del cliente
 */
function generateClientDayAppointments(appointments) {
    if (appointments.length === 0) return '';
    
    let appointmentsHTML = '<div class="day-appointments">';
    
    const maxVisible = 2;
    const visibleAppointments = appointments.slice(0, maxVisible);
    
    visibleAppointments.forEach(appointment => {
        const appointmentColor = CLIENT_APPOINTMENT_COLORS[appointment.tipo] || '#007bff';
        const statusClass = appointment.estado.toLowerCase();
        
        appointmentsHTML += `
            <div class="day-appointment client-appointment ${statusClass}" 
                 style="background-color: ${appointmentColor};" 
                 title="${appointment.hora} - ${CLIENT_APPOINTMENT_TYPES[appointment.tipo]} (${CLIENT_APPOINTMENT_STATUSES[appointment.estado]})"
                 onclick="viewClientAppointment('${appointment._id}')">
                <span class="appointment-time">${appointment.hora}</span>
                <span class="appointment-type">${CLIENT_APPOINTMENT_TYPES[appointment.tipo].substring(0, 10)}...</span>
            </div>
        `;
    });
    
    if (appointments.length > maxVisible) {
        const remaining = appointments.length - maxVisible;
        appointmentsHTML += `
            <div class="day-appointment more-appointments" onclick="showClientDayAppointments('${formatClientDateForInput(appointments[0].fecha)}')">
                +${remaining} más
            </div>
        `;
    }
    
    appointmentsHTML += '</div>';
    return appointmentsHTML;
}

/**
 * Navegar calendario del cliente
 */
function navigateClientCalendar(direction) {
    console.log('🗓️ Navegando calendario cliente:', direction > 0 ? 'siguiente' : 'anterior');
    
    currentClientCalendarDate.setMonth(currentClientCalendarDate.getMonth() + direction);
    renderClientCalendarView();
}

/**
 * Configurar vista de lista del cliente
 */
function setupClientListView() {
    console.log('📋 Configurando vista de lista cliente...');
    renderClientAppointmentsList();
    console.log('✅ Vista de lista cliente configurada');
}

/**
 * Renderizar lista de citas - VERSIÓN CORREGIDA
 */
function renderClientAppointmentsList() {
    console.log('🎨 Renderizando lista de citas cliente...');
    
    const tableBody = document.querySelector('#client-appointments-table tbody');
    if (!tableBody) {
        console.warn('⚠️ Tabla de citas cliente no encontrada');
        return;
    }
    
    if (filteredClientAppointmentsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <div class="empty-state">
                        <i class="far fa-calendar-alt" style="font-size: 48px; margin-bottom: 16px; display: block; color: #ddd;"></i>
                        <h4 style="color: #666; margin-bottom: 8px;">No tienes citas programadas</h4>
                        <p style="color: #999; margin-bottom: 20px;">Agenda tu primera cita para comenzar</p>
                        <button class="primary-btn" onclick="openClientAppointmentModal()">
                            <i class="far fa-calendar-plus"></i> Agendar Cita
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = filteredClientAppointmentsData.map(appointment => {
        // ✅ CORRECCIÓN: Formatear fecha correctamente
        const appointmentDate = appointment.fecha 
            ? parseServerDate(appointment.fecha).toLocaleDateString('es-ES')
            : 'N/A';
        
        const statusClass = appointment.estado.toLowerCase().replace(' ', '-');
        const typeClass = appointment.tipo.toLowerCase().replace('-', '');
        
        const projectName = appointment.proyectoDetalles?.nombre || 'N/A';
        
        // Determinar acciones disponibles
        const now = new Date();
        const appointmentDateTime = appointment.fecha ? parseServerDate(appointment.fecha) : null;
        const canModify = appointmentDateTime && 
                         appointmentDateTime > now && 
                         (appointmentDateTime - now) > (24 * 60 * 60 * 1000) && 
                         appointment.estado !== 'completada' && 
                         appointment.estado !== 'cancelada';
        
        const canCancel = appointment.estado === 'pendiente' || appointment.estado === 'confirmada';
        
        return `
            <tr class="appointment-row" data-appointment-id="${appointment._id}">
                <td>
                    <span class="appointment-type-badge ${typeClass}">
                        ${CLIENT_APPOINTMENT_TYPES[appointment.tipo]}
                    </span>
                </td>
                <td>${appointmentDate}</td>
                <td class="appointment-time">
                    <i class="far fa-clock"></i>
                    ${appointment.hora}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${CLIENT_APPOINTMENT_STATUSES[appointment.estado]}
                    </span>
                </td>
                <td>${appointment.tipo === 'seguimiento-proyecto' ? projectName : 'N/A'}</td>
                <td class="appointment-notes">
                    ${appointment.notas ? 
                        (appointment.notas.length > 50 ? 
                            appointment.notas.substring(0, 50) + '...' : 
                            appointment.notas) 
                        : 'Sin notas'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="Ver detalles" onclick="viewClientAppointment('${appointment._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canModify ? `
                            <button class="action-btn edit-btn" title="Modificar cita" onclick="editClientAppointment('${appointment._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${canCancel ? `
                            <button class="action-btn cancel-btn" title="Cancelar cita" onclick="cancelClientAppointment('${appointment._id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
    
    console.log(`✅ ${filteredClientAppointmentsData.length} citas cliente renderizadas con fechas corregidas`);
}

/**
 * Configurar filtros del cliente
 */
function setupClientAppointmentsFilters() {
    console.log('🔧 Configurando filtros cliente...');
    
    const filterType = document.getElementById('client-appointment-filter-type');
    const filterStatus = document.getElementById('client-appointment-filter-status');
    const filterDate = document.getElementById('client-appointment-date-filter');
    
    if (filterType) {
        filterType.addEventListener('change', applyClientAppointmentsFilters);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', applyClientAppointmentsFilters);
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', applyClientAppointmentsFilters);
    }
    
    console.log('✅ Filtros cliente configurados');
}

/**
 * Aplicar filtros de citas del cliente
 */
function applyClientAppointmentsFilters() {
    console.log('🔍 Aplicando filtros cliente...');
    
    const filterType = document.getElementById('client-appointment-filter-type')?.value || 'all';
    const filterStatus = document.getElementById('client-appointment-filter-status')?.value || 'all';
    const filterDate = document.getElementById('client-appointment-date-filter')?.value || '';
    const searchTerm = document.getElementById('client-appointment-search')?.value?.toLowerCase() || '';
    
    filteredClientAppointmentsData = clientAppointmentsData.filter(appointment => {
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
            const projectName = appointment.proyectoDetalles?.nombre || '';
            
            searchMatch = (
                projectName.toLowerCase().includes(searchTerm) ||
                appointment.notas?.toLowerCase().includes(searchTerm) ||
                CLIENT_APPOINTMENT_TYPES[appointment.tipo]?.toLowerCase().includes(searchTerm) ||
                CLIENT_APPOINTMENT_STATUSES[appointment.estado]?.toLowerCase().includes(searchTerm)
            );
        }
        
        return typeMatch && statusMatch && dateMatch && searchMatch;
    });
    
    console.log(`🎯 Filtros cliente aplicados: ${filteredClientAppointmentsData.length} de ${clientAppointmentsData.length} citas`);
    
    // Renderizar vista actual
    if (currentClientViewMode === 'list') {
        renderClientAppointmentsList();
    } else {
        renderClientCalendarView();
    }
}

/**
 * Buscar citas del cliente
 */
function searchClientAppointments() {
    console.log('🔍 Buscando citas cliente...');
    applyClientAppointmentsFilters();
}

/**
 * Ver detalles de una cita del cliente
 */
function viewClientAppointment(appointmentId) {
    console.log('👁️ Viendo cita cliente:', appointmentId);
    
    const appointment = clientAppointmentsData.find(a => a._id === appointmentId);
    if (appointment) {
        showClientAppointmentDetailsModal(appointment);
    }
}

/**
 * Editar una cita del cliente
 */
function editClientAppointment(appointmentId) {
    console.log('✏️ Editando cita cliente:', appointmentId);
    
    const appointment = clientAppointmentsData.find(a => a._id === appointmentId);
    if (appointment) {
        // Verificar si se puede editar
        const now = new Date();
        const appointmentDate = new Date(appointment.fecha);
        const timeDiff = appointmentDate - now;
        const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
        
        if (hoursUntilAppointment < 24) {
            if (typeof showToast === 'function') {
                showToast('No puedes modificar una cita con menos de 24 horas de anticipación', 'warning');
            }
            return;
        }
        
        if (appointment.estado === 'completada') {
            if (typeof showToast === 'function') {
                showToast('No puedes modificar una cita ya completada', 'warning');
            }
            return;
        }
        
        openClientAppointmentModal(appointment);
    }
}

/**
 * Cancelar una cita del cliente
 */
async function cancelClientAppointment(appointmentId) {
    console.log('❌ Cancelando cita cliente:', appointmentId);
    
    const appointment = clientAppointmentsData.find(a => a._id === appointmentId);
    if (!appointment) {
        if (typeof showToast === 'function') {
            showToast('Cita no encontrada', 'error');
        }
        return;
    }
    
    // Confirmar cancelación
    if (!confirm(`¿Estás seguro de que deseas cancelar tu cita del ${new Date(appointment.fecha).toLocaleDateString('es-ES')} a las ${appointment.hora}?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: 'cancelada' })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cancelar cita');
        }
        
        if (typeof showToast === 'function') {
            showToast('Cita cancelada correctamente', 'success');
        }
        
        // Recargar datos
        await loadClientAppointmentsData();
        
    } catch (error) {
        console.error('❌ Error al cancelar cita:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al cancelar cita', 'error');
        }
    }
}

/**
 * Mostrar modal de detalles de cita del cliente
 */
function showClientAppointmentDetailsModal(appointment) {
    console.log('👁️ Mostrando detalles de cita cliente:', appointment._id);
    
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
    
    const projectInfo = appointment.proyectoDetalles 
        ? `${appointment.proyectoDetalles.nombre} (${appointment.proyectoDetalles.estado})`
        : 'No asignado';
    
    // Determinar acciones disponibles
    const now = new Date();
    const appointmentDateTime = new Date(appointment.fecha);
    const timeDiff = appointmentDateTime - now;
    const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
    
    const canModify = appointmentDateTime > now && 
                     hoursUntilAppointment > 24 && 
                     appointment.estado !== 'completada' && 
                     appointment.estado !== 'cancelada';
    
    const canCancel = appointment.estado === 'pendiente' || appointment.estado === 'confirmada';
    
    const modalHTML = `
        <div class="modal active" id="client-appointment-details-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2><i class="far fa-calendar-alt"></i> Detalles de tu Cita</h2>
                    <button class="close-btn" id="close-client-appointment-details-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="appointment-details">
                        <div class="appointment-header-details">
                            <div class="appointment-icon" style="background: ${CLIENT_APPOINTMENT_COLORS[appointment.tipo]};">
                                <i class="far fa-calendar-check"></i>
                            </div>
                            <div class="appointment-info">
                                <h3>${CLIENT_APPOINTMENT_TYPES[appointment.tipo]}</h3>
                                <div class="appointment-meta">
                                    <span class="appointment-date-badge">
                                        <i class="far fa-calendar"></i> ${appointmentDate}
                                    </span>
                                    <span class="appointment-time-badge">
                                        <i class="far fa-clock"></i> ${appointment.hora}
                                    </span>
                                    <span class="appointment-status-badge ${appointment.estado.toLowerCase().replace(' ', '-')}">
                                        ${CLIENT_APPOINTMENT_STATUSES[appointment.estado]}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-grid">
                            <div class="detail-section">
                                <h4><i class="fas fa-info-circle"></i> Información de la Cita</h4>
                                <div class="detail-row">
                                    <label>Tipo:</label>
                                    <span>${CLIENT_APPOINTMENT_TYPES[appointment.tipo]}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Estado:</label>
                                    <span class="status-indicator ${appointment.estado}">${CLIENT_APPOINTMENT_STATUSES[appointment.estado]}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Fecha:</label>
                                    <span>${appointmentDate}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Hora:</label>
                                    <span>${appointment.hora}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Solicitada el:</label>
                                    <span>${creationDate}</span>
                                </div>
                            </div>
                            
                            ${appointment.tipo === 'seguimiento-proyecto' ? `
                                <div class="detail-section">
                                    <h4><i class="fas fa-project-diagram"></i> Proyecto Asociado</h4>
                                    <div class="detail-row">
                                        <label>Proyecto:</label>
                                        <span>${projectInfo}</span>
                                    </div>
                                    ${appointment.proyectoDetalles ? `
                                        <div class="detail-row">
                                            <label>Progreso del Proyecto:</label>
                                            <span>${appointment.proyectoDetalles.porcentajeProgreso || 0}%</span>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            ${appointment.notas ? `
                                <div class="detail-section">
                                    <h4><i class="fas fa-sticky-note"></i> Tus Notas</h4>
                                    <div class="detail-row full-width">
                                        <div class="notes-content">
                                            <p>${appointment.notas}</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div class="detail-section">
                                <h4><i class="fas fa-exclamation-circle"></i> Información Importante</h4>
                                <div class="info-content">
                                    ${appointment.estado === 'pendiente' ? `
                                        <p><i class="fas fa-clock text-warning"></i> <strong>Pendiente de confirmación:</strong> Recibirás un correo cuando sea confirmada por nuestro equipo.</p>
                                    ` : ''}
                                    ${appointment.estado === 'confirmada' ? `
                                        <p><i class="fas fa-check-circle text-success"></i> <strong>Confirmada:</strong> Tu cita está confirmada. Te esperamos en la fecha y hora programada.</p>
                                    ` : ''}
                                    ${appointment.estado === 'cancelada' ? `
                                        <p><i class="fas fa-times-circle text-danger"></i> <strong>Cancelada:</strong> Esta cita ha sido cancelada.</p>
                                    ` : ''}
                                    ${appointment.estado === 'completada' ? `
                                        <p><i class="fas fa-check-double text-success"></i> <strong>Completada:</strong> Esta cita se ha realizado exitosamente.</p>
                                    ` : ''}
                                    ${canModify ? `
                                        <p><i class="fas fa-info-circle text-info"></i> Puedes modificar esta cita hasta 24 horas antes de la fecha programada.</p>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions" style="margin-top: 30px;">
                        ${canModify ? `
                            <button type="button" class="secondary-btn" onclick="editClientAppointment('${appointment._id}')">
                                <i class="fas fa-edit"></i> Modificar Cita
                            </button>
                        ` : ''}
                        
                        ${canCancel ? `
                            <button type="button" class="secondary-btn danger-btn" onclick="cancelClientAppointment('${appointment._id}')">
                                <i class="fas fa-times"></i> Cancelar Cita
                            </button>
                        ` : ''}
                        
                        <button type="button" class="primary-btn" id="close-client-appointment-details-btn">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Limpiar modal existente
    const existingModal = document.getElementById('client-appointment-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Insertar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos
    setTimeout(() => {
        const modal = document.getElementById('client-appointment-details-modal');
        const closeBtn = document.getElementById('close-client-appointment-details-modal');
        const closeDetailsBtn = document.getElementById('close-client-appointment-details-btn');
        
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
 * Mostrar estado vacío cuando no hay citas
 */
function showEmptyClientAppointments() {
    console.log('📋 Mostrando estado vacío de citas cliente...');
    
    const calendarBody = document.getElementById('client-calendar-body');
    const tableBody = document.querySelector('#client-appointments-table tbody');
    
    if (currentClientViewMode === 'calendar' && calendarBody) {
        renderClientCalendarView(); // El calendario se mostrará vacío naturalmente
    } else if (currentClientViewMode === 'list' && tableBody) {
        renderClientAppointmentsList(); // La tabla mostrará el estado vacío
    }
}

/**
 * Actualizar estadísticas de citas del cliente
 */
function updateClientAppointmentsStatistics() {
    const totalCitas = clientAppointmentsData.length;
    const citasPendientes = clientAppointmentsData.filter(a => a.estado === 'pendiente').length;
    const citasConfirmadas = clientAppointmentsData.filter(a => a.estado === 'confirmada').length;
    
    const citasProximas = clientAppointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        const appointmentDate = new Date(appointment.fecha);
        const now = new Date();
        return appointmentDate > now && (appointment.estado === 'pendiente' || appointment.estado === 'confirmada');
    }).length;
    
    // Actualizar elementos en el dashboard si existen
    const appointmentsCountElement = document.getElementById('client-appointments-count');
    if (appointmentsCountElement) {
        appointmentsCountElement.textContent = citasProximas;
    }
    
    console.log('📊 Estadísticas citas cliente actualizadas:', {
        total: totalCitas,
        pendientes: citasPendientes,
        confirmadas: citasConfirmadas,
        proximas: citasProximas
    });
}

/**
 * Funciones auxiliares
 */
function formatClientTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Formatea una fecha para input HTML (YYYY-MM-DD) de forma local
 */
function formatClientDateForInput(date) {
    if (!date) return '';
    
    // Asegurar que trabajamos con un objeto Date
    const d = parseServerDate(date) || new Date(date);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Compara dos fechas ignorando la hora y zona horaria
 */
function isSameDate(date1, date2) {
    if (!date1 || !date2) return false;
    
    const d1 = parseServerDate(date1);
    const d2 = parseServerDate(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

/**
 * Verifica si una fecha es hoy (fecha local)
 */
function isClientDateToday(date) {
    if (!date) return false;
    
    const today = new Date();
    const targetDate = parseServerDate(date);
    
    return isSameDate(today, targetDate);
}

/**
 * Obtiene citas por fecha específica (corregido)
 */
function getClientAppointmentsByDate(targetDate) {
    if (!targetDate) return [];
    
    const target = parseServerDate(targetDate);
    
    return clientAppointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        
        const appointmentDate = parseServerDate(appointment.fecha);
        return isSameDate(target, appointmentDate);
    });
}

/**
 * Convierte fecha a string para almacenamiento (mantiene fecha local)
 */
function formatDateForStorage(date) {
    if (!date) return null;
    
    const d = new Date(date);
    
    // Para enviar al servidor, usar formato ISO pero mantener fecha local
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Mostrar citas del día específico (cliente)
 */
function showClientDayAppointments(dateString) {
    console.log('📋 Mostrando citas del día cliente:', dateString);
    
    const dayAppointments = getClientAppointmentsByDate(new Date(dateString));
    if (dayAppointments.length === 0) {
        if (typeof showToast === 'function') {
            showToast('No tienes citas programadas para este día', 'info');
        }
        return;
    }
    
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const modalHTML = `
        <div class="modal active" id="client-day-appointments-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="far fa-calendar-alt"></i> Tus Citas del ${formattedDate}</h2>
                    <button class="close-btn" id="close-client-day-appointments-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="day-appointments-list">
                        ${dayAppointments.map(appointment => {
                            const statusClass = appointment.estado.toLowerCase().replace(' ', '-');
                            
                            return `
                                <div class="appointment-item client-appointment-item">
                                    <div class="appointment-time">
                                        <i class="far fa-clock"></i>
                                        ${appointment.hora}
                                    </div>
                                    <div class="appointment-details">
                                        <h4>${CLIENT_APPOINTMENT_TYPES[appointment.tipo]}</h4>
                                        ${appointment.proyectoDetalles ? `
                                            <p class="appointment-project">
                                                <i class="fas fa-project-diagram"></i> 
                                                ${appointment.proyectoDetalles.nombre}
                                            </p>
                                        ` : ''}
                                        ${appointment.notas ? `
                                            <p class="appointment-notes">${appointment.notas}</p>
                                        ` : ''}
                                    </div>
                                    <div class="appointment-status">
                                        <span class="status-badge ${statusClass}">
                                            ${CLIENT_APPOINTMENT_STATUSES[appointment.estado]}
                                        </span>
                                    </div>
                                    <div class="appointment-actions">
                                        <button class="action-btn view-btn" onclick="viewClientAppointment('${appointment._id}')" title="Ver detalles">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${appointment.estado !== 'completada' && appointment.estado !== 'cancelada' ? `
                                            <button class="action-btn edit-btn" onclick="editClientAppointment('${appointment._id}')" title="Modificar">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="button" class="secondary-btn" onclick="openClientAppointmentModal()">
                            <i class="fas fa-plus"></i> Nueva Cita
                        </button>
                        <button type="button" class="primary-btn" id="close-client-day-modal-btn">Cerrar</button>
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
        const modal = document.getElementById('client-day-appointments-modal');
        const closeBtn = document.getElementById('close-client-day-appointments-modal');
        const closeDayBtn = document.getElementById('close-client-day-modal-btn');
        
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
 * Filtros rápidos para el cliente
 */
function showClientUpcomingAppointments() {
    console.log('📅 Mostrando próximas citas del cliente...');
    
    const statusFilter = document.getElementById('client-appointment-filter-status');
    if (statusFilter) {
        statusFilter.value = 'all';
    }
    
    // Filtrar solo citas futuras
    const now = new Date();
    filteredClientAppointmentsData = clientAppointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        const appointmentDate = new Date(appointment.fecha);
        return appointmentDate > now && (appointment.estado === 'pendiente' || appointment.estado === 'confirmada');
    });
    
    // Cambiar a vista de lista
    if (currentClientViewMode === 'calendar') {
        switchClientAppointmentView('list');
    } else {
        renderClientAppointmentsList();
    }
    
    if (typeof showToast === 'function') {
        showToast(`Mostrando ${filteredClientAppointmentsData.length} citas próximas`, 'info');
    }
}

function showClientPastAppointments() {
    console.log('📅 Mostrando citas pasadas del cliente...');
    
    const now = new Date();
    filteredClientAppointmentsData = clientAppointmentsData.filter(appointment => {
        if (!appointment.fecha) return false;
        const appointmentDate = new Date(appointment.fecha);
        return appointmentDate < now;
    });
    
    // Cambiar a vista de lista
    if (currentClientViewMode === 'calendar') {
        switchClientAppointmentView('list');
    } else {
        renderClientAppointmentsList();
    }
    
    if (typeof showToast === 'function') {
        showToast(`Mostrando ${filteredClientAppointmentsData.length} citas pasadas`, 'info');
    }
}

function clearClientAppointmentsFilters() {
    console.log('🧹 Limpiando filtros de citas cliente...');
    
    // Limpiar todos los filtros
    const filterType = document.getElementById('client-appointment-filter-type');
    const filterStatus = document.getElementById('client-appointment-filter-status');
    const filterDate = document.getElementById('client-appointment-date-filter');
    const searchInput = document.getElementById('client-appointment-search');
    
    if (filterType) filterType.value = 'all';
    if (filterStatus) filterStatus.value = 'all';
    if (filterDate) filterDate.value = '';
    if (searchInput) searchInput.value = '';
    
    // Restaurar datos originales
    filteredClientAppointmentsData = [...clientAppointmentsData];
    
    // Renderizar vista actual
    if (currentClientViewMode === 'list') {
        renderClientAppointmentsList();
    } else {
        renderClientCalendarView();
    }
    
    if (typeof showToast === 'function') {
        showToast('Filtros limpiados', 'success');
    }
}

/**
 * Refrescar datos de citas del cliente
 */
async function refreshClientAppointmentsData() {
    console.log('🔄 Refrescando datos de citas cliente...');
    
    if (typeof showToast === 'function') {
        showToast('Actualizando tus citas...', 'info');
    }
    
    try {
        await loadClientAppointmentsData();
        
        if (typeof showToast === 'function') {
            showToast('Citas actualizadas correctamente', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error al refrescar citas cliente:', error);
        if (typeof showToast === 'function') {
            showToast('Error al actualizar citas', 'error');
        }
    }
}

/**
 * Limpieza del módulo cliente
 */
function cleanupClientAppointmentsModule() {
    console.log('🧹 Limpiando módulo de citas cliente...');
    
    // Cerrar modales abiertos
    const modals = [
        'client-appointment-modal',
        'client-appointment-details-modal',
        'client-day-appointments-modal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    });
    
    // Restaurar scroll
    document.body.style.overflow = 'auto';
    
    console.log('✅ Módulo de citas cliente limpio');
}

/**
 * Obtener estadísticas de citas del cliente
 */
function getClientAppointmentsStats() {
    const now = new Date();
    
    const stats = {
        total: clientAppointmentsData.length,
        pendientes: clientAppointmentsData.filter(a => a.estado === 'pendiente').length,
        confirmadas: clientAppointmentsData.filter(a => a.estado === 'confirmada').length,
        completadas: clientAppointmentsData.filter(a => a.estado === 'completada').length,
        canceladas: clientAppointmentsData.filter(a => a.estado === 'cancelada').length,
        proximas: clientAppointmentsData.filter(a => {
            if (!a.fecha) return false;
            const appointmentDate = new Date(a.fecha);
            return appointmentDate > now && (a.estado === 'pendiente' || a.estado === 'confirmada');
        }).length,
        pasadas: clientAppointmentsData.filter(a => {
            if (!a.fecha) return false;
            const appointmentDate = new Date(a.fecha);
            return appointmentDate < now;
        }).length,
        porTipo: {
            'consulta-general': clientAppointmentsData.filter(a => a.tipo === 'consulta-general').length,
            'plan-personalizado': clientAppointmentsData.filter(a => a.tipo === 'plan-personalizado').length,
            'seguimiento-proyecto': clientAppointmentsData.filter(a => a.tipo === 'seguimiento-proyecto').length
        }
    };
    
    return stats;
}

/**
 * Mostrar recordatorio de próximas citas del cliente
 */
function showClientAppointmentReminders() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    const upcomingAppointments = clientAppointmentsData.filter(appointment => {
        if (!appointment.fecha || appointment.estado === 'cancelada') {
            return false;
        }
        
        const appointmentDate = new Date(appointment.fecha);
        return appointmentDate >= now && appointmentDate <= tomorrow;
    });
    
    if (upcomingAppointments.length > 0 && typeof showToast === 'function') {
        const message = upcomingAppointments.length === 1 
            ? `Recordatorio: Tienes una cita mañana a las ${upcomingAppointments[0].hora}`
            : `Recordatorio: Tienes ${upcomingAppointments.length} citas próximas`;
        
        showToast(message, 'info');
    }
}

/**
 * Funciones globales para uso externo
 */
window.initClientAppointmentsModule = initClientAppointmentsModule;
window.openClientAppointmentModal = openClientAppointmentModal;
window.viewClientAppointment = viewClientAppointment;
window.editClientAppointment = editClientAppointment;
window.cancelClientAppointment = cancelClientAppointment;
window.showClientDayAppointments = showClientDayAppointments;
window.showClientUpcomingAppointments = showClientUpcomingAppointments;
window.showClientPastAppointments = showClientPastAppointments;
window.clearClientAppointmentsFilters = clearClientAppointmentsFilters;
window.refreshClientAppointmentsData = refreshClientAppointmentsData;
window.cleanupClientAppointmentsModule = cleanupClientAppointmentsModule;

// CSS específico para el módulo de citas del cliente
const clientAppointmentsStyles = document.createElement('style');
clientAppointmentsStyles.textContent = `
    /* Estilos específicos para citas del cliente */
    
    .client-appointment {
        position: relative;
        overflow: hidden;
    }
    
    .client-appointment::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    }
    
    .client-appointment-item {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(69, 160, 73, 0.05) 100%);
        border-left: 4px solid #4CAF50;
        margin-bottom: 15px;
        border-radius: 8px;
        padding: 20px;
        transition: all 0.3s ease;
    }
    
    .client-appointment-item:hover {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(69, 160, 73, 0.1) 100%);
        transform: translateX(5px);
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.2);
    }
    
    .form-info-box {
        background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
        border: 1px solid #2196F3;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 25px;
        position: relative;
        overflow: hidden;
    }
    
    .form-info-box::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 5px;
        background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    }
    
    .form-hint {
        color: #666;
        font-size: 12px;
        margin-top: 5px;
        display: block;
        font-style: italic;
    }
    
    .contact-confirmation {
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid #4CAF50;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        position: relative;
    }
    
    .contact-confirmation::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    }
    
    .status-badge.pendiente {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
        color: white;
    }
    
    .status-badge.confirmada {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
    }
    
    .status-badge.cancelada {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        color: white;
    }
    
    .status-badge.completada {
        background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
        color: white;
    }
    
    .appointment-type-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .appointment-type-badge.consultageneral {
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
    }
    
    .appointment-type-badge.planpersonalizado {
        background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
        color: white;
    }
    
    .appointment-type-badge.seguimientoproyecto {
        background: linear-gradient(135deg, #ff9800 0%, #e65100 100%);
        color: white;
    }
    
    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #666;
    }
    
    .empty-state i {
        font-size: 64px;
        color: #ddd;
        margin-bottom: 20px;
        display: block;
    }
    
    .empty-state h4 {
        color: #666;
        margin-bottom: 12px;
        font-size: 18px;
    }
    
    .empty-state p {
        color: #999;
        margin-bottom: 25px;
        line-height: 1.5;
    }
    
    .day-appointments {
        max-height: 120px;
        overflow-y: auto;
        margin-top: 8px;
    }
    
    .day-appointment.client-appointment {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 6px;
        padding: 8px 10px;
        margin-bottom: 4px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .day-appointment.client-appointment:hover {
        transform: scale(1.02);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .day-appointment.client-appointment.pendiente {
        border-left: 3px solid #ff9800;
    }
    
    .day-appointment.client-appointment.confirmada {
        border-left: 3px solid #4CAF50;
    }
    
    .day-appointment.client-appointment.cancelada {
        border-left: 3px solid #f44336;
        opacity: 0.7;
    }
    
    .day-appointment.client-appointment.completada {
        border-left: 3px solid #2196F3;
    }
    
    .appointment-time {
        font-weight: 600;
        color: #333;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .appointment-type {
        font-size: 10px;
        color:rgb(255, 255, 255);
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
    
    .more-appointments {
        background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
        color: white;
        text-align: center;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .more-appointments:hover {
        background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
    }
    
    .info-content {
        background: rgba(255, 255, 255, 0.05);
        padding: 15px;
        border-radius: 8px;
        margin-top: 10px;
    }
    
    .info-content p {
        margin: 8px 0;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        line-height: 1.5;
    }
    
    .info-content i {
        margin-top: 2px;
        flex-shrink: 0;
    }
    
    .text-warning { color: #ff9800 !important; }
    .text-success { color: #4CAF50 !important; }
    .text-danger { color: #f44336 !important; }
    .text-info { color: #2196F3 !important; }
    
    .danger-btn {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        color: white;
    }
    
    .danger-btn:hover {
        background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
        transform: translateY(-1px);
    }
    
    /* Responsive para móviles */
    @media (max-width: 768px) {
        .client-appointment-item {
            padding: 15px;
            margin-bottom: 12px;
        }
        
        .form-info-box {
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .contact-confirmation {
            padding: 15px;
        }
        
        .empty-state {
            padding: 40px 20px;
        }
        
        .empty-state i {
            font-size: 48px;
        }
        
        .day-appointment.client-appointment {
            padding: 6px 8px;
            font-size: 10px;
        }
    }
`;

document.head.appendChild(clientAppointmentsStyles);

console.log('🎉 MÓDULO DE CITAS CLIENTE COMPLETADO - Todas las funcionalidades implementadas');

// Auto-inicialización cuando se detecta la sección activa
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar si la sección de citas está activa
    setTimeout(() => {
        const appointmentsSection = document.getElementById('appointments');
        if (appointmentsSection && appointmentsSection.classList.contains('active')) {
            initClientAppointmentsModule();
        }
    }, 1000);
});

// Observer para detectar cuando se activa la sección de citas
if (typeof MutationObserver !== 'undefined') {
    const sectionObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'appointments' && target.classList.contains('active')) {
                    setTimeout(() => {
                        initClientAppointmentsModule();
                    }, 100);
                }
            }
        });
    });
    
    // Observar cambios en las secciones del dashboard
    const appointmentsSection = document.getElementById('appointments');
    if (appointmentsSection) {
        sectionObserver.observe(appointmentsSection, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
}