document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y cargar datos del usuario
    checkAuthentication();
    
    // Inicializar componentes del dashboard
    initAdminDashboard();
    
    // Configurar menú de usuario
    setupUserMenu();
    
    // Configurar navegación de secciones
    setupSectionNavigation();
    
    // Configurar quick actions (CORREGIDO)
    setupQuickActions();
    
    // Configurar clicks en estadísticas (NUEVO)
    setupStatisticsClicks();
    
    // Formatear fecha actual
    displayCurrentDate();
    
    // Cargar estadísticas dinámicas (CORREGIDO)
    loadDynamicStatistics();
});

/**
 * Configura las quick actions del dropdown - VERSIÓN CORREGIDA
 */
function setupQuickActions() {
    console.log('Configurando quick actions...');
    
    // Encontrar el botón principal de quick actions
    const quickActionsBtn = document.querySelector('.quick-actions .primary-btn');
    const dropdown = document.querySelector('.quick-actions .dropdown');
    
    if (!quickActionsBtn || !dropdown) {
        console.warn('Elementos de quick actions no encontrados');
        return;
    }
    
    console.log('Quick actions encontrados:', quickActionsBtn, dropdown);
    
    // Toggle del dropdown de quick actions
    quickActionsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Click en quick actions button');
        dropdown.classList.toggle('active');
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Configurar acciones específicas
    setupQuickActionButtons();
}

/**
 * Configura los botones específicos de quick actions
 */
function setupQuickActionButtons() {
    const createClientBtn = document.getElementById('create-client');
    const createProjectBtn = document.getElementById('create-project');
    const createAppointmentBtn = document.getElementById('create-appointment');
    
    console.log('Configurando botones de quick actions:', {
        createClientBtn,
        createProjectBtn,
        createAppointmentBtn
    });
    
    if (createClientBtn) {
        createClientBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Click en crear cliente desde quick actions');
            
            // Cerrar dropdown
            const dropdown = document.querySelector('.quick-actions .dropdown');
            if (dropdown) dropdown.classList.remove('active');
            
            // Cambiar a la sección de clientes y abrir modal
            switchToSection('clients');
            setTimeout(() => {
                if (typeof openCreateClientModal === 'function') {
                    openCreateClientModal();
                } else {
                    console.error('Función openCreateClientModal no disponible');
                }
            }, 300);
        });
    }
    
    if (createProjectBtn) {
        createProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Click en crear proyecto');
            
            // Cerrar dropdown
            const dropdown = document.querySelector('.quick-actions .dropdown');
            if (dropdown) dropdown.classList.remove('active');
            
            switchToSection('projects');
            setTimeout(() => {
                console.log('Abrir modal de crear proyecto - funcionalidad próximamente');
                showToast('Funcionalidad de crear proyecto próximamente', 'info');
            }, 300);
        });
    }
    
    if (createAppointmentBtn) {
        createAppointmentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Click en crear cita');
            
            // Cerrar dropdown
            const dropdown = document.querySelector('.quick-actions .dropdown');
            if (dropdown) dropdown.classList.remove('active');
            
            switchToSection('appointments');
            setTimeout(() => {
                console.log('Abrir modal de crear cita - funcionalidad próximamente');
                showToast('Funcionalidad de crear cita próximamente', 'info');
            }, 300);
        });
    }
}

/**
 * Configura clicks en las tarjetas de estadísticas - NUEVO
 */
function setupStatisticsClicks() {
    // Click en tarjeta de clientes
    const clientsCard = document.querySelector('.stat-card .clients-icon').closest('.stat-card');
    if (clientsCard) {
        clientsCard.style.cursor = 'pointer';
        clientsCard.addEventListener('click', function() {
            console.log('Click en tarjeta de clientes');
            switchToSection('clients');
        });
    }
    
    // Click en tarjeta de proyectos
    const projectsCard = document.querySelector('.stat-card .projects-icon').closest('.stat-card');
    if (projectsCard) {
        projectsCard.style.cursor = 'pointer';
        projectsCard.addEventListener('click', function() {
            console.log('Click en tarjeta de proyectos');
            switchToSection('projects');
        });
    }
    
    // Click en tarjeta de citas
    const appointmentsCard = document.querySelector('.stat-card .appointments-icon').closest('.stat-card');
    if (appointmentsCard) {
        appointmentsCard.style.cursor = 'pointer';
        appointmentsCard.addEventListener('click', function() {
            console.log('Click en tarjeta de citas');
            switchToSection('appointments');
        });
    }
    
    // Click en tarjeta de mensajes
    const messagesCard = document.querySelector('.stat-card .messages-icon').closest('.stat-card');
    if (messagesCard) {
        messagesCard.style.cursor = 'pointer';
        messagesCard.addEventListener('click', function() {
            console.log('Click en tarjeta de mensajes');
            switchToSection('messages');
        });
    }
}

