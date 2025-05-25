/**
 * RUTAS DE MENSAJES ACTUALIZADAS
 * Sistema completo de comunicación con todas las funcionalidades
 */

const express = require('express');
const messageController = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Rutas protegidas - todos los usuarios autenticados

/**
 * GET /api/messages/conversations
 * Obtiene todas las conversaciones (admin) o la conversación del usuario (cliente)
 */
router.get('/conversations', protect, messageController.getConversations);

/**
 * GET /api/messages/messages/:clienteId
 * Obtiene los mensajes de una conversación específica
 */
router.get('/messages/:clienteId', protect, messageController.getMessages);

/**
 * POST /api/messages/send
 * Envía un nuevo mensaje
 */
router.post('/send', protect, messageController.sendMessage);

/**
 * PUT /api/messages/mark-read/:clienteId
 * Marca mensajes como leídos
 */
router.put('/mark-read/:clienteId', protect, messageController.markMessagesAsRead);

/**
 * GET /api/messages/search
 * Busca mensajes por término
 */
router.get('/search', protect, messageController.searchMessages);

/**
 * GET /api/messages/history
 * Obtiene historial de mensajes con filtros avanzados
 */
router.get('/history', protect, messageController.getMessageHistory);

// Rutas solo para administradores

/**
 * GET /api/messages/stats
 * Obtiene estadísticas de mensajes (solo admins)
 */
router.get('/stats', protect, authorize('admin', 'superadmin'), messageController.getMessageStats);

/**
 * GET /api/messages/archived
 * Obtiene conversaciones archivadas (solo admins)
 */
router.get('/archived', protect, authorize('admin', 'superadmin'), messageController.getArchivedConversations);

/**
 * DELETE /api/messages/message/:messageId
 * Elimina un mensaje específico (solo admins)
 */
router.delete('/message/:messageId', protect, authorize('admin', 'superadmin'), messageController.deleteMessage);

/**
 * DELETE /api/messages/conversation/:clienteId
 * Elimina una conversación completa (solo admins)
 */
router.delete('/conversation/:clienteId', protect, authorize('admin', 'superadmin'), messageController.deleteConversation);

/**
 * GET /api/messages/export/:clienteId
 * Exporta mensajes de una conversación (solo admins)
 * Query params: format=json|csv
 */
router.get('/export/:clienteId', protect, authorize('admin', 'superadmin'), messageController.exportConversation);

module.exports = router;