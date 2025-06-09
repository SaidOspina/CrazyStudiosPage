/**
 * MÓDULO DE MENSAJES - SISTEMA COMPLETO DE COMUNICACIÓN CORREGIDO
 * Permite comunicación entre clientes y administradores con notificaciones por email
 */

let currentMessagesPage = 1;
let messagesPerPage = 20;
let messagesData = [];
let filteredMessagesData = [];
let currentConversation = null;
let currentConversationId = null;
let messagePollingInterval = null;

/**
 * Inicializa el módulo de mensajes
 */
function initMessagesModule() {
    console.log('🔄 Inicializando módulo de mensajes...');
    
    // Configurar eventos principales
    setupMessagesEvents();
    
    // Cargar conversaciones
    loadConversations();
    
    // Configurar auto-actualización de mensajes
    setupMessagePolling();
    
    // Configurar interface según rol de usuario
    setupMessagesInterface();
    
    console.log('✅ Módulo de mensajes inicializado');
}

/**
 * Configura la interfaz según el rol del usuario
 */
function setupMessagesInterface() {
    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (currentUser.rol === 'admin' || currentUser.rol === 'superadmin') {
        // Interfaz para administradores - ver todas las conversaciones
        setupAdminMessagesInterface();
    } else {
        // Interfaz para clientes - solo su conversación
        setupClientMessagesInterface();
    }
}

/**
 * Configura interfaz para administradores
 */
function setupAdminMessagesInterface() {
    console.log('📋 Configurando interfaz de administrador');
    
    // Mostrar sidebar de conversaciones
    const messagesSidebar = document.querySelector('.messages-sidebar');
    if (messagesSidebar) {
        messagesSidebar.style.display = 'block';
    }
    
    // Configurar pestañas de mensajes
    setupMessageTabs();
    
    // ✅ CORREGIDO: Cambiar función inexistente por la correcta
    // La función loadConversations() ya carga y renderiza las conversaciones
    console.log('📋 Interfaz de administrador configurada - las conversaciones se cargarán automáticamente');
}

/**
 * Configura interfaz para clientes
 */
function setupClientMessagesInterface() {
    console.log('👤 Configurando interfaz de cliente');
    
    // Ocultar sidebar para clientes
    const messagesSidebar = document.querySelector('.messages-sidebar');
    if (messagesSidebar) {
        messagesSidebar.style.display = 'none';
    }
    
    // Mostrar directamente la conversación del cliente
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
        messagesContainer.classList.add('client-view');
    }
    
    // Cargar mensajes del cliente actual
    loadClientConversation();
}

/**
 * Configura todos los eventos del módulo de mensajes
 */
function setupMessagesEvents() {
    // Botón de nuevo mensaje
    const newMessageBtn = document.getElementById('new-message-btn');
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', openNewMessageModal);
    }
    
    // Búsqueda de mensajes
    const messagesSearch = document.querySelector('.messages-search button');
    const messagesSearchInput = document.querySelector('.messages-search input');
    
    if (messagesSearch) {
        messagesSearch.addEventListener('click', searchMessages);
    }
    
    if (messagesSearchInput) {
        messagesSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMessages();
            }
        });
        
        // Búsqueda en tiempo real
        messagesSearchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                searchMessages();
            }, 500);
        });
    }
    
    // Configurar formulario de respuesta
    setupReplyForm();
    
    // Configurar tabs de mensajes
    setupMessageTabs();
    
    // Configurar acciones de mensajes
    setupMessageActions();
}

/**
 * Configura las pestañas de mensajes
 */
function setupMessageTabs() {
    const messageTabs = document.querySelectorAll('.message-tab');
    
    messageTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover clase activa de todas las pestañas
            messageTabs.forEach(t => t.classList.remove('active'));
            
            // Agregar clase activa a la pestaña clickeada
            this.classList.add('active');
            
            // Filtrar mensajes según la pestaña
            const tabType = this.getAttribute('data-tab');
            filterMessagesByTab(tabType);
        });
    });
}

/**
 * Configura el formulario de respuesta
 */
function setupReplyForm() {
    const replyForm = document.querySelector('.reply-container textarea');
    const replyBtn = document.querySelector('.reply-actions .primary-btn');
    const discardBtn = document.querySelector('.reply-actions .secondary-btn');
    
    if (replyBtn) {
        replyBtn.addEventListener('click', sendReply);
    }
    
    if (discardBtn) {
        discardBtn.addEventListener('click', clearReply);
    }
    
    // Auto-resize del textarea
    if (replyForm) {
        replyForm.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
}

/**
 * Configura acciones de mensajes individuales
 */
function setupMessageActions() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.action-btn[title="Responder"]')) {
            const messageElement = e.target.closest('.message-item');
            if (messageElement) {
                const messageId = messageElement.getAttribute('data-message-id');
                if (messageId) {
                    selectMessage(messageId);
                }
            }
        }
        
        if (e.target.closest('.action-btn[title="Marcar como leído"]')) {
            const messageElement = e.target.closest('.message-item');
            if (messageElement) {
                const messageId = messageElement.getAttribute('data-message-id');
                if (messageId) {
                    markMessageAsRead(messageId);
                }
            }
        }
        
        if (e.target.closest('.action-btn[title="Archivar"]')) {
            const messageElement = e.target.closest('.message-item');
            if (messageElement) {
                const messageId = messageElement.getAttribute('data-message-id');
                if (messageId) {
                    archiveMessage(messageId);
                }
            }
        }
        
        if (e.target.closest('.action-btn[title="Eliminar"]')) {
            const messageElement = e.target.closest('.message-item');
            if (messageElement) {
                const messageId = messageElement.getAttribute('data-message-id');
                if (messageId) {
                    deleteMessage(messageId);
                }
            }
        }
    });
}

/**
 * ✅ CORREGIDO: Carga las conversaciones y maneja errores correctamente
 */
