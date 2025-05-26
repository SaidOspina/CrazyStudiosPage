/**
 * MÓDULO DE MENSAJES PARA CLIENTES - DASHBOARD
 * Sistema de comunicación simplificado para clientes
 */

let clientMessagesData = [];
let clientConversationId = null;
let clientMessagePollingInterval = null;
let clientUnreadCount = 0;

/**
 * Inicializa el módulo de mensajes para clientes
 */
function initClientMessagesModule() {
    console.log('🔄 Inicializando módulo de mensajes para cliente...');
    
    // Configurar eventos
    setupClientMessagesEvents();
    
    // Cargar conversación del cliente
    loadClientConversation();
    
    // Configurar auto-actualización
    setupClientMessagePolling();
    
    // Actualizar contador en el sidebar
    updateClientMessagesCounter();
    
    console.log('✅ Módulo de mensajes para cliente inicializado');
}

/**
 * Configura los eventos del módulo de mensajes para clientes
 */
function setupClientMessagesEvents() {
    // Botón de nuevo mensaje en quick actions
    const sendMessageBtn = document.getElementById('send-message');
    const clientNewMessageBtn = document.getElementById('client-new-message-btn');
    const startConversationBtn = document.getElementById('start-client-conversation-btn');
    const refreshMessagesBtn = document.getElementById('client-refresh-messages-btn');
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', openClientMessageModal);
    }
    
    if (clientNewMessageBtn) {
        clientNewMessageBtn.addEventListener('click', openClientMessageModal);
    }
    
    if (startConversationBtn) {
        startConversationBtn.addEventListener('click', openClientMessageModal);
    }
    
    if (refreshMessagesBtn) {
        refreshMessagesBtn.addEventListener('click', refreshClientMessages);
    }
    
    // Configurar formulario de respuesta
    setupClientReplyForm();
}

/**
 * Configura el polling automático para actualizar mensajes
 */
function setupClientMessagePolling() {
    // Limpiar intervalo existente
    if (clientMessagePollingInterval) {
        clearInterval(clientMessagePollingInterval);
    }
    
    // Configurar nuevo intervalo (cada 30 segundos)
    clientMessagePollingInterval = setInterval(() => {
        if (clientConversationId) {
            console.log('🔄 Actualizando mensajes automáticamente...');
            loadClientMessages(clientConversationId);
        }
    }, 30000);
    
    console.log('🔄 Polling de mensajes para cliente configurado (30s)');
}

/**
 * Actualiza manualmente los mensajes del cliente
 */
async function refreshClientMessages() {
    const refreshBtn = document.getElementById('client-refresh-messages-btn');
    
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
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
            }, 1000);
        }
    }
}

/**
 * Hace scroll al último mensaje
 */
function scrollToLastMessage() {
    const messagesBody = document.getElementById('client-messages-body');
    if (messagesBody) {
        messagesBody.scrollTop = messagesBody.scrollHeight;
    }
}

/**
 * Formatea el tiempo del mensaje
 */
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

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Obtiene la base URL de la API
 */
function getApiBase() {
    return window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : '';
}

/**
 * Obtiene el usuario actual
 */
function getCurrentUser() {
    return window.currentUser || JSON.parse(localStorage.getItem('userData') || '{}');
}

/**
 * Limpia el módulo de mensajes del cliente
 */
function cleanupClientMessagesModule() {
    console.log('🧹 Limpiando módulo de mensajes del cliente...');
    
    // Limpiar interval de polling
    if (clientMessagePollingInterval) {
        clearInterval(clientMessagePollingInterval);
        clientMessagePollingInterval = null;
    }
    
    // Limpiar variables globales
    clientMessagesData = [];
    clientConversationId = null;
    clientUnreadCount = 0;
}

/**
 * Muestra notificación de nuevo mensaje (si hay notificaciones del navegador)
 */
function showClientMessageNotification(message) {
    // Verificar si hay notificaciones habilitadas
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Nuevo mensaje de Crazy Studios', {
            body: message.mensaje.substring(0, 100) + (message.mensaje.length > 100 ? '...' : ''),
            icon: '../img/logo.png',
            badge: '../img/logo.png',
            tag: 'crazy-studios-message',
            requireInteraction: false
        });
        
        // Auto cerrar después de 5 segundos
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        // Evento click para abrir la conversación
        notification.onclick = function() {
            window.focus();
            if (typeof switchToSection === 'function') {
                switchToSection('messages');
            }
            notification.close();
        };
    }
}

