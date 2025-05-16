/**
 * dashboard.js - Parte 1: Inicialización y funciones básicas
 * Funcionalidades principales del dashboard para Crazy Studios
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes UI
    initDashboard();
    
    // Formatear la fecha actual
    displayCurrentDate();
    
    // Cargar datos del usuario
    loadUserData();
    
    // Cargar estadísticas
    loadStatistics();
    
    // Inicializar vistas del dashboard según el rol
    if (document.body.classList.contains('admin-dashboard')) {
        initAdminDashboard();
    } else {
        initClientDashboard();
    }
});

/**
 * Inicializa componentes básicos del dashboard
 */
function initDashboard() {
    // Navegación de secciones
    const sidebarLinks = document.querySelectorAll('.sidebar-menu li');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Quitar clase activa de todos los links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase activa al link clickeado
            this.classList.add('active');
            
            // Obtener la sección a mostrar
            const section = this.getAttribute('data-section');
            
            // Ocultar todas las secciones
            dashboardSections.forEach(s => s.classList.remove('active'));
            
            // Mostrar la sección seleccionada
            document.getElementById(section).classList.add('active');
        });
    });
    
    // Menú de usuario
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('user-dropdown') || document.getElementById('admin-dropdown');
    
    if (userMenu && userDropdown) {
        userMenu.addEventListener('click', function(e) {
            e.preventDefault();
            userDropdown.classList.toggle('active');
            
            // Cerrar el dropdown al hacer click fuera de él
            document.addEventListener('click', function closeDropdown(e) {
                if (!userMenu.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        });
    }
    
    // Cerrar sesión
    const logoutBtn = document.getElementById('logout-btn') || document.getElementById('admin-logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Aquí iría la lógica para cerrar sesión con MongoDB
            // Por ahora solo redireccionamos a la página de login
            window.location.href = '../login.html';
        });
    }
    
    // Inicializar modales
    initModals();
    
    // Inicializar tabs en vista de citas
    initViewTabs();
}

/**
 * Muestra la fecha actual formateada
 */
function displayCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    
    if (currentDateElement) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = now.toLocaleDateString('es-ES', options);
    }
}

/**
 * Carga los datos del usuario desde MongoDB
 */
function loadUserData() {
    // Simulación de datos de usuario
    // En un entorno real, estos datos vendrían de la base de datos MongoDB
    const userData = {
        nombre: 'Juan',
        apellidos: 'Pérez',
        empresa: 'Empresa ABC',
        rol: 'cliente'
    };
    
    // Mostrar el nombre del usuario en el menú
    const userNameElement = document.getElementById('user-name');
    const adminNameElement = document.getElementById('admin-name');
    const welcomeUserNameElement = document.getElementById('welcome-user-name');
    const welcomeAdminNameElement = document.getElementById('welcome-admin-name');
    
    if (userNameElement) {
        userNameElement.textContent = `${userData.nombre} ${userData.apellidos}`;
    }
    
    if (adminNameElement) {
        adminNameElement.textContent = `${userData.nombre} ${userData.apellidos}`;
    }
    
    if (welcomeUserNameElement) {
        welcomeUserNameElement.textContent = userData.nombre;
    }
    
    if (welcomeAdminNameElement) {
        welcomeAdminNameElement.textContent = userData.nombre;
    }
}

/**
 * Carga las estadísticas del dashboard
 */
function loadStatistics() {
    // Simulación de estadísticas
    // En un entorno real, estos datos vendrían de la base de datos MongoDB
    if (document.body.classList.contains('admin-dashboard')) {
        // Estadísticas de administrador
        const stats = {
            clients: 207,
            projects: 43,
            appointments: 15,
            messages: 8
        };
        
        const clientsCountElement = document.getElementById('clients-count');
        const projectsCountElement = document.getElementById('projects-count');
        const appointmentsCountElement = document.getElementById('appointments-count');
        const messagesCountElement = document.getElementById('messages-count');
        
        if (clientsCountElement) clientsCountElement.textContent = stats.clients;
        if (projectsCountElement) projectsCountElement.textContent = stats.projects;
        if (appointmentsCountElement) appointmentsCountElement.textContent = stats.appointments;
        if (messagesCountElement) messagesCountElement.textContent = stats.messages;
    } else {
        // Estadísticas de cliente
        const stats = {
            projects: 3,
            appointments: 2,
            messages: 5
        };
        
        const projectsCountElement = document.getElementById('projects-count');
        const appointmentsCountElement = document.getElementById('appointments-count');
        const messagesCountElement = document.getElementById('messages-count');
        
        if (projectsCountElement) projectsCountElement.textContent = stats.projects;
        if (appointmentsCountElement) appointmentsCountElement.textContent = stats.appointments;
        if (messagesCountElement) messagesCountElement.textContent = stats.messages;
    }
}

/**
 * Inicializa los modales
 */
function initModals() {
    // Funcionalidad para abrir modales
    const modalTriggers = document.querySelectorAll('[data-modal]');
    
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            openModal(modalId);
        });
    });
    
    // Cerrar modales con el botón de cierre
    const closeButtons = document.querySelectorAll('.close-btn');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Cerrar modales haciendo clic fuera del contenido
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
    
    // Configurar botones específicos para abrir modales
    setupModalTriggers();
}

/**
 * Configura los disparadores de modales
 */
function setupModalTriggers() {
    // Botón para nuevo proyecto
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function() {
            openModal('new-project-modal');
        });
    }
    
    // Botón para nueva cita
    const newAppointmentBtn = document.getElementById('new-appointment-btn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', function() {
            openModal('new-appointment-modal');
        });
    }
    
    // Botón para nuevo cliente (solo admin)
    const newClientBtn = document.getElementById('new-client-btn');
    if (newClientBtn) {
        newClientBtn.addEventListener('click', function() {
            openModal('add-client-modal');
        });
    }
    
    // Botón para nuevo mensaje
    const newMessageBtn = document.getElementById('new-message-btn');
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', function() {
            openModal('new-message-modal');
        });
    }
    
    // Botones para ver detalles de proyecto
    const viewProjectBtns = document.querySelectorAll('.project-actions .view-btn');
    viewProjectBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            openModal('project-details-modal');
        });
    });
    
    // Botones para ver detalles de cita
    const viewAppointmentBtns = document.querySelectorAll('.action-buttons .view-btn');
    viewAppointmentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            openModal('appointment-details-modal');
        });
    });
}

/**
 * Abre un modal por su ID
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.classList.add('active');
        
        // Bloquear el scroll del body
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra un modal
 */
function closeModal(modal) {
    modal.classList.remove('active');
    
    // Restaurar el scroll del body
    document.body.style.overflow = 'auto';
}

/**
 * Inicializa las pestañas en la vista de citas
 */
