// backend/routes/notificationRoutes.js

const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

/**
 * POST /api/notifications/project-request
 * Envía notificaciones por correo cuando un cliente solicita un proyecto
 */
router.post('/project-request', notificationController.sendProjectRequestNotification);

module.exports = router;

// backend/app.js - Agregar esta línea en las rutas
// app.use('/api/notifications', require('./routes/notificationRoutes'));