async function loadConversations() {
    console.log('📨 Cargando conversaciones...');
    
    // Mostrar indicador de carga
    const messagesList = document.getElementById('messages-list');
    if (messagesList) {
        messagesList.innerHTML = `
            <div class="loading-messages">
                <div class="loading-spinner"></div>
                Cargando conversaciones...
            </div>
        `;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const currentUser = window.currentUser || JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        console.log('🔗 Haciendo petición a:', `${API_BASE}/api/messages/conversations`);
        
        const response = await fetch(`${API_BASE}/api/messages/conversations?archived=false`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            // ✅ CORREGIDO: Mejor manejo de errores HTTP
            if (response.status === 404) {
                // La ruta no existe, mostrar mensaje específico
                throw new Error('Endpoint de mensajes no encontrado. Verifica que el servidor esté configurado correctamente.');
            } else if (response.status === 401) {
                throw new Error('No autorizado. Token de autenticación inválido.');
            } else if (response.status === 500) {
                throw new Error('Error interno del servidor');
            } else {
                const errorText = await response.text();
                console.error('Error del servidor:', errorText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        }
        
        // ✅ CORREGIDO: Verificar si la respuesta es JSON válido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('❌ Respuesta no es JSON:', textResponse);
            throw new Error('El servidor no devolvió una respuesta JSON válida');
        }
        
        const data = await response.json();
        console.log('✅ Conversaciones recibidas:', data);
        
        messagesData = data.data || [];
        
        if (currentUser.rol === 'admin' || currentUser.rol === 'superadmin') {
            renderConversationsList(messagesData);
        } else {
            // Para clientes, cargar directamente su conversación
            if (messagesData.length > 0) {
                selectConversation(messagesData[0]._id);
            } else {
                showNoConversationsMessage();
            }
        }
        
    } catch (error) {
        console.error('❌ Error al cargar conversaciones:', error);
        
        // ✅ CORREGIDO: Mostrar mensaje de error más específico
        if (messagesList) {
            messagesList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
                    <h3>Error al cargar conversaciones</h3>
                    <p style="color: #999; margin-bottom: 20px;">${error.message}</p>
                    <button class="retry-btn primary-btn" onclick="loadConversations()">
                        <i class="fas fa-redo"></i> Intentar de nuevo
                    </button>
                    <button class="secondary-btn" onclick="showSampleConversationsData()" style="margin-left: 10px;">
                        <i class="fas fa-eye"></i> Ver datos de ejemplo
                    </button>
                </div>
            `;
        }
        
        // Mostrar toast con error
        if (typeof showToast === 'function') {
            showToast(`Error al cargar conversaciones: ${error.message}`, 'error');
        }
    }
}

/**
 * ✅ NUEVO: Muestra mensaje cuando no hay conversaciones
 */
function showNoConversationsMessage() {
    const messageContent = document.querySelector('.message-content');
    if (messageContent) {
        messageContent.innerHTML = `
            <div class="no-conversation">
                <i class="fas fa-comments" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                <h3>No hay conversaciones</h3>
                <p>Aún no tienes mensajes. Las conversaciones aparecerán aquí cuando recibas o envíes mensajes.</p>
                <button class="primary-btn" onclick="openNewMessageModal()">
                    <i class="fas fa-plus"></i> Iniciar Nueva Conversación
                </button>
            </div>
        `;
    }
}

/**
 * Renderiza la lista de conversaciones en el sidebar
 */
function renderConversationsList(conversations) {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;
    
    if (conversations.length === 0) {
        messagesList.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-envelope-open" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                <p>No hay conversaciones</p>
                <button class="primary-btn" onclick="openNewMessageModal()" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Nueva conversación
                </button>
            </div>
        `;
        return;
    }
    
    const conversationsHTML = conversations.map(conv => {
        const clientInfo = conv.clienteInfo || {};
        const lastMessage = conv.ultimoMensaje || {};
        const timeAgo = lastMessage.fechaCreacion ? formatTimeAgo(new Date(lastMessage.fechaCreacion)) : '';
        const unreadBadge = conv.mensajesNoLeidos > 0 ? `<span class="unread-badge">${conv.mensajesNoLeidos}</span>` : '';
        const unreadClass = conv.mensajesNoLeidos > 0 ? 'unread' : '';
        
        return `
            <div class="message-item ${unreadClass}" data-conversation-id="${conv._id}" onclick="selectConversation('${conv._id}')">
                <div class="message-sender">
                    <div class="sender-avatar-placeholder">
                        ${(clientInfo.nombre || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div class="sender-info">
                        <h4>${clientInfo.nombre || 'Cliente'} ${clientInfo.apellidos || ''}</h4>
                        <p class="message-time">${timeAgo}</p>
                    </div>
                    ${unreadBadge}
                </div>
                <p class="message-subject">${lastMessage.mensaje ? 'Conversación activa' : 'Nueva conversación'}</p>
                <p class="message-preview">${lastMessage.mensaje ? truncateText(lastMessage.mensaje, 60) : 'Sin mensajes aún'}</p>
            </div>
        `;
    }).join('');
    
    messagesList.innerHTML = conversationsHTML;
}

/**
 * Selecciona una conversación para mostrar
 */
async function selectConversation(conversationId) {
    console.log('🔄 Seleccionando conversación:', conversationId);
    
    currentConversationId = conversationId;
    
    // Marcar como activa en la lista
    const messageItems = document.querySelectorAll('.message-item');
    messageItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-conversation-id') === conversationId) {
            item.classList.add('active');
        }
    });
    
    // Cargar mensajes de la conversación
    await loadConversationMessages(conversationId);
}

/**
 * Carga los mensajes de una conversación específica
 */
