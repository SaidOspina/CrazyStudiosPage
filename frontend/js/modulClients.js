let currentClientsPage = 1;
let clientsPerPage = 10;
let clientsData = [];
let filteredClientsData = [];

/**
 * Inicializa el módulo de clientes cuando se carga la sección
 */
function initClientsModule() {
    console.log('Inicializando módulo de clientes...');
    
    // Configurar eventos de la sección de clientes
    setupClientsEvents();
    
    // Cargar datos de clientes
    loadClientsData();
    
    // Configurar filtros
    setupClientsFilters();
    
    // Configurar paginación
    setupClientsPagination();
}

/**
 * Configura todos los eventos relacionados con clientes
 */
function setupClientsEvents() {
    // Botón de nuevo cliente en la sección
    const newClientBtn = document.getElementById('new-client-btn');
    if (newClientBtn) {
        newClientBtn.addEventListener('click', function() {
            openCreateClientModal();
        });
    }
    
    // Botón de nuevo cliente en quick actions
    const createClientQuickAction = document.getElementById('create-client');
    if (createClientQuickAction) {
        createClientQuickAction.addEventListener('click', function(e) {
            e.preventDefault();
            openCreateClientModal();
        });
    }
    
    // Búsqueda de clientes
    const clientSearchBtn = document.getElementById('client-search-btn');
    const clientSearchInput = document.getElementById('client-search');
    
    if (clientSearchBtn) {
        clientSearchBtn.addEventListener('click', function() {
            searchClients();
        });
    }
    
    if (clientSearchInput) {
        clientSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchClients();
            }
        });
        
        // Búsqueda en tiempo real
        clientSearchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                searchClients();
            }, 500);
        });
    }
}

/**
 * Abre el modal para crear un nuevo cliente
 */
function openCreateClientModal() {
    console.log('Abriendo modal de crear cliente...');
    createClientModal();
}

/**
 * Crea el modal para agregar/editar cliente
 */