/**
 * Inicialización automática cuando se activa la sección de mensajes
 */
function initClientMessagesOnSectionChange() {
    const messagesSection = document.getElementById('messages');
    if (messagesSection && messagesSection.classList.contains('active')) {
        // Inicializar módulo si no está inicializado
        if (!clientMessagePollingInterval) {
            setTimeout(() => {
                initClientMessagesModule();
            }, 100);
        }
    } else {
        // Limpiar módulo si se sale de la sección
        cleanupClientMessagesModule();
    }
}

/**
 * Marca todos los mensajes como leídos cuando se abre la sección
 */
async function markClientMessagesAsRead() {
    if (!clientConversationId) return;
    
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
            
            // Recargar mensajes para actualizar estado visual
            await loadClientMessages(clientConversationId);
        }
        
    } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
    }
}

/**
 * Exporta la conversación del cliente (función simple)
 */
function exportClientConversation() {
    if (clientMessagesData.length === 0) {
        showToast('No hay mensajes para exportar', 'warning');
        return;
    }
    
    const currentUser = getCurrentUser();
    const exportData = {
        cliente: {
            nombre: currentUser.nombre,
            apellidos: currentUser.apellidos,
            correo: currentUser.correo
        },
        totalMensajes: clientMessagesData.length,
        fechaExportacion: new Date().toISOString(),
        mensajes: clientMessagesData.map(msg => ({
            remitente: msg.esDeAdmin ? 'Crazy Studios' : 'Cliente',
            fecha: msg.fechaCreacion,
            mensaje: msg.mensaje,
            leido: msg.leido
        }))
    };
    
    // Crear blob y descargar
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversacion_crazystudios_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Conversación exportada correctamente', 'success');
}

/**
 * Función para solicitar permiso de notificaciones
 */
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notificaciones habilitadas', 'success');
            }
        });
    }
}

/**
 * FUNCIONES PÚBLICAS PARA INTEGRACIÓN CON EL DASHBOARD
 */

// Función para inicializar desde el dashboard principal
window.initClientMessagesModule = initClientMessagesModule;

// Función para abrir nuevo mensaje desde quick actions
window.openClientMessageModal = openClientMessageModal;

// Función para actualizar contador de mensajes
window.updateClientMessagesCounter = updateClientMessagesCounter;

// Función para limpiar el módulo
window.cleanupClientMessagesModule = cleanupClientMessagesModule;

// Función para marcar mensajes como leídos
window.markClientMessagesAsRead = markClientMessagesAsRead;

// Función para exportar conversación
window.exportClientConversation = exportClientConversation;

// Función para solicitar permisos de notificación
window.requestNotificationPermission = requestNotificationPermission;

/**
 * INTEGRACIÓN CON EL DASHBOARD PRINCIPAL
 */

// Observar cambios en la sección activa
document.addEventListener('DOMContentLoaded', function() {
    // Configurar observer para cambios de sección
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const messagesSection = document.getElementById('messages');
                if (messagesSection && mutation.target === messagesSection) {
                    initClientMessagesOnSectionChange();
                    
                    // Marcar como leídos cuando se abre la sección
                    if (messagesSection.classList.contains('active')) {
                        setTimeout(() => {
                            markClientMessagesAsRead();
                        }, 1000);
                    }
                }
            }
        });
    });
    
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
        observer.observe(messagesSection, { attributes: true });
        
        // Inicializar si la sección ya está activa
        if (messagesSection.classList.contains('active')) {
            setTimeout(() => {
                initClientMessagesModule();
                markClientMessagesAsRead();
            }, 500);
        }
    }
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', function() {
    cleanupClientMessagesModule();
});

/**
 * ESTILOS CSS ESPECÍFICOS PARA EL MÓDULO DE CLIENTE
 */