async function loadConversationMessages(conversationId) {
    console.log('📨 Cargando mensajes de conversación:', conversationId);
    
    const messageContent = document.querySelector('.message-content');
    if (messageContent) {
        messageContent.innerHTML = `
            <div class="loading-conversation">
                <div class="loading-spinner"></div>
                <p>Cargando mensajes...</p>
            </div>
        `;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
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
        console.log('✅ Mensajes cargados:', data);
        
        const messages = data.data || [];
        renderConversationMessages(messages, conversationId);
        
        // Obtener información del cliente para el header
        if (messages.length > 0) {
            const clientMessage = messages.find(msg => !msg.esDeAdmin);
            if (clientMessage && clientMessage.remitenteInfo) {
                updateMessageHeader(clientMessage.remitenteInfo);
            }
        }
        
    } catch (error) {
        console.error('❌ Error al cargar mensajes:', error);
        
        if (messageContent) {
            messageContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
                    <h3>Error al cargar mensajes</h3>
                    <p style="color: #999; margin-bottom: 20px;">${error.message}</p>
                    <button class="retry-btn primary-btn" onclick="loadConversationMessages('${conversationId}')">
                        <i class="fas fa-redo"></i> Intentar de nuevo
                    </button>
                </div>
            `;
        }
        
        if (typeof showToast === 'function') {
            showToast('Error al cargar mensajes', 'error');
        }
    }
}

/**
 * Renderiza los mensajes de una conversación
 */
function renderConversationMessages(messages, conversationId) {
    const messageContent = document.querySelector('.message-content');
    if (!messageContent) return;
    
    if (messages.length === 0) {
        messageContent.innerHTML = `
            <div class="no-conversation">
                <i class="fas fa-comments" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                <p>No hay mensajes en esta conversación</p>
                <button class="primary-btn" onclick="startNewMessage('${conversationId}')">
                    <i class="fas fa-paper-plane"></i> Enviar primer mensaje
                </button>
            </div>
        `;
        return;
    }
    
    const latestMessage = messages[messages.length - 1];
    const clientInfo = messages.find(msg => !msg.esDeAdmin)?.remitenteInfo || {};
    
    // Renderizar header del mensaje
    const messageHeader = `
        <div class="message-header">
            <div class="message-details">
                <h3 class="message-content-subject">Conversación con ${clientInfo.nombre || 'Cliente'} ${clientInfo.apellidos || ''}</h3>
                <div class="message-meta">
                    <p class="message-content-from">Cliente: ${clientInfo.nombre || 'Sin nombre'} ${clientInfo.apellidos || ''}</p>
                    <p class="message-content-time">${formatDateTime(new Date(latestMessage.fechaCreacion))}</p>
                </div>
            </div>
            <div class="message-actions">
                <button class="action-btn" title="Marcar como leído" onclick="markConversationAsRead('${conversationId}')">
                    <i class="fas fa-envelope-open"></i>
                </button>
                <button class="action-btn" title="Archivar conversación" onclick="archiveConversation('${conversationId}')">
                    <i class="fas fa-archive"></i>
                </button>
            </div>
        </div>
    `;
    
    // Renderizar cuerpo de mensajes
    const messagesHTML = messages.map(message => {
        const senderInfo = message.remitenteInfo || {};
        const isAdmin = message.esDeAdmin;
        const messageClass = isAdmin ? 'admin-message' : 'client-message';
        const senderName = isAdmin 
            ? `${senderInfo.nombre || 'Admin'} ${senderInfo.apellidos || ''}` 
            : `${senderInfo.nombre || 'Cliente'} ${senderInfo.apellidos || ''}`;
        
        return `
            <div class="message-bubble ${messageClass}">
                <div class="message-sender-name">${senderName}</div>
                <div class="message-text">${message.mensaje}</div>
                <div class="message-time">${formatDateTime(new Date(message.fechaCreacion))}</div>
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
        `;
    }).join('');
    
    const messageBody = `
        <div class="message-body conversation-view">
            ${messagesHTML}
        </div>
    `;
    
    const replyContainer = `
        <div class="reply-container">
            <div class="reply-header">
                <h4>Responder</h4>
            </div>
            <div class="reply-body">
                <textarea placeholder="Escribe tu respuesta aquí..." id="reply-textarea"></textarea>
                <div class="reply-actions">
                    <button class="secondary-btn" onclick="clearReply()">Descartar</button>
                    <button class="primary-btn" onclick="sendReply('${conversationId}')">
                        <i class="fas fa-paper-plane"></i> Enviar Respuesta
                    </button>
                </div>
            </div>
        </div>
    `;
    
    messageContent.innerHTML = messageHeader + messageBody + replyContainer;
    
    // Scroll al último mensaje
    setTimeout(() => {
        const messageBody = document.querySelector('.message-body');
        if (messageBody) {
            messageBody.scrollTop = messageBody.scrollHeight;
        }
    }, 100);
}

/**
 * Actualiza el header del mensaje con información del cliente
 */
function updateMessageHeader(clientInfo) {
    const messageSubject = document.querySelector('.message-content-subject');
    const messageFrom = document.querySelector('.message-content-from');
    
    if (messageSubject) {
        messageSubject.textContent = `Conversación con ${clientInfo.nombre} ${clientInfo.apellidos}`;
    }
    
    if (messageFrom) {
        messageFrom.textContent = `De: ${clientInfo.nombre} ${clientInfo.apellidos} <${clientInfo.correo || 'N/A'}>`;
    }
}

/**
 * Envía una respuesta a una conversación
 */
async function sendReply(conversationId) {
    console.log('📤 Enviando respuesta a conversación:', conversationId);
    
    const textarea = document.getElementById('reply-textarea');
    const attachmentInput = document.getElementById('message-attachment');
    
    if (!textarea) {
        if (typeof showToast === 'function') {
            showToast('Error: No se encontró el campo de mensaje', 'error');
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
    
    // Cambiar estado del botón de envío
    const sendButton = document.querySelector('.reply-actions .primary-btn');
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const currentUser = window.currentUser || JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Preparar datos del mensaje
        const messageData = {
            clienteId: conversationId,
            mensaje: mensaje,
            adjuntos: [] // TODO: Implementar adjuntos
        };
        
        console.log('📤 Enviando mensaje:', messageData);
        
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
        console.log('✅ Mensaje enviado:', data);
        
        // Limpiar formulario
        textarea.value = '';
        if (attachmentInput) {
            attachmentInput.value = '';
        }
        
        // Recargar mensajes de la conversación
        await loadConversationMessages(conversationId);
        
        // Recargar lista de conversaciones
        await loadConversations();
        
        if (typeof showToast === 'function') {
            showToast('Mensaje enviado correctamente', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al enviar mensaje', 'error');
        }
    } finally {
        // Restaurar botón
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Respuesta';
        }
    }
}

/**
 * Limpia el formulario de respuesta
 */
function clearReply() {
    const textarea = document.getElementById('reply-textarea');
    const attachmentInput = document.getElementById('message-attachment');
    
    if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
    }
    
    if (attachmentInput) {
        attachmentInput.value = '';
    }
}

/**
 * Abre modal para nuevo mensaje
 */
function openNewMessageModal() {
    console.log('📝 Abriendo modal de nuevo mensaje...');
    
    const modalHTML = `
        <div class="modal active" id="new-message-modal">
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2>Nuevo Mensaje</h2>
                    <button class="close-btn" id="close-new-message-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="new-message-form">
                        <div class="form-group">
                            <label for="message-to">Para:</label>
                            <select id="message-to" required>
                                <option value="">Seleccionar destinatario</option>
                                <!-- Las opciones se cargarán dinámicamente -->
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="message-subject">Asunto:</label>
                            <input type="text" id="message-subject" placeholder="Asunto del mensaje" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="message-content">Mensaje:</label>
                            <textarea id="message-content" rows="8" placeholder="Escribe tu mensaje aquí..." required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="message-attachment">Adjuntos (opcional):</label>
                            <input type="file" id="message-attachment" multiple>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="secondary-btn" id="save-draft-btn">Guardar Borrador</button>
                            <button type="submit" class="primary-btn" id="send-new-message-btn">
                                <i class="fas fa-paper-plane"></i> Enviar Mensaje
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Verificar si ya existe un modal y eliminarlo
    const existingModal = document.getElementById('new-message-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Insertar el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Configurar eventos del modal
    setTimeout(() => {
        setupNewMessageModalEvents();
    }, 100);
    
    // Cargar lista de clientes
    loadClientsForNewMessage();
}

/**
 * Configura eventos del modal de nuevo mensaje
 */
function setupNewMessageModalEvents() {
    const modal = document.getElementById('new-message-modal');
    const closeBtn = document.getElementById('close-new-message-modal');
    const form = document.getElementById('new-message-form');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    
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
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Envío del formulario
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSendNewMessage(e, closeModal);
        });
    }
    
    // Guardar borrador
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function() {
            saveDraft();
        });
    }
}