function initViewTabs() {
    const viewTabs = document.querySelectorAll('.view-tab');
    const calendarView = document.querySelector('.calendar-view');
    const listView = document.querySelector('.list-view');
    
    if (viewTabs.length > 0 && calendarView && listView) {
        viewTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Quitar clase activa de todas las pestañas
                viewTabs.forEach(t => t.classList.remove('active'));
                
                // Agregar clase activa a la pestaña clickeada
                this.classList.add('active');
                
                // Mostrar la vista correspondiente
                const view = this.getAttribute('data-view');
                
                if (view === 'calendar') {
                    calendarView.classList.add('active');
                    listView.classList.remove('active');
                } else if (view === 'list') {
                    listView.classList.add('active');
                    calendarView.classList.remove('active');
                }
            });
        });
    }
}

/**
 * Muestra un mensaje toast
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle toast-icon"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle toast-icon"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle toast-icon"></i>';
    }
    
    toast.innerHTML = `
        ${icon}
        <div class="toast-message">${message}</div>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Cerrar el toast al hacer clic en el botón de cierre
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
        toast.classList.add('closing');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Cerrar automáticamente después de 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('closing');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, 5000);
}
/**
 * dashboard.js - Parte 2: Funciones específicas para el cliente
 * Funcionalidades para el dashboard de cliente de Crazy Studios
 */

/**
 * Inicializa las funcionalidades específicas del dashboard de cliente
 */
function initClientDashboard() {
    // Cargar proyectos recientes
    loadRecentProjects();
    
    // Cargar citas próximas
    loadUpcomingAppointments();
    
    // Configurar eventos para botones de "Ver todos"
    setupViewAllButtons();
    
    // Inicializar formularios de proyectos y citas
    setupProjectForm();
    setupAppointmentForm();
    
    // Inicializar funcionalidades de la sección de mensajes
    initClientMessages();
    
    // Inicializar configuración del perfil
    initProfileSettings();
}

/**
 * Carga los proyectos recientes del cliente
 * En un entorno real, estos datos vendrían de MongoDB
 */
function loadRecentProjects() {
    const recentProjectsList = document.getElementById('recent-projects-list');
    const projectsLoading = document.getElementById('projects-loading');
    
    if (!recentProjectsList) return;
    
    // Simular carga de datos (en una aplicación real, aquí harías la petición a MongoDB)
    setTimeout(function() {
        // Ocultar el spinner de carga
        if (projectsLoading) {
            projectsLoading.style.display = 'none';
        }
        
        // Datos de ejemplo (vendrían de MongoDB)
        const projects = [
            {
                id: 1,
                title: 'E-commerce Fashion Store',
                category: 'Desarrollo Web',
                status: 'desarrollo medio',
                progressPercent: 65,
                startDate: '15/03/2025',
                endDate: '15/06/2025'
            },
            {
                id: 2,
                title: 'Campaña Digital Restaurante',
                category: 'Marketing Digital',
                status: 'iniciado',
                progressPercent: 25,
                startDate: '01/05/2025',
                endDate: '01/07/2025'
            }
        ];
        
        // Generar HTML para cada proyecto
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.innerHTML = `
                <div class="project-header">
                    <span class="project-category">${project.category}</span>
                    <span class="project-status" data-status="${project.status}">${formatStatus(project.status)}</span>
                </div>
                <h3 class="project-title">${project.title}</h3>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${project.progressPercent}%;"></div>
                    </div>
                    <span class="progress-text">${project.progressPercent}%</span>
                </div>
                <div class="project-dates">
                    <p><i class="far fa-calendar-alt"></i> Inicio: ${project.startDate}</p>
                    <p><i class="fas fa-calendar-check"></i> Estimado: ${project.endDate}</p>
                </div>
                <div class="project-actions">
                    <button class="action-btn view-btn" title="Ver detalles" data-project-id="${project.id}"><i class="fas fa-eye"></i></button>
                </div>
            `;
            
            recentProjectsList.appendChild(projectCard);
            
            // Agregar evento para ver detalles
            const viewBtn = projectCard.querySelector('.view-btn');
            viewBtn.addEventListener('click', function() {
                openModal('project-details-modal');
                loadProjectDetails(project.id);
            });
        });
    }, 1000);
}

/**
 * Carga las citas próximas del cliente
 */
