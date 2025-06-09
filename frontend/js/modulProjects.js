/**
 * Carga las opciones de clientes para los selectores
 */
async function loadClientsOptions() {
    console.log('=== CARGANDO OPCIONES DE CLIENTES ===');
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const url = `${API_BASE}/api/users?limit=1000`;
        console.log('URL para clientes:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Respuesta clientes - Status:', response.status);
        
        if (!response.ok) {
            throw new Error('Error al cargar clientes');
        }
        
        const data = await response.json();
        console.log('Datos de usuarios recibidos:', data);
        
        const allUsers = data.data || [];
        console.log('Total usuarios:', allUsers.length);
        
        // Filtrar solo clientes
        clientsOptions = allUsers.filter(user => {
            console.log('Usuario:', user.nombre, user.apellidos, 'Rol:', user.rol);
            return user.rol === 'cliente';
        });
        
        console.log(`=== CLIENTES FILTRADOS ===`);
        console.log(`Total clientes disponibles: ${clientsOptions.length}`);
        clientsOptions.forEach((client, index) => {
            console.log(`${index + 1}. ${client.nombre} ${client.apellidos} (${client.empresa || 'Sin empresa'}) - ID: ${client._id}`);
        });
        
        // Si no hay clientes, mostrar advertencia
        if (clientsOptions.length === 0) {
            console.warn('⚠️ No se encontraron clientes. Asegúrate de que existan usuarios con rol "cliente"');
            showToast('No hay clientes disponibles. Crea un cliente primero.', 'warning');
        }
        
    } catch (error) {
        console.error('=== ERROR AL CARGAR CLIENTES ===');
        console.error('Error:', error);
        clientsOptions = [];
        showToast('Error al cargar lista de clientes', 'error');
    }
}
        /**
 * Módulo de Proyectos para Dashboard Administrador
 * Archivo: frontend/js/modulProjects.js
 */

let currentProjectsPage = 1;
let projectsPerPage = 12;
let projectsData = [];
let filteredProjectsData = [];
let clientsOptions = []; // Para el selector de clientes

/**
 * Inicializa el módulo de proyectos cuando se carga la sección
 */
function initProjectsModule() {
    console.log('Inicializando módulo de proyectos...');
    
    // Configurar eventos de la sección de proyectos
    setupProjectsEvents();
    
    // Cargar datos de proyectos
    loadProjectsData();
    
    // Cargar datos de clientes para los selectores
    loadClientsOptions();
    
    // Configurar filtros
    setupProjectsFilters();
    
    // Configurar paginación
    setupProjectsPagination();
}

/**
 * Configura todos los eventos relacionados con proyectos
 */
function setupProjectsEvents() {
    // Botón de nuevo proyecto en la sección
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function() {
            openCreateProjectModal();
        });
    }
    
    // Búsqueda de proyectos
    const projectSearchBtn = document.getElementById('project-search-btn');
    const projectSearchInput = document.getElementById('project-search');
    
    if (projectSearchBtn) {
        projectSearchBtn.addEventListener('click', function() {
            searchProjects();
        });
    }
    
    if (projectSearchInput) {
        projectSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProjects();
            }
        });
        
        // Búsqueda en tiempo real
        projectSearchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                searchProjects();
            }, 500);
        });
    }
}

