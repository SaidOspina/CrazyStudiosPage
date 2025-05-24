/**
 * Dashboard Administrador - Crazy Studios
 * Funcionalidades específicas para el panel de administración
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y cargar datos del usuario
    checkAuthentication();
    
    // Inicializar componentes del dashboard
    initAdminDashboard();
    
    // Configurar menú de usuario
    setupUserMenu();
    
    // Configurar navegación de secciones
    setupSectionNavigation();
    
    // Formatear fecha actual
    displayCurrentDate();
    
    // Cargar estadísticas
    loadStatistics();
});

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
                    <form id="profile-form">
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
                            <button type="submit" class="primary-btn">Guardar Cambios</button>
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
    
    // Configurar eventos del modal
    setupProfileModalEvents();
}

/**
 * Configura los eventos del modal de perfil
 */
function setupProfileModalEvents() {
    const modal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('close-profile-modal');
    const cancelBtn = document.getElementById('cancel-profile-btn');
    const form = document.getElementById('profile-form');
    
    // Cerrar modal
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = 'auto';
        }, 300);
    }
    
    // Eventos de cierre
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Toggle de contraseña
    const passwordToggles = document.querySelectorAll('.password-toggle-modal');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
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
        form.addEventListener('submit', handleProfileUpdate);
    }
}

/**
 * Maneja la actualización del perfil
 */
async function handleProfileUpdate(e) {
    console.log('Actualizando perfil...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Recopilar datos del formulario
        const formData = {
            nombre: document.getElementById('profile-name').value.trim(),
            apellidos: document.getElementById('profile-lastname').value.trim(),
            correo: document.getElementById('profile-email').value.trim(),
            telefono: document.getElementById('profile-phone').value.trim(),
            empresa: document.getElementById('profile-company').value.trim(),
            documento: document.getElementById('profile-document').value.trim(),
        };
        
        const password = document.getElementById('profile-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;
        
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
        
        // Enviar datos al servidor
        const token = localStorage.getItem('authToken');
        const userId = window.currentUser._id;
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar perfil');
        }
        
        const data = await response.json();
        
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
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = 'auto';
        }, 300);
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showToast(error.message || 'Error al actualizar perfil', 'error');
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
    // Aquí puedes agregar más inicializaciones específicas del admin
    console.log('Dashboard de administrador inicializado');
}

/**
 * Configura la navegación entre secciones
 */
function setupSectionNavigation() {
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
            const targetSection = document.getElementById(section);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
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
 * Carga las estadísticas del dashboard
 */
function loadStatistics() {
    // Por ahora usamos datos simulados
    // En una implementación real, estos datos vendrían de la API
    const stats = {
        clients: 207,
        projects: 43,
        appointments: 15,
        messages: 8
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
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        margin-bottom: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Agregar estilos CSS para las animaciones
const style = document.createElement('style');
style.textContent = `
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
    
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        transition: opacity 0.3s ease;
    }
    
    .modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
    }
    
    .modal-content {
        background-color: #121212;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        animation: modalSlideIn 0.3s ease;
    }
    
    @keyframes modalSlideIn {
        from {
            transform: scale(0.7);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .modal-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h2 {
        margin: 0;
        color: var(--primary-color, #333);
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-btn:hover {
        color: #333;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .form-row {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
    }
    
    .form-row .form-group {
        flex: 1;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #ffffff;
    }
    
    .form-group input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
    }
    
    .form-group input:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
    
    .form-group input:disabled {
        background-color: #f5f5f5;
        color: #999;
        cursor: not-allowed;
    }
    
    .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }
    
    .primary-btn, .secondary-btn {
        padding: 10px 20px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .primary-btn {
        background-color: var(--primary-color, #007bff);
        color: white;
    }
    
    .primary-btn:hover {
        background-color: var(--primary-dark, #0056b3);
    }
    
    .primary-btn:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
    
    .secondary-btn {
        background-color: #6c757d;
        color: white;
    }
    
    .secondary-btn:hover {
        background-color: #545b62;
    }
`;
document.head.appendChild(style);