function loadUpcomingAppointments() {
    const upcomingAppointmentsList = document.getElementById('upcoming-appointments-list');
    const appointmentsLoading = document.getElementById('appointments-loading');
    
    if (!upcomingAppointmentsList) return;
    
    // Simular carga de datos
    setTimeout(function() {
        // Ocultar el spinner de carga
        if (appointmentsLoading) {
            appointmentsLoading.style.display = 'none';
        }
        
        // Datos de ejemplo
        const appointments = [
            {
                id: 1,
                type: 'seguimiento-proyecto',
                date: '16/05/2025',
                time: '10:00 AM',
                status: 'confirmada',
                project: 'E-commerce Fashion Store'
            },
            {
                id: 2,
                type: 'consulta-general',
                date: '20/05/2025',
                time: '11:30 AM',
                status: 'pendiente',
                project: null
            }
        ];
        
        // Generar HTML para cada cita
        appointments.forEach(appointment => {
            const appointmentCard = document.createElement('div');
            appointmentCard.className = 'appointment-card';
            appointmentCard.innerHTML = `
                <div class="appointment-header">
                    <span class="appointment-type" data-type="${appointment.type}">${formatAppointmentType(appointment.type)}</span>
                    <span class="status-badge ${appointment.status}">${formatAppointmentStatus(appointment.status)}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="far fa-calendar-alt"></i> ${appointment.date} | ${appointment.time}</p>
                    ${appointment.project ? `<p><i class="fas fa-project-diagram"></i> Proyecto: ${appointment.project}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    <button class="action-btn view-btn" title="Ver detalles" data-appointment-id="${appointment.id}"><i class="fas fa-eye"></i></button>
                </div>
            `;
            
            upcomingAppointmentsList.appendChild(appointmentCard);
            
            // Agregar evento para ver detalles
            const viewBtn = appointmentCard.querySelector('.view-btn');
            viewBtn.addEventListener('click', function() {
                openModal('appointment-details-modal');
                loadAppointmentDetails(appointment.id);
            });
        });
    }, 1000);
}

/**
 * Configura los botones de "Ver todos"
 */
function setupViewAllButtons() {
    const viewAllProjects = document.getElementById('view-all-projects');
    const viewAllAppointments = document.getElementById('view-all-appointments');
    
    if (viewAllProjects) {
        viewAllProjects.addEventListener('click', function(e) {
            e.preventDefault();
            const projectsTab = document.querySelector('.sidebar-menu li[data-section="projects"]');
            if (projectsTab) projectsTab.click();
        });
    }
    
    if (viewAllAppointments) {
        viewAllAppointments.addEventListener('click', function(e) {
            e.preventDefault();
            const appointmentsTab = document.querySelector('.sidebar-menu li[data-section="appointments"]');
            if (appointmentsTab) appointmentsTab.click();
        });
    }
}

/**
 * Configura el formulario de nuevo proyecto
 */
function setupProjectForm() {
    const newProjectForm = document.getElementById('new-project-form');
    
    if (!newProjectForm) return;
    
    newProjectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Recopilar datos del formulario
        const projectData = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            category: document.getElementById('project-category').value,
            files: document.getElementById('project-files').files
        };
        
        // En una aplicación real, aquí enviarías los datos a MongoDB
        console.log('Datos del proyecto a guardar:', projectData);
        
        // Simulación de éxito
        showToast('Proyecto solicitado con éxito', 'success');
        
        // Cerrar el modal y resetear el formulario
        closeModal(this.closest('.modal'));
        this.reset();
    });
    
    // Manejar el botón de cancelar
    const closeProjectModal = document.getElementById('close-project-modal');
    if (closeProjectModal) {
        closeProjectModal.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
            newProjectForm.reset();
        });
    }
}

/**
 * Configura el formulario de nueva cita
 */
function setupAppointmentForm() {
    const newAppointmentForm = document.getElementById('new-appointment-form');
    
    if (!newAppointmentForm) return;
    
    // Manejar cambio en el tipo de cita para mostrar/ocultar selector de proyecto
    const appointmentType = document.getElementById('appointment-type');
    const projectContainer = document.getElementById('project-select-container');
    
    if (appointmentType && projectContainer) {
        appointmentType.addEventListener('change', function() {
            projectContainer.style.display = this.value === 'seguimiento-proyecto' ? 'block' : 'none';
        });
    }
    
    // Cargar proyectos del cliente para el selector
    loadClientProjects();
    
    // Configurar fechas disponibles
    setupAppointmentDate();
    
    // Manejar envío del formulario
    newAppointmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Recopilar datos del formulario
        const appointmentData = {
            type: appointmentType.value,
            project: document.getElementById('appointment-project')?.value || null,
            date: document.getElementById('appointment-date').value,
            time: document.getElementById('appointment-time').value,
            notes: document.getElementById('appointment-notes').value
        };
        
        // En una aplicación real, aquí enviarías los datos a MongoDB
        console.log('Datos de la cita a guardar:', appointmentData);
        
        // Simulación de éxito
        showToast('Cita agendada con éxito', 'success');
        
        // Cerrar el modal y resetear el formulario
        closeModal(this.closest('.modal'));
        this.reset();
        if (projectContainer) projectContainer.style.display = 'none';
    });
    
    // Manejar el botón de cancelar
    const closeAppointmentModal = document.getElementById('close-appointment-modal');
    if (closeAppointmentModal) {
        closeAppointmentModal.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
            newAppointmentForm.reset();
            if (projectContainer) projectContainer.style.display = 'none';
        });
    }
}

/**
 * Carga los proyectos del cliente para el selector de citas
 */
function loadClientProjects() {
    const projectSelect = document.getElementById('appointment-project');
    
    if (!projectSelect) return;
    
    // Simulación de proyectos (en una aplicación real, estos vendrían de MongoDB)
    const projects = [
        { id: 1, title: 'E-commerce Fashion Store' },
        { id: 2, title: 'Campaña Digital Restaurante' }
    ];
    
    // Añadir opciones al selector
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.title;
        projectSelect.appendChild(option);
    });
}

/**
 * Configura el campo de fecha para citas
 */
function setupAppointmentDate() {
    const dateInput = document.getElementById('appointment-date');
    
    if (!dateInput) return;
    
    // Establecer fecha mínima (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = formatDateForInput(tomorrow);
    
    // Establecer fecha máxima (1 mes adelante)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    dateInput.max = formatDateForInput(maxDate);
    
    // Establecer valor predeterminado (mañana)
    dateInput.value = formatDateForInput(tomorrow);
}

/**
 * Inicializa las funcionalidades de mensajes para el cliente
 */
function initClientMessages() {
    const messagesSection = document.getElementById('messages');
    if (!messagesSection) return;
    
    // Cargar lista de mensajes
    loadClientMessagesList();
    
    // Manejar selección de mensaje
    setupMessageSelection();
    
    // Manejar respuesta de mensajes
    setupMessageReply();
}

/**
 * Inicializa la sección de configuración de perfil
 */
function initProfileSettings() {
    const settingsSection = document.getElementById('settings');
    if (!settingsSection) return;
    
    // Cargar datos del perfil
    loadProfileData();
    
    // Configurar formulario de perfil
    setupProfileForm();
    
    // Configurar formulario de cambio de contraseña
    setupPasswordForm();
    
    // Configurar preferencias de notificaciones
    setupNotificationPreferences();
}

/**
 * Formatea un estado de proyecto para mostrar al usuario
 */
function formatStatus(status) {
    const statusMap = {
        'cotizacion': 'Cotización',
        'pago procesado': 'Pago Procesado',
        'iniciado': 'Iniciado',
        'desarrollo inicial': 'Desarrollo Inicial',
        'desarrollo medio': 'Desarrollo Medio',
        'finalizado': 'Finalizado'
    };
    
    return statusMap[status] || status;
}

/**
 * Formatea un tipo de cita para mostrar al usuario
 */
function formatAppointmentType(type) {
    const typeMap = {
        'consulta-general': 'Consulta General',
        'plan-personalizado': 'Plan Personalizado',
        'seguimiento-proyecto': 'Seguimiento de Proyecto'
    };
    
    return typeMap[type] || type;
}

/**
 * Formatea un estado de cita para mostrar al usuario
 */
function formatAppointmentStatus(status) {
    const statusMap = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'completada': 'Completada'
    };
    
    return statusMap[status] || status;
}

/**
 * Formatea una fecha para usar en inputs type="date"
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * dashboard.js - Parte 3: Funciones específicas para el administrador
 * Funcionalidades para el dashboard de administrador de Crazy Studios
 */

/**
 * Inicializa las funcionalidades específicas del dashboard de administrador
 */
function initAdminDashboard() {
    // Inicializar las secciones principales
    initClientsSection();
    initProjectsSection();
    initAppointmentsSection();
    initMessagesSection();
    initReportsSection();
    initSettingsSection();
    
    // Inicializar gráficos del panel general
    initDashboardCharts();
    
    // Configurar dropdown de crear nuevo
    setupCreateNewDropdown();
}

/**
 * Configura el dropdown para crear elementos nuevos
 */
function setupCreateNewDropdown() {
    const createClientBtn = document.getElementById('create-client');
    const createProjectBtn = document.getElementById('create-project');
    const createAppointmentBtn = document.getElementById('create-appointment');
    
    if (createClientBtn) {
        createClientBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('add-client-modal');
        });
    }
    
    if (createProjectBtn) {
        createProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('add-project-modal');
        });
    }
    
    if (createAppointmentBtn) {
        createAppointmentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('add-appointment-modal');
        });
    }
}

/**
 * Inicializa los gráficos del panel de administrador
 */
function initDashboardCharts() {
    // En una aplicación real, aquí cargarías los datos desde MongoDB
    // y utilizarías una biblioteca de gráficos como Chart.js
    
    console.log('Inicializando gráficos del dashboard');
    
    // Ejemplo de datos para los gráficos
    const projectStatusData = {
        labels: ['Cotización', 'Pago Procesado', 'Iniciado', 'Desarrollo Inicial', 'Desarrollo Medio', 'Finalizado'],
        values: [5, 3, 8, 12, 10, 5]
    };
    
    const clientRegistrationData = {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
        values: [15, 25, 30, 28, 24]
    };
    
    // Simular carga de gráficos
    renderDummyCharts(projectStatusData, clientRegistrationData);
}

/**
 * Renderiza gráficos de ejemplo en el dashboard
 * Nota: En una aplicación real, se usaría Chart.js u otra biblioteca
 */
function renderDummyCharts(projectStatusData, clientRegistrationData) {
    const projectsChart = document.getElementById('projects-status-chart');
    const clientsChart = document.getElementById('clients-register-chart');
    
    if (projectsChart) {
        projectsChart.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <p style="text-align: center; margin: 0 0 10px;">Gráfico de Proyectos por Estado</p>
                <div style="display: flex; width: 100%; height: 150px; align-items: flex-end; justify-content: space-around;">
                    ${projectStatusData.labels.map((label, index) => `
                        <div style="display: flex; flex-direction: column; align-items: center; width: ${100 / projectStatusData.labels.length}%;">
                            <div style="background: linear-gradient(to top, var(--primary-color), var(--secondary-color)); width: 30px; height: ${projectStatusData.values[index] * 5}px; border-radius: 3px 3px 0 0;"></div>
                            <span style="font-size: 0.7rem; margin-top: 5px; text-align: center;">${label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (clientsChart) {
        clientsChart.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <p style="text-align: center; margin: 0 0 10px;">Registro de Clientes por Mes</p>
                <div style="display: flex; width: 100%; height: 150px; align-items: flex-end; justify-content: space-around;">
                    ${clientRegistrationData.labels.map((label, index) => `
                        <div style="display: flex; flex-direction: column; align-items: center; width: ${100 / clientRegistrationData.labels.length}%;">
                            <div style="background: linear-gradient(to top, var(--secondary-color), var(--primary-color)); width: 30px; height: ${clientRegistrationData.values[index] * 3}px; border-radius: 3px 3px 0 0;"></div>
                            <span style="font-size: 0.7rem; margin-top: 5px; text-align: center;">${label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

/**
 * Inicializa la sección de clientes
 */
function initClientsSection() {
    const clientsSection = document.getElementById('clients');
    if (!clientsSection) return;
    
    // Cargar tabla de clientes
    loadClientsTable();
    
    // Configurar filtros de clientes
    setupClientFilters();
    
    // Configurar formulario para añadir cliente
    setupAddClientForm();
    
    // Configurar botones de acción de clientes
    setupClientActions();
}

/**
 * Carga la tabla de clientes
 */
function loadClientsTable() {
    const clientsTable = document.querySelector('#clients-table tbody');
    if (!clientsTable) return;
    
    // Simulación de carga (en una aplicación real, se obtendría de MongoDB)
    const clients = [
        {
            id: 1,
            nombre: 'Juan Pérez',
            email: 'juan.perez@email.com',
            telefono: '+57 300 123 4567',
            empresa: 'Empresa ABC',
            documento: 'CC: 1234567890',
            proyectos: 3,
            fechaRegistro: '10/04/2025'
        },
        {
            id: 2,
            nombre: 'María López',
            email: 'maria.lopez@email.com',
            telefono: '+57 310 987 6543',
            empresa: 'Empresa XYZ',
            documento: 'CC: 0987654321',
            proyectos: 2,
            fechaRegistro: '15/04/2025'
        },
        {
            id: 3,
            nombre: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@email.com',
            telefono: '+57 320 456 7890',
            empresa: 'Tech Innovate',
            documento: 'CC: 5678901234',
            proyectos: 1,
            fechaRegistro: '05/05/2025'
        },
        {
            id: 4,
            nombre: 'Ana González',
            email: 'ana.gonzalez@email.com',
            telefono: '+57 315 789 0123',
            empresa: 'Boutique La Moda',
            documento: 'CC: 9012345678',
            proyectos: 0,
            fechaRegistro: '12/05/2025'
        }
    ];
    
    // Generar filas de la tabla
    clientsTable.innerHTML = clients.map(client => `
        <tr>
            <td>${client.nombre}</td>
            <td>${client.email}</td>
            <td>${client.telefono}</td>
            <td>${client.empresa}</td>
            <td>${client.documento}</td>
            <td><span class="badge">${client.proyectos}</span></td>
            <td>${client.fechaRegistro}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" title="Ver detalles" data-client-id="${client.id}"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" title="Editar" data-client-id="${client.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Eliminar" data-client-id="${client.id}"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Configura los filtros para la tabla de clientes
 */
function setupClientFilters() {
    const clientSearch = document.getElementById('client-search');
    const clientSearchBtn = document.getElementById('client-search-btn');
    const clientFilterProjects = document.getElementById('client-filter-projects');
    const clientFilterDate = document.getElementById('client-filter-date');
    
    if (clientSearchBtn) {
        clientSearchBtn.addEventListener('click', function() {
            filterClients();
        });
    }
    
    if (clientSearch) {
        clientSearch.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                filterClients();
            }
        });
    }
    
    if (clientFilterProjects) {
        clientFilterProjects.addEventListener('change', filterClients);
    }
    
    if (clientFilterDate) {
        clientFilterDate.addEventListener('change', filterClients);
    }
    
    function filterClients() {
        // En una aplicación real, aquí filtrarías los clientes según los criterios
        console.log('Filtrando clientes...');
        
        const searchTerm = clientSearch ? clientSearch.value : '';
        const projectsFilter = clientFilterProjects ? clientFilterProjects.value : 'all';
        const dateFilter = clientFilterDate ? clientFilterDate.value : 'all';
        
        console.log({
            searchTerm,
            projectsFilter,
            dateFilter
        });
        
        // Simular refresco de datos
        loadClientsTable();
        
        // Mostrar toast
        showToast('Filtros aplicados', 'info');
    }
}

/**
 * Configura el formulario para añadir cliente
 */
function setupAddClientForm() {
    const addClientForm = document.getElementById('add-client-form');
    if (!addClientForm) return;
    
    addClientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simulación de envío de datos (en una aplicación real, se enviaría a MongoDB)
        console.log('Añadiendo nuevo cliente...');
        
        // Mostrar toast de éxito
        showToast('Cliente añadido correctamente', 'success');
        
        // Cerrar modal y resetear formulario
        closeModal(this.closest('.modal'));
        this.reset();
        
        // Recargar tabla de clientes
        loadClientsTable();
    });
}

/**
 * Configura las acciones para la tabla de clientes
 */
function setupClientActions() {
    // Configurar después de cargar la tabla
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.action-btn');
        
        if (!target) return;
        
        const clientId = target.getAttribute('data-client-id');
        
        if (target.classList.contains('view-btn')) {
            // Ver detalles del cliente
            openModal('client-details-modal');
            // En una aplicación real, cargarías los datos del cliente
            console.log('Ver cliente:', clientId);
            
        } else if (target.classList.contains('edit-btn')) {
            // Editar cliente
            console.log('Editar cliente:', clientId);
            
        } else if (target.classList.contains('delete-btn')) {
            // Eliminar cliente
            if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
                console.log('Eliminar cliente:', clientId);
                showToast('Cliente eliminado correctamente', 'success');
                loadClientsTable();
            }
        }
    });
}

/**
 * Inicializa la sección de proyectos
 */
function initProjectsSection() {
    const projectsSection = document.getElementById('projects');
    if (!projectsSection) return;
    
    // Cargar tarjetas de proyectos
    loadProjectsCards();
    
    // Configurar filtros de proyectos
    setupProjectFilters();
    
    // Configurar formulario para añadir proyecto
    setupAddProjectForm();
}

/**
 * Carga las tarjetas de proyectos
 */
function loadProjectsCards() {
    const projectCards = document.querySelector('.project-cards');
    if (!projectCards) return;
    
    // Simulación de carga (en una aplicación real, se obtendría de MongoDB)
    const projects = [
        {
            id: 1,
            title: 'E-commerce Fashion Store',
            category: 'Desarrollo Web',
            client: 'Juan Pérez - Empresa ABC',
            status: 'desarrollo medio',
            progress: 65,
            startDate: '15/03/2025',
            endDate: '15/06/2025'
        },
        {
            id: 2,
            title: 'Campaña Digital Restaurante Gourmet',
            category: 'Marketing Digital',
            client: 'María López - Empresa XYZ',
            status: 'iniciado',
            progress: 25,
            startDate: '01/05/2025',
            endDate: '01/07/2025'
        },
        {
            id: 3,
            title: 'Rebranding Completo Startup',
            category: 'Diseño Gráfico',
            client: 'Carlos Rodríguez - Tech Innovate',
            status: 'cotizacion',
            progress: 5,
            startDate: '10/05/2025',
            endDate: 'Por definir'
        },
        {
            id: 4,
            title: 'Optimización SEO Clínica Dental',
            category: 'SEO',
            client: 'Alejandro Herrera - Dental Care',
            status: 'finalizado',
            progress: 100,
            startDate: '10/01/2025',
            endDate: '20/04/2025'
        },
        {
            id: 5,
            title: 'Gestión Instagram Boutique Moda',
            category: 'Redes Sociales',
            client: 'Ana González - Boutique La Moda',
            status: 'desarrollo inicial',
            progress: 15,
            startDate: '05/05/2025',
            endDate: '05/07/2025'
        },
        {
            id: 6,
            title: 'Portal Inmobiliario Premium',
            category: 'Desarrollo Web',
            client: 'Roberto Sánchez - Inmobiliaria RS',
            status: 'pago procesado',
            progress: 10,
            startDate: '12/05/2025',
            endDate: '12/08/2025'
        }
    ];
    
    // Generar tarjetas
    projectCards.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-header">
                <span class="project-category">${project.category}</span>
                <span class="project-status" data-status="${project.status}">${formatStatus(project.status)}</span>
            </div>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-client"><i class="fas fa-user"></i> ${project.client}</p>
            <div class="project-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${project.progress}%;"></div>
                </div>
                <span class="progress-text">${project.progress}%</span>
            </div>
            <div class="project-dates">
                <p><i class="far fa-calendar-alt"></i> Inicio: ${project.startDate}</p>
                <p><i class="fas fa-calendar-check"></i> Estimado: ${project.endDate}</p>
            </div>
            <div class="project-actions">
                <button class="action-btn view-btn" title="Ver detalles" data-project-id="${project.id}"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit-btn" title="Editar" data-project-id="${project.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" title="Eliminar" data-project-id="${project.id}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
    
    // Configurar acciones de los proyectos
    setupProjectActions();
}

/**
 * Configura los filtros de proyectos
 */
function setupProjectFilters() {
    const projectSearch = document.getElementById('project-search');
    const projectSearchBtn = document.getElementById('project-search-btn');
    const projectFilterStatus = document.getElementById('project-filter-status');
    const projectFilterCategory = document.getElementById('project-filter-category');
    const projectFilterDate = document.getElementById('project-filter-date');
    
    // Función de filtrado
    function filterProjects() {
        // En una aplicación real, aquí filtrarías los proyectos
        console.log('Filtrando proyectos...');
        
        // Simular refresco de datos
        loadProjectsCards();
        
        // Mostrar toast
        showToast('Filtros aplicados', 'info');
    }
    
    // Configurar eventos de filtrado
    if (projectSearchBtn) {
        projectSearchBtn.addEventListener('click', filterProjects);
    }
    
    if (projectSearch) {
        projectSearch.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                filterProjects();
            }
        });
    }
    
    if (projectFilterStatus) {
        projectFilterStatus.addEventListener('change', filterProjects);
    }
    
    if (projectFilterCategory) {
        projectFilterCategory.addEventListener('change', filterProjects);
    }
    
    if (projectFilterDate) {
        projectFilterDate.addEventListener('change', filterProjects);
    }
}

