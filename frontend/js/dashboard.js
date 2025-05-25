/**
 * Dashboard Cliente - Funcionalidad Principal
 * Versión adaptada del dashboard de administrador para clientes
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Dashboard Cliente...');
    
    // Verificar autenticación y cargar datos del usuario
    checkClientAuthentication();
    
    // Inicializar componentes del dashboard
    initClientDashboard();
    
    // Configurar menú de usuario
    setupClientUserMenu();
    
    // Configurar navegación de secciones
    setupClientSectionNavigation();
    
    // Configurar quick actions
    setupClientQuickActions();
    
    // Configurar clicks en estadísticas
    setupClientStatisticsClicks();
    
    // Formatear fecha actual
    displayCurrentDate();
    
    // Cargar estadísticas dinámicas
    loadClientDynamicStatistics();
    
    // Cargar datos del dashboard
    loadDashboardData();
});

/**
 * Verifica si el usuario está autenticado y es cliente
 */
function checkClientAuthentication() {
    console.log('🔐 Verificando autenticación de cliente...');
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        console.warn('❌ No hay datos de autenticación, redirigiendo al login');
        window.location.href = '../login.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        
        // Verificar que sea cliente (no administrador)
        if (user.rol !== 'cliente') {
            console.warn('❌ Usuario no es cliente, redirigiendo');
            if (user.rol === 'admin' || user.rol === 'superadmin') {
                window.location.href = 'dashboardAdministrador.html';
            } else {
                window.location.href = '../login.html';
            }
            return;
        }
        
        console.log('✅ Usuario autenticado como cliente:', user.nombre);
        
        // Cargar datos del usuario en la interfaz
        loadClientUserData(user);
        
    } catch (error) {
        console.error('❌ Error al procesar datos de usuario:', error);
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

/**
 * Carga los datos del usuario cliente en la interfaz
 */
function loadClientUserData(user) {
    console.log('👤 Cargando datos del cliente en la interfaz...');
    
    // Actualizar nombre en el menú
    const clientNameElement = document.getElementById('client-name');
    const welcomeClientNameElement = document.getElementById('welcome-client-name');
    
    if (clientNameElement) {
        clientNameElement.textContent = `${user.nombre} ${user.apellidos}`;
    }
    
    if (welcomeClientNameElement) {
        welcomeClientNameElement.textContent = user.nombre;
    }
    
    // Guardar datos del usuario para uso posterior
    window.currentUser = user;
    
    console.log('✅ Datos del cliente cargados correctamente');
}

/**
 * Configura el menú de usuario (dropdown)
 */
function setupClientUserMenu() {
    console.log('🔧 Configurando menú de usuario cliente...');
    
    const userMenu = document.querySelector('.user-menu.client-menu');
    const userDropdown = document.getElementById('client-dropdown');
    
    if (!userMenu || !userDropdown) {
        console.warn('⚠️ Elementos del menú de usuario no encontrados');
        return;
    }
    
    // Toggle del dropdown al hacer clic en el menú
    userMenu.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('👆 Click en menú de usuario');
        userDropdown.classList.toggle('active');
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!userMenu.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Configurar botones del dropdown
    setupClientDropdownButtons();
    
    console.log('✅ Menú de usuario configurado');
}

/**
 * Configura los botones del dropdown de usuario cliente
 */
function setupClientDropdownButtons() {
    console.log('🔧 Configurando botones del dropdown cliente...');
    
    // Botón de perfil
    const profileBtn = document.getElementById('client-profile-link');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👤 Abriendo perfil de cliente');
            openClientProfileModal();
        });
    }
    
    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('client-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚪 Iniciando cierre de sesión');
            handleClientLogout();
        });
    }
    
    console.log('✅ Botones del dropdown configurados');
}

/**
 * Abre el modal de perfil del cliente
 */
function openClientProfileModal() {
    console.log('📝 Abriendo modal de perfil de cliente...');
    createClientProfileModal();
}

/**
 * Crea el modal de perfil con los datos del cliente
 */
