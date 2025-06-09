/**
 * MÓDULO DE MENSAJES PARA CLIENTES - DASHBOARD
 * Sistema de comunicación simplificado para clientes - VERSIÓN OPTIMIZADA
 */

let clientMessagesData = [];
let clientConversationId = null;
let clientMessagePollingInterval = null;
let clientUnreadCount = 0;

// Variables para controlar las cargas múltiples
let isLoadingMessages = false;
let isModuleInitialized = false;
let lastLoadTime = 0;
const LOAD_COOLDOWN = 2000; // 2 segundos de cooldown entre cargas

/**
 * Inicializa el módulo de mensajes para clientes - OPTIMIZADO
 */
function initClientMessagesModule() {
    console.log('🔄 Inicializando módulo de mensajes para cliente...');
    
    // Evitar inicialización múltiple
    if (isModuleInitialized) {
        console.log('⚠️ Módulo ya inicializado, saltando...');
        return;
    }
    
    // Marcar como inicializado
    isModuleInitialized = true;
    
    // Configurar eventos (solo una vez)
    setupClientMessagesEvents();
    
    // Cargar conversación del cliente (con cooldown)
    loadClientConversationSafe();
    
    // Configurar auto-actualización
    setupClientMessagePolling();
    
    console.log('✅ Módulo de mensajes para cliente inicializado');
}

/**
 * Carga segura de conversación con cooldown
 */
async function loadClientConversationSafe() {
    const now = Date.now();
    
    // Verificar cooldown
    if (now - lastLoadTime < LOAD_COOLDOWN) {
        console.log('⏳ Cooldown activo, saltando carga de mensajes...');
        return;
    }
    
    // Verificar si ya se está cargando
    if (isLoadingMessages) {
        console.log('⏳ Ya se están cargando mensajes, saltando...');
        return;
    }
    
    lastLoadTime = now;
    await loadClientConversation();
}

/**
 * Carga la conversación del cliente actual - OPTIMIZADA
 */