function createProjectModal(projectData = null) {
    console.log('=== CREANDO MODAL DE PROYECTO ===');
    console.log('Es edición:', !!projectData);
    console.log('Clientes disponibles:', clientsOptions.length);
    
    const isEditing = projectData !== null;
    const modalTitle = isEditing ? 'Editar Proyecto' : 'Crear Nuevo Proyecto';
    const submitButtonText = isEditing ? 'Guardar Cambios' : 'Crear Proyecto';
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('project-modal');
    if (existingModal) {
        console.log('Eliminando modal existente...');
        existingModal.remove();
    }
    
    // Verificar clientes disponibles
    if (clientsOptions.length === 0) {
        console.warn('⚠️ No hay clientes disponibles');
        showToast('No hay clientes disponibles. Crea un cliente primero.', 'warning');
        return;
    }
    
    // Generar opciones de clientes
    let clientOptionsHTML = '<option value="">Seleccionar cliente</option>';
    
    clientsOptions.forEach(client => {
        const isSelected = projectData?.cliente === client._id ? 'selected' : '';
        const empresaText = client.empresa ? ` - ${client.empresa}` : ' - Sin empresa';
        
        clientOptionsHTML += `<option value="${client._id}" ${isSelected}>
            ${client.nombre} ${client.apellidos}${empresaText}
        </option>`;
    });
    
    console.log('Opciones de clientes generadas para', clientsOptions.length, 'clientes');
    
    const modalHTML = `
        <div class="modal active" id="project-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2>${modalTitle}</h2>
                    <button class="close-btn" onclick="closeProjectModal()" id="close-project-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="project-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-name">Nombre del Proyecto *</label>
                                <input 
                                    type="text" 
                                    id="project-name" 
                                    name="nombre"
                                    value="${projectData?.nombre || ''}" 
                                    required 
                                    placeholder="Ej: Sitio web corporativo"
                                >
                            </div>
                            <div class="form-group">
                                <label for="project-client">Cliente *</label>
                                <select id="project-client" name="cliente" required>
                                    ${clientOptionsHTML}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="project-description">Descripción *</label>
                            <textarea 
                                id="project-description" 
                                name="descripcion"
                                rows="4" 
                                required 
                                placeholder="Descripción detallada del proyecto..."
                            >${projectData?.descripcion || ''}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-category">Categoría *</label>
                                <select id="project-category" name="categoria" required>
                                    <option value="">Seleccionar categoría</option>
                                    <option value="web-development" ${projectData?.categoria === 'web-development' ? 'selected' : ''}>Desarrollo Web</option>
                                    <option value="ecommerce" ${projectData?.categoria === 'ecommerce' ? 'selected' : ''}>Tienda Online</option>
                                    <option value="marketing-digital" ${projectData?.categoria === 'marketing-digital' ? 'selected' : ''}>Marketing Digital</option>
                                    <option value="social-media" ${projectData?.categoria === 'social-media' ? 'selected' : ''}>Redes Sociales</option>
                                    <option value="seo" ${projectData?.categoria === 'seo' ? 'selected' : ''}>SEO</option>
                                    <option value="branding" ${projectData?.categoria === 'branding' ? 'selected' : ''}>Branding</option>
                                    <option value="design" ${projectData?.categoria === 'design' ? 'selected' : ''}>Diseño Gráfico</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="project-status">Estado *</label>
                                <select id="project-status" name="estado" required>
                                    <option value="cotizacion" ${projectData?.estado === 'cotizacion' ? 'selected' : ''}>Cotización</option>
                                    <option value="pago procesado" ${projectData?.estado === 'pago procesado' ? 'selected' : ''}>Pago Procesado</option>
                                    <option value="iniciado" ${projectData?.estado === 'iniciado' ? 'selected' : ''}>Iniciado</option>
                                    <option value="desarrollo inicial" ${projectData?.estado === 'desarrollo inicial' ? 'selected' : ''}>Desarrollo Inicial</option>
                                    <option value="desarrollo medio" ${projectData?.estado === 'desarrollo medio' ? 'selected' : ''}>Desarrollo Medio</option>
                                    <option value="finalizado" ${projectData?.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-cost">Costo del Proyecto ($)</label>
                                <input 
                                    type="number" 
                                    id="project-cost" 
                                    name="costo"
                                    min="0" 
                                    step="0.01" 
                                    value="${projectData?.costo || ''}" 
                                    placeholder="0.00"
                                >
                            </div>
                            <div class="form-group">
                                <label for="project-progress">Progreso (%)</label>
                                <input 
                                    type="number" 
                                    id="project-progress" 
                                    name="porcentajeProgreso"
                                    min="0" 
                                    max="100" 
                                    value="${projectData?.porcentajeProgreso || 0}"
                                >
                                <div class="progress-preview" style="margin-top: 8px;">
                                    <div class="progress-bar small">
                                        <div class="progress" id="progress-preview-bar" style="width: ${projectData?.porcentajeProgreso || 0}%;"></div>
                                    </div>
                                    <span id="progress-preview-text">${projectData?.porcentajeProgreso || 0}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="project-notes">Notas Adicionales</label>
                            <textarea 
                                id="project-notes" 
                                name="notas"
                                rows="3" 
                                placeholder="Notas internas sobre el proyecto..."
                            >${projectData?.notas || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="project-files">Archivos Adjuntos (opcional)</label>
                            <input type="file" id="project-files" name="archivos" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip,.rar">
                            <small style="color: #999; font-size: 12px;">Formatos permitidos: PDF, DOC, DOCX, imágenes, ZIP, RAR (Max 5MB cada uno)</small>
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <label class="checkbox-container">
                                <input type="checkbox" id="notify-client" name="notificarCliente" ${isEditing ? '' : 'checked'}>
                                <span class="checkmark"></span>
                                ${isEditing ? 'Notificar cambios al cliente' : 'Notificar creación al cliente'}
                            </label>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 20px;">
                            <button type="button" class="secondary-btn" onclick="closeProjectModal()" id="cancel-project-btn">Cancelar</button>
                            <button type="submit" class="primary-btn" id="save-project-btn">${submitButtonText}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    console.log('HTML del modal generado, insertando en DOM...');
    
    // Insertar el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    console.log('Modal insertado, configurando eventos...');
    
    // Configurar eventos del modal después de que esté en el DOM
    setTimeout(() => {
        setupProjectModalEvents(isEditing, projectData);
        
        // Verificar que el modal se insertó correctamente
        const insertedModal = document.getElementById('project-modal');
        const insertedForm = document.getElementById('project-form');
        
        console.log('Verificación post-inserción:');
        console.log('- Modal insertado:', !!insertedModal);
        console.log('- Form insertado:', !!insertedForm);
        
        if (insertedForm) {
            console.log('- Form HTML snippet:', insertedForm.outerHTML.substring(0, 100) + '...');
        }
        
    }, 100);
}

/**
 * Abre el modal para crear un nuevo proyecto
 */
function openCreateProjectModal() {
    createProjectModal();
}

/**
 * Carga los datos de proyectos desde la API
 */
async function loadProjectsData() {
    console.log('Cargando datos de proyectos...');
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/projects?page=${currentProjectsPage}&limit=${projectsPerPage}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        const data = await response.json();
        console.log('Proyectos cargados:', data);
        
        projectsData = data.data || [];
        filteredProjectsData = [...projectsData];
        
        // Renderizar tarjetas de proyectos
        renderProjectsCards();
        
        // Actualizar paginación
        updateProjectsPagination(data.pagination);
        
        // Actualizar estadísticas
        updateProjectsStatistics();
        
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        showToast('Error al cargar proyectos', 'error');
        
        // Mostrar datos de ejemplo en caso de error
        showSampleProjectsData();
    }
}

/**
 * Carga las opciones de clientes para los selectores
 */
async function loadClientsOptions() {
    console.log('Cargando opciones de clientes...');
    
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
        clientsOptions = allUsers.filter(user => user.rol === 'cliente');
        
        console.log(`Clientes disponibles para proyectos: ${clientsOptions.length}`);
        
    } catch (error) {
        console.error('Error al cargar opciones de clientes:', error);
        clientsOptions = [];
    }
}

/**
 * Configura los eventos del modal de proyecto
 */
function setupProjectModalEvents(isEditing, projectData) {
    console.log('=== CONFIGURANDO EVENTOS DEL MODAL ===');
    console.log('Es edición:', isEditing);
    
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('close-project-modal');
    const cancelBtn = document.getElementById('cancel-project-btn');
    const form = document.getElementById('project-form');
    const progressInput = document.getElementById('project-progress');
    const progressBar = document.getElementById('progress-preview-bar');
    const progressText = document.getElementById('progress-preview-text');
    
    console.log('Elementos encontrados:', {
        modal: !!modal,
        closeBtn: !!closeBtn,
        cancelBtn: !!cancelBtn,
        form: !!form,
        progressInput: !!progressInput,
        progressBar: !!progressBar,
        progressText: !!progressText
    });
    
    if (!modal) {
        console.error('❌ Modal de proyecto no encontrado');
        return;
    }
    
    if (!form) {
        console.error('❌ Formulario de proyecto no encontrado');
        return;
    }
    
    // Función para cerrar modal
    function closeModal() {
        console.log('Cerrando modal...');
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
            console.log('Click en botón cerrar');
            closeModal();
        });
    } else {
        console.warn('⚠️ Botón de cerrar no encontrado');
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Click en botón cancelar');
            closeModal();
        });
    } else {
        console.warn('⚠️ Botón de cancelar no encontrado');
    }
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            console.log('Click fuera del modal, cerrando...');
            closeModal();
        }
    });
    
    // Prevenir que el modal se cierre al hacer clic dentro del contenido
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Actualizar preview del progreso
    if (progressInput && progressBar && progressText) {
        progressInput.addEventListener('input', function() {
            const value = Math.max(0, Math.min(100, this.value));
            progressBar.style.width = value + '%';
            progressText.textContent = value + '%';
        });
        console.log('✅ Evento de progreso configurado');
    } else {
        console.warn('⚠️ Elementos de progreso no encontrados');
    }
    
    // EVENTO PRINCIPAL: Envío del formulario
    form.addEventListener('submit', function(e) {
        console.log('=== SUBMIT DEL FORMULARIO DETECTADO ===');
        console.log('Evento:', e);
        console.log('Form target:', e.target);
        console.log('Es edición:', isEditing);
        
        e.preventDefault(); // Importante: prevenir envío por defecto
        
        // Verificar que los campos existen antes de procesar
        const requiredFields = {
            name: document.getElementById('project-name'),
            description: document.getElementById('project-description'),
            category: document.getElementById('project-category'),
            client: document.getElementById('project-client')
        };
        
        console.log('Verificando campos requeridos:');
        Object.entries(requiredFields).forEach(([key, element]) => {
            console.log(`- ${key}:`, element ? `✅ (${element.value})` : '❌ NO ENCONTRADO');
        });
        
        // Llamar a la función apropiada
        if (isEditing) {
            console.log('Llamando handleProjectUpdate...');
            handleProjectUpdate(e, projectData);
        } else {
            console.log('Llamando handleProjectCreate...');
            handleProjectCreate(e);
        }
    });
    
    console.log('✅ Eventos del modal configurados correctamente');
    
    // Debug adicional - mostrar la estructura del formulario
    console.log('=== ESTRUCTURA DEL FORMULARIO ===');
    const allInputs = form.querySelectorAll('input, select, textarea');
    console.log(`Total de campos: ${allInputs.length}`);
    
    allInputs.forEach((input, index) => {
        console.log(`${index + 1}. ${input.tagName} - ID: ${input.id} - Name: ${input.name} - Value: "${input.value}"`);
    });
}

/**
 * Maneja la creación de un nuevo proyecto - VERSION CORREGIDA
 */
async function handleProjectCreate(e) {
    console.log('=== INICIANDO CREACIÓN DE PROYECTO ===');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-project-btn') || form.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.error('Botón de envío no encontrado');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        
        // MÉTODO MEJORADO: Usar FormData y obtener datos directamente del form
        const formData = new FormData(form);
        
        // También obtener elementos directamente por ID con verificación
        const projectData = {
            nombre: form.querySelector('#project-name')?.value?.trim() || 
                   document.getElementById('project-name')?.value?.trim() || '',
            descripcion: form.querySelector('#project-description')?.value?.trim() || 
                        document.getElementById('project-description')?.value?.trim() || '',
            categoria: form.querySelector('#project-category')?.value || 
                      document.getElementById('project-category')?.value || '',
            estado: form.querySelector('#project-status')?.value || 
                   document.getElementById('project-status')?.value || 'cotizacion',
            cliente: form.querySelector('#project-client')?.value || 
                    document.getElementById('project-client')?.value || '',
            costo: parseFloat(form.querySelector('#project-cost')?.value || 
                             document.getElementById('project-cost')?.value || '0') || 0,
            porcentajeProgreso: parseInt(form.querySelector('#project-progress')?.value || 
                                       document.getElementById('project-progress')?.value || '0') || 0,
            notas: form.querySelector('#project-notes')?.value?.trim() || 
                  document.getElementById('project-notes')?.value?.trim() || ''
        };
        
        console.log('=== DEBUG: ELEMENTOS DEL DOM ===');
        console.log('Form element:', form);
        console.log('Nombre input:', form.querySelector('#project-name'));
        console.log('Descripción textarea:', form.querySelector('#project-description'));
        console.log('Categoría select:', form.querySelector('#project-category'));
        console.log('Cliente select:', form.querySelector('#project-client'));
        
        console.log('=== DATOS EXTRAÍDOS ===');
        Object.entries(projectData).forEach(([key, value]) => {
            console.log(`${key}:`, typeof value, `"${value}"`);
        });
        
        // Validaciones detalladas
        const errors = [];
        if (!projectData.nombre) errors.push('Nombre del proyecto es requerido');
        if (!projectData.descripcion) errors.push('Descripción es requerida');
        if (!projectData.categoria) errors.push('Categoría es requerida');
        if (!projectData.cliente) errors.push('Cliente es requerido');
        
        if (errors.length > 0) {
            console.error('=== ERRORES DE VALIDACIÓN ===');
            errors.forEach(error => console.error(`- ${error}`));
            
            // Mostrar cuáles campos específicos están fallando
            const formElements = {
                nombre: document.getElementById('project-name'),
                descripcion: document.getElementById('project-description'),
                categoria: document.getElementById('project-category'),
                cliente: document.getElementById('project-client')
            };
            
            console.log('=== ESTADO DE ELEMENTOS ===');
            Object.entries(formElements).forEach(([field, element]) => {
                if (element) {
                    console.log(`${field}: EXISTS - Value: "${element.value}" - Type: ${element.type || element.tagName}`);
                } else {
                    console.error(`${field}: NOT FOUND`);
                }
            });
            
            throw new Error(errors.join(', '));
        }
        
        // Validación adicional del progreso
        if (projectData.porcentajeProgreso < 0 || projectData.porcentajeProgreso > 100) {
            throw new Error('El porcentaje de progreso debe estar entre 0 y 100');
        }
        
        console.log('=== DATOS VALIDADOS - ENVIANDO ===');
        console.log('Datos finales:', JSON.stringify(projectData, null, 2));
        
        // Enviar al servidor
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const url = `${API_BASE}/api/projects`;
        console.log('URL de envío:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });
        
        console.log('=== RESPUESTA DEL SERVIDOR ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        console.log('=== PROYECTO CREADO EXITOSAMENTE ===');
        
        // Mostrar mensaje de éxito
        showToast('Proyecto creado correctamente', 'success');
        
        // Recargar datos
        await loadProjectsData();
        
        // Cerrar modal
        closeProjectModal();
        
    } catch (error) {
        console.error('=== ERROR AL CREAR PROYECTO ===');
        console.error('Error completo:', error);
        showToast(error.message || 'Error al crear proyecto', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Maneja la actualización de un proyecto existente - VERSION CORREGIDA
 */
async function handleProjectUpdate(e, projectData) {
    console.log('=== INICIANDO ACTUALIZACIÓN DE PROYECTO ===');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#save-project-btn') || form.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.error('Botón de envío no encontrado');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        
        // Obtener datos del formulario con el mismo método mejorado
        const updatedData = {
            nombre: form.querySelector('#project-name')?.value?.trim() || 
                   document.getElementById('project-name')?.value?.trim() || '',
            descripcion: form.querySelector('#project-description')?.value?.trim() || 
                        document.getElementById('project-description')?.value?.trim() || '',
            categoria: form.querySelector('#project-category')?.value || 
                      document.getElementById('project-category')?.value || '',
            estado: form.querySelector('#project-status')?.value || 
                   document.getElementById('project-status')?.value || 'cotizacion',
            cliente: form.querySelector('#project-client')?.value || 
                    document.getElementById('project-client')?.value || '',
            costo: parseFloat(form.querySelector('#project-cost')?.value || 
                             document.getElementById('project-cost')?.value || '0') || 0,
            porcentajeProgreso: parseInt(form.querySelector('#project-progress')?.value || 
                                       document.getElementById('project-progress')?.value || '0') || 0,
            notas: form.querySelector('#project-notes')?.value?.trim() || 
                  document.getElementById('project-notes')?.value?.trim() || ''
        };
        
        console.log('=== DATOS DE ACTUALIZACIÓN ===');
        Object.entries(updatedData).forEach(([key, value]) => {
            console.log(`${key}:`, typeof value, `"${value}"`);
        });
        
        // Validaciones
        const errors = [];
        if (!updatedData.nombre) errors.push('Nombre del proyecto es requerido');
        if (!updatedData.descripcion) errors.push('Descripción es requerida');
        if (!updatedData.categoria) errors.push('Categoría es requerida');
        if (!updatedData.cliente) errors.push('Cliente es requerido');
        
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        
        if (updatedData.porcentajeProgreso < 0 || updatedData.porcentajeProgreso > 100) {
            throw new Error('El porcentaje de progreso debe estar entre 0 y 100');
        }
        
        // Enviar al servidor
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const url = `${API_BASE}/api/projects/${projectData._id}`;
        console.log('URL de actualización:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
        
        console.log('=== RESPUESTA DE ACTUALIZACIÓN ===');
        console.log('Status:', response.status);
        
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        console.log('=== PROYECTO ACTUALIZADO EXITOSAMENTE ===');
        
        // Mostrar mensaje de éxito
        showToast('Proyecto actualizado correctamente', 'success');
        
        // Recargar datos
        await loadProjectsData();
        
        // Cerrar modal
        closeProjectModal();
        
    } catch (error) {
        console.error('=== ERROR AL ACTUALIZAR PROYECTO ===');
        console.error('Error completo:', error);
        showToast(error.message || 'Error al actualizar proyecto', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Función auxiliar para cerrar el modal
 */
function closeProjectModal() {
    const modal = document.getElementById('project-modal');
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
 * Función de debugging para inspeccionar el DOM
 */
function debugProjectForm() {
    console.log('=== DEBUG DEL FORMULARIO DE PROYECTO ===');
    
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    
    console.log('Modal encontrado:', !!modal);
    console.log('Form encontrado:', !!form);
    
    if (form) {
        console.log('Form HTML:', form.outerHTML.substring(0, 200) + '...');
        
        const inputs = form.querySelectorAll('input, select, textarea');
        console.log(`Total de campos encontrados: ${inputs.length}`);
        
        inputs.forEach((input, index) => {
            console.log(`Campo ${index + 1}:`, {
                id: input.id,
                name: input.name,
                type: input.type || input.tagName,
                value: input.value,
                required: input.required
            });
        });
    }
    
    // Verificar elementos específicos
    const requiredFields = ['project-name', 'project-description', 'project-category', 'project-client'];
    requiredFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        console.log(`${fieldId}:`, {
            found: !!element,
            value: element?.value,
            type: element?.type || element?.tagName
        });
    });
}

// Exponer función de debug globalmente para testing
window.debugProjectForm = debugProjectForm;

/**
 * Renderiza las tarjetas de proyectos
 */
function renderProjectsCards() {
    const projectsContainer = document.querySelector('.project-cards');
    if (!projectsContainer) return;
    
    if (filteredProjectsData.length === 0) {
        projectsContainer.innerHTML = `
            <div class="no-projects-message" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #999;">
                <i class="fas fa-project-diagram" style="font-size: 64px; margin-bottom: 20px; display: block; opacity: 0.5;"></i>
                <h3>No se encontraron proyectos</h3>
                <p>Crea tu primer proyecto haciendo clic en el botón "Añadir Proyecto"</p>
            </div>
        `;
        return;
    }
    
    const cards = filteredProjectsData.map(project => {
        const fechaCreacion = project.fechaCreacion 
            ? new Date(project.fechaCreacion).toLocaleDateString('es-ES')
            : 'N/A';
        
        const fechaEstimada = project.fechaEstimada || project.fechaActualizacion
            ? new Date(project.fechaEstimada || project.fechaActualizacion).toLocaleDateString('es-ES')
            : 'Por definir';
        
        const clienteNombre = project.clienteDetalles 
            ? `${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos}`
            : 'Cliente no asignado';
        
        const clienteEmpresa = project.clienteDetalles?.empresa 
            ? ` - ${project.clienteDetalles.empresa}`
            : '';
        
        const categoriaLabels = {
            'web-development': 'Desarrollo Web',
            'ecommerce': 'Tienda Online',
            'marketing-digital': 'Marketing Digital',
            'social-media': 'Redes Sociales',
            'seo': 'SEO',
            'branding': 'Branding',
            'design': 'Diseño Gráfico'
        };
        
        const estadoLabels = {
            'cotizacion': 'Cotización',
            'pago procesado': 'Pago Procesado',
            'iniciado': 'Iniciado',
            'desarrollo inicial': 'Desarrollo Inicial',
            'desarrollo medio': 'Desarrollo Medio',
            'finalizado': 'Finalizado'
        };
        
        return `
            <div class="project-card">
                <div class="project-header">
                    <span class="project-category">${categoriaLabels[project.categoria] || project.categoria}</span>
                    <span class="project-status" data-status="${project.estado}">${estadoLabels[project.estado] || project.estado}</span>
                </div>
                <h3 class="project-title">${project.nombre}</h3>
                <p class="project-client">
                    <i class="fas fa-user"></i> ${clienteNombre}${clienteEmpresa}
                </p>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${project.porcentajeProgreso || 0}%;"></div>
                    </div>
                    <span class="progress-text">${project.porcentajeProgreso || 0}%</span>
                </div>
                <div class="project-dates">
                    <p><i class="far fa-calendar-alt"></i> Creado: ${fechaCreacion}</p>
                    <p><i class="fas fa-calendar-check"></i> Estimado: ${fechaEstimada}</p>
                </div>
                ${project.costo ? `<div class="project-cost">
                    <p><i class="fas fa-dollar-sign"></i> Costo: ${project.costo.toLocaleString()}</p>
                </div>` : ''}
                <div class="project-actions">
                    <button class="action-btn view-btn" title="Ver detalles" onclick="viewProject('${project._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Editar" onclick="editProject('${project._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Eliminar" onclick="deleteProject('${project._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    projectsContainer.innerHTML = cards;
}