/**
 * Configura las acciones de los proyectos
 */
function setupProjectActions() {
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.project-actions .action-btn');
        
        if (!target) return;
        
        const projectId = target.getAttribute('data-project-id');
        
        if (target.classList.contains('view-btn')) {
            // Ver detalles del proyecto
            openModal('project-details-modal');
            console.log('Ver proyecto:', projectId);
            
        } else if (target.classList.contains('edit-btn')) {
            // Editar proyecto
            console.log('Editar proyecto:', projectId);
            
        } else if (target.classList.contains('delete-btn')) {
            // Eliminar proyecto
            if (confirm('¿Está seguro de que desea eliminar este proyecto?')) {
                console.log('Eliminar proyecto:', projectId);
                showToast('Proyecto eliminado correctamente', 'success');
                loadProjectsCards();
            }
        }
    });
}

/**
 * Inicializa la sección de citas
 */
function initAppointmentsSection() {
    const appointmentsSection = document.getElementById('appointments');
    if (!appointmentsSection) return;
    
    // Configurar pestañas de vista
    setupAppointmentViewTabs();
    
    // Inicializar calendario
    initCalendar();
    
    // Cargar tabla de citas
    loadAppointmentsTable();
    
    // Configurar filtros de citas
    setupAppointmentFilters();
}