/**
 * Carga la lista de clientes para el modal de nuevo mensaje
 */
async function loadClientsForNewMessage() {
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
        const clients = allUsers.filter(user => user.rol === 'cliente');
        
        const messageToSelect = document.getElementById('message-to');
        if (messageToSelect) {
            // Limpiar opciones existentes (excepto la primera)
            messageToSelect.innerHTML = '<option value="">Seleccionar destinatario</option>';
            
            // Agregar opciones grupales
            messageToSelect.innerHTML += `
                <option value="all-clients">📢 Todos los clientes</option>
                <option value="clients-with-projects">📋 Clientes con proyectos activos</option>
                <option value="clients-without-projects">📋 Clientes sin proyectos</option>
                <optgroup label="Clientes individuales">
            `;
            
            // Agregar clientes individuales
            clients.forEach(client => {
                messageToSelect.innerHTML += `
                    <option value="${client._id}">
                        👤 ${client.nombre} ${client.apellidos} - ${client.empresa || 'Sin empresa'}
                    </option>
                `;
            });
            
            messageToSelect.innerHTML += '</optgroup>';
        }
        
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        if (typeof showToast === 'function') {
            showToast('Error al cargar lista de clientes', 'error');
        }
    }
}

/**
 * Maneja el envío de un nuevo mensaje
 */
async function handleSendNewMessage(e, closeModal) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#send-new-message-btn');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Cambiar estado del botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        // Recopilar datos del formulario
        const formData = {
            to: document.getElementById('message-to').value,
            subject: document.getElementById('message-subject').value.trim(),
            content: document.getElementById('message-content').value.trim()
        };
        
        // Validaciones
        if (!formData.to || !formData.subject || !formData.content) {
            throw new Error('Todos los campos son obligatorios');
        }
        
        console.log('📤 Enviando nuevo mensaje:', formData);
        
        // Determinar si es un mensaje individual o grupal
        if (formData.to.startsWith('all-') || formData.to.startsWith('clients-')) {
            // Mensaje grupal
            await sendGroupMessage(formData);
        } else {
            // Mensaje individual
            await sendIndividualMessage(formData);
        }
        
        if (typeof showToast === 'function') {
            showToast('Mensaje enviado correctamente', 'success');
        }
        
        // Recargar conversaciones
        await loadConversations();
        
        // Cerrar modal
        closeModal();
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al enviar mensaje', 'error');
        }
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Envía un mensaje individual
 */
async function sendIndividualMessage(messageData) {
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
            clienteId: messageData.to,
            mensaje: `${messageData.subject}\n\n${messageData.content}`,
            adjuntos: [] // TODO: Implementar adjuntos
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar mensaje');
    }
    
    return await response.json();
}

/**
 * Envía un mensaje grupal
 */
async function sendGroupMessage(messageData) {
    // TODO: Implementar envío de mensajes grupales
    console.log('📢 Enviando mensaje grupal:', messageData);
    if (typeof showToast === 'function') {
        showToast('Funcionalidad de mensajes grupales próximamente', 'info');
    }
}

/**
 * Guarda un borrador del mensaje
 */
function saveDraft() {
    const formData = {
        to: document.getElementById('message-to').value,
        subject: document.getElementById('message-subject').value.trim(),
        content: document.getElementById('message-content').value.trim(),
        timestamp: new Date().toISOString()
    };
    
    // Guardar en localStorage
    const drafts = JSON.parse(localStorage.getItem('messageDrafts') || '[]');
    drafts.push(formData);
    
    // Mantener solo los últimos 10 borradores
    if (drafts.length > 10) {
        drafts.splice(0, drafts.length - 10);
    }
    
    localStorage.setItem('messageDrafts', JSON.stringify(drafts));
    if (typeof showToast === 'function') {
        showToast('Borrador guardado', 'success');
    }
}

/**
 * Carga la conversación del cliente actual (para vista de cliente)
 */
async function loadClientConversation() {
    console.log('👤 Cargando conversación del cliente...');
    
    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (currentUser.rol !== 'cliente') {
        console.warn('Esta función es solo para clientes');
        return;
    }
    
    await loadConversationMessages(currentUser._id);
}

/**
 * Configurar polling para actualización automática de mensajes
 */
function setupMessagePolling() {
    // Limpiar intervalo existente
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    // Configurar nuevo intervalo (cada 30 segundos)
    messagePollingInterval = setInterval(() => {
        if (currentConversationId) {
            loadConversationMessages(currentConversationId);
        }
        loadConversations(); // Actualizar lista de conversaciones
    }, 30000);
    
    console.log('🔄 Polling de mensajes configurado (30s)');
}

/**
 * Marca una conversación como leída
 */