/**
 * Muestra datos de ejemplo cuando falla la carga
 */
function showSampleProjectsData() {
    const projectsContainer = document.querySelector('.project-cards');
    if (!projectsContainer) return;
    
    const sampleData = `
        <div class="project-card">
            <div class="project-header">
                <span class="project-category">Desarrollo Web</span>
                <span class="project-status" data-status="desarrollo medio">Desarrollo Medio</span>
            </div>
            <h3 class="project-title">E-commerce Fashion Store</h3>
            <p class="project-client"><i class="fas fa-user"></i> Cliente de Ejemplo - Empresa ABC</p>
            <div class="project-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: 65%;"></div>
                </div>
                <span class="progress-text">65%</span>
            </div>
            <div class="project-dates">
                <p><i class="far fa-calendar-alt"></i> Creado: 15/03/2025</p>
                <p><i class="fas fa-calendar-check"></i> Estimado: 15/06/2025</p>
            </div>
            <div class="project-actions">
                <button class="action-btn view-btn" title="Ver detalles"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" title="Eliminar"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #999; font-style: italic;">
            Datos de ejemplo - Conecte con la API para ver datos reales
        </div>
    `;
    
    projectsContainer.innerHTML = sampleData;
}

/**
 * Configura los filtros de proyectos
 */