function createClientProfileModal() {
    const user = window.currentUser;
    if (!user) {
        console.error('❌ No hay datos de usuario disponibles');
        showToast('Error: No se pudieron cargar los datos del usuario', 'error');
        return;
    }
    
    console.log('🔨 Creando modal de perfil...');
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('client-profile-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal active" id="client-profile-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-user"></i> Mi Perfil</h2>
                    <button class="close-btn" id="close-client-profile-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="client-profile-update-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="client-profile-name">Nombre *</label>
                                <input type="text" id="client-profile-name" value="${user.nombre || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="client-profile-lastname">Apellidos *</label>
                                <input type="text" id="client-profile-lastname" value="${user.apellidos || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="client-profile-email">Correo Electrónico *</label>
                                <input type="email" id="client-profile-email" value="${user.correo || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="client-profile-phone">Teléfono</label>
                                <input type="tel" id="client-profile-phone" value="${user.telefono || ''}" placeholder="Ej: +57 300 123 4567">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="client-profile-company">Empresa (Opcional)</label>
                            <input type="text" id="client-profile-company" value="${user.empresa || ''}" placeholder="Nombre de tu empresa">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="client-profile-document-type">Tipo de Documento</label>
                                <select id="client-profile-document-type">
                                    <option value="CC" ${(user.tipoDocumento || 'CC') === 'CC' ? 'selected' : ''}>Cédula de Ciudadanía</option>
                                    <option value="CE" ${user.tipoDocumento === 'CE' ? 'selected' : ''}>Cédula de Extranjería</option>
                                    <option value="NIT" ${user.tipoDocumento === 'NIT' ? 'selected' : ''}>NIT</option>
                                    <option value="PASAPORTE" ${user.tipoDocumento === 'PASAPORTE' ? 'selected' : ''}>Pasaporte</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="client-profile-document">Número de Documento</label>
                                <input type="text" id="client-profile-document" value="${user.documento || ''}" placeholder="Número de documento">
                            </div>
                        </div>
                        
                        <div class="password-section">
                            <h4 style="margin: 24px 0 16px 0; color: #ffffff; font-size: 16px;">
                                <i class="fas fa-lock"></i> Cambiar Contraseña (Opcional)
                            </h4>
                            
                            <div class="form-group">
                                <label for="client-profile-current-password">Contraseña Actual</label>
                                <div style="position: relative;">
                                    <input type="password" id="client-profile-current-password" placeholder="Ingresa tu contraseña actual">
                                    <button type="button" class="password-toggle-btn" data-target="client-profile-current-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="client-profile-new-password">Nueva Contraseña</label>
                                    <div style="position: relative;">
                                        <input type="password" id="client-profile-new-password" placeholder="Mínimo 6 caracteres">
                                        <button type="button" class="password-toggle-btn" data-target="client-profile-new-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <small style="color: #999; font-size: 12px;">Deja vacío si no deseas cambiar la contraseña</small>
                                </div>
                                <div class="form-group">
                                    <label for="client-profile-confirm-password">Confirmar Nueva Contraseña</label>
                                    <div style="position: relative;">
                                        <input type="password" id="client-profile-confirm-password" placeholder="Confirma la nueva contraseña">
                                        <button type="button" class="password-toggle-btn" data-target="client-profile-confirm-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-info" style="background: rgba(33, 150, 243, 0.1); padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2196F3;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <i class="fas fa-info-circle" style="color: #2196F3;"></i>
                                <strong style="color: #ffffff;">Información Importante</strong>
                            </div>
                            <ul style="margin: 0; padding-left: 20px; color: #cccccc; font-size: 14px; line-height: 1.5;">
                                <li>Los campos marcados con (*) son obligatorios</li>
                                <li>Tu correo electrónico es usado para notificaciones importantes</li>
                                <li>Solo cambia la contraseña si es necesario por seguridad</li>
                                <li>Tus datos están protegidos y no se comparten con terceros</li>
                            </ul>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="secondary-btn" id="cancel-client-profile-btn">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="primary-btn" id="save-client-profile-btn">
                                <i class="fas fa-save"></i> Guardar Cambios
                            </button>
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
        setupClientProfileModalEvents();
    }, 100);
    
    console.log('✅ Modal de perfil creado y configurado');
}

/**
 * Configura los eventos del modal de perfil del cliente
 */
function setupClientProfileModalEvents() {
    console.log('🔧 Configurando eventos del modal de perfil...');
    
    const modal = document.getElementById('client-profile-modal');
    const closeBtn = document.getElementById('close-client-profile-modal');
    const cancelBtn = document.getElementById('cancel-client-profile-btn');
    const form = document.getElementById('client-profile-update-form');
    
    if (!modal) {
        console.error('❌ Modal no encontrado');
        return;
    }
    
    // Función para cerrar modal
    function closeModal() {
        console.log('🚪 Cerrando modal de perfil');
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
    
    // Cerrar con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Toggle de contraseñas
    const passwordToggles = modal.querySelectorAll('.password-toggle-btn');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
    
    // Validación de contraseñas en tiempo real
    const newPasswordInput = document.getElementById('client-profile-new-password');
    const confirmPasswordInput = document.getElementById('client-profile-confirm-password');
    
    if (newPasswordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const newPassword = newPasswordInput.value;
            const confirmPassword = this.value;
            
            if (confirmPassword && newPassword !== confirmPassword) {
                this.setCustomValidity('Las contraseñas no coinciden');
                this.style.borderColor = '#f44336';
            } else {
                this.setCustomValidity('');
                this.style.borderColor = '';
            }
        });
    }
    
    // Envío del formulario
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleClientProfileUpdate(e);
        });
    }
    
    console.log('✅ Eventos del modal configurados correctamente');
}

/**
 * Maneja la actualización del perfil del cliente
 */
