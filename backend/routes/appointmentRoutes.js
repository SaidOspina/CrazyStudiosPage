const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const validation = require('../middleware/validation');
const { protect, authorize, checkAppointmentOwnership } = require('../middleware/auth');

const router = express.Router();

// Rutas protegidas - todos los usuarios autenticados pueden ver y crear
router.route('/')
    .get(protect, appointmentController.getAppointments)
    .post(protect, validation.validateAppointment, appointmentController.createAppointment);

// Ruta pública para crear citas (invitados)
router.post('/guest', validation.validateAppointment, appointmentController.createAppointment);

// Rutas protegidas - acceso propio o administradores
router.route('/:id')
    .get(protect, checkAppointmentOwnership, appointmentController.getAppointmentById)
    .put(protect, checkAppointmentOwnership, validation.validateAppointment, appointmentController.updateAppointment)
    .delete(protect, checkAppointmentOwnership, appointmentController.deleteAppointment);

// Ruta para obtener citas por usuario
router.get('/usuario/:usuarioId', protect, authorize('admin', 'superadmin'), appointmentController.getAppointments);

// Ruta para obtener citas por proyecto
router.get('/proyecto/:proyectoId', protect, appointmentController.getAppointments);

// Ruta para obtener citas por fecha
router.get('/fecha/:fecha', protect, authorize('admin', 'superadmin'), appointmentController.getAppointments);

module.exports = router;