const clientMessagesStyles = document.createElement('style');
clientMessagesStyles.textContent = `
    /* Estilos específicos para mensajes de cliente */
    
    .client-messages-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--dark-bg, #1a1a1a);
        border-radius: 12px;
        overflow: hidden;
    }
    
    .client-conversation-header {
        background: linear-gradient(135deg, var(--primary-color, #007bff), #0056b3);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .conversation-title h3 {
        margin: 0 0 5px 0;
        font-size: 18px;
        font-weight: 600;
    }
    
    .conversation-subtitle {
        margin: 0;
        opacity: 0.8;
        font-size: 14px;
    }
    
    .conversation-actions button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .conversation-actions button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }
    
    .client-messages-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background: var(--dark-bg, #1a1a1a);
        max-height: 400px;
    }
    
    .client-message-bubble {
        margin-bottom: 20px;
        padding: 16px;
        border-radius: 12px;
        position: relative;
        animation: fadeInUp 0.3s ease;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .client-message-bubble.client-message {
        background: linear-gradient(135deg, #2a2a2a, #333);
        margin-right: 80px;
        border-bottom-left-radius: 4px;
    }
    
    .client-message-bubble.admin-message {
        background: linear-gradient(135deg, var(--primary-color, #007bff), #0056b3);
        color: white;
        margin-left: 80px;
        border-bottom-right-radius: 4px;
    }
    
    .client-message-bubble.unread {
        border-left: 4px solid #28a745;
        background: linear-gradient(135deg, var(--primary-color, #007bff), #0056b3);
        color: white;
        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
    }
    
    .message-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
    }
    
    .message-sender {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .sender-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
    }
    
    .sender-avatar.admin-avatar {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }
    
    .sender-avatar.client-avatar {
        background: var(--primary-color, #007bff);
        color: white;
    }
    
    .sender-info {
        display: flex;
        flex-direction: column;
    }
    
    .sender-name {
        font-weight: 600;
        font-size: 14px;
    }
    
    .sender-role {
        font-size: 11px;
        opacity: 0.7;
        margin-top: 2px;
    }
    
    .message-time {
        font-size: 11px;
        opacity: 0.6;
        white-space: nowrap;
    }
    
    .message-content {
        margin-top: 8px;
    }
    
    .message-text {
        line-height: 1.5;
        word-wrap: break-word;
        white-space: pre-wrap;
    }
    
    .unread-indicator {
        position: absolute;
        top: -8px;
        right: 12px;
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .unread-indicator i {
        font-size: 6px;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
    
    .client-reply-container {
        background: #2a2a2a;
        border-top: 1px solid #444;
        padding: 20px;
    }
    
    .reply-header {
        margin-bottom: 15px;
    }
    
    .reply-header h4 {
        margin: 0;
        color: white;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .message-input-container {
        margin-bottom: 15px;
    }
    
    .message-input-container textarea {
        width: 100%;
        min-height: 100px;
        background: #1a1a1a;
        border: 2px solid #444;
        border-radius: 8px;
        padding: 12px;
        color: white;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.5;
        resize: vertical;
        transition: all 0.2s ease;
    }
    
    .message-input-container textarea:focus {
        border-color: var(--primary-color, #007bff);
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
    
    .message-input-container textarea::placeholder {
        color: #999;
        line-height: 1.5;
    }
    
    .attachment-section {
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .attachment-btn {
        background: none;
        border: 2px dashed #666;
        color: #999;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        width: fit-content;
    }
    
    .attachment-btn:hover {
        border-color: var(--primary-color, #007bff);
        color: var(--primary-color, #007bff);
        background: rgba(0, 123, 255, 0.05);
    }
    
    .attachment-info {
        color: #999;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .reply-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }
    
    .reply-actions button {
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .reply-actions .secondary-btn {
        background: transparent;
        border: 2px solid #666;
        color: #999;
    }
    
    .reply-actions .secondary-btn:hover {
        border-color: #999;
        color: white;
    }
    
    .reply-actions .primary-btn {
        background: linear-gradient(135deg, var(--primary-color, #007bff), #0056b3);
        border: none;
        color: white;
        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
    }
    
    .reply-actions .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
    }
    
    .reply-actions .primary-btn:disabled {
        opacity: 0.6;
        transform: none;
        cursor: not-allowed;
    }
    
    /* No conversation state */
    .no-conversation {
        text-align: center;
        padding: 60px 40px;
        color: #999;
    }
    
    .no-conversation-icon {
        font-size: 64px;
        color: var(--primary-color, #007bff);
        margin-bottom: 24px;
        opacity: 0.8;
    }
    
    .no-conversation h3 {
        color: white;
        margin: 0 0 16px 0;
        font-size: 24px;
    }
    
    .no-conversation p {
        margin: 0 0 12px 0;
        line-height: 1.6;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .help-text {
        background: linear-gradient(135deg, #2a2a2a, #333);
        padding: 16px;
        border-radius: 8px;
        margin: 24px 0;
        border-left: 4px solid var(--primary-color, #007bff);
    }
    
    .conversation-suggestions {
        background: #2a2a2a;
        padding: 24px;
        border-radius: 12px;
        margin: 32px 0;
        text-align: left;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .conversation-suggestions h4 {
        color: white;
        margin: 0 0 16px 0;
        font-size: 16px;
    }
    
    .conversation-suggestions ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .conversation-suggestions li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        color: #ccc;
    }
    
    .conversation-suggestions li i {
        color: var(--primary-color, #007bff);
        width: 16px;
    }
    
    .large-btn {
        padding: 16px 32px;
        font-size: 16px;
        margin-top: 24px;
    }
    
    /* Error state */
    .client-error-state {
        text-align: center;
        padding: 60px 40px;
        color: #999;
    }
    
    .error-icon {
        font-size: 64px;
        color: #ff6b6b;
        margin-bottom: 24px;
    }
    
    .client-error-state h3 {
        color: white;
        margin: 0 0 16px 0;
    }
    
    .error-message {
        color: #ff6b6b;
        margin: 0 0 24px 0;
        font-style: italic;
    }
    
    .error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    /* Loading states */
    .loading-messages {
        text-align: center;
        padding: 60px 40px;
        color: #999;
    }
    
    .loading-spinner {
        border: 3px solid #333;
        border-top: 3px solid var(--primary-color, #007bff);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Modal styles */
    .client-message-form .form-group {
        margin-bottom: 20px;
    }
    
    .client-message-form label {
        display: block;
        margin-bottom: 8px;
        color: white;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .client-message-form input,
    .client-message-form textarea {
        width: 100%;
        background: #2a2a2a;
        border: 2px solid #444;
        border-radius: 8px;
        padding: 12px;
        color: white;
        font-family: inherit;
        transition: all 0.2s ease;
    }
    
    .client-message-form input:focus,
    .client-message-form textarea:focus {
        border-color: var(--primary-color, #007bff);
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
    
    .form-help {
        display: block;
        margin-top: 5px;
        color: #999;
        font-size: 12px;
    }
    
    .message-templates {
        margin: 24px 0;
        padding: 20px;
        background: #2a2a2a;
        border-radius: 8px;
    }
    
    .message-templates label {
        margin-bottom: 12px;
    }
    
    .template-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 8px;
    }
    
    .template-btn {
        background: #1a1a1a;
        border: 2px solid #444;
        color: #ccc;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
    }
    
    .template-btn:hover {
        border-color: var(--primary-color, #007bff);
        color: var(--primary-color, #007bff);
        background: rgba(0, 123, 255, 0.05);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .client-conversation-header {
            flex-direction: column;
            gap: 10px;
            text-align: center;
        }
        
        .client-message-bubble.client-message {
            margin-right: 20px;
        }
        
        .client-message-bubble.admin-message {
            margin-left: 20px;
        }
        
        .reply-actions {
            flex-direction: column;
        }
        
        .reply-actions button {
            width: 100%;
            justify-content: center;
        }
        
        .template-buttons {
            grid-template-columns: 1fr;
        }
        
        .error-actions {
            flex-direction: column;
            align-items: center;
        }
        
        .error-actions button {
            width: 100%;
            max-width: 200px;
        }
    }
    
    /* Sidebar unread badge */
    .unread-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        font-size: 10px;
        font-weight: 600;
        animation: pulse 2s infinite;
    }
`;