async function handleClientProfileUpdate(e) {
    console.log('💾 Iniciando actualización del perfil de cliente...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-client-profile-btn');
    
    if (!submitBtn) {
        console.error('❌ Botón de envío no encontrado');
        return;
    }
    
    const originalText = submitBtn.innerHTML;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Recopilar datos del formulario
        const formData = {
            nombre: document.getElementById('client-profile-name')?.value?.trim() || '',
            apellidos: document.getElementById('client-profile-lastname')?.value?.trim() || '',
            correo: document.getElementById('client-profile-email')?.value?.trim() || '',
            telefono: document.getElementById('client-profile-phone')?.value?.trim() || '',
            empresa: document.getElementById('client-profile-company')?.value?.trim() || '',
            tipoDocumento: document.getElementById('client-profile-document-type')?.value || 'CC',
            documento: document.getElementById('client-profile-document')?.value?.trim() || '',
        };
        
        const currentPassword = document.getElementById('client-profile-current-password')?.value || '';
        const newPassword = document.getElementById('client-profile-new-password')?.value || '';
        const confirmPassword = document.getElementById('client-profile-confirm-password')?.value || '';
        
        console.log('📋 Datos del formulario recopilados:', {
            ...formData,
            hasCurrentPassword: !!currentPassword,
            hasNewPassword: !!newPassword
        });
        
        // Validar campos obligatorios
        if (!formData.nombre || !formData.apellidos || !formData.correo) {
            throw new Error('Nombre, apellidos y correo son obligatorios');
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correo)) {
            throw new Error('Por favor, introduce un email válido');
        }
        
        // Validar contraseñas si se proporcionaron
        if (newPassword || confirmPassword || currentPassword) {
            if (!currentPassword) {
                throw new Error('Debes introducir tu contraseña actual para cambiarla');
            }
            if (!newPassword) {
                throw new Error('Debes introducir una nueva contraseña');
            }
            if (newPassword !== confirmPassword) {
                throw new Error('Las nuevas contraseñas no coinciden');
            }
            if (newPassword.length < 6) {
                throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
            }
            
            // Agregar contraseñas a los datos
            formData.currentPassword = currentPassword;
            formData.password = newPassword;
        }
        
        console.log('✅ Validación completada, enviando datos al servidor...');
        
        // Enviar datos al servidor
        const token = localStorage.getItem('authToken');
        const userId = window.currentUser._id;
        
        if (!token || !userId) {
            throw new Error('Datos de autenticación no encontrados');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        console.log('🌐 Enviando petición a:', `${API_BASE}/api/users/${userId}`);
        
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 Respuesta del servidor:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Error del servidor:', error);
            throw new Error(error.message || 'Error al actualizar perfil');
        }
        
        const data = await response.json();
        console.log('✅ Perfil actualizado exitosamente:', data);
        
        // Actualizar datos locales
        const updatedUser = { ...window.currentUser, ...data.data };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        window.currentUser = updatedUser;
        
        // Actualizar interfaz
        loadClientUserData(updatedUser);
        
        // Mostrar mensaje de éxito
        showToast('Perfil actualizado correctamente', 'success');
        
        // Cerrar modal
        const modal = document.getElementById('client-profile-modal');
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
        console.error('❌ Error al actualizar perfil:', error);
        showToast(error.message || 'Error al actualizar perfil', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Maneja el cierre de sesión del cliente
 */
function handleClientLogout() {
    console.log('🚪 Iniciando proceso de cierre de sesión...');
    
    // Mostrar confirmación
    const confirmed = confirm('¿Estás seguro de que deseas cerrar sesión?');
    
    if (confirmed) {
        console.log('✅ Cierre de sesión confirmado');
        
        try {
            // Limpiar datos de autenticación
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            
            // Limpiar datos adicionales si existen
            localStorage.removeItem('clientProjects');
            localStorage.removeItem('clientAppointments');
            localStorage.removeItem('clientMessages');
            
            console.log('🧹 Datos locales limpiados');
            
            // Mostrar mensaje de despedida
            showToast('Sesión cerrada correctamente. ¡Hasta pronto!', 'success');
            
            // Redirigir al login después de un breve delay
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error durante el cierre de sesión:', error);
            // Aún así redirigir por seguridad
            window.location.href = '../login.html';
        }
    } else {
        console.log('❌ Cierre de sesión cancelado');
    }
}

/**
 * Configura las quick actions del dropdown
 */
function setupClientQuickActions() {
    console.log('🔧 Configurando quick actions del cliente...');
    
    const quickActionsBtn = document.querySelector('.quick-actions .primary-btn');
    const dropdown = document.querySelector('.quick-actions .dropdown');
    
    if (!quickActionsBtn || !dropdown) {
        console.warn('⚠️ Elementos de quick actions no encontrados');
        return;
    }
    
    // Toggle del dropdown de quick actions
    quickActionsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('👆 Click en quick actions');
        dropdown.classList.toggle('active');
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Configurar acciones específicas
    setupClientQuickActionButtons();
    
    console.log('✅ Quick actions configuradas');
}

/**
 * Configura los botones específicos de quick actions del cliente
 */
function setupClientQuickActionButtons() {
    console.log('🔧 Configurando botones de quick actions...');
    
    const requestProjectBtn = document.getElementById('request-project');
    const scheduleAppointmentBtn = document.getElementById('schedule-appointment');
    const sendMessageBtn = document.getElementById('send-message');
    
    if (requestProjectBtn) {
        requestProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📋 Solicitar proyecto desde quick actions');
            
            const dropdown = document.querySelector('.quick-actions .dropdown');
            if (dropdown) dropdown.classList.remove('active');
            
            // Ir a la sección de proyectos y abrir modal de solicitud
            switchToClientSection('projects');
        });
    }
    
    if (scheduleAppointmentBtn) {
        scheduleAppointmentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📅 Agendar cita desde quick actions');
            
            const dropdown = document.querySelector('.quick-actions .dropdown');
            if (dropdown) dropdown.classList.remove('active');
            
            // Ir a la sección de citas y abrir modal de agendamiento
            switchToClientSection('appointments');
            setTimeout(() => {
                openScheduleAppointmentModal();
            }, 300);
        });
    }
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('💬 Enviar mensaje desde quick actions');
            
            const dropdown = document.querySelector('.quick-actions .dropdown');
            if (dropdown) dropdown.classList.remove('active');
            
            // Ir a la sección de mensajes y abrir modal de nuevo mensaje
            switchToClientSection('messages');
            setTimeout(() => {
                openSendMessageModal();
            }, 300);
        });
    }
    
    console.log('✅ Botones de quick actions configurados');
}