async function markConversationAsRead(conversationId) {
    console.log('✅ Marcando conversación como leída:', conversationId);
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/messages/mark-read/${conversationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al marcar como leído');
        }
        
        // Recargar conversaciones para actualizar contadores
        await loadConversations();
        
        if (typeof showToast === 'function') {
            showToast('Mensajes marcados como leídos', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error al marcar como leído:', error);
        if (typeof showToast === 'function') {
            showToast('Error al marcar mensajes como leídos', 'error');
        }
    }
}

/**
 * Archiva una conversación
 */
async function archiveConversation(conversationId) {
    console.log('📦 Archivando conversación:', conversationId);
    
    if (!confirm('¿Estás seguro de que deseas archivar esta conversación?\n\nLa conversación se moverá a la sección de archivados pero podrás restaurarla más tarde.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        // Mostrar indicador de carga
        const archiveBtn = document.querySelector(`[onclick="archiveConversation('${conversationId}')"]`);
        if (archiveBtn) {
            archiveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            archiveBtn.disabled = true;
        }
        
        console.log('📤 Enviando petición de archivo...');
        
        const response = await fetch(`${API_BASE}/api/messages/archive/${conversationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta del servidor:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al archivar conversación');
        }
        
        const data = await response.json();
        console.log('✅ Conversación archivada:', data);
        
        if (typeof showToast === 'function') {
            showToast(`Conversación archivada correctamente. ${data.data.mensajesArchivados} mensajes archivados.`, 'success');
        }
        
        // Recargar conversaciones para actualizar la lista
        await loadConversations();
        
        // Limpiar vista de mensaje actual
        const messageContent = document.querySelector('.message-content');
        if (messageContent) {
            messageContent.innerHTML = `
                <div class="no-conversation">
                    <i class="fas fa-archive" style="font-size: 48px; color: #28a745; margin-bottom: 16px;"></i>
                    <h3>Conversación Archivada</h3>
                    <p>La conversación ha sido archivada correctamente.</p>
                    <p style="color: #999; font-size: 14px;">Puedes encontrarla en la sección "Archivados"</p>
                    <div style="margin-top: 20px;">
                        <button class="primary-btn" onclick="loadArchivedConversations()">
                            <i class="fas fa-archive"></i> Ver Archivados
                        </button>
                        <button class="secondary-btn" onclick="loadConversations()" style="margin-left: 10px;">
                            <i class="fas fa-inbox"></i> Volver a Entrada
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Actualizar contador de mensajes archivados si existe
        updateArchivedCounter();
        
    } catch (error) {
        console.error('❌ Error al archivar conversación:', error);
        if (typeof showToast === 'function') {
            showToast(`Error al archivar conversación: ${error.message}`, 'error');
        }
    } finally {
        // Restaurar botón
        const archiveBtn = document.querySelector(`[onclick="archiveConversation('${conversationId}')"]`);
        if (archiveBtn) {
            archiveBtn.innerHTML = '<i class="fas fa-archive"></i>';
            archiveBtn.disabled = false;
        }
    }
}

/**
 * Restaura una conversación archivada - NUEVA FUNCIÓN
 */
async function restoreConversation(conversationId) {
    console.log('📤 Restaurando conversación:', conversationId);
    
    if (!confirm('¿Deseas restaurar esta conversación?\n\nLa conversación volverá a aparecer en tu bandeja de entrada.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/messages/restore/${conversationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al restaurar conversación');
        }
        
        const data = await response.json();
        console.log('✅ Conversación restaurada:', data);
        
        if (typeof showToast === 'function') {
            showToast(`Conversación restaurada correctamente. ${data.data.mensajesRestaurados} mensajes restaurados.`, 'success');
        }
        
        // Recargar conversaciones archivadas
        await loadArchivedConversations();
        
    } catch (error) {
        console.error('❌ Error al restaurar conversación:', error);
        if (typeof showToast === 'function') {
            showToast(`Error al restaurar conversación: ${error.message}`, 'error');
        }
    }
}

/**
 * Carga conversaciones archivadas - NUEVA FUNCIÓN
 */
async function loadArchivedConversations() {
    console.log('📦 Cargando conversaciones archivadas...');
    
    const messagesList = document.getElementById('messages-list');
    if (messagesList) {
        messagesList.innerHTML = `
            <div class="loading-messages">
                <div class="loading-spinner"></div>
                Cargando conversaciones archivadas...
            </div>
        `;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/messages/archived`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar conversaciones archivadas');
        }
        
        const data = await response.json();
        console.log('✅ Conversaciones archivadas cargadas:', data);
        
        const archivedConversations = data.data || [];
        renderArchivedConversationsList(archivedConversations);
        
    } catch (error) {
        console.error('❌ Error al cargar conversaciones archivadas:', error);
        
        if (messagesList) {
            messagesList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
                    <h3>Error al cargar archivados</h3>
                    <p style="color: #999; margin-bottom: 20px;">${error.message}</p>
                    <button class="retry-btn primary-btn" onclick="loadArchivedConversations()">
                        <i class="fas fa-redo"></i> Intentar de nuevo
                    </button>
                    <button class="secondary-btn" onclick="loadConversations()" style="margin-left: 10px;">
                        <i class="fas fa-inbox"></i> Volver a Entrada
                    </button>
                </div>
            `;
        }
        
        if (typeof showToast === 'function') {
            showToast('Error al cargar conversaciones archivadas', 'error');
        }
    }
}

/**
 * Renderiza la lista de conversaciones archivadas - NUEVA FUNCIÓN
 */
function renderArchivedConversationsList(conversations) {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;
    
    if (conversations.length === 0) {
        messagesList.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-archive" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                <h3>No hay conversaciones archivadas</h3>
                <p>Las conversaciones archivadas aparecerán aquí.</p>
                <button class="secondary-btn" onclick="loadConversations()" style="margin-top: 15px;">
                    <i class="fas fa-inbox"></i> Volver a Entrada
                </button>
            </div>
        `;
        return;
    }
    
    const conversationsHTML = conversations.map(conv => {
        const clientInfo = conv.clienteInfo || {};
        const archivedBy = conv.archivadoPorInfo || {};
        const archivedDate = conv.fechaArchivado ? formatTimeAgo(new Date(conv.fechaArchivado)) : '';
        
        return `
            <div class="message-item archived" data-conversation-id="${conv._id}">
                <div class="message-sender">
                    <div class="sender-avatar-placeholder">
                        ${(clientInfo.nombre || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div class="sender-info">
                        <h4>${clientInfo.nombre || 'Cliente'} ${clientInfo.apellidos || ''}</h4>
                        <p class="message-time">Archivado ${archivedDate}</p>
                    </div>
                    <span class="archived-badge">ARCHIVADO</span>
                </div>
                <p class="message-subject">${conv.totalMensajes} mensajes archivados</p>
                <p class="message-preview">Archivado por: ${archivedBy.nombre || 'Admin'} ${archivedBy.apellidos || ''}</p>
                <div class="archived-actions">
                    <button class="action-btn restore-btn" onclick="restoreConversation('${conv._id}')" title="Restaurar conversación">
                        <i class="fas fa-undo"></i
                    </button>
                    <button class="action-btn view-btn" onclick="viewArchivedConversation('${conv._id}')" title="Ver mensajes">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    messagesList.innerHTML = `
        <div class="archived-header">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #333; background-color: #1a1a1a;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-archive" style="color: #28a745;"></i>
                    <span style="font-weight: 600; color: white;">Conversaciones Archivadas (${conversations.length})</span>
                </div>
                <button class="secondary-btn" onclick="loadConversations()" style="padding: 6px 12px; font-size: 12px;">
                    <i class="fas fa-inbox"></i> Volver a Entrada
                </button>
            </div>
        </div>
        ${conversationsHTML}
    `;
}

/**
 * Ve una conversación archivada (solo lectura) - NUEVA FUNCIÓN
 */
async function viewArchivedConversation(conversationId) {
    console.log('👁️ Viendo conversación archivada:', conversationId);
    
    // Marcar como activa en la lista
    const messageItems = document.querySelectorAll('.message-item');
    messageItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-conversation-id') === conversationId) {
            item.classList.add('active');
        }
    });
    
    // Cargar mensajes (solo lectura)
    await loadArchivedConversationMessages(conversationId);
}

/**
 * Carga mensajes de una conversación archivada - NUEVA FUNCIÓN
 */
async function loadArchivedConversationMessages(conversationId) {
    console.log('📨 Cargando mensajes archivados:', conversationId);
    
    const messageContent = document.querySelector('.message-content');
    if (messageContent) {
        messageContent.innerHTML = `
            <div class="loading-conversation">
                <div class="loading-spinner"></div>
                <p>Cargando mensajes archivados...</p>
            </div>
        `;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
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
        const messages = data.data || [];
        
        // Renderizar mensajes en modo solo lectura
        renderArchivedConversationMessages(messages, conversationId);
        
    } catch (error) {
        console.error('❌ Error al cargar mensajes archivados:', error);
        
        if (messageContent) {
            messageContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
                    <h3>Error al cargar mensajes</h3>
                    <p style="color: #999; margin-bottom: 20px;">${error.message}</p>
                    <button class="retry-btn primary-btn" onclick="loadArchivedConversationMessages('${conversationId}')">
                        <i class="fas fa-redo"></i> Intentar de nuevo
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Renderiza mensajes archivados (solo lectura) - NUEVA FUNCIÓN
 */
function renderArchivedConversationMessages(messages, conversationId) {
    const messageContent = document.querySelector('.message-content');
    if (!messageContent) return;
    
    const clientInfo = messages.find(msg => !msg.esDeAdmin)?.remitenteInfo || {};
    const latestMessage = messages[messages.length - 1];
    
    // Header para conversación archivada
    const messageHeader = `
        <div class="message-header archived-header">
            <div class="message-details">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <i class="fas fa-archive" style="color: #28a745;"></i>
                    <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">ARCHIVADO</span>
                </div>
                <h3 class="message-content-subject">Conversación con ${clientInfo.nombre || 'Cliente'} ${clientInfo.apellidos || ''}</h3>
                <div class="message-meta">
                    <p class="message-content-from">Cliente: ${clientInfo.nombre || 'Sin nombre'} ${clientInfo.apellidos || ''}</p>
                    <p class="message-content-time">${formatDateTime(new Date(latestMessage.fechaCreacion))}</p>
                </div>
            </div>
            <div class="message-actions">
                <button class="action-btn restore-btn" onclick="restoreConversation('${conversationId}')" title="Restaurar conversación">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="action-btn" onclick="loadArchivedConversations()" title="Volver a archivados">
                    <i class="fas fa-arrow-left"></i> Volver
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
            ? `${senderInfo.nombre || 'Admin'} ${senderInfo.apellidos || ''}` 
            : `${senderInfo.nombre || 'Cliente'} ${senderInfo.apellidos || ''}`;
        
        return `
            <div class="message-bubble ${messageClass} archived-message">
                <div class="message-sender-name">${senderName}</div>
                <div class="message-text">${message.mensaje}</div>
                <div class="message-time">${formatDateTime(new Date(message.fechaCreacion))}</div>
            </div>
        `;
    }).join('');
    
    const messageBody = `
        <div class="message-body conversation-view archived-conversation">
            ${messagesHTML}
        </div>
    `;
    
    // Aviso de solo lectura en lugar del formulario de respuesta
    const readOnlyNotice = `
        <div class="archived-notice">
            <div style="text-align: center; padding: 20px; background-color: #1a1a1a; border-top: 1px solid #333;">
                <i class="fas fa-archive" style="font-size: 24px; color: #28a745; margin-bottom: 10px;"></i>
                <h4 style="color: white; margin: 0 0 8px 0;">Conversación Archivada</h4>
                <p style="color: #999; margin: 0 0 15px 0; font-size: 14px;">
                    Esta conversación está archivada y es de solo lectura.
                </p>
                <button class="primary-btn" onclick="restoreConversation('${conversationId}')">
                    <i class="fas fa-undo"></i> Restaurar para Responder
                </button>
            </div>
        </div>
    `;
    
    messageContent.innerHTML = messageHeader + messageBody + readOnlyNotice;
    
    // Scroll al último mensaje
    setTimeout(() => {
        const messageBody = document.querySelector('.message-body');
        if (messageBody) {
            messageBody.scrollTop = messageBody.scrollHeight;
        }
    }, 100);
}

/**
 * Actualiza el contador de mensajes archivados - NUEVA FUNCIÓN
 */
async function updateArchivedCounter() {
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/messages/archived`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const archivedCount = data.count || 0;
            
            // Actualizar badge en la pestaña de archivados
            const archivedTab = document.querySelector('[data-tab="archived"]');
            if (archivedTab) {
                const existingBadge = archivedTab.querySelector('.archived-count');
                if (existingBadge) {
                    existingBadge.remove();
                }
                
                if (archivedCount > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'archived-count';
                    badge.style.cssText = `
                        background: #28a745;
                        color: white;
                        border-radius: 10px;
                        padding: 2px 6px;
                        font-size: 10px;
                        font-weight: 600;
                        margin-left: 5px;
                    `;
                    badge.textContent = archivedCount;
                    archivedTab.appendChild(badge);
                }
            }
        }
    } catch (error) {
        console.error('Error al actualizar contador de archivados:', error);
    }
}

/**
 * Busca mensajes
 */
function searchMessages() {
    const searchInput = document.querySelector('.messages-search input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    console.log('🔍 Buscando mensajes:', searchTerm);
    
    if (!searchTerm) {
        // Mostrar todas las conversaciones
        renderConversationsList(messagesData);
        return;
    }
    
    // Filtrar conversaciones por término de búsqueda
    const filteredConversations = messagesData.filter(conv => {
        const clientInfo = conv.clienteInfo || {};
        const lastMessage = conv.ultimoMensaje || {};
        
        return (
            (clientInfo.nombre && clientInfo.nombre.toLowerCase().includes(searchTerm)) ||
            (clientInfo.apellidos && clientInfo.apellidos.toLowerCase().includes(searchTerm)) ||
            (clientInfo.correo && clientInfo.correo.toLowerCase().includes(searchTerm)) ||
            (lastMessage.mensaje && lastMessage.mensaje.toLowerCase().includes(searchTerm))
        );
    });
    
    renderConversationsList(filteredConversations);
    
    if (filteredConversations.length === 0 && typeof showToast === 'function') {
        showToast(`No se encontraron resultados para "${searchTerm}"`, 'info');
    }
}

/**
 * Actualizar la función filterMessagesByTab para manejar archivados
 */
function filterMessagesByTab(tabType) {
    console.log('🔄 Filtrando mensajes por pestaña:', tabType);
    
    switch (tabType) {
        case 'inbox':
            loadConversations();
            break;
        case 'sent':
            // TODO: Implementar mensajes enviados
            if (typeof showToast === 'function') {
                showToast('Funcionalidad de mensajes enviados próximamente', 'info');
            }
            break;
        case 'archived':
            loadArchivedConversations();
            break;
        default:
            loadConversations();
    }
}


/**
 * Muestra datos de ejemplo cuando falla la carga
 */
function showSampleConversationsData() {
    console.log('📋 Mostrando datos de ejemplo');
    
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;
    
    messagesList.innerHTML = `
        <div class="message-item unread" onclick="showSampleConversation()">
            <div class="message-sender">
                <div class="sender-avatar-placeholder">J</div>
                <div class="sender-info">
                    <h4>Juan Pérez</h4>
                    <p class="message-time">Hace 2 horas</p>
                </div>
                <span class="unread-badge">2</span>
            </div>
            <p class="message-subject">Consulta sobre proyecto web</p>
            <p class="message-preview">Hola, quisiera saber el estado de mi proyecto de desarrollo web...</p>
        </div>
        
        <div class="message-item" onclick="showSampleConversation()">
            <div class="message-sender">
                <div class="sender-avatar-placeholder">A</div>
                <div class="sender-info">
                    <h4>Ana González</h4>
                    <p class="message-time">Ayer</p>
                </div>
            </div>
            <p class="message-subject">Información sobre servicios</p>
            <p class="message-preview">Buenos días, me gustaría conocer más sobre sus servicios de marketing digital...</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-style: italic; border-top: 1px solid #333; margin-top: 20px;">
            Datos de ejemplo - Conecte con la API para ver mensajes reales
        </div>
    `;
}

/**
 * Muestra conversación de ejemplo
 */
function showSampleConversation() {
    const messageContent = document.querySelector('.message-content');
    if (!messageContent) return;
    
    messageContent.innerHTML = `
        <div class="message-header">
            <div class="message-details">
                <h3 class="message-content-subject">Consulta sobre proyecto web</h3>
                <div class="message-meta">
                    <p class="message-content-from">De: Juan Pérez &lt;juan.perez@email.com&gt;</p>
                    <p class="message-content-time">15 May 2025, 10:23 AM</p>
                </div>
            </div>
            <div class="message-actions">
                <button class="action-btn" title="Marcar como leído"><i class="fas fa-envelope-open"></i></button>
                <button class="action-btn" title="Archivar"><i class="fas fa-archive"></i></button>
                <button class="action-btn delete-btn" title="Eliminar"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        
        <div class="message-body conversation-view">
            <div class="message-bubble client-message">
                <div class="message-sender-name">Juan Pérez</div>
                <div class="message-text">Hola, quisiera saber el estado de mi proyecto de desarrollo web. ¿Podrían darme una actualización?</div>
                <div class="message-time">15 May 2025, 10:23 AM</div>
            </div>
            
            <div class="message-bubble admin-message">
                <div class="message-sender-name">Admin - Crazy Studios</div>
                <div class="message-text">Hola Juan, tu proyecto va muy bien. Actualmente estamos en la fase de desarrollo del frontend. Te enviaremos un preview esta semana.</div>
                <div class="message-time">15 May 2025, 2:45 PM</div>
            </div>
            
            <div class="message-bubble client-message">
                <div class="message-sender-name">Juan Pérez</div>
                <div class="message-text">Perfecto, muchas gracias por la actualización. Estaré atento al preview.</div>
                <div class="message-time">15 May 2025, 3:12 PM</div>
            </div>
        </div>
        
        <div class="reply-container">
            <div class="reply-header">
                <h4>Responder</h4>
            </div>
            <div class="reply-body">
                <textarea placeholder="Escribe tu respuesta aquí..." id="reply-textarea"></textarea>
                <div class="reply-actions">
                    <button class="secondary-btn" onclick="clearReply()">Descartar</button>
                    <button class="primary-btn" onclick="showToast('Funcionalidad disponible con API', 'info')">
                        <i class="fas fa-paper-plane"></i> Enviar Respuesta
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Funciones de utilidad
 */

/**
 * Formatea tiempo relativo (ej: "hace 2 horas")
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
    });
}

/**
 * Formatea fecha y hora completa
 */
function formatDateTime(date) {
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Trunca texto a una longitud específica
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Obtiene estadísticas de mensajes
 */
async function getMessagesStatistics() {
    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/messages/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
        
        return null;
        
    } catch (error) {
        console.error('Error al obtener estadísticas de mensajes:', error);
        return null;
    }
}

/**
 * Actualiza el contador de mensajes no leídos en el dashboard
 */
async function updateMessagesCounter() {
    const stats = await getMessagesStatistics();
    
    if (stats) {
        const messagesCount = document.getElementById('messages-count');
        if (messagesCount) {
            messagesCount.textContent = stats.totalNoLeidos || 0;
        }
        
        // Crear evento personalizado para notificar cambios
        const statsEvent = new CustomEvent('messagesStatsUpdated', {
            detail: stats
        });
        
        document.dispatchEvent(statsEvent);
    }
}

/**
 * Limpieza cuando se sale del módulo
 */
function cleanupMessagesModule() {
    console.log('🧹 Limpiando módulo de mensajes...');
    
    // Limpiar interval de polling
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
    
    // Limpiar variables globales
    currentConversation = null;
    currentConversationId = null;
    messagesData = [];
    filteredMessagesData = [];
}

/**
 * ✅ CONFIGURACIÓN DE EVENTOS DEL DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    // Configurar botones adicionales del header
    setupMessagesHeaderButtons();
    
    // Configurar FAB para móvil
    setupFloatingActionButton();
    
    // Configurar atajos de teclado
    setupKeyboardShortcuts();
    
    // Configurar notificaciones del navegador
    setupBrowserNotifications();
});

/**
 * Configura los botones del header de mensajes
 */
function setupMessagesHeaderButtons() {
    const refreshBtn = document.getElementById('refresh-messages-btn');
    const startConversationBtn = document.getElementById('start-new-conversation-btn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            this.disabled = true;
            
            loadConversations().finally(() => {
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
                    this.disabled = false;
                }, 500);
            });
        });
    }
    
    if (startConversationBtn) {
        startConversationBtn.addEventListener('click', function() {
            openNewMessageModal();
        });
    }
}

/**
 * Configura el Floating Action Button para móvil
 */
function setupFloatingActionButton() {
    const fabBtn = document.getElementById('fab-new-message');
    
    if (fabBtn) {
        fabBtn.addEventListener('click', function() {
            openNewMessageModal();
        });
        
        // Mostrar/ocultar según el scroll
        let lastScrollTop = 0;
        const messagesList = document.querySelector('.messages-list');
        
        if (messagesList) {
            messagesList.addEventListener('scroll', function() {
                const scrollTop = this.scrollTop;
                
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    // Scrolling down - hide FAB
                    fabBtn.style.transform = 'scale(0)';
                } else {
                    // Scrolling up - show FAB
                    fabBtn.style.transform = 'scale(1)';
                }
                
                lastScrollTop = scrollTop;
            });
        }
    }
}

/**
 * Configura atajos de teclado para mensajes
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Solo activar en la sección de mensajes
        const messagesSection = document.getElementById('messages');
        if (!messagesSection || !messagesSection.classList.contains('active')) {
            return;
        }
        
        // Ctrl/Cmd + N - Nuevo mensaje
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openNewMessageModal();
        }
        
        // Ctrl/Cmd + R - Actualizar
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            loadConversations();
        }
        
        // Escape - Cerrar modales
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                const closeBtn = activeModal.querySelector('.close-btn');
                if (closeBtn) {
                    closeBtn.click();
                }
            }
        }
        
        // Enter en textarea - Enviar mensaje (Ctrl/Cmd + Enter)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeTextarea = document.querySelector('textarea:focus');
            if (activeTextarea) {
                const form = activeTextarea.closest('form');
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"], .primary-btn');
                    if (submitBtn && !submitBtn.disabled) {
                        submitBtn.click();
                    }
                }
            }
        }
    });
}

/**
 * Configura notificaciones del navegador
 */
function setupBrowserNotifications() {
    // Solicitar permiso para notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

/**
 * Muestra notificación del navegador
 */
function showBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '../img/logo.png',
            badge: '../img/logo.png',
            tag: 'crazy-studios-message',
            requireInteraction: false,
            ...options
        });
        
        // Auto cerrar después de 5 segundos
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        return notification;
    }
}

/**
 * Maneja errores de conexión
 */
function handleConnectionError() {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
        const errorHTML = `
            <div class="error-state">
                <i class="fas fa-wifi-slash"></i>
                <h3>Error de Conexión</h3>
                <p>No se pudo conectar con el servidor. Verifica tu conexión a internet.</p>
                <button class="retry-btn" onclick="retryConnection()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
        messagesContainer.innerHTML = errorHTML;
    }
}

/**
 * Reintenta la conexión
 */
function retryConnection() {
    loadConversations();
}

/**
 * ✅ FUNCIONES PÚBLICAS PARA USO EXTERNO
 */

// Función para inicializar desde el dashboard principal
window.initMessagesModuleComplete = function() {
    console.log('🚀 Inicializando módulo completo de mensajes...');
    initMessagesModule();
};



// Función para abrir nuevo mensaje desde quick actions
window.openNewMessageFromQuickAction = function() {
    // Cambiar a la sección de mensajes primero
    if (typeof switchToSection === 'function') {
        switchToSection('messages');
    }
    
    // Luego abrir el modal
    setTimeout(() => {
        openNewMessageModal();
    }, 300);
};

// Funciones globales para botones
window.restoreConversation = restoreConversation;
window.loadArchivedConversations = loadArchivedConversations;
window.viewArchivedConversation = viewArchivedConversation;
window.loadArchivedConversationMessages = loadArchivedConversationMessages;
window.updateArchivedCounter = updateArchivedCounter;
window.selectConversation = selectConversation;
window.markConversationAsRead = markConversationAsRead;
window.archiveConversation = archiveConversation;
window.sendReply = sendReply;
window.clearReply = clearReply;
window.showSampleConversation = showSampleConversation;
window.showSampleConversationsData = showSampleConversationsData;
window.openNewMessageModal = openNewMessageModal;
window.loadConversations = loadConversations;
window.handleConnectionError = handleConnectionError;
window.retryConnection = retryConnection;
window.showBrowserNotification = showBrowserNotification;

// Inicialización automática cuando se carga la sección
document.addEventListener('DOMContentLoaded', function() {
    // Observar cambios en la sección de mensajes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const messagesSection = document.getElementById('messages');
                if (messagesSection && messagesSection.classList.contains('active')) {
                    setTimeout(() => {
                        initMessagesModule();
                    }, 100);
                }
            }
        });
    });
    
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
        observer.observe(messagesSection, { attributes: true });
        
        // También inicializar si la sección ya está activa
        if (messagesSection.classList.contains('active')) {
            setTimeout(() => {
                initMessagesModule();
            }, 100);
        }
    }
});