function setupProjectsFilters() {
    const filterStatus = document.getElementById('project-filter-status');
    const filterCategory = document.getElementById('project-filter-category');
    const filterDate = document.getElementById('project-filter-date');
    
    if (filterStatus) {
        filterStatus.addEventListener('change', applyProjectsFilters);
    }
    
    if (filterCategory) {
        filterCategory.addEventListener('change', applyProjectsFilters);
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', applyProjectsFilters);
    }
}

/**
 * Aplica los filtros a los datos de proyectos
 */
function applyProjectsFilters() {
    const filterStatus = document.getElementById('project-filter-status')?.value || 'all';
    const filterCategory = document.getElementById('project-filter-category')?.value || 'all';
    const filterDate = document.getElementById('project-filter-date')?.value || 'all';
    const searchTerm = document.getElementById('project-search')?.value?.toLowerCase() || '';
    
    filteredProjectsData = projectsData.filter(project => {
        // Filtro por estado
        let statusMatch = filterStatus === 'all' || project.estado === filterStatus;
        
        // Filtro por categoría
        let categoryMatch = filterCategory === 'all' || project.categoria === filterCategory;
        
        // Filtro por fecha
        let dateMatch = true;
        if (filterDate !== 'all' && project.fechaCreacion) {
            const projectDate = new Date(project.fechaCreacion);
            const now = new Date();
            
            switch (filterDate) {
                case 'this-month':
                    dateMatch = projectDate.getMonth() === now.getMonth() && 
                               projectDate.getFullYear() === now.getFullYear();
                    break;
                case 'last-month':
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                    dateMatch = projectDate.getMonth() === lastMonth.getMonth() && 
                               projectDate.getFullYear() === lastMonth.getFullYear();
                    break;
                case 'this-year':
                    dateMatch = projectDate.getFullYear() === now.getFullYear();
                    break;
            }
        }
        
        // Filtro por búsqueda
        let searchMatch = true;
        if (searchTerm) {
            searchMatch = (
                project.nombre?.toLowerCase().includes(searchTerm) ||
                project.descripcion?.toLowerCase().includes(searchTerm) ||
                project.categoria?.toLowerCase().includes(searchTerm) ||
                project.clienteDetalles?.nombre?.toLowerCase().includes(searchTerm) ||
                project.clienteDetalles?.apellidos?.toLowerCase().includes(searchTerm) ||
                project.clienteDetalles?.empresa?.toLowerCase().includes(searchTerm)
            );
        }
        
        return statusMatch && categoryMatch && dateMatch && searchMatch;
    });
    
    renderProjectsCards();
}