/**
 * Configura clicks en las tarjetas de estadísticas
 */
function setupClientStatisticsClicks() {
    console.log('🔧 Configurando clicks en estadísticas...');
    
    // Click en tarjeta de proyectos
    const projectsCard = document.querySelector('.stat-card .projects-icon')?.closest('.stat-card');
    if (projectsCard) {
        projectsCard.style.cursor = 'pointer';
        projectsCard.title = 'Ver mis proyectos';
        projectsCard.addEventListener('click', function() {
            console.log('📋 Click en tarjeta de proyectos');
            switchToClientSection('projects');
        });
    }
    
    // Click en tarjeta de citas
    const appointmentsCard = document.querySelector('.stat-card .appointments-icon')?.closest('.stat-card');
    if (appointmentsCard) {
        appointmentsCard.style.cursor = 'pointer';
        appointmentsCard.title = 'Ver mis citas';
        appointmentsCard.addEventListener('click', function() {
            console.log('📅 Click en tarjeta de citas');
            switchToClientSection('appointments');
        });
    }
    
    // Click en tarjeta de mensajes
    const messagesCard = document.querySelector('.stat-card .messages-icon')?.closest('.stat-card');
    if (messagesCard) {
        messagesCard.style.cursor = 'pointer';
        messagesCard.title = 'Ver mis mensajes';
        messagesCard.addEventListener('click', function() {
            console.log('💬 Click en tarjeta de mensajes');
            switchToClientSection('messages');
        });
    }
    
    console.log('✅ Clicks en estadísticas configurados');
}

/**
 * Cambia a una sección específica del dashboard cliente
 */
function switchToClientSection(sectionId) {
    console.log('🔄 Cambiando a sección:', sectionId);
    
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
        setTimeout(() => {
            switch(sectionId) {
                case 'overview':
                    loadDashboardData();
                    break;
                case 'projects':
                    initClientProjectsModule();
                    break;
                case 'appointments':
                    loadClientAppointments();
                    break;
                case 'messages':
                    loadClientMessages();
                    break;
                case 'billing':
                    loadClientBilling();
                    break;
                default:
                    console.log(`Sección ${sectionId} cargada`);
            }
        }, 150);
    } else {
        console.error(`❌ Sección ${sectionId} no encontrada`);
    }
}

/**
 * Configura la navegación entre secciones
 */
function setupClientSectionNavigation() {
    console.log('🔧 Configurando navegación de secciones...');
    
    const sidebarLinks = document.querySelectorAll('.sidebar-menu li');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            console.log('👆 Click en sidebar:', section);
            
            if (section) {
                switchToClientSection(section);
            }
        });
    });
    
    console.log('✅ Navegación de secciones configurada');
}

/**
 * Carga estadísticas dinámicas del cliente
 */
async function loadClientDynamicStatistics() {
    console.log('📊 Cargando estadísticas dinámicas del cliente...');
    
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('⚠️ No hay token de autenticación');
            loadClientStaticStatistics();
            return;
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Cargar estadísticas en paralelo
        await Promise.all([
            loadClientProjectsStatistics(API_BASE, token),
            loadClientAppointmentsStatistics(API_BASE, token),
            loadClientMessagesStatistics(API_BASE, token),
            loadClientMembershipTime()
        ]);
        
        console.log('✅ Estadísticas dinámicas cargadas');
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas dinámicas:', error);
        loadClientStaticStatistics();
    }
}

/**
 * Carga estadísticas de proyectos del cliente
 */