function createClientModal(clientData = null) {
    const isEditing = clientData !== null;
    const modalTitle = isEditing ? 'Editar Cliente' : 'Añadir Nuevo Cliente';
    const submitButtonText = isEditing ? 'Guardar Cambios' : 'Crear Cliente';
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('client-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal active" id="client-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${modalTitle}</h2>
                    <button class="close-btn" id="close-client-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="client-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="client-name">Nombre *</label>
                                <input type="text" id="client-name" value="${clientData?.nombre || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="client-lastname">Apellidos *</label>
                                <input type="text" id="client-lastname" value="${clientData?.apellidos || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="client-email">Correo Electrónico *</label>
                                <input type="email" id="client-email" value="${clientData?.correo || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="client-phone">Teléfono</label>
                                <input type="tel" id="client-phone" value="${clientData?.telefono || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="client-company">Empresa</label>
                            <input type="text" id="client-company" value="${clientData?.empresa || ''}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="client-document-type">Tipo de Documento</label>
                                <select id="client-document-type" required>
                                    <option value="CC" ${clientData?.tipoDocumento === 'CC' ? 'selected' : ''}>Cédula de Ciudadanía</option>
                                    <option value="CE" ${clientData?.tipoDocumento === 'CE' ? 'selected' : ''}>Cédula de Extranjería</option>
                                    <option value="TI" ${clientData?.tipoDocumento === 'TI' ? 'selected' : ''}>Tarjeta de Identidad</option>
                                    <option value="PP" ${clientData?.tipoDocumento === 'PP' ? 'selected' : ''}>Pasaporte</option>
                                    <option value="NIT" ${clientData?.tipoDocumento === 'NIT' ? 'selected' : ''}>NIT</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="client-document">Número de Documento</label>
                                <input type="text" id="client-document" value="${clientData?.documento || ''}" required>
                            </div>
                        </div>
                        
                        ${!isEditing ? `
                        <div class="form-group">
                            <label for="client-password">Contraseña *</label>
                            <div style="position: relative;">
                                <input type="password" id="client-password" required>
                                <button type="button" class="password-toggle-modal" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-color); cursor: pointer;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <small style="color: #999; font-size: 12px;">Mínimo 6 caracteres</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="client-confirm-password">Confirmar Contraseña *</label>
                            <div style="position: relative;">
                                <input type="password" id="client-confirm-password" required>
                                <button type="button" class="password-toggle-modal" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-color); cursor: pointer;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="form-group checkbox-group">
                            <label class="checkbox-container">
                                <input type="checkbox" id="send-welcome-email" ${isEditing ? '' : 'checked'} >
                                <span class="checkmark"></span>
                                ${isEditing ? 'Enviar notificación de actualización' : 'Enviar correo de bienvenida'}
                            </label>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 20px;">
                            <button type="button" class="secondary-btn" id="cancel-client-btn">Cancelar</button>
                            <button type="submit" class="primary-btn" id="save-client-btn">${submitButtonText}</button>
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
        setupClientModalEvents(isEditing, clientData);
    }, 100);
}

/**
 * Configura los eventos del modal de cliente
 */
function setupClientModalEvents(isEditing, clientData) {
    const modal = document.getElementById('client-modal');
    const closeBtn = document.getElementById('close-client-modal');
    const cancelBtn = document.getElementById('cancel-client-btn');
    const form = document.getElementById('client-form');
    
    if (!modal) {
        console.error('Modal de cliente no encontrado');
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
            if (isEditing) {
                handleClientUpdate(e, clientData);
            } else {
                handleClientCreate(e);
            }
        });
    }
    
    console.log('Eventos del modal de cliente configurados correctamente');
}

/**
 * Maneja la creación de un nuevo cliente
 */
async function handleClientCreate(e) {
    console.log('Iniciando creación de cliente...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-client-btn') || form.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.error('Botón de envío no encontrado');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        
        // Recopilar datos del formulario
        const formData = {
            nombre: document.getElementById('client-name')?.value?.trim() || '',
            apellidos: document.getElementById('client-lastname')?.value?.trim() || '',
            correo: document.getElementById('client-email')?.value?.trim() || '',
            telefono: document.getElementById('client-phone')?.value?.trim() || '',
            empresa: document.getElementById('client-company')?.value?.trim() || '',
            tipoDocumento: document.getElementById('client-document-type')?.value || 'CC',
            documento: document.getElementById('client-document')?.value?.trim() || '',
            password: document.getElementById('client-password')?.value || '',
            sendWelcomeEmail: document.getElementById('send-welcome-email')?.checked || false
        };
        
        const confirmPassword = document.getElementById('client-confirm-password')?.value || '';
        
        // Validaciones
        if (!formData.nombre || !formData.apellidos || !formData.correo || !formData.password) {
            throw new Error('Nombre, apellidos, correo y contraseña son obligatorios');
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correo)) {
            throw new Error('Por favor, introduce un email válido');
        }
        
        // Validar contraseñas
        if (formData.password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }
        
        if (formData.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        
        console.log('Datos a enviar:', { ...formData, password: '[PROTEGIDO]' });
        
        // Enviar datos al servidor
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        console.log('Enviando petición a:', `${API_BASE}/api/users`);
        
        const response = await fetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Respuesta del servidor:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear cliente');
        }
        
        const data = await response.json();
        console.log('Cliente creado:', data);
        
        // Mostrar mensaje de éxito
        showToast('Cliente creado correctamente', 'success');
        
        // Recargar datos de clientes
        await loadClientsData();
        
        // Cerrar modal
        const modal = document.getElementById('client-modal');
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
        console.error('Error al crear cliente:', error);
        showToast(error.message || 'Error al crear cliente', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Maneja la actualización de un cliente existente
 */
async function handleClientUpdate(e, clientData) {
    console.log('Iniciando actualización de cliente...');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-client-btn') || form.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.error('Botón de envío no encontrado');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        
        // Recopilar datos del formulario
        const formData = {
            nombre: document.getElementById('client-name')?.value?.trim() || '',
            apellidos: document.getElementById('client-lastname')?.value?.trim() || '',
            correo: document.getElementById('client-email')?.value?.trim() || '',
            telefono: document.getElementById('client-phone')?.value?.trim() || '',
            empresa: document.getElementById('client-company')?.value?.trim() || '',
            tipoDocumento: document.getElementById('client-document-type')?.value || 'CC',
            documento: document.getElementById('client-document')?.value?.trim() || ''
        };
        
        // Validaciones
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
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        console.log('Enviando petición a:', `${API_BASE}/api/users/${clientData._id}`);
        
        const response = await fetch(`${API_BASE}/api/users/${clientData._id}`, {
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
            throw new Error(error.message || 'Error al actualizar cliente');
        }
        
        const data = await response.json();
        console.log('Cliente actualizado:', data);
        
        // Mostrar mensaje de éxito
        showToast('Cliente actualizado correctamente', 'success');
        
        // Recargar datos de clientes
        await loadClientsData();
        
        // Cerrar modal
        const modal = document.getElementById('client-modal');
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
        console.error('Error al actualizar cliente:', error);
        showToast(error.message || 'Error al actualizar cliente', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Carga los datos de clientes desde la API
 */
async function loadClientsData() {
    console.log('Cargando datos de clientes...');
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Cargar todos los usuarios y luego filtrar por rol cliente
        const response = await fetch(`${API_BASE}/api/users?limit=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }
        
        const data = await response.json();
        console.log('Usuarios cargados:', data);
        
        // FILTRAR SOLO USUARIOS CON ROL "cliente"
        const allUsers = data.data || [];
        clientsData = allUsers.filter(user => user.rol === 'cliente');
        filteredClientsData = [...clientsData];
        
        console.log(`Clientes filtrados: ${clientsData.length} de ${allUsers.length} usuarios totales`);
        
        // Renderizar tabla de clientes
        renderClientsTable();
        
        // Actualizar paginación (simulada por ahora)
        updateClientsPagination({
            total: clientsData.length,
            page: currentClientsPage,
            pages: Math.ceil(clientsData.length / clientsPerPage)
        });
        
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showToast('Error al cargar clientes', 'error');
        
        // Mostrar datos de ejemplo en caso de error
        showSampleClientsData();
    }
}

/**
 * Renderiza la tabla de clientes
 */