document.head.appendChild(clientMessagesStyles);

console.log('✅ Módulo de mensajes para cliente cargado completamente');
function setupClientReplyForm() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('#client-send-message-btn')) {
            e.preventDefault();
            sendClientMessage();
        }
        
        if (e.target.matches('#client-clear-message-btn')) {
            e.preventDefault();
            clearClientMessageForm();
        }
    });
    
    // Auto-resize del textarea
    document.addEventListener('input', function(e) {
        if (e.target.matches('#client-message-textarea')) {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        }
    });
    
    // Envío con Ctrl+Enter
    document.addEventListener('keydown', function(e) {
        if (e.target.matches('#client-message-textarea')) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                sendClientMessage();
            }
        }
    });
}

/**
 * Carga la conversación del cliente actual
 */
async function loadClientConversation() {
    console.log('📨 Cargando conversación del cliente...');
    
    const messagesContainer = document.querySelector('#messages .messages-container');
    if (!messagesContainer) {
        console.warn('Contenedor de mensajes no encontrado');
        return;
    }
    
    // Mostrar loading
    messagesContainer.innerHTML = `
        <div class="loading-messages">
            <div class="loading-spinner"></div>
            <p>Cargando mensajes...</p>
        </div>
    `;
    
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
    }
}

/**
 * Carga los mensajes de la conversación del cliente
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
                
                <div class="attachment-section">
                    <input type="file" id="client-message-attachment" multiple style="display: none;">
                    <button type="button" class="attachment-btn" onclick="document.getElementById('client-message-attachment').click()">
                        <i class="fas fa-paperclip"></i> Adjuntar archivo
                    </button>
                    <div class="attachment-info">
                        <small><i class="fas fa-info-circle"></i> Máximo 5MB por archivo</small>
                    </div>
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
    
    // Configurar nuevos eventos
    setupClientMessagesEvents();
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
        showToast('Error: Elementos del formulario no encontrados', 'error');
        return;
    }
    
    const mensaje = textarea.value.trim();
    
    if (!mensaje) {
        showToast('Por favor escribe un mensaje', 'warning');
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
        await loadClientConversation();
        
        showToast('Mensaje enviado correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje del cliente:', error);
        showToast(error.message || 'Error al enviar mensaje', 'error');
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
    
    showToast('Formulario limpiado', 'info');
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
                        
                        <div class="form-group">
                            <label for="client-modal-attachment">
                                <i class="fas fa-paperclip"></i> Adjuntos (opcional)
                            </label>
                            <input type="file" id="client-modal-attachment" multiple>
                            <small class="form-help">
                                <i class="fas fa-info-circle"></i> 
                                Máximo 5MB por archivo. Formatos: PDF, imágenes, documentos
                            </small>
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
                        <button type="button" class="secondary-btn" id="save-client-draft-btn">
                            <i class="fas fa-save"></i> Guardar Borrador
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
    const sendBtn = document.getElementById('send-client-modal-message-btn');
    const saveDraftBtn = document.getElementById('save-client-draft-btn');
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
    
    // Guardar borrador
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function() {
            saveClientDraft();
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
        showToast('Error: Elementos del formulario no encontrados', 'error');
        return;
    }
    
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!subject || !message) {
        showToast('Por favor completa el asunto y el mensaje', 'warning');
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
            adjuntos: [] // TODO: Implementar adjuntos
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
        
        showToast('Mensaje enviado correctamente', 'success');
        
        // Recargar conversación
        await loadClientConversation();
        
        // Cambiar a la sección de mensajes si no está activa
        if (typeof switchToClientSection === 'function') {
            switchToClientSection('messages');
        }
        
        closeModal();
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje desde modal:', error);
        showToast(error.message || 'Error al enviar mensaje', 'error');
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
        
        showToast('Plantilla aplicada. Puedes editarla antes de enviar.', 'info');
    }
}

/**
 * Guarda un borrador del mensaje del cliente
 */