async function loadClientProjectsStatistics(API_BASE, token) {
    try {
        console.log('📋 Cargando estadísticas de proyectos...');
        
        const response = await fetch(`${API_BASE}/api/projects?cliente=${window.currentUser._id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const projects = data.data || [];
            
            // Actualizar contador
            const projectsCount = document.getElementById('client-projects-count');
            if (projectsCount) {
                projectsCount.textContent = projects.length;
            }
            
            // Actualizar descripción con proyectos activos
            const activeProjects = projects.filter(p => 
                ['iniciado', 'desarrollo inicial', 'desarrollo medio', 'pago procesado'].includes(p.estado)
            ).length;
            
            const projectsDescription = document.querySelector('.projects-icon')?.closest('.stat-card')?.querySelector('.stat-description');
            if (projectsDescription) {
                projectsDescription.textContent = `${activeProjects} en desarrollo`;
            }
            
            console.log('✅ Estadísticas de proyectos cargadas:', {
                total: projects.length,
                activos: activeProjects
            });
            
        } else {
            console.warn('⚠️ No se pudieron cargar estadísticas de proyectos');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas de proyectos:', error);
    }
}

/**
 * Carga estadísticas de citas del cliente
 */
async function loadClientAppointmentsStatistics(API_BASE, token) {
    try {
        console.log('📅 Cargando estadísticas de citas...');
        
        const response = await fetch(`${API_BASE}/api/appointments?usuario=${window.currentUser._id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const appointments = data.data || [];
            
            // Filtrar citas futuras
            const now = new Date();
            const upcomingAppointments = appointments.filter(apt => {
                const aptDate = new Date(apt.fecha);
                return aptDate >= now && (apt.estado === 'pendiente' || apt.estado === 'confirmada');
            });
            
            // Actualizar contador
            const appointmentsCount = document.getElementById('client-appointments-count');
            if (appointmentsCount) {
                appointmentsCount.textContent = upcomingAppointments.length;
            }
            
            const appointmentsDescription = document.querySelector('.appointments-icon')?.closest('.stat-card')?.querySelector('.stat-description');
            if (appointmentsDescription) {
                appointmentsDescription.textContent = upcomingAppointments.length > 0 ? 'próximas' : 'ninguna programada';
            }
            
            console.log('✅ Estadísticas de citas cargadas:', {
                total: appointments.length,
                proximas: upcomingAppointments.length
            });
            
        } else {
            console.warn('⚠️ No se pudieron cargar estadísticas de citas');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas de citas:', error);
    }
}

/**
 * Carga estadísticas de mensajes del cliente
 */
async function loadClientMessagesStatistics(API_BASE, token) {
    try {
        console.log('💬 Cargando estadísticas de mensajes...');
        
        const response = await fetch(`${API_BASE}/api/messages/conversations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const conversations = data.data || [];
            
            // Para clientes, debería haber solo una conversación
            let unreadMessages = 0;
            if (conversations.length > 0) {
                unreadMessages = conversations[0].mensajesNoLeidos || 0;
            }
            
            // Actualizar contador
            const messagesCount = document.getElementById('client-messages-count');
            if (messagesCount) {
                messagesCount.textContent = unreadMessages;
            }
            
            const messagesDescription = document.querySelector('.messages-icon')?.closest('.stat-card')?.querySelector('.stat-description');
            if (messagesDescription) {
                messagesDescription.textContent = unreadMessages > 0 ? 'sin leer' : 'al día';
            }
            
            console.log('✅ Estadísticas de mensajes cargadas:', {
                conversaciones: conversations.length,
                noLeidos: unreadMessages
            });
            
        } else {
            console.warn('⚠️ No se pudieron cargar estadísticas de mensajes');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas de mensajes:', error);
    }
}

/**
 * Calcula el tiempo como cliente
 */
function loadClientMembershipTime() {
    try {
        console.log('⏰ Calculando tiempo como cliente...');
        
        const user = window.currentUser;
        if (!user || !user.fechaRegistro) {
            console.warn('⚠️ No hay fecha de registro disponible');
            return;
        }
        
        const registrationDate = new Date(user.fechaRegistro);
        const now = new Date();
        const diffTime = Math.abs(now - registrationDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Actualizar contador
        const memberTimeElement = document.getElementById('client-member-time');
        if (memberTimeElement) {
            memberTimeElement.textContent = diffDays;
        }
        
        console.log('✅ Tiempo como cliente calculado:', diffDays, 'días');
        
    } catch (error) {
        console.error('❌ Error al calcular tiempo como cliente:', error);
    }
}

/**
 * Carga estadísticas estáticas como fallback
 */
function loadClientStaticStatistics() {
    console.log('📊 Cargando estadísticas estáticas...');
    
    const stats = {
        projects: 0,
        appointments: 0,
        messages: 0,
        memberTime: 0
    };
    
    // Actualizar elementos
    const projectsCount = document.getElementById('client-projects-count');
    const appointmentsCount = document.getElementById('client-appointments-count');
    const messagesCount = document.getElementById('client-messages-count');
    const memberTimeCount = document.getElementById('client-member-time');
    
    if (projectsCount) projectsCount.textContent = stats.projects;
    if (appointmentsCount) appointmentsCount.textContent = stats.appointments;
    if (messagesCount) messagesCount.textContent = stats.messages;
    if (memberTimeCount) memberTimeCount.textContent = stats.memberTime;
}

/**
 * Carga datos del dashboard
 */
function loadDashboardData() {
    console.log('📊 Cargando datos del dashboard...');
    
    // Cargar proyectos recientes
    loadRecentProjects();
    
    // Cargar citas próximas
    loadUpcomingAppointments();
    
    // Cargar actividad reciente
    loadRecentActivity();
}

/**
 * Placeholder functions para cargar datos específicos
 */
function loadRecentProjects() {
    console.log('📋 Cargando proyectos recientes...');
    // Implementar carga de proyectos recientes
}

function loadUpcomingAppointments() {
    console.log('📅 Cargando citas próximas...');
    // Implementar carga de citas próximas
}

function loadRecentActivity() {
    console.log('📈 Cargando actividad reciente...');
    // Implementar carga de actividad reciente
}

function loadClientProjects() {
    console.log('📋 Cargando proyectos del cliente...');
    // Implementar carga de proyectos del cliente3
    initClientProjectsModule();
}

function loadClientAppointments() {
    console.log('📅 Cargando citas del cliente...');
    // Implementar carga de citas del cliente
}

function loadClientMessages() {
    console.log('💬 Cargando mensajes del cliente...');
    // Implementar carga de mensajes del cliente
}

function loadClientBilling() {
    console.log('💰 Cargando facturación del cliente...');
    // Implementar carga de datos de facturación
}

function openScheduleAppointmentModal() {
    console.log('📅 Abriendo modal de agendar cita...');
    showToast('Funcionalidad de agendar cita próximamente', 'info');
}

function openSendMessageModal() {
    console.log('💬 Abriendo modal de enviar mensaje...');
    showToast('Funcionalidad de mensajes próximamente', 'info');
}

/**
 * Inicializa el dashboard del cliente
 */
function initClientDashboard() {
    console.log('🚀 Dashboard de cliente inicializado');
    
    // Configurar botones adicionales
    setupAdditionalButtons();
}

/**
 * Configura botones adicionales del dashboard
 */
function setupAdditionalButtons() {
    
    // Botón de agendar cita
    const scheduleAppointmentBtn = document.getElementById('schedule-new-appointment-btn');
    if (scheduleAppointmentBtn) {
        scheduleAppointmentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openScheduleAppointmentModal();
        });
    }
    
    // Botón de nuevo mensaje
    const newMessageBtn = document.getElementById('client-new-message-btn');
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openSendMessageModal();
        });
    }
    
    // Botón de iniciar conversación
    const startConversationBtn = document.getElementById('start-client-conversation-btn');
    if (startConversationBtn) {
        startConversationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openSendMessageModal();
        });
    }
    
    // Botón de refrescar mensajes
    const refreshMessagesBtn = document.getElementById('client-refresh-messages-btn');
    if (refreshMessagesBtn) {
        refreshMessagesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadClientMessages();
            showToast('Mensajes actualizados', 'success');
        });
    }
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
    console.log(`🍞 Toast ${type}:`, message);
    
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
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${getToastColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        min-width: 280px;
        font-size: 14px;
        line-height: 1.4;
        pointer-events: all;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    `;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="fas fa-${icon}" style="font-size: 16px; flex-shrink: 0;"></i>
        <span style="flex: 1;">${message}</span>
        <button style="background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s;">
            <i class="fas fa-times" style="font-size: 12px;"></i>
        </button>
    `;
    
    // Agregar barra de progreso
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255,255,255,0.3);
        width: 100%;
        animation: progressShrink 4s linear;
    `;
    toast.appendChild(progressBar);
    
    toastContainer.appendChild(toast);
    
    // Configurar cierre manual
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        removeToast(toast);
    });
    
    // Cerrar al hacer click en el toast
    toast.addEventListener('click', function() {
        removeToast(toast);
    });
    
    // Eliminar automáticamente después de 4 segundos
    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

/**
 * Obtiene el color del toast según el tipo
 */
function getToastColor(type) {
    switch(type) {
        case 'success': return 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        case 'error': return 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        case 'warning': return 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        case 'info': return 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
        default: return 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)';
    }
}

/**
 * Obtiene el icono del toast según el tipo
 */
function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'times-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'bell';
    }
}