function renderClientsTable() {
    const tableBody = document.querySelector('#clients-table tbody');
    if (!tableBody) return;
    
    if (filteredClientsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    No se encontraron clientes
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = filteredClientsData.map(client => {
        const fechaRegistro = client.fechaRegistro 
            ? new Date(client.fechaRegistro).toLocaleDateString('es-ES')
            : 'N/A';
        
        const projectCount = client.proyectos ? client.proyectos.length : 0;
        
        return `
            <tr>
                <td>${client.nombre} ${client.apellidos}</td>
                <td>${client.correo}</td>
                <td>${client.telefono || 'N/A'}</td>
                <td>${client.empresa || 'N/A'}</td>
                <td>${client.tipoDocumento || 'CC'}: ${client.documento || 'N/A'}</td>
                <td><span class="badge">${projectCount}</span></td>
                <td>${fechaRegistro}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="Ver detalles" onclick="viewClient('${client._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Editar" onclick="editClient('${client._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Eliminar" onclick="deleteClient('${client._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

/**
 * Muestra datos de ejemplo cuando falla la carga
 */
function showSampleClientsData() {
    const tableBody = document.querySelector('#clients-table tbody');
    if (!tableBody) return;
    
    const sampleData = `
        <tr>
            <td>Juan Pérez</td>
            <td>juan.perez@email.com</td>
            <td>+57 300 123 4567</td>
            <td>Empresa ABC</td>
            <td>CC: 1234567890</td>
            <td><span class="badge">3</span></td>
            <td>10/04/2025</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" title="Ver detalles"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
        <tr>
            <td colspan="8" style="text-align: center; padding: 20px; color: #999; font-style: italic;">
                Datos de ejemplo - Conecte con la API para ver datos reales
            </td>
        </tr>
    `;
    
    tableBody.innerHTML = sampleData;
}

/**
 * Configura los filtros de clientes
 */
function setupClientsFilters() {
    const filterProjects = document.getElementById('client-filter-projects');
    const filterDate = document.getElementById('client-filter-date');
    
    if (filterProjects) {
        filterProjects.addEventListener('change', applyClientsFilters);
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', applyClientsFilters);
    }
}

/**
 * Aplica los filtros a los datos de clientes
 */
function applyClientsFilters() {
    const filterProjects = document.getElementById('client-filter-projects')?.value || 'all';
    const filterDate = document.getElementById('client-filter-date')?.value || 'all';
    const searchTerm = document.getElementById('client-search')?.value?.toLowerCase() || '';
    
    filteredClientsData = clientsData.filter(client => {
        // Filtro por proyectos
        let projectsMatch = true;
        if (filterProjects === 'with-projects') {
            projectsMatch = client.proyectos && client.proyectos.length > 0;
        } else if (filterProjects === 'without-projects') {
            projectsMatch = !client.proyectos || client.proyectos.length === 0;
        }
        
        // Filtro por fecha
        let dateMatch = true;
        if (filterDate !== 'all' && client.fechaRegistro) {
            const clientDate = new Date(client.fechaRegistro);
            const now = new Date();
            
            switch (filterDate) {
                case 'this-month':
                    dateMatch = clientDate.getMonth() === now.getMonth() && 
                               clientDate.getFullYear() === now.getFullYear();
                    break;
                case 'last-month':
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                    dateMatch = clientDate.getMonth() === lastMonth.getMonth() && 
                               clientDate.getFullYear() === lastMonth.getFullYear();
                    break;
                case 'this-year':
                    dateMatch = clientDate.getFullYear() === now.getFullYear();
                    break;
            }
        }
        
        // Filtro por búsqueda
        let searchMatch = true;
        if (searchTerm) {
            searchMatch = (
                client.nombre?.toLowerCase().includes(searchTerm) ||
                client.apellidos?.toLowerCase().includes(searchTerm) ||
                client.correo?.toLowerCase().includes(searchTerm) ||
                client.empresa?.toLowerCase().includes(searchTerm) ||
                client.documento?.toLowerCase().includes(searchTerm)
            );
        }
        
        return projectsMatch && dateMatch && searchMatch;
    });
    
    renderClientsTable();
}

/**
 * Búsqueda de clientes
 */
function searchClients() {
    applyClientsFilters();
}

/**
 * Configurar paginación de clientes
 */
function setupClientsPagination() {
    // Aquí se configuraría la paginación
    console.log('Paginación de clientes configurada');
}

/**
 * Actualizar controles de paginación
 */
function updateClientsPagination(paginationData) {
    // Implementar lógica de paginación
    console.log('Actualizando paginación:', paginationData);
}

/**
 * Ver detalles de un cliente
 */
function viewClient(clientId) {
    console.log('Ver cliente:', clientId);
    const client = clientsData.find(c => c._id === clientId);
    if (client) {
        showClientDetailsModal(client);
    }
}

/**
 * Editar un cliente
 */
function editClient(clientId) {
    console.log('Editar cliente:', clientId);
    const client = clientsData.find(c => c._id === clientId);
    if (client) {
        createClientModal(client);
    }
}

/**
 * Eliminar un cliente
 */
async function deleteClient(clientId) {
    console.log('Eliminar cliente:', clientId);
    
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
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
        
        const response = await fetch(`${API_BASE}/api/users/${clientId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar cliente');
        }
        
        showToast('Cliente eliminado correctamente', 'success');
        await loadClientsData();
        
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        showToast(error.message || 'Error al eliminar cliente', 'error');
    }
}

/**
 * Muestra modal con detalles del cliente
 */
function showClientDetailsModal(client) {
    const fechaRegistro = client.fechaRegistro 
        ? new Date(client.fechaRegistro).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        })
        : 'N/A';
    
    const ultimaConexion = client.ultimaConexion 
        ? new Date(client.ultimaConexion).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        })
        : 'Nunca se ha conectado';
    
    const modalHTML = `
        <div class="modal active" id="client-details-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2>Detalles del Cliente</h2>
                    <button class="close-btn" id="close-client-details-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="client-details">
                        <div class="client-header">
                            <div class="client-avatar">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="client-info">
                                <h3>${client.nombre} ${client.apellidos}</h3>
                                <p>${client.correo}</p>
                                <span class="client-role">${client.rol === 'admin' ? 'Administrador' : 'Cliente'}</span>
                            </div>
                        </div>
                        
                        <div class="details-grid">
                            <div class="detail-section">
                                <h4>Información Personal</h4>
                                <div class="detail-row">
                                    <label>Nombre:</label>
                                    <span>${client.nombre}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Apellidos:</label>
                                    <span>${client.apellidos}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Correo Electrónico:</label>
                                    <span>${client.correo}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Teléfono:</label>
                                    <span>${client.telefono || 'No proporcionado'}</span>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Información Empresarial</h4>
                                <div class="detail-row">
                                    <label>Empresa:</label>
                                    <span>${client.empresa || 'No especificada'}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Tipo de Documento:</label>
                                    <span>${client.tipoDocumento || 'CC'}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Número de Documento:</label>
                                    <span>${client.documento || 'No proporcionado'}</span>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Información de Cuenta</h4>
                                <div class="detail-row">
                                    <label>Fecha de Registro:</label>
                                    <span>${fechaRegistro}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Última Conexión:</label>
                                    <span>${ultimaConexion}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Rol:</label>
                                    <span>${client.rol === 'admin' ? 'Administrador' : 'Cliente'}</span>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Estadísticas</h4>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <span class="stat-number">${client.proyectos ? client.proyectos.length : 0}</span>
                                        <span class="stat-label">Proyectos</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-number">${client.citas ? client.citas.length : 0}</span>
                                        <span class="stat-label">Citas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        ${client.proyectos && client.proyectos.length > 0 ? `
                        <div class="detail-section">
                            <h4>Proyectos Asociados</h4>
                            <div class="projects-list">
                                ${client.proyectos.map(proyectoId => `
                                    <div class="project-item">
                                        <i class="fas fa-project-diagram"></i>
                                        <span>Proyecto ID: ${proyectoId}</span>
                                        <button class="action-btn view-btn" onclick="viewProject('${proyectoId}')" title="Ver proyecto">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${client.citas && client.citas.length > 0 ? `
                        <div class="detail-section">
                            <h4>Citas Programadas</h4>
                            <div class="appointments-list">
                                ${client.citas.map(citaId => `
                                    <div class="appointment-item">
                                        <i class="far fa-calendar-alt"></i>
                                        <span>Cita ID: ${citaId}</span>
                                        <button class="action-btn view-btn" onclick="viewAppointment('${citaId}')" title="Ver cita">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="form-actions" style="margin-top: 30px;">
                        <button type="button" class="secondary-btn" onclick="editClient('${client._id}')">
                            <i class="fas fa-edit"></i> Editar Cliente
                        </button>
                        <button type="button" class="primary-btn" id="close-details-btn">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('client-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Insertar el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos del modal
    setTimeout(() => {
        const modal = document.getElementById('client-details-modal');
        const closeBtn = document.getElementById('close-client-details-modal');
        const closeDetailsBtn = document.getElementById('close-details-btn');
        
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
 * Envía un email a un cliente específico
 */
function sendEmailToClient(clientId) {
    console.log('Enviar email al cliente:', clientId);
    const client = clientsData.find(c => c._id === clientId);
    if (client) {
        // Cerrar modal de detalles
        const detailsModal = document.getElementById('client-details-modal');
        if (detailsModal) {
            detailsModal.remove();
            document.body.style.overflow = 'auto';
        }
        
        // Abrir modal de envío de email
        openSendEmailModal(client);
    }
}

/**
 * Abre modal para enviar email a cliente
 */
function openSendEmailModal(client) {
    const modalHTML = `
        <div class="modal active" id="send-email-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2>Enviar Email a ${client.nombre} ${client.apellidos}</h2>
                    <button class="close-btn" id="close-email-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="send-email-form">
                        <div class="form-group">
                            <label for="email-to">Para:</label>
                            <input type="email" id="email-to" value="${client.correo}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="email-subject">Asunto:</label>
                            <input type="text" id="email-subject" required placeholder="Escriba el asunto del mensaje">
                        </div>
                        
                        <div class="form-group">
                            <label for="email-message">Mensaje:</label>
                            <textarea id="email-message" rows="8" required placeholder="Escriba su mensaje aquí..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="email-template">Usar plantilla:</label>
                            <select id="email-template">
                                <option value="">Mensaje personalizado</option>
                                <option value="welcome">Bienvenida</option>
                                <option value="project-update">Actualización de proyecto</option>
                                <option value="appointment-reminder">Recordatorio de cita</option>
                                <option value="invoice">Factura</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="email-attachment">Adjuntos (opcional):</label>
                            <input type="file" id="email-attachment" multiple>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 20px;">
                            <button type="button" class="secondary-btn" id="cancel-email-btn">Cancelar</button>
                            <button type="submit" class="primary-btn" id="send-email-btn">
                                <i class="fas fa-paper-plane"></i> Enviar Email
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
    
    // Configurar eventos del modal
    setTimeout(() => {
        setupEmailModalEvents(client);
    }, 100);
}

/**
 * Configura eventos del modal de envío de email
 */
function setupEmailModalEvents(client) {
    const modal = document.getElementById('send-email-modal');
    const closeBtn = document.getElementById('close-email-modal');
    const cancelBtn = document.getElementById('cancel-email-btn');
    const form = document.getElementById('send-email-form');
    const templateSelect = document.getElementById('email-template');
    const messageTextarea = document.getElementById('email-message');
    const subjectInput = document.getElementById('email-subject');
    
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
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Manejar cambio de plantilla
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            const template = this.value;
            if (template) {
                const templates = getEmailTemplates(client);
                if (templates[template]) {
                    subjectInput.value = templates[template].subject;
                    messageTextarea.value = templates[template].message;
                }
            }
        });
    }
    
    // Manejar envío del formulario
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSendEmail(e, client, closeModal);
        });
    }
}

