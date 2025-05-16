const express = require('express');
const projectController = require('../controllers/projectController');
const validation = require('../middleware/validation');
const { protect, authorize, checkProjectOwnership } = require('../middleware/auth');

const router = express.Router();

// Rutas protegidas - todos los usuarios autenticados pueden ver y crear
router.route('/')
    .get(protect, projectController.getProjects)
    .post(protect, validation.validateProject, projectController.createProject);

// Rutas protegidas - acceso propio o administradores
router.route('/:id')
    .get(protect, checkProjectOwnership, projectController.getProjectById)
    .put(protect, checkProjectOwnership, validation.validateProject, projectController.updateProject)
    .delete(protect, checkProjectOwnership, projectController.deleteProject);

// Ruta para obtener proyectos por cliente
router.get('/cliente/:clienteId', protect, authorize('admin', 'superadmin'), projectController.getProjects);

module.exports = router;