function saveClientDraft() {
    const subject = document.getElementById('client-modal-subject')?.value.trim() || '';
    const message = document.getElementById('client-modal-message')?.value.trim() || '';
    
    if (!subject && !message) {
        showToast('No hay contenido para guardar', 'warning');
        return;
    }
    
    const draft = {
        subject,
        message,
        timestamp: new Date().toISOString(),
        type: 'client-message'
    };
    
    // Guardar en localStorage
    const drafts = JSON.parse(localStorage.getItem('clientMessageDrafts') || '[]');
    drafts.push(draft);
    
    // Mantener solo los últimos 5 borradores
    if (drafts.length > 5) {
        drafts.splice(0, drafts.length - 5);
    }
    
    localStorage.setItem('clientMessageDrafts', JSON.stringify(drafts));
    showToast('Borrador guardado correctamente', 'success');
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
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando integración de mensajes en dashboard...');
    
    // Configurar observer para la sección de mensajes
    const messagesSection = document.getElementById('messages');
    if (messagesSection) {
        // Observer para detectar cuando se activa la sección
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (messagesSection.classList.contains('active')) {
                        console.log('📨 Sección de mensajes activada');
                        
                        // Inicializar módulo de mensajes después de un breve delay
                        setTimeout(() => {
                            if (typeof initClientMessagesModule === 'function') {
                                initClientMessagesModule();
                                
                                // Marcar mensajes como leídos después de 2 segundos
                                setTimeout(() => {
                                    if (typeof markClientMessagesAsRead === 'function') {
                                        markClientMessagesAsRead();
                                    }
                                }, 2000);
                            }
                        }, 200);
                    } else {
                        // Limpiar cuando se sale de la sección
                        if (typeof cleanupClientMessagesModule === 'function') {
                            cleanupClientMessagesModule();
                        }
                    }
                }
            });
        });
        
        observer.observe(messagesSection, { attributes: true });
        
        // Si la sección ya está activa al cargar
        if (messagesSection.classList.contains('active')) {
            setTimeout(() => {
                if (typeof initClientMessagesModule === 'function') {
                    initClientMessagesModule();
                }
            }, 500);
        }
    }
    
    // Configurar click en la tarjeta de mensajes del overview
    const messagesStatCard = document.getElementById('messages-stat-card');
    if (messagesStatCard) {
        messagesStatCard.addEventListener('click', function() {
            switchToSection('messages');
        });
        
        // Agregar cursor pointer
        messagesStatCard.style.cursor = 'pointer';
    }
    
    // Configurar tooltips para botones de mensajes
    const tooltipElements = document.querySelectorAll('[title]');
    tooltipElements.forEach(element => {
        if (element.id.includes('message') || element.closest('#messages')) {
            element.addEventListener('mouseenter', function() {
                this.style.position = 'relative';
            });
        }
    });
    
    // Configurar atajos de teclado globales para mensajes
    document.addEventListener('keydown', function(e) {
        // Alt + M para ir a mensajes
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            switchToSection('messages');
        }
        
        // Alt + N para nuevo mensaje (si está en la sección de mensajes)
        const messagesSection = document.getElementById('messages');
        if (e.altKey && e.key === 'n' && messagesSection && messagesSection.classList.contains('active')) {
            e.preventDefault();
            if (typeof openClientMessageModal === 'function') {
                openClientMessageModal();
            }
        }
    });
    
    console.log('✅ Integración de mensajes configurada');
    console.log('💡 Atajos: Alt+M (ir a mensajes), Alt+N (nuevo mensaje)');
});