/**
 * Obtiene plantillas de email predefinidas
 */
function getEmailTemplates(client) {
    return {
        welcome: {
            subject: `¡Bienvenido a Crazy Studios, ${client.nombre}!`,
            message: `Estimado/a ${client.nombre},\n\n¡Bienvenido a Crazy Studios! Estamos encantados de tenerte como cliente.\n\nNuestro equipo está listo para ayudarte con todos tus proyectos de marketing digital y desarrollo web.\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\n¡Esperamos trabajar contigo pronto!\n\nSaludos cordiales,\nEquipo de Crazy Studios`
        },
        'project-update': {
            subject: `Actualización de tu proyecto - Crazy Studios`,
            message: `Hola ${client.nombre},\n\nTe escribimos para informarte sobre el avance de tu proyecto.\n\n[Aquí puedes agregar los detalles específicos del proyecto]\n\nSi tienes alguna pregunta o comentario, no dudes en contactarnos.\n\nSaludos cordiales,\nEquipo de Crazy Studios`
        },
        'appointment-reminder': {
            subject: `Recordatorio de cita - Crazy Studios`,
            message: `Hola ${client.nombre},\n\nTe recordamos que tienes una cita programada con nosotros.\n\n[Agregar detalles de fecha y hora]\n\nSi necesitas reprogramar o tienes alguna pregunta, contáctanos con anticipación.\n\nNos vemos pronto!\n\nSaludos cordiales,\nEquipo de Crazy Studios`
        },
        invoice: {
            subject: `Factura de servicios - Crazy Studios`,
            message: `Estimado/a ${client.nombre},\n\nAdjuntamos la factura correspondiente a los servicios prestados.\n\n[Detalles de facturación]\n\nSi tienes alguna pregunta sobre esta factura, no dudes en contactarnos.\n\nGracias por confiar en Crazy Studios.\n\nSaludos cordiales,\nEquipo de Crazy Studios`
        }
    };
}