// Cleanup cuando se sale de la página
window.addEventListener('beforeunload', function() {
    cleanupMessagesModule();
});

console.log('✅ Módulo de mensajes cargado completamente');

/**
 * ✅ ESTILOS CSS ADICIONALES PARA EL MÓDULO DE MENSAJES
 */
const messagesStyles = document.createElement('style');
messagesStyles.textContent = `
    /* Estilos mejorados para el módulo de mensajes */
    
    .loading-spinner {
        border: 3px solid #333;
        border-top: 3px solid var(--primary-color, #007bff);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .sender-avatar-placeholder {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary-color, #007bff), #0056b3);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        flex-shrink: 0;
    }
    
    .message-bubble {
        margin-bottom: 15px;
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 80%;
    }
    
    .message-bubble.client-message {
        background-color: #2a2a2a;
        margin-left: 0;
        margin-right: auto;
        border-bottom-left-radius: 4px;
    }
    
    .message-bubble.admin-message {
        background: linear-gradient(135deg, var(--primary-color, #007bff), #0056b3);
        color: white;
        margin-left: auto;
        margin-right: 0;
        border-bottom-right-radius: 4px;
    }
    
    .message-sender-name {
        font-size: 12px;
        font-weight: 600;
        opacity: 0.8;
        margin-bottom: 5px;
    }
    
    .message-text {
        line-height: 1.4;
        word-wrap: break-word;
    }
    
    .message-time {
        font-size: 11px;
        opacity: 0.6;
        margin-top: 5px;
    }
    
    .error-state {
        text-align: center;
        padding: 40px 20px;
        color: #999;
    }
    
    .error-state i {
        font-size: 48px;
        color: #ff6b6b;
        margin-bottom: 16px;
    }
    
    .error-state h3 {
        color: #fff;
        margin-bottom: 10px;
    }
    
    .retry-btn {
        background: var(--primary-color, #007bff);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        margin: 10px 5px;
        transition: all 0.2s ease;
    }
    
    .retry-btn:hover {
        background: #0056b3;
        transform: translateY(-1px);
    }
    
    .loading-conversation {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        color: #999;
    }
    
    .unread-badge {
        background: var(--primary-color, #007bff);
        color: white;
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 600;
        min-width: 18px;
        text-align: center;
    }
    
    .message-item.unread {
        background-color: rgba(0, 123, 255, 0.1);
        border-left: 3px solid var(--primary-color, #007bff);
    }
    
    .message-item:hover {
        background-color: #2a2a2a;
        transform: translateX(2px);
        transition: all 0.2s ease;
    }
    
    .message-item.active {
        background-color: var(--primary-color, #007bff);
        color: white;
    }
    
    .message-item.active .message-time,
    .message-item.active .message-preview {
        color: rgba(255, 255, 255, 0.8);
    }
    
    .reply-container {
        border-top: 1px solid #333;
        padding: 20px;
        background-color: #1a1a1a;
    }
    
    .reply-body textarea {
        width: 100%;
        min-height: 80px;
        background-color: #2a2a2a;
        border: 1px solid #555;
        border-radius: 8px;
        padding: 12px;
        color: white;
        resize: vertical;
        font-family: inherit;
    }
    
    .reply-body textarea:focus {
        border-color: var(--primary-color, #007bff);
        outline: none;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
    }
    
    .reply-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 15px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .message-bubble {
            max-width: 95%;
        }
        
        .reply-actions {
            flex-direction: column;
        }
        
        .reply-actions button {
            width: 100%;
        }
    }
`;

document.head.appendChild(messagesStyles);