/**
 * Configurar pestañas de vista para citas
 */
function setupAppointmentViewTabs() {
    const viewTabs = document.querySelectorAll('.view-tab');
    const calendarView = document.querySelector('.calendar-view');
    const listView = document.querySelector('.list-view');
    
    viewTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            viewTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.getAttribute('data-view');
            
            if (view === 'calendar') {
                calendarView.classList.add('active');
                listView.classList.remove('active');
            } else {
                listView.classList.add('active');
                calendarView.classList.remove('active');
            }
        });
    });
}

/**
 * Inicializar calendario
 */
function initCalendar() {
    // En una aplicación real, aquí implementarías la lógica del calendario
    console.log('Inicializando calendario...');
    
    // Configurar navegación del calendario
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const calendarTitle = document.getElementById('calendar-title');
    
    if (prevMonthBtn && nextMonthBtn && calendarTitle) {
        // Variables del calendario
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        
        // Actualizar título
        updateCalendarTitle();
        
        // Event listeners
        prevMonthBtn.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            updateCalendarTitle();
        });
        
        nextMonthBtn.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            updateCalendarTitle();
        });
        
        function updateCalendarTitle() {
            const date = new Date(currentYear, currentMonth, 1);
            const options = { month: 'long', year: 'numeric' };
            calendarTitle.textContent = date.toLocaleDateString('es-ES', options);
        }
    }
}