async function loadClientConversation() {
    console.log('📨 Cargando conversación del cliente...');
    
    // Verificar si ya se está cargando
    if (isLoadingMessages) {
        console.log('⏳ Carga ya en progreso, saltando...');
        return;
    }
    
    // Marcar como cargando
    isLoadingMessages = true;
    
    const messagesContainer = document.querySelector('#messages .messages-container');
    if (!messagesContainer) {
        console.warn('Contenedor de mensajes no encontrado');
        isLoadingMessages = false;
        return;
    }
    
    // Solo mostrar loading si el contenedor está vacío o tiene error
    const hasContent = messagesContainer.querySelector('.client-messages-wrapper');
    if (!hasContent) {
        messagesContainer.innerHTML = `
            <div class="loading-messages">
                <div class="loading-spinner"></div>
                <p>Cargando mensajes...</p>
            </div>
        `;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const currentUser = getCurrentUser();
        
        if (!token || !currentUser) {
            throw new Error('Usuario no autenticado');
        }
        
        const API_BASE = getApiBase();
        
        // Cargar conversaciones del cliente
        const response = await fetch(`${API_BASE}/api/messages/conversations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                // No hay conversaciones aún
                showNoClientConversation();
                return;
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Conversaciones del cliente cargadas:', data);
        
        const conversations = data.data || [];
        
        if (conversations.length === 0) {
            showNoClientConversation();
            return;
        }
        
        // Para clientes, normalmente hay una sola conversación
        const conversation = conversations[0];
        clientConversationId = conversation._id;
        
        // Cargar mensajes de la conversación
        await loadClientMessages(clientConversationId);
        
    } catch (error) {
        console.error('❌ Error al cargar conversación del cliente:', error);
        showClientConversationError(error.message);
    } finally {
        // Marcar como no cargando
        isLoadingMessages = false;
    }
}

/**
 * Carga los mensajes de la conversación del cliente - OPTIMIZADA
 */
async function loadClientMessages(conversationId) {
    console.log('📨 Cargando mensajes del cliente:', conversationId);
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = getApiBase();
        
        const response = await fetch(`${API_BASE}/api/messages/messages/${conversationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Mensajes del cliente cargados:', data);
        
        clientMessagesData = data.data || [];
        
        // Contar mensajes no leídos (de administradores)
        clientUnreadCount = clientMessagesData.filter(msg => 
            msg.esDeAdmin && !msg.leido
        ).length;
        
        // Renderizar la conversación
        renderClientConversation(clientMessagesData);
        
        // Actualizar contador en el dashboard
        updateClientMessagesCounter();
        
    } catch (error) {
        console.error('❌ Error al cargar mensajes del cliente:', error);
        showClientConversationError(error.message);
    }
}

/**
 * Configura los eventos del módulo de mensajes para clientes - OPTIMIZADO
 */
function setupClientMessagesEvents() {
    // Evitar configurar eventos múltiples veces
    if (window.clientMessagesEventsConfigured) {
        console.log('⚠️ Eventos ya configurados, saltando...');
        return;
    }
    
    console.log('🔧 Configurando eventos de mensajes para cliente...');
    
    // Marcar como configurado
    window.clientMessagesEventsConfigured = true;
    
    // Usar delegación de eventos para evitar múltiples listeners
    document.addEventListener('click', function(e) {
        // Botón de nuevo mensaje
        if (e.target.matches('#client-new-message-btn') || 
            e.target.matches('#start-client-conversation-btn') ||
            e.target.matches('#send-message')) {
            e.preventDefault();
            openClientMessageModal();
        }
        
        // Botón de refrescar mensajes
        if (e.target.matches('#client-refresh-messages-btn')) {
            e.preventDefault();
            refreshClientMessages();
        }
        
        // Botón de enviar mensaje
        if (e.target.matches('#client-send-message-btn')) {
            e.preventDefault();
            sendClientMessage();
        }
        
        // Botón de limpiar mensaje
        if (e.target.matches('#client-clear-message-btn')) {
            e.preventDefault();
            clearClientMessageForm();
        }
    });
    
    console.log('✅ Eventos de mensajes configurados');
}

/**
 * Configura el polling automático para actualizar mensajes - OPTIMIZADO
 */
function setupClientMessagePolling() {
    // Limpiar intervalo existente
    if (clientMessagePollingInterval) {
        clearInterval(clientMessagePollingInterval);
        clientMessagePollingInterval = null;
    }
    
    // Configurar nuevo intervalo (cada 45 segundos para reducir carga)
    clientMessagePollingInterval = setInterval(() => {
        if (clientConversationId && !isLoadingMessages) {
            console.log('🔄 Actualizando mensajes automáticamente...');
            // Usar la versión segura con cooldown
            loadClientConversationSafe();
        }
    }, 45000); // Aumentado a 45 segundos
    
    console.log('🔄 Polling de mensajes para cliente configurado (45s)');
}

/**
 * Actualiza manualmente los mensajes del cliente - OPTIMIZADO
 */
async function refreshClientMessages() {
    const refreshBtn = document.getElementById('client-refresh-messages-btn');
    
    // Evitar múltiples refrescos simultáneos
    if (refreshBtn && refreshBtn.disabled) {
        console.log('⏳ Refresco ya en progreso...');
        return;
    }
    
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
        // Resetear cooldown para permitir refresco manual
        lastLoadTime = 0;
        isLoadingMessages = false;
        
        await loadClientConversation();
        showToast('Mensajes actualizados', 'success');
    } catch (error) {
        console.error('Error al actualizar mensajes:', error);
        showToast('Error al actualizar mensajes', 'error');
    } finally {
        if (refreshBtn) {
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }, 2000); // Aumentado el tiempo de espera
        }
    }
}

/**
 * Limpia el módulo de mensajes del cliente - MEJORADO
 */
