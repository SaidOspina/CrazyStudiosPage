/**
 * MÓDULO DE MENSAJES - SISTEMA COMPLETO DE COMUNICACIÓN
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
    
    // Cargar lista de conversaciones
    loadConversationsList();
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
 * Carga la lista de conversaciones
 */
async function loadConversations() {
    console.log('📨 Cargando conversaciones...');
    
    try {
        const token = localStorage.getItem('authToken');
        const currentUser = window.currentUser || JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }
        
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        
        const response = await fetch(`${API_BASE}/api/messages/conversations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar conversaciones');
        }
        
        const data = await response.json();
        console.log('✅ Conversaciones cargadas:', data);
        
        messagesData = data.data || [];
        
        if (currentUser.rol === 'admin' || currentUser.rol === 'superadmin') {
            renderConversationsList(messagesData);
        } else {
            // Para clientes, cargar directamente su conversación
            if (messagesData.length > 0) {
                selectConversation(messagesData[0]._id);
            }
        }
        
    } catch (error) {
        console.error('❌ Error al cargar conversaciones:', error);
        showToast('Error al cargar conversaciones', 'error');
        showSampleConversationsData();
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
                    <img src="/api/placeholder/40/40" alt="User Avatar" class="sender-avatar">
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
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar mensajes');
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
        showToast('Error al cargar mensajes', 'error');
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
                <button class="action-btn delete-btn" title="Eliminar conversación" onclick="deleteConversation('${conversationId}')">
                    <i class="fas fa-trash"></i>
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
                <div class="attachment-input">
                    <input type="file" id="message-attachment" multiple style="display: none;">
                    <button type="button" class="attachment-btn" onclick="document.getElementById('message-attachment').click()">
                        <i class="fas fa-paperclip"></i> Adjuntar archivo
                    </button>
                </div>
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
        showToast('Error: No se encontró el campo de mensaje', 'error');
        return;
    }
    
    const mensaje = textarea.value.trim();
    
    if (!mensaje) {
        showToast('Por favor escribe un mensaje', 'warning');
        textarea.focus();
        return;
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
        
        showToast('Mensaje enviado correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        showToast(error.message || 'Error al enviar mensaje', 'error');
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
        showToast('Error al cargar lista de clientes', 'error');
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
        
        showToast('Mensaje enviado correctamente', 'success');
        
        // Recargar conversaciones
        await loadConversations();
        
        // Cerrar modal
        closeModal();
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        showToast(error.message || 'Error al enviar mensaje', 'error');
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}