/**
 * Cargar tabla de citas
 */
function loadAppointmentsTable() {
    const appointmentsTable = document.querySelector('#appointments-table tbody');
    if (!appointmentsTable) return;
    
    // Simulación de carga
    const appointments = [
        {
            id: 1,
            client: 'Juan Pérez',
            type: 'Seguimiento de Proyecto',
            date: '16/05/2025',
            time: '10:00 AM',
            status: 'confirmada',
            project: 'E-commerce Fashion Store'
        },
        {
            id: 2,
            client: 'María López',
            type: 'Consulta General',
            date: '17/05/2025',
            time: '2:30 PM',
            status: 'pendiente',
            project: '-'
        },
        {
            id: 3,
            client: 'Carlos Rodríguez',
            type: 'Plan Personalizado',
            date: '15/05/2025',
            time: '11:00 AM',
            status: 'completada',
            project: '-'
        },
        {
            id: 4,
            client: 'Ana González',
            type: 'Consulta General',
            date: '15/05/2025',
            time: '9:30 AM',
            status: 'cancelada',
            project: '-'
        }
    ];
    
    // Generar filas
    appointmentsTable.innerHTML = appointments.map(appointment => `
        <tr>
            <td>${appointment.client}</td>
            <td>${appointment.type}</td>
            <td>${appointment.date}</td>
            <td>${appointment.time}</td>
            <td><span class="status-badge ${appointment.status}">${formatAppointmentStatus(appointment.status)}</span></td>
            <td>${appointment.project}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" title="Ver detalles" data-appointment-id="${appointment.id}"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" title="Editar" data-appointment-id="${appointment.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Eliminar" data-appointment-id="${appointment.id}"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Formatear estado de cita
 */
function formatAppointmentStatus(status) {
    const statusMap = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'completada': 'Completada'
    };
    
    return statusMap[status] || status;
}

/**
 * Configura los filtros de citas
 */
function setupAppointmentFilters() {
    const appointmentSearch = document.getElementById('appointment-search');
    const appointmentSearchBtn = document.getElementById('appointment-search-btn');
    const appointmentFilterType = document.getElementById('appointment-filter-type');
    const appointmentFilterStatus = document.getElementById('appointment-filter-status');
    const appointmentDateFilter = document.getElementById('appointment-date-filter');
    
    // Función de filtrado
    function filterAppointments() {
        console.log('Filtrando citas...');
        loadAppointmentsTable();
        showToast('Filtros aplicados', 'info');
    }
    
    // Configurar eventos
    if (appointmentSearchBtn) {
        appointmentSearchBtn.addEventListener('click', filterAppointments);
    }
    
    if (appointmentFilterType) {
        appointmentFilterType.addEventListener('change', filterAppointments);
    }
    
    if (appointmentFilterStatus) {
        appointmentFilterStatus.addEventListener('change', filterAppointments);
    }
    
    if (appointmentDateFilter) {
        appointmentDateFilter.addEventListener('change', filterAppointments);
    }
}

/**
 * Inicializa la sección de mensajes
 */
function initMessagesSection() {
    // En una aplicación real, aquí implementarías la gestión de mensajes
    console.log('Inicializando sección de mensajes...');
}

/**
 * Inicializa la sección de informes
 */
function initReportsSection() {
    // En una aplicación real, aquí implementarías la generación de informes
    console.log('Inicializando sección de informes...');
}

/**
 * Inicializa la sección de configuración
 */
function initSettingsSection() {
    // En una aplicación real, aquí implementarías la gestión de configuración
    console.log('Inicializando sección de configuración...');
    
    // Inicializar pestañas de configuración
    initSettingsTabs();
}

/**
 * Inicializa las pestañas en la sección de configuración
 */
function initSettingsTabs() {
    const settingsNav = document.querySelectorAll('.settings-nav li');
    const settingsPanels = document.querySelectorAll('.settings-panel');
    
    if (settingsNav.length > 0 && settingsPanels.length > 0) {
        settingsNav.forEach(tab => {
            tab.addEventListener('click', function() {
                // Quitar la clase activa de todas las pestañas
                settingsNav.forEach(t => t.classList.remove('active'));
                
                // Añadir clase activa a la pestaña seleccionada
                this.classList.add('active');
                
                // Mostrar el panel correspondiente
                const panel = this.getAttribute('data-setting');
                
                // Ocultar todos los paneles
                settingsPanels.forEach(p => p.classList.remove('active'));
                
                // Mostrar el panel seleccionado
                document.getElementById(`${panel}-settings`).classList.add('active');
            });
        });
    }
}
/**
 * db.js - Funciones para la conexión y operaciones con MongoDB
 * Este archivo contiene las funciones para interactuar con la base de datos MongoDB
 */

// Importar MongoDB
const { MongoClient, ObjectId } = require('mongodb');

// URL de conexión a MongoDB (utiliza variables de entorno para producción)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'crazy_studios_db';

// Cliente MongoDB
let client;
let db;

/**
 * Conecta a la base de datos MongoDB
 */
async function connectToDatabase() {
    if (db) return db;
    
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        db = client.db(DB_NAME);
        console.log('Conectado a MongoDB');
        
        return db;
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        throw error;
    }
}

/**
 * Cierra la conexión con MongoDB
 */
async function closeDatabaseConnection() {
    if (client) {
        await client.close();
        console.log('Conexión a MongoDB cerrada');
    }
}

/**
 * OPERACIONES DE USUARIOS
 */

/**
 * Obtiene un usuario por su correo electrónico
 * @param {string} email - Correo electrónico del usuario
 * @returns {Promise<Object|null>} - Datos del usuario o null si no existe
 */
async function getUserByEmail(email) {
    try {
        const database = await connectToDatabase();
        const user = await database.collection('users').findOne({ correo: email });
        return user;
    } catch (error) {
        console.error('Error al obtener usuario por email:', error);
        throw error;
    }
}

/**
 * Obtiene un usuario por su ID
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} - Datos del usuario o null si no existe
 */
async function getUserById(userId) {
    try {
        const database = await connectToDatabase();
        const user = await database.collection('users').findOne({ _id: new ObjectId(userId) });
        return user;
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        throw error;
    }
}

/**
 * Crea un nuevo usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} - Usuario creado
 */
async function createUser(userData) {
    try {
        const database = await connectToDatabase();
        
        // Verificar si el correo ya existe
        const existingUser = await getUserByEmail(userData.correo);
        if (existingUser) {
            throw new Error('Ya existe un usuario con este correo electrónico');
        }
        
        // Añadir fecha de registro
        userData.fechaRegistro = new Date();
        
        const result = await database.collection('users').insertOne(userData);
        return { _id: result.insertedId, ...userData };
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
}

/**
 * Actualiza un usuario existente
 * @param {string} userId - ID del usuario
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Usuario actualizado
 */
async function updateUser(userId, updateData) {
    try {
        const database = await connectToDatabase();
        
        // No permitir actualizar el correo a uno ya existente
        if (updateData.correo) {
            const existingUser = await getUserByEmail(updateData.correo);
            if (existingUser && existingUser._id.toString() !== userId) {
                throw new Error('Ya existe un usuario con este correo electrónico');
            }
        }
        
        await database.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );
        
        return await getUserById(userId);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
    }
}

/**
 * Elimina un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function deleteUser(userId) {
    try {
        const database = await connectToDatabase();
        
        // Eliminar usuario
        const result = await database.collection('users').deleteOne({ _id: new ObjectId(userId) });
        
        // También eliminar sus citas
        await database.collection('appointments').deleteMany({ usuario: new ObjectId(userId) });
        
        // No eliminamos proyectos, solo actualizamos el campo cliente a null
        await database.collection('projects').updateMany(
            { cliente: new ObjectId(userId) },
            { $set: { cliente: null } }
        );
        
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
    }
}

/**
 * Obtiene todos los usuarios con paginación
 * @param {Object} options - Opciones de filtrado y paginación
 * @returns {Promise<Object>} - Lista de usuarios y total
 */
async function getUsers(options = {}) {
    try {
        const database = await connectToDatabase();
        
        const { page = 1, limit = 10, filter = {}, sort = { fechaRegistro: -1 } } = options;
        const skip = (page - 1) * limit;
        
        const users = await database.collection('users')
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();
        
        const total = await database.collection('users').countDocuments(filter);
        
        return {
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
    }
}

/**
 * OPERACIONES DE PROYECTOS
 */

/**
 * Obtiene un proyecto por su ID
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<Object|null>} - Datos del proyecto o null si no existe
 */
async function getProjectById(projectId) {
    try {
        const database = await connectToDatabase();
        const project = await database.collection('projects').findOne({ _id: new ObjectId(projectId) });
        return project;
    } catch (error) {
        console.error('Error al obtener proyecto por ID:', error);
        throw error;
    }
}

/**
 * Crea un nuevo proyecto
 * @param {Object} projectData - Datos del proyecto
 * @returns {Promise<Object>} - Proyecto creado
 */
async function createProject(projectData) {
    try {
        const database = await connectToDatabase();
        
        // Si hay un cliente, convertir el ID a ObjectId
        if (projectData.cliente) {
            projectData.cliente = new ObjectId(projectData.cliente);
        }
        
        // Fechas de creación y actualización
        projectData.fechaCreacion = new Date();
        projectData.fechaActualizacion = new Date();
        
        // Estado inicial por defecto
        if (!projectData.estado) {
            projectData.estado = 'cotizacion';
        }
        
        // Porcentaje de progreso inicial
        if (!projectData.porcentajeProgreso) {
            projectData.porcentajeProgreso = 0;
        }
        
        const result = await database.collection('projects').insertOne(projectData);
        
        // Si hay un cliente, actualizar la referencia en el usuario
        if (projectData.cliente) {
            await database.collection('users').updateOne(
                { _id: projectData.cliente },
                { $push: { proyectos: result.insertedId } }
            );
        }
        
        return { _id: result.insertedId, ...projectData };
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        throw error;
    }
}

/**
 * Actualiza un proyecto existente
 * @param {string} projectId - ID del proyecto
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Proyecto actualizado
 */
async function updateProject(projectId, updateData) {
    try {
        const database = await connectToDatabase();
        
        // Convertir cliente a ObjectId si existe
        if (updateData.cliente) {
            updateData.cliente = new ObjectId(updateData.cliente);
        }
        
        // Actualizar fecha de actualización
        updateData.fechaActualizacion = new Date();
        
        // Obtener proyecto actual para verificar si cambió el cliente
        const currentProject = await getProjectById(projectId);
        
        await database.collection('projects').updateOne(
            { _id: new ObjectId(projectId) },
            { $set: updateData }
        );
        
        // Si cambió el cliente, actualizar referencias en usuarios
        if (updateData.cliente && currentProject.cliente && 
            updateData.cliente.toString() !== currentProject.cliente.toString()) {
            
            // Quitar referencia del cliente anterior
            await database.collection('users').updateOne(
                { _id: currentProject.cliente },
                { $pull: { proyectos: new ObjectId(projectId) } }
            );
            
            // Añadir referencia al nuevo cliente
            await database.collection('users').updateOne(
                { _id: updateData.cliente },
                { $push: { proyectos: new ObjectId(projectId) } }
            );
        }
        
        return await getProjectById(projectId);
    } catch (error) {
        console.error('Error al actualizar proyecto:', error);
        throw error;
    }
}

/**
 * Elimina un proyecto
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function deleteProject(projectId) {
    try {
        const database = await connectToDatabase();
        
        // Obtener proyecto para quitar referencias
        const project = await getProjectById(projectId);
        
        if (project && project.cliente) {
            // Quitar referencia en el usuario
            await database.collection('users').updateOne(
                { _id: project.cliente },
                { $pull: { proyectos: new ObjectId(projectId) } }
            );
        }
        
        // Eliminar citas relacionadas con el proyecto
        await database.collection('appointments').deleteMany({ proyecto: new ObjectId(projectId) });
        
        // Eliminar el proyecto
        const result = await database.collection('projects').deleteOne({ _id: new ObjectId(projectId) });
        
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        throw error;
    }
}

/**
 * Obtiene proyectos con paginación y filtros
 * @param {Object} options - Opciones de filtrado y paginación
 * @returns {Promise<Object>} - Lista de proyectos y total
 */
async function getProjects(options = {}) {
    try {
        const database = await connectToDatabase();
        
        const { page = 1, limit = 10, filter = {}, sort = { fechaCreacion: -1 } } = options;
        const skip = (page - 1) * limit;
        
        // Convertir filtro de cliente a ObjectId si existe
        if (filter.cliente) {
            filter.cliente = new ObjectId(filter.cliente);
        }
        
        const projects = await database.collection('projects')
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();
        
        const total = await database.collection('projects').countDocuments(filter);
        
        return {
            projects,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        throw error;
    }
}

/**
 * OPERACIONES DE CITAS
 */

/**
 * Obtiene una cita por su ID
 * @param {string} appointmentId - ID de la cita
 * @returns {Promise<Object|null>} - Datos de la cita o null si no existe
 */
async function getAppointmentById(appointmentId) {
    try {
        const database = await connectToDatabase();
        const appointment = await database.collection('appointments').findOne({ _id: new ObjectId(appointmentId) });
        return appointment;
    } catch (error) {
        console.error('Error al obtener cita por ID:', error);
        throw error;
    }
}

/**
 * Crea una nueva cita
 * @param {Object} appointmentData - Datos de la cita
 * @returns {Promise<Object>} - Cita creada
 */
async function createAppointment(appointmentData) {
    try {
        const database = await connectToDatabase();
        
        // Convertir IDs a ObjectId
        if (appointmentData.usuario) {
            appointmentData.usuario = new ObjectId(appointmentData.usuario);
        }
        
        if (appointmentData.proyecto) {
            appointmentData.proyecto = new ObjectId(appointmentData.proyecto);
        }
        
        // Convertir fecha a objeto Date
        if (appointmentData.fecha && typeof appointmentData.fecha === 'string') {
            appointmentData.fecha = new Date(appointmentData.fecha);
        }
        
        // Estado por defecto
        if (!appointmentData.estado) {
            appointmentData.estado = 'pendiente';
        }
        
        const result = await database.collection('appointments').insertOne(appointmentData);
        
        // Si hay un usuario, actualizar sus citas
        if (appointmentData.usuario) {
            await database.collection('users').updateOne(
                { _id: appointmentData.usuario },
                { $push: { citas: result.insertedId } }
            );
        }
        
        return { _id: result.insertedId, ...appointmentData };
    } catch (error) {
        console.error('Error al crear cita:', error);
        throw error;
    }
}

/**
 * Actualiza una cita existente
 * @param {string} appointmentId - ID de la cita
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Cita actualizada
 */
async function updateAppointment(appointmentId, updateData) {
    try {
        const database = await connectToDatabase();
        
        // Convertir IDs a ObjectId
        if (updateData.usuario) {
            updateData.usuario = new ObjectId(updateData.usuario);
        }
        
        if (updateData.proyecto) {
            updateData.proyecto = new ObjectId(updateData.proyecto);
        }
        
        // Convertir fecha a objeto Date
        if (updateData.fecha && typeof updateData.fecha === 'string') {
            updateData.fecha = new Date(updateData.fecha);
        }
        
        // Obtener cita actual para verificar cambios en el usuario
        const currentAppointment = await getAppointmentById(appointmentId);
        
        await database.collection('appointments').updateOne(
            { _id: new ObjectId(appointmentId) },
            { $set: updateData }
        );
        
        // Si cambió el usuario, actualizar referencias
        if (updateData.usuario && currentAppointment.usuario &&
            updateData.usuario.toString() !== currentAppointment.usuario.toString()) {
            
            // Quitar referencia del usuario anterior
            await database.collection('users').updateOne(
                { _id: currentAppointment.usuario },
                { $pull: { citas: new ObjectId(appointmentId) } }
            );
            
            // Añadir referencia al nuevo usuario
            await database.collection('users').updateOne(
                { _id: updateData.usuario },
                { $push: { citas: new ObjectId(appointmentId) } }
            );
        }
        
        return await getAppointmentById(appointmentId);
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        throw error;
    }
}

/**
 * Elimina una cita
 * @param {string} appointmentId - ID de la cita
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function deleteAppointment(appointmentId) {
    try {
        const database = await connectToDatabase();
        
        // Obtener cita para quitar referencias
        const appointment = await getAppointmentById(appointmentId);
        
        if (appointment && appointment.usuario) {
            // Quitar referencia en el usuario
            await database.collection('users').updateOne(
                { _id: appointment.usuario },
                { $pull: { citas: new ObjectId(appointmentId) } }
            );
        }
        
        // Eliminar la cita
        const result = await database.collection('appointments').deleteOne({ _id: new ObjectId(appointmentId) });
        
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        throw error;
    }
}

/**
 * Obtiene citas con paginación y filtros
 * @param {Object} options - Opciones de filtrado y paginación
 * @returns {Promise<Object>} - Lista de citas y total
 */
async function getAppointments(options = {}) {
    try {
        const database = await connectToDatabase();
        
        const { page = 1, limit = 10, filter = {}, sort = { fecha: 1 } } = options;
        const skip = (page - 1) * limit;
        
        // Convertir filtros de IDs a ObjectId
        if (filter.usuario) {
            filter.usuario = new ObjectId(filter.usuario);
        }
        
        if (filter.proyecto) {
            filter.proyecto = new ObjectId(filter.proyecto);
        }
        
        // Filtro por fecha
        if (filter.fechaInicio && filter.fechaFin) {
            filter.fecha = {
                $gte: new Date(filter.fechaInicio),
                $lte: new Date(filter.fechaFin)
            };
            
            delete filter.fechaInicio;
            delete filter.fechaFin;
        } else if (filter.fechaInicio) {
            filter.fecha = { $gte: new Date(filter.fechaInicio) };
            delete filter.fechaInicio;
        } else if (filter.fechaFin) {
            filter.fecha = { $lte: new Date(filter.fechaFin) };
            delete filter.fechaFin;
        }
        
        const appointments = await database.collection('appointments')
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();
        
        const total = await database.collection('appointments').countDocuments(filter);
        
        return {
            appointments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error al obtener citas:', error);
        throw error;
    }
}

// Exportar funciones
module.exports = {
    connectToDatabase,
    closeDatabaseConnection,
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUsers,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjects,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointments
};