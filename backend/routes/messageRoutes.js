/**
 * ARCHIVO: backend/routes/messageRoutes.js
 * Rutas para el módulo de mensajes
 */

const express = require('express');
const messageController = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Rutas protegidas - todos los usuarios autenticados
router.get('/conversations', protect, messageController.getConversations);
router.get('/messages/:clienteId', protect, messageController.getMessages);
router.post('/send', protect, messageController.sendMessage);
router.put('/mark-read/:clienteId', protect, messageController.markMessagesAsRead);

// Rutas solo para administradores
router.get('/stats', protect, authorize('admin', 'superadmin'), messageController.getMessageStats);

module.exports = router;