/**
 * Remueve un toast de la pantalla
 */
function removeToast(toast) {
    if (toast && toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }
}

// Exponer funciones globalmente para uso en otros módulos
window.showToast = showToast;
window.switchToClientSection = switchToClientSection;
window.loadClientDynamicStatistics = loadClientDynamicStatistics;

// CSS adicional para el dashboard cliente
const clientDashboardStyles = document.createElement('style');
clientDashboardStyles.textContent = `
    /* Estilos específicos para el dashboard cliente */
    
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
    
    @keyframes progressShrink {
        from { width: 100%; }
        to { width: 0%; }
    }
    
    /* Estilos para las tarjetas de estadísticas clickeables */
    .stat-card:hover {
        transform: translateY(-3px);
        transition: transform 0.3s ease;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    
    .stat-card {
        transition: all 0.3s ease;
        cursor: default;
    }
    
    .stat-card[title] {
        cursor: pointer;
    }
    
    /* Estilos mejorados para el dropdown de quick actions */
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
        min-width: 220px;
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
        color: var(--primary-color, #5accc9);
        font-size: 14px;
    }
    
    /* Estilos mejorados para el botón de quick actions */
    .quick-actions .primary-btn {
        background: linear-gradient(135deg, var(--primary-color, #5accc9) 0%, var(--secondary-color, #40b4fb) 100%);
        border: none;
        border-radius: 8px;
        padding: 12px 20px;
        color: var(--dark-blue, #001e3c);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 10px rgba(90, 204, 201, 0.3);
        cursor: pointer;
    }
    
    .quick-actions .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(90, 204, 201, 0.4);
    }
    
    /* Estilos para modales */
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
        display: flex;
        align-items: center;
        gap: 12px;
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
    
    /* Estilos para formularios */
    .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
    }
    
    .form-group {
        flex: 1;
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
        border-color: var(--primary-color, #5accc9);
        box-shadow: 0 0 0 3px rgba(90, 204, 201, 0.1);
        background-color: #333;
    }
    
    .form-group input::placeholder,
    .form-group textarea::placeholder {
        color: #999;
    }
    
    /* Botones de toggle para contraseñas */
    .password-toggle-btn {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .password-toggle-btn:hover {
        color: var(--primary-color, #5accc9);
        background-color: rgba(90, 204, 201, 0.1);
    }
    
    /* Sección de contraseña */
    .password-section {
        background: rgba(255, 255, 255, 0.02);
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #333;
        margin: 20px 0;
    }
    
    /* Información de formulario */
    .form-info {
        background: rgba(33, 150, 243, 0.1);
        padding: 16px;
        border-radius: 8px;
        margin: 24px 0;
        border-left: 4px solid #2196F3;
    }
    
    .form-info ul {
        margin: 0;
        padding-left: 20px;
        color: #cccccc;
        font-size: 14px;
        line-height: 1.6;
    }
    
    .form-info li {
        margin-bottom: 4px;
    }
    
    /* Acciones de formulario */
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
        text-decoration: none;
    }
    
    .primary-btn {
        background: linear-gradient(135deg, var(--primary-color, #5accc9) 0%, var(--secondary-color, #40b4fb) 100%);
        color: var(--dark-blue, #001e3c);
        box-shadow: 0 2px 10px rgba(90, 204, 201, 0.3);
    }
    
    .primary-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 20px rgba(90, 204, 201, 0.4);
    }
    
    .primary-btn:disabled {
        background: #666;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        color: #ccc;
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
    
    /* Loading spinner */
    .loading-spinner {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--primary-color, #5accc9);
        font-size: 18px;
    }
    
    .loading-spinner i {
        margin-right: 12px;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .form-row {
            flex-direction: column;
            gap: 12px;
        }
        
        .modal-content {
            width: 95%;
            margin: 20px;
        }
        
        .modal-header,
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
        
        .dropdown-menu {
            min-width: 200px;
        }
    }
`;