// Función para actualizar el estado visual de la tarjeta de mensajes
function updateMessagesCardState(unreadCount) {
    const messagesCard = document.getElementById('messages-stat-card');
    const messagesCountElement = document.getElementById('client-messages-count');
    
    if (messagesCard && messagesCountElement) {
        messagesCountElement.textContent = unreadCount || 0;
        
        if (unreadCount > 0) {
            messagesCard.classList.add('has-unread');
            messagesCard.title = `Tienes ${unreadCount} mensaje${unreadCount !== 1 ? 's' : ''} sin leer`;
        } else {
            messagesCard.classList.remove('has-unread');
            messagesCard.title = 'No tienes mensajes sin leer';
        }
    }
}

// Escuchar eventos personalizados de actualización de mensajes
document.addEventListener('messagesStatsUpdated', function(event) {
    const stats = event.detail;
    if (stats && typeof stats.totalNoLeidos !== 'undefined') {
        updateMessagesCardState(stats.totalNoLeidos);
    }
});

// Función para mostrar indicador de nuevo mensaje
function showNewMessageIndicator() {
    const messagesMenuItem = document.querySelector('[data-section="messages"]');
    if (messagesMenuItem && !messagesMenuItem.querySelector('.new-message-pulse')) {
        const pulseIndicator = document.createElement('div');
        pulseIndicator.className = 'new-message-pulse';
        pulseIndicator.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 8px;
            height: 8px;
            background: #ff4757;
            border-radius: 50%;
            animation: pulse 2s infinite;
        `;
        messagesMenuItem.style.position = 'relative';
        messagesMenuItem.appendChild(pulseIndicator);
        
        // Remover después de 10 segundos
        setTimeout(() => {
            if (pulseIndicator.parentNode) {
                pulseIndicator.remove();
            }
        }, 10000);
    }
}

// Exponer funciones globalmente para uso desde otros módulos
// Exponer funciones globalmente
window.loadClientConversation = loadClientConversation;
window.loadClientMessages = loadClientMessages;
window.sendClientMessage = sendClientMessage;
window.clearClientMessageForm = clearClientMessageForm;
window.openClientMessageModal = openClientMessageModal;
window.applyClientMessageTemplate = applyClientMessageTemplate;
window.saveClientDraft = saveClientDraft;
window.updateMessagesCardState = updateMessagesCardState;
window.showNewMessageIndicator = showNewMessageIndicator;