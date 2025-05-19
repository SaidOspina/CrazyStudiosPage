const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:resetToken', authController.resetPassword);

// Rutas protegidas
router.get('/me', protect, authController.getCurrentUser);
router.put('/change-password', protect, authController.changePassword);

module.exports = router;