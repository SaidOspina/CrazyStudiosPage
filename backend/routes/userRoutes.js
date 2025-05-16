const express = require('express');
const userController = require('../controllers/userController');
const validation = require('../middleware/validation');
const { protect, authorize, checkUserOwnership } = require('../middleware/auth');

const router = express.Router();

// Rutas protegidas - solo administradores
router.route('/')
    .get(protect, authorize('admin', 'superadmin'), userController.getUsers)
    .post(protect, authorize('admin', 'superadmin'), validation.validateUser, userController.createUser);

// Rutas protegidas - acceso propio o administradores
router.route('/:id')
    .get(protect, checkUserOwnership, userController.getUserById)
    .put(protect, checkUserOwnership, validation.validateUser, userController.updateUser)
    .delete(protect, checkUserOwnership, userController.deleteUser);

module.exports = router;