/**
 * Carga proyectos recientes para mostrar en el dashboard
 */
async function loadRecentProjects() {
    console.log('📋 Cargando proyectos recientes...');
    
    try {
        const token = localStorage.getItem('authToken');
        const user = window.currentUser;
        
        if (!token || !user) {
            console.warn('⚠️ No hay datos de autenticación');
            showEmptyRecentProjects();
            return;
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Cargar proyectos del cliente actual
        const response = await fetch(`${API_BASE}/api/projects?cliente=${user._id}&limit=3`, {
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
        
        console.log('✅ Proyectos cargados:', projects.length);
        
        // Filtrar solo proyectos en progreso
        const projectsInProgress = projects.filter(project => 
            ['pago procesado', 'iniciado', 'desarrollo inicial', 'desarrollo medio'].includes(project.estado)
        );
        
        renderRecentProjects(projectsInProgress);
        
    } catch (error) {
        console.error('❌ Error al cargar proyectos recientes:', error);
        showEmptyRecentProjects();
    }
}

/**
 * Renderiza los proyectos recientes en el dashboard
 */
function renderRecentProjects(projects) {
    const container = document.getElementById('recent-projects-container');
    if (!container) {
        console.warn('⚠️ Contenedor de proyectos recientes no encontrado');
        return;
    }
    
    if (projects.length === 0) {
        showEmptyRecentProjects();
        return;
    }
    
    const estadoLabels = {
        'cotizacion': 'Cotización',
        'pago procesado': 'Pago Procesado',
        'iniciado': 'Iniciado',
        'desarrollo inicial': 'Desarrollo Inicial',
        'desarrollo medio': 'Desarrollo Medio',
        'finalizado': 'Finalizado'
    };
    
    const categoriaLabels = {
        'web-development': 'Desarrollo Web',
        'ecommerce': 'Tienda Online',
        'marketing-digital': 'Marketing Digital',
        'social-media': 'Redes Sociales',
        'seo': 'SEO',
        'branding': 'Branding',
        'design': 'Diseño Gráfico'
    };
    
    const projectsHTML = projects.map(project => `
        <div class="recent-project-card" onclick="viewClientProject('${project._id}')">
            <div class="project-card-header">
                <div class="project-card-icon">
                    <i class="fas fa-project-diagram"></i>
                </div>
                <div class="project-card-info">
                    <h4>${project.nombre}</h4>
                    <p class="project-category">${categoriaLabels[project.categoria] || project.categoria}</p>
                </div>
                <span class="project-status-badge" data-status="${project.estado}">
                    ${estadoLabels[project.estado] || project.estado}
                </span>
            </div>
            
            <div class="project-progress-container">
                <div class="progress-info">
                    <span>Progreso</span>
                    <span>${project.porcentajeProgreso || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${project.porcentajeProgreso || 0}%;"></div>
                </div>
            </div>
            
            <div class="project-card-footer">
                <div class="project-date">
                    <i class="far fa-calendar-alt"></i>
                    <span>Actualizado: ${new Date(project.fechaActualizacion || project.fechaCreacion).toLocaleDateString('es-ES')}</span>
                </div>
                ${project.costo ? `
                <div class="project-cost">
                    <i class="fas fa-dollar-sign"></i>
                    <span>$${project.costo.toLocaleString()}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = projectsHTML;
}

/**
 * Muestra mensaje cuando no hay proyectos recientes
 */
function showEmptyRecentProjects() {
    const container = document.getElementById('recent-projects-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fas fa-project-diagram"></i>
            </div>
            <h4>No hay proyectos en progreso</h4>
            <p>Aún no tienes proyectos activos. Contacta con nuestro equipo para iniciar tu primer proyecto.</p>
            <button class="primary-btn" onclick="switchToClientSection('projects')">
                <i class="fas fa-plus"></i> Solicitar Proyecto
            </button>
        </div>
    `;
}

/**
 * Carga citas próximas para mostrar en el dashboard
 */
async function loadUpcomingAppointments() {
    console.log('📅 Cargando citas próximas...');
    
    try {
        const token = localStorage.getItem('authToken');
        const user = window.currentUser;
        
        if (!token || !user) {
            console.warn('⚠️ No hay datos de autenticación');
            showEmptyUpcomingAppointments();
            return;
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Cargar citas del cliente actual - solo futuras
        const response = await fetch(`${API_BASE}/api/appointments?usuario=${user._id}&futuras=true&limit=3`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar citas');
        }
        
        const data = await response.json();
        const appointments = data.data || [];
        
        console.log('✅ Citas próximas cargadas:', appointments.length);
        
        // Filtrar solo citas pendientes y confirmadas
        const upcomingAppointments = appointments.filter(apt => 
            ['pendiente', 'confirmada'].includes(apt.estado)
        );
        
        renderUpcomingAppointments(upcomingAppointments);
        
    } catch (error) {
        console.error('❌ Error al cargar citas próximas:', error);
        showEmptyUpcomingAppointments();
    }
}

/**
 * Renderiza las citas próximas en el dashboard
 */
function renderUpcomingAppointments(appointments) {
    const container = document.getElementById('recent-appointments-container');
    if (!container) {
        console.warn('⚠️ Contenedor de citas próximas no encontrado');
        return;
    }
    
    if (appointments.length === 0) {
        showEmptyUpcomingAppointments();
        return;
    }
    
    const tipoLabels = {
        'consulta-general': 'Consulta General',
        'plan-personalizado': 'Plan Personalizado',
        'seguimiento-proyecto': 'Seguimiento de Proyecto'
    };
    
    const estadoLabels = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'completada': 'Completada'
    };
    
    const appointmentsHTML = appointments.map(appointment => {
        const fecha = new Date(appointment.fecha);
        const fechaFormatted = fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        
        const tiempoHasta = getTimeUntilDate(fecha);
        
        return `
            <div class="upcoming-appointment-card" onclick="viewClientAppointment('${appointment._id}')">
                <div class="appointment-card-header">
                    <div class="appointment-card-icon">
                        <i class="far fa-calendar-alt"></i>
                    </div>
                    <div class="appointment-card-info">
                        <h4>${tipoLabels[appointment.tipo] || appointment.tipo}</h4>
                        <p class="appointment-date">${fechaFormatted}</p>
                    </div>
                    <span class="appointment-status-badge" data-status="${appointment.estado}">
                        ${estadoLabels[appointment.estado] || appointment.estado}
                    </span>
                </div>
                
                <div class="appointment-details">
                    <div class="appointment-time">
                        <i class="far fa-clock"></i>
                        <span>${appointment.hora}</span>
                    </div>
                    
                    <div class="appointment-countdown">
                        <i class="fas fa-hourglass-half"></i>
                        <span class="countdown-text">${tiempoHasta}</span>
                    </div>
                </div>
                
                ${appointment.proyectoDetalles ? `
                <div class="appointment-project">
                    <i class="fas fa-project-diagram"></i>
                    <span>Proyecto: ${appointment.proyectoDetalles.nombre}</span>
                </div>
                ` : ''}
                
                ${appointment.notas ? `
                <div class="appointment-notes">
                    <i class="fas fa-sticky-note"></i>
                    <span>${appointment.notas}</span>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = appointmentsHTML;
}

/**
 * Muestra mensaje cuando no hay citas próximas
 */
function showEmptyUpcomingAppointments() {
    const container = document.getElementById('recent-appointments-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="far fa-calendar-alt"></i>
            </div>
            <h4>No hay citas programadas</h4>
            <p>No tienes citas próximas programadas. Agenda una cita para consultoría o seguimiento de tus proyectos.</p>
            <button class="primary-btn" onclick="switchToClientSection('appointments')">
                <i class="far fa-calendar-plus"></i> Agendar Cita
            </button>
        </div>
    `;
}

/**
 * Calcula el tiempo hasta una fecha determinada
 */
function getTimeUntilDate(targetDate) {
    const now = new Date();
    const timeDiff = targetDate - now;
    
    if (timeDiff < 0) {
        return 'Vencida';
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `En ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `En ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `En ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
        return 'Muy pronto';
    }
}

/**
 * Ver detalles de un proyecto del cliente
 */
function viewClientProject(projectId) {
    console.log('👁️ Ver proyecto cliente:', projectId);
    
    // Cambiar a la sección de proyectos y luego mostrar detalles
    switchToClientSection('projects');
    
    // Dar tiempo para que cargue la sección y luego mostrar detalles
    setTimeout(() => {
        if (window.showClientProjectDetails) {
            window.showClientProjectDetails(projectId);
        } else {
            showToast('Cargando detalles del proyecto...', 'info');
        }
    }, 500);
}

/**
 * Ver detalles de una cita del cliente
 */
function viewClientAppointment(appointmentId) {
    console.log('👁️ Ver cita cliente:', appointmentId);
    
    // Cambiar a la sección de citas y luego mostrar detalles
    switchToClientSection('appointments');
    
    // Dar tiempo para que cargue la sección y luego mostrar detalles
    setTimeout(() => {
        if (window.showClientAppointmentDetails) {
            window.showClientAppointmentDetails(appointmentId);
        } else {
            showToast('Cargando detalles de la cita...', 'info');
        }
    }, 500);
}

/**
 * Carga actividad reciente (opcional)
 */
async function loadRecentActivity() {
    console.log('📈 Cargando actividad reciente...');
    
    try {
        // Combinar datos de proyectos y citas para mostrar actividad
        const token = localStorage.getItem('authToken');
        const user = window.currentUser;
        
        if (!token || !user) {
            console.warn('⚠️ No hay datos de autenticación para actividad');
            return;
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Cargar mensajes recientes para mostrar como actividad
        const messagesResponse = await fetch(`${API_BASE}/api/messages/conversations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const conversations = messagesData.data || [];
            
            if (conversations.length > 0 && conversations[0].messages) {
                const recentMessages = conversations[0].messages.slice(-3);
                console.log('📨 Mensajes recientes para actividad:', recentMessages.length);
            }
        }
        
    } catch (error) {
        console.error('❌ Error al cargar actividad reciente:', error);
    }
}

document.head.appendChild(clientDashboardStyles);

window.viewClientProject = viewClientProject;
window.viewClientAppointment = viewClientAppointment;
window.loadRecentProjects = loadRecentProjects;
window.loadUpcomingAppointments = loadUpcomingAppointments;

console.log('✅ Dashboard Cliente - JavaScript cargado completamente');