function cleanupClientMessagesModule() {
    console.log('🧹 Limpiando módulo de mensajes del cliente...');
    
    // Limpiar interval de polling
    if (clientMessagePollingInterval) {
        clearInterval(clientMessagePollingInterval);
        clientMessagePollingInterval = null;
    }
    
    // Resetear variables globales
    clientMessagesData = [];
    clientConversationId = null;
    clientUnreadCount = 0;
    isLoadingMessages = false;
    isModuleInitialized = false;
    lastLoadTime = 0;
    
    // Resetear configuración de eventos
    window.clientMessagesEventsConfigured = false;
    
    console.log('✅ Módulo de mensajes limpiado');
}

/**
 * Marca todos los mensajes como leídos cuando se abre la sección - OPTIMIZADO
 */
async function markClientMessagesAsRead() {
    if (!clientConversationId || isLoadingMessages) {
        console.log('⏳ No se pueden marcar mensajes como leídos ahora');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = getApiBase();
        
        const response = await fetch(`${API_BASE}/api/messages/mark-read/${clientConversationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Actualizar contador local
            clientUnreadCount = 0;
            updateClientMessagesCounter();
            
            // Recargar mensajes para actualizar estado visual (con cooldown)
            setTimeout(() => {
                if (clientConversationId && !isLoadingMessages) {
                    loadClientConversationSafe();
                }
            }, 1000);
        }
        
    } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
    }
}

/**
 * INTEGRACIÓN CON EL DASHBOARD PRINCIPAL - OPTIMIZADA
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando integración de mensajes en dashboard...');
    
    let sectionObserver = null;
    let isObserverConfigured = false;
    
    // Configurar observer para la sección de mensajes (solo una vez)
    function setupSectionObserver() {
        if (isObserverConfigured) {
            console.log('⚠️ Observer ya configurado');
            return;
        }
        
        const messagesSection = document.getElementById('messages');
        if (!messagesSection) {
            console.warn('⚠️ Sección de mensajes no encontrada');
            return;
        }
        
        isObserverConfigured = true;
        
        // Observer para detectar cuando se activa la sección
        sectionObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (messagesSection.classList.contains('active')) {
                        console.log('📨 Sección de mensajes activada');
                        
                        // Inicializar módulo de mensajes después de un breve delay
                        setTimeout(() => {
                            initClientMessagesModule();
                            
                            // Marcar mensajes como leídos después de 3 segundos
                            setTimeout(() => {
                                markClientMessagesAsRead();
                            }, 3000);
                        }, 300);
                    } else {
                        // Limpiar cuando se sale de la sección
                        console.log('📨 Saliendo de sección de mensajes');
                        cleanupClientMessagesModule();
                    }
                }
            });
        });
        
        sectionObserver.observe(messagesSection, { attributes: true });
        
        // Si la sección ya está activa al cargar
        if (messagesSection.classList.contains('active')) {
            setTimeout(() => {
                initClientMessagesModule();
            }, 500);
        }
        
        console.log('✅ Observer de sección configurado');
    }
    
    // Configurar observer después de un breve delay para asegurar que el DOM esté listo
    setTimeout(setupSectionObserver, 100);
    
    // Limpiar al salir de la página
    window.addEventListener('beforeunload', function() {
        if (sectionObserver) {
            sectionObserver.disconnect();
        }
        cleanupClientMessagesModule();
    });
    
    console.log('✅ Integración de mensajes configurada');
});

/**
 * Renderiza la conversación completa del cliente
 */
function renderClientConversation(messages) {
    const messagesContainer = document.querySelector('#messages .messages-container');
    if (!messagesContainer) return;
    
    if (messages.length === 0) {
        showNoClientConversation();
        return;
    }
    
    // Header de la conversación
    const conversationHeader = `
        <div class="client-conversation-header">
            <div class="conversation-title">
                <h3><i class="fas fa-comments"></i> Conversación con Crazy Studios</h3>
                <p class="conversation-subtitle">${messages.length} mensaje${messages.length !== 1 ? 's' : ''}</p>
            </div>
            <div class="conversation-actions">
                <button class="secondary-btn" id="client-refresh-messages-btn" title="Actualizar mensajes">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    // Renderizar mensajes
    const messagesHTML = messages.map(message => {
        const senderInfo = message.remitenteInfo || {};
        const isAdmin = message.esDeAdmin;
        const messageClass = isAdmin ? 'admin-message' : 'client-message';
        const senderName = isAdmin 
            ? `${senderInfo.nombre || 'Administrador'} ${senderInfo.apellidos || ''}` 
            : 'Tú';
        
        const messageTime = formatMessageTime(new Date(message.fechaCreacion));
        const isUnread = isAdmin && !message.leido;
        
        return `
            <div class="client-message-bubble ${messageClass} ${isUnread ? 'unread' : ''}">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-avatar ${isAdmin ? 'admin-avatar' : 'client-avatar'}">
                            ${isAdmin ? '🎯' : '👤'}
                        </div>
                        <div class="sender-info">
                            <span class="sender-name">${senderName}</span>
                            ${isAdmin ? '<span class="sender-role">Crazy Studios</span>' : ''}
                        </div>
                    </div>
                    <div class="message-time">${messageTime}</div>
                </div>
                
                <div class="message-content">
                    <div class="message-text">${escapeHtml(message.mensaje)}</div>
                    ${message.adjuntos && message.adjuntos.length > 0 ? `
                        <div class="message-attachments">
                            ${message.adjuntos.map(attachment => `
                                <a href="${attachment.url}" download="${attachment.name}" class="attachment-link">
                                    <i class="fas fa-paperclip"></i> ${attachment.name}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                ${isUnread ? '<div class="unread-indicator"><i class="fas fa-circle"></i> Nuevo</div>' : ''}
            </div>
        `;
    }).join('');
    
    // Formulario de respuesta
    const replyForm = `
        <div class="client-reply-container">
            <div class="reply-header">
                <h4><i class="fas fa-reply"></i> Enviar mensaje</h4>
            </div>
            
            <div class="reply-form">
                <div class="message-input-container">
                    <textarea 
                        id="client-message-textarea" 
                        placeholder="Escribe tu mensaje aquí...&#10;&#10;Tip: Usa Ctrl+Enter para enviar rápidamente"
                        rows="4"
                    ></textarea>
                </div>
                
                <div class="reply-actions">
                    <button type="button" class="secondary-btn" id="client-clear-message-btn">
                        <i class="fas fa-times"></i> Limpiar
                    </button>
                    <button type="button" class="primary-btn" id="client-send-message-btn">
                        <i class="fas fa-paper-plane"></i> Enviar Mensaje
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Renderizar todo el contenido
    messagesContainer.innerHTML = `
        <div class="client-messages-wrapper">
            ${conversationHeader}
            
            <div class="client-messages-body" id="client-messages-body">
                ${messagesHTML}
            </div>
            
            ${replyForm}
        </div>
    `;
    
    // Scroll al último mensaje
    setTimeout(() => {
        scrollToLastMessage();
    }, 100);
}

/**
 * Muestra mensaje cuando no hay conversación
 */
function showNoClientConversation() {
    const messagesContainer = document.querySelector('#messages .messages-container');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = `
        <div class="no-conversation">
            <div class="no-conversation-icon">
                <i class="fas fa-comments"></i>
            </div>
            <h3>¡Inicia una conversación!</h3>
            <p>Aquí podrás comunicarte directamente con nuestro equipo de Crazy Studios.</p>
            <p class="help-text">
                <i class="fas fa-lightbulb"></i> 
                Puedes preguntarnos sobre tus proyectos, solicitar actualizaciones, o cualquier duda que tengas.
            </p>
            
            <div class="conversation-suggestions">
                <h4>Puedes preguntar sobre:</h4>
                <ul>
                    <li><i class="fas fa-project-diagram"></i> Estado de tus proyectos</li>
                    <li><i class="fas fa-calendar-alt"></i> Programar citas</li>
                    <li><i class="fas fa-question-circle"></i> Dudas sobre servicios</li>
                    <li><i class="fas fa-handshake"></i> Soporte técnico</li>
                </ul>
            </div>
            
            <button class="primary-btn large-btn" id="start-client-conversation-btn">
                <i class="fas fa-plus"></i> Iniciar Primera Conversación
            </button>
        </div>
    `;
}

/**
 * Muestra error en la conversación del cliente
 */
function showClientConversationError(errorMessage) {
    const messagesContainer = document.querySelector('#messages .messages-container');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = `
        <div class="client-error-state">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error al cargar mensajes</h3>
            <p class="error-message">${errorMessage}</p>
            <div class="error-actions">
                <button class="primary-btn" onclick="loadClientConversation()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
                <button class="secondary-btn" onclick="openClientMessageModal()">
                    <i class="fas fa-envelope"></i> Nuevo Mensaje
                </button>
            </div>
        </div>
    `;
}

/**
 * Envía un mensaje del cliente
 */
async function sendClientMessage() {
    const textarea = document.getElementById('client-message-textarea');
    const sendButton = document.getElementById('client-send-message-btn');
    const attachmentInput = document.getElementById('client-message-attachment');
    
    if (!textarea || !sendButton) {
        if (typeof showToast === 'function') {
            showToast('Error: Elementos del formulario no encontrados', 'error');
        }
        return;
    }
    
    const mensaje = textarea.value.trim();
    
    if (!mensaje) {
        if (typeof showToast === 'function') {
            showToast('Por favor escribe un mensaje', 'warning');
        }
        textarea.focus();
        return;
    }
    
    // Cambiar estado del botón
    const originalButtonText = sendButton.innerHTML;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    
    try {
        const token = localStorage.getItem('authToken');
        const currentUser = getCurrentUser();
        const API_BASE = getApiBase();
        
        if (!token || !currentUser) {
            throw new Error('Usuario no autenticado');
        }
        
        // Preparar datos del mensaje
        const messageData = {
            clienteId: currentUser._id,
            mensaje: mensaje,
            adjuntos: [] // TODO: Implementar adjuntos si es necesario
        };
        
        console.log('📤 Enviando mensaje del cliente:', messageData);
        
        const response = await fetch(`${API_BASE}/api/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(messageData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al enviar mensaje');
        }
        
        const data = await response.json();
        console.log('✅ Mensaje del cliente enviado:', data);
        
        // Limpiar formulario
        textarea.value = '';
        textarea.style.height = 'auto';
        if (attachmentInput) {
            attachmentInput.value = '';
        }
        
        // Recargar mensajes
        lastLoadTime = 0; // Resetear cooldown para permitir carga inmediata
        isLoadingMessages = false;
        await loadClientConversation();
        
        if (typeof showToast === 'function') {
            showToast('Mensaje enviado correctamente', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje del cliente:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al enviar mensaje', 'error');
        }
    } finally {
        // Restaurar botón
        sendButton.disabled = false;
        sendButton.innerHTML = originalButtonText;
    }
}

/**
 * Limpia el formulario de mensaje del cliente
 */
function clearClientMessageForm() {
    const textarea = document.getElementById('client-message-textarea');
    const attachmentInput = document.getElementById('client-message-attachment');
    
    if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
    }
    
    if (attachmentInput) {
        attachmentInput.value = '';
    }
    
    if (typeof showToast === 'function') {
        showToast('Formulario limpiado', 'info');
    }
}

/**
 * Actualiza el contador de mensajes no leídos en el sidebar
 */
function updateClientMessagesCounter() {
    const messagesCountElement = document.getElementById('client-messages-count');
    
    if (messagesCountElement) {
        messagesCountElement.textContent = clientUnreadCount;
        
        // Actualizar clase visual del sidebar
        const messagesMenuItem = document.querySelector('[data-section="messages"]');
        if (messagesMenuItem) {
            const existingBadge = messagesMenuItem.querySelector('.unread-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            
            if (clientUnreadCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'unread-badge';
                badge.textContent = clientUnreadCount;
                badge.style.cssText = `
                    background: var(--primary-color);
                    color: white;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 10px;
                    font-weight: 600;
                    margin-left: 8px;
                `;
                messagesMenuItem.appendChild(badge);
            }
        }
    }
    
    // Actualizar tarjeta de estadísticas en el dashboard
    if (typeof updateMessagesCardState === 'function') {
        updateMessagesCardState(clientUnreadCount);
    }
}

/**
 * Abre modal para nuevo mensaje del cliente
 */
function openClientMessageModal() {
    console.log('📝 Abriendo modal de nuevo mensaje para cliente...');
    
    const modalHTML = `
        <div class="modal active" id="client-new-message-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2><i class="fas fa-envelope"></i> Nuevo Mensaje a Crazy Studios</h2>
                    <button class="close-btn" id="close-client-message-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="client-message-form">
                        <div class="form-group">
                            <label for="client-modal-subject">
                                <i class="fas fa-tag"></i> Asunto
                            </label>
                            <input 
                                type="text" 
                                id="client-modal-subject" 
                                placeholder="¿Sobre qué quieres escribir?" 
                                required
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="client-modal-message">
                                <i class="fas fa-edit"></i> Mensaje
                            </label>
                            <textarea 
                                id="client-modal-message" 
                                rows="8" 
                                placeholder="Escribe tu mensaje aquí...&#10;&#10;Nuestro equipo te responderá lo antes posible."
                                required
                            ></textarea>
                        </div>
                        
                        <div class="message-templates">
                            <label><i class="fas fa-lightbulb"></i> Plantillas rápidas:</label>
                            <div class="template-buttons">
                                <button type="button" class="template-btn" data-template="status">
                                    Estado del Proyecto
                                </button>
                                <button type="button" class="template-btn" data-template="meeting">
                                    Solicitar Reunión
                                </button>
                                <button type="button" class="template-btn" data-template="support">
                                    Soporte Técnico
                                </button>
                                <button type="button" class="template-btn" data-template="question">
                                    Pregunta General
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="secondary-btn" id="cancel-client-modal-btn">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="button" class="primary-btn" id="send-client-modal-message-btn">
                            <i class="fas fa-paper-plane"></i> Enviar Mensaje
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si existe
    const existingModal = document.getElementById('client-new-message-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Insertar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos del modal
    setTimeout(() => {
        setupClientMessageModal();
    }, 100);
}

/**
 * Configura eventos del modal de mensaje del cliente
 */
function setupClientMessageModal() {
    const modal = document.getElementById('client-new-message-modal');
    const closeBtn = document.getElementById('close-client-message-modal');
    const cancelBtn = document.getElementById('cancel-client-modal-btn');
    const sendBtn = document.getElementById('send-client-modal-message-btn');
    const templateButtons = document.querySelectorAll('.template-btn');
    
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
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Envío del mensaje
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            handleSendClientModalMessage(closeModal);
        });
    }
    
    // Plantillas rápidas
    templateButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const template = this.getAttribute('data-template');
            applyClientMessageTemplate(template);
        });
    });
    
    // Auto-resize del textarea
    const textarea = document.getElementById('client-modal-message');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
}

/**
 * Maneja el envío del mensaje desde el modal
 */
async function handleSendClientModalMessage(closeModal) {
    const subjectInput = document.getElementById('client-modal-subject');
    const messageInput = document.getElementById('client-modal-message');
    const sendBtn = document.getElementById('send-client-modal-message-btn');
    
    if (!subjectInput || !messageInput || !sendBtn) {
        if (typeof showToast === 'function') {
            showToast('Error: Elementos del formulario no encontrados', 'error');
        }
        return;
    }
    
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!subject || !message) {
        if (typeof showToast === 'function') {
            showToast('Por favor completa el asunto y el mensaje', 'warning');
        }
        return;
    }
    
    const originalButtonText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    
    try {
        const token = localStorage.getItem('authToken');
        const currentUser = getCurrentUser();
        const API_BASE = getApiBase();
        
        if (!token || !currentUser) {
            throw new Error('Usuario no autenticado');
        }
        
        // Combinar asunto y mensaje
        const fullMessage = `${subject}\n\n${message}`;
        
        const messageData = {
            clienteId: currentUser._id,
            mensaje: fullMessage,
            adjuntos: []
        };
        
        console.log('📤 Enviando mensaje desde modal:', messageData);
        
        const response = await fetch(`${API_BASE}/api/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(messageData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al enviar mensaje');
        }
        
        if (typeof showToast === 'function') {
            showToast('Mensaje enviado correctamente', 'success');
        }
        
        // Recargar conversación
        lastLoadTime = 0;
        isLoadingMessages = false;
        await loadClientConversation();
        
        // Cambiar a la sección de mensajes si no está activa
        if (typeof switchToClientSection === 'function') {
            switchToClientSection('messages');
        }
        
        closeModal();
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje desde modal:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al enviar mensaje', 'error');
        }
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalButtonText;
    }
}

/**
 * Aplica una plantilla de mensaje rápido
 */
function applyClientMessageTemplate(template) {
    const subjectInput = document.getElementById('client-modal-subject');
    const messageInput = document.getElementById('client-modal-message');
    
    if (!subjectInput || !messageInput) return;
    
    const templates = {
        status: {
            subject: 'Consulta sobre el estado de mi proyecto',
            message: 'Hola,\n\nMe gustaría conocer el estado actual de mi proyecto. ¿Podrían proporcionarme una actualización?\n\nGracias por su atención.'
        },
        meeting: {
            subject: 'Solicitud de reunión',
            message: 'Hola,\n\nMe gustaría programar una reunión para discutir mi proyecto. ¿Cuáles son sus horarios disponibles?\n\nGracias.'
        },
        support: {
            subject: 'Solicitud de soporte técnico',
            message: 'Hola,\n\nEstoy experimentando un problema con [describir el problema]. ¿Podrían ayudarme a resolverlo?\n\nGracias por su ayuda.'
        },
        question: {
            subject: 'Pregunta general',
            message: 'Hola,\n\nTengo una consulta sobre [tema de la consulta]. ¿Podrían ayudarme con información al respecto?\n\nGracias.'
        }
    };
    
    const selectedTemplate = templates[template];
    if (selectedTemplate) {
        subjectInput.value = selectedTemplate.subject;
        messageInput.value = selectedTemplate.message;
        
        // Auto-resize textarea
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
        
        if (typeof showToast === 'function') {
            showToast('Plantilla aplicada. Puedes editarla antes de enviar.', 'info');
        }
    }
}

/**
 * FUNCIONES PÚBLICAS PARA INTEGRACIÓN CON EL DASHBOARD
 */
window.initClientMessagesModule = initClientMessagesModule;
window.openClientMessageModal = openClientMessageModal;
window.updateClientMessagesCounter = updateClientMessagesCounter;
window.cleanupClientMessagesModule = cleanupClientMessagesModule;
window.markClientMessagesAsRead = markClientMessagesAsRead;
window.refreshClientMessages = refreshClientMessages;
window.loadClientConversation = loadClientConversation;
window.sendClientMessage = sendClientMessage;
window.clearClientMessageForm = clearClientMessageForm;

// Funciones de utilidad que permanecen igual
function scrollToLastMessage() {
    const messagesBody = document.getElementById('client-messages-body');
    if (messagesBody) {
        messagesBody.scrollTop = messagesBody.scrollHeight;
    }
}

function formatMessageTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getApiBase() {
    return window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
}

function getCurrentUser() {
    return window.currentUser || JSON.parse(localStorage.getItem('userData') || '{}');
}

console.log('✅ Módulo de mensajes para cliente cargado completamente - VERSIÓN OPTIMIZADA');