/**
 * Maneja el envío del email
 */
async function handleSendEmail(e, client, closeModal) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#send-email-btn');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        // Recopilar datos del formulario
        const emailData = {
            to: document.getElementById('email-to').value,
            subject: document.getElementById('email-subject').value,
            message: document.getElementById('email-message').value,
            clientId: client._id
        };
        
        // Validaciones
        if (!emailData.subject || !emailData.message) {
            throw new Error('Asunto y mensaje son obligatorios');
        }
        
        console.log('Enviando email:', emailData);
        
        // Simular envío de email (aquí iría la llamada real a la API)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mostrar mensaje de éxito
        showToast('Email enviado correctamente', 'success');
        
        // Cerrar modal
        closeModal();
        
    } catch (error) {
        console.error('Error al enviar email:', error);
        showToast(error.message || 'Error al enviar email', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Ver proyecto (función placeholder)
 */
function viewProject(projectId) {
    console.log('Ver proyecto:', projectId);
    showToast('Funcionalidad de proyectos próximamente', 'info');
}

/**
 * Ver cita (función placeholder)
 */
function viewAppointment(appointmentId) {
    console.log('Ver cita:', appointmentId);
    showToast('Funcionalidad de citas próximamente', 'info');
}

/**
 * Exportar datos de clientes
 */
function exportClientsData(format = 'csv') {
    console.log(`Exportando clientes en formato ${format}`);
    
    if (filteredClientsData.length === 0) {
        showToast('No hay datos para exportar', 'warning');
        return;
    }
    
    try {
        let content = '';
        let filename = '';
        let mimeType = '';
        
        if (format === 'csv') {
            // Crear CSV
            const headers = ['Nombre', 'Apellidos', 'Correo', 'Teléfono', 'Empresa', 'Documento', 'Fecha Registro'];
            const csvContent = [
                headers.join(','),
                ...filteredClientsData.map(client => [
                    `"${client.nombre || ''}"`,
                    `"${client.apellidos || ''}"`,
                    `"${client.correo || ''}"`,
                    `"${client.telefono || ''}"`,
                    `"${client.empresa || ''}"`,
                    `"${client.tipoDocumento || 'CC'}: ${client.documento || ''}"`,
                    `"${client.fechaRegistro ? new Date(client.fechaRegistro).toLocaleDateString('es-ES') : ''}"`
                ].join(','))
            ].join('\n');
            
            content = csvContent;
            filename = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv;charset=utf-8;';
        } else if (format === 'json') {
            // Crear JSON
            content = JSON.stringify(filteredClientsData, null, 2);
            filename = `clientes_${new Date().toISOString().split('T')[0]}.json`;
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
        console.error('Error al exportar datos:', error);
        showToast('Error al exportar datos', 'error');
    }
}

/**
 * Importar clientes desde archivo CSV
 */
function importClientsData() {
    // Crear input file temporal
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    const headers = lines[0].split(',');
                    
                    console.log('Importando archivo CSV:', file.name);
                    console.log('Headers encontrados:', headers);
                    
                    // Aquí iría la lógica para procesar el CSV e importar los datos
                    showToast('Funcionalidad de importación próximamente', 'info');
                    
                } catch (error) {
                    console.error('Error al procesar archivo CSV:', error);
                    showToast('Error al procesar el archivo CSV', 'error');
                }
            };
            reader.readAsText(file);
        }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// Funciones globales para que puedan ser llamadas desde los botones de la tabla
window.viewClient = viewClient;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.sendEmailToClient = sendEmailToClient;
window.viewProject = viewProject;
window.viewAppointment = viewAppointment;
window.exportClientsData = exportClientsData;
window.importClientsData = importClientsData;

// Inicializar el módulo cuando se cambie a la sección de clientes
document.addEventListener('DOMContentLoaded', function() {
    // Observar cambios en la navegación para inicializar el módulo de clientes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const clientsSection = document.getElementById('clients');
                if (clientsSection && clientsSection.classList.contains('active')) {
                    // Pequeño delay para asegurar que el DOM esté listo
                    setTimeout(() => {
                        initClientsModule();
                    }, 100);
                }
            }
        });
    });
    
    const clientsSection = document.getElementById('clients');
    if (clientsSection) {
        observer.observe(clientsSection, { attributes: true });
    }
    
    // También inicializar si la sección ya está activa
    if (clientsSection && clientsSection.classList.contains('active')) {
        setTimeout(() => {
            initClientsModule();
        }, 100);
    }
    
    // Configurar eventos adicionales del módulo
    setupAdditionalClientsEvents();
});