/**
 * Cambia a una sección específica - VERSIÓN MEJORADA
 */
function switchToSection(sectionId) {
    console.log('Cambiando a sección:', sectionId);
    
    // Quitar clase activa de todos los links del sidebar
    const sidebarLinks = document.querySelectorAll('.sidebar-menu li');
    sidebarLinks.forEach(l => l.classList.remove('active'));
    
    // Agregar clase activa al link correspondiente
    const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // Ocultar todas las secciones
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    dashboardSections.forEach(s => s.classList.remove('active'));
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Inicializar módulo específico si es necesario
        if (sectionId === 'clients') {
            setTimeout(() => {
                if (typeof initClientsModule === 'function') {
                    initClientsModule();
                } else {
                    console.error('Función initClientsModule no disponible');
                }
            }, 100);
        }
    }
}

/**
 * Configura la navegación entre secciones - VERSIÓN MEJORADA
 */
function setupSectionNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu li');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('Click en sidebar link:', this.getAttribute('data-section'));
            
            // Quitar clase activa de todos los links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase activa al link clickeado
            this.classList.add('active');
            
            // Obtener la sección a mostrar
            const section = this.getAttribute('data-section');
            
            if (section) {
                // Ocultar todas las secciones
                const dashboardSections = document.querySelectorAll('.dashboard-section');
                dashboardSections.forEach(s => s.classList.remove('active'));
                
                // Mostrar la sección seleccionada
                const targetSection = document.getElementById(section);
                if (targetSection) {
                    targetSection.classList.add('active');
                    
                    // Inicializar módulo específico
                    if (section === 'clients') {
                        setTimeout(() => {
                            if (typeof initClientsModule === 'function') {
                                initClientsModule();
                            }
                        }, 100);
                    }
                }
            }
        });
    });
}

/**
 * Carga estadísticas dinámicas desde la API - NUEVO
 */
async function loadDynamicStatistics() {
    console.log('Cargando estadísticas dinámicas...');
    
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No hay token de autenticación para cargar estadísticas');
            loadStaticStatistics();
            return;
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Cargar estadísticas de clientes
        await loadClientsStatistics(API_BASE, token);
        
        // Cargar estadísticas de proyectos (próximamente)
        loadProjectsStatistics();
        
        // Cargar estadísticas de citas (próximamente)
        loadAppointmentsStatistics();
        
        // Cargar estadísticas de mensajes (próximamente)
        loadMessagesStatistics();
        
    } catch (error) {
        console.error('Error al cargar estadísticas dinámicas:', error);
        loadStaticStatistics();
    }
}

/**
 * Carga estadísticas de clientes desde la API
 */