/**
 * Búsqueda de proyectos
 */
function searchProjects() {
    applyProjectsFilters();
}

/**
 * Configurar paginación de proyectos
 */
function setupProjectsPagination() {
    console.log('Paginación de proyectos configurada');
}

/**
 * Actualizar controles de paginación
 */
function updateProjectsPagination(paginationData) {
    console.log('Actualizando paginación de proyectos:', paginationData);
}

/**
 * Ver detalles de un proyecto
 */
function viewProject(projectId) {
    console.log('Ver proyecto:', projectId);
    const project = projectsData.find(p => p._id === projectId);
    if (project) {
        showProjectDetailsModal(project);
    }
}

/**
 * Editar un proyecto
 */
function editProject(projectId) {
    console.log('Editar proyecto:', projectId);
    const project = projectsData.find(p => p._id === projectId);
    if (project) {
        createProjectModal(project);
    }
}

/**
 * Eliminar un proyecto
 */
async function deleteProject(projectId) {
    console.log('Eliminar proyecto:', projectId);
    
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
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
        
        const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar proyecto');
        }
        
        showToast('Proyecto eliminado correctamente', 'success');
        await loadProjectsData();
        
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        showToast(error.message || 'Error al eliminar proyecto', 'error');
    }
}

/**
 * Muestra modal con detalles del proyecto
 */