/**
 * Configura eventos adicionales del módulo de clientes
 */
function setupAdditionalClientsEvents() {
    // Configurar botones de exportación si existen
    const exportCsvBtn = document.getElementById('export-clients-csv');
    const exportJsonBtn = document.getElementById('export-clients-json');
    const importBtn = document.getElementById('import-clients');
    
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => exportClientsData('csv'));
    }
    
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => exportClientsData('json'));
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', importClientsData);
    }
}

/**
 * Actualizar estadísticas de clientes en el dashboard principal
 */
function updateClientsStatistics() {
    const totalClientes = clientsData.length;
    const clientesConProyectos = clientsData.filter(client => 
        client.proyectos && client.proyectos.length > 0
    ).length;
    
    const clientesNuevosEsteMes = clientsData.filter(client => {
        if (!client.fechaRegistro) return false;
        const fechaRegistro = new Date(client.fechaRegistro);
        const now = new Date();
        return fechaRegistro.getMonth() === now.getMonth() && 
               fechaRegistro.getFullYear() === now.getFullYear();
    }).length;
    
    // Actualizar elementos en el dashboard principal si existen
    const clientsCountElement = document.getElementById('clients-count');
    if (clientsCountElement) {
        clientsCountElement.textContent = totalClientes;
    }
    
    // Crear evento personalizado para notificar cambios en estadísticas
    const statsEvent = new CustomEvent('clientStatsUpdated', {
        detail: {
            total: totalClientes,
            withProjects: clientesConProyectos,
            newThisMonth: clientesNuevosEsteMes
        }
    });
    
    document.dispatchEvent(statsEvent);
}

// Llamar a actualizar estadísticas cada vez que se cargan los datos
const originalLoadClientsData = loadClientsData;
loadClientsData = async function() {
    await originalLoadClientsData();
    updateClientsStatistics();
};

function setupTableScrollFeatures() {
    console.log('🔄 Configurando funcionalidades de scroll horizontal...');
    
    const tableContainer = document.querySelector('#clients .table-responsive');
    if (!tableContainer) {
        console.warn('Contenedor de tabla no encontrado');
        return;
    }
    
    // Crear y configurar indicador de scroll
    createScrollIndicator(tableContainer);
    
    // Configurar detección de scroll
    setupScrollDetection(tableContainer);
    
    // Configurar tooltips para celdas truncadas
    setupCellTooltips();
    
    // Configurar navegación con teclado
    setupKeyboardNavigation(tableContainer);
    
    // Configurar resize observer para responsividad
    setupResizeObserver(tableContainer);
    
    console.log('✅ Funcionalidades de scroll configuradas correctamente');
}

/**
 * Crea el indicador de scroll para móviles
 */
function createScrollIndicator(tableContainer) {
    // Verificar si ya existe
    let indicator = tableContainer.parentElement.querySelector('.scroll-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = '<i class="fas fa-arrows-alt-h"></i> Desliza horizontalmente';
        
        // Crear contenedor padre si no existe
        let container = tableContainer.parentElement;
        if (!container.classList.contains('table-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-container';
            tableContainer.parentElement.insertBefore(wrapper, tableContainer);
            wrapper.appendChild(tableContainer);
            container = wrapper;
        }
        
        container.style.position = 'relative';
        container.appendChild(indicator);
    }
    
    // Mostrar/ocultar indicador según necesidad
    updateScrollIndicatorVisibility(tableContainer, indicator);
}

/**
 * Actualiza la visibilidad del indicador de scroll
 */
function updateScrollIndicatorVisibility(tableContainer, indicator) {
    const needsScroll = tableContainer.scrollWidth > tableContainer.clientWidth;
    const isMobile = window.innerWidth <= 768;
    
    if (needsScroll && isMobile) {
        indicator.style.display = 'flex';
        
        // Auto-ocultar después del primer scroll
        const hideOnScroll = () => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 300);
            tableContainer.removeEventListener('scroll', hideOnScroll);
        };
        
        tableContainer.addEventListener('scroll', hideOnScroll);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            if (indicator.style.display !== 'none') {
                hideOnScroll();
            }
        }, 5000);
    } else {
        indicator.style.display = 'none';
    }
}