async function loadClientsStatistics(API_BASE, token) {
    try {
        console.log('Cargando estadísticas de clientes...');
        
        const response = await fetch(`${API_BASE}/api/users?limit=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const clients = data.data || [];
            
            // Filtrar solo clientes (no administradores)
            const clientesActivos = clients.filter(user => user.rol === 'cliente');
            
            // Actualizar contador de clientes
            const clientsCount = document.getElementById('clients-count');
            if (clientsCount) {
                clientsCount.textContent = clientesActivos.length;
            }
            
            // Calcular clientes con proyectos
            const clientesConProyectos = clientesActivos.filter(client => 
                client.proyectos && client.proyectos.length > 0
            ).length;
            
            // Calcular clientes nuevos este mes
            const clientesNuevosEsteMes = clientesActivos.filter(client => {
                if (!client.fechaRegistro) return false;
                const fechaRegistro = new Date(client.fechaRegistro);
                const now = new Date();
                return fechaRegistro.getMonth() === now.getMonth() && 
                       fechaRegistro.getFullYear() === now.getFullYear();
            }).length;
            
            console.log('Estadísticas de clientes cargadas:', {
                total: clientesActivos.length,
                conProyectos: clientesConProyectos,
                nuevosEsteMes: clientesNuevosEsteMes
            });
            
            // Actualizar descripción si existe
            const clientsDescription = document.querySelector('.clients-icon').closest('.stat-card').querySelector('.stat-description');
            if (clientsDescription) {
                clientsDescription.textContent = `${clientesNuevosEsteMes} nuevos este mes`;
            }
            
        } else {
            console.warn('No se pudieron cargar las estadísticas de clientes');
            loadStaticStatistics();
        }
        
    } catch (error) {
        console.error('Error al cargar estadísticas de clientes:', error);
        loadStaticStatistics();
    }
}

/**
 * Carga estadísticas estáticas como fallback
 */
function loadStaticStatistics() {
    console.log('Cargando estadísticas estáticas...');
    
    const stats = {
        clients: 0,
        projects: 0,
        appointments: 0,
        messages: 0
    };
    
    // Actualizar elementos de estadísticas
    const clientsCount = document.getElementById('clients-count');
    const projectsCount = document.getElementById('projects-count');
    const appointmentsCount = document.getElementById('appointments-count');
    const messagesCount = document.getElementById('messages-count');
    
    if (clientsCount) clientsCount.textContent = stats.clients;
    if (projectsCount) projectsCount.textContent = stats.projects;
    if (appointmentsCount) appointmentsCount.textContent = stats.appointments;
    if (messagesCount) messagesCount.textContent = stats.messages;
}

/**
 * Estadísticas de proyectos (placeholder)
 */
function loadProjectsStatistics() {
    console.log('Estadísticas de proyectos - próximamente');
    // Aquí iría la lógica para cargar estadísticas de proyectos
}

/**
 * Estadísticas de citas (placeholder)
 */
function loadAppointmentsStatistics() {
    console.log('Estadísticas de citas - próximamente');
    // Aquí iría la lógica para cargar estadísticas de citas
}

/**
 * Estadísticas de mensajes (placeholder)
 */
function loadMessagesStatistics() {
    console.log('Estadísticas de mensajes - próximamente');
    // Aquí iría la lógica para cargar estadísticas de mensajes
}

/**
 * Verifica si el usuario está autenticado y es administrador
 */
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        // No hay datos de autenticación, redirigir al login
        window.location.href = '../login.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        
        // Verificar que sea administrador
        if (user.rol !== 'admin' && user.rol !== 'superadmin') {
            alert('No tienes permisos para acceder a esta sección');
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Cargar datos del usuario en la interfaz
        loadUserData(user);
        
    } catch (error) {
        console.error('Error al procesar datos de usuario:', error);
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

/**
 * Carga los datos del usuario en la interfaz
 */
function loadUserData(user) {
    // Actualizar nombre en el menú
    const adminNameElement = document.getElementById('admin-name');
    const welcomeAdminNameElement = document.getElementById('welcome-admin-name');
    
    if (adminNameElement) {
        adminNameElement.textContent = `${user.nombre} ${user.apellidos}`;
    }
    
    if (welcomeAdminNameElement) {
        welcomeAdminNameElement.textContent = user.nombre;
    }
    
    // Guardar datos del usuario para uso posterior
    window.currentUser = user;
}

/**
 * Configura el menú de usuario (dropdown)
 */
function setupUserMenu() {
    const userMenu = document.querySelector('.user-menu.admin-menu');
    const userDropdown = document.getElementById('admin-dropdown');
    
    if (!userMenu || !userDropdown) return;
    
    // Toggle del dropdown al hacer clic en el menú
    userMenu.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        userDropdown.classList.toggle('active');
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!userMenu.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Configurar botones del dropdown
    setupDropdownButtons();
}

/**
 * Configura los botones del dropdown de usuario
 */
function setupDropdownButtons() {
    // Botón de perfil
    const profileBtn = document.getElementById('admin-profile-link');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openProfileModal();
        });
    }
    
    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
}

/**
 * Abre el modal de perfil del usuario
 */
function openProfileModal() {
    // Crear y mostrar el modal de perfil
    createProfileModal();
}

/**
 * Crea el modal de perfil con los datos del usuario
 */
function createProfileModal() {
    const user = window.currentUser;
    if (!user) return;
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('profile-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal active" id="profile-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Mi Perfil</h2>
                    <button class="close-btn" id="close-profile-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="profile-update-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="profile-name">Nombre</label>
                                <input type="text" id="profile-name" value="${user.nombre || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="profile-lastname">Apellidos</label>
                                <input type="text" id="profile-lastname" value="${user.apellidos || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="profile-email">Correo Electrónico</label>
                                <input type="email" id="profile-email" value="${user.correo || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="profile-phone">Teléfono</label>
                                <input type="tel" id="profile-phone" value="${user.telefono || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-company">Empresa (Opcional)</label>
                            <input type="text" id="profile-company" value="${user.empresa || ''}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="profile-document-type">Tipo de Documento</label>
                                <input type="text" id="profile-document-type" value="${user.tipoDocumento || 'CC'}" readonly disabled>
                            </div>
                            <div class="form-group">
                                <label for="profile-document">Número de Documento</label>
                                <input type="text" id="profile-document" value="${user.documento || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-password">Nueva Contraseña (Opcional)</label>
                            <div style="position: relative;">
                                <input type="password" id="profile-password" placeholder="Dejar vacío para mantener la actual">
                                <button type="button" class="password-toggle-modal" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-color); cursor: pointer;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-confirm-password">Confirmar Nueva Contraseña</label>
                            <div style="position: relative;">
                                <input type="password" id="profile-confirm-password" placeholder="Confirmar nueva contraseña">
                                <button type="button" class="password-toggle-modal" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-color); cursor: pointer;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 20px;">
                            <button type="button" class="secondary-btn" id="cancel-profile-btn">Cancelar</button>
                            <button type="submit" class="primary-btn" id="save-profile-btn">Guardar Cambios</button>
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
        setupProfileModalEvents();
    }, 100);
}

/**
 * Configura los eventos del modal de perfil
 */
function setupProfileModalEvents() {
    const modal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('close-profile-modal');
    const cancelBtn = document.getElementById('cancel-profile-btn');
    const form = document.getElementById('profile-update-form');
    
    if (!modal) {
        console.error('Modal no encontrado');
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
    
    // Toggle de contraseña
    const passwordToggles = modal.querySelectorAll('.password-toggle-modal');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
    
    // Envío del formulario
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProfileUpdate(e);
        });
    }
    
    console.log('Eventos del modal configurados correctamente');
}

/**
 * Maneja la actualización del perfil
 */
async function handleProfileUpdate(e) {
    console.log('Iniciando actualización del perfil...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-profile-btn') || form.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.error('Botón de envío no encontrado');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Recopilar datos del formulario
        const formData = {
            nombre: document.getElementById('profile-name')?.value?.trim() || '',
            apellidos: document.getElementById('profile-lastname')?.value?.trim() || '',
            correo: document.getElementById('profile-email')?.value?.trim() || '',
            telefono: document.getElementById('profile-phone')?.value?.trim() || '',
            empresa: document.getElementById('profile-company')?.value?.trim() || '',
            documento: document.getElementById('profile-document')?.value?.trim() || '',
        };
        
        const password = document.getElementById('profile-password')?.value || '';
        const confirmPassword = document.getElementById('profile-confirm-password')?.value || '';
        
        // Validar contraseñas si se proporcionaron
        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }
            if (password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }
            formData.password = password;
        }
        
        // Validar campos obligatorios
        if (!formData.nombre || !formData.apellidos || !formData.correo) {
            throw new Error('Nombre, apellidos y correo son obligatorios');
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correo)) {
            throw new Error('Por favor, introduce un email válido');
        }
        
        console.log('Datos a enviar:', formData);
        
        // Enviar datos al servidor
        const token = localStorage.getItem('authToken');
        const userId = window.currentUser._id;
        
        if (!token || !userId) {
            throw new Error('Datos de autenticación no encontrados');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        console.log('Enviando petición a:', `${API_BASE}/api/users/${userId}`);
        
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Respuesta del servidor:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar perfil');
        }
        
        const data = await response.json();
        console.log('Datos actualizados:', data);
        
        // Actualizar datos locales
        const updatedUser = { ...window.currentUser, ...data.data };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        window.currentUser = updatedUser;
        
        // Actualizar interfaz
        loadUserData(updatedUser);
        
        // Mostrar mensaje de éxito
        showToast('Perfil actualizado correctamente', 'success');
        
        // Cerrar modal
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showToast(error.message || 'Error al actualizar perfil', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Maneja el cierre de sesión
 */
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Limpiar datos de autenticación
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // Redirigir al login
        window.location.href = '../login.html';
    }
}

/**
 * Inicializa el dashboard del administrador
 */
function initAdminDashboard() {
    console.log('Dashboard de administrador inicializado');
}

/**
 * Muestra la fecha actual
 */
function displayCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('es-ES', options);
    }
}

/**
 * Muestra mensajes toast
 */
function showToast(message, type = 'info') {
    // Crear contenedor de toast si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        margin-bottom: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Eliminar después de 4 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 4000);
}

// Exponer funciones globalmente para que puedan ser usadas por otros módulos
window.showToast = showToast;
window.switchToSection = switchToSection;

// CSS adicional para los estilos mejorados
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    /* Estilos mejorados para el dashboard */
    
    /* Animaciones para toast */
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    /* Hacer las tarjetas de estadísticas clickeables */
    .stat-card:hover {
        transform: translateY(-2px);
        transition: transform 0.2s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .stat-card {
        transition: all 0.2s ease;
    }
    
    /* Mejorar el dropdown de quick actions */
    .dropdown {
        position: relative;
    }
    
    .dropdown-menu {
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        background-color: #1e1e1e;
        border: 1px solid #333;
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        min-width: 200px;
        overflow: hidden;
        transform: translateY(-10px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .dropdown.active .dropdown-menu {
        display: block;
        transform: translateY(0);
        opacity: 1;
    }
    
    .dropdown-menu a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        color: #ffffff;
        text-decoration: none;
        transition: all 0.2s ease;
        border-bottom: 1px solid #333;
    }
    
    .dropdown-menu a:last-child {
        border-bottom: none;
    }
    
    .dropdown-menu a:hover {
        background-color: #2a2a2a;
        transform: translateX(4px);
    }
    
    .dropdown-menu a i {
        width: 18px;
        text-align: center;
        color: var(--primary-color, #007bff);
        font-size: 14px;
    }
    
    /* Mejorar el botón de quick actions */
    .quick-actions .primary-btn {
        background: linear-gradient(135deg, var(--primary-color, #007bff) 0%, #0056b3 100%);
        border: none;
        border-radius: 8px;
        padding: 12px 20px;
        color: white;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 10px rgba(0, 123, 255, 0.3);
    }
    
    .quick-actions .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 123, 255, 0.4);
    }
    
    /* Estilos para modal mejorado */
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        transition: all 0.3s ease;
    }
    
    .modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
    }
    
    .modal-content {
        background-color: #1e1e1e;
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        animation: modalSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 1px solid #333;
    }
    
    @keyframes modalSlideIn {
        from {
            transform: scale(0.8) translateY(-50px);
            opacity: 0;
        }
        to {
            transform: scale(1) translateY(0);
            opacity: 1;
        }
    }
    
    .modal-header {
        padding: 24px;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        border-radius: 12px 12px 0 0;
    }
    
    .modal-header h2 {
        margin: 0;
        color: #ffffff;
        font-size: 20px;
        font-weight: 600;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 8px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s ease;
    }
    
    .close-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        transform: scale(1.1);
    }
    
    .modal-body {
        padding: 24px;
    }
    
    /* Mejorar formularios */
    .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
    }
    
    .form-row .form-group {
        flex: 1;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #ffffff;
        font-size: 14px;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #333;
        border-radius: 8px;
        font-size: 14px;
        box-sizing: border-box;
        background-color: #2a2a2a;
        color: #ffffff;
        transition: all 0.2s ease;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        background-color: #333;
    }
    
    .form-group input:disabled {
        background-color: #1a1a1a;
        color: #666;
        cursor: not-allowed;
        opacity: 0.7;
    }
    
    .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 24px;
        border-top: 1px solid #333;
        margin-top: 24px;
    }
    
    .primary-btn, .secondary-btn {
        padding: 12px 24px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .primary-btn {
        background: linear-gradient(135deg, var(--primary-color, #007bff) 0%, #0056b3 100%);
        color: white;
        box-shadow: 0 2px 10px rgba(0, 123, 255, 0.3);
    }
    
    .primary-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 20px rgba(0, 123, 255, 0.4);
    }
    
    .primary-btn:disabled {
        background: #666;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    .secondary-btn {
        background-color: #444;
        color: white;
        border: 1px solid #555;
    }
    
    .secondary-btn:hover {
        background-color: #555;
        transform: translateY(-1px);
    }
    
    /* Responsive improvements */
    @media (max-width: 768px) {
        .form-row {
            flex-direction: column;
            gap: 12px;
        }
        
        .modal-content {
            width: 95%;
            margin: 20px;
        }
        
        .modal-header {
            padding: 20px;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .form-actions {
            flex-direction: column-reverse;
        }
        
        .primary-btn, .secondary-btn {
            width: 100%;
            justify-content: center;
        }
    }
`;

document.head.appendChild(additionalStyles);

console.log('Dashboard integrado completamente - Versión mejorada cargada');