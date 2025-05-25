/**
 * Módulo de Proyectos para Dashboard Cliente
 * Archivo: frontend/js/clientProjectsModule.js
 */

let currentClientProjectsPage = 1;
let clientProjectsPerPage = 9;
let clientProjectsData = [];
let filteredClientProjectsData = [];

/**
 * Inicializa el módulo de proyectos del cliente cuando se carga la sección
 */
function initClientProjectsModule() {
    console.log('🚀 Inicializando módulo de proyectos del cliente...');
    
    // Configurar eventos de la sección de proyectos
    setupClientProjectsEvents();
    
    // Cargar datos de proyectos del cliente
    loadClientProjectsData();
    
    // Configurar filtros
    setupClientProjectsFilters();
    
    // Configurar paginación
    setupClientProjectsPagination();
}

/**
 * Configura todos los eventos relacionados con proyectos del cliente
 */
function setupClientProjectsEvents() {
    console.log('🔧 Configurando eventos de proyectos del cliente...');
    
    // Botón de solicitar proyecto en la sección
    const requestProjectBtn = document.getElementById('request-new-project-btn');
    if (requestProjectBtn) {
        requestProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openRequestProjectModal();
        });
    }
    
    // Búsqueda de proyectos
    const projectSearchBtn = document.getElementById('client-project-search-btn');
    const projectSearchInput = document.getElementById('client-project-search');
    
    if (projectSearchBtn) {
        projectSearchBtn.addEventListener('click', function() {
            searchClientProjects();
        });
    }
    
    if (projectSearchInput) {
        projectSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchClientProjects();
            }
        });
        
        // Búsqueda en tiempo real
        projectSearchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                searchClientProjects();
            }, 500);
        });
    }
    
    // Filtros
    const statusFilter = document.getElementById('client-project-filter-status');
    const categoryFilter = document.getElementById('client-project-filter-category');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyClientProjectsFilters);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyClientProjectsFilters);
    }
    
    console.log('✅ Eventos de proyectos del cliente configurados');
}

/**
 * Carga los datos de proyectos del cliente desde la API
 */
async function loadClientProjectsData() {
    console.log('📋 Cargando datos de proyectos del cliente...');
    
    const container = document.getElementById('client-projects-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Cargando proyectos...</span>
            </div>
        `;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const user = window.currentUser;
        
        if (!token || !user) {
            throw new Error('Datos de autenticación no encontrados');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Obtener proyectos del cliente actual
        const response = await fetch(`${API_BASE}/api/projects?cliente=${user._id}&page=${currentClientProjectsPage}&limit=${clientProjectsPerPage}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        const data = await response.json();
        console.log('✅ Proyectos del cliente cargados:', data);
        
        clientProjectsData = data.data || [];
        filteredClientProjectsData = [...clientProjectsData];
        
        // Renderizar tarjetas de proyectos
        renderClientProjectsCards();
        
        // Actualizar paginación
        updateClientProjectsPagination(data.pagination);
        
        // Actualizar estadísticas
        updateClientProjectsStatistics();
        
    } catch (error) {
        console.error('❌ Error al cargar proyectos del cliente:', error);
        showToast('Error al cargar proyectos', 'error');
        
        // Mostrar mensaje de error
        showClientProjectsError();
    }
}

/**
 * Renderiza las tarjetas de proyectos del cliente
 */