/**
 * Configura la detección de eventos de scroll
 */
function setupScrollDetection(tableContainer) {
    let scrollTimeout;
    
    tableContainer.addEventListener('scroll', function() {
        // Agregar clase durante el scroll
        this.classList.add('scrolling');
        
        // Limpiar timeout anterior
        clearTimeout(scrollTimeout);
        
        // Remover clase después de que termine el scroll
        scrollTimeout = setTimeout(() => {
            this.classList.remove('scrolling');
        }, 150);
        
        // Actualizar estilos de columna sticky
        updateStickyColumnShadow(this);
    });
    
    // CSS para estado de scroll
    const scrollStyles = document.createElement('style');
    scrollStyles.textContent = `
        .table-responsive.scrolling {
            scroll-behavior: smooth;
        }
        
        .table-responsive.has-scroll .data-table td:nth-child(8) {
            box-shadow: -4px 0 8px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(scrollStyles);
}

/**
 * Actualiza la sombra de la columna sticky según el scroll
 */
function updateStickyColumnShadow(tableContainer) {
    const isScrolled = tableContainer.scrollLeft > 0;
    
    if (isScrolled) {
        tableContainer.classList.add('has-scroll');
    } else {
        tableContainer.classList.remove('has-scroll');
    }
}

/**
 * Configura tooltips automáticos para celdas con contenido truncado
 */
function setupCellTooltips() {
    const tableCells = document.querySelectorAll('#clients .data-table td');
    
    tableCells.forEach(cell => {
        // Solo para celdas que no son de acciones
        if (!cell.querySelector('.action-buttons')) {
            checkAndAddTooltip(cell);
        }
    });
}

/**
 * Verifica si una celda necesita tooltip y lo agrega
 */
function checkAndAddTooltip(cell) {
    // Verificar si el contenido está truncado
    if (cell.scrollWidth > cell.clientWidth || cell.textContent.length > 30) {
        cell.setAttribute('title', cell.textContent.trim());
        cell.style.cursor = 'help';
    }
}

/**
 * Configura navegación con teclado para la tabla
 */
function setupKeyboardNavigation(tableContainer) {
    tableContainer.addEventListener('keydown', function(e) {
        const scrollAmount = 50;
        
        switch(e.key) {
            case 'ArrowLeft':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.scrollLeft = Math.max(0, this.scrollLeft - scrollAmount);
                }
                break;
                
            case 'ArrowRight':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.scrollLeft = Math.min(
                        this.scrollWidth - this.clientWidth,
                        this.scrollLeft + scrollAmount
                    );
                }
                break;
                
            case 'Home':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.scrollLeft = 0;
                }
                break;
                
            case 'End':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.scrollLeft = this.scrollWidth - this.clientWidth;
                }
                break;
        }
    });
    
    // Hacer el contenedor focusable
    tableContainer.setAttribute('tabindex', '0');
    
    // Agregar instrucciones de teclado (opcional)
    addKeyboardInstructions(tableContainer);
}

/**
 * Agrega instrucciones de navegación con teclado
 */
function addKeyboardInstructions(tableContainer) {
    // Solo agregar si no existe
    if (!document.querySelector('.keyboard-instructions')) {
        const instructions = document.createElement('div');
        instructions.className = 'keyboard-instructions';
        instructions.innerHTML = `
            <small style="color: #666; font-size: 12px; display: block; margin-top: 10px;">
                <i class="fas fa-keyboard"></i> 
                <strong>Navegación:</strong> Ctrl + ← → para scroll horizontal, Ctrl + Home/End para inicio/fin
            </small>
        `;
        
        tableContainer.parentElement.appendChild(instructions);
    }
}

/**
 * Configura un ResizeObserver para manejar cambios de tamaño
 */
function setupResizeObserver(tableContainer) {
    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const indicator = entry.target.parentElement.querySelector('.scroll-indicator');
                if (indicator) {
                    updateScrollIndicatorVisibility(entry.target, indicator);
                }
                
                // Reconfigurar tooltips después de resize
                setTimeout(() => {
                    setupCellTooltips();
                }, 100);
            }
        });
        
        resizeObserver.observe(tableContainer);
        
        // Guardar referencia para cleanup
        tableContainer._resizeObserver = resizeObserver;
    } else {
        // Fallback para navegadores que no soportan ResizeObserver
        window.addEventListener('resize', debounce(() => {
            const indicator = tableContainer.parentElement.querySelector('.scroll-indicator');
            if (indicator) {
                updateScrollIndicatorVisibility(tableContainer, indicator);
            }
            setupCellTooltips();
        }, 250));
    }
}

/**
 * Función debounce para optimizar eventos de resize
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Mejora la función renderClientsTable existente para incluir scroll features
 */
function enhanceClientsTableRendering() {
    // Guardar la función original
    const originalRenderClientsTable = window.renderClientsTable;
    
    // Sobrescribir con versión mejorada
    window.renderClientsTable = function() {
        // Llamar a la función original
        if (originalRenderClientsTable) {
            originalRenderClientsTable();
        }
        
        // Configurar features de scroll después del renderizado
        setTimeout(() => {
            setupTableScrollFeatures();
        }, 100);
    };
}

/**
 * Agrega funcionalidad de scroll suave para navegación programática
 */
function scrollToColumn(columnIndex, behavior = 'smooth') {
    const tableContainer = document.querySelector('#clients .table-responsive');
    if (!tableContainer) return;
    
    const table = tableContainer.querySelector('.data-table');
    if (!table) return;
    
    const cells = table.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
    if (cells.length === 0) return;
    
    const targetCell = cells[0];
    const cellRect = targetCell.getBoundingClientRect();
    const containerRect = tableContainer.getBoundingClientRect();
    
    const scrollLeft = tableContainer.scrollLeft + 
                      (cellRect.left - containerRect.left) - 
                      (containerRect.width / 2) + 
                      (cellRect.width / 2);
    
    tableContainer.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: behavior
    });
}

/**
 * Funciones de utilidad para exportación con scroll
 */
function exportTableWithScrollPositions() {
    const tableContainer = document.querySelector('#clients .table-responsive');
    if (!tableContainer) return null;
    
    return {
        scrollLeft: tableContainer.scrollLeft,
        scrollTop: tableContainer.scrollTop,
        clientWidth: tableContainer.clientWidth,
        scrollWidth: tableContainer.scrollWidth,
        needsHorizontalScroll: tableContainer.scrollWidth > tableContainer.clientWidth
    };
}

/**
 * Restaura la posición de scroll de la tabla
 */
function restoreTableScrollPosition(scrollData) {
    if (!scrollData) return;
    
    const tableContainer = document.querySelector('#clients .table-responsive');
    if (!tableContainer) return;
    
    tableContainer.scrollLeft = scrollData.scrollLeft;
    tableContainer.scrollTop = scrollData.scrollTop;
}

/**
 * Agrega botones de navegación rápida para la tabla
 */
function addQuickNavigationButtons() {
    const tableContainer = document.querySelector('#clients .table-responsive');
    if (!tableContainer || tableContainer.querySelector('.table-nav-buttons')) return;
    
    const navButtons = document.createElement('div');
    navButtons.className = 'table-nav-buttons';
    navButtons.innerHTML = `
        <div class="table-nav-buttons-container" style="
            position: absolute;
            top: -40px;
            right: 60px;
            display: flex;
            gap: 5px;
            z-index: 20;
        ">
            <button class="nav-btn nav-start" title="Ir al inicio" style="
                background: rgba(0, 123, 255, 0.8);
                border: none;
                color: white;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            ">
                <i class="fas fa-angle-double-left"></i>
            </button>
            <button class="nav-btn nav-end" title="Ir al final" style="
                background: rgba(0, 123, 255, 0.8);
                border: none;
                color: white;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            ">
                <i class="fas fa-angle-double-right"></i>
            </button>
        </div>
    `;
    
    tableContainer.parentElement.style.position = 'relative';
    tableContainer.parentElement.appendChild(navButtons);
    
    // Configurar eventos
    navButtons.querySelector('.nav-start').addEventListener('click', () => {
        tableContainer.scrollTo({ left: 0, behavior: 'smooth' });
    });
    
    navButtons.querySelector('.nav-end').addEventListener('click', () => {
        tableContainer.scrollTo({ 
            left: tableContainer.scrollWidth - tableContainer.clientWidth, 
            behavior: 'smooth' 
        });
    });
    
    // Mostrar/ocultar botones según necesidad
    const updateNavButtons = () => {
        const needsScroll = tableContainer.scrollWidth > tableContainer.clientWidth;
        navButtons.style.display = needsScroll ? 'block' : 'none';
    };
    
    updateNavButtons();
    window.addEventListener('resize', debounce(updateNavButtons, 250));
}

/**
 * Inicialización mejorada del módulo de clientes con scroll
 */
function initClientsModuleWithScroll() {
    console.log('🚀 Inicializando módulo de clientes con scroll horizontal...');
    
    // Configurar enhancement del renderizado
    enhanceClientsTableRendering();
    
    // Configurar features iniciales si la tabla ya existe
    const tableContainer = document.querySelector('#clients .table-responsive');
    if (tableContainer) {
        setupTableScrollFeatures();
        addQuickNavigationButtons();
    }
    
    // Observar cuando se active la sección de clientes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const clientsSection = document.getElementById('clients');
                if (clientsSection && clientsSection.classList.contains('active')) {
                    setTimeout(() => {
                        setupTableScrollFeatures();
                        addQuickNavigationButtons();
                    }, 150);
                }
            }
        });
    });
    
    const clientsSection = document.getElementById('clients');
    if (clientsSection) {
        observer.observe(clientsSection, { attributes: true });
    }
}

/**
 * Cleanup function para remover observers
 */
function cleanupTableScrollFeatures() {
    const tableContainer = document.querySelector('#clients .table-responsive');
    if (tableContainer && tableContainer._resizeObserver) {
        tableContainer._resizeObserver.disconnect();
        delete tableContainer._resizeObserver;
    }
}

// Funciones globales
window.scrollToColumn = scrollToColumn;
window.exportTableWithScrollPositions = exportTableWithScrollPositions;
window.restoreTableScrollPosition = restoreTableScrollPosition;
window.setupTableScrollFeatures = setupTableScrollFeatures;

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initClientsModuleWithScroll();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', cleanupTableScrollFeatures);

console.log('✅ Módulo de scroll horizontal para tabla de clientes cargado correctamente');