function showProjectDetailsModal(project) {
    const fechaCreacion = project.fechaCreacion 
        ? new Date(project.fechaCreacion).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        })
        : 'N/A';
    
    const fechaActualizacion = project.fechaActualizacion 
        ? new Date(project.fechaActualizacion).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        })
        : 'N/A';
    
    const clienteInfo = project.clienteDetalles 
        ? `${project.clienteDetalles.nombre} ${project.clienteDetalles.apellidos}`
        : 'Cliente no asignado';
    
    const clienteEmpresa = project.clienteDetalles?.empresa || 'No especificada';
    const clienteCorreo = project.clienteDetalles?.correo || '';
    const clienteTelefono = project.clienteDetalles?.telefono || '';
    
    const categoriaLabels = {
        'web-development': 'Desarrollo Web',
        'ecommerce': 'Tienda Online',
        'marketing-digital': 'Marketing Digital',
        'social-media': 'Redes Sociales',
        'seo': 'SEO',
        'branding': 'Branding',
        'design': 'Diseño Gráfico'
    };
    
    const estadoLabels = {
        'cotizacion': 'Cotización',
        'pago procesado': 'Pago Procesado',
        'iniciado': 'Iniciado',
        'desarrollo inicial': 'Desarrollo Inicial',
        'desarrollo medio': 'Desarrollo Medio',
        'finalizado': 'Finalizado'
    };
    
    const modalHTML = `
        <div class="modal active" id="project-details-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2>Detalles del Proyecto</h2>
                    <button class="close-btn" id="close-project-details-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="project-details">
                        <div class="project-header-details">
                            <div class="project-icon">
                                <i class="fas fa-project-diagram"></i>
                            </div>
                            <div class="project-info">
                                <h3>${project.nombre}</h3>
                                <div class="project-meta">
                                    <span class="project-category-badge">${categoriaLabels[project.categoria] || project.categoria}</span>
                                    <span class="project-status-badge" data-status="${project.estado}">
                                        ${estadoLabels[project.estado] || project.estado}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="project-progress-section">
                            <h4>Progreso del Proyecto</h4>
                            <div class="progress-container">
                                <div class="progress-bar large">
                                    <div class="progress" style="width: ${project.porcentajeProgreso || 0}%;"></div>
                                </div>
                                <span class="progress-percentage">${project.porcentajeProgreso || 0}%</span>
                            </div>
                        </div>
                        
                        <div class="details-grid">
                            <div class="detail-section">
                                <h4>Información del Proyecto</h4>
                                <div class="detail-row">
                                    <label>Nombre:</label>
                                    <span>${project.nombre}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Descripción:</label>
                                    <span>${project.descripcion || 'No especificada'}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Categoría:</label>
                                    <span>${categoriaLabels[project.categoria] || project.categoria}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Estado:</label>
                                    <span>${estadoLabels[project.estado] || project.estado}</span>
                                </div>
                                ${project.costo ? `<div class="detail-row">
                                    <label>Costo:</label>
                                    <span>${project.costo.toLocaleString()}</span>
                                </div>` : ''}
                            </div>
                            
                            <div class="detail-section">
                                <h4>Información del Cliente</h4>
                                <div class="detail-row">
                                    <label>Cliente:</label>
                                    <span>${clienteInfo}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Empresa:</label>
                                    <span>${clienteEmpresa}</span>
                                </div>
                                ${clienteCorreo ? `<div class="detail-row">
                                    <label>Correo:</label>
                                    <span>${clienteCorreo}</span>
                                </div>` : ''}
                                ${clienteTelefono ? `<div class="detail-row">
                                    <label>Teléfono:</label>
                                    <span>${clienteTelefono}</span>
                                </div>` : ''}
                            </div>
                            
                            <div class="detail-section">
                                <h4>Fechas Importantes</h4>
                                <div class="detail-row">
                                    <label>Fecha de Creación:</label>
                                    <span>${fechaCreacion}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Última Actualización:</label>
                                    <span>${fechaActualizacion}</span>
                                </div>
                            </div>
                            
                            ${project.notas ? `<div class="detail-section">
                                <h4>Notas del Proyecto</h4>
                                <div class="notes-content">
                                    <p>${project.notas}</p>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                    
                    <div class="form-actions" style="margin-top: 30px;">
                        <button type="button" class="secondary-btn" onclick="editProject('${project._id}')">
                            <i class="fas fa-edit"></i> Editar Proyecto
                        </button>
                        
                        <button type="button" class="primary-btn" id="close-project-details-btn">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    /**<button type="button" class="secondary-btn" onclick="createAppointmentForProject('${project._id}')">
        <i class="far fa-calendar-plus"></i> Agendar Cita
    </button>*/
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('project-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Insertar el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos del modal
    setTimeout(() => {
        const modal = document.getElementById('project-details-modal');
        const closeBtn = document.getElementById('close-project-details-modal');
        const closeDetailsBtn = document.getElementById('close-project-details-btn');
        
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
 * Crear cita para proyecto
 */
function createAppointmentForProject(projectId) {
    console.log('Crear cita para proyecto:', projectId);
    showToast('Funcionalidad de citas próximamente', 'info');
}

/**
 * Actualizar estadísticas de proyectos
 */
function updateProjectsStatistics() {
    const totalProyectos = projectsData.length;
    const proyectosEnCurso = projectsData.filter(project => 
        ['iniciado', 'desarrollo inicial', 'desarrollo medio'].includes(project.estado)
    ).length;
    
    const proyectosFinalizados = projectsData.filter(project => 
        project.estado === 'finalizado'
    ).length;
    
    // Actualizar elementos en el dashboard principal si existen
    const projectsCountElement = document.getElementById('projects-count');
    if (projectsCountElement) {
        projectsCountElement.textContent = proyectosEnCurso;
    }
    
    console.log('Estadísticas de proyectos actualizadas:', {
        total: totalProyectos,
        enCurso: proyectosEnCurso,
        finalizados: proyectosFinalizados
    });
}

// Funciones globales para que puedan ser llamadas desde los botones
window.viewProject = viewProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.createAppointmentForProject = createAppointmentForProject;
window.closeProjectModal = closeProjectModal;

// Hacer disponible la función de inicialización globalmente
window.initProjectsModule = initProjectsModule;
window.openCreateProjectModal = openCreateProjectModal;

console.log('Módulo de proyectos cargado correctamente');