function renderClientProjectsCards() {
    const projectsContainer = document.getElementById('client-projects-container');
    if (!projectsContainer) {
        console.warn('⚠️ Contenedor de proyectos del cliente no encontrado');
        return;
    }
    
    if (filteredClientProjectsData.length === 0) {
        showEmptyClientProjects();
        return;
    }
    
    const cards = filteredClientProjectsData.map(project => {
        const fechaCreacion = project.fechaCreacion 
            ? new Date(project.fechaCreacion).toLocaleDateString('es-ES')
            : 'N/A';
        
        const fechaActualizacion = project.fechaActualizacion || project.fechaCreacion
            ? new Date(project.fechaActualizacion || project.fechaCreacion).toLocaleDateString('es-ES')
            : 'N/A';
        
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
        
        // Determinar color de estado
        const getStatusColor = (estado) => {
            switch(estado) {
                case 'cotizacion': return '#ff9800';
                case 'pago procesado': return '#2196F3';
                case 'iniciado': return '#4CAF50';
                case 'desarrollo inicial': return '#00BCD4';
                case 'desarrollo medio': return '#3F51B5';
                case 'finalizado': return '#4CAF50';
                default: return '#9E9E9E';
            }
        };
        
        return `
            <div class="client-project-card" onclick="viewClientProjectDetails('${project._id}')">
                <div class="project-card-header">
                    <div class="project-category-badge" style="background-color: ${getStatusColor(project.estado)};">
                        ${categoriaLabels[project.categoria] || project.categoria}
                    </div>
                    <div class="project-status-badge" data-status="${project.estado}">
                        ${estadoLabels[project.estado] || project.estado}
                    </div>
                </div>
                
                <div class="project-card-content">
                    <h3 class="project-title">${project.nombre}</h3>
                    <p class="project-description">${project.descripcion ? project.descripcion.substring(0, 100) + (project.descripcion.length > 100 ? '...' : '') : 'Sin descripción'}</p>
                    
                    <div class="project-progress-section">
                        <div class="progress-info">
                            <span class="progress-label">Progreso</span>
                            <span class="progress-percentage">${project.porcentajeProgreso || 0}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${project.porcentajeProgreso || 0}%; background-color: ${getStatusColor(project.estado)};"></div>
                        </div>
                    </div>
                    
                    <div class="project-dates">
                        <div class="date-item">
                            <i class="far fa-calendar-alt"></i>
                            <span>Creado: ${fechaCreacion}</span>
                        </div>
                        <div class="date-item">
                            <i class="fas fa-sync-alt"></i>
                            <span>Actualizado: ${fechaActualizacion}</span>
                        </div>
                    </div>
                    
                    ${project.costo ? `
                    <div class="project-cost">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Costo: $${project.costo.toLocaleString()}</span>
                    </div>
                    ` : ''}
                    
                    ${project.notas ? `
                    <div class="project-notes">
                        <i class="fas fa-sticky-note"></i>
                        <span>${project.notas.substring(0, 80)}${project.notas.length > 80 ? '...' : ''}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="project-card-footer">
                    <button class="client-action-btn primary" onclick="event.stopPropagation(); viewClientProjectDetails('${project._id}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                        <span>Ver Detalles</span>
                    </button>
                    <button class="client-action-btn secondary" onclick="event.stopPropagation(); contactAboutProject('${project._id}')" title="Contactar sobre este proyecto">
                        <i class="fas fa-envelope"></i>
                        <span>Contactar</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    projectsContainer.innerHTML = cards;
    
    console.log('✅ Tarjetas de proyectos del cliente renderizadas:', filteredClientProjectsData.length);
}

/**
 * Muestra mensaje cuando no hay proyectos
 */
function showEmptyClientProjects() {
    const projectsContainer = document.getElementById('client-projects-container');
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = `
        <div class="empty-projects-state">
            <div class="empty-state-content">
                <div class="empty-state-icon">
                    <i class="fas fa-project-diagram"></i>
                </div>
                <h3>No tienes proyectos aún</h3>
                <p>¡Comienza tu primer proyecto con nosotros! Contáctanos para una consulta gratuita y descubre cómo podemos ayudarte a hacer realidad tus ideas.</p>
                <div class="empty-state-actions">
                    <button class="primary-btn" onclick="openRequestProjectModal()">
                        <i class="fas fa-plus"></i> Solicitar Proyecto
                    </button>
                    <button class="secondary-btn" onclick="switchToClientSection('appointments')">
                        <i class="far fa-calendar-plus"></i> Agendar Consulta
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Muestra mensaje de error al cargar proyectos
 */
function showClientProjectsError() {
    const projectsContainer = document.getElementById('client-projects-container');
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = `
        <div class="error-projects-state">
            <div class="error-state-content">
                <div class="error-state-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Error al cargar proyectos</h3>
                <p>No pudimos cargar tus proyectos en este momento. Por favor, intenta nuevamente.</p>
                <div class="error-state-actions">
                    <button class="primary-btn" onclick="loadClientProjectsData()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                    <button class="secondary-btn" onclick="switchToClientSection('messages')">
                        <i class="fas fa-envelope"></i> Contactar Soporte
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Ver detalles de un proyecto del cliente
 */
function viewClientProjectDetails(projectId) {
    console.log('👁️ Ver detalles del proyecto cliente:', projectId);
    
    const project = clientProjectsData.find(p => p._id === projectId);
    if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return;
    }
    
    showClientProjectDetailsModal(project);
}

/**
 * Muestra modal con detalles del proyecto del cliente
 */
function showClientProjectDetailsModal(project) {
    console.log('🔍 Mostrando detalles del proyecto:', project.nombre);
    
    const fechaCreacion = project.fechaCreacion 
        ? new Date(project.fechaCreacion).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : 'N/A';
    
    const fechaActualizacion = project.fechaActualizacion 
        ? new Date(project.fechaActualizacion).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : 'N/A';
    
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
    
    const getStatusColor = (estado) => {
        switch(estado) {
            case 'cotizacion': return '#ff9800';
            case 'pago procesado': return '#2196F3';
            case 'iniciado': return '#4CAF50';
            case 'desarrollo inicial': return '#00BCD4';
            case 'desarrollo medio': return '#3F51B5';
            case 'finalizado': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };
    
    const getStatusDescription = (estado) => {
        switch(estado) {
            case 'cotizacion': return 'Estamos preparando tu cotización personalizada';
            case 'pago procesado': return 'El pago ha sido confirmado y el proyecto está listo para iniciar';
            case 'iniciado': return 'El proyecto ha comenzado oficialmente';
            case 'desarrollo inicial': return 'Estamos en las primeras fases de desarrollo';
            case 'desarrollo medio': return 'El proyecto está en pleno desarrollo';
            case 'finalizado': return '¡Tu proyecto ha sido completado exitosamente!';
            default: return 'Estado del proyecto';
        }
    };
    
    const modalHTML = `
        <div class="modal active" id="client-project-details-modal">
            <div class="modal-content modal-xl">
                <div class="modal-header">
                    <h2><i class="fas fa-project-diagram"></i> Detalles del Proyecto</h2>
                    <button class="close-btn" id="close-client-project-details-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="client-project-details">
                        <!-- Header del proyecto -->
                        <div class="project-header-section">
                            <div class="project-main-info">
                                <h3 class="project-name">${project.nombre}</h3>
                                <div class="project-meta-info">
                                    <span class="project-category" style="background-color: ${getStatusColor(project.estado)};">
                                        <i class="fas fa-tag"></i>
                                        ${categoriaLabels[project.categoria] || project.categoria}
                                    </span>
                                    <span class="project-status" style="background-color: ${getStatusColor(project.estado)};">
                                        <i class="fas fa-circle"></i>
                                        ${estadoLabels[project.estado] || project.estado}
                                    </span>
                                </div>
                                <p class="project-status-description">${getStatusDescription(project.estado)}</p>
                            </div>
                        </div>
                        
                        <!-- Progreso del proyecto -->
                        <div class="project-progress-section-detailed">
                            <h4><i class="fas fa-chart-line"></i> Progreso del Proyecto</h4>
                            <div class="progress-container-detailed">
                                <div class="progress-bar-large">
                                    <div class="progress-fill" style="width: ${project.porcentajeProgreso || 0}%; background: linear-gradient(135deg, ${getStatusColor(project.estado)}, ${getStatusColor(project.estado)}dd);"></div>
                                </div>
                                <div class="progress-info-detailed">
                                    <span class="progress-percentage-large">${project.porcentajeProgreso || 0}%</span>
                                    <span class="progress-status">Completado</span>
                                </div>
                            </div>
                            
                            <!-- Timeline del proyecto (simulado) -->
                            <div class="project-timeline">
                                <div class="timeline-item ${['cotizacion', 'pago procesado', 'iniciado', 'desarrollo inicial', 'desarrollo medio', 'finalizado'].indexOf(project.estado) >= 0 ? 'completed' : ''}">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <h5>Cotización</h5>
                                        <p>Revisión inicial y cotización del proyecto</p>
                                    </div>
                                </div>
                                <div class="timeline-item ${['pago procesado', 'iniciado', 'desarrollo inicial', 'desarrollo medio', 'finalizado'].indexOf(project.estado) >= 0 ? 'completed' : ''}">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <h5>Pago Procesado</h5>
                                        <p>Confirmación de pago y preparación para iniciar</p>
                                    </div>
                                </div>
                                <div class="timeline-item ${['iniciado', 'desarrollo inicial', 'desarrollo medio', 'finalizado'].indexOf(project.estado) >= 0 ? 'completed' : ''}">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <h5>Desarrollo</h5>
                                        <p>Implementación y desarrollo del proyecto</p>
                                    </div>
                                </div>
                                <div class="timeline-item ${project.estado === 'finalizado' ? 'completed' : ''}">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <h5>Finalización</h5>
                                        <p>Entrega y revisión final del proyecto</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Información detallada -->
                        <div class="project-info-grid">
                            <div class="info-section">
                                <h4><i class="fas fa-info-circle"></i> Información del Proyecto</h4>
                                <div class="info-content">
                                    <div class="info-row">
                                        <label>Descripción:</label>
                                        <p>${project.descripcion || 'No se ha proporcionado una descripción detallada.'}</p>
                                    </div>
                                    <div class="info-row">
                                        <label>Categoría:</label>
                                        <span>${categoriaLabels[project.categoria] || project.categoria}</span>
                                    </div>
                                    <div class="info-row">
                                        <label>Estado Actual:</label>
                                        <span style="color: ${getStatusColor(project.estado)}; font-weight: 600;">
                                            ${estadoLabels[project.estado] || project.estado}
                                        </span>
                                    </div>
                                    ${project.costo ? `
                                    <div class="info-row">
                                        <label>Costo del Proyecto:</label>
                                        <span class="cost-value">$${project.costo.toLocaleString()}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="info-section">
                                <h4><i class="far fa-calendar-alt"></i> Fechas Importantes</h4>
                                <div class="info-content">
                                    <div class="info-row">
                                        <label>Fecha de Creación:</label>
                                        <span>${fechaCreacion}</span>
                                    </div>
                                    <div class="info-row">
                                        <label>Última Actualización:</label>
                                        <span>${fechaActualizacion}</span>
                                    </div>
                                </div>
                            </div>
                            
                            ${project.notas ? `
                            <div class="info-section full-width">
                                <h4><i class="fas fa-sticky-note"></i> Notas del Proyecto</h4>
                                <div class="notes-content">
                                    <p>${project.notas}</p>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Acciones del cliente -->
                    <div class="client-project-actions">
                        <div class="actions-grid">
                            <button type="button" class="client-action-button primary" onclick="contactAboutProject('${project._id}')">
                                <div class="action-icon">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div class="action-content">
                                    <h5>Contactar Equipo</h5>
                                    <p>Envía un mensaje sobre este proyecto</p>
                                </div>
                            </button>
                            
                            <button type="button" class="client-action-button secondary" onclick="scheduleProjectMeeting('${project._id}')">
                                <div class="action-icon">
                                    <i class="far fa-calendar-plus"></i>
                                </div>
                                <div class="action-content">
                                    <h5>Agendar Reunión</h5>
                                    <p>Programa una cita de seguimiento</p>
                                </div>
                            </button>
                            
                            ${project.estado === 'finalizado' ? `
                            <button type="button" class="client-action-button success" onclick="downloadProjectFiles('${project._id}')">
                                <div class="action-icon">
                                    <i class="fas fa-download"></i>
                                </div>
                                <div class="action-content">
                                    <h5>Descargar Archivos</h5>
                                    <p>Obtén los archivos finales del proyecto</p>
                                </div>
                            </button>
                            ` : `
                            <button type="button" class="client-action-button info" onclick="requestProjectUpdate('${project._id}')">
                                <div class="action-icon">
                                    <i class="fas fa-sync-alt"></i>
                                </div>
                                <div class="action-content">
                                    <h5>Solicitar Actualización</h5>
                                    <p>Pide información sobre el progreso</p>
                                </div>
                            </button>
                            `}
                        </div>
                    </div>
                    
                    <div class="modal-footer-actions">
                        <button type="button" class="secondary-btn" id="close-client-project-details-btn">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('client-project-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Insertar el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos del modal
    setTimeout(() => {
        setupClientProjectDetailsModalEvents();
    }, 100);
}

/**
 * Configura eventos del modal de detalles del proyecto
 */
function setupClientProjectDetailsModalEvents() {
    const modal = document.getElementById('client-project-details-modal');
    const closeBtn = document.getElementById('close-client-project-details-modal');
    const closeDetailsBtn = document.getElementById('close-client-project-details-btn');
    
    function closeModal() {
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
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Prevenir cierre al hacer clic en el contenido del modal
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

/**
 * Contactar sobre un proyecto específico
 */
function contactAboutProject(projectId) {
    console.log('📧 Contactar sobre proyecto:', projectId);
    
    const project = clientProjectsData.find(p => p._id === projectId);
    if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return;
    }
    
    // Cerrar modal de detalles si está abierto
    const detailsModal = document.getElementById('client-project-details-modal');
    if (detailsModal) {
        detailsModal.classList.remove('active');
        setTimeout(() => {
            if (detailsModal && detailsModal.parentNode) {
                detailsModal.remove();
            }
            document.body.style.overflow = 'auto';
        }, 300);
    }
    
    // Cambiar a la sección de mensajes
    switchToClientSection('messages');
    
    // Después de un breve delay, abrir el modal de nuevo mensaje con el contexto del proyecto
    setTimeout(() => {
        openProjectMessageModal(project);
    }, 500);
}

/**
 * Abre modal para enviar mensaje sobre un proyecto específico
 */
function openProjectMessageModal(project) {
    const modalHTML = `
        <div class="modal active" id="project-message-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-envelope"></i> Contactar sobre Proyecto</h2>
                    <button class="close-btn" id="close-project-message-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="project-context">
                        <div class="context-header">
                            <i class="fas fa-project-diagram"></i>
                            <span>${project.nombre}</span>
                        </div>
                        <p class="context-description">Enviando mensaje sobre este proyecto</p>
                    </div>
                    
                    <form id="project-message-form">
                        <div class="form-group">
                            <label for="message-subject">Asunto</label>
                            <select id="message-subject" required>
                                <option value="">Seleccionar asunto</option>
                                <option value="consulta-progreso">Consulta sobre el progreso</option>
                                <option value="cambio-requisitos">Cambio en los requisitos</option>
                                <option value="problema-tecnico">Problema técnico</option>
                                <option value="entrega-revision">Entrega y revisión</option>
                                <option value="consulta-general">Consulta general</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="message-content">Mensaje *</label>
                            <textarea id="message-content" rows="6" required placeholder="Escribe tu mensaje aquí..."></textarea>
                            <small>Describe tu consulta o comentario sobre el proyecto de manera detallada</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="message-priority">Prioridad</label>
                            <select id="message-priority">
                                <option value="normal">Normal</option>
                                <option value="alta">Alta</option>
                                <option value="urgente">Urgente</option>
                            </select>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="secondary-btn" id="cancel-project-message-btn">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="primary-btn" id="send-project-message-btn">
                                <i class="fas fa-paper-plane"></i> Enviar Mensaje
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos
    setTimeout(() => {
        setupProjectMessageModalEvents(project);
    }, 100);
}

/**
 * Configura eventos del modal de mensaje de proyecto
 */
function setupProjectMessageModalEvents(project) {
    const modal = document.getElementById('project-message-modal');
    const closeBtn = document.getElementById('close-project-message-modal');
    const cancelBtn = document.getElementById('cancel-project-message-btn');
    const form = document.getElementById('project-message-form');
    
    function closeModal() {
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
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProjectMessageSend(project);
        });
    }
}

/**
 * Maneja el envío de mensaje sobre proyecto
 */
async function handleProjectMessageSend(project) {
    const form = document.getElementById('project-message-form');
    const submitBtn = document.getElementById('send-project-message-btn');
    
    if (!form || !submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        const subject = document.getElementById('message-subject').value;
        const content = document.getElementById('message-content').value.trim();
        const priority = document.getElementById('message-priority').value;
        
        if (!subject || !content) {
            throw new Error('Por favor, completa todos los campos obligatorios');
        }
        
        const subjectLabels = {
            'consulta-progreso': 'Consulta sobre el progreso',
            'cambio-requisitos': 'Cambio en los requisitos',
            'problema-tecnico': 'Problema técnico',
            'entrega-revision': 'Entrega y revisión',
            'consulta-general': 'Consulta general',
            'otro': 'Otro'
        };
        
        const messageText = `
PROYECTO: ${project.nombre}

ASUNTO: ${subjectLabels[subject] || subject}

MENSAJE:
${content}

---
Enviado desde el Dashboard del Cliente
Prioridad: ${priority.toUpperCase()}
        `.trim();
        
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                mensaje: messageText
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al enviar mensaje');
        }
        
        showToast('Mensaje enviado correctamente. Nuestro equipo se comunicará contigo pronto.', 'success');
        
        // Cerrar modal
        const modal = document.getElementById('project-message-modal');
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
        console.error('Error al enviar mensaje:', error);
        showToast(error.message || 'Error al enviar mensaje', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Programar reunión para el proyecto
 */
function scheduleProjectMeeting(projectId) {
    console.log('📅 Programar reunión para proyecto:', projectId);
    
    const project = clientProjectsData.find(p => p._id === projectId);
    if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return;
    }
    
    // Cerrar modal de detalles
    const detailsModal = document.getElementById('client-project-details-modal');
    if (detailsModal) {
        detailsModal.classList.remove('active');
        setTimeout(() => {
            if (detailsModal && detailsModal.parentNode) {
                detailsModal.remove();
            }
            document.body.style.overflow = 'auto';
        }, 300);
    }
    
    // Cambiar a la sección de citas
    switchToClientSection('appointments');
    
    setTimeout(() => {
        showToast('Funcionalidad de agendar citas próximamente. Por ahora puedes contactarnos por mensaje.', 'info');
    }, 500);
}

/**
 * Solicitar actualización del proyecto
 */
function requestProjectUpdate(projectId) {
    console.log('🔄 Solicitar actualización del proyecto:', projectId);
    
    const project = clientProjectsData.find(p => p._id === projectId);
    if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return;
    }
    
    contactAboutProject(projectId);
}

/**
 * Descargar archivos del proyecto
 */
function downloadProjectFiles(projectId) {
    console.log('💾 Descargar archivos del proyecto:', projectId);
    
    const project = clientProjectsData.find(p => p._id === projectId);
    if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return;
    }
    
    showToast('Funcionalidad de descarga próximamente. Contacta a nuestro equipo para obtener los archivos.', 'info');
}

/**
 * Abre modal para solicitar nuevo proyecto
 */
function openRequestProjectModal() {
    console.log('📋 Abriendo modal de solicitud de proyecto...');
    
    const modalHTML = `
        <div class="modal active" id="request-project-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2><i class="fas fa-plus"></i> Solicitar Nuevo Proyecto</h2>
                    <button class="close-btn" id="close-request-project-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="request-project-intro">
                        <p>¡Estamos emocionados de trabajar en tu próximo proyecto! Completa la siguiente información para que nuestro equipo pueda brindarte la mejor propuesta.</p>
                    </div>
                    
                    <form id="request-project-form">
                        <div class="form-group">
                            <label for="request-project-name">Nombre del Proyecto *</label>
                            <input type="text" id="request-project-name" required placeholder="Ej: Mi nueva tienda online">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="request-project-category">Tipo de Proyecto *</label>
                                <select id="request-project-category" required>
                                    <option value="">Seleccionar tipo</option>
                                    <option value="web-development">Desarrollo Web</option>
                                    <option value="ecommerce">Tienda Online</option>
                                    <option value="marketing-digital">Marketing Digital</option>
                                    <option value="social-media">Redes Sociales</option>
                                    <option value="seo">SEO</option>
                                    <option value="branding">Branding</option>
                                    <option value="design">Diseño Gráfico</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="request-project-budget">Presupuesto Estimado</label>
                                <select id="request-project-budget">
                                    <option value="">Seleccionar rango</option>
                                    <option value="500-1000">$500 - $1,000</option>
                                    <option value="1000-2500">$1,000 - $2,500</option>
                                    <option value="2500-5000">$2,500 - $5,000</option>
                                    <option value="5000-10000">$5,000 - $10,000</option>
                                    <option value="10000+">Más de $10,000</option>
                                    <option value="consultar">Necesito consultar</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="request-project-description">Descripción del Proyecto *</label>
                            <textarea id="request-project-description" rows="5" required placeholder="Describe tu proyecto con el mayor detalle posible: objetivos, funcionalidades, diseño, etc."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="request-project-timeline">Fecha Deseada de Entrega</label>
                                <input type="date" id="request-project-timeline" min="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label for="request-project-priority">Prioridad</label>
                                <select id="request-project-priority">
                                    <option value="normal">Normal</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente (costo adicional)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="request-project-references">Referencias o Inspiración</label>
                            <textarea id="request-project-references" rows="3" placeholder="Comparte enlaces de sitios web, diseños o ejemplos que te gusten..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="request-project-additional">Información Adicional</label>
                            <textarea id="request-project-additional" rows="3" placeholder="¿Hay algo más que debemos saber sobre tu proyecto?"></textarea>
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <label class="checkbox-container">
                                <input type="checkbox" id="request-consultation" checked>
                                <span class="checkmark"></span>
                                Deseo una consulta gratuita antes de iniciar
                            </label>
                        </div>
                        
                        <div class="form-info">
                            <div class="info-box">
                                <i class="fas fa-info-circle"></i>
                                <div>
                                    <h5>¿Qué sigue después de enviar la solicitud?</h5>
                                    <ul>
                                        <li>Revisaremos tu solicitud en 24 horas</li>
                                        <li>Te contactaremos para aclarar detalles</li>
                                        <li>Prepararemos una cotización personalizada</li>
                                        <li>Si lo solicitas, programaremos una consulta gratuita</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="secondary-btn" id="cancel-request-project-btn">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="primary-btn" id="send-request-project-btn">
                                <i class="fas fa-paper-plane"></i> Enviar Solicitud
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos
    setTimeout(() => {
        setupRequestProjectModalEvents();
    }, 100);
}

/**
 * Configura eventos del modal de solicitud de proyecto
 */
function setupRequestProjectModalEvents() {
    const modal = document.getElementById('request-project-modal');
    const closeBtn = document.getElementById('close-request-project-modal');
    const cancelBtn = document.getElementById('cancel-request-project-btn');
    const form = document.getElementById('request-project-form');
    
    function closeModal() {
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
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProjectRequestSend();
        });
    }
}

/**
 * Maneja el envío de solicitud de proyecto
 */
async function handleProjectRequestSend() {
    const form = document.getElementById('request-project-form');
    const submitBtn = document.getElementById('send-request-project-btn');
    
    if (!form || !submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        const formData = {
            name: document.getElementById('request-project-name').value.trim(),
            category: document.getElementById('request-project-category').value,
            budget: document.getElementById('request-project-budget').value,
            description: document.getElementById('request-project-description').value.trim(),
            timeline: document.getElementById('request-project-timeline').value,
            priority: document.getElementById('request-project-priority').value,
            references: document.getElementById('request-project-references').value.trim(),
            additional: document.getElementById('request-project-additional').value.trim(),
            consultation: document.getElementById('request-consultation').checked
        };
        
        if (!formData.name || !formData.category || !formData.description) {
            throw new Error('Por favor, completa todos los campos obligatorios');
        }
        
        const categoryLabels = {
            'web-development': 'Desarrollo Web',
            'ecommerce': 'Tienda Online',
            'marketing-digital': 'Marketing Digital',
            'social-media': 'Redes Sociales',
            'seo': 'SEO',
            'branding': 'Branding',
            'design': 'Diseño Gráfico'
        };
        
        const user = window.currentUser;
        const requestMessage = `
NUEVA SOLICITUD DE PROYECTO

CLIENTE: ${user.nombre} ${user.apellidos}
EMPRESA: ${user.empresa || 'No especificada'}
EMAIL: ${user.correo}
TELÉFONO: ${user.telefono || 'No especificado'}

DETALLES DEL PROYECTO:
• Nombre: ${formData.name}
• Tipo: ${categoryLabels[formData.category] || formData.category}
• Presupuesto: ${formData.budget || 'No especificado'}
• Prioridad: ${formData.priority.toUpperCase()}
${formData.timeline ? `• Fecha deseada: ${new Date(formData.timeline).toLocaleDateString('es-ES')}` : ''}

DESCRIPCIÓN:
${formData.description}

${formData.references ? `REFERENCIAS:
${formData.references}` : ''}

${formData.additional ? `INFORMACIÓN ADICIONAL:
${formData.additional}` : ''}

${formData.consultation ? '✅ Cliente solicita consulta gratuita' : '❌ Cliente no requiere consulta previa'}

---
Solicitud enviada desde Dashboard del Cliente
Fecha: ${new Date().toLocaleString('es-ES')}
        `.trim();
        
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                mensaje: requestMessage
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al enviar solicitud');
        }
        
        showToast('¡Solicitud enviada correctamente! Nos pondremos en contacto contigo pronto.', 'success');
        
        // Cerrar modal
        const modal = document.getElementById('request-project-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
        
        // Recargar proyectos después de un momento
        setTimeout(() => {
            loadClientProjectsData();
        }, 2000);
        
    } catch (error) {
        console.error('Error al enviar solicitud de proyecto:', error);
        showToast(error.message || 'Error al enviar solicitud', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Configura los filtros de proyectos del cliente
 */
function setupClientProjectsFilters() {
    console.log('🔧 Configurando filtros de proyectos del cliente...');
    
    const filterStatus = document.getElementById('client-project-filter-status');
    const filterCategory = document.getElementById('client-project-filter-category');
    
    if (filterStatus) {
        filterStatus.addEventListener('change', applyClientProjectsFilters);
    }
    
    if (filterCategory) {
        filterCategory.addEventListener('change', applyClientProjectsFilters);
    }
}

/**
 * Aplica los filtros a los datos de proyectos del cliente
 */
function applyClientProjectsFilters() {
    const filterStatus = document.getElementById('client-project-filter-status')?.value || 'all';
    const filterCategory = document.getElementById('client-project-filter-category')?.value || 'all';
    const searchTerm = document.getElementById('client-project-search')?.value?.toLowerCase() || '';
    
    filteredClientProjectsData = clientProjectsData.filter(project => {
        // Filtro por estado
        let statusMatch = filterStatus === 'all' || project.estado === filterStatus;
        
        // Filtro por categoría
        let categoryMatch = filterCategory === 'all' || project.categoria === filterCategory;
        
        // Filtro por búsqueda
        let searchMatch = true;
        if (searchTerm) {
            searchMatch = (
                project.nombre?.toLowerCase().includes(searchTerm) ||
                project.descripcion?.toLowerCase().includes(searchTerm) ||
                project.categoria?.toLowerCase().includes(searchTerm) ||
                project.notas?.toLowerCase().includes(searchTerm)
            );
        }
        
        return statusMatch && categoryMatch && searchMatch;
    });
    
    renderClientProjectsCards();
    updateClientProjectsStatistics();
}

/**
 * Búsqueda de proyectos del cliente
 */
function searchClientProjects() {
    applyClientProjectsFilters();
}

/**
 * Configura paginación de proyectos del cliente
 */
function setupClientProjectsPagination() {
    console.log('📄 Paginación de proyectos del cliente configurada');
}

/**
 * Actualiza controles de paginación del cliente
 */
function updateClientProjectsPagination(paginationData) {
    console.log('📄 Actualizando paginación de proyectos del cliente:', paginationData);
    
    if (!paginationData) return;
    
    const paginationContainer = document.getElementById('client-projects-pagination');
    if (!paginationContainer) return;
    
    const { page, pages, total } = paginationData;
    
    if (pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-controls">';
    
    // Botón anterior
    if (page > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="loadClientProjectsPage(${page - 1})">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>`;
    }
    
    // Números de página
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="loadClientProjectsPage(${i})">
            ${i}
        </button>`;
    }
    
    // Botón siguiente
    if (page < pages) {
        paginationHTML += `<button class="pagination-btn" onclick="loadClientProjectsPage(${page + 1})">
            Siguiente <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    paginationHTML += '</div>';
    paginationHTML += `<div class="pagination-info">Página ${page} de ${pages} (${total} proyectos)</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * Carga una página específica de proyectos del cliente
 */
async function loadClientProjectsPage(page) {
    currentClientProjectsPage = page;
    await loadClientProjectsData();
}

/**
 * Actualiza estadísticas de proyectos del cliente
 */
function updateClientProjectsStatistics() {
    const totalProyectos = clientProjectsData.length;
    const proyectosEnCurso = clientProjectsData.filter(project => 
        ['iniciado', 'desarrollo inicial', 'desarrollo medio'].includes(project.estado)
    ).length;
    
    const proyectosFinalizados = clientProjectsData.filter(project => 
        project.estado === 'finalizado'
    ).length;
    
    // Actualizar contador en la estadística principal del dashboard
    if (window.loadClientDynamicStatistics) {
        window.loadClientDynamicStatistics();
    }
    
    console.log('📊 Estadísticas de proyectos del cliente actualizadas:', {
        total: totalProyectos,
        enCurso: proyectosEnCurso,
        finalizados: proyectosFinalizados
    });
}

// Exponer funciones globalmente para uso desde botones y otros módulos
window.viewClientProjectDetails = viewClientProjectDetails;
window.contactAboutProject = contactAboutProject;
window.scheduleProjectMeeting = scheduleProjectMeeting;
window.requestProjectUpdate = requestProjectUpdate;
window.downloadProjectFiles = downloadProjectFiles;
window.openRequestProjectModal = openRequestProjectModal;
window.loadClientProjectsPage = loadClientProjectsPage;
window.initClientProjectsModule = initClientProjectsModule;
window.loadClientProjectsData = loadClientProjectsData;

// Hacer disponible para showClientProjectDetails desde dashboard.js
window.showClientProjectDetails = viewClientProjectDetails;

console.log('✅ Módulo de proyectos del cliente cargado correctamente');